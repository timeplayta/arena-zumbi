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


// ---------------- contas (nome + senha) ----------------
// Um Durable Object único guarda as contas: senha com PBKDF2 (sal aleatório), sessão por token e o progresso (carteira) de cada jogador.
const J = (o, st) => new Response(JSON.stringify(o), { status: st || 200, headers: { "content-type": "application/json; charset=utf-8", ...CORS } });
const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "content-type, authorization", "access-control-max-age": "86400" };
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const rand = (n) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return hex(a); };
async function hashPass(pass, salt) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 100000, hash: "SHA-256" }, key, 256));
}
const same = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };
const cleanName = (n) => String(n || "").replace(/\s+/g, " ").trim();
const NAME_OK = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9 _.-]{2,14}$/;

// presentes únicos dados pelo dono do jogo (aplicados quando a conta entra ou é criada)
const GIFTS = [{ id: "juan100k", user: "juan", coins: 100000 }];
async function applyGifts(st, u) {
  let changed = false;
  for (const g of GIFTS) {
    if (u.key !== g.user || (u.gifts || {})[g.id]) continue;
    let w = {}; try { w = JSON.parse(u.wallet || "{}") || {}; } catch (e) {}
    w.coins = Math.min(9999999, (Number(w.coins) || 0) + g.coins); w.total = (Number(w.total) || 0) + g.coins;
    u.wallet = JSON.stringify(w); u.gifts = Object.assign({}, u.gifts, { [g.id]: Date.now() }); changed = true;
  }
  if (changed) await st.put("u:" + u.key, u);
  return u;
}

export class Accounts {
  constructor(state) { this.st = state.storage; }
  async fetch(request) {
    const url = new URL(request.url), path = url.pathname.replace(/^\/api\//, "");
    let body = {};
    if (request.method === "POST") { try { const t = await request.text(); if (t.length > 40000) return J({ error: "Dados grandes demais." }, 413); body = t ? JSON.parse(t) : {}; } catch (e) { return J({ error: "Pedido inválido." }, 400); } }
    const auth = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    const who = async () => { if (!/^[0-9a-f]{64}$/.test(auth)) return null; const t = await this.st.get("t:" + auth); return t ? await this.st.get("u:" + t.u) : null; };
    const session = async (u) => { const tok = rand(32); await this.st.put("t:" + tok, { u: u.key, at: Date.now() }); return tok; };
    if (path === "register" && request.method === "POST") {
      const name = cleanName(body.name), pass = String(body.pass || "");
      if (!NAME_OK.test(name)) return J({ error: "Nome: de 2 a 14 letras ou números." }, 400);
      if (pass.length < 4 || pass.length > 40) return J({ error: "Senha: de 4 a 40 caracteres." }, 400);
      const key = name.toLowerCase();
      if (await this.st.get("u:" + key)) return J({ error: "Esse nome já tem conta. Use Entrar ou escolha outro nome." }, 409);
      const salt = rand(16), u = { key, name, salt, hash: await hashPass(pass, salt), wallet: "", created: Date.now() };
      await this.st.put("u:" + key, u);
      await applyGifts(this.st, u);
      return J({ token: await session(u), name, wallet: u.wallet || "" });
    }
    if (path === "login" && request.method === "POST") {
      const name = cleanName(body.name), pass = String(body.pass || ""), key = name.toLowerCase();
      const u = await this.st.get("u:" + key);
      if (!u) return J({ error: "Conta não encontrada. Confira o nome ou toque em Criar conta." }, 404);
      const f = (await this.st.get("f:" + key)) || { n: 0, until: 0 };
      if (f.until > Date.now()) return J({ error: "Muitas tentativas. Espere 1 minuto." }, 429);
      if (!same(await hashPass(pass, u.salt), u.hash)) {
        f.n += 1; if (f.n >= 5) { f.n = 0; f.until = Date.now() + 60000; }
        await this.st.put("f:" + key, f);
        return J({ error: "Senha incorreta." }, 401);
      }
      await this.st.delete("f:" + key);
      await applyGifts(this.st, u);
      return J({ token: await session(u), name: u.name, wallet: u.wallet || "" });
    }
    if (path === "me") { const u = await who(); if (u) await applyGifts(this.st, u); return u ? J({ name: u.name, wallet: u.wallet || "" }) : J({ error: "Sessão expirada. Entre de novo." }, 401); }
    if (path === "save" && request.method === "POST") {
      const u = await who(); if (!u) return J({ error: "Sessão expirada. Entre de novo." }, 401);
      const w = typeof body.wallet === "string" ? body.wallet : ""; if (w.length > 30000) return J({ error: "Dados grandes demais." }, 413);
      try { JSON.parse(w || "{}"); } catch (e) { return J({ error: "Dados inválidos." }, 400); }
      u.wallet = w; u.saved = Date.now(); await this.st.put("u:" + u.key, u);
      return J({ ok: true });
    }
    if (path === "logout" && request.method === "POST") { if (/^[0-9a-f]{64}$/.test(auth)) await this.st.delete("t:" + auth); return J({ ok: true }); }
    return J({ error: "Não encontrado." }, 404);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/ws\/([A-Za-z0-9]{3,16})$/);
    if (m) return env.ROOMS.get(env.ROOMS.idFromName(m[1].toUpperCase())).fetch(request);
    if (url.pathname.startsWith("/api/")) {                           // contas
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
      if (!env.ACCOUNTS) return J({ error: "Contas indisponíveis." }, 503);
      return env.ACCOUNTS.get(env.ACCOUNTS.idFromName("contas")).fetch(request);
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);                 // o jogo (pasta game/public)
    return new Response("Arena Zumbi - servidor online", { headers: { "content-type": "text/plain; charset=utf-8" } });
  },
};
