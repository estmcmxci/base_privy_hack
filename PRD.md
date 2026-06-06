# PRD: Tastemaker — Reputation Graph for Cultural Judgment

> Status: **DRAFT / STUB** · Owner: `TODO` · Last updated: 2026-06-06
> Source: [`idea.md`](./idea.md)

---

## 1. Summary

A public tastemaker game for emerging artists. Users log in, make early calls on
tracks/artists, and build a scored reputation over time based on **accuracy,
timing, and consistency**. The consumer app is the data engine; the real asset is
a **reputation graph / leaderboard of credible cultural judgment** that becomes an
underwriting signal for early-stage music financing, A&R, and media.

## 2. Problem

`TODO` — Why does this need to exist?
- Early-stage music financing / A&R lacks a credible, liquid signal for "who can
  pick winners before the market does."
- `TODO`: who feels this pain most acutely (labels, funds, sync agencies, the
  tastemakers themselves)? Quantify.

## 3. Goals & Non-Goals

### Goals
- `TODO` Ship a v0 demo loop (see §6) that produces a ranked leaderboard.
- `TODO` Produce a defensible reputation score per user.
- `TODO` Output a top-tastemakers list + a forward-looking watchlist.

### Non-Goals (v0)
- `TODO` No real money / financing rails in v0 (signal only).
- `TODO` No artist-side onboarding flow.
- `TODO` `<others>`

## 4. Target Users / Personas

| Persona | Role | What they get | Status |
|---|---|---|---|
| Tastemaker | Consumer player making calls | Score, rank, clout | `TODO` flesh out |
| Underwriter / A&R | Buyer of the signal | Ranked credible judges + watchlist | `TODO` (v1+) |
| Artist | Subject of predictions | `TODO` | `TODO` |

## 5. Success Metrics

`TODO` — define before build.
- North-star: `TODO` (e.g. predictive lift of leaderboard vs. baseline).
- Engagement: DAU, calls per user per week, resolution rate.
- Signal quality: Brier / log-loss of top-decile users vs. random.

## 6. v0 Demo Loop (Core Flow)

> Source loop from `idea.md`:
> **login → pick artists → timestamp predictions → resolve outcomes →
> update leaderboard → output top tastemakers + watchlist**

1. **Login** — **Privy** (embedded wallet provisioned on login; §10).
2. **Pick artists/tracks** — submit a **SoundCloud URL** (scenius model; §9). Cold-start
   catalog approach still open (§11).
3. **Make a call** — a prediction is **threshold + horizon + direction** (§7): *"Will
   this artist/track gain ≥ `streamThreshold` plays within `horizon` (1w/2w/4w/8w)?"
   → yes/no.* A creation snapshot freezes the play count at call time. **Gated by a
   stake** (§7 anti-gaming).
4. **Resolve outcomes** — weekly cron takes a fresh SoundCloud snapshot at the
   horizon; `delta = current − creation`; `outcome = delta ≥ threshold ? yes : no`.
   404 → `void`. (scenius `runWeeklyResolution`.)
5. **Update leaderboard** — EMA reputation update per resolved call (§7); EAS
   attestation written onchain (Base).
6. **Output** — top tastemakers (by reputation) + watchlist (reputation-weighted
   consensus per artist). `TODO` exact watchlist threshold/derivation.

## 7. Scoring Model

**Adopted wholesale from scenius** (canonical "Scenius paper" formula).

- **Prediction primitive:** threshold-with-horizon binary bet (see §6.3). Fields:
  `streamThreshold` (bigint), `predictedOutcome` (`yes`/`no`), `horizon`
  (`1w`/`2w`/`4w`/`8w`), `outcome` (`pending`/`yes`/`no`/`void`).
- **Reputation (EMA w/ exponential credit):**
  `r = (1−α)·r + α·exp(−β·(p−y)²)`, α=0.05, β=5.0, init 1.0, clamped [0.01, 0.99].
