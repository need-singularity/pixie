import { verifyDiscord } from "./verify";
import { detectLang, target } from "./lang";
import { translate } from "./translator";
export { GatewayDO } from "./gateway";

export interface Env {
  GATEWAY: DurableObjectNamespace;
  DISCORD_PUBLIC_KEY: string;
  DISCORD_APP_ID: string;
  DISCORD_BOT_TOKEN: string;
  ANTHROPIC_API_KEY: string;
  AUTO_TRANSLATE: string;
  THREAD_NAME: string;
  MODEL: string;
}

const PING = 1;
const APP_CMD = 2;
const DEFERRED_EPHEMERAL = 1 << 6;

type ResolvedMessage = {
  content: string;
  message_snapshots?: { message: { content: string } }[];
};

type Interaction = {
  type: number;
  data?: {
    name: string;
    type?: number;
    target_id?: string;
    resolved?: { messages?: Record<string, ResolvedMessage> };
    options?: { name: string; value: string }[];
  };
  token: string;
  application_id: string;
};

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/" && req.method === "GET") {
      return new Response("discord-translator ok");
    }

    if (url.pathname === "/interactions" && req.method === "POST") {
      return handleInteraction(req, env, ctx);
    }

    return new Response("not found", { status: 404 });
  },

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const id = env.GATEWAY.idFromName("singleton");
    ctx.waitUntil(env.GATEWAY.get(id).fetch("https://do/ping").then(() => {}));
  },
};

async function handleInteraction(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const sig = req.headers.get("x-signature-ed25519");
  const ts = req.headers.get("x-signature-timestamp");
  const body = await req.text();
  if (!sig || !ts || !(await verifyDiscord(body, sig, ts, env.DISCORD_PUBLIC_KEY))) {
    return new Response("bad signature", { status: 401 });
  }

  const itx = JSON.parse(body) as Interaction;

  if (itx.type === PING) {
    return json({ type: 1 });
  }

  if (itx.type === APP_CMD) {
    const text = extractText(itx);
    if (!text) {
      return json({ type: 4, data: { content: "no text found", flags: DEFERRED_EPHEMERAL } });
    }
    ctx.waitUntil(followup(env, itx, text));
    return json({ type: 5, data: { flags: DEFERRED_EPHEMERAL } });
  }

  return json({ type: 4, data: { content: "unsupported", flags: DEFERRED_EPHEMERAL } });
}

function extractText(itx: Interaction): string | null {
  const d = itx.data;
  if (!d) return null;
  if (d.type === 3 && d.target_id && d.resolved?.messages) {
    const msg = d.resolved.messages[d.target_id];
    if (!msg) return null;
    return msg.content || msg.message_snapshots?.[0]?.message?.content || null;
  }
  const text = d.options?.find((o) => o.name === "text")?.value;
  return text ?? null;
}

async function followup(env: Env, itx: Interaction, text: string): Promise<void> {
  const src = detectLang(text);
  const to = target(src) ?? (src === "ko" ? "en" : "ko");
  const from = src === "other" ? (to === "ko" ? "en" : "ko") : src;

  let content: string;
  try {
    content = await translate(text, from, to, env.ANTHROPIC_API_KEY, env.MODEL);
  } catch (err) {
    content = `translate failed: ${(err as Error).message}`;
  }

  await fetch(
    `https://discord.com/api/v10/webhooks/${itx.application_id}/${itx.token}/messages/@original`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.slice(0, 2000) }),
    },
  );
}

function json(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}
