import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";
import {
  EAS_CONTRACT_ADDRESS,
  getPredictionSchemaUid,
  getReputationSchemaUid,
} from "@/app/config/eas";
import { getEasConfig } from "@/app/config/env";
import { BASE_SEPOLIA_RPC_URL } from "@/app/config/chains";

/**
 * Create an EAS instance connected to a funded wallet signer.
 */
function createEasClient(): { eas: EAS; signer: ethers.Wallet } {
  const { EAS_PRIVATE_KEY } = getEasConfig();
  const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL);
  const signer = new ethers.Wallet(EAS_PRIVATE_KEY, provider);

  const eas = new EAS(EAS_CONTRACT_ADDRESS);
  eas.connect(signer);

  return { eas, signer };
}

// -- Prediction Outcome Schema --
const PREDICTION_SCHEMA =
  "bytes32 predictionId,address tastemaker,bool predictedYes,bool outcomeYes,uint64 streamThreshold,uint64 scDelta,uint64 resolvedAt";

// -- Reputation Snapshot Schema --
const REPUTATION_SCHEMA =
  "address tastemaker,uint64 reputationScore,uint32 totalPredictions,uint64 snapshotAt";

/**
 * Writes a prediction outcome attestation onchain via EAS.
 * Returns the attestation UID.
 */
export async function attestPredictionOutcome(params: {
  predictionId: string;
  tastemakerAddress: string;
  predictedYes: boolean;
  outcomeYes: boolean;
  streamThreshold: bigint;
  scDelta: bigint;
}): Promise<string> {
  const { eas } = createEasClient();
  const schemaUid = getPredictionSchemaUid();

  const encoder = new SchemaEncoder(PREDICTION_SCHEMA);
  const now = BigInt(Math.floor(Date.now() / 1000));

  // Hash the prediction UUID to get a canonical bytes32 value
  const predictionIdBytes = ethers.keccak256(
    ethers.toUtf8Bytes(params.predictionId)
  );

  const encodedData = encoder.encodeData([
    { name: "predictionId", value: predictionIdBytes, type: "bytes32" },
    { name: "tastemaker", value: params.tastemakerAddress, type: "address" },
    { name: "predictedYes", value: params.predictedYes, type: "bool" },
    { name: "outcomeYes", value: params.outcomeYes, type: "bool" },
    {
      name: "streamThreshold",
      value: params.streamThreshold,
      type: "uint64",
    },
    { name: "scDelta", value: params.scDelta, type: "uint64" },
    { name: "resolvedAt", value: now, type: "uint64" },
  ]);

  const tx = await eas.attest({
    schema: schemaUid,
    data: {
      recipient: params.tastemakerAddress,
      data: encodedData,
      revocable: false,
      expirationTime: BigInt(0),
    },
  });

  const uid = await tx.wait();
  return uid;
}

/**
 * Writes a reputation snapshot attestation onchain via EAS.
 * Converts reputationScore (0.0-1.0) to basis points (0-10000).
 * Returns the attestation UID.
 */
export async function attestReputationSnapshot(params: {
  tastemakerAddress: string;
  reputationScore: number;
  totalPredictions: number;
}): Promise<string> {
  const { eas } = createEasClient();
  const schemaUid = getReputationSchemaUid();

  const encoder = new SchemaEncoder(REPUTATION_SCHEMA);
  const now = BigInt(Math.floor(Date.now() / 1000));

  // Convert 0.0-1.0 float to basis points (0-10000)
  const basisPoints = BigInt(Math.round(params.reputationScore * 10_000));

  const encodedData = encoder.encodeData([
    { name: "tastemaker", value: params.tastemakerAddress, type: "address" },
    { name: "reputationScore", value: basisPoints, type: "uint64" },
    {
      name: "totalPredictions",
      value: params.totalPredictions,
      type: "uint32",
    },
    { name: "snapshotAt", value: now, type: "uint64" },
  ]);

  const tx = await eas.attest({
    schema: schemaUid,
    data: {
      recipient: params.tastemakerAddress,
      data: encodedData,
      revocable: false,
      expirationTime: BigInt(0),
    },
  });

  const uid = await tx.wait();
  return uid;
}
