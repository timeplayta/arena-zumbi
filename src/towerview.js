  // ======================================================================
  //  MODO PRÉDIO: visão 3D do andar (paredes, portas, móveis, armários, escadas, elevador, terraço e helicóptero)
  //  Escuro de propósito: luzes de emergência, máquinas acesas, placas de saída e a sua lanterna.
  //  Usa o mesmo número de luzes da arena (trocar a quantidade de luzes recompila os shaders e trava).
  // ======================================================================
  const TowerView = (function () {
    const root = new THREE.Group(); root.visible = false; scene.add(root);
    const H = 3.0;                                                       // pé-direito
    let floorG = null, builtKey = "", spots = [], lights = [], lockers = [], items = [], heli = null, flyers = [], flareV = [], P = null, assignT = 0, tt = 0, winCam = null;
    const lam = (o) => new THREE.MeshLambertMaterial(o), bas = (o) => new THREE.MeshBasicMaterial(o);
    let MT = null;
    // ---------- texturas (desenhadas em canvas, uma vez) ----------
    function grime(x, S, r, n, a) { for (let i = 0; i < n; i++) wdBlot(x, S, S, r() * S, r() * S, 8 + r() * S * 0.18, [20, 16, 12], a * (0.4 + r() * 0.6), true); }
    function tilesTex(S, n, base, line, seed, a) {
      const [c, x] = wdCv(S, S), r = wdR(seed); x.fillStyle = base; x.fillRect(0, 0, S, S);
      const t = S / n;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const v = (r() - 0.5) * 14; x.fillStyle = "rgba(" + (v > 0 ? "255,255,255," : "0,0,0,") + Math.abs(v) / 100 + ")"; x.fillRect(i * t, j * t, t, t); }
      x.strokeStyle = line; x.lineWidth = 2; for (let k = 0; k <= n; k++) { x.beginPath(); x.moveTo(k * t, 0); x.lineTo(k * t, S); x.stroke(); x.beginPath(); x.moveTo(0, k * t); x.lineTo(S, k * t); x.stroke(); }
      grime(x, S, r, 10, a || 0.18); return wdTex(c);
    }
    function carpetTex(seed, rgb) {
      const S = 256, [c, x] = wdCv(S, S), r = wdR(seed); x.fillStyle = wdRgba(rgb[0], rgb[1], rgb[2], 1); x.fillRect(0, 0, S, S);
      for (let i = 0; i < 9000; i++) { const v = (r() - 0.5) * 40; x.fillStyle = wdRgba(rgb[0] + v, rgb[1] + v, rgb[2] + v, 0.5); x.fillRect(r() * S, r() * S, 1.5, 1.5); }
      grime(x, S, r, 8, 0.22); return wdTex(c);
    }
    function plasterTex(seed, rgb) {                                       // parede pintada, rodapé escuro, sujeira escorrida e algum sangue
      const S = 256, [c, x] = wdCv(S, S), r = wdR(seed); x.fillStyle = wdRgba(rgb[0], rgb[1], rgb[2], 1); x.fillRect(0, 0, S, S);
      for (let i = 0; i < 3000; i++) { const v = (r() - 0.5) * 18; x.fillStyle = wdRgba(rgb[0] + v, rgb[1] + v, rgb[2] + v, 0.35); x.fillRect(r() * S, r() * S, 2, 2); }
      for (let i = 0; i < 26; i++) { const px = r() * S, l = 20 + r() * 120, g = x.createLinearGradient(0, S * 0.1, 0, S * 0.1 + l); g.addColorStop(0, "rgba(40,30,20,0.25)"); g.addColorStop(1, "rgba(40,30,20,0)"); x.fillStyle = g; x.fillRect(px, S * 0.1, 2 + r() * 4, l); }
      if (seed % 3 === 0) for (let i = 0; i < 18; i++) { x.fillStyle = "rgba(90,8,8," + (0.3 + r() * 0.4) + ")"; x.beginPath(); x.arc(S * 0.3 + r() * 60, S * 0.55 + r() * 50, 1 + r() * 7, 0, 6.3); x.fill(); }
      x.fillStyle = "#1d1b19"; x.fillRect(0, S - 10, S, 10);                 // rodapé (a textura vai de 0 a 3 m na altura)
      return wdTex(c);
    }
    function ceilTex() {
      const S = 256, [c, x] = wdCv(S, S), r = wdR(41); x.fillStyle = "#7c7b76"; x.fillRect(0, 0, S, S);
      const n = 4, t = S / n;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const miss = r() < 0.08; x.fillStyle = miss ? "#0b0b0d" : wdRgba(118 + r() * 16, 117 + r() * 14, 110 + r() * 12, 1); x.fillRect(i * t + 2, j * t + 2, t - 4, t - 4); if (!miss) for (let k = 0; k < 40; k++) { x.fillStyle = "rgba(40,40,40,0.25)"; x.fillRect(i * t + r() * t, j * t + r() * t, 1.5, 1.5); } }
      grime(x, S, r, 6, 0.25); return wdTex(c);
    }
    function windowTex() {                                                  // janela de fora: cidade à noite (prédios com luzes acesas)
      const W = 512, Hh = 256, [c, x] = wdCv(W, Hh), r = wdR(77);
      const g = x.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, "#070b16"); g.addColorStop(0.6, "#1a1a2e"); g.addColorStop(1, "#3a2433"); x.fillStyle = g; x.fillRect(0, 0, W, Hh);
      for (let i = 0; i < 22; i++) { const bx = r() * W, bw = 20 + r() * 60, bh = 60 + r() * 170; x.fillStyle = "#06070b"; x.fillRect(bx, Hh - bh, bw, bh); for (let yy = Hh - bh + 6; yy < Hh - 4; yy += 9) for (let xx = bx + 4; xx < bx + bw - 4; xx += 8) if (r() < 0.16) { x.fillStyle = r() < 0.7 ? "rgba(255,200,130,0.85)" : "rgba(150,200,255,0.8)"; x.fillRect(xx, yy, 3, 4); } }
      x.fillStyle = "#1b1d22"; for (let i = 0; i <= 4; i++) x.fillRect(i * W / 4 - 6, 0, 12, Hh); x.fillRect(0, 0, W, 14); x.fillRect(0, Hh * 0.55, W, 8); x.fillRect(0, Hh - 14, W, 14);
      x.fillStyle = "rgba(160,190,230,0.06)"; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(i * W / 4 + 20, 14); x.lineTo(i * W / 4 + 60, 14); x.lineTo(i * W / 4 + 10, Hh - 14); x.lineTo(i * W / 4 - 10, Hh - 14); x.fill(); }   // reflexo no vidro
      const t = wdTex(c); t.wrapT = THREE.ClampToEdgeWrapping; return t;
    }
    function lockerTex() {                                                  // porta do armário: chapa pintada com frestas de ventilação
      const W = 128, Hh = 256, [c, x] = wdCv(W, Hh), r = wdR(9); x.fillStyle = "#4f5f58"; x.fillRect(0, 0, W, Hh);
      for (let i = 0; i < 1500; i++) { const v = (r() - 0.5) * 24; x.fillStyle = wdRgba(79 + v, 95 + v, 88 + v, 0.4); x.fillRect(r() * W, r() * Hh, 2, 2); }
      for (const y0 of [20, 200]) for (let k = 0; k < 5; k++) { x.fillStyle = "#0c0e0e"; x.fillRect(30, y0 + k * 7, 68, 3); }
      x.fillStyle = "#8d9594"; x.fillRect(96, 118, 8, 26);
      for (let i = 0; i < 20; i++) wdBlot(x, W, Hh, r() * W, r() * Hh, 4 + r() * 12, [110, 60, 25], 0.35, false);
      return wdTex(c);
    }
    function signTex(txt, col, bg) {
      const [c, x] = wdCv(256, 96); x.fillStyle = bg; x.fillRect(0, 0, 256, 96); x.strokeStyle = col; x.lineWidth = 6; x.strokeRect(5, 5, 246, 86);
      x.fillStyle = col; x.font = "700 52px 'Barlow Condensed','Arial Narrow',sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(txt, 128, 52);
      const t = new THREE.CanvasTexture(c); return t;
    }
    function glowTex(rgb) { const [c, x] = wdCv(64, 64), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, wdRgba(rgb[0], rgb[1], rgb[2], 1)); g.addColorStop(0.35, wdRgba(rgb[0], rgb[1], rgb[2], 0.35)); g.addColorStop(1, wdRgba(rgb[0], rgb[1], rgb[2], 0)); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
    function mats() {
      if (MT) return MT;
      const glow = (rgb, op) => new THREE.SpriteMaterial({ map: glowTex(rgb), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: op || 0.8 });
      MT = {
        vinyl: lam({ map: tilesTex(256, 4, "#5b5d58", "#2e302d", 3, 0.2) }), carpet: lam({ map: carpetTex(5, [62, 70, 82]) }), carpetR: lam({ map: carpetTex(6, [86, 58, 54]) }),
        white: lam({ map: tilesTex(256, 8, "#a9aca8", "#6d706c", 4, 0.25) }), conc: lam({ map: wdConcreteTex(31, 104) }), roof: lam({ map: wdConcreteTex(32, 92) }),
        wall: [lam({ map: plasterTex(1, [150, 152, 138]) }), lam({ map: plasterTex(2, [128, 140, 136]) }), lam({ map: plasterTex(3, [152, 138, 118]) })],
        ceil: lam({ map: ceilTex(), side: THREE.DoubleSide }), win: bas({ map: windowTex(), color: 0x9aa4b8 }),
        wood: lam({ map: wdWoodTex(91, 0), color: 0xb08a62 }), woodD: lam({ map: wdWoodTex(92, 1), color: 0x6a4a32 }), frame: lam({ color: 0x2a2622 }), doorM: lam({ map: wdWoodTex(93, 1), color: 0x8a6a4a }),
        metal: lam({ color: 0x6d7378 }), metalD: lam({ color: 0x32363a }), chrome: lam({ color: 0x9aa0a6 }), black: lam({ color: 0x141518 }), fabric: lam({ color: 0x3c4352 }), fabricR: lam({ color: 0x5a3a40 }),
        sofa: lam({ color: 0x4a3a5a }), white2: lam({ color: 0xc9ccd0 }), fridge: lam({ color: 0xd8dade }), pot: lam({ color: 0x5a3a2a }), leaf: lam({ color: 0x2f5a2c }), leafD: lam({ color: 0x1f3d1e }),
        boxC: lam({ map: wdWoodTex(94, 1), color: 0xc49a62 }), paper: lam({ color: 0xd8d2c0 }), rack: lam({ color: 0x1a1f2a }), board: lam({ color: 0xe6e8ea }), glassT: lam({ color: 0x1c2a30, transparent: true, opacity: 0.55 }),
        locker: lam({ map: lockerTex() }), lockerB: lam({ color: 0x3f4c46 }), stall: lam({ color: 0x7d8f9a }), concD: lam({ map: wdConcreteTex(33, 70) }), rail: lam({ color: 0x8a8f94 }),
        screen: bas({ color: 0x5aa8ff }), screenOff: lam({ color: 0x0b0d10 }), vend: bas({ color: 0x8fd0ff }), vendR: bas({ color: 0xff5a4a }), led: bas({ color: 0x3dff8a }), ledR: bas({ color: 0xff3b30 }),
        lamp: bas({ color: 0xe8f0ff }), lampOff: lam({ color: 0x3a3c40 }), tv: bas({ color: 0x223040 }),
        exit: bas({ map: signTex("ESCADA ↑", "#3dff8a", "#06200f") }), elevS: bas({ map: signTex("ELEVADOR", "#ffd27a", "#201806") }), downS: bas({ map: signTex("↓ DESCE", "#ff6a5a", "#200806") }), inS: bas({ map: signTex("ENTRADA", "#9fd0ff", "#061420") }),
        solar: lam({ color: 0x1d3458 }), solarF: lam({ color: 0x9aa0a6 }), water: lam({ color: 0x3f6a80 }), sky: bas({ color: 0xa8d0e8, transparent: true, opacity: 0.5 }), plant: lam({ color: 0x3a6a34 }), soil: lam({ color: 0x3a2a1a }),
        steel: lam({ color: 0xa7adb3 }), hut: lam({ map: wdConcreteTex(34, 120) }), pad: lam({ color: 0xb8952e }), padW: lam({ color: 0x7c7a74 }),
        gl: { white: glow([220, 235, 255], 0.6), green: glow([60, 255, 140], 0.7), red: glow([255, 60, 40], 0.8), blue: glow([120, 190, 255], 0.6), amber: glow([255, 200, 110], 0.7), item: glow([255, 230, 150], 0.55) },
      };
      return MT;
    }
    // ---------- peças ----------
    const bx = (B, m, x, y, w, d, h, z0, cu) => B.add(m, wdBoxG(w, h, d, cu || 1), wdT(x, (z0 || 0) + h / 2, -y));
    const cyl = (B, m, x, y, r1, r2, h, z0, n) => B.add(m, new THREE.CylinderGeometry(r1, r2, h, n || 12), wdT(x, (z0 || 0) + h / 2, -y));
    function furniture(B, f, rr, deco) {
      const m = mats(), k = f.k, x = f.x, y = f.y, w = f.w, d = f.d, h = f.h;
      switch (k) {
        case "mesa": case "mesa_longa": case "mesinha":
          bx(B, k === "mesinha" ? m.woodD : m.wood, x, y, w, d, 0.05, h - 0.05);
          for (const sx of [-1, 1]) for (const sy of [-1, 1]) bx(B, m.metalD, x + sx * (w / 2 - 0.06), y + sy * (d / 2 - 0.06), 0.05, 0.05, h - 0.05, 0);
          if (k === "mesa" && rr() < 0.5) bx(B, m.paper, x + (rr() - 0.5) * w * 0.5, y + (rr() - 0.5) * d * 0.4, 0.3, 0.22, 0.02, h);
          break;
        case "mesa_redonda": cyl(B, m.wood, x, y, w / 2, w / 2, 0.05, h - 0.05, 18); cyl(B, m.metalD, x, y, 0.05, 0.05, h - 0.05, 0, 8); cyl(B, m.metalD, x, y, 0.3, 0.3, 0.03, 0, 12); break;
        case "cadeira": {
          bx(B, m.fabric, x, y, 0.48, 0.48, 0.08, 0.45); cyl(B, m.metalD, x, y, 0.03, 0.03, 0.45, 0, 6); cyl(B, m.black, x, y, 0.25, 0.25, 0.04, 0, 10);
          const dir = rr() < 0.5 ? 1 : -1; bx(B, m.fabric, x, y + dir * 0.22, 0.46, 0.06, 0.5, 0.53);
          break;
        }
        case "monitor": { const on = rr() < 0.3; bx(B, m.black, x, y, w, 0.05, 0.36, 0.86); bx(B, on ? m.screen : m.screenOff, x, y - 0.03, w * 0.9, 0.01, 0.3, 0.89); bx(B, m.black, x, y + 0.08, 0.06, 0.06, 0.12, 0.76); if (on) deco.push(["blue", x, y - 0.3, 1.05, 0.7]); break; }
        case "gaveteiro": case "arquivo": bx(B, k === "arquivo" ? m.metal : m.metalD, x, y, w, d, h, 0); for (let i = 1; i < 4; i++) bx(B, m.chrome, x, y, w * 0.3, d + 0.02, 0.03, (h * i) / 4); break;
        case "estante": {
          bx(B, m.metalD, x, y, w, d, 0.04, h - 0.04); for (let i = 0; i < 4; i++) bx(B, m.metal, x, y, w, d, 0.03, 0.15 + i * (h - 0.2) / 4);
          for (const sx of [-1, 1]) for (const sy of [-1, 1]) bx(B, m.metalD, x + sx * (w / 2 - 0.03), y + sy * (d / 2 - 0.03), 0.04, 0.04, h, 0);
          for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) if (rr() < 0.6) { const ww = 0.25 + rr() * 0.3; const along = w > d; bx(B, rr() < 0.5 ? m.boxC : m.paper, x + (along ? (j - 1) * w / 3 : 0), y + (along ? 0 : (j - 1) * d / 3), along ? ww : d * 0.8, along ? d * 0.8 : ww, 0.25, 0.18 + i * (h - 0.2) / 4); }
          break;
        }
        case "rack": bx(B, m.rack, x, y, w, d, h, 0); for (let i = 0; i < 10; i++) { const sx = w > d ? (rr() - 0.5) * w * 0.8 : (d > w ? 0 : 0), sy = w > d ? 0 : (rr() - 0.5) * d * 0.8; bx(B, rr() < 0.75 ? m.led : m.ledR, x + sx + (w > d ? 0 : (rr() < 0.5 ? -1 : 1) * (w / 2 + 0.005)), y + sy + (w > d ? (rr() < 0.5 ? -1 : 1) * (d / 2 + 0.005) : 0), 0.03, 0.03, 0.02, 0.3 + rr() * 1.6); } deco.push(["green", x, y, 1.0, 0.25]); break;
        case "caixas": bx(B, m.boxC, x, y, w, d, h * 0.55, 0); if (rr() < 0.6) bx(B, m.boxC, x + 0.05, y - 0.04, w * 0.75, d * 0.75, h * 0.45, h * 0.55); break;
        case "sofa": { bx(B, m.sofa, x, y, w, d, 0.42, 0); const along = w > d; bx(B, m.sofa, along ? x : x + (rr() < 0.5 ? -1 : 1) * (w / 2 - 0.1), along ? y + (rr() < 0.5 ? -1 : 1) * (d / 2 - 0.1) : y, along ? w : 0.2, along ? 0.2 : d, 0.45, 0.42); break; }
        case "tv": bx(B, m.black, x, y, w, d, 0.85, 0.55); bx(B, m.tv, x, y, w * 0.92, d + 0.01, 0.75, 0.6); break;
        case "balcao": bx(B, m.white2, x, y, w, d, h - 0.04, 0); bx(B, m.metalD, x, y, w, d, 0.04, h - 0.04); break;
        case "geladeira": bx(B, m.fridge, x, y, w, d, h, 0); bx(B, m.chrome, x + w * 0.35, y, 0.03, d + 0.03, 0.5, 1.0); break;
        case "box": bx(B, m.stall, x, y, w, d, h, 0.15, 2); break;
        case "pia": bx(B, m.white2, x, y, w, d, 0.15, 0.75); cyl(B, m.white2, x, y, 0.08, 0.1, 0.75, 0, 8); bx(B, m.chrome, x, y, 0.04, 0.04, 0.2, 0.9); break;
        case "planta": cyl(B, m.pot, x, y, 0.25, 0.2, 0.45, 0, 10); for (let i = 0; i < 5; i++) B.add(i % 2 ? m.leaf : m.leafD, new THREE.IcosahedronGeometry(0.22 + rr() * 0.1, 0), wdT(x + (rr() - 0.5) * 0.3, 0.6 + rr() * 0.6, -(y + (rr() - 0.5) * 0.3), rr() * 3, rr() * 3, 0)); break;
        case "banco": bx(B, m.wood, x, y, w, d, 0.06, 0.4); for (const s of [-1, 1]) { const along = w > d; bx(B, m.metalD, along ? x + s * (w / 2 - 0.15) : x, along ? y : y + s * (d / 2 - 0.15), along ? 0.05 : d, along ? d : 0.05, 0.4, 0); } break;
        case "maquina": bx(B, m.vendR, x, y, w, d, h, 0); { const along = w > d, s = rr() < 0.5 ? -1 : 1; bx(B, m.vend, along ? x : x + s * (w / 2 + 0.005), along ? y + s * (d / 2 + 0.005) : y, along ? w * 0.7 : 0.01, along ? 0.01 : d * 0.7, h * 0.65, h * 0.25); } deco.push(["blue", x, y, 1.5, 0.9]); break;
        case "lixeira": cyl(B, m.metalD, x, y, 0.22, 0.18, h, 0, 10); break;
        case "quadro": bx(B, m.board, x, y, w, Math.max(0.03, d * 0.3), 1.0, 0.9); break;
        case "ar": bx(B, m.steel, x, y, w, d, h, 0); cyl(B, m.metalD, x, y, w * 0.38, w * 0.38, 0.02, h, 16); break;
        case "caixa_dagua": cyl(B, m.water, x, y, w / 2, w / 2, h - 0.6, 0.6, 20); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) bx(B, m.metalD, x + a * w * 0.3, y + b * w * 0.3, 0.1, 0.1, 0.6, 0); break;
        case "claraboia": bx(B, m.metalD, x, y, w, d, 0.3, 0); B.add(m.sky, new THREE.CylinderGeometry(0.01, Math.min(w, d) * 0.7, 0.35, 4, 1), wdT(x, 0.47, -y, 0, Math.PI / 4, 0, w / Math.min(w, d), 1, d / Math.min(w, d))); break;
        case "antena": cyl(B, m.steel, x, y, 0.06, 0.12, h, 0, 8); for (let i = 1; i < 4; i++) bx(B, m.steel, x, y, 1.2 - i * 0.25, 0.04, 0.04, h * i / 4); deco.push(["red", x, y, h + 0.1, 0.9, "blink"]); break;
        case "jardineira": bx(B, m.hut, x, y, w, d, 0.55, 0); bx(B, m.soil, x, y, w - 0.1, d - 0.1, 0.02, 0.55); for (let i = 0; i < 3; i++) B.add(m.plant, new THREE.IcosahedronGeometry(0.28, 0), wdT(x + (w > d ? (i - 1) * w / 3 : 0), 0.75, -(y + (w > d ? 0 : (i - 1) * d / 3)), rr() * 3, rr() * 3, 0)); break;
        case "solar": { const g = new THREE.BoxGeometry(w, 0.06, d); B.add(m.solar, g, wdT(x, 0.7, -y, -0.35, 0, 0)); bx(B, m.solarF, x, y + d * 0.35, 0.06, 0.06, 0.5, 0); bx(B, m.solarF, x, y - d * 0.35, 0.06, 0.06, 0.9, 0); break; }
        default: bx(B, m.metalD, x, y, w, d, h, 0);
      }
    }
    // ---------- armário grande (dá para entrar) ----------
    function lockerView(g, l, f) {
      const m = mats(), grp = new THREE.Group(); grp.position.set(l.x, 0, -l.y); grp.rotation.y = [0, -Math.PI / 2, Math.PI, Math.PI / 2][l.face] + Math.PI; g.add(grp);
      // no grupo: frente para +z local (depois da rotação, aponta para FACE[l.face])
      const W = 1.4, D = 0.7, Hh = 2.1;
      const body = new THREE.Mesh(new THREE.BoxGeometry(W, Hh, D), m.lockerB); body.position.y = Hh / 2; grp.add(body);
      const doors = [];
      for (const s of [-1, 1]) {
        const piv = new THREE.Group(); piv.position.set(s * W / 2, 0, D / 2 + 0.01); grp.add(piv);
        const door = new THREE.Mesh(new THREE.BoxGeometry(W / 2 - 0.02, Hh - 0.08, 0.03), m.locker); door.position.set(-s * (W / 4), Hh / 2, 0.015); if (s > 0) door.scale.x = -1; piv.add(door);
        doors.push({ piv, s });
      }
      void f;
      return { grp, doors, open: 0, want: 0, shut: 0 };
    }
    // ---------- monta o andar ----------
    function build(Pl) {
      if (floorG) { root.remove(floorG); floorG.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
      P = Pl; floorG = new THREE.Group(); root.add(floorG); spots = []; lockers = []; items = []; flyers.forEach((f) => root.remove(f.m)); flyers = []; flareV.forEach((f) => root.remove(f.g)); flareV = []; heli = null; winCam = null;
      const m = mats(), B = new WdBatch(), rr = wdR(P.level * 1000 + P.floor * 17 + 5), deco = [], A = P.A;
      // chão por sala
      const floorMat = (g) => g.kind === "terrace" ? m.roof : g.kind === "hall" ? m.vinyl : g.type === "acesso" ? m.conc : ({ escritorio: m.carpet, reuniao: m.carpetR, estar: m.carpetR, copa: m.white, banheiro: m.white, deposito: m.conc, servidores: m.conc, arquivo: m.vinyl })[g.type] || m.vinyl;
      for (const g of P.regs) { if (P.roof && g.kind !== "terrace") continue; const w = g.x1 - g.x0, d = g.y1 - g.y0, cu = floorMat(g) === m.white ? 2 : floorMat(g) === m.vinyl ? 2 : 3; B.add(floorMat(g), wdPlaneG(w, d, w / cu, d / cu), wdT((g.x0 + g.x1) / 2, 0.001, -(g.y0 + g.y1) / 2, -Math.PI / 2, 0, 0)); }
      if (!P.roof) {
        B.add(m.ceil, wdPlaneG(2 * A, 2 * A, A / 1.2, A / 1.2), wdT(0, H, 0, Math.PI / 2, 0, 0));
        // janelas em toda a volta (a cidade lá fora)
        for (const [x, y, ry] of [[0, A - 0.02, 0], [0, -A + 0.02, Math.PI], [A - 0.02, 0, -Math.PI / 2], [-A + 0.02, 0, Math.PI / 2]]) B.add(m.win, wdPlaneG(2 * A, H, (2 * A) / 6, 1), wdT(x, H / 2, -y, 0, ry + Math.PI, 0));
      } else {
        // terraço: piso da casinha, mureta, heliponto
        const hut = P.regs.find((g) => g.type === "acesso");
        B.add(m.conc, wdPlaneG(hut.x1 - hut.x0, hut.y1 - hut.y0, 2, 2), wdT((hut.x0 + hut.x1) / 2, 0.003, -(hut.y0 + hut.y1) / 2, -Math.PI / 2, 0, 0));
        bx(B, m.hut, (hut.x0 + hut.x1) / 2, (hut.y0 + hut.y1) / 2, hut.x1 - hut.x0 + 0.3, hut.y1 - hut.y0 + 0.3, 0.25, 3.2, 3);
        for (const w of P.parapet) { const x0 = Math.min(w[0], w[2]), x1 = Math.max(w[0], w[2]), y0 = Math.min(w[1], w[3]), y1 = Math.max(w[1], w[3]); bx(B, m.hut, (x0 + x1) / 2, (y0 + y1) / 2, Math.max(0.35, x1 - x0 + 0.35), Math.max(0.35, y1 - y0 + 0.35), 1.1, 0, 3); }
        const e = P.exit;
        B.add(m.padW, new THREE.CircleGeometry(e.r + 0.4, 40), wdT(e.x, 0.006, -e.y, -Math.PI / 2, 0, 0));
        B.add(m.pad, new THREE.RingGeometry(e.r * 0.78, e.r * 0.86, 48), wdT(e.x, 0.01, -e.y, -Math.PI / 2, 0, 0));
        const Hs = [[-1.3, 0, 0.6, 3.6], [1.3, 0, 0.6, 3.6], [0, 0, 2.0, 0.6]];
        for (const q of Hs) B.add(m.padW, wdPlaneG(q[2], q[3], 1, 1), wdT(e.x + q[0], 0.012, -(e.y + q[1]), -Math.PI / 2, 0, 0));
        for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; cyl(B, m.vend, e.x + Math.cos(a) * (e.r + 0.15), e.y + Math.sin(a) * (e.r + 0.15), 0.08, 0.1, 0.06, 0, 8); if (i % 3 === 0) deco.push(["amber", e.x + Math.cos(a) * (e.r + 0.15), e.y + Math.sin(a) * (e.r + 0.15), 0.25, 0.45]); }
        spots.push({ x: e.x, y: e.y, h: 2.5, c: 0xffc070, i: 0.9, r: 14 });
        const dd = P.doors[0]; spots.push({ x: dd.x, y: dd.y, h: 2.6, c: 0xffb060, i: 1.4, r: 9 });
        // helicóptero de resgate
        if (typeof Helicopter !== "undefined") { heli = Helicopter.make({ lights: false }); heli.group.position.set(P.heli.x, 0, -P.heli.y); heli.group.rotation.y = -P.heli.yaw; heli.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); floorG.add(heli.group); }
        // cidade em volta (prédios baixos lá embaixo, com janelas acesas)
        const cr = wdR(900 + P.level);
        for (let i = 0; i < 46; i++) { const a = cr() * 6.283, dist = 62 + cr() * 46, hh = 8 + cr() * 34, ww = 8 + cr() * 14; B.add(cr() < 0.5 ? WD.bldgDark || m.metalD : WD.bldgDark2 || m.metalD, wdBoxG(ww, hh, ww, 6), wdT(Math.cos(a) * dist, -P.floor * 3.2 - 6 + hh, -Math.sin(a) * dist)); }
      }
      // paredes (e o pedaço acima das portas)
      const wallM = P.roof ? m.hut : m.wall[(P.floor + P.level) % 3], WH = P.roof ? 3.2 : H;
      for (const w of P.walls) {
        const x0 = Math.min(w[0], w[2]), x1 = Math.max(w[0], w[2]), y0 = Math.min(w[1], w[3]), y1 = Math.max(w[1], w[3]), vert = x0 === x1;
        B.add(wallM, wdBoxG(vert ? 0.2 : x1 - x0 + 0.2, WH, vert ? y1 - y0 + 0.2 : 0.2, 3, WH), wdT((x0 + x1) / 2, WH / 2, -(y0 + y1) / 2));
      }
      for (const d of P.doors) {
        const vert = d.axis === "x", hd = d.w / 2;
        B.add(wallM, wdBoxG(vert ? 0.2 : d.w, WH - 2.2, vert ? d.w : 0.2, 3, WH), wdT(d.x, 2.2 + (WH - 2.2) / 2, -d.y));          // verga
        for (const s of [-1, 1]) bx(B, m.frame, vert ? d.x : d.x + s * hd, vert ? d.y + s * hd : d.y, vert ? 0.24 : 0.06, vert ? 0.06 : 0.24, 2.2, 0);
        bx(B, m.frame, d.x, d.y, vert ? 0.24 : d.w, vert ? d.w : 0.24, 0.06, 2.17);
        // folha aberta, encostada na parede (para o lado da sala "b")
        const leaf = Math.min(1.2, d.w - 0.1), side = rr() < 0.5 ? -1 : 1;
        if (vert) bx(B, m.doorM, d.x + side * leaf / 2 * 0.98, d.y - hd + 0.05, leaf, 0.04, 2.12, 0.02); else bx(B, m.doorM, d.x - hd + 0.05, d.y + side * leaf / 2 * 0.98, 0.04, leaf, 2.12, 0.02);
      }
      // móveis
      for (const f of P.furn) if (!f.locker) furniture(B, f, rr, deco);
      // luzes do teto: algumas funcionando (piscando), a maioria apagada
      if (!P.roof) for (const g of P.regs) {
        if (g.area < 10) continue;
        const n = g.kind === "hall" ? Math.max(1, Math.floor(Math.max(g.x1 - g.x0, g.y1 - g.y0) / 8)) : g.area > 90 ? 2 : 1;
        for (let i = 0; i < n; i++) {
          const along = g.x1 - g.x0 > g.y1 - g.y0, u = (i + 0.5) / n, x = along ? g.x0 + (g.x1 - g.x0) * u : g.cx, y = along ? g.cy : g.y0 + (g.y1 - g.y0) * u;
          const on = rr() < (g.kind === "hall" ? 0.45 : 0.3);
          bx(B, on ? m.lamp : m.lampOff, x, y, along ? 1.2 : 0.3, along ? 0.3 : 1.2, 0.04, H - 0.05);
          if (on) spots.push({ x, y, h: H - 0.25, c: 0xcfdcff, i: 0.85, r: 8.5, flick: rr() < 0.4 ? rr() * 10 : -1 }), deco.push(["white", x, y, H - 0.12, 1.4]);
        }
        if (g.kind === "hall" && rr() < 0.6) spots.push({ x: g.cx, y: g.cy, h: 2.6, c: 0xff3a24, i: 0.5, r: 8, pulse: rr() * 6 }), deco.push(["red", g.cx, g.cy, 2.75, 0.5]);
      }
      // escada para cima: lance de degraus subindo até um vão no teto + placa verde
      const flight = (p, up) => {
        const g = P.regs.find((q) => p.x >= q.x0 && p.x <= q.x1 && p.y >= q.y0 && p.y <= q.y1) || P.regs[0];
        const sx = p.x - g.x0 < g.x1 - p.x ? -1 : 1;                           // o topo fica do lado da parede mais perto (em x)
        const n = 10, L = 3.0, W = 1.2;
        for (let i = 0; i < n; i++) {
          const u = (i + 0.5) / n, x = p.x - sx * L / 2 + sx * L * u, top = up ? (H * (i + 1)) / n : -(H * i) / n;
          if (up) bx(B, m.concD, x, p.y, L / n + 0.01, W, top, 0); else bx(B, m.black, x, p.y, L / n + 0.01, W, 0.02, 0.005 + 0.0005 * i);
        }
        for (const s of [-1, 1]) {
          if (up) { const len = Math.hypot(L, H), ang = Math.atan2(H, L) * sx; B.add(m.rail, new THREE.BoxGeometry(len, 0.05, 0.05), wdT(p.x, H / 2 + 0.95, -(p.y + s * (W / 2 + 0.05)), 0, 0, ang)); for (let i = 0; i <= 3; i++) bx(B, m.rail, p.x - sx * L / 2 + sx * (L * i) / 3, p.y + s * (W / 2 + 0.05), 0.04, 0.04, 0.95, (H * i) / 3); }
          else { bx(B, m.rail, p.x, p.y + s * (W / 2 + 0.05), L, 0.05, 0.05, 1.0); for (let i = 0; i <= 3; i++) bx(B, m.rail, p.x - sx * L / 2 + sx * (L * i) / 3, p.y + s * (W / 2 + 0.05), 0.04, 0.04, 1.0, 0); }
        }
        if (!up) bx(B, m.rail, p.x - sx * (L / 2 + 0.05), p.y, 0.05, W + 0.1, 0.05, 1.0);
        if (up) B.add(m.black, wdPlaneG(L, W, 1, 1), wdT(p.x, H - 0.01, -p.y, Math.PI / 2, 0, 0));
        const sign = up ? m.exit : m.downS;
        B.add(sign, new THREE.PlaneGeometry(0.9, 0.34), wdT(p.x - sx * (L / 2 + 0.1), 2.35, -p.y, 0, sx > 0 ? Math.PI / 2 : -Math.PI / 2, 0));
        B.add(sign, new THREE.PlaneGeometry(0.9, 0.34), wdT(p.x - sx * (L / 2 + 0.1), 2.35, -p.y, 0, sx > 0 ? -Math.PI / 2 : Math.PI / 2, 0));
        spots.push({ x: p.x - sx * (L / 2 + 0.3), y: p.y, h: 2.4, c: up ? 0x3dff8a : 0xff5a4a, i: up ? 1.3 : 0.7, r: up ? 9 : 6, key: up });
        deco.push([up ? "green" : "red", p.x - sx * (L / 2 + 0.12), p.y, 2.35, 1.1]);
      };
      if (P.up) flight(P.up, true);
      if (P.floor > 0 && !P.roof) flight(P.arrive, false);
      if (P.floor === 0) { const a = P.arrive; B.add(m.inS, new THREE.PlaneGeometry(1.4, 0.5), wdT(a.x, 2.5, -(a.y - 1.9), 0, 0, 0)); spots.push({ x: a.x, y: a.y, h: 2.4, c: 0x9fd0ff, i: 0.9, r: 8 }); }
      // elevador: portas de aço na parede mais perto, painel aceso
      if (P.elev) {
        const e = P.elev, g = P.regs.find((q) => e.x >= q.x0 && e.x <= q.x1 && e.y >= q.y0 && e.y <= q.y1) || P.regs[0];
        const dl = [[e.x - g.x0, -1, 0], [g.x1 - e.x, 1, 0], [e.y - g.y0, 0, -1], [g.y1 - e.y, 0, 1]].sort((a, b) => a[0] - b[0])[0];
        const wx = dl[1] ? (dl[1] < 0 ? g.x0 + 0.12 : g.x1 - 0.12) : e.x, wy = dl[2] ? (dl[2] < 0 ? g.y0 + 0.12 : g.y1 - 0.12) : e.y, ry = Math.atan2(-dl[1], dl[2]);   // virado para dentro da sala
        B.add(m.steel, new THREE.BoxGeometry(1.6, 2.2, 0.06), wdT(wx, 1.1, -wy, 0, ry, 0));
        B.add(m.metalD, new THREE.BoxGeometry(0.02, 2.2, 0.08), wdT(wx, 1.1, -wy, 0, ry, 0));
        B.add(m.elevS, new THREE.PlaneGeometry(1.2, 0.42), wdT(wx - (dl[1] || 0) * 0.05, 2.55, -(wy - (dl[2] || 0) * 0.05), 0, ry, 0));
        spots.push({ x: wx - (dl[1] || 0) * 1, y: wy - (dl[2] || 0) * 1, h: 2.5, c: 0xffd27a, i: 1.0, r: 7, key: true });
        deco.push(["amber", wx - (dl[1] || 0) * 0.12, wy - (dl[2] || 0) * 0.12, 1.25, 0.35]);
      }
      B.build(floorG, true, true);
      // brilhos (sprites) e pontos de luz das máquinas e telas
      for (const q of deco) {
        const sp = new THREE.Sprite(m.gl[q[0]]); sp.position.set(q[1], q[3], -q[2]); sp.scale.setScalar(q[4]); floorG.add(sp);
        if (q[5] === "blink") sp.userData.blink = true;
        if (q[0] === "blue" && q[4] > 1.2) spots.push({ x: q[1], y: q[2], h: 1.4, c: 0x7ab8ff, i: 0.6, r: 5 });
      }
      // armários
      for (const l of P.lockers) lockers.push(lockerView(floorG, l));
      // itens
      for (const it of (game.tw ? game.tw.items : [])) items.push(itemView(it));
      builtKey = P.level + ":" + P.floor;
    }
    function itemView(it) {
      const m = mats(), g = new THREE.Group(); g.position.set(it.x, 0.12, -it.y); floorG.add(g);
      const k = it.kind;
      const add = (geo, mm, x, y, z, rx) => { const o = new THREE.Mesh(geo, mm); o.position.set(x || 0, y || 0, z || 0); if (rx) o.rotation.x = rx; g.add(o); return o; };
      if (k === "bateria") { add(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 12), lam({ color: 0xffc81a, emissive: 0x332200 }), 0, 0, 0, Math.PI / 2); add(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 8), m.chrome, 0, 0, -0.11, Math.PI / 2); }
      else if (k === "bandagem") add(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 14), lam({ color: 0xf0ece0, emissive: 0x222018 }));
      else if (k === "kit") { add(new THREE.BoxGeometry(0.34, 0.16, 0.24), lam({ color: 0xd8302a, emissive: 0x200404 })); add(new THREE.BoxGeometry(0.12, 0.17, 0.04), lam({ color: 0xffffff, emissive: 0x333333 })); add(new THREE.BoxGeometry(0.04, 0.17, 0.12), lam({ color: 0xffffff, emissive: 0x333333 })); }
      else if (k === "garrafa") { add(new THREE.CylinderGeometry(0.05, 0.06, 0.24, 10), lam({ color: 0x2f6a3a, transparent: true, opacity: 0.85, emissive: 0x061208 }), 0, 0.04); add(new THREE.CylinderGeometry(0.02, 0.03, 0.08, 8), lam({ color: 0x2f6a3a }), 0, 0.2); }
      else add(new THREE.CylinderGeometry(0.035, 0.035, 0.3, 10), lam({ color: 0xd8302a, emissive: 0x300404 }), 0, 0, 0, Math.PI / 2);
      const sp = new THREE.Sprite(m.gl.item); sp.scale.setScalar(0.9); g.add(sp);
      return { it, g };
    }
    // ---------- luzes: as N fontes vão para os pontos mais perto do jogador ----------
    function ensureLights(n) { while (lights.length < n) { const l = new THREE.PointLight(0xffffff, 0, 10, 2); l.castShadow = false; root.add(l); lights.push(l); } return lights; }
    function assign(px, py) {
      const T = game.tw, dyn = (T ? T.flares : []).map((f) => ({ x: f.x, y: f.y, h: 0.4, c: 0xff4422, i: 2.6, r: 15, flare: true }));
      const all = dyn.concat(spots).map((s) => ({ s, k: Math.hypot(s.x - px, s.y - py) / (s.key || s.flare ? 2 : 1) - s.r * 0.3 })).sort((a, b) => a.k - b.k);
      lights.forEach((l, i) => { const q = all[i]; l.userData.s = q ? q.s : null; if (q) { l.position.set(q.s.x, q.s.h, -q.s.y); l.color.setHex(q.s.c); l.distance = q.s.r; } });
    }
    // ---------- por quadro ----------
    function frame(dt) {
      if (!root.visible || !game || !game.tw) return;
      const T = game.tw; tt += dt;
      if (!T.P) return;
      if (builtKey !== T.P.level + ":" + T.P.floor) build(T.P);
      assignT -= dt; if (assignT <= 0) { assignT = 0.3; assign(game.px, game.py); }
      for (const l of lights) {
        const s = l.userData.s; let want = 0;
        if (s) { want = s.i; if (s.flick >= 0 && s.flick !== undefined) want *= Math.sin(tt * 13 + s.flick) > 0.92 || Math.sin(tt * 2.3 + s.flick) > 0.97 ? 0.1 : 1; if (s.pulse !== undefined) want *= 0.55 + 0.45 * Math.sin(tt * 3 + s.pulse); if (s.flare) want *= 0.8 + Math.random() * 0.4; }
        l.intensity += (want - l.intensity) * Math.min(1, dt * 8);
      }
      floorG.children.forEach((o) => { if (o.userData.blink) o.visible = tt % 1.4 < 0.15; });
      for (const v of items) { v.g.visible = v.it.on; if (v.it.on) { v.g.rotation.y += dt * 1.5; v.g.position.y = 0.14 + Math.sin(tt * 2 + v.it.id) * 0.03; } }
      for (const L of lockers) { L.open += (L.want - L.open) * Math.min(1, dt * 7); if (L.shut > 0) { L.shut -= dt; if (L.shut <= 0) L.want = 0; } for (const d of L.doors) d.piv.rotation.y = d.s * L.open * 1.6; }
      // garrafas/sinalizadores voando e sinalizadores no chão
      const m = mats();
      for (const o of T.throws) { let f = flyers.find((q) => q.o === o); if (!f) { const mm = new THREE.Mesh(o.kind === "garrafa" ? new THREE.CylinderGeometry(0.05, 0.06, 0.26, 8) : new THREE.CylinderGeometry(0.035, 0.035, 0.3, 8), o.kind === "garrafa" ? lam({ color: 0x2f6a3a }) : m.vendR); root.add(mm); f = { o, m: mm }; flyers.push(f); } f.m.position.set(o.x, o.h, -o.y); f.m.rotation.x += dt * 12; }
      flyers = flyers.filter((f) => { if (T.throws.includes(f.o)) return true; root.remove(f.m); return false; });
      for (const fl of T.flares) { let v = flareV.find((q) => q.f === fl); if (!v) { const g = new THREE.Group(); g.position.set(fl.x, 0.05, -fl.y); const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.3, 8), m.vendR); stick.rotation.z = Math.PI / 2; g.add(stick); const sp = new THREE.Sprite(m.gl.red); sp.scale.setScalar(2.2); g.add(sp); root.add(g); v = { f: fl, g, sp }; flareV.push(v); } v.sp.scale.setScalar(1.8 + Math.random() * 0.8); }
      flareV = flareV.filter((v) => { if (T.flares.includes(v.f)) return true; root.remove(v.g); return false; });
      // helicóptero: rotor parado; na fuga ele gira, sobe e a câmera acompanha de fora
      if (heli) {
        if (T.won) {
          const k = T.winT || 0; heli.setSpin(Math.min(1.6, k * 0.5)); heli.update(dt);
          const up = Math.max(0, k - 2.6); heli.group.position.y = up * up * 0.9; heli.group.rotation.z = Math.sin(k * 1.3) * 0.03 * Math.min(1, up);
          const hx = P.heli.x, hy = P.heli.y, a = -P.heli.yaw + 0.9 + k * 0.08, r = 14 + k * 1.2;
          camera.position.set(hx + Math.sin(a) * r, 3 + k * 0.9, -hy + Math.cos(a) * r); camera.lookAt(hx, 1.8 + heli.group.position.y * 0.8, -hy);
        } else { heli.setSpin(0); heli.update(dt); }
      }
    }
    function lockerEv(i, open) { const L = lockers[i]; if (!L) return; L.want = 1; L.shut = open ? 0.6 : 0.45; }
    function setVisible(v) { root.visible = v; }
    return { build, frame, setVisible, ensureLights, lockerEv, get root() { return root; }, get lights() { return lights; } };
  })();

  // ======================================================================
  //  MODO PRÉDIO: HUD, sons, menu (escolha do nível) e tela de vitória
  // ======================================================================
  const TowerUI = (function () {
    const ENV_IN = { fog: 0x040508, dens: 0.085, hemi: [0x46506a, 0x0c0a08, 0.32], moon: [0x8fa4d8, 0.0], lamp: 1 };
    const ENV_TOP = { fog: 0x0b1222, dens: 0.016, hemi: [0x5a6aa0, 0x15110e, 0.55], moon: [0xa8b8e8, 0.55], lamp: 1 };
    const KN = { bateria: "BATERIA", bandagem: "BANDAGEM", kit: "KIT MÉDICO", garrafa: "GARRAFA", sinalizador: "SINALIZADOR" };
    let last = "", lockEl = null;
    const on = () => !!(game && game.gm === "predio" && game.tw);
    function env() { return game && game.tw && game.tw.P && game.tw.P.roof ? ENV_TOP : ENV_IN; }
    function start() {
      if (!on()) return;
      TowerView.setVisible(true); applyEnv(); last = "";
      torchEnabled = true;
    }
    // HUD: andar, bateria da lanterna, mochila, o que dá para fazer aqui
    function hud(g) {
      const T = g.tw, P = T.P, n = TOWER.LEVELS[T.level].floors;
      setText(el.wave, "wave", P.roof ? "TERRAÇO" : "ANDAR " + (T.floor + 1) + "/" + n);
      const box = $("twHud"); if (box.hidden) box.hidden = false;
      const bat = Math.round(T.bat), torchK = torchEnabled && T.bat > 0;
      const act = T.act ? (T.act.k === "hide" ? "ESCONDER NO ARMÁRIO" : T.act.k === "leave" ? "SAIR DO ARMÁRIO" : T.act.k === "stairs" ? "SUBIR A ESCADA" : "PEGAR O ELEVADOR") : "";
      const key = bat + "|" + JSON.stringify(T.bag) + "|" + T.throwK + "|" + act + "|" + torchK + "|" + KB.use;
      if (key !== last) {
        last = key;
        $("twBat").style.transform = "scaleX(" + (bat / 100).toFixed(3) + ")"; $("twBat").style.background = bat > 30 ? "#ffd23a" : bat > 10 ? "#ff9f43" : "#ff3b30";
        $("twBatN").textContent = bat + "%" + (T.bag.bateria ? " · +" + T.bag.bateria : "");
        $("twBag").innerHTML = ["bandagem", "kit", "garrafa", "sinalizador"].map((k) => '<span class="' + (T.bag[k] ? "" : "z") + (T.throwK === k ? " sel" : "") + '">' + KN[k] + " ×" + T.bag[k] + "</span>").join("");
        $("twKeys").textContent = keyName(KB.potHeal) + " CURA · " + keyName(KB.potFire) + " JOGA · " + keyName(KB.potCycle) + " TROCA";
        const pr = $("twAct"); pr.hidden = !act; if (act) pr.textContent = (touchOn() ? "" : "[" + keyName(KB.use) + "] ") + act;
        const ub = touchEl.querySelector('[data-act="use"]'); if (ub) ub.hidden = !act;
        const pf = touchEl.querySelector('[data-act="potfire"]'), ph = touchEl.querySelector('[data-act="potheal"]');
        if (pf) { pf.hidden = false; pf.firstChild.nodeValue = "JOGAR"; pf.querySelector("i").textContent = String(T.bag[T.throwK] || 0); }
        if (ph) { ph.hidden = false; ph.firstChild.nodeValue = "CURA"; ph.querySelector("i").textContent = String(T.bag.bandagem + T.bag.kit); }
      }
      $("hud").classList.toggle("twcine", !!T.won);
      if (!lockEl) lockEl = $("twLocker");
      lockEl.hidden = T.hide === null;
    }
    function off() { $("hud").classList.remove("twcine"); $("twHud").hidden = true; $("twLocker").hidden = true; const ub = touchEl.querySelector('[data-act="use"]'); if (ub) ub.hidden = true; const pf = touchEl.querySelector('[data-act="potfire"]'), ph = touchEl.querySelector('[data-act="potheal"]'); if (pf) { pf.firstChild.nodeValue = "FOGO"; pf.hidden = true; } if (ph) { ph.firstChild.nodeValue = "CURA"; ph.hidden = true; } hudLast.pots = "x"; last = ""; }
    // eventos do jogo -> sons e avisos
    function event(ev) {
      const g = game;
      switch (ev[0]) {
        case "tw_floor": last = ""; applyEnv(); TowerView.build(g.tw.P); Snd.play("step", 0.6, 0.7, 0, 0.3); break;
        case "tw_stairs": Snd.play("step", 0.9, 0.8, 0, 0.4); setTimeout(() => Snd.play("step", 0.8, 0.85, 0, 0.4), 160); break;
        case "tw_elev": Snd.play("buy", 0.6, 0.6, 0, 0.5); feedLine("ELEVADOR: SUBIU 1 ANDAR", false); break;
        case "tw_pick": Snd.play("pickup", 0.7, ev[1] === "bateria" ? 1.3 : 1, 0, 0.1); feedLine("+1 " + KN[ev[1]], false); break;
        case "tw_full": Snd.play("deny", 0.5); feedLine("MOCHILA CHEIA", false); break;
        case "tw_battery": Snd.play("switch", 0.7, 1.3, 0, 0.1); feedLine("BATERIA TROCADA", false); break;
        case "tw_heal": Snd.play("revive", 0.5, 1.4, 0, 0.1); feedLine(ev[1] === "kit" ? "KIT MÉDICO +60" : "BANDAGEM +25", false); break;
        case "tw_cycle": Snd.play("switch", 0.5, 1.1, 0, 0.05); feedLine("JOGAR: " + KN[ev[1]], false); break;
        case "tw_throw": Snd.play("melee", 0.5, 1.3, 0, 0.05); break;
        case "tw_glass": spatial("hit", ev[1], ev[2], 1, 1.8, 0.4, 40); spatial("casing", ev[1], ev[2], 1, 0.7, 0.4, 40); break;
        case "tw_flare": spatial("burn", ev[1], ev[2], 0.7, 1.2, 0.3, 30); break;
        case "tw_locker": TowerView.lockerEv(ev[1], ev[2]); Snd.play("bolt", 0.5, 0.6, 0, 0.2); break;
        case "tw_open": { TowerView.lockerEv(ev[1], 1); const l = g.tw.P.lockers[ev[1]]; if (l) spatial("bolt", l.x, l.y, 0.8, 0.55, 0.3, 25); break; }
        case "tw_caught": Snd.play("scream", 0.8, 1, 0, 0.2); feedLine("ACHARAM VOCÊ!", true); break;
        case "tw_spot": { const z = g.zombies.find((q) => q.id === ev[1]); if (z) spatial("groan", z.x, z.y, 0.9, 1.25, 0.3, 26); break; }
        case "tw_ambush": { const z = g.zombies.find((q) => q.id === ev[1]); if (z) spatial("roar", z.x, z.y, 1, 1.2, 0.2, 20); buzz(60); break; }
        case "tw_hear": break;
        case "tw_win": Snd.play("horn", 0.7, 1, 0, 0.4); try { document.exitPointerLock(); } catch (e) {} break;
        case "tw_end": break;
      }
    }
    // menu: modo de jogo e nível do prédio
    function renderMenu() {
      const lv = Math.min(S.twLevel | 0, S.twUnlocked | 0);
      $("optMode").innerHTML = optBtn("mode", "arena", "Arena", "Ondas de zumbis, chefes e recordes.", S.mode !== "predio") + optBtn("mode", "predio", "Prédio", "Suba andar por andar no escuro, só com a lanterna, até o helicóptero no terraço.", S.mode === "predio");
      const box = $("optTw"); box.parentNode.hidden = S.mode !== "predio";
      box.innerHTML = TOWER.LEVELS.map((L, i) => {
        const lock = i > (S.twUnlocked | 0), sub = lock ? "Bloqueado · vença o nível " + i : L.floors + " andares · " + TOWER.AI[L.ai].name;
        return lock ? '<button type="button" class="opt" disabled><b>' + L.name + "</b><span>" + sub + "</span></button>" : optBtn("twLevel", String(i), L.name, sub, lv === i);
      }).join("");
    }
    function won() { return on() && game.tw.won; }
    function finish(g) {                                                   // fim da partida: libera o próximo nível
      if (!g.tw) return;
      if (g.tw.won) { S.twUnlocked = Math.max(S.twUnlocked | 0, Math.min(4, g.tw.level + 1)); saveSettings(); }
    }
    return { start, hud, off, event, renderMenu, env, won, finish, on };
  })();
