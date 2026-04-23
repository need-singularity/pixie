// Pixie ✨ Discord interactions handler (Cloudflare Workers).
//
// Handles:
//   /explain           — ephemeral project list
//   /explain <project> — ephemeral long explanation
//   /ping              — health check
//
// Long content lives in topics.js.  Short channel topics are managed by
// the CLI (`pixie topic-sync`) and NOT touched here — keeps concerns clean.

import { LONG_TOPICS, ALIASES, PROJECT_LIST } from "./topics.js";

// Interaction types
const PING = 1;
const APPLICATION_COMMAND = 2;

// Response types
const RESP_PONG = 1;
const RESP_CHANNEL_MESSAGE_WITH_SOURCE = 4;

// Flag: 1 << 6 = 64 = EPHEMERAL
const EPHEMERAL = 64;

// Ed25519 verification using Web Crypto — no external lib needed.
async function verify(request, publicKey) {
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  const body = await request.clone().text();
  if (!signature || !timestamp) return false;
  const sigBytes = hex2bytes(signature);
  const keyBytes = hex2bytes(publicKey);
  const data = new TextEncoder().encode(timestamp + body);
  const key = await crypto.subtle.importKey(
    "raw", keyBytes, { name: "Ed25519" }, false, ["verify"]
  );
  return crypto.subtle.verify("Ed25519", key, sigBytes, data);
}

function hex2bytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function respond(obj) {
  return new Response(JSON.stringify(obj), {
    headers: { "content-type": "application/json" },
  });
}

function ephemeral(text) {
  return respond({
    type: RESP_CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: text, flags: EPHEMERAL },
  });
}

function publicMsg(text) {
  return respond({
    type: RESP_CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: text },
  });
}

function projectList() {
  const lines = PROJECT_LIST.map(p => `  • \`/explain ${p}\``);
  return [
    "✨ Available projects:",
    ...lines,
    "",
    "aliases: `n6` → n6-architecture · `hexa` / `lang` → hexa-lang",
  ].join("\n");
}

function resolveProject(raw) {
  if (!raw) return null;
  const key = raw.toLowerCase().trim();
  if (key in LONG_TOPICS) return key;
  if (key in ALIASES) return ALIASES[key];
  return null;
}

async function handleCommand(interaction) {
  const name = interaction.data?.name;

  if (name === "ping") {
    return ephemeral("pong ✨");
  }

  if (name === "explain") {
    const raw = interaction.data?.options?.[0]?.value;
    if (!raw) return ephemeral(projectList());
    const key = resolveProject(raw);
    if (!key) {
      return ephemeral(`Unknown project \`${raw}\`.\n\n${projectList()}`);
    }
    const body = LONG_TOPICS[key];
    // Discord message content cap = 2000 chars.  All of ours fit.
    return ephemeral("```\n" + body + "\n```");
  }

  return ephemeral(`unknown command: ${name}`);
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("pixie worker ✨ — POST Discord interactions here", {
        headers: { "content-type": "text/plain" },
      });
    }

    const ok = await verify(request, env.DISCORD_PUBLIC_KEY);
    if (!ok) return new Response("bad signature", { status: 401 });

    const interaction = await request.json();

    if (interaction.type === PING) return respond({ type: RESP_PONG });
    if (interaction.type === APPLICATION_COMMAND) {
      return handleCommand(interaction);
    }

    return ephemeral("unsupported interaction type");
  },
};
