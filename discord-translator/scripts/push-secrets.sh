#!/usr/bin/env bash
# Push secrets from ~/core/secret to Cloudflare Workers.
# Run after: `npm run deploy` (worker must exist first).
set -euo pipefail

SECRET="${HOME}/core/secret/bin/secret"
cd "$(dirname "$0")/.."

[ -x "$SECRET" ] || { echo "secret CLI not found at $SECRET" >&2; exit 1; }

export CLOUDFLARE_API_TOKEN="$("$SECRET" get cloudflare.api_token)"
export CLOUDFLARE_ACCOUNT_ID="$("$SECRET" get cloudflare.account_id)"

push() {
  local name="$1" key="$2"
  printf '→ %s ... ' "$name"
  "$SECRET" get "$key" | npx wrangler secret put "$name" >/dev/null 2>&1 \
    && echo "ok" \
    || { echo "FAIL"; exit 1; }
}

push DISCORD_PUBLIC_KEY discord.pixie_public_key
push DISCORD_APP_ID     discord.pixie_application_id
push DISCORD_BOT_TOKEN  discord.pixie_bot_token
push ANTHROPIC_API_KEY  anthropic.api_key

echo "all 4 secrets pushed to Cloudflare"
