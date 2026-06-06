import { randomBytes } from 'crypto';

/**
 * STUB (PRD §10). Returns a fresh nonce for the SIWE flow. A real implementation
 * must persist the nonce server-side and consume it once in /verify to prevent
 * replay. Here it is generated and forgotten — fine for the seam spike only.
 */
export async function GET() {
  const nonce = randomBytes(16).toString('hex');
  return Response.json({ nonce });
}
