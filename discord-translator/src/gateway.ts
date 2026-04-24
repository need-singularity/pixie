import type { Env } from "./index";
import { detectLang, target, type Lang } from "./lang";
import { translate } from "./translator";
import { getMessage, postTranslation } from "./discord";

const GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json";

// Intents: GUILDS | GUILD_MESSAGES | GUILD_MESSAGE_REACTIONS | MESSAGE_CONTENT
const INTENTS = (1 << 0) | (1 << 9) | (1 << 10) | (1 << 15);

const FLAG_TO_LANG: Record<string, Lang> = {
  "🇰🇷": "ko",
  "🇺🇸": "en",
  "🇬🇧": "en",
};

type Payload = { op: number; d: unknown; s: number | null; t: string | null };

export class GatewayDO {
  private ws?: WebSocket;
  private seq: number | null = null;
  private sessionId: string | null = null;
  private resumeUrl: string | null = null;
  private heartbeatMs = 41250;
  private lastAck = true;

  constructor(
    private state: DurableObjectState,
    private env: Env,
  ) {}

  async fetch(_req: Request): Promise<Response> {
    if (!this.ws || this.ws.readyState !== 1) {
      await this.connect();
    }
    return new Response("ok");
  }

  async alarm(): Promise<void> {
    if (!this.ws || this.ws.readyState !== 1) {
      await this.connect();
      return;
    }
    if (!this.lastAck) {
      this.ws.close(4000, "zombie");
      await this.connect();
      return;
    }
    this.lastAck = false;
    this.ws.send(JSON.stringify({ op: 1, d: this.seq }));
    await this.state.storage.setAlarm(Date.now() + this.heartbeatMs);
  }

  private async connect(): Promise<void> {
    const url = this.resumeUrl
      ? `${this.resumeUrl}/?v=10&encoding=json`
      : GATEWAY_URL;

    const resp = await fetch(url.replace(/^ws/, "http"), {
      headers: { Upgrade: "websocket" },
    });
    const ws = resp.webSocket;
    if (!ws) throw new Error("no webSocket on response");
    ws.accept();
    this.ws = ws;
    this.lastAck = true;

    ws.addEventListener("message", (e) => {
      this.onMessage(typeof e.data === "string" ? e.data : "").catch(() => {});
    });
    ws.addEventListener("close", () => {
      this.ws = undefined;
    });
  }

  private async onMessage(raw: string): Promise<void> {
    if (!raw) return;
    const p = JSON.parse(raw) as Payload;
    if (p.s !== null) this.seq = p.s;

    switch (p.op) {
      case 10: { // HELLO
        const hello = p.d as { heartbeat_interval: number };
        this.heartbeatMs = hello.heartbeat_interval;
        await this.state.storage.setAlarm(Date.now() + Math.floor(this.heartbeatMs * Math.random()));
        if (this.sessionId && this.resumeUrl) this.sendResume();
        else this.sendIdentify();
        break;
      }
      case 11: // HEARTBEAT ACK
        this.lastAck = true;
        break;
      case 1: // HEARTBEAT request
        this.ws?.send(JSON.stringify({ op: 1, d: this.seq }));
        break;
      case 7: // RECONNECT
        this.ws?.close(4000, "reconnect");
        break;
      case 9: { // INVALID SESSION
        this.sessionId = null;
        this.resumeUrl = null;
        await sleep(2000);
        this.sendIdentify();
        break;
      }
      case 0: // DISPATCH
        await this.onDispatch(p.t!, p.d);
        break;
    }
  }

  private sendIdentify(): void {
    this.ws?.send(JSON.stringify({
      op: 2,
      d: {
        token: this.env.DISCORD_BOT_TOKEN,
        intents: INTENTS,
        properties: { os: "linux", browser: "cf-worker", device: "cf-worker" },
      },
    }));
  }

  private sendResume(): void {
    this.ws?.send(JSON.stringify({
      op: 6,
      d: {
        token: this.env.DISCORD_BOT_TOKEN,
        session_id: this.sessionId,
        seq: this.seq,
      },
    }));
  }

  private async onDispatch(event: string, d: unknown): Promise<void> {
    if (event === "READY") {
      const r = d as { session_id: string; resume_gateway_url: string };
      this.sessionId = r.session_id;
      this.resumeUrl = r.resume_gateway_url;
      return;
    }

    if (event === "MESSAGE_CREATE" && this.env.AUTO_TRANSLATE === "true") {
      await this.onMessageCreate(d as MessageCreate);
      return;
    }

    if (event === "MESSAGE_REACTION_ADD") {
      await this.onReactionAdd(d as ReactionAdd);
      return;
    }
  }

  private async onMessageCreate(m: MessageCreate): Promise<void> {
    if (m.author?.bot) return;
    if (!m.content || m.content.trim().length < 2) return;
    if (m.type !== 0) return;

    const src = detectLang(m.content);
    const to = target(src);
    if (!to) return;
    const from = src as Lang;

    try {
      const out = await translate(
        m.content,
        from,
        to,
        this.env.ANTHROPIC_API_KEY,
        this.env.MODEL,
      );
      await postTranslation(
        m.channel_id,
        m.id,
        out,
        this.env.THREAD_NAME,
        this.env.DISCORD_BOT_TOKEN,
      );
    } catch (err) {
      console.error("auto-translate failed", err);
    }
  }

  private async onReactionAdd(r: ReactionAdd): Promise<void> {
    const name = r.emoji?.name;
    if (!name) return;
    const to = FLAG_TO_LANG[name];
    if (!to) return;

    try {
      const msg = await getMessage(r.channel_id, r.message_id, this.env.DISCORD_BOT_TOKEN);
      if (msg.author?.bot || !msg.content) return;
      const src = detectLang(msg.content);
      const from: Lang = src === "other" ? (to === "ko" ? "en" : "ko") : src;
      if (from === to) return;

      const out = await translate(
        msg.content,
        from,
        to,
        this.env.ANTHROPIC_API_KEY,
        this.env.MODEL,
      );

      await postTranslation(
        r.channel_id,
        r.message_id,
        out,
        this.env.THREAD_NAME,
        this.env.DISCORD_BOT_TOKEN,
      );
    } catch (err) {
      console.error("reaction-translate failed", err);
    }
  }
}

type MessageCreate = {
  id: string;
  channel_id: string;
  content: string;
  type: number;
  author?: { bot?: boolean };
};

type ReactionAdd = {
  channel_id: string;
  message_id: string;
  emoji?: { name: string | null };
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
