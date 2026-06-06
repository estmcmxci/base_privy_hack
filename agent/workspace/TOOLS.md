# TOOLS

## Privy Agent Wallet CLI
The agent holds a Privy-managed wallet (ETH + SOL) and pays for x402-gated
resources from it. The CLI is installed at build time
(`npm install -g @privy-io/agent-wallet-cli`).

| Command | What it does |
| --- | --- |
| `privy-agent-wallet login --non-interactive` | Device-grant auth; provisions ETH + SOL wallets. Run at start. |
| `privy-agent-wallet fund` | Human funds the wallet. Needs **testnet USDC on Base Sepolia**. |
| `privy-agent-wallet list-wallets` | Show wallet addresses + balances. |
| `privy-agent-wallet fetch-x402 <url> --max-value <usdc-base-units>` | GET a URL; if the server returns HTTP 402, pay automatically and retry. `--max-value` caps spend (base units, 6 decimals; default `1000000` = 1 USDC). |
| `privy-agent-wallet rpc --json '{...}'` | Low-level signed RPC call. |

### Notes on `fetch-x402`
- **HTTPS-only.** It refuses `localhost` and private IPs. The target must be a
  public HTTPS URL.
- **Network is server-driven.** The 402 response declares the network
  (base.privy uses Base Sepolia, `eip155:84532`). No network flag is needed.
- **Budget is `--max-value` in base units.** USDC has 6 decimals, so:
  - `100000` = 0.10 USDC
  - `250000` = 0.25 USDC
  - `1000000` = 1.00 USDC
  If the price exceeds `--max-value`, the call fails instead of overpaying. Good.

## Query the Tastemaker Signal
base.privy exposes the credibility signal over HTTP. The endpoints are
**x402-gated** — every read costs USDC on Base Sepolia.

`BASE_PRIVY_URL` is the **public HTTPS deploy** of base.privy. All queries are
relative to it.

### Endpoints
| Endpoint | Returns |
| --- | --- |
| `GET {BASE_PRIVY_URL}/api/watchlist` | The current ranked set of credible emerging artists, per aggregated tastemaker signal. |
| `GET {BASE_PRIVY_URL}/api/consensus?artistId=<id>` | The consensus / credibility detail for one artist. |

### Pay for a query
```sh
# Top of the funnel: the ranked watchlist (cap spend at 0.10 USDC)
privy-agent-wallet fetch-x402 "$BASE_PRIVY_URL/api/watchlist" --max-value 100000

# Drill into one artist's consensus (cap spend at 0.10 USDC)
privy-agent-wallet fetch-x402 "$BASE_PRIVY_URL/api/consensus?artistId=ARTIST_ID" --max-value 100000
```

Always pass `--max-value`. Never query an endpoint without a cap.
