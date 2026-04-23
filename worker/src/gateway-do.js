// GatewayDO — single Durable Object holding Discord Gateway WebSocket.
// Uses DO alarm() to keep the isolate warm while the WebSocket is open.

import { SHORT_TAGLINES, SHORT_REPLY, resolveProject } from "./mentions.js";

const GATEWAY_URL = "https://gateway.discord.gg/?v=10&encoding=json";
const REST = "https://discord.com/api/v10";
const INTENTS = (1 << 0) | (1 << 9) | (1 << 15);
const ALARM_INTERVAL_MS = 30_000;

export class GatewayDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.ws = null;
    this.seq = null;
    this.session_id = null;
    this.resume_url = null;
    this.heartbeat_interval = 0;
    this.last_heartbeat = 0;
    this.last_ack = 0;
    this.user_id = null;
    this.ready_at = 0;
  }

  async fetch(request) {
    await this.ensureConnected();
    return new Response(JSON.stringify({
      connected: !!this.ws && this.ws.readyState === WebSocket.OPEN,
      ready_at: this.ready_at,
      user_id: this.user_id,
      seq: this.seq,
      heartbeat_interval: this.heartbeat_interval,
    }, null, 2), {
      headers: { "content-type": "application/json" },
    });
  }

  // alarm() is CF's way to keep a DO alive on a timer.  We use it to
  // send heartbeats and reconnect if the WS died.
  async alarm() {
    const now = Date.now();
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
    } else if (this.heartbeat_interval > 0 &&
               now - this.last_heartbeat >= this.heartbeat_interval) {
      this.sendHeartbeat();
    }
    // Schedule next alarm.
    await this.state.storage.setAlarm(now + ALARM_INTERVAL_MS);
  }

  async ensureConnected() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      await this.state.storage.setAlarm(Date.now() + ALARM_INTERVAL_MS);
      return;
    }
    await this.connect();
    await this.state.storage.setAlarm(Date.now() + ALARM_INTERVAL_MS);
  }

  async connect() {
    const url = this.resume_url || GATEWAY_URL;
    console.log(`gw connect → ${url}`);
    const resp = await fetch(url, { headers: { Upgrade: "websocket" } });
    if (resp.status !== 101) {
      console.log(`gateway upgrade failed ${resp.status}`);
      return;
    }
    const ws = resp.webSocket;
    ws.accept();
    this.ws = ws;
    this.last_heartbeat = Date.now();
    this.last_ack = Date.now();

    ws.addEventListener("message", (ev) => this.onMessage(ev));
    ws.addEventListener("close", (ev) => this.onClose(ev));
    ws.addEventListener("error", (ev) => console.log("gw error", String(ev)));
  }

  onClose(ev) {
    console.log(`gateway closed code=${ev.code} reason=${ev.reason}`);
    this.ws = null;
    this.heartbeat_interval = 0;
    // Fatal codes we don't retry.
    const fatal = [4004, 4010, 4011, 4012, 4013, 4014];
    if (fatal.includes(ev.code)) {
      this.session_id = null;
      this.resume_url = null;
    }
  }

  async onMessage(ev) {
    let msg;
    try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg.s != null) this.seq = msg.s;
    switch (msg.op) {
      case 10: return this.handleHello(msg);
      case 11: this.last_ack = Date.now(); return;
      case 0:  return this.handleDispatch(msg);
      case 7:  return this.reconnect();
      case 9:  return this.reidentify(msg.d);
    }
  }

  handleHello(msg) {
    this.heartbeat_interval = msg.d.heartbeat_interval;
    console.log(`hello: heartbeat_interval=${this.heartbeat_interval}ms`);
    // Immediate heartbeat after small jitter, then alarm() handles the rest.
    setTimeout(() => this.sendHeartbeat(),
      Math.floor(Math.random() * Math.min(5000, this.heartbeat_interval)));

    if (this.session_id) {
      this.send({
        op: 6,
        d: {
          token: this.env.DISCORD_BOT_TOKEN,
          session_id: this.session_id,
          seq: this.seq,
        },
      });
    } else {
      this.send({
        op: 2,
        d: {
          token: this.env.DISCORD_BOT_TOKEN,
          intents: INTENTS,
          properties: { os: "cloudflare-workers", browser: "pixie-do", device: "pixie-do" },
        },
      });
    }
  }

  sendHeartbeat() {
    this.send({ op: 1, d: this.seq });
    this.last_heartbeat = Date.now();
  }

  send(obj) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try { this.ws.send(JSON.stringify(obj)); } catch (e) { console.log("send failed", String(e)); }
    }
  }

  async reconnect() {
    if (this.ws) try { this.ws.close(4000, "server_requested_reconnect"); } catch {}
    await this.connect();
  }

  async reidentify(resumable) {
    if (!resumable) { this.session_id = null; this.seq = null; this.resume_url = null; }
    if (this.ws) try { this.ws.close(4009, "invalid_session"); } catch {}
    setTimeout(() => this.connect(), 1500);
  }

  handleDispatch(msg) {
    const type = msg.t;
    const data = msg.d;
    if (type === "READY") {
      this.session_id = data.session_id;
      this.resume_url = data.resume_gateway_url
        ? `${data.resume_gateway_url.replace(/^wss:/, "https:")}/?v=10&encoding=json`
        : null;
      this.user_id = data.user?.id;
      this.ready_at = Date.now();
      console.log(`ready as ${data.user?.username} (${this.user_id})`);
      return;
    }
    if (type === "MESSAGE_CREATE") return this.handleMessageCreate(data);
  }

  async handleMessageCreate(m) {
    if (!m.content || m.author?.bot) return;
    const lower = m.content.toLowerCase();
    const mentioned = Array.isArray(m.mentions) && m.mentions.some(u => u.id === this.user_id);
    const triggered = lower.includes("@ai") || lower.startsWith("!pixie") || lower.startsWith("!ai");
    if (!(mentioned || triggered)) return;

    const project = resolveProject(m.content);
    await this.postReply(m.channel_id, m.id, SHORT_REPLY(project));
  }

  async postReply(channel_id, msg_id, content) {
    const body = {
      content,
      allowed_mentions: { parse: [] },
      message_reference: { message_id: msg_id, fail_if_not_exists: false },
    };
    try {
      const r = await fetch(`${REST}/channels/${channel_id}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bot ${this.env.DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!r.ok) console.log(`reply ${r.status}: ${await r.text()}`);
    } catch (e) {
      console.log(`reply err: ${e}`);
    }
  }
}
