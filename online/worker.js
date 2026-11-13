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
    const app = q.get("app");
    if (app !== "web" && app !== "apk" && app !== "exe") refuse("O online só funciona na versão nova do jogo. Baixe em machine-gamesdev.itch.io/arena-zumbi");   // versões anteriores ficam sem online
    else if (role === "host" && host) refuse("Essa sala já existe. Escolha outro nome.");
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

// ---------------- painel do administrador (/admin.html) ----------------
// senha inicial: só o resumo SHA-256 fica aqui; o dono pode trocar a senha no painel (fica salva no servidor)
const ADMIN_SHA = "ec61d1a66c6d8672337e3a1a133000061520cfe753b2f140a80c853fce040454";
const sha256 = async (t) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)));
const walletOf = (u) => { try { return JSON.parse(u.wallet || "{}") || {}; } catch (e) { return {}; } };
// moedas enviadas pelo admin ficam "a entregar" (credit) até o jogo do jogador sincronizar; assim o jogo aberto não apaga o envio
function deliver(u) {
  const c = Number(u.credit) || 0; if (!c) return 0;
  const w = walletOf(u); w.coins = Math.max(0, Math.min(9999999, (Number(w.coins) || 0) + c)); if (c > 0) w.total = (Number(w.total) || 0) + c;
  u.wallet = JSON.stringify(w); u.credit = 0; return c;
}

// ---------------- vendas da loja ZPAY (URL de notificação POST) ----------------
// a URL secreta fica só no painel da ZPAY; aqui guardamos só o resumo SHA-256 do segredo
const ZPAY_HOOK_SHA = "220414200927108c6b8ce9f74124a860ae2283aab4ab09235b5fa90beffd1c8f";
const ZPAY_COINS = { "6ae7fb23628b71ef671ec257": 250000, "6ae7faee628b71ef671ec254": 100000, "6ae7fa8c628b71ef671ec252": 45000, "6ae7fa59628b71ef671ec250": 20000, "6ae7fa15628b71ef671ec24e": 10000, "6ae7f973628b71ef671ec24c": 5000 };
const coinsInName = (s) => { const m = String(s || "").match(/(\d{1,3}(?:[.\s]\d{3})+|\d+)\s*z\s*coins?/i); return m ? Number(m[1].replace(/[.\s]/g, "")) : 0; };
// lê o aviso da venda sem depender de um formato fixo: id da venda, situação, conta do jogo e pacotes comprados
function readSale(p) {
  // formato real da ZPAY: {event:"sale.delivered", sale:{id, quantity, status, customAnswers:[...]}, product:{id, name, price}}
  if (p && p.sale && typeof p.sale === "object" && p.product && typeof p.product === "object") {
    const per = ZPAY_COINS[String(p.product.id || p.product._id || "")] || coinsInName(p.product.name);
    const q = Math.max(1, Math.min(50, Math.trunc(Number(p.sale.quantity)) || 1));
    let account = "";
    for (const a of Array.isArray(p.sale.customAnswers) ? p.sale.customAnswers : []) {
      if (!a || typeof a !== "object") continue;
      const label = String(a.title || a.question || a.label || a.name || a.field || ""), val = a.answer ?? a.value ?? a.response ?? a.text ?? a.resposta ?? "";
      if (typeof val === "string" && val.trim() && (!account || /conta(?!ct)|nick|jogador|player/i.test(label))) account = val;
    }
    return { id: String(p.sale.id || p.sale._id || ""), status: String(p.sale.status || p.event || ""), account: cleanName(account), packs: per ? [per] : [], coins: per * q };
  }
  const pick = (o, ks) => { for (const k of ks) if (o && o[k] != null && typeof o[k] !== "object") return String(o[k]); return ""; };
  const roots = [p, p && p.data, p && p.order, p && p.sale, p && p.venda, p && p.data && (p.data.order || p.data.sale)].filter((o) => o && typeof o === "object");
  let id = "", status = "", account = "";
  for (const o of roots) { id = id || pick(o, ["orderId", "saleId", "order_id", "sale_id", "_id", "id", "code", "codigo"]); status = status || pick(o, ["status", "paymentStatus", "payment_status", "situacao", "event", "type"]); }
  const items = [], seen = new Set();
  (function walk(o, depth) {
    if (!o || typeof o !== "object" || depth > 8 || seen.has(o)) return; seen.add(o);
    if (!Array.isArray(o)) {
      const label = String(o.label || o.name || o.nome || o.key || o.field || o.title || "");
      const val = o.value ?? o.valor ?? o.answer ?? o.resposta ?? o.response ?? o.text ?? o.content ?? o.input ?? o.data;
      if (!account && val != null && typeof val !== "object" && String(val).trim() && /conta(?!ct)|nick|jogador|usu[aá]rio|player|login/i.test(label)) account = String(val);
      for (const [k, v] of Object.entries(o)) if (!account && typeof v === "string" && v.trim() && /conta(?!ct)|nick|jogador|gameaccount|^account$|^player$/i.test(k)) account = v;
      const pid = String(o.productId || o.product_id || (o.product && (o.product._id || o.product.id)) || o._id || o.id || "");
      const per = ZPAY_COINS[pid] || coinsInName(o.productName || o.name || o.nome || o.title || (o.product && o.product.name));
      if (per && (ZPAY_COINS[pid] || o.quantity != null || o.qty != null || o.price != null || o.productName)) {
        const q = Math.max(1, Math.min(50, Math.trunc(Number(o.quantity ?? o.qty ?? o.quantidade ?? 1)) || 1));
        items.push({ coins: per, q }); if (o.product) seen.add(o.product);
        for (const [k, v] of Object.entries(o)) if (!/^(items|itens|products|produtos|cart|carrinho)$/i.test(k)) walk(v, depth + 1); // só procura a conta
        return;
      }
    }
    for (const v of Object.values(o)) walk(v, depth + 1);
  })(p, 0);
  return { id, status, account: cleanName(account), packs: [...new Set(items.map((i) => i.coins))], coins: items.reduce((s, i) => s + i.coins * i.q, 0) };
}
const PAID = /pag|paid|aprov|approv|conclu|complet|entreg|deliver|confirm|sucesso|success/i;
const NOT_PAID = /pend|aguard|wait|cancel|refund|reemb|estorn|chargeback|expir|fail|falh|recus/i;

