# Tastemaker Scout 🎧

A deployable **Pinata Agents** fund / A&R research agent for **base.privy**, a
music tastemaker reputation game.

## What this is
The **demand-side consumer** of base.privy. The Scout periodically pays — per
query, in USDC on Base Sepolia, via **x402** — to read base.privy's tastemaker
signal, then emits a watchlist of credible emerging artists.

It is **read-only**. It never makes a tastemaker prediction or call. That holds
base.privy's core invariant: **supply = human, demand = agent.** Humans produce
the calls; agents like this one buy the resulting signal.

Built on the official **Privy Wallet Agent** Pinata marketplace template
(engine: OpenClaw).

## Layout
```
agent/
  manifest.json          # Pinata Agents manifest (schema manifest.v1)
  README.md              # this file
  workspace/
    IDENTITY.md          # who it is
    SOUL.md              # persona: rigorous, skeptical, buys signal not hype
    TOOLS.md             # privy-agent-wallet CLI + how to query the signal
    AGENTS.md            # behavior, budget rule, the refusal invariant
```

## Deploy on Pinata
1. Deploy from the **Privy Wallet Agent** template in the Pinata Agents
   marketplace (this directory is structured to drop in on top of it).
2. On **build**, Pinata runs `npm install -g @privy-io/agent-wallet-cli`.
3. On **start**, it runs `privy-agent-wallet login --non-interactive` to
   provision the agent's ETH + SOL wallets (device-grant auth).
4. **Fund the wallet** (human step): `privy-agent-wallet fund`. The Scout pays
   in **testnet USDC on Base Sepolia**, so fund it with Base Sepolia USDC.
5. Open the dashboard at the `/dashboard` route (port 3000).

## Configuration
- **`BASE_PRIVY_URL`** — the **public HTTPS** deploy of base.privy. All signal
  queries are relative to it (`/api/watchlist`, `/api/consensus`).
  `fetch-x402` is HTTPS-only and refuses localhost / private IPs, so this must
  be a real public HTTPS URL.

## Spending
Every paid query is capped with `--max-value` (USDC base units, 6 decimals;
`100000` = 0.10 USDC). The agent never queries without a cap and never raises
the cap to force a result. See `workspace/TOOLS.md` and `workspace/AGENTS.md`.
