# TAPE-AUDIT — pixie

> Audit-class survey for `.tape` adoption (typed events + provenance edges + delivery grade).

## A. Audit-class ledgers
**CARGO only.** `state/markers/{pixie_self_mk2_tuning_landed,pixie_rank_a_2_domain_landed}.marker` — two run-once landed markers, pure cargo. No `.jsonl` event ledgers, no `audit/` dir.

## B. Identity surface
**Discord channel identity** + **server-member identity** are the explicit surfaces — pixie keeps channel topics linked to repos and welcomes new members. These are external (Discord-side) identities, not pixie's own.

## C. Domain.md files
Minimal: `AGENTS.md`, `CLAUDE.md`, `README.md`. README says "hand-run, not autonomous" — no historized event surface intended.

## D. Per-run / per-event history
None. Pixie is a one-shot bot — each run posts welcomes / refreshes topics, no per-run ledger kept.

## E. Promotion candidates
- **`.tape` events (LOW)**: per-welcome / per-topic-refresh could be `@R` events, but they'd be one-off and low-value (Discord's audit log already exists).
- **n6 atoms (LOW)**: channel ↔ repo mapping is atom-shaped but small + already in config.
- **n12 cube**: not applicable.
- **hxc wire**: not applicable.

## Verdict
**LIGHT** — pixie is a Cloudflare Worker bot with no event-ledger surface. Markers are cargo. Not a `.tape` adoption candidate.
