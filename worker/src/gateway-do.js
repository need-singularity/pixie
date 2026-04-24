// GatewayDO — single Durable Object holding Discord Gateway WebSocket.
// Uses DO alarm() to keep the isolate warm while the WebSocket is open.

import { SHORT_TAGLINES, SHORT_REPLY, resolveProject } from "./mentions.js";

const GATEWAY_URL = "https://gateway.discord.gg/?v=10&encoding=json";
const REST = "https://discord.com/api/v10";
const INTENTS = (1 << 0) | (1 << 9) | (1 << 15);
const ALARM_INTERVAL_MS = 30_000;

// Reconnect control — prevents runaway connect loops that get the bot's
// token reset by Discord (>1000 connects in a short window).
const INITIAL_BACKOFF_MS = 5_000;
const MAX_BACKOFF_MS = 300_000;       // 5 min
const CIRCUIT_OPEN_MS = 3_600_000;    // 1 hour — for fatal auth/intent errors
const IDENTIFY_MIN_DELAY_MS = 1_500;  // Discord-recommended floor after op 9

// Fatal close codes: Discord says don't retry these without human intervention.
// 4004 auth failed · 4010 invalid shard · 4011 sharding required
// 4012 invalid api version · 4013 invalid intents · 4014 disallowed intents
const FATAL_CODES = new Set([4004, 4010, 4011, 4012, 4013, 4014]);

// Keys we persist so circuit-breaker + session survive isolate eviction.
// Without this, a single fatal 4004 + eviction would re-open the retry
// storm every time cron fires.
const PERSISTED = ["session_id", "seq", "resume_url", "next_connect_allowed_at", "connect_attempts", "last_close_code", "last_close_reason", "last_close_at"];

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
    this.connecting = false;
    this.connect_attempts = 0;
    this.next_connect_allowed_at = 0;
    this.last_close_code = null;
    this.last_close_reason = null;
    this.last_close_at = 0;

    this.state.blockConcurrencyWhile(async () => {
      const rows = await this.state.storage.get(PERSISTED);
      for (const k of PERSISTED) {
        const v = rows.get(k);
        if (v !== undefined) this[k] = v;
      }
    });
  }

  async persist() {
    const patch = {};
    for (const k of PERSISTED) patch[k] = this[k];
    await this.state.storage.put(patch);
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.searchParams.get("reset") === "1") {
      this.session_id = null;
      this.seq = null;
      this.resume_url = null;
      this.next_connect_allowed_at = 0;
      this.connect_attempts = 0;
      await this.persist();
      if (this.ws) try { this.ws.close(1000, "reset"); } catch {}
      this.ws = null;
    }
    await this.ensureConnected();
    return new Response(JSON.stringify({
      connected: !!this.ws && this.ws.readyState === WebSocket.OPEN,
      ready_at: this.ready_at,
      user_id: this.user_id,
      seq: this.seq,
      heartbeat_interval: this.heartbeat_interval,
      connect_attempts: this.connect_attempts,
      next_connect_allowed_at: this.next_connect_allowed_at,
      circuit_open_ms: Math.max(0, this.next_connect_allowed_at - Date.now()),
      last_close_code: this.last_close_code,
      last_close_reason: this.last_close_reason,
      last_close_at: this.last_close_at,
    }, null, 2), {
      headers: { "content-type": "application/json" },
    });
  }

  // alarm() is CF's way to keep a DO alive on a timer.  We use it to
  // send heartbeats and reconnect if the WS died.
  async alarm() {
    const now = Date.now();
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      if (now >= this.next_connect_allowed_at) await this.connect();
    } else if (this.heartbeat_interval > 0 &&
               now - this.last_heartbeat >= this.heartbeat_interval) {
      this.sendHeartbeat();
    }
    await this.state.storage.setAlarm(Date.now() + ALARM_INTERVAL_MS);
  }

  async ensureConnected() {
    await this.state.storage.setAlarm(Date.now() + ALARM_INTERVAL_MS);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    if (Date.now() < this.next_connect_allowed_at) return;
    await this.connect();
  }

  async connect() {
    if (this.connecting) return;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    if (Date.now() < this.next_connect_allowed_at) return;

    this.connecting = true;
    this.connect_attempts++;
    try {
      const url = this.resume_url || GATEWAY_URL;
      console.log(`gw connect attempt #${this.connect_attempts} → ${url}`);
      const resp = await fetch(url, { headers: { Upgrade: "websocket" } });
      if (resp.status !== 101) {
        console.log(`gateway upgrade failed ${resp.status}`);
        await this.scheduleRetry();
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
    } finally {
      this.connecting = false;
    }
  }

  async scheduleRetry(minDelayMs = 0) {
    const exp = Math.min(
      INITIAL_BACKOFF_MS * Math.pow(2, Math.max(0, this.connect_attempts - 1)),
      MAX_BACKOFF_MS,
    );
    const jitter = Math.floor(Math.random() * 1000);
    const delay = Math.max(minDelayMs, exp) + jitter;
    this.next_connect_allowed_at = Date.now() + delay;
    console.log(`gw retry in ${delay}ms (attempt #${this.connect_attempts})`);
    await this.persist();
  }

  async openCircuit(ms, reason) {
    this.next_connect_allowed_at = Date.now() + ms;
    console.log(`gw circuit OPEN for ${ms}ms — ${reason}`);
    await this.persist();
  }

  async resetBackoff() {
    this.connect_attempts = 0;
    this.next_connect_allowed_at = 0;
    await this.persist();
  }

  onClose(ev) {
    console.log(`gateway closed code=${ev.code} reason=${ev.reason}`);
    this.ws = null;
    this.heartbeat_interval = 0;
    this.last_close_code = ev.code;
    this.last_close_reason = ev.reason || null;
    this.last_close_at = Date.now();
    if (FATAL_CODES.has(ev.code)) {
      this.session_id = null;
      this.resume_url = null;
      this.seq = null;
      this.state.waitUntil(this.openCircuit(CIRCUIT_OPEN_MS, `fatal close ${ev.code}`));
    } else {
      this.state.waitUntil(this.scheduleRetry());
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
    setTimeout(() => this.sendHeartbeat(),
      Math.floor(Math.random() * Math.min(5000, this.heartbeat_interval)));

    if (this.session_id) {
      this.send({
        op: 6,
        d: { token: this.env.DISCORD_BOT_TOKEN, session_id: this.session_id, seq: this.seq },
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
    // op 7: server asked us to reconnect. Close + let alarm() reconnect
    // with backoff (keeps session_id/resume_url for RESUME).
    if (this.ws) try { this.ws.close(4000, "server_requested_reconnect"); } catch {}
    this.ws = null;
    await this.scheduleRetry();
  }

  async reidentify(resumable) {
    // op 9: invalid session. Backoff before fresh IDENTIFY — this is the
    // path that produced the >1000-connect loop that got the token reset.
    if (!resumable) { this.session_id = null; this.seq = null; this.resume_url = null; }
    if (this.ws) try { this.ws.close(4009, "invalid_session"); } catch {}
    this.ws = null;
    await this.scheduleRetry(IDENTIFY_MIN_DELAY_MS);
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
      this.state.waitUntil(this.resetBackoff());
      return;
    }
    if (type === "RESUMED") {
      console.log("gw resumed");
      this.state.waitUntil(this.resetBackoff());
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
