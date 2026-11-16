const { chromium } = require('playwright'); const fs = require('fs');
const src = fs.readFileSync('/home/claude/arena-zumbi/src/tower.js', 'utf8');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@500;700&display=block');body{margin:0;background:#101216;font-family:Barlow,sans-serif}</style></head><body><canvas id="c"></canvas><script>${src}
function roofUnder(c, P, X, Y, k) {
  if (!P.roof) return;
  c.strokeStyle = 'rgba(255,255,255,0.05)'; c.lineWidth = 1;
  for (let u = -P.A; u <= P.A; u += 4) { c.beginPath(); c.moveTo(X(u), Y(-P.A)); c.lineTo(X(u), Y(P.A)); c.stroke(); c.beginPath(); c.moveTo(X(-P.A), Y(u)); c.lineTo(X(P.A), Y(u)); c.stroke(); }
  const e = P.exit; c.fillStyle = '#24292e'; c.beginPath(); c.arc(X(e.x), Y(e.y), (e.r + 0.6) * k, 0, 6.3); c.fill();
  c.strokeStyle = '#e8be3c'; c.lineWidth = Math.max(2, k * 0.45); c.beginPath(); c.arc(X(e.x), Y(e.y), e.r * k * 0.86, 0, 6.3); c.stroke();
}
function roofFurn(c, f, X, Y, k) {
  if (f.k === 'solar') { c.fillStyle = '#23426e'; c.fillRect(X(f.x - f.w / 2), Y(f.y + f.d / 2), f.w * k, f.d * k); c.strokeStyle = 'rgba(160,200,255,0.45)'; c.lineWidth = 1; for (let i = 1; i < 4; i++) { const xx = X(f.x - f.w / 2 + f.w * i / 4); c.beginPath(); c.moveTo(xx, Y(f.y + f.d / 2)); c.lineTo(xx, Y(f.y - f.d / 2)); c.stroke(); } return true; }
  if (f.k === 'claraboia') { c.fillStyle = '#9ec9e0'; c.fillRect(X(f.x - f.w / 2), Y(f.y + f.d / 2), f.w * k, f.d * k); c.strokeStyle = '#5d7d8f'; c.lineWidth = 1.5; c.strokeRect(X(f.x - f.w / 2), Y(f.y + f.d / 2), f.w * k, f.d * k); c.beginPath(); c.moveTo(X(f.x - f.w / 2), Y(f.y)); c.lineTo(X(f.x + f.w / 2), Y(f.y)); c.stroke(); return true; }
  if (f.k === 'antena') { c.strokeStyle = '#c9ced6'; c.lineWidth = 1.5; c.beginPath(); c.arc(X(f.x), Y(f.y), Math.max(2, k * 0.9), 0, 6.3); c.stroke(); c.fillStyle = '#ff3b30'; c.beginPath(); c.arc(X(f.x), Y(f.y), Math.max(1.5, k * 0.3), 0, 6.3); c.fill(); return true; }
  return false;
}
function roofOver(c, P, X, Y, k, big) {
  if (!P.roof) return;
  c.strokeStyle = '#8e949c'; c.lineWidth = big ? 6 : 3; c.lineCap = 'square';
  for (const w of P.parapet) { c.beginPath(); c.moveTo(X(w[0]), Y(w[1])); c.lineTo(X(w[2]), Y(w[3])); c.stroke(); }
  const h = P.heli; c.save(); c.translate(X(h.x), Y(h.y)); c.rotate(h.yaw); c.scale(k, k);   // nariz para o "cima" local; 1 unidade = 1 m
  c.fillStyle = '#d9662a'; c.strokeStyle = '#1d2226'; c.lineWidth = 0.12;
  c.beginPath(); c.ellipse(0, 0.2, 1.15, 3.6, 0, 0, 6.3); c.fill(); c.stroke();                                   // fuselagem
  c.fillStyle = '#6fa8bf'; c.beginPath(); c.ellipse(0, -2.3, 0.95, 1.4, 0, 3.3, 6.12); c.fill();                   // vidro da cabine
  c.fillStyle = '#d9662a'; c.fillRect(-0.22, 3.4, 0.44, 5.0); c.strokeRect(-0.22, 3.4, 0.44, 5.0);                // cauda
  c.fillRect(-1.2, 7.0, 2.4, 0.45); c.strokeRect(-1.2, 7.0, 2.4, 0.45);                                           // estabilizador
  c.fillStyle = '#2b2f33'; c.fillRect(-1.25, -2.9, 0.16, 4.9); c.fillRect(1.09, -2.9, 0.16, 4.9);                 // esquis
  c.strokeStyle = 'rgba(20,20,22,0.85)'; c.lineWidth = 0.28;
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; c.beginPath(); c.moveTo(0, 0.2); c.lineTo(Math.cos(a) * 6, 0.2 + Math.sin(a) * 6); c.stroke(); }   // pás
  c.strokeStyle = 'rgba(232,236,242,0.35)'; c.lineWidth = 0.08; c.setLineDash([0.5, 0.4]); c.beginPath(); c.arc(0, 0.2, 6, 0, 6.3); c.stroke(); c.setLineDash([]);
  c.restore();
}

