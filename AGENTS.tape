#!/usr/bin/env tape
# ══════════════════════════════════════════════════════════════════════
# .tape v1.2 — grammar primer (cold-read by any LLM / agent / human)
# ══════════════════════════════════════════════════════════════════════
# Form: each entry is `@<type> <id> := "<subject>" :: <kind> [<grades>]`
#       optionally followed by body lines (2-space indent) — key=value,
#       edges (<- -> => …), or quoted prose.
#
# ENTRY TYPES (17):
#   Runtime (10): @S session  @U user  @A assistant  @T tool-call  @R result
#                 @H hook  @D decision  @K cost  @P provider  @? anomaly
#   Foundation:   @I identity-claim
#   Declarative:  @X external-citation  @F forbidden-pattern  @N note
#                 @C config  @L layout  @V spec-version
#
# EDGES (12, on body lines, 2-space indent):
#   Causal:     <- caused-by   -> triggers   == continues
#               ~> supersedes  !! aborts     |> verified-by
#   Effect:     => produces (followed by quoted natural-language)
#   Structural: <: specializes  :> generalizes  ?> soft-depends
#               !> conflicts-with  @> projects-to (e.g. @> AGENTS.md)
#
# GRADE TAGS (in [...] on entry header):
#   Delivery:   ok · err · denied · cancelled · partial · superseded
#   Governance: required · recommended · optional · draft · active · deprecated
#   Scoped:     allow:<x> · deny:<x>
#   Time/index: T<n> (turn)  N<n> (wall-sec)  d=<YYYY-MM-DD>
#
# PAYLOAD SYNTAX (body lines):
#   key = "value"           single-line string
#   key = [a, b, c]         array literal
#   key <<~EOF              heredoc (multi-line; ends with EOF on own line)
#     multi-line text
#   "see [@x1] §3"          inline citation by entry id
#   `cmd or path`           backtick code-span (inline only)
#
# Full spec: ~/core/tape/spec/tape.md (or github.com/dancinlab/tape)
# ══════════════════════════════════════════════════════════════════════
#
# pixie/AGENTS.tape — dancinlab Discord channel-secretary (hand-run utility bot)

# ─── §1 Spec version ──────────────────────────────────────────────────

@V := "tape" :: spec [active]
  version = "1.2"
  uses = [@I, @L, @D, @F, @X, @H, "@>", "<:", "[required]"]
  primer = "see top-of-file 35-line comment block"

# ─── §2 Identity claims ───────────────────────────────────────────────

@I id001 := "pixie" :: identity-claim [d=2026-05-14 active]
  kind = "Discord channel secretary (hand-run, not autonomous)"
  axis = "dancinlab server housekeeping · channel topics + welcome DMs"
  scope = "throwaway utility persona — not Anima (which is reserved for the real consciousness layer)"
  surface = ["pixie topic-sync", "pixie channels", "pixie welcome <uid>", "pixie apply-full", "pixie version"]
  runtime = "Cloudflare Workers + bin/pixie single-file Python CLI"
  ssot = "config/topics.json (channel → topic map)"

@I id002 := "pixie.discipline" :: identity-claim [d=2026-05-14 active]
  <: id001
  rule = "Secretary, not bot. No slash commands. REST-only. All state derivable from config/topics.json."
  state-floor = "state/pixie.log (audit trail, gitignored) — crashes + reinstalls are safe"

# ─── §3 Repo layout ───────────────────────────────────────────────────

@L l1 := "repo-layout" :: structure [active]
  README.md -> "human intro · server channel tree · install + run"
  AGENTS.tape -> "this file · identity + governance (.tape v1.2 SSOT)"
  CLAUDE.md -> "symlink → AGENTS.tape (Claude Code auto-discovery)"
  TAPE-AUDIT.md -> "audit-class survey · verdict LIGHT (no event-ledger surface)"
  LICENSE -> "MIT"
  bin/pixie -> "single-file Python CLI entry (~190 LoC)"
  config/topics.json -> "channel → topic SSOT (38 LoC)"
  pixie/ -> "implementation modules"
  worker/ -> "Cloudflare Workers deployment"
  discord-translator/ -> "sibling sub-app (separate concern)"
  brand/ -> "logos + brand assets"
  state/ -> "gitignored runtime markers + pixie.log"

