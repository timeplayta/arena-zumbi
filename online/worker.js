// Arena Zumbi - relay de salas co-op para Cloudflare Workers (Durable Object + WebSocket).
// O anfitrião (primeiro a entrar) roda o mundo do jogo; este código só repassa mensagens.
const send = (ws, o) => { try { ws.send(typeof o === "string" ? o : JSON.stringify(o)); } catch (e) {} };

export class Room {
  constructor(state) {
    this.state = state;
    this.state.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }
  peers() { return this.state.getWebSockets().map((ws) => ({ ws, info: ws.deserializeAttachment() || {} })); }
  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") return new Response("Use WebSocket", { status: 426 });
    const q = new URL(request.url).searchParams, role = q.get("role") === "host" ? "host" : "guest", pw = (q.get("pw") || "").slice(0, 64), max = Math.min(12, Math.max(2, parseInt(q.get("max"), 10) || 4));
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const peers = this.peers(), host = peers.find((p) => p.info.host);
    this.state.acceptWebSocket(server);
    const refuse = (m) => { send(server, { t: "error", m }); server.close(1008, m); };
    if (role === "host" && host) refuse("Essa sala já existe. Escolha outro nome.");
    else if (role === "guest" && !host) refuse("Sala não encontrada. Confira o nome.");
    else if (role === "guest" && host.info.pw && host.info.pw !== pw) refuse("Senha incorreta.");
    else if (role === "guest" && peers.length >= (host.info.max || 4)) refuse("Sala cheia (máximo " + (host.info.max || 4) + " jogadores).");
    else {
      const used = new Set(peers.map((p) => p.info.id));
      let id = "p1"; if (role === "guest") for (let i = 2; i <= 12; i++) if (!used.has("p" + i)) { id = "p" + i; break; }
      server.serializeAttachment({ id, host: role === "host", pw: role === "host" ? pw : "", max: role === "host" ? max : 0 });
      send(server, { t: "welcome", id, host: role === "host", max: role === "host" ? max : host.info.max || 4 });
      if (role === "guest") send(host.ws, { t: "join", id });
    }
    return new Response(null, { status: 101, webSocket: client });
  }
  webSocketMessage(ws, msg) {
    if (typeof msg !== "string" || msg.length > 65536) return;
    const me = ws.deserializeAttachment(); if (!me) return;
    let m; try { m = JSON.parse(msg); } catch (e) { return; }
    if (!m || typeof m !== "object") return;
    const peers = this.peers();
    if (me.host) {
      const to = m.to; delete m.to;
      const out = JSON.stringify(m);
      for (const p of peers) if (!p.info.host && (!to || p.info.id === to)) send(p.ws, out);
    } else {
      m.from = me.id; delete m.to;
      const h = peers.find((p) => p.info.host); if (h) send(h.ws, m);
    }
  }
  drop(ws) {
    const me = ws.deserializeAttachment(); if (!me) return;
    const peers = this.peers().filter((p) => p.ws !== ws);
    if (me.host) { for (const p of peers) { send(p.ws, { t: "closed" }); try { p.ws.close(1000, "host saiu"); } catch (e) {} } }
    else { const h = peers.find((p) => p.info.host); if (h) send(h.ws, { t: "leave", id: me.id }); }
  }
  webSocketClose(ws) { this.drop(ws); }
  webSocketError(ws) { this.drop(ws); }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/ws\/([A-Za-z0-9]{3,16})$/);
    if (m) return env.ROOMS.get(env.ROOMS.idFromName(m[1].toUpperCase())).fetch(request);
    if (env.ASSETS) return env.ASSETS.fetch(request);                 // o jogo (pasta game/public)
    return new Response("Arena Zumbi - servidor online", { headers: { "content-type": "text/plain; charset=utf-8" } });
  },
};