- **Aggregate signal:** `weightedConsensus()` — reputation-weighted mean of calls
  per artist (this is the §8 asset output).
- **Accuracy / timing / consistency** are all expressed through the above: accuracy
  via `(p−y)²`, timing via the user-chosen horizon + frozen creation snapshot,
  consistency via the EMA's 95% weight on history.
- **Anti-gaming — DECIDED: stake-to-predict, implemented as an x402 flat-tax.** Each
  call requires a small USDC payment via **x402** (pay-per-request) to `POST
  /predictions`. This is the "flat sybil tax" stake variant — no escrow contract,
  no slashing. Human-only (see §10 supply/demand invariant).

## 8. Reputation Graph (The Asset)

Reuses scenius's relational model (Postgres/Drizzle):
- Nodes: tastemakers, artists, tracks, snapshots. Edges: predictions (call →
  outcome), EAS attestations (onchain record per resolved call + reputation snapshot).
- "Credible cultural judgment" = a tastemaker's EMA `reputationScore` + history;
  per-artist credibility = `weightedConsensus`.
- **The asset is sold as an x402-metered API** (`GET /consensus`, `/tastemakers`,
  watchlist). Demand side = agents (A&R bots, fund scouts, sync/playlist agents) and
  humans, who **pay USDC per query** to read the signal. This is the §1 "underwriting
  signal" made concrete and the agent-facing half of the x402 bounty (see §10).

## 9. Data Sources

