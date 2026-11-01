  // ======================================================================
  //  MAPA ITÁLIA: visual (texturas desenhadas em canvas; colisão vem de ITALIA em mapit.js)
  // ======================================================================
  const IT = {};
  const itPos = (x, y, h) => new THREE.Vector3(x, h, -y);                       // lógico -> three
  const ITC = { stucco: ["#d9a25a", "#c9744c", "#e3cd8c", "#d99a8c", "#b8643c", "#e6dcc2", "#a9b48f"], shutter: "#3f6b4a", awn: ["#b8322a", "#2f6b3e", "#c98a1c", "#3a5a8c", "#8c2f5a", "#2f6b6b", "#b85c1c"] };
  function itNoise(x, W, H, n, a, rr, col) { const r = wdR(rr); for (let i = 0; i < n; i++) { x.fillStyle = wdRgba(col[0] + (r() - 0.5) * 30, col[1] + (r() - 0.5) * 30, col[2] + (r() - 0.5) * 30, a * r()); const s = 1 + r() * 3; x.fillRect(r() * W, r() * H, s, s); } }
  const itHex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  function itStuccoTex(hex, seed, windows) {
    const W = 256, H = 256, [c, x] = wdCv(W, H), r = wdR(seed), col = itHex(hex);
    x.fillStyle = hex; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) wdBlot(x, W, H, r() * W, r() * H, 20 + r() * 60, r() < 0.5 ? [col[0] - 30, col[1] - 30, col[2] - 30] : [col[0] + 20, col[1] + 18, col[2] + 14], 0.12 + r() * 0.12, true);
    itNoise(x, W, H, 1600, 0.25, seed + 1, col);
    x.fillStyle = "rgba(60,40,30,0.22)"; x.fillRect(0, H - 14, W, 14);                 // rodapé sujo
    if (windows) {                                                                   // janela com venezianas verdes (repete a cada 3,2 m x 3 m)
      const wx = 88, wy = 70, ww = 80, wh = 110;
      x.fillStyle = "#e9e1cf"; x.fillRect(wx - 8, wy - 8, ww + 16, wh + 20);
      x.fillStyle = "#1b1712"; x.fillRect(wx, wy, ww, wh);
      x.fillStyle = "rgba(255,200,120,0.18)"; x.fillRect(wx + 4, wy + 4, ww - 8, wh / 2);
      x.fillStyle = ITC.shutter;
      for (const sx of [wx - 44, wx + ww + 4]) { x.fillRect(sx, wy, 40, wh); x.fillStyle = "rgba(0,0,0,0.25)"; for (let k = 6; k < wh; k += 8) x.fillRect(sx + 3, wy + k, 34, 2); x.fillStyle = ITC.shutter; }
      x.fillStyle = "#7a6a58"; x.fillRect(wx - 12, wy + wh + 10, ww + 24, 8);
    }
    return wdTex(c);
  }
  function itStoneTex(seed, base) {
    const W = 256, H = 256, [c, x] = wdCv(W, H), r = wdR(seed);
    x.fillStyle = "#4b443b"; x.fillRect(0, 0, W, H);
    let yy = 0;
    while (yy < H) {
      const rh = 22 + r() * 18; let xx = -r() * 30;
      while (xx < W) {
        const rw = 30 + r() * 46, v = base + (r() - 0.5) * 40;
        x.fillStyle = wdRgba(v + 10, v, v - 14, 1); x.fillRect(xx + 2, yy + 2, rw - 4, rh - 4);
        x.fillStyle = "rgba(255,255,255,0.06)"; x.fillRect(xx + 2, yy + 2, rw - 4, 3);
        xx += rw;
      }
      yy += rh;
    }
    itNoise(x, W, H, 1500, 0.3, seed + 3, [base, base - 6, base - 18]);
    return wdTex(c);
  }
  function itCobbleTex(seed, base, warm) {
    const W = 256, H = 256, [c, x] = wdCv(W, H), r = wdR(seed);
    x.fillStyle = warm ? "#5b4e40" : "#3d3a36"; x.fillRect(0, 0, W, H);
    for (let gy = 0; gy < 16; gy++) for (let gx = 0; gx < 16; gx++) {
      const cx = gx * 16 + 8 + (gy % 2) * 8 + (r() - 0.5) * 3, cy = gy * 16 + 8 + (r() - 0.5) * 3, v = base + (r() - 0.5) * 36;
      x.fillStyle = warm ? wdRgba(v + 22, v + 8, v - 12, 1) : wdRgba(v, v - 2, v - 6, 1);
      x.beginPath(); x.ellipse(cx % W, cy, 6.5 + r(), 6 + r(), r() * 3, 0, Math.PI * 2); x.fill();
      x.fillStyle = "rgba(255,255,255,0.07)"; x.beginPath(); x.ellipse(cx % W - 1.5, cy - 2, 3.5, 2.5, 0, 0, Math.PI * 2); x.fill();
    }
    return wdTex(c);
  }
  function itTileTex() {                                                            // telhas de barro
    const W = 128, H = 128, [c, x] = wdCv(W, H), r = wdR(77);
    x.fillStyle = "#7e3a22"; x.fillRect(0, 0, W, H);
    for (let row = 0; row < 8; row++) for (let k = 0; k < 8; k++) {
      const v = 150 + (r() - 0.5) * 40, ox = k * 16 + (row % 2) * 8, oy = row * 16;
      const g = x.createLinearGradient(ox, oy, ox + 16, oy);
      g.addColorStop(0, wdRgba(v * 0.7, v * 0.33, v * 0.2, 1)); g.addColorStop(0.5, wdRgba(v, v * 0.48, v * 0.3, 1)); g.addColorStop(1, wdRgba(v * 0.7, v * 0.33, v * 0.2, 1));
      x.fillStyle = g; x.fillRect(ox % W, oy, 15, 15);
      x.fillStyle = "rgba(0,0,0,0.3)"; x.fillRect(ox % W, oy + 13, 15, 3);
    }
    return wdTex(c);
  }
  function itFloorTex() {                                                           // piso de cotto dentro das casas
    const W = 128, H = 128, [c, x] = wdCv(W, H), r = wdR(55);
    x.fillStyle = "#6a3a26"; x.fillRect(0, 0, W, H);
    for (let gy = 0; gy < 4; gy++) for (let gx = 0; gx < 4; gx++) { const v = 170 + (r() - 0.5) * 40; x.fillStyle = wdRgba(v, v * 0.55, v * 0.38, 1); x.fillRect(gx * 32 + 1, gy * 32 + 1, 30, 30); }
    itNoise(x, W, H, 500, 0.2, 56, [150, 80, 50]);
    return wdTex(c);
  }
  function itStripeTex(a, b) {
    const [c, x] = wdCv(64, 64);
    for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? b : a; x.fillRect(i * 8, 0, 8, 64); }
    x.fillStyle = "rgba(0,0,0,0.15)"; x.fillRect(0, 56, 64, 8);
    return wdTex(c);
  }
  function itStrawTex() {
    const [c, x] = wdCv(64, 64), r = wdR(9);
    x.fillStyle = "#c9a54e"; x.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 300; i++) { const v = 150 + r() * 90; x.strokeStyle = wdRgba(v, v * 0.8, v * 0.35, 0.7); x.beginPath(); const sx = r() * 64, sy = r() * 64; x.moveTo(sx, sy); x.lineTo(sx + (r() - 0.5) * 10, sy + r() * 8); x.stroke(); }
    return wdTex(c);
  }
  // fachada de loja: vitrine, porta, placa com o nome, janelas com venezianas nos andares de cima
  function itShopFacade(sh, fw) {
    const W = 512, H = Math.max(256, Math.round((W * sh.h) / fw)), [c, x] = wdCv(W, H), ppm = W / fw, col = ITC.stucco[sh.color % ITC.stucco.length], r = wdR(sh.name.length * 31 + sh.color);
    const rgb = itHex(col);
    x.fillStyle = col; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 20; i++) wdBlot(x, W, H, r() * W, r() * H, 30 + r() * 60, [rgb[0] - 30, rgb[1] - 30, rgb[2] - 30], 0.12, false);
    itNoise(x, W, H, 2400, 0.25, 7, rgb);
    const gy = H - 3.6 * ppm;                                                       // topo do térreo
    // térreo em pedra
    x.fillStyle = "#8a7a64"; x.fillRect(0, gy, W, H - gy);
    itNoise(x, W, H, 600, 0.3, 8, [138, 122, 100]);
    // vitrine e porta
    const vx = 0.08 * W, vw = 0.52 * W, dx = 0.66 * W, dw = 0.22 * W, top = gy + 0.55 * ppm;
    const glow = x.createLinearGradient(0, top, 0, H);
    glow.addColorStop(0, "#3a2614"); glow.addColorStop(1, "#c98c46");
    x.fillStyle = "#2a1c12"; x.fillRect(vx - 6, top - 6, vw + 12, H - top);
    x.fillStyle = glow; x.fillRect(vx, top, vw, H - top - 0.5 * ppm);
    x.fillStyle = "rgba(255,255,255,0.12)"; x.fillRect(vx + 8, top + 6, vw * 0.3, (H - top) * 0.5);
    x.fillStyle = "#3a2a1a"; x.fillRect(vx + vw / 2 - 3, top, 6, H - top);
    x.fillStyle = "#2a1c12"; x.fillRect(dx - 6, top - 6, dw + 12, H - top + 6);
    x.fillStyle = "#4a2e1a"; x.fillRect(dx, top, dw, H - top);
    x.fillStyle = "rgba(255,210,140,0.35)"; x.fillRect(dx + 8, top + 8, dw - 16, (H - top) * 0.45);
    // placa
    const sy = gy - 0.95 * ppm, shh = 0.8 * ppm;
    x.fillStyle = "#1f2a22"; x.fillRect(0.05 * W, sy, 0.9 * W, shh);
    x.strokeStyle = "#c9a45a"; x.lineWidth = 4; x.strokeRect(0.05 * W + 6, sy + 6, 0.9 * W - 12, shh - 12);
    x.fillStyle = "#f2e2b4"; x.textAlign = "center"; x.textBaseline = "middle";
    let fs = shh * 0.62; x.font = "700 " + fs + "px Georgia, 'Times New Roman', serif";
    while (x.measureText(sh.name).width > 0.84 * W && fs > 10) { fs -= 2; x.font = "700 " + fs + "px Georgia, 'Times New Roman', serif"; }
    x.fillText(sh.name, W / 2, sy + shh / 2 + 2);
    // andares de cima: janelas com venezianas e sacada
    const floors = Math.max(1, Math.floor((gy - 0.4 * ppm) / (3 * ppm))), nwin = Math.max(2, Math.round(fw / 3.3));
    for (let f = 0; f < floors; f++) {
      const fy = gy - 1.2 * ppm - (f + 1) * 3 * ppm + 0.6 * ppm;
      for (let k = 0; k < nwin; k++) {
        const cx = (W / nwin) * (k + 0.5), ww = 0.9 * ppm, wh = 1.5 * ppm;
        x.fillStyle = "#ece2cc"; x.fillRect(cx - ww / 2 - 6, fy - 6, ww + 12, wh + 14);
        x.fillStyle = "#16120e"; x.fillRect(cx - ww / 2, fy, ww, wh);
        if (r() < 0.35) { x.fillStyle = "rgba(255,190,110,0.45)"; x.fillRect(cx - ww / 2 + 3, fy + 3, ww - 6, wh - 6); }
        x.fillStyle = ITC.shutter;
        if (r() < 0.6) { x.fillRect(cx - ww / 2 - 0.45 * ppm, fy, 0.42 * ppm, wh); x.fillRect(cx + ww / 2 + 0.03 * ppm, fy, 0.42 * ppm, wh); }
        else x.fillRect(cx - ww / 2, fy, ww, wh * 0.8);
        if (f === 0 && r() < 0.5) { x.fillStyle = "#2b2b2b"; x.fillRect(cx - ww * 0.8, fy + wh, ww * 1.6, 4); for (let b = -3; b <= 3; b++) x.fillRect(cx + b * ww * 0.25, fy + wh - 0.5 * ppm, 2, 0.5 * ppm); x.fillRect(cx - ww * 0.8, fy + wh - 0.5 * ppm, ww * 1.6, 3); }
      }
    }
    // cornija
    x.fillStyle = "rgba(255,255,255,0.18)"; x.fillRect(0, 6, W, 8); x.fillStyle = "rgba(0,0,0,0.2)"; x.fillRect(0, 14, W, 4);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  function itChapelFacade() {
    const W = 256, H = 256, [c, x] = wdCv(W, H);
    x.fillStyle = "#e8dcc0"; x.fillRect(0, 0, W, H); itNoise(x, W, H, 1500, 0.25, 41, [232, 220, 192]);
    x.fillStyle = "#3a2618"; x.beginPath(); x.moveTo(98, H); x.lineTo(98, 170); x.arc(128, 170, 30, Math.PI, 0); x.lineTo(158, H); x.fill();
    x.fillStyle = "#6a3a20"; for (let i = 0; i < 6; i++) x.fillRect(104 + i * 9, 172, 5, H - 172);
    x.strokeStyle = "#8a7a5a"; x.lineWidth = 8; x.beginPath(); x.arc(128, 92, 34, 0, Math.PI * 2); x.stroke();
    x.fillStyle = "#3a4a8a"; x.beginPath(); x.arc(128, 92, 30, 0, Math.PI * 2); x.fill();
    x.strokeStyle = "#e6c060"; x.lineWidth = 3; for (let k = 0; k < 8; k++) { x.beginPath(); x.moveTo(128, 92); x.lineTo(128 + Math.cos(k * 0.785) * 30, 92 + Math.sin(k * 0.785) * 30); x.stroke(); }
    return new THREE.CanvasTexture(c);
  }
  function itBuildMaterials() {
    const lam = (o) => new THREE.MeshLambertMaterial(o);
    IT.stucco = ITC.stucco.map((h, i) => lam({ map: itStuccoTex(h, 300 + i, false), color: 0xdcdcdc }));
    IT.stuccoWin = ITC.stucco.map((h, i) => lam({ map: itStuccoTex(h, 400 + i, true), color: 0xe6e6e6 }));
    IT.plaster = lam({ map: itStuccoTex("#b3a996", 500, false) });
    IT.stone = lam({ map: itStoneTex(11, 150) });
    IT.stoneLight = lam({ map: itStoneTex(12, 182) });
    IT.cobble = lam({ map: itCobbleTex(21, 120, false) });
    IT.piazza = lam({ map: itCobbleTex(22, 150, true) });
    IT.tile = lam({ map: itTileTex() });
    IT.floor = lam({ map: itFloorTex() });
    IT.grass = lam({ map: (function () {                                              // gramado (sem transparência)
      const [c, x] = wdCv(128, 128), r = wdR(66);
      x.fillStyle = "#3f5726"; x.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 2600; i++) { const v = 0.75 + r() * 0.5; x.fillStyle = wdRgba(70 * v, 96 * v, 42 * v, 0.6); x.fillRect(r() * 128, r() * 128, 1, 2 + r() * 3); }
      for (let i = 0; i < 40; i++) { x.fillStyle = r() < 0.5 ? "rgba(230,210,90,0.7)" : "rgba(240,240,240,0.6)"; x.fillRect(r() * 128, r() * 128, 2, 2); }
      return wdTex(c);
    })(), color: 0x93a083 });
    IT.lawn = lam({ color: 0x5d7a3a });
    IT.wood = lam({ map: wdWoodTex(81, 0), color: 0xb08a5e });
    IT.woodDark = lam({ map: wdWoodTex(82, 1), color: 0x6a4a30 });
    IT.straw = lam({ map: itStrawTex() });
    IT.iron = lam({ color: 0x1e1f22 });
    IT.water = new THREE.MeshLambertMaterial({ color: 0x3f7f9a, emissive: 0x0a2430, transparent: true, opacity: 0.85 });
    IT.leafOlive = lam({ color: 0x75825a });
    IT.leafCypress = lam({ color: 0x2d4a2a });
    IT.trunk = lam({ color: 0x5a4636 });
    IT.fabric = [0xa8302a, 0x6a7d3a, 0x2f4a7a, 0x8a5a2a].map((c) => lam({ color: c }));
    IT.mattress = lam({ color: 0xe8e2d4 });
    IT.awn = ITC.awn.map((a) => lam({ map: itStripeTex(a, "#efe6d2"), side: THREE.DoubleSide }));
    IT.produce = [0xd8401e, 0xe8b020, 0x5aa03a, 0x8a2a6a, 0xe86a20].map((c) => lam({ color: c }));
    IT.bell = lam({ color: 0x8a6a2a });
    IT.dark = lam({ color: 0x15120e });
    IT.lantern = new THREE.MeshBasicMaterial({ color: 0xffd08a });
    IT.hill = [0x405a3a, 0x4a6440, 0x3a5232].map((c) => lam({ color: c }));
  }
  // caixa de colisão -> malha (centro/tamanho em três)
  function itBoxOf(b, B, mat, uvm) {
    const w = b[1] - b[0], h = b[4] - b[5], d = b[3] - b[2];
    if (w <= 0 || h <= 0 || d <= 0) return;
    B.add(mat, wdBoxG(w, h, d, uvm || 3, uvm || 3), wdT((b[0] + b[1]) / 2, (b[4] + b[5]) / 2, -(b[2] + b[3]) / 2));
  }
  function itRoof(B, cx, cy, w, d, base, rh, over) {                               // telhado de quatro águas (pirâmide esticada)
    const g = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1, true), uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w + d) / 2, uv.getY(i) * rh * 1.6);
    const m = new THREE.Matrix4().compose(new THREE.Vector3(cx, base + rh / 2, -cy), new THREE.Quaternion(), new THREE.Vector3(w + over, rh, d + over)).multiply(new THREE.Matrix4().makeRotationY(Math.PI / 4));
    B.add(IT.tile, g, m);
  }
  function buildItalia() {
    itBuildMaterials();
    const M_ = ITALIA, D = M_.decor, A = M_.A;
    const solid = new WdBatch(), deco = new WdBatch(), flat = new WdBatch();
    // chão: paralelepípedos; praça mais clara; grama fora do caminho em volta dos morros
    const fl = new THREE.Mesh(wdPlaneG(2 * A + 6, 2 * A + 6, (2 * A + 6) / 4, (2 * A + 6) / 4), IT.cobble);
    fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
    const pz = new THREE.Mesh(wdPlaneG(28, 28, 7, 7), IT.piazza); pz.rotation.x = -Math.PI / 2; pz.position.y = 0.01; pz.receiveShadow = true; scene.add(pz);
    const out = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), IT.lawn); out.rotation.x = -Math.PI / 2; out.position.y = -0.05; scene.add(out);
    // caixas de colisão por tipo
    for (const b of M_.boxes) {
      const k = b[6];
      if (k === "citywall") itBoxOf(b, solid, IT.stone, 3);
      else if (k.indexOf("hwall") === 0) itBoxOf(b, solid, IT.stucco[Number(k.slice(5)) % IT.stucco.length], 3);
      else if (k === "hinner") itBoxOf(b, solid, IT.plaster, 3);
      else if (k === "step") itBoxOf(b, solid, IT.stoneLight, 1.5);
      else if (k === "shop") {
        const sh = b[7]; itBoxOf(b, solid, IT.stuccoWin[sh.color % IT.stuccoWin.length], 3.2);
      } else if (k === "terrace") itBoxOf(b, solid, IT.stone, 3);
      else if (k === "chapel") itBoxOf(b, solid, IT.stucco[5], 3);
      else if (k === "tower") itBoxOf(b, solid, IT.stoneLight, 2.5);
      else if (k === "furn_table" || k === "furn_dresser") itBoxOf(b, solid, IT.wood, 1);
      else if (k === "furn_cabinet") itBoxOf(b, solid, IT.woodDark, 1.5);
      else if (k === "furn_bed") { itBoxOf(b, solid, IT.woodDark, 1); deco.add(IT.mattress, wdBoxG(b[1] - b[0] - 0.1, 0.12, b[3] - b[2] - 0.1, 1), wdT((b[0] + b[1]) / 2, b[4] + 0.06, -(b[2] + b[3]) / 2)); }
      else if (k === "furn_sofa") itBoxOf(b, solid, IT.fabric[0], 1);
      else if (k === "furn_crate" || k === "crate") itBoxOf(b, solid, WD.crate[(Math.abs(b[0] * 7) | 0) % 2], 1.2);
      else if (k === "barrel") { const c = new THREE.CylinderGeometry(0.37, 0.34, 1, 12); solid.add(IT.woodDark, c, wdT((b[0] + b[1]) / 2, 0.5, -(b[2] + b[3]) / 2)); for (const hh of [0.18, 0.82]) deco.add(IT.iron, new THREE.CylinderGeometry(0.38, 0.38, 0.05, 12), wdT((b[0] + b[1]) / 2, hh, -(b[2] + b[3]) / 2)); }
      else if (k === "hay") itBoxOf(b, solid, IT.straw, 1);
      else if (k === "trunk") { const c = new THREE.CylinderGeometry(0.16, 0.24, b[4] - b[5], 7); solid.add(IT.trunk, c, wdT((b[0] + b[1]) / 2, (b[4] + b[5]) / 2, -(b[2] + b[3]) / 2)); }
      else if (k === "fountain") { solid.add(IT.stoneLight, new THREE.CylinderGeometry(2.6, 2.7, 0.85, 8), wdT(0, 0.425, 0)); flat.add(IT.water, new THREE.CylinderGeometry(2.25, 2.25, 0.05, 8), wdT(0, 0.75, 0)); }
      else if (k === "fountaincol") { solid.add(IT.stoneLight, new THREE.CylinderGeometry(0.35, 0.45, 2.6, 10), wdT(0, 1.3, 0)); solid.add(IT.stoneLight, new THREE.CylinderGeometry(1.1, 0.4, 0.35, 10), wdT(0, 2.0, 0)); flat.add(IT.water, new THREE.CylinderGeometry(0.95, 0.95, 0.05, 10), wdT(0, 2.15, 0)); solid.add(IT.stoneLight, new THREE.SphereGeometry(0.32, 10, 8), wdT(0, 2.75, 0)); }
      else if (k === "lamp") { solid.add(IT.iron, new THREE.CylinderGeometry(0.07, 0.11, 4.4, 8), wdT((b[0] + b[1]) / 2, 2.2, -(b[2] + b[3]) / 2)); }
      else if (k === "bench") itBoxOf(b, solid, IT.stoneLight, 1);
      else if (k === "table") { solid.add(IT.iron, new THREE.CylinderGeometry(0.05, 0.05, 0.75, 6), wdT((b[0] + b[1]) / 2, 0.38, -(b[2] + b[3]) / 2)); solid.add(IT.plaster, new THREE.CylinderGeometry(0.5, 0.5, 0.05, 14), wdT((b[0] + b[1]) / 2, 0.77, -(b[2] + b[3]) / 2)); }
      else if (k === "stall") itBoxOf(b, solid, IT.wood, 1);
      else if (k === "cart") { /* desenhada abaixo */ }
      else itBoxOf(b, solid, IT.stoneLight, 2);
    }
    // ameias da muralha
    for (let u = -A; u <= A; u += 2.4) for (const [x, y] of [[u, A + 0.8], [u, -A - 0.8], [A + 0.8, u], [-A - 0.8, u]]) solid.add(IT.stone, wdBoxG(1.2, 0.9, 1.2, 1.5), wdT(x, 7.45, -y));
    // gramado em cima dos terraços
    for (const t of D.terraces) { const g = wdPlaneG(t.x1 - t.x0, t.y1 - t.y0, (t.x1 - t.x0) / 3, (t.y1 - t.y0) / 3); flat.add(IT.grass, g, wdT((t.x0 + t.x1) / 2, t.top + 0.015, -(t.y0 + t.y1) / 2, -Math.PI / 2, 0, 0)); }
    // lojas: fachada desenhada, toldo, telhado
    for (const sh of D.shops) {
      const fw = sh.face === "n" || sh.face === "s" ? sh.w : sh.d, tex = itShopFacade(sh, fw);
      const mat = new THREE.MeshLambertMaterial({ map: tex, polygonOffset: true, polygonOffsetFactor: -1 });
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(fw, sh.h), mat);
      const b = sh.b, off = 0.03;
      if (sh.face === "s") { pl.position.set(sh.cx, sh.h / 2, -b[2] + off); }
      else if (sh.face === "n") { pl.position.set(sh.cx, sh.h / 2, -b[3] - off); pl.rotation.y = Math.PI; }
      else if (sh.face === "l") { pl.position.set(b[1] + off, sh.h / 2, -sh.cy); pl.rotation.y = Math.PI / 2; }
      else { pl.position.set(b[0] - off, sh.h / 2, -sh.cy); pl.rotation.y = -Math.PI / 2; }
      pl.receiveShadow = true; scene.add(pl);
      // toldo listrado sobre a vitrine (2,9 m de altura, sem colisão)
      const aw = new THREE.Mesh(new THREE.PlaneGeometry(fw * 0.7, 1.5), IT.awn[sh.color % IT.awn.length]);
      const n = sh.face === "s" ? [0, -1] : sh.face === "n" ? [0, 1] : sh.face === "l" ? [1, 0] : [-1, 0];   // direção para fora (lógico)
      const fx = sh.face === "l" ? b[1] : sh.face === "o" ? b[0] : sh.cx, fy = sh.face === "s" ? b[2] : sh.face === "n" ? b[3] : sh.cy;
      aw.rotation.order = "YXZ";
      aw.position.set(fx + n[0] * 0.65, 3.0, -(fy + n[1] * 0.65));
      aw.rotation.y = sh.face === "s" ? 0 : sh.face === "n" ? Math.PI : sh.face === "l" ? Math.PI / 2 : -Math.PI / 2;
      aw.rotation.x = -1.0;
      scene.add(aw);
      itRoof(deco, sh.cx, sh.cy, sh.w, sh.d, sh.h, 2.2, 0.8);
    }
    // casas: piso, forro e telhado (paredes já vieram das caixas)
    for (const h of D.houses) {
      flat.add(IT.floor, wdPlaneG(h.w - 0.3, h.d - 0.3, h.w / 2, h.d / 2), wdT(h.cx, h.z0 + 0.02, -h.cy, -Math.PI / 2, 0, 0));
      flat.add(IT.plaster, wdPlaneG(h.w, h.d, 2, 2), wdT(h.cx, h.z0 + h.h - 0.02, -h.cy, Math.PI / 2, 0, 0));
      itRoof(deco, h.cx, h.cy, h.w, h.d, h.z0 + h.h, 2.0, 0.9);
    }
    // capela e torre
    if (D.chapel) {
      const c = D.chapel;
      itRoof(deco, c.cx, c.cy, c.w, c.d, c.z + 8, 2.8, 0.6);
      const fp = new THREE.Mesh(new THREE.PlaneGeometry(c.w * 0.9, 7.6), new THREE.MeshLambertMaterial({ map: itChapelFacade(), polygonOffset: true, polygonOffsetFactor: -1 }));
      fp.position.set(c.cx, c.z + 3.8, -(c.cy + c.d / 2) - 0.03); fp.rotation.y = Math.PI; scene.add(fp);
    }
    if (D.tower) {
      const t = D.tower;
      itRoof(deco, t.x, t.y, t.w, t.w, t.z + t.h, 2.6, 0.5);
      for (const [dx, dy, ry] of [[0, t.w / 2 + 0.02, Math.PI], [0, -t.w / 2 - 0.02, 0], [t.w / 2 + 0.02, 0, Math.PI / 2], [-t.w / 2 - 0.02, 0, -Math.PI / 2]]) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.2), IT.dark); m.position.set(t.x + dx, t.z + t.h - 1.8, -(t.y + dy)); m.rotation.y = ry; scene.add(m);
      }
      deco.add(IT.bell, new THREE.SphereGeometry(0.5, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), wdT(t.x, t.z + t.h - 1.6, -t.y));
    }
    // carroças
    for (const c of D.carts) {
      const base = wdT(c.x, 0, -c.y, 0, c.rot ? Math.PI / 2 : 0, 0);
      const P = (m) => wdMul(base, m);
      solid.add(IT.wood, wdBoxG(3.0, 0.14, 1.5, 1), P(wdT(0, 0.85, 0)));
      for (const s of [-0.7, 0.7]) solid.add(IT.woodDark, wdBoxG(3.0, 0.45, 0.08, 1), P(wdT(0, 1.1, s)));
      for (const s of [-1.45, 1.45]) solid.add(IT.woodDark, wdBoxG(0.08, 0.45, 1.5, 1), P(wdT(s, 1.1, 0)));
      for (const s of [-0.82, 0.82]) { deco.add(IT.woodDark, new THREE.CylinderGeometry(0.62, 0.62, 0.1, 14), P(wdT(-0.3, 0.62, s, Math.PI / 2, 0, 0))); deco.add(IT.iron, new THREE.CylinderGeometry(0.12, 0.12, 0.14, 8), P(wdT(-0.3, 0.62, s, Math.PI / 2, 0, 0))); }
      for (const s of [-0.5, 0.5]) deco.add(IT.woodDark, wdBoxG(1.8, 0.07, 0.07, 1), P(wdT(2.3, 0.75, s, 0, 0, -0.25)));
      if (Math.abs(c.x * 3 + c.y) % 3 < 1.5) deco.add(IT.straw, wdBoxG(1.6, 0.5, 1.2, 1), P(wdT(-0.5, 1.2, 0)));
      else for (let i = 0; i < 3; i++) deco.add(WD.crate[i % 2], wdBoxG(0.6, 0.5, 0.6, 1), P(wdT(-0.9 + i * 0.75, 1.17, (i % 2) * 0.3 - 0.15)));
    }
    // barracas do mercado (toldo listrado + mercadoria)
    for (const s of D.stalls) {
      const base = wdT(s.x, 0, -s.y, 0, s.rot ? Math.PI / 2 : 0, 0), P = (m) => wdMul(base, m);
      for (const [px, pz] of [[-1.5, -0.6], [1.5, -0.6], [-1.5, 0.6], [1.5, 0.6]]) deco.add(IT.woodDark, wdBoxG(0.08, 2.4, 0.08, 1), P(wdT(px, 1.2, pz)));
      deco.add(IT.awn[s.c % IT.awn.length], wdBoxG(3.4, 0.05, 1.8, 1), P(wdT(0, 2.45, 0, 0.18, 0, 0)));
      for (let i = 0; i < 6; i++) deco.add(IT.produce[(i + s.c) % IT.produce.length], new THREE.SphereGeometry(0.16, 8, 6), P(wdT(-1.2 + i * 0.48, 1.12, (i % 2) * 0.3 - 0.15)));
    }
    // guarda-sóis
    for (const u of D.umbrellas) {
      deco.add(IT.iron, new THREE.CylinderGeometry(0.03, 0.03, 2.3, 6), wdT(u.x, 1.15, -u.y));
      deco.add(IT.awn[u.c % IT.awn.length], new THREE.ConeGeometry(1.3, 0.5, 10, 1, true), wdT(u.x, 2.4, -u.y));
    }
    // árvores
    for (const t of D.trees) {
      if (t.k === "olive") { for (const [dx, dh, dz, s] of [[0, 2.6, 0, 1.2], [0.6, 2.9, 0.3, 0.9], [-0.5, 3.0, -0.4, 0.85], [0.1, 3.4, 0.2, 0.7]]) deco.add(IT.leafOlive, new THREE.IcosahedronGeometry(s, 1), wdT(t.x + dx, t.z + dh, -(t.y + dz))); }
      else { deco.add(IT.leafCypress, new THREE.SphereGeometry(1, 10, 8), wdT(t.x, t.z + 4.2, -t.y, 0, 0, 0, 0.9, 3.4, 0.9)); }
    }
    // postes: braço + lanterna
    D.lamps.forEach((l) => { deco.add(IT.iron, wdBoxG(0.6, 0.06, 0.06, 1), wdT(l.x + 0.3, 4.3, -l.y)); deco.add(IT.lantern, wdBoxG(0.26, 0.36, 0.26, 1), wdT(l.x + 0.55, 4.05, -l.y)); });
    // bancos (assento de madeira)
    for (const b of D.benches) deco.add(IT.wood, wdBoxG(b.rot ? 0.6 : 2.3, 0.08, b.rot ? 2.3 : 0.6, 1), wdT(b.x, 0.54, -b.y));
    // morros distantes fora da muralha
    const hr = wdR(4242);
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + hr() * 0.2, R = 120 + hr() * 70, s = 30 + hr() * 40;
      deco.add(IT.hill[i % 3], new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), wdT(Math.cos(a) * R, -2, Math.sin(a) * R, 0, 0, 0, s, 12 + hr() * 22, s));
      if (hr() < 0.7) for (let k = 0; k < 4; k++) deco.add(IT.leafCypress, new THREE.SphereGeometry(1, 6, 5), wdT(Math.cos(a + k * 0.02) * (R - s * 0.6), 6 + hr() * 4, Math.sin(a + k * 0.02) * (R - s * 0.6), 0, 0, 0, 1.2, 5, 1.2));
    }
    solid.build(scene, true, true); deco.build(scene, true, true); flat.build(scene, false, true);
    // luzes: só os postes da praça e das ruas principais têm luz de verdade (desempenho no celular)
    D.lamps.forEach((l, i) => {
      const sp = new THREE.Sprite(WD.glowL); sp.scale.set(2.2, 2.2, 1); sp.position.set(l.x + 0.55, 4.05, -l.y); scene.add(sp);
      if (i < 6) { const pl = new THREE.PointLight(0xffb866, 1.4, 26, 1.6); pl.position.set(l.x + 0.55, 3.9, -l.y); scene.add(pl); itLights.push(pl); }
    });
  }
  // ---------- boosters (ícones flutuantes) ----------
  const boostViews = [];
  function syncBoosts(g) {
    const list = g.boosts || [];
    if (!list.length) { for (const v of boostViews) v.root.visible = false; return; }
    while (boostViews.length < list.length) {
      const b = list[boostViews.length], grp = new THREE.Group(), speed = b.k === "speed";
      const col = speed ? 0x5fe8ff : 0x5dff7a, mat = new THREE.MeshBasicMaterial({ color: col });
      if (speed) {
        const sh = new THREE.Shape(); sh.moveTo(0.05, 0.42); sh.lineTo(-0.22, -0.02); sh.lineTo(-0.02, -0.02); sh.lineTo(-0.1, -0.42); sh.lineTo(0.22, 0.06); sh.lineTo(0.02, 0.06); sh.lineTo(0.05, 0.42);
        grp.add(new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: false }), mat));
      } else { grp.add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.56, 0.12), mat)); grp.add(new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.16, 0.12), mat)); }
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: wdGlowTex(speed ? [95, 232, 255] : [93, 255, 122]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 }));
      glow.scale.set(1.6, 1.6, 1);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.6, 24), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2;
      const root = new THREE.Group(); root.add(grp, glow, ring); root.position.copy(itPos(b.x, b.y, b.z)); scene.add(root);
      boostViews.push({ root, grp, glow, ring });
    }
    list.forEach((b, i) => {
      const v = boostViews[i]; v.root.visible = !!b.on;
      if (!b.on) return;
      v.grp.position.y = 1.0 + Math.sin(g.time * 2 + i) * 0.12; v.grp.rotation.y = g.time * 1.8 + i;
      v.glow.position.y = v.grp.position.y; v.ring.position.y = 0.03;
    });
  }
  // ---------- troca de mapa: arena (co-op e solo) x vila italiana (Infecção) ----------
  const itLights = [], arenaLights = [];
  let worldItaly = null;
  function ensureItalia() {
    if (worldItaly) return;
    worldItaly = new THREE.Group(); worldItaly.visible = false; scene.add(worldItaly);
    const realAdd = scene.add;
    scene.add = function () { return worldItaly.add.apply(worldItaly, arguments); };
    try { buildItalia(); } finally { scene.add = realAdd; }
  }
  function useMap(m) {
    const it = m === "italia";
    if (it) ensureItalia();
    L.setMap(it ? "italia" : "arena");
    if (!arenaLights.length && lampLights.length) arenaLights.push(...lampLights);
    if (worldArena) worldArena.visible = !it;
    if (worldItaly) worldItaly.visible = it;
    lampLights.length = 0; lampLights.push(...(it ? itLights : arenaLights));
    if (!it) for (const v of boostViews) v.root.visible = false;
    applyEnv();
  }
