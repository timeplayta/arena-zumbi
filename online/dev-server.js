// Servidor local para testar o co-op sem Cloudflare:  node online/dev-server.js [porta] [pasta-do-jogo]
// Faz o mesmo que worker.js (salas, host/convidados) e serve o index.html. Sem dependências.
const http = require("http"), crypto = require("crypto"), fs = require("fs"), path = require("path");
const PORT = Number(process.argv[2]) || 8787, DIR = path.resolve(process.argv[3] || path.join(__dirname, "..", "public"));
const MAX = 4, rooms = new Map();
const frame = (s) => { const b = Buffer.from(s), n = b.length; let h;
  if (n < 126) h = Buffer.from([0x81, n]); else if (n < 65536) { h = Buffer.alloc(4); h[0] = 0x81; h[1] = 126; h.writeUInt16BE(n, 2); } else { h = Buffer.alloc(10); h[0] = 0x81; h[1] = 127; h.writeBigUInt64BE(BigInt(n), 2); }
  return Buffer.concat([h, b]); };
const send = (c, o) => { if (c.sock.destroyed) return; try { c.sock.write(frame(typeof o === "string" ? o : JSON.stringify(o))); } catch (e) {} };
const closeC = (c) => { try { c.sock.write(Buffer.from([0x88, 0])); c.sock.end(); } catch (e) {} };
const server = http.createServer((req, res) => {
  const f = path.join(DIR, req.url.split("?")[0] === "/" ? "index.html" : req.url.split("?")[0]);
  if (!f.startsWith(DIR) || !fs.existsSync(f)) { res.writeHead(404); return res.end("404"); }
  res.writeHead(200, { "Content-Type": f.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream" }); fs.createReadStream(f).pipe(res);
});
server.on("upgrade", (req, sock) => {
  const u = new URL(req.url, "http://x"), m = u.pathname.match(/^\/ws\/([A-Za-z0-9]{3,8})$/);
  if (!m || !req.headers["sec-websocket-key"]) return sock.destroy();
  const key = crypto.createHash("sha1").update(req.headers["sec-websocket-key"] + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest("base64");
  sock.write("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " + key + "\r\n\r\n");
  const code = m[1].toUpperCase(), role = u.searchParams.get("role") === "host" ? "host" : "guest";
  const room = rooms.get(code) || new Set(), c = { sock, info: null }, peers = [...room], host = peers.find((p) => p.info.host);
  const refuse = (t) => { send(c, { t: "error", m: t }); closeC(c); };
  if (role === "host" && host) refuse("Essa sala já existe. Escolha outro código.");
  else if (role === "guest" && !host) refuse("Sala não encontrada. Confira o código.");
  else if (peers.length >= MAX) refuse("Sala cheia (máximo " + MAX + " jogadores).");
  else {
    const used = new Set(peers.map((p) => p.info.id)); let id = "p1";
    if (role === "guest") for (let i = 2; i <= MAX; i++) if (!used.has("p" + i)) { id = "p" + i; break; }
    c.info = { id, host: role === "host" }; room.add(c); rooms.set(code, room);
    send(c, { t: "welcome", id, host: c.info.host, max: MAX });
    if (role === "guest") send(host, { t: "join", id });
  }
  const drop = () => { if (!c.info || !room.has(c)) return; room.delete(c);
    if (c.info.host) { for (const p of room) { send(p, { t: "closed" }); closeC(p); } rooms.delete(code); }
    else { const h = [...room].find((p) => p.info.host); if (h) send(h, { t: "leave", id: c.info.id }); } };
  let buf = Buffer.alloc(0);
  sock.on("data", (d) => {
    buf = Buffer.concat([buf, d]);
    for (;;) {
      if (buf.length < 2) return;
      const op = buf[0] & 15; let len = buf[1] & 127, off = 2;
      if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; } else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
      const masked = buf[1] & 128; if (buf.length < off + (masked ? 4 : 0) + len) return;
      const mask = masked ? buf.slice(off, off + 4) : null; if (masked) off += 4;
      const p = Buffer.from(buf.slice(off, off + len)); if (mask) for (let i = 0; i < p.length; i++) p[i] ^= mask[i & 3];
      buf = buf.slice(off + len);
      if (op === 8) { drop(); return closeC(c); }
      if (op === 9) { sock.write(Buffer.concat([Buffer.from([0x8a, p.length]), p])); continue; }
      if (op !== 1 || !c.info) continue;
      const s = p.toString("utf8"); if (s === "ping") { send(c, "pong"); continue; }
      let o; try { o = JSON.parse(s); } catch (e) { continue; } if (!o || typeof o !== "object") continue;
      if (c.info.host) { const to = o.to; delete o.to; const out = JSON.stringify(o); for (const q of room) if (!q.info.host && (!to || q.info.id === to)) send(q, out); }
      else { o.from = c.info.id; delete o.to; const h = [...room].find((q) => q.info.host); if (h) send(h, o); }
    }
  });
  sock.on("close", drop); sock.on("error", drop);
});
server.listen(PORT, () => console.log("Arena Zumbi (dev) em http://localhost:" + PORT + "  pasta: " + DIR));
