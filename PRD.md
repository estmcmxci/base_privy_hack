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

1. **Login** — `TODO` auth provider (Privy? dir name suggests it — confirm).
2. **Pick artists/tracks** — `TODO` catalog source & discovery surface.
3. **Timestamp predictions** — record an immutable call + time. `TODO` what is the
   prediction primitive? (binary "this blows up"? ranked? threshold on a metric?)
4. **Resolve outcomes** — `TODO` ground-truth source & resolution window (streams,
   chart position, follower growth, playlist adds?).
5. **Update leaderboard** — recompute scores. `TODO` scoring function (see §7).
6. **Output** — top tastemakers list + watchlist. `TODO` watchlist derivation.

## 7. Scoring Model

`TODO` — the crux of the product. Stub:
- **Accuracy** — was the call right? `TODO` metric & threshold.
- **Timing** — how early relative to the crowd / market? `TODO` reward curve.
- **Consistency** — sustained hit-rate, anti-luck. `TODO` decay, sample-size
  weighting, confidence intervals.
- Anti-gaming: `TODO` sybil resistance, late-call detection, collusion.

## 8. Reputation Graph (The Asset)

`TODO`
- Schema: nodes (users, artists, tracks), edges (calls, outcomes).
- How is "credible cultural judgment" represented & queried?
- Export / API surface for downstream underwriting consumers (v1+).

## 9. Data Sources

`TODO`
- Artist/track catalog: `TODO` (Spotify? Musicbrainz? manual seed?).
- Outcome ground-truth: `TODO`.
- Refresh cadence & rate limits: `TODO`.

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
- Frontend: `TODO` — assume React/Next.js (both SDKs are React-first).
- Backend / API: `TODO`. Must expose `/api/auth/nonce` + `/api/auth/verify` for the
  SIWE flow (verify `address` / `message` / `signature` server-side).
- Datastore: `TODO`.
- Scoring/resolution jobs: `TODO` (batch vs. event-driven).
- Reputation graph onchain vs. off-chain: `TODO` — open (see §11). The signed-call
  primitive works either way; onchain is an option, not yet a decision.

## 11. Open Questions

- ~~Is auth Privy? What does "base.privy" imply?~~ **Resolved (§10):** Privy auth +
  Base Account onchain, integrated via `useBaseAccountSdk()`.
- `TODO` Is the *reputation graph itself* onchain (Base) or an off-chain DB with
  onchain identity only? (Auth/identity decided; storage of the graph is not.)
- `TODO` What exactly is a "prediction" — confirm the primitive.
- `TODO` Resolution latency vs. game engagement tension — how long until a call scores?
- `TODO` Cold-start: how do early users make calls with an empty catalog?
- `TODO` Monetization / who pays for the signal. (Base `pay()` / USDC is the rail
  if/when this turns on.)

## 12. Milestones

| Phase | Deliverable | Status |
|---|---|---|
| M0 | PRD finalized | `IN PROGRESS` |
| M1 | v0 demo loop end-to-end | `TODO` |
| M2 | Scoring model v1 + anti-gaming | `TODO` |
| M3 | Reputation graph export / API | `TODO` |

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

### 13.B — Other references

- Original idea: [`idea.md`](./idea.md)
- `TODO` prior art, competitive scan.
