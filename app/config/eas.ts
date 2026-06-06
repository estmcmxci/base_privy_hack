import { getEasConfig } from "@/app/config/env";

// Base Sepolia EAS contract address (canonical, same across all OP Stack chains)
export const EAS_CONTRACT_ADDRESS =
  "0x4200000000000000000000000000000000000021" as const;

// EAS explorer base URL for Base Sepolia
const EXPLORER_BASE_URL =
  "https://base-sepolia.easscan.org/attestation/view/";

/**
 * Build a full EAS explorer URL for a given attestation UID.
 */
export function getAttestationUrl(uid: string): string {
  return `${EXPLORER_BASE_URL}${uid}`;
}

/**
 * Get prediction outcome schema UID from env.
 */
export function getPredictionSchemaUid(): string {
  return getEasConfig().EAS_SCHEMA_UID_PREDICTION;
}

/**
 * Get reputation snapshot schema UID from env.
 */
export function getReputationSchemaUid(): string {
  return getEasConfig().EAS_SCHEMA_UID_REPUTATION;
}
