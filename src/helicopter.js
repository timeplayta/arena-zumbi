  // ======================================================================
  //  HELICÓPTERO DE RESGATE (modelo próprio, feito em código: sem direitos de terceiros)
  //  Fuselagem por "loft" de seções superelípticas, cabine de vidro, motor, rotor de 4 pás,
  //  cauda com rotor traseiro, esquis, porta de correr, luzes e pintura gasta desenhada em canvas.
  //  Frente = -Z, cima = +Y; ~13 m de comprimento com o rotor.
  // ======================================================================
  const Helicopter = (function () {
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    // ---------- pintura: laranja resgate, faixa creme, letreiro, número, sujeira e ferrugem ----------
    function paintTex() {
      const W = 2048, H = 1024, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const c = cv.getContext("2d");
      let sd = 77; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
      // v (vertical da imagem) = volta da seção: 0 = barriga, 0,5 = topo; u (horizontal) = da ponta do nariz até o fim da cauda
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#2b2f33"); g.addColorStop(0.18, "#c8541f"); g.addColorStop(0.5, "#d9662a"); g.addColorStop(0.82, "#c8541f"); g.addColorStop(1, "#2b2f33");
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // faixa creme dos dois lados e filete escuro
      for (const v of [0.27, 0.73]) { c.fillStyle = "#e9dcc0"; c.fillRect(0, H * v - 34, W, 68); c.fillStyle = "#1d2226"; c.fillRect(0, H * v + 34, W, 10); }
      // linhas de painel e rebites
      c.strokeStyle = "rgba(40,20,10,0.55)"; c.lineWidth = 3;
      for (const u of [0.16, 0.3, 0.44, 0.56, 0.68, 0.8]) { c.beginPath(); c.moveTo(W * u, H * 0.08); c.lineTo(W * u, H * 0.92); c.stroke(); }
      for (const v of [0.12, 0.4, 0.6, 0.88]) { c.beginPath(); c.moveTo(0, H * v); c.lineTo(W, H * v); c.stroke(); }
      c.fillStyle = "rgba(30,15,8,0.6)";
      for (const u of [0.16, 0.3, 0.44, 0.56, 0.68, 0.8]) for (let v = 0.1; v < 0.9; v += 0.018) { c.beginPath(); c.arc(W * u + 9, H * v, 2.6, 0, 6.3); c.fill(); }
      // letreiro e número (nos dois lados; o lado esquerdo é espelhado na textura)
      c.font = "700 92px 'Barlow Condensed', 'Arial Narrow', sans-serif"; c.textBaseline = "middle";
      for (const [v, flip] of [[0.27, false], [0.73, true]]) {
        c.save(); c.translate(W * 0.52, H * v); c.scale(flip ? -1 : 1, flip ? 1 : -1);
        c.fillStyle = "#1d2226"; c.textAlign = "center"; c.fillText("RESGATE", 0, 4); c.restore();
        c.save(); c.translate(W * 0.71, H * (v < 0.5 ? 0.17 : 0.83)); c.scale(flip ? -1 : 1, flip ? 1 : -1);
        c.fillStyle = "#f3ead6"; c.font = "700 70px 'Barlow Condensed', 'Arial Narrow', sans-serif"; c.textAlign = "center"; c.fillText("AZ-07", 0, 0); c.restore();
      }
      // porta de correr: contorno, janela escura com reflexo (os dois lados)
      for (const [v0, v1, w0, w1] of [[0.12, 0.43, 0.31, 0.41], [0.57, 0.88, 0.59, 0.69]]) {
        const x0 = W * 0.42, x1 = W * 0.545;
        c.strokeStyle = "rgba(25,12,6,0.85)"; c.lineWidth = 5; c.strokeRect(x0, H * v0, x1 - x0, H * (v1 - v0));
        const wg = c.createLinearGradient(x0, H * w0, x1, H * w1); wg.addColorStop(0, "#1a2a33"); wg.addColorStop(0.45, "#3d5a66"); wg.addColorStop(0.5, "#7ea3ad"); wg.addColorStop(0.56, "#2c434d"); wg.addColorStop(1, "#141f26");
        c.fillStyle = wg; c.beginPath(); if (c.roundRect) c.roundRect(x0 + 26, H * w0, x1 - x0 - 52, H * (w1 - w0), 18); else c.rect(x0 + 26, H * w0, x1 - x0 - 52, H * (w1 - w0)); c.fill();
        c.strokeStyle = "#16191c"; c.lineWidth = 8; c.stroke();
      }
      // escorridos de sujeira, arranhões e ferrugem (é um helicóptero de fim do mundo)
      for (let i = 0; i < 260; i++) {
        const x = rnd() * W, y = rnd() * H, l = 20 + rnd() * 140;
        const gg = c.createLinearGradient(x, y, x, y + l); gg.addColorStop(0, "rgba(35,22,12,0.35)"); gg.addColorStop(1, "rgba(35,22,12,0)");
        c.fillStyle = gg; c.fillRect(x, y, 2 + rnd() * 5, l);
      }
      for (let i = 0; i < 70; i++) {
        const x = rnd() * W, y = rnd() * H, r = 6 + rnd() * 34;
        const rg = c.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, "rgba(96,48,20,0.55)"); rg.addColorStop(0.6, "rgba(120,62,28,0.25)"); rg.addColorStop(1, "rgba(120,62,28,0)");
        c.fillStyle = rg; c.beginPath(); c.arc(x, y, r, 0, 6.3); c.fill();
      }
      c.strokeStyle = "rgba(240,230,210,0.35)"; c.lineWidth = 1.2;
      for (let i = 0; i < 120; i++) { const x = rnd() * W, y = rnd() * H; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (rnd() - 0.5) * 60, y + (rnd() - 0.5) * 14); c.stroke(); }
      const t = new THREE.CanvasTexture(cv); t.anisotropy = 8; t.encoding = THREE.sRGBEncoding; return t;
    }
    function roughTex() {                                   // variação de brilho: sujeira fosca, partes polidas
      const cv = document.createElement("canvas"); cv.width = cv.height = 512; const c = cv.getContext("2d");
      c.fillStyle = "#9a9a9a"; c.fillRect(0, 0, 512, 512);
      let sd = 5; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 900; i++) { const v = Math.floor(120 + rnd() * 120); c.fillStyle = "rgba(" + v + "," + v + "," + v + ",0.18)"; c.beginPath(); c.arc(rnd() * 512, rnd() * 512, 2 + rnd() * 16, 0, 6.3); c.fill(); }
      const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
    }
    // ---------- loft: corpo liso a partir de seções (meia-largura, altura, centro) ao longo de Z ----------
    function loft(prof, seg, ring, n, part) {
      // prof(t) -> [z, halfW, halfH, cy]; seção superelíptica |x/a|^n + |y/b|^n = 1
      const pos = [], uv = [], idx = [];
      for (let i = 0; i <= seg; i++) {
        const t = i / seg, [z, a, b, cy] = prof(t);
        for (let j = 0; j <= ring; j++) {
          const th = (j / ring) * Math.PI * 2 - Math.PI / 2, ct = Math.cos(th), st = Math.sin(th);
          let x = Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n) * a, y = Math.sign(st) * Math.pow(Math.abs(st), 2 / n) * b + cy;
          if (part && !part(t, j / ring)) { x = NaN; }
          pos.push(x, y, z); uv.push(t, j / ring);
        }
      }
      for (let i = 0; i < seg; i++) for (let j = 0; j < ring; j++) {
        const a = i * (ring + 1) + j, b = a + ring + 1;
        if (part && (isNaN(pos[a * 3]) || isNaN(pos[b * 3]) || isNaN(pos[(a + 1) * 3]) || isNaN(pos[(b + 1) * 3]))) continue;
        idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
      for (let i = 0; i < pos.length; i++) if (isNaN(pos[i])) pos[i] = 0;
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx); g.computeVertexNormals(); return g;
    }
    const sm = (t) => t * t * (3 - 2 * t);
    // perfil da fuselagem (z: nariz em -4,1 até o começo da cauda em 3,1)
    function body(t) {
      const z = -4.1 + t * 7.2;
      const nose = sm(Math.min(1, t / 0.2)), back = 1 - sm(Math.max(0, (t - 0.62) / 0.38));
      const a = 0.08 + 1.02 * Math.pow(nose, 0.55) * (0.32 + 0.68 * back);
      const b = 0.1 + 1.0 * Math.pow(nose, 0.6) * (0.36 + 0.64 * back);
      const cy = 1.55 + 0.15 * (1 - nose) - 0.05 + 0.45 * (1 - back);
      return [z, a, b, cy];
    }
    function make(opts) {
      opts = opts || {};
      const root = new THREE.Group(); root.name = "helicoptero";
      const paint = new THREE.MeshStandardMaterial({ map: paintTex(), roughness: 0.55, metalness: 0.25, roughnessMap: roughTex() });
      const dark = new THREE.MeshStandardMaterial({ color: 0x23272b, roughness: 0.6, metalness: 0.5 });
      const steel = new THREE.MeshStandardMaterial({ color: 0x9aa2aa, roughness: 0.32, metalness: 0.85 });
      const black = new THREE.MeshStandardMaterial({ color: 0x111315, roughness: 0.75, metalness: 0.2 });
      const cream = new THREE.MeshStandardMaterial({ color: 0xe9dcc0, roughness: 0.6, metalness: 0.1 });
      const orange = new THREE.MeshStandardMaterial({ color: 0xb8461a, roughness: 0.5, metalness: 0.3, roughnessMap: roughTex() });
      const glass = new THREE.MeshPhysicalMaterial({ color: 0x34606c, roughness: 0.04, metalness: 0.2, transparent: true, opacity: 0.24, envMapIntensity: 2.2, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide, depthWrite: false });
      const seat = new THREE.MeshStandardMaterial({ color: 0x3a2a22, roughness: 0.9 });
      const glow = (c, i) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i || 2, roughness: 0.3 });
      const mats = [paint, dark, steel, black, cream, orange, glass, seat];
      const add = (geo, m, x, y, z, p) => { const o = new THREE.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; o.receiveShadow = true; (p || root).add(o); return o; };
      // ---------- fuselagem ----------
      // a área da cabine é recortada do casco e coberta pelo vidro (o recorte é um pouco menor que o vidro para não abrir fresta)
      const glassArea = (t, v, grow) => { const up = Math.sin(v * Math.PI * 2 - Math.PI / 2); return up > -0.12 - 0.5 * (1 - t) - grow && (t < 0.92 + grow || up > 0.25 - grow); };
      const fus = add(loft(body, 72, 48, 2.6, (t, v) => !(t < 0.36 * 0.97 && glassArea(t / 0.36, v, -0.04))), paint);
      add(loft((t) => { const [z, a, b, cy] = body(t * 0.4); return [z, a * 0.965, b * 0.965, cy]; }, 30, 32, 2.6), new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.85, side: THREE.BackSide }));
      void fus;
      { const [z, a, b, cy] = body(1), cap = add(new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), orange, 0, cy, z); cap.rotation.x = Math.PI / 2; cap.scale.set(a, 0.7, b); }
      // cabine de vidro: casca um pouco maior, só na parte de cima e da frente do nariz
      const gl = add(loft((t) => { const [z, a, b, cy] = body(t * 0.36); return [z, a * 1.012 + 0.006, b * 1.012 + 0.006, cy]; }, 40, 48, 2.6,
        (t, v) => glassArea(t, v, 0.03)), glass);
      gl.castShadow = false;
      // molduras da cabine
      const strut = (pts, r) => add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, r || 0.035, 6), dark);
      for (const s of [-1, 1]) {
        const p = []; for (let i = 0; i <= 10; i++) { const t = 0.05 + i * 0.03, [z, a, b, cy] = body(t); p.push(V3(s * a * 0.62, cy + b * 0.82, z)); } strut(p, 0.04);
        const q = []; for (let i = 0; i <= 8; i++) { const t = 0.33, [z, a, b, cy] = body(t), th = -0.15 + i * 0.22; q.push(V3(s * Math.cos(th) * a * 1.01, cy + Math.sin(th) * b * 1.01, z)); } strut(q, 0.045);
      }
      { const p = []; for (let i = 0; i <= 12; i++) { const t = 0.02 + i * 0.026, [z, a, b, cy] = body(t); p.push(V3(0, cy + b * 1.012, z)); } strut(p, 0.03); }
      // interior: painel com mostradores, bancos estofados, manches
      const rbox = (w, h, d, r) => { const sh = new THREE.Shape(), x = -w / 2 + r, y = -h / 2 + r, ww = w - 2 * r, hh = h - 2 * r;
        sh.moveTo(x, y - r); sh.lineTo(x + ww, y - r); sh.quadraticCurveTo(x + ww + r, y - r, x + ww + r, y); sh.lineTo(x + ww + r, y + hh); sh.quadraticCurveTo(x + ww + r, y + hh + r, x + ww, y + hh + r);
        sh.lineTo(x, y + hh + r); sh.quadraticCurveTo(x - r, y + hh + r, x - r, y + hh); sh.lineTo(x - r, y); sh.quadraticCurveTo(x - r, y - r, x, y - r);
        const g = new THREE.ExtrudeGeometry(sh, { depth: Math.max(0.001, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r * 0.9, bevelSegments: 3, curveSegments: 4 }); g.translate(0, 0, -(d - 2 * r) / 2); return g; };
      const panel = new THREE.Group(); panel.position.set(0, 1.28, -3.0); panel.rotation.x = -0.5; root.add(panel);
      add(rbox(1.35, 0.32, 0.36, 0.06), black, 0, 0, 0, panel);
      for (let i = 0; i < 6; i++) { const gx = -0.5 + i * 0.2; add(new THREE.CircleGeometry(0.055, 18), glow([0xffb066, 0x3ddc84, 0x8fd6ff][i % 3], 1.6), gx, 0.03, 0.19, panel); add(new THREE.TorusGeometry(0.06, 0.008, 6, 18), steel, gx, 0.03, 0.19, panel); }
      for (const s of [-0.42, 0.42]) {
        add(rbox(0.52, 0.14, 0.52, 0.05), seat, s, 1.0, -2.2); const back = add(rbox(0.5, 0.78, 0.13, 0.05), seat, s, 1.42, -1.92); back.rotation.x = 0.15;
        add(rbox(0.3, 0.16, 0.1, 0.04), seat, s, 1.9, -1.86);                                                            // encosto de cabeça
        add(new THREE.CylinderGeometry(0.022, 0.026, 0.62, 8), black, s, 1.15, -2.62).rotation.x = -0.35;                  // manche
        add(new THREE.SphereGeometry(0.04, 10, 8), black, s, 1.44, -2.72);
      }
      // porta de correr (dos dois lados) com janela, trilho e degrau
      for (const s of [-1, 1]) {
        const [z0, a0, , cy0] = body(0.48);
        const dg = new THREE.Group(); dg.position.set(s * (a0 + 0.012), cy0 - 0.05, z0); root.add(dg);
        add(new THREE.BoxGeometry(0.05, 0.08, 0.3), steel, s * 0.03, -0.08, 0.55, dg);
        add(new THREE.BoxGeometry(0.06, 0.05, 2.6), dark, s * 0.02, 0.72, 0.4, dg);
        add(new THREE.BoxGeometry(0.35, 0.05, 0.9), steel, s * 0.25, -0.95, 0, dg);
      }
      // ---------- motor no teto ----------
      const eng = add(loft((t) => { const z = -1.3 + t * 3.4, k = Math.sin(Math.PI * Math.min(1, t * 1.25 + 0.05)); return [z, 0.62 * (0.55 + 0.45 * k), 0.38 * (0.55 + 0.45 * k), 2.82]; }, 30, 32, 3.2), orange);
      for (const s of [-1, 1]) {
        add(new THREE.CylinderGeometry(0.17, 0.2, 0.55, 16), dark, s * 0.38, 2.92, 1.95).rotation.x = Math.PI / 2 + 0.25;          // escapamentos
        add(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16), glow(0x2a0d05, 0.6), s * 0.38, 2.86, 2.22).rotation.x = Math.PI / 2 + 0.25;
        for (let i = 0; i < 6; i++) add(new THREE.BoxGeometry(0.02, 0.22, 0.05), black, s * 0.6, 2.85, -0.9 + i * 0.09);               // grade de entrada de ar
      }
      void eng;
      // ---------- rotor principal ----------
      const rotor = new THREE.Group(); rotor.position.set(0, 3.32, 0.2); root.add(rotor);
      add(new THREE.CylinderGeometry(0.11, 0.14, 0.5, 16), steel, 0, 3.12, 0.2);                       // mastro
      add(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 24), dark, 0, 3.02, 0.2);                       // prato
      add(new THREE.CylinderGeometry(0.22, 0.3, 0.26, 20), steel, 0, 0, 0, rotor);
      add(new THREE.SphereGeometry(0.18, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), dark, 0, 0.13, 0, rotor);
      for (let i = 0; i < 4; i++) {
        const arm = new THREE.Group(); arm.rotation.y = (i * Math.PI) / 2; rotor.add(arm);
        add(new THREE.BoxGeometry(0.5, 0.09, 0.16), steel, 0.4, 0, 0, arm);
        const sh = new THREE.Shape(); sh.moveTo(0, -0.17); sh.lineTo(5.4, -0.15); sh.lineTo(5.55, -0.05); sh.lineTo(5.5, 0.16); sh.lineTo(0, 0.17); sh.closePath();
        const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, steps: 1 });
        bg.rotateX(Math.PI / 2); bg.translate(0.6, 0.03, 0);
        const bl = add(bg, black, 0, 0, 0, arm); bl.rotation.x = 0.06;                                                    // passo da pá
        add(new THREE.BoxGeometry(0.45, 0.05, 0.33), cream, 5.85, 0.04, 0, arm);                                           // ponta pintada
        arm.rotation.z = -0.03;
      }
      // disco de borrão do rotor (aparece quando as pás giram rápido)
      const blurC = document.createElement("canvas"); blurC.width = blurC.height = 256; { const g = blurC.getContext("2d"), rg = g.createRadialGradient(128, 128, 10, 128, 128, 128);
        rg.addColorStop(0, "rgba(20,20,22,0)"); rg.addColorStop(0.15, "rgba(20,20,22,0.25)"); rg.addColorStop(0.9, "rgba(20,20,22,0.18)"); rg.addColorStop(0.93, "rgba(230,220,200,0.35)"); rg.addColorStop(0.98, "rgba(230,220,200,0.1)"); rg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = rg; g.fillRect(0, 0, 256, 256); }
      const blur = new THREE.Mesh(new THREE.CircleGeometry(6.2, 48), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(blurC), transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0 }));
      blur.rotation.x = -Math.PI / 2; blur.position.set(0, 3.34, 0.2); root.add(blur);
      // ---------- cauda ----------
      const boom = add(new THREE.CylinderGeometry(0.16, 0.36, 5.6, 24), orange, 0, 2.22, 5.6); boom.rotation.x = Math.PI / 2 - 0.045;
      for (const [z, r, m] of [[4.1, 0.335, cream], [4.35, 0.33, cream], [7.6, 0.2, black], [7.85, 0.19, cream]]) { const band = add(new THREE.CylinderGeometry(r + 0.008, r + 0.01, 0.16, 24, 1, true), m, 0, 2.22 + (5.6 - z) * 0.045, z); band.rotation.x = Math.PI / 2 - 0.045; }
      const fin = new THREE.Shape(); fin.moveTo(0, 0); fin.lineTo(0.9, 0.05); fin.lineTo(1.25, 1.55); fin.lineTo(0.85, 1.6); fin.lineTo(0.2, 0.35); fin.closePath();
      const fg = new THREE.ExtrudeGeometry(fin, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 }); fg.rotateY(-Math.PI / 2); fg.translate(0.035, 0, 0);
      add(fg, orange, 0, 2.3, 7.9).rotation.y = Math.PI;
      const stab = new THREE.Shape(); stab.moveTo(-1.2, 0); stab.lineTo(1.2, 0); stab.lineTo(1.0, 0.45); stab.lineTo(-1.0, 0.45); stab.closePath();
      const sg = new THREE.ExtrudeGeometry(stab, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 1 }); sg.rotateX(Math.PI / 2);
      add(sg, orange, 0, 2.38, 7.05);
      for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.04, 0.4, 0.4), cream, s * 1.2, 2.4, 7.25);
      // rotor de cauda
      const tail = new THREE.Group(); tail.position.set(0.22, 3.2, 8.55); root.add(tail);
      add(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 12), steel, 0, 0, 0, tail).rotation.z = Math.PI / 2;
      for (let i = 0; i < 4; i++) { const b = add(new THREE.BoxGeometry(0.03, 0.85, 0.12), black, 0.08, 0, 0, tail); b.geometry.translate(0, 0.42, 0); b.rotation.x = (i * Math.PI) / 2; }
      // ---------- esquis ----------
      for (const s of [-1, 1]) {
        const pts = [V3(s * 1.15, 0.1, 2.0), V3(s * 1.15, 0.1, 0), V3(s * 1.15, 0.1, -2.2), V3(s * 1.15, 0.2, -2.75), V3(s * 1.15, 0.5, -3.0)];
        add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.07, 10), dark);
        for (const z of [-1.4, 1.1]) add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(s * 1.15, 0.12, z), V3(s * 1.05, 0.55, z), V3(s * 0.75, 0.95, z)]), 12, 0.065, 8), dark);
      }
      // ---------- detalhes ----------
      add(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6), steel, 0.35, 1.3, -4.25).rotation.x = Math.PI / 2;                 // tubo de pitot
      for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.01, 0.01, 0.9, 6), black, s * 0.3, 2.6, 2.6).rotation.z = s * 0.4;   // antenas
      const winch = add(new THREE.BoxGeometry(0.35, 0.35, 0.6), dark, 1.15, 2.45, -0.3); void winch;                     // guincho de resgate
      add(new THREE.CylinderGeometry(0.16, 0.16, 0.3, 14), steel, 1.3, 2.45, -0.55).rotation.z = Math.PI / 2;
      // luzes: farol de busca, sinalizador vermelho, luzes de navegação
      const lights = [];
      const search = add(new THREE.CylinderGeometry(0.14, 0.18, 0.22, 16), dark, 0, 0.75, -3.0); search.rotation.x = 0.6;
      add(new THREE.CircleGeometry(0.13, 16), glow(0xfff1d0, 3), 0, 0.68, -3.08).rotation.x = Math.PI / 2 + 0.6;
      const beaconT = add(new THREE.SphereGeometry(0.07, 10, 8), glow(0xff2a1a, 3), 0, 3.12, 1.6);
      const beaconB = add(new THREE.SphereGeometry(0.07, 10, 8), glow(0xff2a1a, 3), 0, 0.58, 0.4);
      add(new THREE.SphereGeometry(0.06, 10, 8), glow(0xff3b30, 2.5), -1.25, 2.4, 7.25);
      add(new THREE.SphereGeometry(0.06, 10, 8), glow(0x3ddc84, 2.5), 1.25, 2.4, 7.25);
      add(new THREE.SphereGeometry(0.05, 10, 8), glow(0xffffff, 3), 0, 3.55, 8.6);
      if (opts.lights !== false) {
        const sp = new THREE.SpotLight(0xfff0d8, 3.5, 30, 0.42, 0.55, 1.2); sp.position.set(0, 0.7, -3.1); sp.target.position.set(0, -1, -9); root.add(sp, sp.target); lights.push(sp);
        const red = new THREE.PointLight(0xff2a1a, 1.2, 9, 2); red.position.set(0, 3.3, 1.6); root.add(red); lights.push(red);
        const cab = new THREE.PointLight(0xffb066, 0.8, 4, 2); cab.position.set(0, 1.6, -2.4); root.add(cab); lights.push(cab);
      }
      let t = 0, spin = opts.spin || 0;
      return {
        group: root, rotor, tail, mats,
        setSpin(v) { spin = v; },
        update(dt) {
          t += dt; rotor.rotation.y += spin * dt * 30; tail.rotation.x += spin * dt * 90;
          const k = Math.max(0, Math.min(1, (spin - 0.35) / 0.5)); blur.material.opacity = k; rotor.children.forEach((ch) => { if (ch.type === "Group") ch.visible = k < 0.85; });
          const on = (t % 1.2) < 0.12; beaconT.material.emissiveIntensity = on ? 4 : 0.2; beaconB.material.emissiveIntensity = (t % 1.2) > 0.6 && (t % 1.2) < 0.72 ? 4 : 0.2;
          if (lights[1]) lights[1].intensity = on ? 1.6 : 0.05;
        },
      };
    }
    return { make };
  })();
