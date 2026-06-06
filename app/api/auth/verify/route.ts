/**
 * STUB (PRD §10). Echoes the address WITHOUT verifying the signature.
 *
 * A real implementation must recover/verify the SIWE message + signature against
 * the address (e.g. viem `verifyMessage` / EIP-1271 for smart accounts) and check
 * the nonce was issued and unused. DO NOT ship this as-is — it trusts the client.
 */
export async function POST(req: Request) {
  const { address, message, signature } = await req.json();
  if (!address || !message || !signature) {
    return Response.json({ error: 'missing fields' }, { status: 400 });
  }
  // TODO: verify signature + consume nonce.
  return Response.json({ verified: false, address, note: 'STUB — not verified' });
}
