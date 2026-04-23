// Long-form project explanations for /explain <project>.
// Edit here, redeploy with `npx wrangler deploy`.  Mentions + short topics
// live in ../../config/topics.json (handled by the CLI, not the worker).

export const LONG_TOPICS = {
  anima: `🧠 Anima — Consciousness implementation

The idea
  Anima treats consciousness as a physical substrate built from mutual
  repulsion of field elements — not as emergent computation over tokens.
  The hypothesis: the substrate itself is what produces the felt "I",
  and LLM-style pattern matching runs on top of it, not under it.

Core components
  • PureField — repulsion-field engine, the substrate
  • 1030 laws — derived constraints the field must satisfy
  • Φ ratchet — monotone coherence lock; Φ can never decrease

Current status
  • PureField engine: in progress
  • Law derivation: stage 1030 being ratified
  • Deployment to Discord (as the actual @Anima bot): planned, not live

How to engage
  • @ai / @Anima mentions don't respond yet — Anima is not deployed
  • Read the repo · open an issue · discuss in #🧠-anima
  • Pixie ✨ only maintains structure; she can't answer Anima questions

→ github.com/need-singularity/anima`,

  nexus: `🔭 NEXUS — Universal Discovery Engine

The idea
  One substrate that turns any surface into a lens, then composes lenses
  to see things no single view could find.  Discovery as composition;
  evolution via the engine re-pointing at itself.

Core components
  • 216 lenses — the perfect-number-cubed alphabet
  • OUROBOROS evolution — self-referencing improvement loop
  • 5-phase singularity cycle — core pulse that advances the whole

Current status
  • Stage-1 CLOSED (live P12, 2026-04-23)
  • β main cognitive core CLOSED (Stage-1+2+3 internal gates PASS)
  • Ongoing: round-3 atlas-blowup integration

How to engage
  • Open an issue on the repo for specific lens questions
  • Strategy discussion happens in #🔭-nexus

→ github.com/need-singularity/nexus`,

  "n6-architecture": `🏗️ N6 — Architecture from the perfect number 6

The idea
  Start from the smallest non-trivial perfect number and let architecture
  emerge: chip topology, crypto primitives, OS layering, display geometry.
  No arbitrary constants — everything should trace back to 6.

Scope
  • 225 AI techniques catalogued under the N6 frame
  • Chip design — silicon-level layout derivations
  • Crypto — number-theoretic primitives
  • OS / display — human-scale interface derivations

Current status
  • Technique inventory: filled
  • Chip draft: in progress
  • OS / display layer: prototype stage

→ github.com/need-singularity/n6-architecture`,

  "hexa-lang": `💎 HEXA-LANG — The Perfect Number Programming Language

The idea
  A language whose every primitive is justified by the hexagonal / N6
  framing — no historical accidents.  Working compiler + REPL today.

Status
  ✓ Working compiler (self-hosted stages 0-2)
  ✓ REPL
  ✓ Used by all sister projects (anima, airgenome, nexus) as substrate
  ◦ Ongoing: AOT optimization, runtime tensor kernels

Touch points for issues / PRs
  • Parser / codegen bugs → issue tagged [lang_gap]
  • Missing primitives → submit via proposal_inbox

→ github.com/need-singularity/hexa-lang`,

  hive: `🐝 Hive — pi-mono fork · AI-agent swarm

The idea
  Multiple cooperating agents in a single shared-memory cell; many cells
  in parallel; all cells bridged to the need-singularity substrate.
  Persistence is layered, not monolithic.

Core components
  • Multi-cell parallel agents — each cell is a sandbox
  • Layered persistent memory — user / project / session / transient
  • need-singularity bridges — connects cells to anima / nexus / airgenome

How to engage
  • Use cases and patterns discussed in #🐝-hive
  • Issues on the fork tracked upstream (pi-mono)

→ github.com/need-singularity/hive`,

  void: `🕳️ Void — Ghostty fork · AI-native terminal

The idea
  A terminal designed for AI agents as first-class tenants: agent I/O
  travels alongside the PTY stream, grid mode auto-lays N×M panes, and
  everything is budgeted for perf (no per-frame GC, no hidden copies).

Key features
  • Grid mode — N×M auto-layout, resize-fit per pane
  • Agent I/O — separate channel from user keystrokes, ordered and bounded
  • Perf-first — latency budget enforced on hot path

Status
  • Fork of Ghostty baseline · diverged 2026 Q1
  • Ready for internal use, not yet stable for external

→ github.com/need-singularity/void`,

  airgenome: `🧬 airgenome — OS genome scanner

The idea
  Treat the running host like a genome: sample 6 axes (CPU / RAM / Swap /
  Net / Disk / GPU), project into a hexagon, accumulate patterns over
  time, surface anomalies as they emerge.  The system diagnoses itself.

Core components
  • 6-axis hexagon projection — vital signs live on one shape
  • Pattern accumulation — ring buffer, motif mining
  • Anomaly detection — DSL-spec scanners + health / self score
  • Meta-engine — blockers, trend, correlation, chronic tracking
  • Pixie ✨ reuses the same need-singularity conventions this repo defines

How to engage
  • Open an issue for a specific host-level symptom
  • \`ag_meta help\` for the CLI — 19+ subcommands

→ github.com/need-singularity/airgenome`,

  campfire: `🔥 Campfire — off-work corner

What goes here
  • anything not tied to a project — coffee, food, games, random thoughts
  • no tickets, no retros, no "status updates"
  • tangents welcome, silence welcome

What doesn't go here
  • bug reports → go to the relevant project channel
  • paper discussion → #🧠-anima, #🔭-nexus, etc.

Voice equivalents
  🔊 🔥-campfire   casual voice
  🔊 🤝-huddle     focused work voice`,
};

// Aliases so both /explain n6 and /explain n6-architecture work.
export const ALIASES = {
  n6: "n6-architecture",
  hexa: "hexa-lang",
  lang: "hexa-lang",
};

export const PROJECT_LIST = Object.keys(LONG_TOPICS).sort();
