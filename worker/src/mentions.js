// Short replies used by GatewayDO when @Pixie / @ai / !pixie is mentioned.
// Kept separate from topics.js so slash-command content stays untouched.

export const SHORT_TAGLINES = {
  anima:             "🧠 Anima — Consciousness implementation (PureField + 1030 laws + Φ ratchet).",
  nexus:             "🔭 NEXUS — Universal Discovery Engine (216 lenses + OUROBOROS + 5-phase cycle).",
  "n6-architecture": "🏗️ N6 — Architecture from the perfect number 6 (225 AI techniques · chip / OS / crypto).",
  "hexa-lang":       "💎 HEXA-LANG — The Perfect Number Programming Language (working compiler + REPL).",
  hive:              "🐝 Hive — pi-mono fork · AI-agent swarm (multi-cell + layered memory + bridges).",
  void:              "🕳️ Void — Ghostty fork · AI-native terminal (grid mode + agent I/O + perf-first).",
  airgenome:         "🧬 airgenome — OS genome scanner (6-axis hexagon projection + anomaly detection).",
  campfire:          "🔥 Campfire — off-work corner, no agenda.",
};

const ALIASES = {
  n6: "n6-architecture",
  hexa: "hexa-lang",
  lang: "hexa-lang",
};

const PROJECT_RE = /(?:explain|what(?:'s)?|about|tell\s+me\s+about)\s+(?<p>[a-z0-9\-]+)/i;

export function resolveProject(text) {
  const m = text.match(PROJECT_RE);
  if (!m) return null;
  let p = m.groups.p.toLowerCase().replace(/[?!.,]+$/, "");
  if (p in SHORT_TAGLINES) return p;
  if (p in ALIASES) return ALIASES[p];
  if (p.replace(/s$/, "") in SHORT_TAGLINES) return p.replace(/s$/, "");
  return null;
}

export function SHORT_REPLY(project) {
  if (!project) {
    return "✨ use `/explain <project>` for a full write-up " +
           "(ephemeral — only you see it).\n" +
           "projects: `anima`, `nexus`, `n6-architecture`, `hexa-lang`, " +
           "`hive`, `void`, `airgenome`, `campfire`.";
  }
  return `${SHORT_TAGLINES[project]}\nfull: \`/explain ${project}\``;
}
