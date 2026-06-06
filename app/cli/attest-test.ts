import { getAttestationUrl } from "@/app/config/eas";
import {
  attestPredictionOutcome,
  attestReputationSnapshot,
} from "@/app/domains/resolution/service/eas-service";

/**
 * CLI command: writes test attestations to Base Sepolia.
 * Requires EAS_PRIVATE_KEY, EAS_SCHEMA_UID_PREDICTION, and
 * EAS_SCHEMA_UID_REPUTATION env vars plus a funded wallet.
 */
export async function attestTestCommand(): Promise<void> {
  const dummyAddress = "0x0000000000000000000000000000000000000001";

  console.log("=== EAS Attestation Test (Base Sepolia) ===\n");

  // -- Test 1: Prediction Outcome --
  console.log("1) Attesting prediction outcome...");
  try {
    const predictionUid = await attestPredictionOutcome({
      predictionId: "test-prediction-001",
      tastemakerAddress: dummyAddress,
      predictedYes: true,
      outcomeYes: true,
      streamThreshold: BigInt(50_000),
      scDelta: BigInt(12_345),
    });

    console.log(`   UID: ${predictionUid}`);
    console.log(`   URL: ${getAttestationUrl(predictionUid)}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`   Failed: ${msg}`);
    if (msg.includes("Invalid EAS environment")) {
      console.error(
        "   Set EAS_PRIVATE_KEY, EAS_SCHEMA_UID_PREDICTION, and EAS_SCHEMA_UID_REPUTATION in .env"
      );
      return;
    }
  }

  // -- Test 2: Reputation Snapshot --
  console.log("\n2) Attesting reputation snapshot...");
  try {
    const reputationUid = await attestReputationSnapshot({
      tastemakerAddress: dummyAddress,
      reputationScore: 0.85,
      totalPredictions: 12,
    });

    console.log(`   UID: ${reputationUid}`);
    console.log(`   URL: ${getAttestationUrl(reputationUid)}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`   Failed: ${msg}`);
  }

  console.log("\nDone.");
}
