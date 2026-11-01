// Servidor local para testar o co-op sem Cloudflare. Mesmo protocolo do worker/index.js.
// Uso: node tools/testserver.js [porta] [pasta-publica]
const http = require("http"), crypto = require("crypto"), fs = require("fs"), path = require("path");
const PORT = Number(process.argv[2]) || 8787, ROOT = path.resolve(process.argv[3] || path.join(__dirname, "..", "public"));
const rooms = new Map();

function frame(str) {
  const b = Buffer.from(str), n = b.length;
  const h = n < 126 ? Buffer.from([0x81, n]) : n < 65536 ? Buffer.from([0x81, 126, n >> 8, n & 255]) : (() => { const x = Buffer.alloc(10); x[0] = 0x81; x[1] = 127; x.writeBigUInt64BE(BigInt(n), 2); return x; })();
  return Buffer.concat([h, b]);
}
function parse(peer, chunk, onText) {
  peer.buf = Buffer.concat([peer.buf, chunk]);
  for (;;) {
    const b = peer.buf; if (b.length < 2) return;
    const op = b[0] & 15; let len = b[1] & 127, off = 2;
    if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); off = 4; }
    else if (len === 127) { if (b.length < 10) return; len = Number(b.readBigUInt64BE(2)); off = 10; }
    const masked = (b[1] & 128) !== 0; if (masked) off += 4;
    if (b.length < off + len) return;
    const payload = Buffer.from(b.slice(off, off + len));
    if (masked) { const m = b.slice(off - 4, off); for (let i = 0; i < payload.length; i++) payload[i] ^= m[i & 3]; }
    peer.buf = b.slice(off + len);
    if (op === 8) { peer.socket.end(); return; }
    if (op === 9) { peer.socket.write(Buffer.concat([Buffer.from([0x8a, payload.length]), payload])); continue; }
    if (op === 1) onText(payload.toString());
  }
}
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); res.end("404"); return; }
  res.writeHead(200, { "content-type": f.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream" }); fs.createReadStream(f).pipe(res);
});
server.on("upgrade", (req, socket) => {
  const m = /^\/ws\/([A-Za-z0-9]{3,8})/.exec(req.url);
  if (!m) { socket.destroy(); return; }
  const code = m[1].toUpperCase();
  const key = req.headers["sec-websocket-key"];
  socket.write("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " + crypto.createHash("sha1").update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest("base64") + "\r\n\r\n");
  const room = rooms.get(code) || new Map(); rooms.set(code, room);
  const peer = { socket, buf: Buffer.alloc(0), id: 0, name: "" };
  const send = (p, s) => { try { p.socket.write(frame(s)); } catch (e) {} };
  if (room.size >= 4) { send(peer, "0:" + JSON.stringify({ t: "full" })); socket.end(); return; }
  let id = 1; while (room.has(id)) id++;
  peer.id = id;
  const host = room.size ? Math.min(...room.keys()) : id;
  room.set(id, peer);
  send(peer, "0:" + JSON.stringify({ t: "welcome", id, host, players: [...room.values()].filter((p) => p !== peer).map((p) => ({ id: p.id, name: p.name })) }));
  const gone = () => {
    if (!room.has(peer.id)) return; room.delete(peer.id);
    const hostWas = peer.id < Math.min(99, ...room.keys());
    for (const p of room.values()) { send(p, "0:" + JSON.stringify({ t: hostWas ? "hostleft" : "leave", id: peer.id })); if (hostWas) p.socket.end(); }
    if (!room.size) rooms.delete(code);
  };
  socket.on("close", gone); socket.on("error", gone);
  socket.on("data", (c) => parse(peer, c, (txt) => {
    if (txt === "ping") { send(peer, "pong"); return; }
    const i = txt.indexOf(":"); if (i < 1 || i > 2) return;
    const to = txt.slice(0, i), body = txt.slice(i + 1), hostId = Math.min(...room.keys());
    if (to === "s") {
      let mm; try { mm = JSON.parse(body); } catch (e) { return; }
      if (mm.t === "hello") {
        peer.name = String(mm.name || "Jogador").slice(0, 14);
        for (const p of room.values()) if (p !== peer) send(p, "0:" + JSON.stringify({ t: "join", id: peer.id, name: peer.name }));
        send(peer, "0:" + JSON.stringify({ t: "joined", id: peer.id, host: hostId, players: [...room.values()].map((p) => ({ id: p.id, name: p.name })) }));
      }
      return;
    }
    const out = peer.id + ":" + body;
    if (to === "*") { for (const p of room.values()) if (p !== peer) send(p, out); }
    else if (to === "h") { if (peer.id !== hostId) send(room.get(hostId), out); }
    else { const t = room.get(Number(to)); if (t && t !== peer) send(t, out); }
  }));
});
server.listen(PORT, () => console.log("teste em http://localhost:" + PORT));
