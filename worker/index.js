// Arena Zumbi online: Worker + Durable Object (sala de co-op) + D1 (ranking).
// Protocolo de texto: "<destino>:<json>"  ->  o servidor entrega "<origem>:<json>".
//   destino: "h" = anfitriao, "*" = todos os outros, "1".."4" = jogador, "s" = servidor.
//   origem : "0" = servidor, "1".."4" = jogador.
// O servidor nao interpreta o jogo; so liga os jogadores de uma sala.

const MAX_PLAYERS = 4;
const MAX_MSG = 256 * 1024;

export class Room {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    // "ping" -> "pong" sem acordar o objeto
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  peers() {
    const out = [];
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment();
      if (a && a.id) out.push({ ws, id: a.id, name: a.name || "" });
    }
    return out;
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") return new Response("Use WebSocket", { status: 426 });
    const peers = this.peers();
    const pair = new WebSocketPair();
    const client = pair[0], server = pair[1];
    if (peers.length >= MAX_PLAYERS) {
      this.ctx.acceptWebSocket(server);
      server.send("0:" + JSON.stringify({ t: "full" }));
      server.close(1008, "sala cheia");
      return new Response(null, { status: 101, webSocket: client });
    }
    const used = new Set(peers.map((p) => p.id));
    let id = 1;
    while (used.has(id)) id++;
    const host = peers.length ? Math.min(...peers.map((p) => p.id)) : id;
    server.serializeAttachment({ id, name: "" });
    this.ctx.acceptWebSocket(server);
    server.send("0:" + JSON.stringify({ t: "welcome", id, host, players: peers.map((p) => ({ id: p.id, name: p.name })) }));
    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws, data) {
    if (typeof data !== "string" || data.length > MAX_MSG) return;
    const a = ws.deserializeAttachment();
    if (!a || !a.id) return;
    const i = data.indexOf(":");
    if (i < 1 || i > 2) return;
    const to = data.slice(0, i), body = data.slice(i + 1);
    const peers = this.peers();
    const host = peers.length ? Math.min(...peers.map((p) => p.id)) : a.id;
    if (to === "s") {                                   // mensagens para o servidor: so "hello"
      let m; try { m = JSON.parse(body); } catch (e) { return; }
      if (m && m.t === "hello") {
        a.name = String(m.name || "Jogador").replace(/[^\p{L}\p{N} _.\-]/gu, "").slice(0, 14) || "Jogador";
        ws.serializeAttachment(a);
        const msg = "0:" + JSON.stringify({ t: "join", id: a.id, name: a.name });
        for (const p of peers) if (p.id !== a.id) { try { p.ws.send(msg); } catch (e) {} }
        try { ws.send("0:" + JSON.stringify({ t: "joined", id: a.id, host, players: peers.map((p) => ({ id: p.id, name: p.id === a.id ? a.name : p.name })) })); } catch (e) {}
      }
      return;
    }
    const out = a.id + ":" + body;
    if (to === "*") { for (const p of peers) if (p.id !== a.id) { try { p.ws.send(out); } catch (e) {} } }
    else if (to === "h") { if (a.id !== host) for (const p of peers) if (p.id === host) { try { p.ws.send(out); } catch (e) {} } }
    else { const n = Number(to); for (const p of peers) if (p.id === n && p.id !== a.id) { try { p.ws.send(out); } catch (e) {} } }
  }

  webSocketClose(ws, code, reason) { this.gone(ws); try { ws.close(code, "bye"); } catch (e) {} }
  webSocketError(ws) { this.gone(ws); }

  gone(ws) {
    const a = ws.deserializeAttachment();
    if (!a || !a.id) return;
    const others = this.peers().filter((p) => p.ws !== ws);
    const hostWas = Math.min(a.id, ...others.map((p) => p.id)) === a.id;     // quem saiu era o anfitriao
    const msg = "0:" + JSON.stringify({ t: hostWas ? "hostleft" : "leave", id: a.id });
    for (const p of others) { try { p.ws.send(msg); } catch (e) {} }
    if (hostWas) for (const p of others) { try { p.ws.close(1000, "anfitriao saiu"); } catch (e) {} }
  }
}

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" } });
const num = (v, lo, hi) => { v = Math.floor(Number(v)); return Number.isFinite(v) && v >= lo && v <= hi ? v : null; };
const DIFFS = ["Recruta", "Soldado", "Veterano", "Pesadelo", "Extremo", "Apocalipse"];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);

    // /ws/<CODIGO>  -> sala
    if (parts[0] === "ws" && parts[1]) {
      const code = parts[1].toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
      if (code.length < 3) return new Response("Codigo invalido", { status: 400 });
      return env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(request);
    }

    if (parts[0] === "api") {
      if (request.method === "OPTIONS") return new Response(null, { headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type" } });
      if (!env.DB) return json({ error: "banco indisponivel" }, 503);
      if (parts[1] === "scores" && request.method === "GET") {
        const diff = url.searchParams.get("diff");
        const q = diff && DIFFS.includes(diff)
          ? env.DB.prepare("SELECT name, score, wave, kills, players, diff, created_at FROM coop_scores WHERE diff = ? ORDER BY score DESC LIMIT 20").bind(diff)
          : env.DB.prepare("SELECT name, score, wave, kills, players, diff, created_at FROM coop_scores ORDER BY score DESC LIMIT 20");
        const { results } = await q.all();
        return json({ scores: results });
      }
      if (parts[1] === "score" && request.method === "POST") {
        let b; try { b = await request.json(); } catch (e) { return json({ error: "json" }, 400); }
        const score = num(b.score, 0, 5e7), wave = num(b.wave, 1, 999), kills = num(b.kills, 0, 99999), players = num(b.players, 1, MAX_PLAYERS);
        const name = String(b.name || "").replace(/[^\p{L}\p{N} _.,\-+&]/gu, "").slice(0, 40), diff = DIFFS.includes(b.diff) ? b.diff : null;
        if (score === null || wave === null || kills === null || players === null || !name || !diff) return json({ error: "dados invalidos" }, 400);
        await env.DB.prepare("INSERT INTO coop_scores (name, score, wave, kills, players, diff, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(name, score, wave, kills, players, diff, Date.now()).run();
        return json({ ok: true });
      }
      return json({ error: "nao encontrado" }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};