function draw(c, P, S, big) {
  const A = P.A, k = S / (2 * A + 4), X = (x) => (x + A + 2) * k, Y = (y) => (A + 2 - y) * k;
  c.fillStyle = '#14171c'; c.fillRect(0, 0, S, S);
  for (const g of P.regs) { c.fillStyle = g.kind === 'terrace' ? (P.roof ? '#30353a' : '#2f4434') : g.kind === 'hall' ? '#3a3f48' : '#2a2e35'; c.fillRect(X(g.x0), Y(g.y1), (g.x1 - g.x0) * k, (g.y1 - g.y0) * k); }
  roofUnder(c, P, X, Y, k);
  if (P.top && !P.roof) { const t = P.regs.find((g) => g.kind === 'terrace'); c.strokeStyle = 'rgba(140,200,140,0.25)'; c.lineWidth = 1; for (let x = t.x0; x < t.x1; x += 3) { c.beginPath(); c.moveTo(X(x), Y(t.y0)); c.lineTo(X(x), Y(t.y1)); c.stroke(); } }
  c.strokeStyle = '#d9dde4'; c.lineWidth = big ? 3 : 1.6; c.lineCap = 'square';
  for (const w of P.walls) { c.beginPath(); c.moveTo(X(w[0]), Y(w[1])); c.lineTo(X(w[2]), Y(w[3])); c.stroke(); }
  c.strokeStyle = '#ff9f43'; c.lineWidth = big ? 3 : 1.4;
  for (const d of P.doors) { c.beginPath(); if (d.axis === 'x') { c.moveTo(X(d.x), Y(d.y - d.w / 2)); c.lineTo(X(d.x) + d.w * k * 0.8, Y(d.y - d.w / 2) - d.w * k * 0.6); } else { c.moveTo(X(d.x - d.w / 2), Y(d.y)); c.lineTo(X(d.x - d.w / 2) + d.w * k * 0.6, Y(d.y) - d.w * k * 0.8); } c.stroke(); }
  const FC = { mesa: '#8a6440', mesa_longa: '#8a6440', mesa_redonda: '#8a6440', mesinha: '#7a5a3a', cadeira: '#4a5160', monitor: '#1c1f24', gaveteiro: '#7d8794', estante: '#6c737d', arquivo: '#8c949e', rack: '#25324a', caixas: '#b08a55', sofa: '#6a4a7a', tv: '#111', balcao: '#c9ccd2', geladeira: '#eef1f5', box: '#9fb4c4', pia: '#d8e3ea', planta: '#3f8f4a', banco: '#7a6a55', maquina: '#c2413a', lixeira: '#555', quadro: '#e8ecf2', ar: '#8e979f', caixa_dagua: '#4f8fb0', jardineira: '#5c7a3c', antena: '#bbb' };
  if (P.furn) for (const f of P.furn) {
    if (f.locker || roofFurn(c, f, X, Y, k)) continue;
    c.fillStyle = FC[f.k] || '#888';
    if (f.k === 'planta' || f.k === 'mesa_redonda' || f.k === 'caixa_dagua') { c.beginPath(); c.arc(X(f.x), Y(f.y), Math.max(1.2, f.w / 2 * k), 0, 6.3); c.fill(); }
    else { c.fillRect(X(f.x - f.w / 2), Y(f.y + f.d / 2), Math.max(1, f.w * k), Math.max(1, f.d * k)); if (big && (f.k === 'sofa' || f.k === 'box' || f.k === 'estante' || f.k === 'rack')) { c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1; c.strokeRect(X(f.x - f.w / 2), Y(f.y + f.d / 2), f.w * k, f.d * k); } }
  }
  if (big) { c.font = '500 ' + Math.round(k * 0.95) + 'px Barlow'; c.textAlign = 'center'; c.textBaseline = 'middle'; for (const g of P.regs) { if (g.kind === 'hall' || !g.type) continue; c.fillStyle = 'rgba(232,236,242,0.42)'; c.fillText(P.TYPES[g.type], X(g.cx), Y(g.y1) + k * 0.9); } }
  const r = Math.max(2, k * (big ? 0.55 : 0.75));
  for (const l of P.lockers) { c.fillStyle = '#e07b2c'; const w = l.face % 2 ? 0.7 : 1.4, h = l.face % 2 ? 1.4 : 0.7; c.fillRect(X(l.x - w / 2), Y(l.y + h / 2), w * k, h * k); }
  for (const it of P.items) { c.fillStyle = it.kind === 'bateria' ? '#ffd23a' : '#4fd1ff'; c.beginPath(); c.arc(X(it.x), Y(it.y), r, 0, 6.3); c.fill(); }
  for (const z of P.zombies) { c.beginPath(); c.arc(X(z.x), Y(z.y), r * 1.1, 0, 6.3); if (z.hidden) { c.strokeStyle = '#ff3b30'; c.lineWidth = 2; c.stroke(); } else { c.fillStyle = '#ff3b30'; c.fill(); } }
  const sq = (p, col, t) => { const s = k * 2.6; c.fillStyle = col; c.fillRect(X(p.x) - s / 2, Y(p.y) - s / 2, s, s); c.fillStyle = '#0b0d10'; c.font = '700 ' + Math.round(s * 0.7) + 'px Barlow'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, X(p.x), Y(p.y) + 1); };
  sq(P.arrive, '#4aa3ff', P.floor ? '↓' : 'E');
  if (P.up) sq(P.up, '#3ddc84', '↑');
  if (P.elev) sq(P.elev, '#b388ff', 'E');
  if (P.exit) { c.strokeStyle = '#3ddc84'; c.lineWidth = 3; c.beginPath(); c.arc(X(P.exit.x), Y(P.exit.y), P.exit.r * k, 0, 6.3); c.stroke(); c.fillStyle = '#3ddc84'; c.font = '700 ' + Math.round(k * 4) + 'px Barlow'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('H', X(P.exit.x), Y(P.exit.y)); }
  roofOver(c, P, X, Y, k, big);
}
window.sheet = (lv) => {
  const L = TOWER.LEVELS[lv], n = L.floors, cols = n <= 9 ? (n <= 7 ? 4 : 5) : 5, rows = Math.ceil(n / cols), T = 330, H = 40, W = cols * T, Hh = rows * (T + H) + 110;
  const cv = document.getElementById('c'); cv.width = W; cv.height = Hh; const c = cv.getContext('2d');
  c.fillStyle = '#101216'; c.fillRect(0, 0, W, Hh);
  c.fillStyle = '#fff'; c.font = '700 40px Barlow'; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText('Modo Prédio · ' + L.name + ' · ' + n + ' andares', 16, 14);
  c.fillStyle = '#aab3c0'; c.font = '500 22px Barlow'; c.fillText('Zumbis: ' + TOWER.AI[L.ai].name, 16, 62);
  for (let f = 0; f < n; f++) {
    const P = TOWER.plan(lv, f), x = (f % cols) * T, y = 110 + Math.floor(f / cols) * (T + H);
    c.save(); c.translate(x + 6, y + H); draw(c, P, T - 12, false); c.restore();
    c.fillStyle = '#e8ecf2'; c.font = '700 22px Barlow'; c.textAlign = 'left'; c.textBaseline = 'top';
    c.fillText((f === n - 1 ? 'Andar ' + (f + 1) + ' · terraço' : 'Andar ' + (f + 1)) + (P.elev ? ' · elevador' : ''), x + 8, y + 8);
    c.fillStyle = '#ff6b60'; c.font = '500 18px Barlow'; c.textAlign = 'right'; c.fillText(P.zombies.length + ' zumbis', x + T - 10, y + 12);
  }
};
window.detail = (lv, f) => {
  const S = 1100, cv = document.getElementById('c'); cv.width = S + 330; cv.height = S; const c = cv.getContext('2d'); const P = TOWER.plan(lv, f);
  c.fillStyle = '#101216'; c.fillRect(0, 0, cv.width, S); draw(c, P, S, true);
  const lx = S + 24; let y = 30; c.textAlign = 'left'; c.textBaseline = 'top';
  c.fillStyle = '#fff'; c.font = '700 34px Barlow'; c.fillText(TOWER.LEVELS[lv].name + ' · Andar ' + (f + 1) + (P.top ? ' (terraço)' : ''), lx, y); y += 46;
  c.fillStyle = '#aab3c0'; c.font = '500 19px Barlow'; c.fillText('72 × 72 m · ' + P.regs.filter((g) => g.kind === 'room').length + ' salas · ' + P.doors.length + ' portas', lx, y); y += 26; c.fillText(P.zombies.length + ' zumbis · ' + P.lockers.length + ' armários · ' + P.items.length + ' itens', lx, y); y += 26; c.fillText('Zumbis: ' + P.ai.name, lx, y); y += 40;
  const leg = [['#4aa3ff', 'sq', f ? 'Chegada (escada de baixo)' : 'Entrada do prédio'], ['#3ddc84', 'sq', 'Escada para cima'], ['#b388ff', 'sq', 'Elevador (sobe 1 andar)'], ['#3ddc84', 'ring', 'Heliponto (saída do nível)'], ['#ff9f43', 'line', 'Porta'], ['#e07b2c', 'rect', 'Armário grande (esconderijo)'], ['#ffd23a', 'dot', 'Bateria da lanterna'], ['#4fd1ff', 'dot', 'Item da mochila'], ['#ff3b30', 'dot', 'Zumbi'], ['#ff3b30', 'ring', 'Zumbi escondido'],
    ['#8a6440', 'rect', 'Mesa'], ['#4a5160', 'rect', 'Cadeira'], ['#7d8794', 'rect', 'Gaveteiro / arquivo'], ['#6c737d', 'rect', 'Estante'], ['#25324a', 'rect', 'Rack de servidor'], ['#b08a55', 'rect', 'Caixas'], ['#6a4a7a', 'rect', 'Sofá'], ['#c9ccd2', 'rect', 'Balcão da copa'], ['#eef1f5', 'rect', 'Geladeira'], ['#9fb4c4', 'rect', 'Box do banheiro'], ['#3f8f4a', 'dot', 'Planta'], ['#c2413a', 'rect', 'Máquina de lanche'], ['#8e979f', 'rect', 'Ar-condicionado (terraço)'], ['#4f8fb0', 'dot', 'Caixa d’água (terraço)'], ['#23426e', 'rect', 'Placa solar (terraço)'], ['#9ec9e0', 'rect', 'Claraboia (terraço)'], ['#d9662a', 'rect', 'Helicóptero de resgate'], ['#8e949c', 'rect', 'Mureta da borda']];
  for (const [col, t, txt] of leg) {
    c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 3;
    if (t === 'sq' || t === 'rect') c.fillRect(lx, y + 2, 22, 22); else if (t === 'dot') { c.beginPath(); c.arc(lx + 11, y + 13, 8, 0, 6.3); c.fill(); } else if (t === 'ring') { c.beginPath(); c.arc(lx + 11, y + 13, 9, 0, 6.3); c.stroke(); } else { c.beginPath(); c.moveTo(lx, y + 22); c.lineTo(lx + 22, y + 4); c.stroke(); }
    c.fillStyle = '#e8ecf2'; c.font = '500 19px Barlow'; c.fillText(txt, lx + 34, y + 3); y += 32;
  }
};
</script></body></html>`;
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  p.on('pageerror', (e) => console.log('ERR', e.message));
  await p.setContent(html, { waitUntil: 'networkidle' }); await p.evaluate(async () => { await document.fonts.load('700 40px Barlow'); await document.fonts.load('500 20px Barlow'); await document.fonts.ready; });
  for (let lv = 0; lv < 5; lv++) { await p.evaluate((lv) => window.sheet(lv), lv); await p.locator('#c').screenshot({ path: `${__dirname}/predio-nivel-${lv + 1}.png` }); }
  fs.mkdirSync(__dirname + '/andares', { recursive: true });
  for (let lv = 0; lv < 5; lv++) { const n = await p.evaluate((lv) => TOWER.LEVELS[lv].floors, lv); for (let f = 0; f < n; f++) { await p.evaluate(([lv, f]) => window.detail(lv, f), [lv, f]); await p.locator('#c').screenshot({ path: `${__dirname}/andares/nivel${lv + 1}-andar${String(f + 1).padStart(2, '0')}.png` }); } }
  const st = await p.evaluate(() => { const o = []; for (let lv = 0; lv < 5; lv++) for (let f = 0; f < TOWER.LEVELS[lv].floors; f++) { const P = TOWER.plan(lv, f); const unreached = P.regs.filter((g) => P.dist[g.id] >= 1e9).length; o.push([lv + 1, f + 1, P.regs.filter((g) => g.kind === 'room').length, P.doors.length, !!P.up || !!P.exit, unreached, P.zombies.length, P.lockers.length, P.items.length]); } return o; });
  console.log('n andares', st.length, 'sem saída', st.filter((x) => !x[4]).length, 'com salas inalcançáveis', st.filter((x) => x[5]).length, 'salas média', (st.reduce((a, x) => a + x[2], 0) / st.length).toFixed(1));
  await b.close();
})();
