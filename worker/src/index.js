// Pixie ✨ Discord handler — Cloudflare Workers + Durable Object.
//
//   POST /                     — Discord interactions (slash commands)
//   POST /wake                 — keep GatewayDO WebSocket alive (cron + manual)
//   GET  /                     — hint page
//   scheduled (cron */2)       — wakes GatewayDO
//
// Long slash-command text: src/topics.js.  Short mention text: src/mentions.js.

import { LONG_TOPICS, ALIASES as SLASH_ALIASES, PROJECT_LIST } from "./topics.js";
export { GatewayDO } from "./gateway-do.js";

const PING = 1;
const APPLICATION_COMMAND = 2;
const RESP_PONG = 1;
const RESP_CHANNEL_MESSAGE_WITH_SOURCE = 4;
const EPHEMERAL = 64;

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

const j = (obj) => new Response(JSON.stringify(obj),
  { headers: { "content-type": "application/json" } });
const eph = (text) => j({
  type: RESP_CHANNEL_MESSAGE_WITH_SOURCE,
  data: { content: text, flags: EPHEMERAL },
});

function projectList() {
  return [
    "✨ Available projects:",
    ...PROJECT_LIST.map(p => `  • \`/explain ${p}\``),
    "",
    "aliases: `n6` → n6-architecture · `hexa` / `lang` → hexa-lang",
  ].join("\n");
}

function resolveSlashProject(raw) {
  if (!raw) return null;
  const key = raw.toLowerCase().trim();
  if (key in LONG_TOPICS) return key;
  if (key in SLASH_ALIASES) return SLASH_ALIASES[key];
  return null;
}

function handleCommand(interaction) {
  const name = interaction.data?.name;
  if (name === "ping") return eph("pong ✨");
  if (name === "explain") {
    const raw = interaction.data?.options?.[0]?.value;
    if (!raw) return eph(projectList());
    const key = resolveSlashProject(raw);
    if (!key) return eph(`Unknown project \`${raw}\`.\n\n${projectList()}`);
    return eph("```\n" + LONG_TOPICS[key] + "\n```");
  }
  return eph(`unknown command: ${name}`);
}

async function wakeGateway(env, reset = false) {
  const id = env.GATEWAY.idFromName("singleton");
  const stub = env.GATEWAY.get(id);
  const r = await stub.fetch(`https://do/wake${reset ? "?reset=1" : ""}`);
  return r;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Manual wake endpoint for debugging.
    // /wake?reset=1 clears circuit breaker + session for a fresh IDENTIFY.
    if (url.pathname === "/wake") {
      const reset = url.searchParams.get("reset") === "1";
      const r = await wakeGateway(env, reset);
      return new Response(await r.text(), { headers: r.headers });
    }

    if (request.method !== "POST") {
      return new Response(
        "pixie worker ✨ — POST Discord interactions here",
        { headers: { "content-type": "text/plain" } },
      );
    }

    // Discord interaction
    const ok = await verify(request, env.DISCORD_PUBLIC_KEY);
    if (!ok) return new Response("bad signature", { status: 401 });

    const interaction = await request.json();
    if (interaction.type === PING) {
      // Piggyback: Discord's PING is a fine excuse to wake the DO.
      ctx.waitUntil(wakeGateway(env).catch(() => {}));
      return j({ type: RESP_PONG });
    }
    if (interaction.type === APPLICATION_COMMAND) {
      return handleCommand(interaction);
    }
    return eph("unsupported interaction type");
  },

  async scheduled(event, env, ctx) {
    // Cron every 2 min — keep the Gateway WS alive.
    ctx.waitUntil(wakeGateway(env).catch(e => console.log("wake failed:", e)));
  },
};
