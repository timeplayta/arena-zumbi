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