export class Accounts {
  constructor(state) { this.st = state.storage; }
  // cada conta tem um id de 6 números (aparece no jogo embaixo do nome); a loja e o painel aceitam nome ou id
  async ensureId(u) {
    if (u.id) return u;
    for (let i = 0; i < 40; i++) {
      const n = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
      if (await this.st.get("id:" + n)) continue;
      u.id = n; await this.st.put("id:" + n, u.key); await this.st.put("u:" + u.key, u); return u;
    }
    return u;
  }
  async migrateIds() {
    if (this.idsDone || await this.st.get("idsdone")) { this.idsDone = true; return; }
    const all = await this.st.list({ prefix: "u:" });
    for (const [, u] of all) if (!u.id) await this.ensureId(u);
    await this.st.put("idsdone", Date.now()); this.idsDone = true;
  }
  async findAcc(q) {                                                  // "#123456" = id; "Juan" = nome; "123456" = nome, senão id
    const t = cleanName(q).replace(/^#\s*/, ""), isId = /^\d{6}$/.test(t);
    if (/^#/.test(cleanName(q)) && isId) { const k = await this.st.get("id:" + t); return k ? await this.st.get("u:" + k) : null; }
    if (NAME_OK.test(t)) { const u = await this.st.get("u:" + t.toLowerCase()); if (u) return u; }
    if (isId) { const k = await this.st.get("id:" + t); return k ? await this.st.get("u:" + k) : null; }
    return null;
  }
  async zpay(raw, secret) {
    if (!same(await sha256(secret), ZPAY_HOOK_SHA)) return J({ error: "Não encontrado." }, 404);
    let p = {}; try { p = JSON.parse(raw || "{}"); } catch (e) { return J({ error: "JSON inválido." }, 400); }
    const s = readSale(p), log = (await this.st.get("zpaylog")) || [];
    const rec = { at: Date.now(), id: s.id, status: s.status, account: s.account, coins: s.coins, raw: raw.slice(0, 4000) };
    const done = (r, code) => { rec.result = r; log.unshift(rec); return this.st.put("zpaylog", log.slice(0, 60)).then(() => J({ ok: code < 300, result: r }, code)); };
    if (s.status && NOT_PAID.test(s.status) && !PAID.test(s.status)) return done("ignorado: venda não paga", 200);
    if (!s.id) return done("sem id da venda", 200);
    if (await this.st.get("zs:" + s.id)) return done("repetido: já entregue", 200);
    if (!s.coins) return done("sem pacote de Zcoin", 200);
    let via = "";
    if (!s.account) {                                                  // sem nome no aviso: usa quem clicou em Comprar desse pacote na loja (últimos 30 min)
      const now = Date.now(), ints = ((await this.st.get("zint")) || []).filter((i) => now - i.at < 1800000);
      const hits = ints.filter((i) => !i.used && s.packs.includes(i.coins)), names = [...new Set(hits.map((i) => i.name.toLowerCase()))];
      if (names.length > 1) return done("confira: " + names.length + " contas pediram esse pacote", 200);
      if (!names.length) return done("sem nome da conta", 200);
      hits.forEach((i) => { i.used = now; }); await this.st.put("zint", ints);
      s.account = hits[0].name; via = " (pela loja)";
    }
    const u = await this.findAcc(s.account);
    if (!u) return done("conta não encontrada", 200);
    u.credit = (Number(u.credit) || 0) + s.coins; await this.st.put("u:" + u.key, u);
    await this.st.put("zs:" + s.id, { at: Date.now(), name: u.name, coins: s.coins });
    const alog = (await this.st.get("adminlog")) || []; alog.unshift({ at: Date.now(), name: u.name, coins: s.coins, via: "ZPAY" }); await this.st.put("adminlog", alog.slice(0, 50));
    rec.account = u.name; return done("entregue" + via, 200);
  }
  async fetch(request) {
    const url = new URL(request.url), path = url.pathname.replace(/^\/api\//, "");
    await this.migrateIds();
    if (path === "exists" && request.method === "GET") {              // loja ZPAY: confere a conta por imagem (2px de largura = existe, 1px = não)
      const ok = !!(await this.findAcc(url.searchParams.get("n") || ""));
      const gif = ok ? "R0lGODdhAgABAIEAAAAAAAAAAAAAAAAAACwAAAAAAgABAAAIBQABAAgIADs=" : "R0lGODdhAQABAIEAAAAAAAAAAAAAAAAAACwAAAAAAQABAAAIBAABBAQAOw==";
      return new Response(Uint8Array.from(atob(gif), (c) => c.charCodeAt(0)), { headers: { "content-type": "image/gif", "cache-control": "no-store", ...CORS } });
    }
    if (path === "zintent" && request.method === "GET") {             // loja ZPAY: "esta conta clicou em Comprar neste pacote" (imagem 1px)
      const acc = await this.findAcc(url.searchParams.get("n") || ""), coins = ZPAY_COINS[url.searchParams.get("p") || ""], n = acc ? acc.name : "";
      if (acc && coins) {
        const now = Date.now(), ints = ((await this.st.get("zint")) || []).filter((i) => now - i.at < 1800000);
        const prev = ints.find((i) => !i.used && i.coins === coins && i.name.toLowerCase() === n.toLowerCase());
        if (prev) prev.at = now; else ints.unshift({ at: now, name: n, coins });
        await this.st.put("zint", ints.slice(0, 200));
      }
      return new Response(Uint8Array.from(atob("R0lGODdhAQABAIEAAAAAAAAAAAAAAAAAACwAAAAAAQABAAAIBAABBAQAOw=="), (c) => c.charCodeAt(0)), { headers: { "content-type": "image/gif", "cache-control": "no-store", ...CORS } });
    }
    const hook = path.match(/^zpay\/([0-9a-f]{48})$/);
    if (hook && request.method === "POST") { const t = await request.text(); if (t.length > 100000) return J({ error: "Dados grandes demais." }, 413); return this.zpay(t, hook[1]); }
    let body = {};
    if (request.method === "POST") { try { const t = await request.text(); if (t.length > 40000) return J({ error: "Dados grandes demais." }, 413); body = t ? JSON.parse(t) : {}; } catch (e) { return J({ error: "Pedido inválido." }, 400); } }
    const auth = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    const who = async () => { if (!/^[0-9a-f]{64}$/.test(auth)) return null; const t = await this.st.get("t:" + auth); return t ? await this.st.get("u:" + t.u) : null; };
    const session = async (u) => { const tok = rand(32); await this.st.put("t:" + tok, { u: u.key, at: Date.now() }); return tok; };
    if (path.startsWith("admin/") && request.method === "POST") return this.admin(path.slice(6), body, request);
    if (path === "sync" && request.method === "POST") {                // jogo aberto pergunta se chegou moeda
      const u = await who(); if (!u) return J({ error: "Sessão expirada. Entre de novo." }, 401);
      const c = deliver(u); if (c) await this.st.put("u:" + u.key, u);
      return J({ credit: c });
    }
    if (path === "register" && request.method === "POST") {
      const name = cleanName(body.name), pass = String(body.pass || "");
      if (!NAME_OK.test(name)) return J({ error: "Nome: de 2 a 14 letras ou números." }, 400);
      if (pass.length < 4 || pass.length > 40) return J({ error: "Senha: de 4 a 40 caracteres." }, 400);
      const key = name.toLowerCase();
      if (await this.st.get("u:" + key)) return J({ error: "Esse nome já tem conta. Use Entrar ou escolha outro nome." }, 409);
      const salt = rand(16), u = { key, name, salt, hash: await hashPass(pass, salt), wallet: "", created: Date.now() };
      await this.st.put("u:" + key, u); await this.ensureId(u);
      await applyGifts(this.st, u);
      return J({ token: await session(u), name, id: u.id || "", wallet: u.wallet || "" });
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
      if (deliver(u)) await this.st.put("u:" + u.key, u);
      await this.ensureId(u);
      return J({ token: await session(u), name: u.name, id: u.id || "", wallet: u.wallet || "" });
    }
    if (path === "me") { const u = await who(); if (u) { await applyGifts(this.st, u); if (deliver(u)) await this.st.put("u:" + u.key, u); await this.ensureId(u); } return u ? J({ name: u.name, id: u.id || "", wallet: u.wallet || "" }) : J({ error: "Sessão expirada. Entre de novo." }, 401); }
    if (path === "save" && request.method === "POST") {
      const u = await who(); if (!u) return J({ error: "Sessão expirada. Entre de novo." }, 401);
      const w = typeof body.wallet === "string" ? body.wallet : ""; if (w.length > 30000) return J({ error: "Dados grandes demais." }, 413);
      try { JSON.parse(w || "{}"); } catch (e) { return J({ error: "Dados inválidos." }, 400); }
      u.wallet = w; u.saved = Date.now(); const c = deliver(u); await this.st.put("u:" + u.key, u);
      return J({ ok: true, credit: c });
    }
    if (path === "logout" && request.method === "POST") { if (/^[0-9a-f]{64}$/.test(auth)) await this.st.delete("t:" + auth); return J({ ok: true }); }
    return J({ error: "Não encontrado." }, 404);
  }
  async admin(cmd, body, request) {
    const lock = (await this.st.get("adminlock")) || { n: 0, until: 0 };
    if (lock.until > Date.now()) return J({ error: "Muitas tentativas erradas. Espere 10 minutos." }, 429);
    const key = String(body.key || ""), saved = await this.st.get("adminpass");
    const ok = saved ? same(await hashPass(key, saved.salt), saved.hash) : same(await sha256(key), ADMIN_SHA);
    if (!ok) { lock.n += 1; if (lock.n >= 8) { lock.n = 0; lock.until = Date.now() + 600000; } await this.st.put("adminlock", lock); return J({ error: "Senha de administrador incorreta." }, 401); }
    if (lock.n) await this.st.delete("adminlock");
    if (cmd === "check") return J({ ok: true });
    if (cmd === "list") {
      const all = await this.st.list({ prefix: "u:" }), out = [];
      for (const [, u] of all) { const w = walletOf(u); out.push({ name: u.name, id: u.id || "", coins: (Number(w.coins) || 0) + (Number(u.credit) || 0), pending: Number(u.credit) || 0, created: u.created || 0, saved: u.saved || 0 }); }
      out.sort((a, b) => b.created - a.created);
      return J({ accounts: out });
    }
    if (cmd === "give") {
      const name = cleanName(body.name), n = Math.trunc(Number(body.coins));
      if (!n || Math.abs(n) > 9999999) return J({ error: "Quantidade inválida." }, 400);
      const u = await this.findAcc(name); if (!u) return J({ error: "Conta \"" + name + "\" não encontrada." }, 404);
      u.credit = (Number(u.credit) || 0) + n; await this.st.put("u:" + u.key, u);
      const log = (await this.st.get("adminlog")) || []; log.unshift({ at: Date.now(), name: u.name, coins: n }); await this.st.put("adminlog", log.slice(0, 50));
      return J({ ok: true, name: u.name, coins: (Number(walletOf(u).coins) || 0) + u.credit });
    }
    if (cmd === "log") return J({ log: (await this.st.get("adminlog")) || [] });
    if (cmd === "zpay") return J({ sales: (await this.st.get("zpaylog")) || [] });
    if (cmd === "setpass") {
      const np = String(body.newpass || ""); if (np.length < 8) return J({ error: "A senha nova precisa ter pelo menos 8 caracteres." }, 400);
      const salt = rand(16); await this.st.put("adminpass", { salt, hash: await hashPass(np, salt) });
      return J({ ok: true });
    }
    return J({ error: "Comando desconhecido." }, 404);
  }
}

// versão publicada do jogo (game/public/version.json); salas só aceitam o jogo nessa versão ou mais nova
let curV = 0, curAt = 0;
async function currentVersion(env, url) {
  if (!env.ASSETS) return 0;
  if (Date.now() - curAt < 60000) return curV;
  try { const r = await env.ASSETS.fetch(new Request(url.origin + "/version.json")); curV = Number((await r.json()).v) || curV; curAt = Date.now(); } catch (e) {}
  return curV;
}
function refuseWs(m) {
  const [client, server] = Object.values(new WebSocketPair());
  server.accept(); server.send(JSON.stringify({ t: "error", m })); server.close(1008, "versao antiga");
  return new Response(null, { status: 101, webSocket: client });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/ws\/([A-Za-z0-9]{3,16})$/);
    if (m) {
      const cur = await currentVersion(env, url), cv = Number(url.searchParams.get("cv")) || 0;
      if (cur && cv < cur && request.headers.get("Upgrade") === "websocket") return refuseWs("Atualize o jogo para jogar online: feche e abra o jogo (no site, recarregue a página).");
      return env.ROOMS.get(env.ROOMS.idFromName(m[1].toUpperCase())).fetch(request);
    }
    if (url.pathname.startsWith("/api/")) {                           // contas
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
      if (!env.ACCOUNTS) return J({ error: "Contas indisponíveis." }, 503);
      return env.ACCOUNTS.get(env.ACCOUNTS.idFromName("contas")).fetch(request);
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);                 // o jogo (pasta game/public)
    return new Response("Arena Zumbi - servidor online", { headers: { "content-type": "text/plain; charset=utf-8" } });
  },
};
