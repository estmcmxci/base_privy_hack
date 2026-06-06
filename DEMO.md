# Scenius — demo run (5 beats, ~3 min)

**Live:** https://www.scenius.blog · **Repo:** https://github.com/estmcmxci/base_privy_hack
Everything below is on Base Sepolia (testnet USDC; gas covered by the x402 facilitator).

---

**1. What Scenius is** *(~15s)*
A two-sided market for music taste, live on Base. Humans stake a little USDC to call
which unknown artists break out; accurate calls compound into onchain reputation; that
becomes a credibility **signal** — and agents pay, per query, to read it.
*(Open scenius.blog — the landing walks the loop.)*

**2. The problem it solves** *(~15s)*
The people who spot great music first never get credit or paid — and the buyers who need
that read (A&R, music funds, sync/playlist desks) have no trustworthy, machine-readable
source. Taste is real alpha, but today it's illegible and unmonetized. Scenius makes it
portable, verifiable, and **priced**.

**3. Business model** *(~15s)*
Two revenue lines, both denominated in flows the product already runs: **(a)** meter the
signal API — funds and agents pay per query; **(b)** a take-rate on every x402 flow (each
stake + each read). The free game is the data engine; the credibility graph is the asset.

**4. Run the demo — both sides** *(~60–90s)*
- **Supply (human):** log in with Privy (embedded wallet, no extension) → `/submit` a call →
  it stakes **0.001 USDC over x402** → show the
  [onchain stake tx](https://sepolia.basescan.org/tx/0x43d1debd70a6090d0f41e2815c8435935dced33a680016149ab1e30578303386).
  Open `/leaderboard`, then a resolved call's
  [EAS attestation](https://base-sepolia.easscan.org/attestation/view/0x5ccd9da43494d3cf97ab6f06598b73a98aa8ab30d2c9a60a85a0eb8262cb2530).
- **Demand (agent):** in Telegram, tell the **Tastemaker Scout** *"scout the watchlist"* →
  it pays **0.05 USDC over x402** to `/api/watchlist` → returns ranked artists → show the
  [onchain read tx](https://sepolia.basescan.org/tx/0x895d09081131b9794c82d8601d26cbb66d83145a22a438002ab908063fbe7c92).
  It refuses, every time, to *make* a call — it only reads.

**5. Why it's novel + the ask** *(~20s)*
> **x402 finally puts a price on being right early — agents can fake a prediction, never a track record.**

Most x402 demos sell compute or data an agent could just generate itself. Scenius sells the
one input an agent *can't* synthesize: a track record of being right early. Reputation here is
earned, stake-backed, and attested onchain — you only get it by calling winners before the
crowd, over and over. So when an agent pays to read the watchlist, it's buying **calibrated
conviction**, not opinions — a new asset class on x402 that compounds: the graph gets more
valuable and more defensible the longer it runs. Built, shipped, live — here's the repo.

---

### Cheat sheet
| | |
|---|---|
| Live app | https://www.scenius.blog |
| Agent | Telegram **Tastemaker Scout** (Pinata Agents, OpenClaw, Privy Wallet Agent) |
| Human stake tx (x402 v0.7, 0.001 USDC) | `0x43d1deb…3386` |
| Agent read tx (x402 v2, 0.05 USDC) | `0x895d09…7c92` |
| EAS attestation (Base Sepolia) | `0x5ccd9d…2530` |
| Stack | Base · Privy (auth + embedded wallets + agent-grant) · EAS · x402 (v0.7 + v2) · Pinata/OpenClaw |