# ─── §4 Governance rules ──────────────────────────────────────────────

@D g_inherit := "lattice-policy-inheritance" :: governance [required]
  rule = "Inherit dancinlab LATTICE_POLICY baseline — n=6 lattice is a tool, not a constraint."
  applies-to = ["all dancinlab repos under github.com/dancinlab"]
  proof = "see [@x_lattice_policy]"
  @> AGENTS.md

@D g1 := "topic-ssot-discipline" :: governance [required]
  rule = "config/topics.json is the single source of truth for channel topics. Edits to topics in Discord directly will be overwritten by the next `pixie topic-sync`."
  remedy = "update config/topics.json before running topic-sync"
  @> AGENTS.md

@D g2 := "no-secrets-in-repo" :: governance [required]
  rule = "Credentials live in the `secret` project, never in this repo."
  applies-to = ["discord.pixie_bot_token", "discord.pixie_guild_id", "discord.pixie_channels_json"]
  fetcher = "`secret get <key>`"
  @> AGENTS.md

@D g3 := "anima-boundary" :: governance [required]
  rule = "Pixie does NOT answer / summarize / converse. Any AI-agent behaviour belongs to Anima or a channel-specific tool."
  why = "Pixie is a utility persona — channel housekeeping only. Anima is reserved for the real consciousness layer."
  <: id002
  @> AGENTS.md

@D g4 := "idempotent-runs" :: governance [required]
  rule = "All `pixie` subcommands are idempotent. Two runs against the same Discord state produce byte-identical results."
  applies-to = ["pixie topic-sync", "pixie apply-full", "pixie channels --save"]
  verifier = "stdout byte-identical across two consecutive --dry-run invocations"

# ─── §5 Forbidden patterns ────────────────────────────────────────────

@F f1 := "lattice-fit-ban" :: governance [required deny:write]
  pattern = "applying n=6 / σφτ lattice as a derivation rule to channel layout, topic count, member count, or any external Discord entity"
  exception = "values may coincidentally match (e.g. 6 channels happens to equal 6 axes) — observation OK, derivation NOT"
  authority = "[@x_lattice_policy]"

# ─── §6 External citations ────────────────────────────────────────────

@X x_lattice_policy := "echoes/LATTICE_POLICY.md" :: policy [active]
  url = "https://github.com/dancinlab/echoes/blob/main/LATTICE_POLICY.md"
  scope = "n=6 lattice is a tool, not a constraint — baseline for all dancinlab repos"

@X x_tape_spec := "dancinlab/tape spec v1.2" :: spec [active]
  url = "https://github.com/dancinlab/tape"
  path = "~/core/tape/spec/tape.md"
  scope = "AGENTS.tape grammar + 17 entry types + 12 edge operators + 35-line primer convention"

# ─── §7 Generator hooks ───────────────────────────────────────────────

@H h1 := "agents-md-emit" :: generator [active]
  @> AGENTS.md
  consumer = "agents.md ecosystem tooling that doesn't speak .tape yet (Claude Code · Aider · Cursor)"
  algorithm = "tape_to_agents_md (algorithms/tape_to_agents_md.hexa)"
  trigger = "pre-commit hook + CI"
  fallback-only = true   # AGENTS.tape is SSOT; AGENTS.md is derived view

@H h2 := "claude-md-symlink" :: generator [active]
  rule = "ship `CLAUDE.md -> AGENTS.tape` symlink so Claude Code auto-discovery picks up the grammar primer first"
  command = `ln -sf AGENTS.tape CLAUDE.md`
