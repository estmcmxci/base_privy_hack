# base.privy — Build & Deploy RUNBOOK

T-minus checklist for a hackathon submission. Run sections **in order**. Each
step is self-contained; the only hard sequencing is: schema before data, deploy
before scout, public URL before x402.

> Why: nothing resolves live during the demo window (prediction horizons are
> 1–8 weeks). We stand up a fresh DB, migrate the schema, and import REAL
> historical data from scenius so the leaderboard/feed is populated. The one
> live moment is a *force-resolved* call (§9).

---

## 0. Prerequisites

Accounts / access you need before starting:

- **Supabase** account (new project — §1).
- **Privy** account → dashboard.privy.io (app + secret — §4).
- **Vercel** account (public HTTPS deploy — §7).
- **Pinata** account → Pinata Agents (scout deploy — §8).
- **Testnet funds on Base Sepolia:**
  - testnet **ETH** (gas) and testnet **USDC** (x402 payments) from the
    Circle faucet: https://faucet.circle.com (select Base Sepolia).
- Local tooling: `node`, `pnpm`, and Postgres client tools (`pg_dump` + `psql`)
  on PATH.

---

## 1. Fresh Supabase

1. Create a **new** Supabase project (do NOT reuse scenius's).
2. Project → **Settings → Database → Connection string → "Connection pooling"**.
3. Copy the **pooler** connection string (port 6543, `...pooler.supabase.com`).
   This is your `DATABASE_URL`. Append `?sslmode=require` if not present.

---

## 2. Install + schema

```bash
pnpm install
cp .env.example .env.local   # then fill values as you go (see Env vars below)
# set DATABASE_URL in .env.local to the pooler string from §1
pnpm db:push                 # creates the schema from Drizzle migrations (0000–0003)
```

`pnpm db:push` applies the committed Drizzle schema. Confirm the 7 tables
exist before continuing (the import script will refuse otherwise).

---

## 3. Historical data

Copy REAL data from scenius's existing Supabase into the fresh DB.

```bash
# scenius connection string lives in /Users/oakgroup/scenius/.env
export SCENIUS_DATABASE_URL="$(grep '^DATABASE_URL=' /Users/oakgroup/scenius/.env | cut -d= -f2-)"

bash scripts/dump-scenius.sh   # -> ./scenius-data.sql (data-only, 7 tables, FK order)

# DATABASE_URL must be the FRESH base.privy DB from §1 (export it if not already)
bash scripts/import-data.sh    # pre-flights schema, imports, prints row counts
```

The import script refuses to run unless the schema exists (run `pnpm db:push`
first) and prints a per-table row count so you can eyeball that the demo data
landed.

---

## 4. Privy

1. dashboard.privy.io → your app → **App settings**.
   - Copy **App ID** → `NEXT_PUBLIC_PRIVY_APP_ID`.
   - Copy **Client ID** → `NEXT_PUBLIC_PRIVY_CLIENT_ID`.
   - Create an **App secret** → `PRIVY_APP_SECRET` (server-only, never `NEXT_PUBLIC_`).
2. **Authentication → Advanced** → toggle **"Enable for CLI and agent access"**
   (required for the scout's `privy-agent-wallet` flow in §8).
3. Set the **Verification URI** to your app's public URL (fill after §7, or
   set provisionally and update).

---

## 5. x402

- Set `X402_PAY_TO` to a **Base Sepolia address you control** — reuse the EAS
  signer address (§6) so payments collect to a key you already hold.
- Facilitator is `https://x402.org/facilitator` (public, **no API key**).

---

## 6. EAS

Reuse scenius's Base Sepolia EAS setup — no new schema registration needed.

- `EAS_PRIVATE_KEY` — the Base Sepolia signer key (from scenius).
- `EAS_SCHEMA_UID_PREDICTION` — scenius's prediction schema UID.
- `EAS_SCHEMA_UID_REPUTATION` — scenius's reputation schema UID.

---

## 7. Deploy app (Vercel)

- Deploy to Vercel. **Public HTTPS is REQUIRED** — the scout agent pays x402
  to reach the app and **refuses localhost**.
- Add all server + public env vars (see Env vars list) to the Vercel project.
- Note the **public URL** (e.g. `https://base-privy.vercel.app`) → set as
  `NEXT_PUBLIC_APP_URL`, and back into Privy's Verification URI (§4).

---

## 8. Deploy scout (Pinata Agents)

1. Pinata Agents → create from the **Privy Wallet Agent** template, using the
   `agent/` workspace in this repo.
2. Set `BASE_PRIVY_URL` to the Vercel public URL from §7.
3. Provision the agent wallet:
   ```bash
   privy-agent-wallet login
   privy-agent-wallet fund     # fund with testnet USDC (Base Sepolia, from §0 faucet)
   ```

---

## 9. Demo

1. **Populated leaderboard** — open `/leaderboard` on the Vercel URL; historical
   data from §3 should render.
2. **Force-resolve a fresh call** (the one live on-chain moment):
   ```bash
   pnpm cli resolve --force
   ```
   or hit the cron route:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" https://<app>/api/cron/resolve
   ```
3. **Agent pays x402** — the scout does a paid `GET /api/watchlist` against the
   Vercel URL, settling testnet USDC via the facilitator.

---

## Env vars

Grouped, names only. Server-only secrets must NOT use the `NEXT_PUBLIC_` prefix.

**DB**
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**SoundCloud**
- `SOUNDCLOUD_CLIENT_ID`
- `SOUNDCLOUD_CLIENT_SECRET`

**EAS**
- `EAS_PRIVATE_KEY`
- `EAS_SCHEMA_UID_PREDICTION`
- `EAS_SCHEMA_UID_REPUTATION`

**Privy**
- `NEXT_PUBLIC_PRIVY_APP_ID`
- `NEXT_PUBLIC_PRIVY_CLIENT_ID`
- `PRIVY_APP_SECRET`

**x402**
- `X402_PAY_TO`

**Cron**
- `CRON_SECRET`

**App**
- `NEXT_PUBLIC_APP_URL`

**Migration (local only — do not deploy)**
- `SCENIUS_DATABASE_URL`
