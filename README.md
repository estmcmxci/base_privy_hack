# Scenius — a credibility signal humans make and agents pay to read

**Live:** https://www.scenius.blog · **x402 bounty** (move USDC on Base)

Scenius is a two-sided market for music taste. **Humans** stake a small USDC fee
(over x402) to call which emerging SoundCloud artists will break out. Accurate
calls compound into onchain reputation. The reputation-weighted result is a
credibility **signal** — and **agents** pay per query (over x402) to read it.

The twist the bounty asked for: **the agent structurally cannot fake the thing
it's buying.** Taste is supplied by humans staking their own money and their
reputation; the agent is a paying consumer, never a producer. Supply = human,
demand = agent — and the human/agent boundary is the supply/demand boundary.

Two real x402 payments, two protocol versions, both settled on Base Sepolia:

| Side | Who | x402 | Amount | Tx |
|---|---|---|---|---|
| **Supply** | human stakes a call | v0.7 (browser) | 0.001 USDC | [`0x43d1deb…3386`](https://sepolia.basescan.org/tx/0x43d1debd70a6090d0f41e2815c8435935dced33a680016149ab1e30578303386) |
| **Demand** | agent reads the signal | v2 (CLI) | 0.05 USDC | [`0x895d09…7c92`](https://sepolia.basescan.org/tx/0x895d09081131b9794c82d8601d26cbb66d83145a22a438002ab908063fbe7c92) |

---

## Demo script — run it yourself

Everything below is live on Base Sepolia (testnet USDC, free from
[faucet.circle.com](https://faucet.circle.com)). Gas is paid by the x402
facilitator, so wallets only need USDC.

**1. See the asset.** Open https://www.scenius.blog — the landing walks the loop;
`/leaderboard` shows tastemakers ranked by reputation, seeded with real resolved
calls. Resolved predictions link their onchain **EAS attestation**, e.g.
[`0x5ccd9d…2530`](https://base-sepolia.easscan.org/attestation/view/0x5ccd9da43494d3cf97ab6f06598b73a98aa8ab30d2c9a60a85a0eb8262cb2530).

**2. Human stakes a call (supply, x402 v0.7).** Sign in with Privy (embedded
wallet, no extension), go to `/submit`, paste a SoundCloud track, set a play
threshold + horizon, predict yes/no. Submitting pays a **0.001 USDC** stake over
x402 — the anti-spam tax that keeps the board honest. Settles on-chain:
[stake tx](https://sepolia.basescan.org/tx/0x43d1debd70a6090d0f41e2815c8435935dced33a680016149ab1e30578303386).

**3. Agent pays to read the signal (demand, x402 v2).** Message the
**Tastemaker Scout** — a [Pinata Agents](https://agents.pinata.cloud) deployment
(OpenClaw engine, Privy Wallet Agent template) — on Telegram: *"scout the
watchlist."* It checks its Privy wallet, calls the x402-gated
`GET /api/watchlist`, pays **0.05 USDC** on the 402 challenge, and returns a
ranked watchlist. Settles on-chain:
[read tx](https://sepolia.basescan.org/tx/0x895d09081131b9794c82d8601d26cbb66d83145a22a438002ab908063fbe7c92).
It refuses, every time, to *make* a call — it only reads.

**4. Verify.** Both txs above are real USDC transfers to the same `payTo`. The
agent's wallet balance drops 0.05; the human's drops 0.001. The signal it bought
is computed from staked human calls it can't author.

---

## Why this hits the bounty

**A service that earns + a person calling shots — at once.** `GET /api/consensus`
and `/api/watchlist` are x402-gated APIs any agent can discover and pay to use
(the "service that earns"). The human stake path is "x402 under the hood, a real
person calling shots." We built both rails and a reason for money to cross them.

- **Novelty** — *x402 finally puts a price on being right early — agents can fake
  a prediction, never a track record.* Most x402 demos sell compute or data an
  agent could generate itself; Scenius sells the one input it can't synthesize —
  earned, stake-backed, onchain-attested reputation. The signal is calibrated
  conviction, and it compounds the longer the graph runs.
- **PMF** — A&R scouts, music funds, and sync/playlist desks already want "which
  unknowns do credible people believe in?" That's the metered signal, and those
  buyers are increasingly agents.
- **Technical depth** — two x402 dialects in one app (Privy's browser client
  speaks canonical **v0.7**; the agent CLI speaks **v2**), each gated by a
  version-matched server; EAS attestations; Privy device-grant agent auth; real
  on-chain settlement on both sides.

---

## How it's built

Picks-and-shovels, not another artist-picking bot. Scenius sells the **data**
agents need to pick artists.

- **Base** — everything settles on Base Sepolia. USDC is the unit; the x402
  facilitator (`x402.org/facilitator`) covers gas, so wallets hold only USDC.
- **x402** — the payment rail on both sides. Agent-facing routes
  (`/api/consensus`, `/api/watchlist`) gate with **`@x402/next` v2**, matching the
  agent CLI. The human stake route (`POST /api/predictions`) gates with
  **`x402-next` v0.7** (a Next.js `proxy`), matching Privy's browser client. One
  protocol, two generations, bridged in one repo.
- **Privy** — auth + embedded wallets for humans (`@privy-io/react-auth`, server
  verification via `@privy-io/server-auth`), and **agent authorization** for the
  Scout: the OAuth device-grant `@privy-io/agent-wallet-cli` provisions and signs
  from the agent's own Privy wallet, with human oversight/revoke at agents.privy.io.
- **EAS** — every resolved prediction writes an Ethereum Attestation Service
  attestation on Base, making the reputation graph portable and auditable, not
  trapped in our database.
- **Agentic infra** — the Scout runs on **Pinata Agents** (OpenClaw engine). Its
  whole consume-the-signal behavior — query within a USDC budget, summarize a
  watchlist, refuse to predict — is markdown config plus `fetch-x402`.
- **The primitive** (reused + hardened from the Scenius research build): a
  prediction is `threshold + horizon + yes/no`; reputation is an EMA of Brier
  score (good calls compound, luck decays); the per-artist signal is the
  reputation-weighted consensus of open calls. Next.js 16 · Drizzle/Postgres
  (Supabase) · SoundCloud as ground truth · weekly resolution cron.

---

## Business model

Two revenue lines, both denominated in the x402 flows the product already runs:

1. **Signal API.** Meter access to the reputation-weighted signal. A&R teams,
   labels, music funds, and sync/playlist agents pay per query (or subscribe) to
   read "which unknowns do credible people believe in?" — exactly the
   `GET /api/watchlist` the Scout pays for today.
2. **Protocol take-rate.** A cut of every x402 flow that crosses the market — the
   human stake on each call and each paid read of the signal. As volume on both
   sides grows, the take-rate scales with it, no separate sales motion required.

The data engine (a free, fun tastemaker game) feeds the asset (a credibility
graph). The asset is the business.

---

## Repo

- App: Next.js 16 App Router. Gated APIs in `app/api/`, x402 v2 config in
  `app/lib/x402-server.ts`, the v0.7 human gate in `proxy.ts`.
- Agent: `agent/` — the Pinata Tastemaker Scout (manifest + OpenClaw workspace).
- Reputation + resolution + EAS: `app/domains/`.
- Run locally: `pnpm install`, fill `.env.local` (see `.env.example`),
  `pnpm db:push`, `pnpm dev`. Deploy notes in `RUNBOOK.md`.