**DECIDED: SoundCloud** (reuse scenius's snapshot pipeline as-is).
- Artist/track catalog: user-submitted SoundCloud URLs; `catalogSnapshots` /
  `trackSnapshots` capture play counts at call + resolution time.
- Outcome ground-truth: SoundCloud play-count delta vs. `streamThreshold`.
- Refresh cadence: weekly resolution cron (host TBD, §11). Rate limits: inherits
  scenius's SoundCloud client (`SOUNDCLOUD_CLIENT_ID/SECRET`).
- `TODO` (later) Spotify as a second source — explicitly deferred.

## 10. Architecture (Stub)

**Decided stack:** Privy for auth + embedded wallets, Base (Base Account) for the
onchain layer. These are not two stacks — Privy natively drives Base Account
sign-in via the `useBaseAccountSdk()` hook, so login and onchain identity are one
integrated flow. (API specifics + verified version pins in §13.A.)

- **Auth / wallet:** **Privy** (`@privy-io/react-auth`). `PrivyProvider` with
  `embeddedWallets.ethereum.createOnLogin: 'users-without-wallets'`; login via the
  `useLogin` hook. Provisions an embedded wallet per player so a "call" can be
  signed without the user holding a pre-existing wallet.
- **Onchain layer:** **Base Account** (`@base-org/account`). Sign-In with Base
  (SIWE over `wallet_connect`, chainId `0x2105`) for verifiable identity; `pay()` /
  USDC rails reserved for monetization (v1+, see §11). Privy↔Base bridge via
  `useBaseAccountSdk()` + `SignInWithBaseButton` from `@base-org/account-ui`.
  Note: **not OnchainKit** — Base actively removed OnchainKit/MiniKit references
  from the Base Account docs (PR #1205, 2026-03-09).
- Frontend: Next.js 16 / React 19 / TS (scaffolded; §13.A).
- Backend / API: Next.js route handlers. SIWE: `/api/auth/nonce` + `/api/auth/verify`
  (verify server-side). Prediction/resolution/scoring reused from scenius.
- **Datastore — DECIDED: Supabase Postgres + Drizzle** (inherited from scenius).
  base.privy gets a **fresh Supabase project** (clean demo data, no risk to scenius);
  run scenius's existing Drizzle migrations into it.
- **Resolution job — DECIDED: Vercel cron, Friday weekly** (inherited from scenius
  `vercel.json`): two-stage — snapshot `0 11 * * 5`, resolve `0 12 * * 5`. Cadence
  could later move to daily, but Friday-weekly is the ported default, not a blocker.
- **Onchain record — DECIDED: EAS on Base Sepolia** (inherited; contract
  `0x4200…0021`). **Reuse scenius's registered schema UIDs** (`EAS_SCHEMA_UID_
  PREDICTION` / `_REPUTATION`). Gas paid by scenius's server signer (`EAS_PRIVATE_KEY`
  pattern). Same network as x402 (testnet) — see payment layer.
- **Codebase strategy — DECIDED: copy scenius code into this repo** (not a shared
  codebase, not a shared DB). Port the `predictions` / `resolution` / `tastemakers` /
  `soundcloud` / EAS domains as-is; fresh DB + Privy auth are the only rewires.
- **Auth swap — DECIDED: rip out Para, Privy only.** scenius authenticates with
  **Para** (`NEXT_PUBLIC_PARA_API_KEY`); base.privy removes it and rewires the
  `tastemaker → wallet` identity to Privy embedded wallets (the validated scaffold,
  §13.A). **This is the real porting work** — infra rides in unchanged.
- **Anti-sybil — DECIDED: stake-to-predict** (Base/Privy wallet), implemented as the
  x402 flat-tax below.
- **Payment layer — DECIDED: x402** (pay-per-request USDC on Base). Two surfaces,
  one rail:
  - `POST /predictions` — **human** pays a flat USDC tax to make a call
    (= the stake; human-facing x402, "person calling the shots").
  - `GET /consensus` etc. — **agent**-or-human pays per query to read the signal
    (agent-facing x402, "service that earns" / "agent that spends").
  - **Pay side (verified via Privy docs):** `@privy-io/node/x402` `createX402Client`
    + `@x402/fetch` `wrapFetchWithPayment`; `useX402Fetch` in `@privy-io/react-auth`
    ≥3.7.0 (we have 3.29.2). Networks: Base / Base Sepolia, **USDC only**, gas paid by
    a **facilitator** (Coinbase / Pay AI / Corbits).
  - **Gate side (OURS — the remaining unknown):** how we return `402` + validate the
    `X-PAYMENT` header on `GET /consensus` and `POST /predictions`. `TODO` verify the
    Next.js x402 server middleware (`x402-next`-style) + facilitator wiring. Privy
    documents *paying*, not *gating*.
- **Consumer agent runtime — DECIDED: Privy Wallet Agent (Pinata template).** The
  "fund scout" is the official **Privy Wallet Agent** marketplace template
  (`agents.pinata.cloud/.../tgny401x`, engine **OpenClaw**, one-click deploy; repo
  `github.com/privy-io/examples/.../pinata-template`). Ships **x402 + MPP payments,
  Privy wallet, and the Agent-Authorization CLI** (`@privy-io/agent-wallet-cli login`
  → browser approve → fund) out of the box, with a human-oversight dashboard at
  agents.privy.io. This **moots the wallet tier-ladder** (template is the canonical
  path) and **replaces the synthesis deploy route** (synthesis set aside; possible
  later for ERC-8004 identity). `TODO` inspect template repo to confirm wallet model +
  how to add "query base.privy on a budget → emit watchlist".
- **Supply/demand invariant (load-bearing):** **agents may pay to *read* the signal,
  never to *make* calls.** The supply side (predictions) is human-only — that is what
  keeps the asset "credible *human* judgment." The human/agent boundary IS the
  supply/demand boundary.

## 11. Open Questions

**Resolved this session:**
- ~~Auth provider?~~ Privy + Base Account via `useBaseAccountSdk()` (§10).
- ~~Reputation graph onchain vs off-chain?~~ Off-chain Postgres graph + onchain EAS
  attestations as the verifiable record (§8/§10).
- ~~What is a "prediction"?~~ threshold + horizon + yes/no (§7, from scenius).
- ~~Resolution latency vs engagement?~~ Bounded by user-chosen horizon (≤8w); §6/§7.
- ~~Ground-truth source?~~ SoundCloud (§9).
- ~~Reuse vs re-implement?~~ Reuse scenius directly (§10).
- ~~Sybil resistance?~~ Stake-to-predict (§7/§10).
- ~~Stake mechanics fork?~~ **Flat tax via x402** (no escrow, no slashing) — §7/§10.
- ~~Include x402 bounty?~~ Yes, both surfaces (§10).
- ~~Agents as tastemakers?~~ **No** — agents are demand-side only (read signal, never
  make calls). Supply/demand invariant, §10.
- ~~DB host / shared vs copied?~~ **Copy scenius code into this repo; fresh Supabase
  project** (run scenius migrations). §10.
- ~~EAS chain / schema UID?~~ **Base Sepolia, reuse scenius's registered UIDs.** §10.
- ~~Cron host/cadence?~~ **Vercel cron, Friday weekly** (inherited). §10.
- ~~Network: EAS vs x402?~~ **All Base Sepolia (testnet)** — testnet USDC for x402. §10.
- ~~Auth porting?~~ **Rip out Para, Privy only** — the real porting task. §10.

**De-risked this session (Privy docs + Pinata template + x402 docs):**
- ~~Verify x402 *pay* side?~~ Confirmed: `@privy-io/node/x402` + `@x402/fetch`, Base
  Sepolia + USDC, facilitator pays gas (§10/§13.A).
- ~~Consumer-agent build?~~ Privy Wallet Agent Pinata template — x402 + agent-auth +
  wallet out of the box (§10). Wallet tier-ladder mooted; synthesis dropped.
- ~~x402 GATE side?~~ **Confirmed: `@x402/next` `withX402` v2.14.0** (scoped line,
  matches Privy's pay side). Facilitator `https://x402.org/facilitator`, network
  `eip155:84532` (Base Sepolia). Code in §13.B. (Caveat: confirm subpath imports at
  install — docs show minor drift.)

**De-risked — template skimmed (`privy-io/examples/.../pinata-template`):**
- ~~Template wallet model / customization?~~ Agent gets its own ETH+SOL wallets via
  `privy-agent-wallet login` (one canonical path; human funds + revokes at
  agents.privy.io). Customization = edit OpenClaw markdown (`TOOLS.md`/`AGENTS.md`),
  no code. x402 = one CLI command `fetch-x402 <url> --max-value <usdc-base-units>`
  (auto-handles 402; `--max-value` = budget guard). Details §13.B.

- ~~Network compatibility (Sepolia)?~~ **RESOLVED — verified in `agent-wallet-cli@0.3.1`
  shipped code:** `fetch-x402` registers `eip155:*` (all EVM chains) and pays on whatever
  network the **server's 402 declares**. x402 is server-driven on network, so our gate's
  `eip155:84532` (Base Sepolia) is matched — **no mainnet lock-in; all-Sepolia holds.**
  Needs: agent funded with testnet USDC (Circle faucet) + facilitator on Sepolia (✓).

**Still open — blocking:**
- `TODO` **Public HTTPS for agent payment (NEW, from bytecode):** `fetch-x402` is
  HTTPS-only + blocks private/local IPs → agent **cannot** pay `http://localhost`.
  base.privy must be a public HTTPS URL (Vercel preview) for any agent→gate test.
- `TODO` Scout autonomy: template is command-driven/reactive; "query periodically on a
  budget" needs our addition (`AGENTS.md` instructions + a scheduler/cron). `--max-value`
  (default 1 USDC) is the per-call budget guard.
- `TODO` x402 flat-tax amount (USDC) + where the fee goes (treasury / ops).
- `TODO` Signal-API pricing: per-query USDC amount + which endpoints gated vs free.
  (`withX402` `price` is set per-route, e.g. `"$0.001"` — just needs the numbers.)

**Still open — deferrable:**
- `TODO` Identity model: wallet address vs Privy user ID; ENS naming.
- `TODO` Cold-start / catalog seeding beyond user-submitted URLs.
- ~~Monetization / who buys the signal?~~ **Resolved (§8/§10):** agents + funds pay
  per-query via x402; pricing TBD (blocking list above).
- `TODO` Watchlist derivation threshold (§6.6).

## 12. Milestones

| Phase | Deliverable | Status |
|---|---|---|
| M0 | PRD finalized | `IN PROGRESS` |
| M1 | Port scenius + swap Para→Privy (predict → resolve → leaderboard) | `TODO` |
| M2 | x402 **gate** side — 402 on `POST /predictions` (flat-tax) + `GET /consensus` (metered) | `TODO` |
| M3 | Deploy Privy Wallet Agent (Pinata template) as the "fund scout" → pays x402 to read signal → watchlist | `TODO` |
| M4 | EAS attestations on Base Sepolia + signal-API pricing | `TODO` |

## 13. Appendix

### 13.A — Confirmed SDK reference (verified 2026-06-06)

Versions/recency verified against npm + the `github.com/base/docs` repo on
2026-06-06.

| Package / source | Version | Published / last commit | Recency |
|---|---|---|---|
| `@privy-io/react-auth` | 3.29.2 | 2026-06-04 | ✅ ~2 days |
| `@base-org/account` | 2.5.6 | 2026-05-08 | ⚠️ ~4 weeks (stable) |
| `@base-org/account-ui` | 1.0.1 | 2025-07-16 | ⚠️ ~11 months |
| `base/docs` `base-account/` section | — | 2026-04-15 | ⚠️ ~7.5 weeks (stable) |
| `base/docs` Privy-integration page | — | 2025-10-08 | ⚠️ ~8 months |

> **Caveat:** Only Privy is genuinely week-old. Base Account is a stable (not
> stale) primitive. The Base↔Privy integration *doc page* is ~8 months old, so the
> `useBaseAccountSdk()` surface it describes may lag the current Privy SDK —
> **verify that hook signature at build time** before relying on it.

**Privy — provider + login** (`@privy-io/react-auth`):

```tsx
'use client';
import {PrivyProvider} from '@privy-io/react-auth';

<PrivyProvider
  appId="your-privy-app-id"
  clientId="your-app-client-id"
  config={{ embeddedWallets: { ethereum: { createOnLogin: 'users-without-wallets' } } }}
>
  {children}
</PrivyProvider>

// login: const {login} = useLogin({ onComplete, onError });
```

**Base Account — SDK + payments** (`@base-org/account`):

```ts
import { createBaseAccountSDK, pay, getPaymentStatus } from '@base-org/account';
// sign-in: provider.request({ method: 'wallet_connect', params: [{ version: '1',
//   capabilities: { signInWithEthereum: { nonce, chainId: '0x2105' } } }] })
// pay({ amount: '0.01', to, testnet: true }) → SDK quotes equivalent USDC
```

**Privy ↔ Base bridge** (verify hook signature at build — doc page is ~8 mo old):

```tsx
import { useBaseAccountSdk } from '@privy-io/react-auth';
import { SignInWithBaseButton } from '@base-org/account-ui/react';
// flow: GET /api/auth/nonce → wallet_switchEthereumChain(0x2105)
//       → wallet_connect (SIWE) → POST /api/auth/verify
```

### 13.B — Agent + x402 stack (verified 2026-06-06)

Sources: `docs.privy.io/recipes/agent-integrations/{overview,agent-authorization,x402}`
and the Pinata marketplace template (title-only — internals JS-rendered, `TODO` inspect repo).

**x402 — pay side (agent/client):**
```ts
import { createX402Client } from '@privy-io/node/x402';
import { wrapFetchWithPayment } from '@x402/fetch';
const x402client = createX402Client(privy, { walletId, address });
const fetchWithPayment = wrapFetchWithPayment(fetch, x402client);
await fetchWithPayment('https://base.privy.app/consensus'); // 402 auto-handled
// Base/Base Sepolia, USDC only, gas paid by facilitator (Coinbase / Pay AI / Corbits)
```

**x402 — gate side (ours; verified via `/coinbase/x402` docs + npm):** use the **scoped
`@x402/*` v2.14.0** line (NOT the older unscoped `x402-next` v1.2.0). `@x402/next`
`withX402` per-route, or `paymentProxy` + matcher for many routes.
```ts
// app/api/consensus/route.ts
import { withX402 } from '@x402/next';
import { x402ResourceServer, HTTPFacilitatorClient } from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm/exact/server';
const server = new x402ResourceServer(
  new HTTPFacilitatorClient({ url: 'https://x402.org/facilitator' }) // Coinbase facilitator
);
server.register('eip155:*', new ExactEvmScheme());
export const GET = withX402(handler, {
  accepts: [{ scheme: 'exact', price: '$0.001', network: 'eip155:84532' /* Base Sepolia */, payTo: PAYTO }],
  description: 'Tastemaker consensus signal', mimeType: 'application/json',
}, server);
// eip155:84532 = Base Sepolia (mainnet 8453); USDC; facilitator pays gas;
// withX402 settles only after a successful response.
// Caveat: confirm subpath imports (@x402/core/server, @x402/evm/exact/server) at install.
```

**Agent Authorization (OAuth 2.0 Device Grant):** agent `POST /api/oauth/v2/
device_authorization` → human approves at our hosted verify page (`device_verify`) →
agent polls `/token` → exchanges for ephemeral HPKE signing key → signs wallet RPC.
Dashboard: *Authentication → Advanced → "Enable for CLI and agent access"* + set
Verification URI. Packaged as `@privy-io/agent-wallet-cli login --non-interactive`.

**Consumer agent runtime:** Privy Wallet Agent (Pinata template) — engine **OpenClaw**,
one-click deploy. Repo `github.com/privy-io/examples/.../pinata-template` (skimmed
2026-06-06). Structure:
- `manifest.json` (Pinata `manifest.v1`): build = `npm i -g @privy-io/agent-wallet-cli`,
  start = `privy-agent-wallet login --non-interactive`; route `/dashboard:3000`.
- `workspace/{TOOLS,AGENTS,SOUL,IDENTITY}.md` = OpenClaw config. **Customize the scout
  by editing these markdown files — no code.**
- Wallet ops + x402 all via `@privy-io/agent-wallet-cli`:
  ```bash
  privy-agent-wallet login --non-interactive   # device-grant auth; agent gets ETH+SOL wallets
  privy-agent-wallet fund                       # human funds the wallet
  privy-agent-wallet fetch-x402 <url> --max-value <usdc-base-units>  # pays on 402; --max-value = budget
  privy-agent-wallet rpc --json '{"method":..,"params":..}'          # sign/send
  ```
- **Network: server-driven (verified in shipped code).** `fetch-x402` registers
  `eip155:*` and pays on whatever network the 402 declares → Base Sepolia (84532) works,
  no mainnet lock-in. The "USDC on Base" wording is shorthand. `agent-wallet-cli@0.3.1`.
- **Caveat (from bytecode):** `fetch-x402` is **HTTPS-only + blocks private/local IPs** →
  no `localhost`; base.privy must be public HTTPS for agent payment. `--max-value`
  (default 1 USDC base units) is the per-call spend cap; refuses to sign if amount unreadable.
- Oversight/revoke: agents.privy.io.

### 13.C — Other references

- Original idea: [`idea.md`](./idea.md)
- scenius primitive (reuse source): `/Users/oakgroup/scenius`
- `TODO` prior art, competitive scan.
