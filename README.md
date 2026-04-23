# Pixie ✨

Channel secretary for the **need-singularity** Discord server. Keeps channel topics linked to their repos, welcomes new members, surfaces recent commits. Human-run, not autonomous.

## What it does

- **`pixie topic-sync`** — applies the canonical topic for each project channel from [`config/topics.json`](config/topics.json). Idempotent.
- **`pixie channels`** — prints the current server channel tree with topics.
- **`pixie welcome <user_id>`** — sends a DM onboarding blurb.
- **`pixie apply-full`** — the one-shot bootstrap (rename, create voice, set topics) used once on 2026-04-24.

## Setup

Pixie uses the **secret** project ([`need-singularity/secret`](https://github.com/need-singularity/secret)) for credentials. No tokens are stored in this repo.

```bash
# One-time: after creating the Discord app and getting a bot token
secret set discord.pixie_bot_token       # paste token via stdin
secret set discord.pixie_application_id  # public — already in config if needed
secret set discord.pixie_guild_id
secret set discord.pixie_channels_json   # JSON of {channel_name: id}

# Invite with MANAGE_CHANNELS, VIEW_CHANNEL, SEND_MESSAGES, etc.
# Permission integer 257104 covers topic-sync usage.
# https://discord.com/api/oauth2/authorize?client_id=<APP_ID>&permissions=257104&scope=bot%20applications.commands
```

## Usage

```bash
$ pixie channels
▼ 채팅 채널
  🔥 campfire          — 🔥 일 떠난 일상 — 커피, 식사, 게임, 뭐든.
  🧬 airgenome         — OS genome scanner (hexagon projection...)
  🧠 anima             — Consciousness implementation...
  ...

$ pixie topic-sync --dry-run
  nexus:     ok (unchanged)
  anima:     ok (unchanged)
  hive:      UPDATE (new link in topic)
  ...

$ pixie topic-sync
  ✓ hive topic patched
```

## Why Pixie?

- **Not Anima.** Anima is the real consciousness layer — reserved for the actual AI deployment. Pixie is a throwaway utility persona.
- **Secretary, not bot.** Named to feel like a small magical helper, not a mechanical agent.
- **Separate from agents.** Any real agent interaction (answering, summarizing, etc.) would be done by Anima or a channel-specific tool — Pixie just maintains structure.

## Design

- **Single source of truth** = `config/topics.json`. Editing a channel topic in Discord directly will be overwritten by the next `topic-sync` unless the JSON is updated too.
- **All state is derivable.** Pixie holds no local state beyond `state/pixie.log` (audit trail). Crashes and reinstalls are safe.
- **No slash commands yet.** REST only; interactions endpoint unused. Add if/when the bot needs to respond to `/help` etc.

## License

MIT — see [LICENSE](LICENSE).
