# discord-translator

A Discord translation bot for Korean ↔ English, running on Cloudflare
Workers with Claude Haiku 4.5 as the translation engine.

## Features

| Trigger | Where | Output |
| --- | --- | --- |
| `/translate text: ...` slash command | any channel / thread | ephemeral reply (visible only to you) |
| Right-click → Apps → **Translate** | any message | ephemeral reply |
| Any Korean or English message | any channel / thread | auto-translated into a new thread (or inline reply if already in a thread) |
| 🇰🇷 / 🇺🇸 / 🇬🇧 reaction on a message | any message | translation into a thread (or inline reply) |

Language detection is a cheap Hangul unicode check plus an ASCII-ratio
heuristic (`src/lang.ts`). Translation is one `messages.create` call to
Claude Haiku 4.5 with a system prompt that preserves mentions and emoji.

## Architecture

```
                 ┌────────────────────────────────────────────┐
Discord ─HTTP──▶ │  Worker (src/index.ts)                     │
(interactions)   │    POST /interactions                      │
                 │      ├─ Ed25519 signature verify           │
                 │      ├─ PING → PONG                        │
                 │      └─ APPLICATION_COMMAND                │
                 │           → translate() → PATCH @original  │
                 │                                            │
   every 1 min ▶ │  scheduled()                               │
   (cron)        │    → GATEWAY.get("singleton").fetch(/ping) │
                 └────────────────┬───────────────────────────┘
                                  │
                 ┌────────────────▼───────────────────────────┐
Discord ─WSS───▶ │  Durable Object (src/gateway.ts)           │
(gateway)        │    GatewayDO                               │
                 │      ├─ connect / resume                   │
                 │      ├─ heartbeat (DO alarm)               │
                 │      ├─ MESSAGE_CREATE → translate + post  │
                 │      └─ MESSAGE_REACTION_ADD (flag emoji)  │
                 └────────────────────────────────────────────┘
```

The cron keeps the Gateway Durable Object warm; it doesn't rely on user
traffic to stay connected. Discord sessions that drop resume via
`resume_gateway_url`.

## Requirements

- Cloudflare Workers **paid plan** ($5/month) — Durable Objects require it.
- A Discord application with:
  - `MESSAGE CONTENT INTENT` enabled (privileged — required for auto-translate).
  - The bot invited to your server with `Send Messages`, `Create Public
    Threads`, `Read Message History`, and `Add Reactions`.
- An Anthropic API key.

## Secrets

This repo expects a centralized credential store at `~/core/secret/`
(bash script `secret` CLI; TOML-backed). The expected keys are:

| Store key | Worker var |
| --- | --- |
| `discord.pixie_public_key` | `DISCORD_PUBLIC_KEY` |
| `discord.pixie_application_id` | `DISCORD_APP_ID` |
| `discord.pixie_bot_token` | `DISCORD_BOT_TOKEN` |
| `anthropic.api_key` | `ANTHROPIC_API_KEY` |
| `cloudflare.api_token` | (used by wrangler) |
| `cloudflare.account_id` | (used by wrangler) |

If you don't have the `secret` CLI, just create a `.dev.vars` file by
hand (see `.dev.vars.example`) and run `wrangler secret put` yourself
for each Worker var. The scripts under `scripts/` are convenience, not
required.

## Scripts

```sh
npm run sync            # generate .dev.vars from ~/core/secret
npm run dev             # wrangler dev (with sync)
npm run deploy          # wrangler deploy
npm run push-secrets    # push all 4 secrets to the deployed Worker
npm run register        # register /translate + "Translate" context menu
npm run tail            # live logs from the deployed Worker
npm run whoami          # confirm Cloudflare auth
npm run cf -- <args>    # run wrangler with CF auth injected
```

## First deploy

```sh
npm install
npm run deploy           # creates the Worker (will 404 its endpoint until secrets + intents URL are set)
npm run push-secrets     # injects DISCORD_* + ANTHROPIC_API_KEY
npm run register         # registers slash + context menu commands

# Set the Interactions Endpoint URL on your Discord app (one-time):
# Dev Portal → your app → General Information →
#   Interactions Endpoint URL = https://<worker-subdomain>.workers.dev/interactions
```

Or via API (bot token required):

```sh
TOKEN="$(~/core/secret/bin/secret get discord.pixie_bot_token)"
curl -X PATCH https://discord.com/api/v10/applications/@me \
  -H "Authorization: Bot $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"interactions_endpoint_url":"https://<worker-subdomain>.workers.dev/interactions"}'
```

Cloudflare's Discord will PING that URL immediately; if Ed25519
verification or PONG response is wrong the save is rejected.

## Configuration

`wrangler.toml` has non-secret knobs under `[vars]`:

| Var | Default | Purpose |
| --- | --- | --- |
| `AUTO_TRANSLATE` | `"true"` | Set to `"false"` to disable the MESSAGE_CREATE auto-translate path (reactions and slash still work). |
| `THREAD_NAME` | `"translation"` | Name used when creating a translation thread. |
| `MODEL` | `claude-haiku-4-5-20251001` | Claude model ID. |

## Files

```
src/
  index.ts        Worker entry (Interactions + scheduled)
  gateway.ts      Durable Object: Gateway WebSocket + dispatch handling
  translator.ts   Claude API wrapper
  discord.ts      REST helpers (threads, messages, replies)
  lang.ts         Hangul-aware language detection
  verify.ts       Ed25519 signature verification
  register.ts     One-off command registration script (run via tsx)
scripts/
  sync-dev-vars.sh   ~/core/secret → .dev.vars
  push-secrets.sh    ~/core/secret → wrangler secret put
  cf.sh              wrangler wrapper that injects CF auth
```

## Troubleshooting

- **401 on `/users/@me` with the bot token** — token has been rotated
  or revoked. Reset it in the Bot tab of the Dev Portal and re-save
  via `secret set discord.pixie_bot_token`.
- **Auto-translate doesn't fire** — `MESSAGE CONTENT INTENT` is off.
  Gateway receives messages but `content` is an empty string.
- **Interactions endpoint save fails on Discord** — Worker isn't
  deployed yet, or `DISCORD_PUBLIC_KEY` wasn't pushed, or the URL is
  wrong. Check `npm run tail` while clicking Save on the Dev Portal.
- **DO heartbeat zombie** — the code already reconnects when a
  heartbeat ACK is missed; check `tail` for `zombie` close codes.

## Costs

- Workers Paid plan: $5/month baseline.
- Durable Objects: usage-based; a single warm GatewayDO is well inside
  the included quota.
- Anthropic Haiku 4.5: roughly $1/1M input tokens. A short chat message
  is ~20 tokens; a day of heavy chatter is typically well under $1.
