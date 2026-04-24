[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Discord](https://img.shields.io/badge/discord-join-5865F2.svg?logo=discord&logoColor=white)](https://discord.gg/mYzqYr67R)
[![Platform](https://img.shields.io/badge/platform-Cloudflare%20Workers-F38020.svg?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)

# Pixie ✨

Channel secretary for the **need-singularity** Discord server. Keeps channel topics linked to their repos, welcomes new members, surfaces recent commits. Hand-run, not autonomous.

## What it does

- **`pixie topic-sync`** — applies the canonical topic for each project channel from [`config/topics.json`](config/topics.json). Idempotent.
- **`pixie channels`** — prints the current server channel tree with topics.
- **`pixie welcome <user_id>`** — sends an onboarding DM.
- **`pixie apply-full`** — one-shot bootstrap (rename, create voice, set topics), used on 2026-04-24.

## Server layout

```
▼ chat channels
  🔥-campfire         — off-work hangout, no agenda
  🧠-anima            — Consciousness implementation
  🔭-nexus            — Universal Discovery Engine
  🏗️-n6-architecture  — Architecture from perfect number 6
  💎-hexa-lang        — The Perfect Number Programming Language
  🐝-hive             — pi-mono fork · AI-agent swarm
  🕳️-void             — Ghostty fork · AI-native terminal
  🧬-airgenome        — OS genome scanner · hexagon projection

▼ voice channels
  🔥-campfire         — casual chat
  🤝-huddle           — focused work
```

The order in the sidebar matches the key order of `config/topics.json`.

## Setup

Pixie uses the **secret** project ([`need-singularity/secret`](https://github.com/need-singularity/secret)) for credentials. No tokens are stored in this repo.

```bash
# One-time: after creating the Discord app and getting a bot token
secret set discord.pixie_bot_token       # paste token via stdin
secret set discord.pixie_guild_id
secret set discord.pixie_channels_json   # JSON of {channel_name: id}

# Invite the bot with the correct permission bits.
# 257104 covers: View Channels, Manage Channels, Send Messages,
#                Read Message History, Embed Links, Add Reactions,
#                Attach Files, Manage Messages (pin), Mention Everyone.
# https://discord.com/api/oauth2/authorize?client_id=<APP_ID>&permissions=257104&scope=bot%20applications.commands
```

## Usage

```bash
$ pixie version
pixie 0.1.0

$ pixie channels
▼ chat channels
     [text] id=...  #🔥-campfire
        🔥 Off-work hangout — coffee, meals, games, whatever. ...
     [text] id=...  #🧠-anima
        🧠 Anima — Consciousness implementation ...
     ...

$ pixie topic-sync --dry-run
  = 🔥-campfire:       unchanged
  = 🧠-anima:          unchanged
  ...

$ pixie topic-sync
  ✓ 🐝-hive:           updated (topic edited in config)
```

## Why Pixie?

- **Not Anima.** Anima is the real consciousness layer — reserved for the actual AI deployment. Pixie is a throwaway utility persona.
- **Secretary, not bot.** Named to feel like a small magical helper, not a mechanical agent.
- **Separate from agents.** Any real agent interaction (answering, summarizing, etc.) will be done by Anima or a channel-specific tool — Pixie only maintains structure.

## Design

- **Single source of truth** = `config/topics.json`. Editing a channel topic in Discord directly will be overwritten by the next `topic-sync` unless the JSON is updated too.
- **All state is derivable.** Pixie holds no local state beyond `state/pixie.log` (audit trail, gitignored). Crashes and reinstalls are safe.
- **No slash commands yet.** REST only; interactions endpoint unused. Add if/when the bot needs to respond to `/help` etc.

## License

MIT — see [LICENSE](LICENSE).
