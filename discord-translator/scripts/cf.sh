#!/usr/bin/env bash
# wrangler wrapper — injects CF auth from ~/core/secret.
# Usage: ./scripts/cf.sh <wrangler-subcommand> [args...]
set -euo pipefail

SECRET="${HOME}/core/secret/bin/secret"
[ -x "$SECRET" ] || { echo "secret CLI not found at $SECRET" >&2; exit 1; }

export CLOUDFLARE_API_TOKEN="$("$SECRET" get cloudflare.api_token)"
export CLOUDFLARE_ACCOUNT_ID="$("$SECRET" get cloudflare.account_id)"

cd "$(dirname "$0")/.."
exec npx wrangler "$@"
