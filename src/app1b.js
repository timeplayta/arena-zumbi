  // ======================================================================
  //  MUNDO: pátio em ruínas (texturas procedurais, props, céu e prédios)
  //  Tudo é desenhado em canvas na hora: nenhum arquivo externo.
  // ======================================================================
  const wdR = (seed) => {
    let s = seed >>> 0;
    return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  const wdCv = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; };
  const wdTex = (c, rx, ry) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx || 1, ry || 1); t.anisotropy = 4;
    return t;
  };
  const wdRgba = (r, g, b, a) => "rgba(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + "," + a + ")";
  // mancha suave que "dá a volta" nas bordas (a textura se repete sem emenda)
  function wdBlot(x, W, H, px, py, rad, rgb, a, wrap) {
    const offs = wrap ? [-1, 0, 1] : [0];
    for (const ox of offs) for (const oy of offs) {
      const cx = px + ox * W, cy = py + oy * H;
      if (cx + rad < 0 || cy + rad < 0 || cx - rad > W || cy - rad > H) continue;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0, wdRgba(rgb[0], rgb[1], rgb[2], a)); g.addColorStop(1, wdRgba(rgb[0], rgb[1], rgb[2], 0));
      x.fillStyle = g; x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    }
  }
  function wdCrack(x, r, x0, y0, len, w, col) {
    let a = r() * 6.28, px = x0, py = y0;
    x.strokeStyle = col; x.lineWidth = w; x.lineCap = "round";
    x.beginPath(); x.moveTo(px, py);
    const n = Math.max(3, (len / 9) | 0);
    for (let i = 0; i < n; i++) {
      a += (r() - 0.5) * 1.1; px += Math.cos(a) * (6 + r() * 10); py += Math.sin(a) * (6 + r() * 10);
      x.lineTo(px, py);
      if (r() < 0.12) { const bx = px, by = py, ba = a + (r() < 0.5 ? 1 : -1) * (0.5 + r() * 0.6); x.moveTo(bx, by); x.lineTo(bx + Math.cos(ba) * (8 + r() * 14), by + Math.sin(ba) * (8 + r() * 14)); x.moveTo(px, py); }
    }
    x.stroke();
  }

  // ---------- texturas ----------
  function wdAsphaltTex() {
    const [c, x] = wdCv(512, 512), r = wdR(11);
    x.fillStyle = "#54555a"; x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 70; i++) wdBlot(x, 512, 512, r() * 512, r() * 512, 25 + r() * 80, r() < 0.5 ? [0, 0, 0] : [255, 255, 255], 0.035 + r() * 0.06, true);
    for (let i = 0; i < 11000; i++) {
      const v = 55 + r() * 110 | 0;
      x.fillStyle = wdRgba(v, v, v + 3, 0.18 + r() * 0.5);
      const s = r() < 0.15 ? 2 : 1; x.fillRect(r() * 512, r() * 512, s, s);
    }
    for (let i = 0; i < 9; i++) wdCrack(x, r, 90 + r() * 330, 90 + r() * 330, 50 + r() * 90, 0.8 + r() * 1.2, wdRgba(10, 10, 12, 0.55));
    return wdTex(c, 8, 8);
  }
  function wdConcreteTex(seed, tone) {
    const [c, x] = wdCv(256, 256), r = wdR(seed);
    const b = tone || 128;
    x.fillStyle = wdRgba(b, b, b - 4, 1); x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 40; i++) wdBlot(x, 256, 256, r() * 256, r() * 256, 12 + r() * 50, r() < 0.5 ? [0, 0, 0] : [255, 255, 255], 0.05 + r() * 0.08, true);
    for (let i = 0; i < 4500; i++) { const v = b - 50 + r() * 100 | 0; x.fillStyle = wdRgba(v, v, v, 0.3 + r() * 0.4); x.fillRect(r() * 256, r() * 256, 1, 1); }
    for (let i = 0; i < 4; i++) wdCrack(x, r, 30 + r() * 190, 30 + r() * 190, 40 + r() * 70, 0.7 + r(), wdRgba(25, 25, 25, 0.6));
    return wdTex(c);
  }
  function wdWallTex() {
    const W = 512, H = 320, [c, x] = wdCv(W, H), r = wdR(21);
    x.fillStyle = "#6a6b6e"; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) wdBlot(x, W, H, r() * W, r() * H, 20 + r() * 70, r() < 0.5 ? [0, 0, 0] : [255, 255, 255], 0.04 + r() * 0.07, true);
    for (let i = 0; i < 9000; i++) { const v = 80 + r() * 90 | 0; x.fillStyle = wdRgba(v, v, v, 0.25 + r() * 0.4); x.fillRect(r() * W, r() * H, 1, 1); }
    // juntas dos painéis (a cada 256 px = 3 m)
    for (const sx of [0, 256]) {
      x.fillStyle = "rgba(10,10,12,0.75)"; x.fillRect(sx - 2, 0, 4, H);
      x.fillStyle = "rgba(255,255,255,0.12)"; x.fillRect(sx + 2, 0, 2, H);
      for (let k = 0; k < 4; k++) { const by = 30 + k * 80; x.fillStyle = "rgba(20,20,20,0.7)"; x.beginPath(); x.arc(sx + 18, by, 3, 0, 6.3); x.arc(sx - 18, by, 3, 0, 6.3); x.fill(); }
    }
    // juntas horizontais finas
    x.fillStyle = "rgba(10,10,12,0.4)"; x.fillRect(0, 158, W, 2);
    // marcas de água escorrendo do topo
    for (let i = 0; i < 46; i++) {
      const px = r() * W, len = 60 + r() * 220, w = 1 + r() * 7;
      const g = x.createLinearGradient(0, 0, 0, len);
      g.addColorStop(0, "rgba(25,22,18," + (0.1 + r() * 0.2) + ")"); g.addColorStop(1, "rgba(25,22,18,0)");
      x.fillStyle = g; x.fillRect(px, 0, w, len);
    }
    // ferrugem sob os parafusos
    for (const sx of [0, 256]) for (let k = 0; k < 4; k++) {
      const g = x.createLinearGradient(0, 30 + k * 80, 0, 30 + k * 80 + 60);
      g.addColorStop(0, "rgba(120,60,25,0.45)"); g.addColorStop(1, "rgba(120,60,25,0)");
      x.fillStyle = g; x.fillRect(sx + 15, 30 + k * 80, 5, 60); x.fillRect(sx - 21, 30 + k * 80, 5, 60);
    }
    // sujeira e limo na base
    const gb = x.createLinearGradient(0, H * 0.55, 0, H);
    gb.addColorStop(0, "rgba(30,36,24,0)"); gb.addColorStop(1, "rgba(24,28,18,0.75)");
    x.fillStyle = gb; x.fillRect(0, H * 0.55, W, H * 0.45);
    for (let i = 0; i < 90; i++) { x.fillStyle = wdRgba(40 + r() * 30, 55 + r() * 30, 25, 0.35); x.beginPath(); x.arc(r() * W, H - r() * 40, 1 + r() * 4, 0, 6.3); x.fill(); }
    // remendo de tijolos expostos
    const bx = 300, by = 70, bw = 120, bh = 70;
    x.save(); x.beginPath();
    x.moveTo(bx, by + 10); x.lineTo(bx + 30, by); x.lineTo(bx + 70, by + 8); x.lineTo(bx + bw, by + 4); x.lineTo(bx + bw - 6, by + bh * 0.6); x.lineTo(bx + bw, by + bh); x.lineTo(bx + 50, by + bh - 6); x.lineTo(bx, by + bh); x.closePath(); x.clip();
    x.fillStyle = "#4a2a22"; x.fillRect(bx, by, bw, bh);
    for (let row = 0; row < 8; row++) for (let col = -1; col < 9; col++) {
      const ox = (row % 2) * 8, rx = bx + col * 16 + ox, ry = by + row * 9;
      const v = r() * 40;
      x.fillStyle = wdRgba(118 + v, 56 + v * 0.5, 40 + v * 0.3, 1); x.fillRect(rx + 1, ry + 1, 14, 7);
    }
    x.restore();
    x.strokeStyle = "rgba(0,0,0,0.6)"; x.lineWidth = 1.5; x.beginPath();
    x.moveTo(bx, by + 10); x.lineTo(bx + 30, by); x.lineTo(bx + 70, by + 8); x.lineTo(bx + bw, by + 4); x.lineTo(bx + bw - 6, by + bh * 0.6); x.lineTo(bx + bw, by + bh); x.lineTo(bx + 50, by + bh - 6); x.lineTo(bx, by + bh); x.closePath(); x.stroke();
    // buracos de bala
    for (let i = 0; i < 9; i++) {
      const px = 90 + r() * 70, py = 150 + r() * 60;
      x.fillStyle = "rgba(15,15,15,0.85)"; x.beginPath(); x.arc(px, py, 2 + r() * 2, 0, 6.3); x.fill();
      x.strokeStyle = "rgba(220,220,220,0.25)"; x.lineWidth = 1; x.beginPath(); x.arc(px, py, 4 + r() * 3, 0, 6.3); x.stroke();
    }
    for (let i = 0; i < 5; i++) wdCrack(x, r, 40 + r() * 430, 20 + r() * 260, 50 + r() * 100, 0.8 + r(), wdRgba(20, 20, 20, 0.6));
    return wdTex(c);
  }
  // overlay do chão: faixas, rachaduras, poças, óleo, sangue, mato e entulho
  function wdFloorOverlay() {
    const N = 1024, S = N / 48, [c, x] = wdCv(N, N), r = wdR(33);
    const X = (v) => (v + 24) * S, Y = (v) => (24 - v) * S;
    // sujeira junto ao muro
    const edge = (gx0, gy0, gx1, gy1, rx, ry, rw, rh) => {
      const g = x.createLinearGradient(gx0, gy0, gx1, gy1);
      g.addColorStop(0, "rgba(28,24,16,0.75)"); g.addColorStop(1, "rgba(28,24,16,0)");
      x.fillStyle = g; x.fillRect(rx, ry, rw, rh);
    };
    const eb = 4.2 * S;
    edge(0, 0, eb, 0, 0, 0, eb, N); edge(N, 0, N - eb, 0, N - eb, 0, eb, N);
    edge(0, 0, 0, eb, 0, 0, N, eb); edge(0, N, 0, N - eb, 0, N - eb, N, eb);
    // manchas de óleo e remendos
    for (let i = 0; i < 22; i++) wdBlot(x, N, N, r() * N, r() * N, 14 + r() * 40, [4, 4, 6], 0.25 + r() * 0.3, false);
    for (let i = 0; i < 7; i++) {
      x.save(); x.translate(r() * N, r() * N); x.rotate((r() - 0.5) * 0.2);
      const w = (30 + r() * 60), h = (24 + r() * 40);
      x.fillStyle = wdRgba(20, 20, 22, 0.35); x.fillRect(-w / 2, -h / 2, w, h);
      x.strokeStyle = wdRgba(8, 8, 8, 0.5); x.lineWidth = 1.5; x.strokeRect(-w / 2, -h / 2, w, h);
      x.restore();
    }
    // marcas de pneu
    x.lineCap = "round";
    for (let i = 0; i < 5; i++) {
      const sx = r() * N, sy = r() * N, ex = sx + (r() - 0.5) * 380, ey = sy + (r() - 0.5) * 380, mx = (sx + ex) / 2 + (r() - 0.5) * 140, my = (sy + ey) / 2 + (r() - 0.5) * 140;
      for (const o of [-6, 6]) { x.strokeStyle = wdRgba(8, 8, 8, 0.22); x.lineWidth = 6; x.beginPath(); x.moveTo(sx + o, sy); x.quadraticCurveTo(mx + o, my, ex + o, ey); x.stroke(); }
    }
    // pintura (desenhada à parte para ser desgastada)
    const [pc, p] = wdCv(N, N);
    p.fillStyle = "rgba(220,220,215,0.8)";
    const line = (y, a) => { p.fillStyle = a || "rgba(222,222,214,0.8)"; p.fillRect(X(-22), Y(y) - 0.09 * S, 44 * S, 0.18 * S); };
    line(3.7); line(-3.7);
    p.fillStyle = "rgba(230,190,40,0.85)";
    for (let k = -21.5; k < 21; k += 3.4) { p.fillRect(X(k), Y(0.16) - 0.07 * S, 2.2 * S, 0.14 * S); p.fillRect(X(k), Y(-0.16) - 0.07 * S, 2.2 * S, 0.14 * S); }
    p.fillStyle = "rgba(222,222,214,0.82)";
    for (let k = -3.2; k <= 3.2; k += 0.9) p.fillRect(X(11.5), Y(k) - 0.22 * S, 3.2 * S, 0.44 * S);
    p.fillRect(X(10.7), Y(3.7), 0.4 * S, 7.4 * S);
    // vagas de estacionamento
    p.fillStyle = "rgba(222,222,214,0.7)";
    for (let k = -21; k <= -8; k += 2.6) p.fillRect(X(k) - 0.06 * S, Y(21), 0.12 * S, 5 * S);
    p.fillRect(X(-21), Y(16) - 0.06 * S, 13 * S, 0.12 * S);
    p.fillStyle = "rgba(230,190,40,0.7)";
    for (let k = 0; k < 9; k++) p.fillRect(X(-3.5) + k * 0.9 * S, Y(20.6), 0.3 * S, 3 * S);
    // seta e texto na pista
    p.save(); p.translate(X(-15), Y(-2)); p.rotate(-Math.PI / 2); p.fillStyle = "rgba(222,222,214,0.75)"; p.font = "bold " + (1.6 * S | 0) + "px Impact, 'Arial Black', sans-serif"; p.textAlign = "center"; p.fillText("PARE", 0, 0); p.restore();
    p.save(); p.translate(X(19), Y(1.9)); p.fillStyle = "rgba(222,222,214,0.7)";
    p.beginPath(); p.moveTo(0, -0.9 * S); p.lineTo(0.7 * S, 0.1 * S); p.lineTo(0.25 * S, 0.1 * S); p.lineTo(0.25 * S, 1.2 * S); p.lineTo(-0.25 * S, 1.2 * S); p.lineTo(-0.25 * S, 0.1 * S); p.lineTo(-0.7 * S, 0.1 * S); p.closePath(); p.rotate(-Math.PI / 2); p.fill(); p.restore();
    // desgaste da tinta
    p.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 5200; i++) { p.fillStyle = "rgba(0,0,0," + (0.35 + r() * 0.65) + ")"; const s = 1 + r() * 4; p.fillRect(r() * N, r() * N, s, s * (0.5 + r())); }
    for (let i = 0; i < 40; i++) wdBlot(p, N, N, r() * N, r() * N, 6 + r() * 26, [0, 0, 0], 0.5, false);
    p.globalCompositeOperation = "source-over";
    x.drawImage(pc, 0, 0);
    // bueiros
    for (const [mx, my] of [[-6, -2], [10, 4.6], [0, -16.5], [-18, 8]]) {
      x.fillStyle = "rgba(20,20,22,0.9)"; x.beginPath(); x.arc(X(mx), Y(my), 0.46 * S, 0, 6.3); x.fill();
      x.strokeStyle = "rgba(90,90,95,0.8)"; x.lineWidth = 2; x.stroke();
      x.strokeStyle = "rgba(60,60,64,0.9)"; x.lineWidth = 1.5;
      for (let k = -2; k <= 2; k++) { x.beginPath(); x.moveTo(X(mx) - 0.4 * S, Y(my) + k * 0.15 * S); x.lineTo(X(mx) + 0.4 * S, Y(my) + k * 0.15 * S); x.stroke(); }
    }
    // rachaduras
    for (let i = 0; i < 34; i++) wdCrack(x, r, r() * N, r() * N, 60 + r() * 230, 0.8 + r() * 1.6, wdRgba(8, 8, 9, 0.6));
    // poças
    for (const [px, py, pw, ph] of [[-12, -1.5, 2.6, 1.3], [5, -13.5, 3.2, 1.6], [14, 9, 2.4, 1.2], [-8, 17.5, 2.0, 1.0], [2, 9.5, 1.8, 0.9], [19, -2, 1.6, 0.8], [-1, -19, 2.8, 1.2]]) {
      x.save(); x.translate(X(px), Y(py)); x.rotate(r() * 3);
      x.beginPath();
      for (let a = 0; a <= 24; a++) { const t = a / 24 * 6.2832, k = 0.85 + r() * 0.3; const ex = Math.cos(t) * pw * S * 0.5 * k, ey = Math.sin(t) * ph * S * 0.5 * k; if (a === 0) x.moveTo(ex, ey); else x.lineTo(ex, ey); }
      x.closePath();
      x.fillStyle = "rgba(10,14,22,0.62)"; x.fill();
      x.strokeStyle = "rgba(150,170,200,0.22)"; x.lineWidth = 1.5; x.stroke();
      x.strokeStyle = "rgba(180,200,230,0.12)"; x.beginPath(); x.ellipse(-pw * S * 0.12, -ph * S * 0.1, pw * S * 0.2, ph * S * 0.12, 0, 0, 6.3); x.stroke();
      x.restore();
    }
    // sangue seco e arrastos
    for (let i = 0; i < 12; i++) {
      const sx = (r() * 2 - 1) * 20, sy = (r() * 2 - 1) * 20, a = r() * 6.3;
      wdBlot(x, N, N, X(sx), Y(sy), 10 + r() * 24, [70, 8, 8], 0.75, false);
      for (let k = 0; k < 18; k++) { const d = r() * 40 * r(), t = r() * 6.3; x.fillStyle = wdRgba(75, 8, 8, 0.6); x.beginPath(); x.arc(X(sx) + Math.cos(t) * d, Y(sy) + Math.sin(t) * d, 1 + r() * 3, 0, 6.3); x.fill(); }
      if (r() < 0.55) { x.strokeStyle = wdRgba(70, 8, 8, 0.55); x.lineWidth = 5 + r() * 5; x.lineCap = "round"; x.beginPath(); x.moveTo(X(sx), Y(sy)); x.quadraticCurveTo(X(sx) + Math.cos(a) * 40, Y(sy) + Math.sin(a) * 40, X(sx) + Math.cos(a + 0.3) * (70 + r() * 70), Y(sy) + Math.sin(a + 0.3) * (70 + r() * 70)); x.stroke(); }
    }
    // entulho, papéis e folhas
    for (let i = 0; i < 160; i++) {
      const px = r() * N, py = r() * N, k = r();
      x.save(); x.translate(px, py); x.rotate(r() * 6.3);
      if (k < 0.4) { const v = 70 + r() * 70 | 0; x.fillStyle = wdRgba(v, v, v - 4, 0.9); const s = 2 + r() * 5; x.beginPath(); x.moveTo(-s, 0); x.lineTo(0, -s * 0.8); x.lineTo(s, 0.2 * s); x.lineTo(0.3 * s, s * 0.7); x.closePath(); x.fill(); }
      else if (k < 0.6) { x.fillStyle = wdRgba(200, 198, 185, 0.5); x.fillRect(-3, -2, 6 + r() * 4, 4 + r() * 3); }
      else { x.fillStyle = wdRgba(70 + r() * 40, 55 + r() * 25, 25, 0.7); x.beginPath(); x.ellipse(0, 0, 3 + r() * 3, 1.5 + r() * 1.5, 0, 0, 6.3); x.fill(); }
      x.restore();
    }
    // mato rompendo o asfalto, principalmente perto do muro
    const weed = (px, py) => {
      const n = 3 + (r() * 5 | 0);
      for (let k = 0; k < n; k++) {
        x.strokeStyle = ["#2c3a20", "#3b4a26", "#566032", "#4a4326"][r() * 4 | 0]; x.lineWidth = 1 + r();
        const a = -Math.PI / 2 + (r() - 0.5) * 2.2, l = 5 + r() * 12;
        x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l * 0.5, py + Math.sin(a) * l * 0.5 - 2, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
      }
    };
    for (let i = 0; i < 420; i++) {
      const side = r() * 4 | 0, u = r() * N, d = (0.1 + r() * r() * 3.4) * S;
      weed(side === 0 ? u : side === 1 ? u : side === 2 ? d : N - d, side === 0 ? d : side === 1 ? N - d : u);
    }
    for (let i = 0; i < 110; i++) weed(r() * N, r() * N);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  }
  // painéis de pichação / avisos (decalques no muro)
  function wdSignTex(kind, seed) {
    const W = 512, H = 192, [c, x] = wdCv(W, H), r = wdR(seed);
    x.clearRect(0, 0, W, H);
    if (kind === "text") {
      const words = ["SEM SAÍDA", "NÃO ENTRE", "ELES VÊM À NOITE", "CORRA", "FIM DOS TEMPOS", "QUARENTENA", "NÃO ABRA", "ACABOU"];
      const w = words[seed % words.length];
      x.save(); x.translate(W / 2, H * 0.55); x.rotate((r() - 0.5) * 0.12);
      let fs = 78; x.font = "bold " + fs + "px Impact, 'Arial Black', sans-serif";
      while (x.measureText(w).width > W - 50 && fs > 20) { fs -= 4; x.font = "bold " + fs + "px Impact, 'Arial Black', sans-serif"; }
      x.textAlign = "center"; x.textBaseline = "middle";
      const col = r() < 0.55 ? [185, 25, 20] : [225, 225, 215];
      x.fillStyle = wdRgba(col[0], col[1], col[2], 0.82); x.fillText(w, 0, 0);
      x.globalCompositeOperation = "destination-out";
      for (let i = 0; i < 700; i++) { x.fillStyle = "rgba(0,0,0," + r() * 0.8 + ")"; x.fillRect((r() - 0.5) * W, (r() - 0.5) * H, 1 + r() * 2, 1 + r() * 2); }
      x.globalCompositeOperation = "source-over";
      const tw = x.measureText(w).width;
      for (let i = 0; i < 9; i++) { const dx = (r() - 0.5) * tw, len = 14 + r() * 50; const g = x.createLinearGradient(0, fs * 0.35, 0, fs * 0.35 + len); g.addColorStop(0, wdRgba(col[0], col[1], col[2], 0.7)); g.addColorStop(1, wdRgba(col[0], col[1], col[2], 0)); x.fillStyle = g; x.fillRect(dx, fs * 0.3, 2.2, len); }
      x.restore();
    } else if (kind === "hands") {
      for (let i = 0; i < 6; i++) {
        const px = 50 + r() * 410, py = 40 + r() * 110;
        x.save(); x.translate(px, py); x.rotate((r() - 0.5) * 0.7); x.fillStyle = "rgba(95,8,8,0.8)";
        x.beginPath(); x.ellipse(0, 6, 17, 20, 0, 0, 6.3); x.fill();
        for (let f = 0; f < 4; f++) { x.beginPath(); x.ellipse(-14 + f * 9.5, -17 - (f === 1 || f === 2 ? 5 : 0), 4.3, 13, (f - 1.5) * 0.1, 0, 6.3); x.fill(); }
        x.beginPath(); x.ellipse(-20, 4, 4, 11, -0.9, 0, 6.3); x.fill();
        const g = x.createLinearGradient(0, 14, 0, 70); g.addColorStop(0, "rgba(95,8,8,0.7)"); g.addColorStop(1, "rgba(95,8,8,0)"); x.fillStyle = g; x.fillRect(-9, 14, 4, 56); x.fillRect(3, 14, 3, 40);
        x.restore();
      }
    } else if (kind === "sign") {
      x.save(); x.translate(W / 2, H / 2);
      x.fillStyle = "rgba(210,170,20,0.95)"; x.beginPath(); x.moveTo(0, -80); x.lineTo(92, 78); x.lineTo(-92, 78); x.closePath(); x.fill();
      x.strokeStyle = "rgba(20,20,20,0.95)"; x.lineWidth = 9; x.lineJoin = "round"; x.stroke();
      x.fillStyle = "rgba(20,20,20,0.95)"; x.font = "bold 92px Arial, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("!", 0, 22);
      x.globalCompositeOperation = "destination-out";
      for (let i = 0; i < 500; i++) { x.fillStyle = "rgba(0,0,0," + r() * 0.5 + ")"; x.fillRect((r() - 0.5) * 200, (r() - 0.5) * 170, 1 + r() * 3, 1 + r() * 3); }
      x.restore();
    } else {   // "x" e setas de aviso
      x.strokeStyle = "rgba(190,28,22,0.8)"; x.lineWidth = 15; x.lineCap = "round";
      x.beginPath(); x.moveTo(150, 30); x.lineTo(280, 160); x.moveTo(280, 30); x.lineTo(150, 160); x.stroke();
      x.lineWidth = 9; x.beginPath(); x.moveTo(320, 100); x.lineTo(470, 90); x.moveTo(440, 60); x.lineTo(474, 90); x.lineTo(444, 124); x.stroke();
      x.globalCompositeOperation = "destination-out";
      for (let i = 0; i < 600; i++) { x.fillStyle = "rgba(0,0,0," + r() * 0.6 + ")"; x.fillRect(r() * W, r() * H, 1 + r() * 3, 1 + r() * 2); }
    }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  function wdGateTex() {
    const W = 256, H = 256, [c, x] = wdCv(W, H), r = wdR(47);
    x.fillStyle = "#4a4d4f"; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 30; i++) wdBlot(x, W, H, r() * W, r() * H, 14 + r() * 50, r() < 0.5 ? [0, 0, 0] : [140, 70, 30], 0.12 + r() * 0.2, false);
    x.fillStyle = "#383a3c";
    for (let k = 0; k < 8; k++) x.fillRect(8 + k * 30, 8, 12, H - 16);
    x.fillStyle = "#2c2e30"; x.fillRect(0, 14, W, 12); x.fillRect(0, H / 2 - 6, W, 12); x.fillRect(0, H - 26, W, 12);
    x.fillStyle = "rgba(0,0,0,0.9)"; x.fillRect(W / 2 - 3, 0, 6, H);
    for (let i = 0; i < 4000; i++) { x.fillStyle = wdRgba(150, 150, 150, 0.04 + r() * 0.12); x.fillRect(r() * W, r() * H, 1, 1); }
    x.strokeStyle = "#767a7d"; x.lineWidth = 5;
    for (let k = 0; k < 3; k++) { x.beginPath(); x.ellipse(W / 2, H / 2 + 6 + k * 3, 14, 20, 0, 0.3, 2.9); x.stroke(); }
    x.fillStyle = "#b3b5b0"; x.fillRect(W / 2 - 11, H / 2 + 20, 22, 20);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  function wdPaintTex(seed) {
    const [c, x] = wdCv(128, 128), r = wdR(seed);
    x.fillStyle = "#dcdcdc"; x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 16; i++) wdBlot(x, 128, 128, r() * 128, r() * 128, 8 + r() * 26, [120, 60, 22], 0.25 + r() * 0.35, true);
    for (let i = 0; i < 20; i++) wdBlot(x, 128, 128, r() * 128, r() * 128, 6 + r() * 20, [0, 0, 0], 0.08 + r() * 0.1, true);
    const g = x.createLinearGradient(0, 70, 0, 128); g.addColorStop(0, "rgba(40,34,26,0)"); g.addColorStop(1, "rgba(40,34,26,0.55)"); x.fillStyle = g; x.fillRect(0, 70, 128, 58);
    for (let i = 0; i < 26; i++) { x.strokeStyle = wdRgba(70, 70, 70, 0.25); x.lineWidth = 1; x.beginPath(); const px = r() * 128, py = r() * 128; x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 28, py + (r() - 0.5) * 6); x.stroke(); }
    for (let i = 0; i < 1500; i++) { const v = 90 + r() * 140 | 0; x.fillStyle = wdRgba(v, v, v, 0.2); x.fillRect(r() * 128, r() * 128, 1, 1); }
    return wdTex(c);
  }
  function wdWoodTex(seed, variant) {
    const S = 128, [c, x] = wdCv(S, S), r = wdR(seed);
    x.fillStyle = "#8a6a44"; x.fillRect(0, 0, S, S);
    const pw = S / 5;
    for (let k = 0; k < 5; k++) {
      const v = (r() - 0.5) * 36;
      x.fillStyle = wdRgba(140 + v, 104 + v * 0.8, 66 + v * 0.5, 1); x.fillRect(k * pw, 0, pw - 1, S);
      for (let g = 0; g < 14; g++) { x.strokeStyle = wdRgba(60, 40, 20, 0.18 + r() * 0.2); x.lineWidth = 1; const gx = k * pw + r() * pw; x.beginPath(); x.moveTo(gx, 0); x.bezierCurveTo(gx + (r() - 0.5) * 6, S * 0.3, gx + (r() - 0.5) * 6, S * 0.7, gx + (r() - 0.5) * 4, S); x.stroke(); }
      x.fillStyle = "rgba(20,12,6,0.55)"; x.fillRect(k * pw + pw - 1, 0, 1, S);
    }
    x.fillStyle = wdRgba(98, 70, 44, 1); const f = 9;
    x.fillRect(0, 0, S, f); x.fillRect(0, S - f, S, f); x.fillRect(0, 0, f, S); x.fillRect(S - f, 0, f, S);
    x.strokeStyle = "rgba(20,12,6,0.7)"; x.lineWidth = 2; x.strokeRect(1, 1, S - 2, S - 2); x.strokeRect(f, f, S - 2 * f, S - 2 * f);
    x.strokeStyle = wdRgba(98, 70, 44, 1); x.lineWidth = 9; x.beginPath(); x.moveTo(f, f); x.lineTo(S - f, S - f); x.stroke();
    x.strokeStyle = "rgba(20,12,6,0.55)"; x.lineWidth = 1.5; x.stroke();
    x.fillStyle = "rgba(30,30,30,0.85)"; for (const [px, py] of [[5, 5], [S - 5, 5], [5, S - 5], [S - 5, S - 5]]) { x.beginPath(); x.arc(px, py, 1.6, 0, 6.3); x.fill(); }
    if (variant) { x.fillStyle = "rgba(15,15,15,0.7)"; x.font = "bold 18px Arial"; x.textAlign = "center"; x.fillText("FRÁGIL", S / 2, S / 2 + 20); x.fillRect(S / 2 - 12, S / 2 - 22, 24, 4); }
    for (let i = 0; i < 12; i++) wdBlot(x, S, S, r() * S, r() * S, 8 + r() * 20, [0, 0, 0], 0.1 + r() * 0.12, false);
    for (let i = 0; i < 8; i++) wdBlot(x, S, S, r() * S, r() * S, 6 + r() * 14, [150, 150, 130], 0.06, false);
    return wdTex(c);
  }
  function wdContainerSideTex(seed) {
    const W = 512, H = 128, [c, x] = wdCv(W, H), r = wdR(seed);
    x.fillStyle = "#cfcfcf"; x.fillRect(0, 0, W, H);
    const n = 24, rw = W / n;
    for (let k = 0; k < n; k++) {
      const g = x.createLinearGradient(k * rw, 0, (k + 1) * rw, 0);
      g.addColorStop(0, "rgba(0,0,0,0.38)"); g.addColorStop(0.35, "rgba(255,255,255,0.14)"); g.addColorStop(0.7, "rgba(255,255,255,0.06)"); g.addColorStop(1, "rgba(0,0,0,0.42)");
      x.fillStyle = g; x.fillRect(k * rw, 0, rw, H);
    }
    for (let i = 0; i < 30; i++) wdBlot(x, W, H, r() * W, r() * H, 10 + r() * 40, [130, 62, 24], 0.2 + r() * 0.35, false);
    for (let i = 0; i < 24; i++) { const px = r() * W, len = 20 + r() * 80, g = x.createLinearGradient(0, 0, 0, len); g.addColorStop(0, "rgba(110,55,24,0.4)"); g.addColorStop(1, "rgba(110,55,24,0)"); x.fillStyle = g; x.fillRect(px, 0, 1 + r() * 4, len); }
    const gb = x.createLinearGradient(0, H * 0.6, 0, H); gb.addColorStop(0, "rgba(30,28,22,0)"); gb.addColorStop(1, "rgba(30,28,22,0.6)"); x.fillStyle = gb; x.fillRect(0, H * 0.6, W, H * 0.4);
    for (let i = 0; i < 5; i++) { x.save(); x.translate(r() * W, 30 + r() * 80); x.rotate(r() * 6); x.fillStyle = "rgba(0,0,0,0.18)"; x.beginPath(); x.ellipse(0, 0, 14 + r() * 20, 4 + r() * 8, 0, 0, 6.3); x.fill(); x.restore(); }
    x.fillStyle = "rgba(235,235,230,0.78)"; x.font = "bold 13px Arial, sans-serif"; x.textAlign = "left";
    x.fillText("CNT " + (100000 + seed * 7919 % 899999) + "-" + (seed % 9), 24, 20);
    x.font = "10px Arial"; x.fillText("22G1  MAX GROSS 30480 KG", 24, 33);
    x.fillStyle = "rgba(0,0,0,0.55)"; x.fillRect(0, 0, W, 5); x.fillRect(0, H - 5, W, 5);
    for (let i = 0; i < 4000; i++) { x.fillStyle = wdRgba(120, 120, 120, 0.1 + r() * 0.15); x.fillRect(r() * W, r() * H, 1, 1); }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  function wdContainerDoorTex(seed) {
    const S = 256, [c, x] = wdCv(S, S), r = wdR(seed);
    x.fillStyle = "#cfcfcf"; x.fillRect(0, 0, S, S);
    for (let k = 0; k < 20; k++) { const g = x.createLinearGradient(k * 12.8, 0, (k + 1) * 12.8, 0); g.addColorStop(0, "rgba(0,0,0,0.28)"); g.addColorStop(0.5, "rgba(255,255,255,0.1)"); g.addColorStop(1, "rgba(0,0,0,0.3)"); x.fillStyle = g; x.fillRect(k * 12.8, 0, 12.8, S); }
    x.fillStyle = "rgba(0,0,0,0.75)"; x.fillRect(S / 2 - 2, 0, 4, S);
    for (const cx of [S * 0.19, S * 0.35, S * 0.65, S * 0.81]) {
      x.fillStyle = "rgba(190,190,185,0.9)"; x.fillRect(cx - 3, 12, 6, S - 24);
      x.fillStyle = "rgba(60,60,60,0.9)"; x.fillRect(cx - 7, 28, 14, 10); x.fillRect(cx - 7, S - 40, 14, 10);
    }
    x.fillStyle = "rgba(200,200,195,0.9)"; x.fillRect(S / 2 - 20, S / 2 - 6, 8, 20); x.fillRect(S / 2 + 12, S / 2 - 6, 8, 20);
    for (let i = 0; i < 22; i++) wdBlot(x, S, S, r() * S, r() * S, 10 + r() * 36, [130, 62, 24], 0.2 + r() * 0.3, false);
    const gb = x.createLinearGradient(0, S * 0.6, 0, S); gb.addColorStop(0, "rgba(30,28,22,0)"); gb.addColorStop(1, "rgba(30,28,22,0.6)"); x.fillStyle = gb; x.fillRect(0, S * 0.6, S, S * 0.4);
    x.fillStyle = "rgba(0,0,0,0.55)"; x.fillRect(0, 0, S, 6); x.fillRect(0, S - 6, S, 6); x.fillRect(0, 0, 6, S); x.fillRect(S - 6, 0, 6, S);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  function wdDrumTex(seed) {
    const [c, x] = wdCv(128, 128), r = wdR(seed);
    x.fillStyle = "#d4d4d4"; x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 14; i++) wdBlot(x, 128, 128, r() * 128, r() * 128, 8 + r() * 22, [125, 60, 24], 0.3 + r() * 0.35, true);
    for (let i = 0; i < 18; i++) wdBlot(x, 128, 128, r() * 128, r() * 128, 6 + r() * 18, [0, 0, 0], 0.1 + r() * 0.1, true);
    x.fillStyle = "rgba(240,230,0,0.85)"; x.fillRect(0, 54, 128, 22);
    x.fillStyle = "rgba(10,10,10,0.9)"; x.beginPath(); x.moveTo(64, 56); x.lineTo(76, 74); x.lineTo(52, 74); x.closePath(); x.fill();
    const g = x.createLinearGradient(0, 80, 0, 128); g.addColorStop(0, "rgba(30,26,20,0)"); g.addColorStop(1, "rgba(30,26,20,0.5)"); x.fillStyle = g; x.fillRect(0, 80, 128, 48);
    for (let k = 0; k < 30; k++) { const px = r() * 128, len = 10 + r() * 40, gg = x.createLinearGradient(0, 0, 0, len); gg.addColorStop(0, "rgba(110,55,24,0.45)"); gg.addColorStop(1, "rgba(110,55,24,0)"); x.fillStyle = gg; x.fillRect(px, 0, 1 + r() * 2, len); }
    return wdTex(c);
  }
  function wdHazardTex() {
    const S = 128, [c, x] = wdCv(S, 64), r = wdR(5);
    x.fillStyle = "#d8b21c"; x.fillRect(0, 0, S, 64);
    x.fillStyle = "#171717";
    for (let k = -4; k < 12; k++) { x.beginPath(); x.moveTo(k * 20, 0); x.lineTo(k * 20 + 10, 0); x.lineTo(k * 20 + 10 - 64, 64); x.lineTo(k * 20 - 64, 64); x.closePath(); x.fill(); }
    for (let i = 0; i < 900; i++) { x.fillStyle = wdRgba(30, 24, 14, 0.12 + r() * 0.3); x.fillRect(r() * S, r() * 64, 1 + r() * 2, 1 + r() * 2); }
    for (let i = 0; i < 6; i++) wdBlot(x, S, 64, r() * S, r() * 64, 8 + r() * 14, [0, 0, 0], 0.25, false);
    return wdTex(c);
  }
  function wdBuildingTex(seed, lit) {
    const W = 256, H = 256, [c, x] = wdCv(W, H), r = wdR(seed);
    const [ce, xe] = wdCv(W, H);
    if (!lit) {
      x.fillStyle = "#34363c"; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) wdBlot(x, W, H, r() * W, r() * H, 14 + r() * 50, r() < 0.5 ? [0, 0, 0] : [255, 255, 255], 0.05 + r() * 0.08, true);
      for (let i = 0; i < 3000; i++) { const v = 40 + r() * 50 | 0; x.fillStyle = wdRgba(v, v, v + 4, 0.35); x.fillRect(r() * W, r() * H, 1, 1); }
    } else { xe.fillStyle = "#000"; xe.fillRect(0, 0, W, H); }
    const cols = 6, rows = 8, cw = W / cols, rh = H / rows;
    for (let rr = 0; rr < rows; rr++) for (let cc = 0; cc < cols; cc++) {
      const wx = cc * cw + cw * 0.2, wy = rr * rh + rh * 0.2, ww = cw * 0.6, wh = rh * 0.6;
      if (!lit) {
        x.fillStyle = "#0c0e12"; x.fillRect(wx, wy, ww, wh);
        x.fillStyle = "rgba(255,255,255,0.05)"; x.fillRect(wx, wy, ww, 2);
        if (r() < 0.2) { x.strokeStyle = "rgba(0,0,0,0.9)"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(wx + ww * 0.1, wy); x.lineTo(wx + ww * 0.7, wy + wh); x.stroke(); }
        x.fillStyle = "rgba(0,0,0,0.3)"; x.fillRect(wx - 2, wy + wh, ww + 4, 3);
      } else if (r() < 0.07) {
        const warm = r() < 0.7 ? [255, 190, 100] : [170, 200, 230];
        xe.fillStyle = wdRgba(warm[0] * 0.75, warm[1] * 0.75, warm[2] * 0.75, 1); xe.fillRect(wx, wy, ww, wh);
      }
    }
    if (lit) { const t = new THREE.CanvasTexture(ce); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
    return wdTex(c);
  }
  function wdCarPaintTexes() { return [wdPaintTex(71), wdPaintTex(72), wdPaintTex(73), wdPaintTex(74)]; }
  function wdGrassTex() {
    const [c, x] = wdCv(64, 64), r = wdR(9);
    for (let i = 0; i < 34; i++) {
      const px = 6 + r() * 52, h = 18 + r() * 40, a = (r() - 0.5) * 0.9;
      x.strokeStyle = ["#2c3a20", "#3d4c27", "#5a6230", "#4c4528"][r() * 4 | 0]; x.lineWidth = 1.5 + r();
      x.beginPath(); x.moveTo(px, 64); x.quadraticCurveTo(px + a * 10, 64 - h * 0.6, px + a * 26, 64 - h); x.stroke();
    }
    const t = new THREE.CanvasTexture(c); return t;
  }
  function wdGlowTex(rgb) {
    const [c, x] = wdCv(64, 64);
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, wdRgba(rgb[0], rgb[1], rgb[2], 1)); g.addColorStop(0.18, wdRgba(rgb[0], rgb[1], rgb[2], 0.65)); g.addColorStop(0.5, wdRgba(rgb[0], rgb[1], rgb[2], 0.16)); g.addColorStop(1, wdRgba(rgb[0], rgb[1], rgb[2], 0));
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  function wdMoonTex() {
    const [c, x] = wdCv(256, 256);
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(220,230,255,0.5)"); g.addColorStop(0.25, "rgba(160,185,235,0.22)"); g.addColorStop(1, "rgba(120,150,220,0)");
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    x.fillStyle = "#e8eefc"; x.beginPath(); x.arc(128, 128, 30, 0, 6.3); x.fill();
    const r = wdR(3);
    x.fillStyle = "rgba(150,165,190,0.45)"; for (const [px, py, pr] of [[118, 118, 8], [140, 132, 6], [124, 142, 5], [138, 110, 4]]) { x.beginPath(); x.arc(px, py, pr, 0, 6.3); x.fill(); }
    void r;
    return new THREE.CanvasTexture(c);
  }

  // ---------- geometria em lote (uma malha por material = poucas chamadas de desenho) ----------
  function WdBatch() { this.m = new Map(); }
  WdBatch.prototype.add = function (mat, geo, mtx) { let a = this.m.get(mat); if (!a) this.m.set(mat, (a = [])); a.push([geo, mtx]); };
  WdBatch.prototype.build = function (parent, cast, recv) {
    const out = [], v = new THREE.Vector3(), nm = new THREE.Matrix3();
    this.m.forEach((list, mat) => {
      let n = 0;
      list.forEach((e) => { n += e[0].index ? e[0].index.count : e[0].attributes.position.count; });
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
      let o = 0;
      for (const e of list) {
        const g = e[0].index ? e[0].toNonIndexed() : e[0], mtx = e[1];
        const p = g.attributes.position, nn = g.attributes.normal, u = g.attributes.uv;
        nm.getNormalMatrix(mtx);
        for (let i = 0; i < p.count; i++, o++) {
          v.fromBufferAttribute(p, i).applyMatrix4(mtx); pos[o * 3] = v.x; pos[o * 3 + 1] = v.y; pos[o * 3 + 2] = v.z;
          v.fromBufferAttribute(nn, i).applyMatrix3(nm).normalize(); nor[o * 3] = v.x; nor[o * 3 + 1] = v.y; nor[o * 3 + 2] = v.z;
          if (u) { uv[o * 2] = u.getX(i); uv[o * 2 + 1] = u.getY(i); }
        }
        if (g !== e[0]) g.dispose();
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
      geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
      geo.computeBoundingSphere(); geo.computeBoundingBox();
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = !!cast; mesh.receiveShadow = !!recv;
      parent.add(mesh); out.push(mesh);
    });
    return out;
  };
  const wdTmpE = new THREE.Euler(), wdTmpQ = new THREE.Quaternion(), wdTmpV = new THREE.Vector3(), wdTmpS = new THREE.Vector3();
  function wdT(x, y, z, rx, ry, rz, sx, sy, sz) {
    wdTmpE.set(rx || 0, ry || 0, rz || 0); wdTmpQ.setFromEuler(wdTmpE); wdTmpV.set(x, y, z);
    wdTmpS.set(sx === undefined ? 1 : sx, sy === undefined ? (sx === undefined ? 1 : sx) : sy, sz === undefined ? (sx === undefined ? 1 : sx) : sz);
    return new THREE.Matrix4().compose(wdTmpV, wdTmpQ, wdTmpS);
  }
  const wdMul = (a, b) => new THREE.Matrix4().multiplyMatrices(a, b);
  function wdBoxG(w, h, d, cu, cv) {
    const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
    const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, uv.getX(i) * dims[f][0] / cu, uv.getY(i) * dims[f][1] / (cv || cu));
    }
    return g;
  }
  function wdPlaneG(w, h, ur, vr) {
    const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (ur || 1), uv.getY(i) * (vr || 1));
    return g;
  }

  // ---------- materiais do mundo ----------
  const WD = {};
  function wdMaterials() {
    const lam = (o) => new THREE.MeshLambertMaterial(o);
    const paint = wdCarPaintTexes();
    WD.asphalt = lam({ map: wdAsphaltTex() });
    WD.overlay = lam({ map: wdFloorOverlay(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    WD.wall = lam({ map: wdWallTex() });
    WD.concrete = lam({ map: wdConcreteTex(5, 120) });
    WD.concreteDark = lam({ map: wdConcreteTex(6, 86) });
    WD.cap = lam({ map: wdConcreteTex(7, 150) });
    WD.carBody = [0x8fa3b8, 0xa8423a, 0xd8d4c8, 0x5f7f5e].map((col, i) => lam({ map: paint[i], color: col }));
    WD.glass = new THREE.MeshLambertMaterial({ color: 0x0b1118, emissive: 0x03060a });
    WD.rubber = lam({ color: 0x131315 });
    WD.hub = lam({ color: 0x77797c });
    WD.chrome = lam({ color: 0x8c8f93 });
    WD.dark = lam({ color: 0x1b1c20 });
    WD.rebar = lam({ color: 0x6b3a1c });
    WD.contSide = [wdContainerSideTex(101), wdContainerSideTex(102), wdContainerSideTex(103), wdContainerSideTex(104)];
    WD.contDoor = [wdContainerDoorTex(111), wdContainerDoorTex(112), wdContainerDoorTex(113), wdContainerDoorTex(114)];
    WD.contTint = [0xa5442c, 0x3e6ca0, 0x4f7a4a, 0x8a7a52];
    WD.contSideM = WD.contSide.map((t, i) => lam({ map: t, color: WD.contTint[i] }));
    WD.contDoorM = WD.contDoor.map((t, i) => lam({ map: t, color: WD.contTint[i] }));
    WD.contRoof = lam({ map: wdConcreteTex(8, 95), color: 0x6a7378 });
    WD.contFrame = lam({ color: 0x25272a });
    WD.crate = [lam({ map: wdWoodTex(81, 0) }), lam({ map: wdWoodTex(82, 1), color: 0xcfc0a0 })];
    WD.drum = [0x93392a, 0x3b5f8f, 0x4a7040].map((col, i) => lam({ map: wdDrumTex(130 + i), color: col }));
    WD.drumRing = lam({ color: 0x2a2b2e });
    WD.dumpster = lam({ map: wdPaintTex(75), color: 0x2f5d3b });
    WD.bag = lam({ color: 0x0a0a0c });
    WD.cardboard = lam({ color: 0x8a6c46 });
    WD.hazard = lam({ map: wdHazardTex() });
    WD.sandbag = lam({ map: (function () {
      const [c, x] = wdCv(64, 64), r = wdR(14);
      x.fillStyle = "#b9a67c"; x.fillRect(0, 0, 64, 64);
      for (let i = 0; i < 64; i += 2) { x.fillStyle = "rgba(0,0,0,0.12)"; x.fillRect(i, 0, 1, 64); x.fillRect(0, i, 64, 1); }
      for (let i = 0; i < 500; i++) { const v = 120 + r() * 100 | 0; x.fillStyle = wdRgba(v, v - 12, v - 40, 0.35); x.fillRect(r() * 64, r() * 64, 1, 1); }
      return wdTex(c);
    })(), color: 0xd8cca8 });
    WD.pole = lam({ color: 0x24262a });
    WD.lampHead = new THREE.MeshBasicMaterial({ color: 0xffc680 });
    WD.cone = lam({ color: 0xd8501c });
    WD.coneWhite = lam({ color: 0xdcdcd4 });
    WD.rubble = lam({ map: wdConcreteTex(9, 110) });
    WD.plank = lam({ map: wdWoodTex(83, 0), color: 0x9a8a72 });
    WD.grass = [0x8aa070, 0x9aa878].map((col) => new THREE.MeshLambertMaterial({ map: wdGrassTex(), color: col, alphaTest: 0.5, side: THREE.DoubleSide }));
    WD.gate = lam({ map: wdGateTex() });
    WD.sign = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => new THREE.MeshLambertMaterial({ map: wdSignTex(i < 5 ? "text" : i < 7 ? "hands" : i < 9 ? "sign" : "x", i * 3 + 1), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    WD.bloodDecal = new THREE.MeshLambertMaterial({ map: wdSignTex("hands", 23), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    WD.bldgDark = lam({ map: wdBuildingTex(61, false), emissiveMap: wdBuildingTex(61, true), emissive: 0xffffff });
    WD.bldgDark2 = lam({ map: wdBuildingTex(62, false), emissiveMap: wdBuildingTex(62, true), emissive: 0xffffff, color: 0xb0b0b8 });
    WD.ground = lam({ color: 0x15161a });
    WD.wire = new THREE.LineBasicMaterial({ color: 0x1c1d20 });
    WD.glowL = new THREE.SpriteMaterial({ map: wdGlowTex([255, 190, 110]), color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.55 });
  }

  // ---------- objetos ----------
  function wdCar(B, D, base, idx, sx, sy) {
    const body = WD.carBody[idx % 4];
    const add = (b, mat, g, x, y, z, rx, ry, rz) => b.add(mat, g, wdMul(base, wdT(x, y, z, rx, ry, rz)));
    add(B, body, new THREE.BoxGeometry(4.3, 0.6, 1.86), 0, 0.64, 0);
    add(B, body, new THREE.BoxGeometry(1.35, 0.1, 1.8), 1.48, 0.98, 0, 0, 0, -0.05);
    add(B, body, new THREE.BoxGeometry(0.95, 0.1, 1.8), -1.7, 0.98, 0);
    add(B, body, new THREE.BoxGeometry(2.0, 0.52, 1.6), -0.2, 1.24, 0);
    add(B, body, new THREE.BoxGeometry(1.9, 0.07, 1.56), -0.2, 1.53, 0);
    add(B, WD.glass, new THREE.BoxGeometry(1.72, 0.32, 1.64), -0.2, 1.24, 0);
    add(B, WD.glass, new THREE.BoxGeometry(2.04, 0.32, 1.4), -0.2, 1.24, 0);
    add(B, WD.dark, new THREE.BoxGeometry(0.2, 0.24, 1.9), 2.18, 0.5, 0);
    add(B, WD.dark, new THREE.BoxGeometry(0.2, 0.24, 1.9), -2.18, 0.5, 0);
    add(B, WD.hub, new THREE.BoxGeometry(0.04, 0.12, 0.34), 2.16, 0.72, 0.62); add(B, WD.hub, new THREE.BoxGeometry(0.04, 0.12, 0.34), 2.16, 0.72, -0.62);
    add(B, WD.rubber, new THREE.BoxGeometry(0.04, 0.1, 0.3), -2.16, 0.74, 0.66);
    const wheels = [[1.38, 0.9], [1.38, -0.9], [-1.38, 0.9], [-1.38, -0.9]];
    wheels.forEach((w, i) => {
      if (idx === 2 && i === 3) { add(B, WD.concrete, new THREE.BoxGeometry(0.34, 0.28, 0.34), w[0], 0.14, w[1] * 0.88); return; }
      const flat = idx === 1 && i === 1;
      add(B, WD.rubber, new THREE.CylinderGeometry(flat ? 0.28 : 0.34, flat ? 0.28 : 0.34, 0.26, 14), w[0], flat ? 0.28 : 0.34, w[1], Math.PI / 2, 0, 0);
      add(B, WD.hub, new THREE.CylinderGeometry(0.17, 0.17, 0.28, 8), w[0], flat ? 0.28 : 0.34, w[1], Math.PI / 2, 0, 0);
    });
    if (idx === 0) add(B, body, new THREE.BoxGeometry(0.9, 0.05, 1.7), 1.6, 1.26, 0, 0, 0, -1.0);   // capô aberto
    D.add(WD.bloodDecal, wdPlaneG(1.6, 0.6, 1, 1), wdMul(base, wdT(-0.3, 0.85, 0.955, 0, 0, 0)));
    void sx; void sy;
  }
  function wdContainer(B, D, base, idx) {
    const L = 6.1, W = 2.5, H = 2.6, i = idx % 4;
    const side = WD.contSideM[i], door = WD.contDoorM[i];
    B.add(side, wdPlaneG(L, H, 1, 1), wdMul(base, wdT(0, H / 2, W / 2, 0, 0, 0)));
    B.add(side, wdPlaneG(L, H, 1, 1), wdMul(base, wdT(0, H / 2, -W / 2, 0, Math.PI, 0)));
    B.add(door, wdPlaneG(W, H, 1, 1), wdMul(base, wdT(L / 2, H / 2, 0, 0, Math.PI / 2, 0)));
    B.add(i === 1 ? side : door, wdPlaneG(W, H, 1, 1), wdMul(base, wdT(-L / 2, H / 2, 0, 0, -Math.PI / 2, 0)));
    B.add(WD.contRoof, wdPlaneG(L, W, 3, 1), wdMul(base, wdT(0, H, 0, -Math.PI / 2, 0, 0)));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.add(WD.contFrame, new THREE.BoxGeometry(0.14, H + 0.02, 0.14), wdMul(base, wdT(sx * (L / 2 - 0.02), H / 2, sz * (W / 2 - 0.02))));
    for (const sz of [-1, 1]) for (const y of [0.05, H - 0.05]) B.add(WD.contFrame, new THREE.BoxGeometry(L, 0.12, 0.12), wdMul(base, wdT(0, y, sz * (W / 2 - 0.01))));
    for (const sx of [-1, 1]) for (const y of [0.05, H - 0.05]) B.add(WD.contFrame, new THREE.BoxGeometry(0.12, 0.12, W), wdMul(base, wdT(sx * (L / 2 - 0.01), y, 0)));
    if (i === 0) D.add(WD.sign[1], wdPlaneG(2.4, 0.9, 1, 1), wdMul(base, wdT(1.0, 1.3, W / 2 + 0.01, 0, 0, 0)));
  }
  function wdCrate(B, base, w, h, d, idx) {
    B.add(WD.crate[idx % 2], wdBoxG(w, h, d, Math.min(w, d)), wdMul(base, wdT(0, h / 2, 0)));
    B.add(WD.crate[idx % 2], wdBoxG(w * 0.96, 0.05, d * 0.96, Math.min(w, d)), wdMul(base, wdT(0, h + 0.02, 0)));
  }
  function wdDumpster(B, base) {
    const L = 2.0, W = 1.2;
    const add = (mat, g, x, y, z, rx, ry, rz) => B.add(mat, g, wdMul(base, wdT(x, y, z, rx, ry, rz)));
    add(WD.dumpster, new THREE.BoxGeometry(L, 0.95, W), 0, 0.72, 0);
    add(WD.dumpster, new THREE.BoxGeometry(L + 0.06, 0.06, W * 0.5), 0, 1.22, W * 0.25);
    const a = 1.0;
    add(WD.dumpster, new THREE.BoxGeometry(L + 0.06, 0.06, W * 0.5), 0, 1.22 + 0.3 * Math.sin(a), -0.3 * Math.cos(a), a, 0, 0);
    for (const y of [0.5, 0.9]) add(WD.dark, new THREE.BoxGeometry(L + 0.04, 0.05, W + 0.04), 0, y, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(WD.rubber, new THREE.CylinderGeometry(0.09, 0.09, 0.07, 8), sx * (L / 2 - 0.15), 0.1, sz * (W / 2 - 0.08), Math.PI / 2, 0, 0);
    add(WD.bag, new THREE.SphereGeometry(0.24, 8, 6), 0.45, 1.3, 0.1, 0, 0, 0); add(WD.bag, new THREE.SphereGeometry(0.2, 8, 6), -0.3, 1.3, 0.25);
    add(WD.cardboard, new THREE.BoxGeometry(0.4, 0.28, 0.32), -0.6, 1.36, 0.2, 0.2, 0.5, 0.1);
  }
  function wdPillar(B, D, base, idx) {
    const add = (mat, g, x, y, z, rx, ry, rz) => B.add(mat, g, wdMul(base, wdT(x, y, z, rx, ry, rz)));
    add(WD.concrete, wdBoxG(1.5, 0.3, 1.5, 1.5), 0, 0.15, 0);
    add(WD.concrete, wdBoxG(1.3, 2.4, 1.3, 1.3), 0, 1.5, 0);
    add(WD.concreteDark, wdBoxG(1.04, 0.5, 1.12, 1.1), 0.08, 2.9, -0.03, 0, 0.2, 0);
    add(WD.concrete, wdBoxG(0.6, 0.44, 0.5, 0.6), 0.2, 3.28, 0.1, 0.1, 0.5, 0.15);
    add(WD.hazard, wdBoxG(1.34, 0.4, 1.34, 1.34, 0.4), 0, 1.0, 0);
    for (let k = 0; k < 6; k++) {
      const a = k * 1.05 + idx, rr = 0.34 * (0.4 + (k % 3) * 0.3);
      add(WD.rebar, new THREE.CylinderGeometry(0.014, 0.014, 0.8, 5), 0.12 + Math.cos(a) * rr, 3.55, 0.08 + Math.sin(a) * rr, Math.sin(a) * 0.45, 0, Math.cos(a) * 0.45);
    }
    if (idx % 2 === 0) D.add(WD.sign[8], wdPlaneG(0.9, 0.34, 1, 1), wdMul(base, wdT(0, 1.9, 0.655, 0, 0, 0)));
  }
  function wdSandbags(B, base, L, seed) {
    const r = wdR(seed), g = new THREE.SphereGeometry(1, 8, 6), n = Math.floor(L / 0.56);
    for (let layer = 0; layer < 3; layer++) for (const row of [-0.22, 0.22]) {
      const off = (layer % 2) * 0.28;
      for (let k = 0; k < n; k++) {
        const x = -L / 2 + 0.3 + k * 0.56 + off;
        if (x > L / 2 - 0.25) continue;
        B.add(WD.sandbag, g, wdMul(base, wdT(x + (r() - 0.5) * 0.04, 0.17 + layer * 0.29, row + (r() - 0.5) * 0.04, 0, (r() - 0.5) * 0.25, (r() - 0.5) * 0.1, 0.29, 0.17, 0.23)));
      }
    }
  }
  function wdBarrel(B, base, idx) {
    const m = WD.drum[idx % 3];
    B.add(m, new THREE.CylinderGeometry(0.36, 0.36, 1.0, 14), wdMul(base, wdT(0, 0.5, 0)));
    for (const y of [0.2, 0.52, 0.84]) B.add(WD.drumRing, new THREE.CylinderGeometry(0.372, 0.372, 0.045, 14), wdMul(base, wdT(0, y, 0)));
    B.add(WD.drumRing, new THREE.CylinderGeometry(0.31, 0.33, 0.03, 14), wdMul(base, wdT(0, 1.0, 0)));
  }
  function wdLamp(B, o, idx) {
    const h = o[4], x = o[0], y = o[1];
    const dx = Math.abs(x) >= Math.abs(y) ? (x > 0 ? -1 : 1) : 0, dz = dx === 0 ? (y > 0 ? 1 : -1) : 0;   // para o centro (em coords three: z = -y)
    const px = x, pz = -y;
    B.add(WD.pole, new THREE.CylinderGeometry(0.06, 0.09, h, 8), wdT(px, h / 2, pz));
    B.add(WD.pole, new THREE.CylinderGeometry(0.16, 0.18, 0.12, 8), wdT(px, 0.06, pz));
    B.add(WD.pole, new THREE.BoxGeometry(dx ? 0.95 : 0.07, 0.07, dz ? 0.95 : 0.07), wdT(px + dx * 0.47, h - 0.05, pz + dz * 0.47));
    B.add(WD.pole, new THREE.BoxGeometry(0.62, 0.1, 0.3), wdT(px + dx * 0.95, h - 0.02, pz + dz * 0.95, 0, dz ? Math.PI / 2 : 0, 0));
    B.add(WD.lampHead, new THREE.BoxGeometry(0.54, 0.05, 0.24), wdT(px + dx * 0.95, h - 0.09, pz + dz * 0.95, 0, dz ? Math.PI / 2 : 0, 0));
    void idx;
    return [px + dx * 0.95, h - 0.3, pz + dz * 0.95];
  }

  // ---------- montagem do mundo ----------
  let wdSky = null, wdMoon = null, wdBlds = [], wdSkyCache = {}, wdSkyKey = "";
  function wdBuildWorld() {
    wdMaterials();
    const solid = new WdBatch(), deco = new WdBatch(), decal = new WdBatch(), I = new THREE.Matrix4();
    const A = ARENA, WH = L.C.WALL_H;
    // chão
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(2 * A + 4, 2 * A + 4), WD.asphalt);
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    const ov = new THREE.Mesh(new THREE.PlaneGeometry(48, 48), WD.overlay);
    ov.rotation.x = -Math.PI / 2; ov.position.y = 0.012; ov.receiveShadow = true; ov.renderOrder = 1; scene.add(ov);
    const gnd = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), WD.ground);
    gnd.rotation.x = -Math.PI / 2; gnd.position.y = -0.05; scene.add(gnd);

    // muros (cada um com a face de dentro voltada para a arena)
    for (let i = 0; i < 4; i++) {
      const b = BOXES[i], w = b[1] - b[0], d = b[3] - b[2];
      solid.add(WD.wall, wdBoxG(w, b[4], d, 6, 3.6), wdT((b[0] + b[1]) / 2, b[4] / 2, -(b[2] + b[3]) / 2));
    }
    const sides = [[0, A, 0, 1], [0, -A, Math.PI, 1], [A, 0, Math.PI / 2, 0], [-A, 0, -Math.PI / 2, 0]];   // x, y(lógico), giro, eixo
    const wireV = [];
    sides.forEach(([sx, sy, rot], si) => {
      // base local: origem no centro da face interna, +z de três = para dentro (ajustado por rotação)
      const base = wdT(sx, 0, -sy, 0, -rot, 0);
      const len = 2 * A;
      // coroamento e pilastras (para dentro = -z local)
      solid.add(WD.cap, wdBoxG(len + 2, 0.28, 1.5, 1.4), wdMul(base, wdT(0, WH + 0.14, -0.5)));
      for (let k = 0; k <= 6; k++) {
        const px = -A + k * (len / 6);
        solid.add(WD.concrete, wdBoxG(0.75, WH + 0.35, 0.5, 1.2), wdMul(base, wdT(px, (WH + 0.35) / 2, 0.25)));
        solid.add(WD.cap, wdBoxG(0.9, 0.14, 0.66, 1.0), wdMul(base, wdT(px, WH + 0.42, 0.25)));
        // postes do arame farpado
        deco.add(WD.pole, new THREE.BoxGeometry(0.05, 0.62, 0.05), wdMul(base, wdT(px, WH + 0.28 + 0.31, -0.35, -0.35, 0, 0)));
      }
      // arame farpado ao longo do topo
      for (let w = 0; w < 3; w++) {
        const y0 = WH + 0.55 + w * 0.16, z0 = -0.35 - (y0 - WH - 0.3) * 0.34;
        const seg = 56, step = len / seg;
        for (let k = 0; k < seg; k++) {
          const x0 = -A + k * step, x1 = x0 + step, sag = Math.sin((k / seg) * Math.PI * 6) * 0.02;
          const p0 = new THREE.Vector3(x0, y0 + sag, z0).applyMatrix4(base), p1 = new THREE.Vector3(x1, y0 - sag, z0).applyMatrix4(base);
          wireV.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
          if (k % 2 === 0) {
            const bx = x0 + step * 0.5, bp = new THREE.Vector3(bx, y0, z0).applyMatrix4(base);
            const q1 = new THREE.Vector3(bx - 0.04, y0 + 0.05, z0 - 0.02).applyMatrix4(base), q2 = new THREE.Vector3(bx + 0.04, y0 - 0.05, z0 + 0.02).applyMatrix4(base);
            const q3 = new THREE.Vector3(bx + 0.04, y0 + 0.05, z0 - 0.02).applyMatrix4(base), q4 = new THREE.Vector3(bx - 0.04, y0 - 0.05, z0 + 0.02).applyMatrix4(base);
            wireV.push(q1.x, q1.y, q1.z, q2.x, q2.y, q2.z, q3.x, q3.y, q3.z, q4.x, q4.y, q4.z);
            void bp;
          }
        }
      }
      // avisos e pichações no muro, entre as pilastras
      const r = wdR(500 + si * 17);
      const slots = [0, 1, 2, 3, 4, 5].sort(() => r() - 0.5).slice(0, 3);
      slots.forEach((slot, n) => {
        const cx = -A + (slot + 0.5) * (len / 6), mi = (si * 3 + n) % 10;
        const wide = mi < 5 ? 3.2 : 2.6;
        decal.add(WD.sign[mi], wdPlaneG(wide, wide * 0.375, 1, 1), wdMul(base, wdT(cx + (r() - 0.5) * 1.2, 1.0 + r() * 1.5, 0.02, 0, 0, 0)));
      });
      if (si === 0) {   // portão de aço bloqueado, de frente para o jogador
        solid.add(WD.gate, wdPlaneG(2.6, 3.0, 1, 1), wdMul(base, wdT(-1.35, 1.5, 0.04, 0, 0, 0)));
        solid.add(WD.gate, wdPlaneG(2.6, 3.0, -1, 1), wdMul(base, wdT(1.35, 1.5, 0.04, 0, 0, 0)));
        solid.add(WD.contFrame, new THREE.BoxGeometry(5.6, 0.3, 0.3), wdMul(base, wdT(0, 3.15, 0.15)));
        solid.add(WD.contFrame, new THREE.BoxGeometry(0.3, 3.2, 0.3), wdMul(base, wdT(-2.85, 1.6, 0.15)));
        solid.add(WD.contFrame, new THREE.BoxGeometry(0.3, 3.2, 0.3), wdMul(base, wdT(2.85, 1.6, 0.15)));
        deco.add(WD.hazard, wdBoxG(5.4, 0.2, 0.06, 1.2, 0.2), wdMul(base, wdT(0, 2.9, 0.1)));
      }
    });
    const wireGeo = new THREE.BufferGeometry();
    wireGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(wireV), 3));
    scene.add(new THREE.LineSegments(wireGeo, WD.wire));

    // obstáculos
    const counts = {};
    OBSTACLES.forEach((o) => {
      const kind = o[5], cx = o[0], cy = o[1], sx = o[2], sy = o[3], h = o[4];
      const n = counts[kind] = (counts[kind] || 0);
      counts[kind]++;
      const rot = sy > sx ? Math.PI / 2 : 0;
      const base = wdT(cx, 0, -cy, 0, rot, 0);
      if (kind === "car") wdCar(solid, decal, base, n, sx, sy);
      else if (kind === "container") wdContainer(solid, decal, base, n);
      else if (kind === "crate") wdCrate(solid, wdT(cx, 0, -cy, 0, (wdR(n * 7 + 3)() - 0.5) * 0.5, 0), sx, h, sy, n);
      else if (kind === "dumpster") wdDumpster(solid, base);
      else if (kind === "pillar") wdPillar(solid, decal, base, n);
      else if (kind === "sandbag") wdSandbags(solid, base, Math.max(sx, sy), 40 + n);
      else if (kind === "barrel") wdBarrel(solid, wdT(cx, 0, -cy), n);
    });

    // postes de luz
    wdLampPos = [];
    LAMPS.forEach((o, i) => { wdLampPos.push(wdLamp(solid, o, i)); });

    // detritos soltos (sem colisão, baixinhos)
    const rr = wdR(777), okSpot = (x, y, m) => !insideAny(x, y, m) && Math.hypot(x, y + 4) > 2.2;
    const tireG = new THREE.TorusGeometry(0.3, 0.13, 8, 14);
    for (let i = 0, n = 0; n < 9 && i < 60; i++) {
      const x = (rr() * 2 - 1) * 19, y = (rr() * 2 - 1) * 19;
      if (!okSpot(x, y, 0.8)) continue; n++;
      deco.add(WD.rubber, tireG, wdT(x, 0.13, -y, -Math.PI / 2 + (rr() - 0.5) * 0.15, 0, rr() * 6));
    }
    const coneG = new THREE.ConeGeometry(0.16, 0.55, 8), coneBase = new THREE.BoxGeometry(0.38, 0.03, 0.38), coneBand = new THREE.CylinderGeometry(0.1, 0.12, 0.1, 8);
    for (let i = 0, n = 0; n < 7 && i < 60; i++) {
      const x = (rr() * 2 - 1) * 19, y = (rr() * 2 - 1) * 19;
      if (!okSpot(x, y, 0.8)) continue; n++;
      const tipped = rr() < 0.3, ry = rr() * 6;
      const b = tipped ? wdT(x, 0.16, -y, 0, ry, Math.PI / 2 * 0.95) : wdT(x, 0, -y, 0, ry, 0);
      deco.add(WD.cone, coneG, wdMul(b, wdT(0, 0.3, 0))); deco.add(WD.cone, coneBase, wdMul(b, wdT(0, 0.015, 0))); deco.add(WD.coneWhite, coneBand, wdMul(b, wdT(0, 0.32, 0)));
    }
    const rubG = new THREE.DodecahedronGeometry(1, 0), plankG = new THREE.BoxGeometry(1.4, 0.04, 0.16);
    for (let i = 0, n = 0; n < 26 && i < 120; i++) {
      const x = (rr() * 2 - 1) * 20, y = (rr() * 2 - 1) * 20;
      if (!okSpot(x, y, 0.5)) continue; n++;
      const s = 0.05 + rr() * 0.12;
      deco.add(WD.rubble, rubG, wdT(x, s * 0.5, -y, rr() * 3, rr() * 3, rr() * 3, s * 1.3, s * 0.8, s));
      if (rr() < 0.3) deco.add(WD.plank, plankG, wdT(x + 0.3, 0.03, -y, (rr() - 0.5) * 0.2, rr() * 6, (rr() - 0.5) * 0.15));
    }
    // moitas de mato
    const grassQ = new THREE.PlaneGeometry(0.6, 0.55);
    const gb = [new WdBatch(), new WdBatch()];
    for (let i = 0, n = 0; n < 150 && i < 600; i++) {
      const edge = rr() < 0.7;
      let x, y;
      if (edge) { const side = rr() * 4 | 0, u = (rr() * 2 - 1) * (A - 0.8), d = A - 0.35 - rr() * 1.4; [x, y] = [[u, d], [u, -d], [d, u], [-d, u]][side]; }
      else { x = (rr() * 2 - 1) * (A - 1); y = (rr() * 2 - 1) * (A - 1); }
      if (insideAny(x, y, 0.35) || Math.hypot(x, y + 4) < 2) continue; n++;
      const s = 0.7 + rr() * 0.9, g = gb[rr() < 0.5 ? 0 : 1], ry = rr() * 3;
      g.add(WD.grass[n % 2], grassQ, wdT(x, 0.27 * s, -y, 0, ry, 0, s, s, s));
      g.add(WD.grass[n % 2], grassQ, wdT(x, 0.27 * s, -y, 0, ry + 1.57, 0, s, s, s));
    }
    solid.build(scene, true, true); deco.build(scene, false, true); decal.build(scene, false, true);
    gb[0].build(scene, false, true); gb[1].build(scene, false, true);

    // prédios ao longe (silhuetas com janelas acesas)
    const bb = new WdBatch(), br = wdR(901);
    const ring = (cx, cz, w, hh, d, m) => { bb.add(m, wdBoxG(w, hh, d, 6, 9), wdT(cx, hh / 2, cz)); };
    for (let k = 0; k < 4; k++) {
      let u = -58;
      while (u < 58) {
        const w = 8 + br() * 9, d = 8 + br() * 8, hh = 9 + br() * 18, off = 31 + br() * 12;
        const m = br() < 0.5 ? WD.bldgDark : WD.bldgDark2;
        const p = [[u + w / 2, off], [u + w / 2, -off], [off, u + w / 2], [-off, u + w / 2]][k];
        ring(p[0], p[1], k < 2 ? w : d, hh, k < 2 ? d : w, m);
        if (br() < 0.4) ring(p[0] + (br() - 0.5) * 2, p[1] + (k < 2 ? 0 : 0), (k < 2 ? w : d) * 0.5, hh + 5 + br() * 6, (k < 2 ? d : w) * 0.5, m);
        u += w + 1.5 + br() * 3;
      }
    }
    bb.build(scene, false, false);

    // céu
    const skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, depthWrite: false });
    wdSky = new THREE.Mesh(new THREE.SphereGeometry(100, 24, 14), skyMat);
    wdSky.renderOrder = -10; wdSky.frustumCulled = false; scene.add(wdSky);
    wdMoon = new THREE.Sprite(new THREE.SpriteMaterial({ map: wdMoonTex(), fog: false, transparent: true, depthWrite: false }));
    wdMoon.scale.set(34, 34, 1); wdMoon.renderOrder = -9; scene.add(wdMoon);
    void I;
  }
  let wdLampPos = [];

  function wdSkyTex(env) {
    const [c, x] = wdCv(512, 256), r = wdR(88);
    const hex = (n) => [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    const hor = hex(env.fog);
    const spec = env === ENVS.tarde ? { top: [70, 120, 190], mid: [214, 170, 130], glow: [255, 200, 130] } : env === ENVS.dusk ? { top: [30, 32, 64], mid: [118, 58, 52], glow: [226, 120, 64] }
      : env === ENVS.fog ? { top: [58, 66, 76], mid: [52, 60, 68], glow: null }
        : env === ENVS.storm ? { top: [10, 14, 22], mid: [22, 28, 40], glow: null }
          : { top: [4, 7, 18], mid: [12, 19, 38], glow: null };
    const g = x.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, wdRgba(spec.top[0], spec.top[1], spec.top[2], 1));
    g.addColorStop(0.62, wdRgba(spec.mid[0], spec.mid[1], spec.mid[2], 1));
    g.addColorStop(0.9, wdRgba(spec.glow ? spec.glow[0] : hor[0], spec.glow ? spec.glow[1] : hor[1], spec.glow ? spec.glow[2] : hor[2], 1));
    g.addColorStop(1, wdRgba(hor[0], hor[1], hor[2], 1));
    x.fillStyle = g; x.fillRect(0, 0, 512, 128);
    x.fillStyle = wdRgba(hor[0], hor[1], hor[2], 1); x.fillRect(0, 128, 512, 128);
    if (env === ENVS.night || env === ENVS.storm) {
      const n = env === ENVS.night ? 420 : 40;
      for (let i = 0; i < n; i++) { const v = 150 + r() * 105 | 0, yy = Math.pow(r(), 1.6) * 100; x.fillStyle = wdRgba(v, v, Math.min(255, v + 20), 0.3 + r() * 0.7); const s = r() < 0.08 ? 2 : 1; x.fillRect(r() * 512, yy, s, s); }
    }
    if (env === ENVS.storm || env === ENVS.dusk || env === ENVS.fog) {
      const col = env === ENVS.dusk ? [150, 80, 70] : env === ENVS.fog ? [90, 100, 110] : [38, 46, 62];
      for (let i = 0; i < 70; i++) wdBlot(x, 512, 256, r() * 512, 10 + Math.pow(r(), 0.8) * 100, 20 + r() * 46, col, 0.1 + r() * 0.14, true);
    }
    const t = new THREE.CanvasTexture(c);
    return t;
  }
  function wdApplyEnv(e) {
    if (!wdSky) return;
    const key = (Object.keys(ENVS).find((k) => ENVS[k] === e)) || "night";
    if (key !== wdSkyKey) {
      wdSkyKey = key;
      if (!wdSkyCache[key]) wdSkyCache[key] = wdSkyTex(e);
      wdSky.material.map = wdSkyCache[key]; wdSky.material.needsUpdate = true;
    }
    wdMoon.visible = key === "night" || key === "dusk" || key === "tarde";
    wdMoon.material.color.setHex(key === "dusk" ? 0xffb070 : key === "tarde" ? 0xfff0c8 : 0xffffff);
    wdMoon.material.opacity = key === "dusk" ? 0.9 : 1;
    const lit = key === "fog" ? 0.25 : key === "dusk" ? 0.6 : 1;
    for (const m of [WD.bldgDark, WD.bldgDark2]) m.emissive.setScalar(lit);
  }
  const wdMoonDir = new THREE.Vector3(-10, 20, 8).normalize();
  function wdSkyFrame(f) {
    if (!wdSky) return;
    wdSky.position.copy(camera.position);
    wdMoon.position.copy(camera.position).addScaledVector(wdMoonDir, 88);
    const k = 1 + Math.min(4, f * 4);
    wdSky.material.color.setScalar(k);
  }

  // luzes dos postes: ficam sob o braço do poste
  function wdPlaceLamps() {
    LAMPS.forEach((o, i) => {
      const p = wdLampPos[i] || [o[0], o[4] - 0.3, -o[1]];
      const pl = new THREE.PointLight(0xffb866, 1.7, 28, 1.6); pl.position.set(p[0], p[1], p[2]); scene.add(pl); lampLights.push(pl);
      const sp = new THREE.Sprite(WD.glowL); sp.scale.set(2.4, 2.4, 1); sp.position.set(p[0], p[1] + 0.1, p[2]); scene.add(sp);
    });
  }

  const worldArena = new THREE.Group(); scene.add(worldArena);           // a vila da Infecção fica em outro grupo (italiaview.js)
  {
    const realAdd = scene.add, keep = new Set();
    scene.add = function () { for (const o of arguments) (o === wdSky || o === wdMoon || o.isLight ? keep : worldArena).add(o); return this; };
    try { wdBuildWorld(); wdPlaceLamps(); }
    catch (err) {
      if (window.console) console.error("mundo realista falhou, usando o simples", err);
      wdFallback();
    } finally { scene.add = realAdd; }
    for (const o of keep) if (o === wdSky || o === wdMoon) scene.add(o); else worldArena.add(o);
  }
  function wdFallback() {
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(2 * ARENA + 4, 2 * ARENA + 4), new THREE.MeshLambertMaterial({ color: 0x2a2b30 }));
    fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
    for (let i = 0; i < 4; i++) { const b = BOXES[i], m = new THREE.Mesh(new THREE.BoxGeometry(b[1] - b[0], b[4], b[3] - b[2]), M.wall); put(m, (b[0] + b[1]) / 2, (b[2] + b[3]) / 2, b[4] / 2); m.receiveShadow = true; scene.add(m); }
    OBSTACLES.forEach((o) => { const m = new THREE.Mesh(new THREE.BoxGeometry(o[2], o[4], o[3]), M.crate); put(m, o[0], o[1], o[4] / 2); m.castShadow = m.receiveShadow = true; scene.add(m); });
    if (!lampLights.length) LAMPS.forEach((o) => { const pl = new THREE.PointLight(0xffb866, 1.7, 28, 1.6); put(pl, o[0], o[1], o[4] - 0.3); scene.add(pl); lampLights.push(pl); });
  }
