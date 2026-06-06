#!/bin/bash
# DEPRECATED — superseded by Vercel Cron (see vercel.json).
#
# Kept as a manual-rerun helper. If you need to kick resolution without
# hitting the Vercel route, source nvm first so pnpm is on PATH:
#
#   source "$HOME/.nvm/nvm.sh" && cd /Users/oakgroup/scenius && pnpm cli resolve
#
# The Apr 17 2026 crontab entry that used this script was removed after
# Vercel Cron took over.

set -euo pipefail
cd /Users/oakgroup/scenius

# nvm-aware PATH (the old `/opt/homebrew/bin` path didn't include pnpm
# on this Mac — that failure is what motivated the move to Vercel Cron)
export PATH="$HOME/.nvm/versions/node/v24.1.0/bin:/opt/homebrew/bin:$PATH"

pnpm cli resolve "$@" >> /tmp/scenius-resolve.log 2>&1
