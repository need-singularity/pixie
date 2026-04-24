#!/usr/bin/env bash
# Generate .dev.vars from ~/core/secret — never commit .dev.vars.
set -euo pipefail

SECRET="${HOME}/core/secret/bin/secret"
OUT="$(cd "$(dirname "$0")/.." && pwd)/.dev.vars"

[ -x "$SECRET" ] || { echo "secret CLI not found at $SECRET" >&2; exit 1; }

umask 077
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

{
  printf 'DISCORD_PUBLIC_KEY=%s\n' "$("$SECRET" get discord.pixie_public_key)"
  printf 'DISCORD_APP_ID=%s\n'     "$("$SECRET" get discord.pixie_application_id)"
  printf 'DISCORD_BOT_TOKEN=%s\n'  "$("$SECRET" get discord.pixie_bot_token)"
  printf 'ANTHROPIC_API_KEY=%s\n'  "$("$SECRET" get anthropic.api_key)"
} > "$tmp"

mv "$tmp" "$OUT"
chmod 600 "$OUT"
trap - EXIT

echo ".dev.vars written ($(wc -l < "$OUT" | tr -d ' ') keys, mode 600)"
