  // ======================================================================
  //  ESPECIAIS DOS NÍVEIS EXTREMOS
  //   · Colosso Blindado  (gigante militar com escudo; investida de 5 s)
  //   · Mestre da Katana  (velho ágil: saca, golpeia em combo, esquiva)
  //   · O Espectro        (invisível; espada gigante que racha o chão)
  //  Tudo aqui usa o mesmo esqueleto dos outros zumbis (ZombieView) ou um próprio (Espectro).
  // ======================================================================
  const ZE = (function () {
    const V3 = THREE.Vector3, Q4 = THREE.Quaternion, M4 = THREE.Matrix4, Eu = THREE.Euler;
    const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
    const mix = (a, b, t) => a + (b - a) * t;
    const sm = (t) => { t = cl(t, 0, 1); return t * t * (3 - 2 * t); };
    const PI = Math.PI, TAU = Math.PI * 2;
    const _a = new V3(), _p = new V3(), _u = new V3(), _f = new V3(), _zl = new V3(), _xl = new V3(), _yl = new V3(), _m = new M4();

    // ---------- braço com cinemática inversa: o ombro/cotovelo se ajustam para a mão chegar ao alvo ----------
    // sh, el: grupos do ombro e do cotovelo (el é filho de sh, a l1 abaixo); target e pole no espaço do pai do ombro
    function ik(sh, el, target, pole, l1, l2) {
      const p0 = sh.position;
      _a.copy(target).sub(p0);
      let d = _a.length();
      const maxD = (l1 + l2) * 0.999, minD = Math.abs(l1 - l2) + 0.02;
      d = cl(d, minD, maxD);
      _a.normalize();
      const cosA = cl((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), alpha = Math.acos(cosA), sinA = Math.sin(alpha);
      _p.copy(pole); _p.addScaledVector(_a, -_p.dot(_a));
      if (_p.lengthSq() < 1e-6) { _p.set(1, 0, 0); _p.addScaledVector(_a, -_p.dot(_a)); }
      _p.normalize();
      _u.copy(_a).multiplyScalar(cosA).addScaledVector(_p, sinA);                 // direção do braço (ombro -> cotovelo)
      _f.copy(_a).multiplyScalar(d).addScaledVector(_u, -l1).normalize();         // direção do antebraço
      const phi = Math.acos(cl(_u.dot(_f), -1, 1));
      _zl.copy(_p).multiplyScalar(cosA).addScaledVector(_a, -sinA).normalize();   // o antebraço dobra para -Z do braço
      _yl.copy(_u).negate();
      _xl.crossVectors(_yl, _zl);
      _m.makeBasis(_xl, _yl, _zl);
      sh.quaternion.setFromRotationMatrix(_m);
      el.rotation.set(phi, 0, 0);
    }

    // ---------- construtor de peças fundidas (uma malha por osso) ----------
    function hash3(x, y, z) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }
    function GB() {
      const P = [], N = [], C = [], I = []; let off = 0;
      const m4 = new M4(), nm = new THREE.Matrix3(), v = new V3(), col = new THREE.Color(), q = new Q4(), e = new Eu(), p = new V3(), s = new V3();
      return {
        add(geo, pos, rot, scl, color, wear) {
          e.set(rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0, "YXZ"); q.setFromEuler(e);
          p.set(pos ? pos[0] : 0, pos ? pos[1] : 0, pos ? pos[2] : 0); s.set(scl ? scl[0] : 1, scl ? scl[1] : 1, scl ? scl[2] : 1);
          m4.compose(p, q, s); nm.getNormalMatrix(m4);
          col.set(color);
          const pa = geo.attributes.position, na = geo.attributes.normal, n = pa.count, w = wear === undefined ? 0.25 : wear;
          for (let i = 0; i < n; i++) {
            v.fromBufferAttribute(pa, i).applyMatrix4(m4); P.push(v.x, v.y, v.z);
            v.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); N.push(v.x, v.y, v.z);
            const px = pa.getX(i) * s.x + p.x, py = pa.getY(i) * s.y + p.y, pz = pa.getZ(i) * s.z + p.z;
            const k = 1 - w * (0.55 * hash3(Math.round(px * 90), Math.round(py * 90), Math.round(pz * 90)) + 0.45 * hash3(Math.floor(px * 14), Math.floor(py * 14), Math.floor(pz * 14)));
            C.push(col.r * k, col.g * k, col.b * k);
          }
          if (geo.index) { const ia = geo.index.array; for (let i = 0; i < ia.length; i++) I.push(ia[i] + off); }
          else for (let i = 0; i < n; i++) I.push(off + i);
          off += n;
        },
        mesh(mat) {
          const g = new THREE.BufferGeometry();
          g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
          g.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3));
          g.setAttribute("color", new THREE.Float32BufferAttribute(C, 3));
          g.setIndex(I);
          const m = new THREE.Mesh(g, mat); m.userData.ownGeo = true; m.castShadow = true;
          return m;
        },
      };
    }
    // peças comuns (compartilhadas)
    const GEO = {
      box: new THREE.BoxGeometry(1, 1, 1), sph: new THREE.SphereGeometry(1, 14, 10), hsph: new THREE.SphereGeometry(1, 16, 9, 0, TAU, 0, PI / 2),
      cyl: new THREE.CylinderGeometry(1, 1, 1, 14), cone: new THREE.ConeGeometry(1, 1, 10), tor: new THREE.TorusGeometry(1, 0.2, 8, 20),
    };
    const shellCache = {};
    // painel curvo (pedaço de cilindro elíptico) de frente para -Z (face = -1) ou +Z (face = +1)
    function shell(rx, rz, h, arc, face, seg) {
      const key = [rx, rz, h, arc, face, seg].join("|");
      if (shellCache[key]) return shellCache[key];
      const g = new THREE.CylinderGeometry(1, 1, h, seg || 14, 1, true, face < 0 ? PI - arc / 2 : -arc / 2, arc);
      g.scale(rx, 1, rz);
      return (shellCache[key] = g);
    }
    const mkPhong = (o) => { const m = new THREE.MeshPhongMaterial(Object.assign({ vertexColors: true, specular: 0x555a60, shininess: 38, side: THREE.DoubleSide }, o || {})); m.userData.own = true; return m; };

    // ---------- texturas ----------
    let shieldTexC = null;
    function shieldTex() {
      if (shieldTexC) return shieldTexC;
      const W = 256, H = 320, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
      const c = cv.getContext("2d"), rnd = ZH.mulberry(4242);
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#4b525a"); g.addColorStop(1, "#2c3238");
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 1400; i++) { c.fillStyle = "rgba(" + (rnd() < 0.5 ? "255,255,255" : "0,0,0") + "," + (0.03 + rnd() * 0.06) + ")"; c.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 18, 1); }
      // faixas de aviso na borda
      c.save(); c.beginPath(); c.rect(0, 0, W, 16); c.rect(0, H - 16, W, 16); c.clip();
      for (let x = -40; x < W + 40; x += 24) { c.fillStyle = "#c9a21a"; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 12, 0); c.lineTo(x - 4, H); c.lineTo(x - 16, H); c.fill(); }
      c.restore();
      c.fillStyle = "#1a1d20"; c.fillRect(0, 16, 10, H - 32); c.fillRect(W - 10, 16, 10, H - 32);
      // visor (fenda de vidro)
      c.fillStyle = "#0b1115"; c.fillRect(W * 0.2, 34, W * 0.6, 26);
      const gl = c.createLinearGradient(0, 34, 0, 60); gl.addColorStop(0, "rgba(120,170,200,0.35)"); gl.addColorStop(1, "rgba(20,40,60,0.1)"); c.fillStyle = gl; c.fillRect(W * 0.2, 34, W * 0.6, 26);
      c.strokeStyle = "#101315"; c.lineWidth = 3; c.strokeRect(W * 0.2, 34, W * 0.6, 26);
      // estrela militar
      c.save(); c.translate(W / 2, 150); c.fillStyle = "rgba(225,225,215,0.82)"; c.beginPath();
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 22 : 52, a = -PI / 2 + (i * PI) / 5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      c.closePath(); c.fill(); c.lineWidth = 5; c.strokeStyle = "rgba(225,225,215,0.7)"; c.beginPath(); c.arc(0, 0, 64, 0, TAU); c.stroke(); c.restore();
      c.fillStyle = "rgba(225,225,215,0.75)"; c.font = "bold 22px Arial Narrow, Arial, sans-serif"; c.textAlign = "center"; c.fillText("BLINDADO 07", W / 2, 258);
      // amassados de bala, riscos e sangue
      for (let i = 0; i < 26; i++) {
        const x = 20 + rnd() * (W - 40), y = 70 + rnd() * (H - 100), r = 3 + rnd() * 6, gr = c.createRadialGradient(x - 1, y - 1, 0.5, x, y, r);
        gr.addColorStop(0, "rgba(10,10,10,0.9)"); gr.addColorStop(0.55, "rgba(60,64,70,0.7)"); gr.addColorStop(1, "rgba(150,156,164,0.5)");
        c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      }
      for (let i = 0; i < 40; i++) { c.strokeStyle = "rgba(200,205,210," + (0.1 + rnd() * 0.25) + ")"; c.lineWidth = 1; c.beginPath(); const x = rnd() * W, y = rnd() * H; c.moveTo(x, y); c.lineTo(x + (rnd() - 0.5) * 60, y + (rnd() - 0.5) * 40); c.stroke(); }
      for (let i = 0; i < 9; i++) { const x = rnd() * W, y = 60 + rnd() * 200, l = 20 + rnd() * 60; c.fillStyle = "rgba(80,8,8," + (0.35 + rnd() * 0.4) + ")"; c.fillRect(x, y, 3 + rnd() * 4, l); c.beginPath(); c.arc(x + 2, y + l, 3 + rnd() * 3, 0, TAU); c.fill(); }
      shieldTexC = new THREE.CanvasTexture(cv); shieldTexC.anisotropy = 4;
      return shieldTexC;
    }

    return { V3, Q4, M4, Eu, cl, mix, sm, PI, TAU, ik, GB, GEO, shell, mkPhong, shieldTex, hash3 };
  })();

  // ======================================================================
  //  base dos especiais que usam o corpo humano (Colosso e Mestre da Katana)
  // ======================================================================
  class EliteView extends ZombieView {
    constructor(z) {
      super(z);
      this.tlast = performance.now(); this.rn = zrng(z.id * 31 + 7);
      this.sp = {};                                   // valores suavizados da pose
      this.gm = [];                                   // materiais do equipamento
    }
    dtNow() { const n = performance.now(), dt = Math.min(0.05, Math.max(0.001, (n - this.tlast) / 1000)); this.tlast = n; return dt; }
    hotFlash(z) {
      const hot = z.hitT > 0;
      if (hot !== this.hotE) { this.hotE = hot; for (const m of this.gm) if (m.emissive) m.emissive.setHex(hot ? 0x551100 : (m.userData.base || 0)); }
    }
    // suaviza um valor da pose em direção ao alvo
    ease(key, target, dt, rate) {
      const o = this.sp; if (o[key] === undefined) o[key] = target;
      o[key] += (target - o[key]) * (1 - Math.exp(-(rate || 14) * dt));
      return o[key];
    }
    destroy() {
      super.destroy();
      for (const m of this.gm) m.dispose();
      if (this.detached) for (const o of this.detached) { scene.remove(o); o.traverse((q) => { if (q.isMesh && q.geometry && q.userData.ownGeo) q.geometry.dispose(); }); }
    }
  }

  // ======================================================================
  //  COLOSSO BLINDADO
  // ======================================================================
  const PI = Math.PI, TAU = Math.PI * 2, mix = (a, b, t) => a + (b - a) * t;
  class TankView extends EliteView {
    constructor(z) {
      super(z);
      this.buildGear();
    }
    buildGear() {
      const R = ZE, V = THREE.Vector3;
      const steel = R.mkPhong({ shininess: 46, specular: 0x6a7078 }), cloth = R.mkPhong({ specular: 0x0c0c0c, shininess: 4 });
      this.gm.push(steel, cloth);
      const STEEL = 0x474e55, STEEL2 = 0x3a4046, OLIVE = 0x4a5236, DARK = 0x1c2025, BLACK = 0x121416, BRASS = 0x8a6c2c, CLOTH = 0x3a4030, CLOTH2 = 0x2c3224;
      const mk = (fn) => { const a = new R.GB(), b = new R.GB(); fn(a, b); return [a, b]; };
      const put2 = (bone, built) => { const [a, b] = built; bone.add(a.mesh(steel)); bone.add(b.mesh(cloth)); };
      const E = R.GEO, S = R.shell;
      // ---- tronco ----
      put2(this.spine, mk((g, c) => {
        g.add(S(0.246, 0.226, 0.30, 2.7, -1, 22), [0, 0.265, -0.022], null, null, STEEL, 0.32);          // placa peitoral
        g.add(E.box, [0, 0.265, -0.252], null, [0.022, 0.27, 0.03], STEEL2, 0.2);                       // nervura central
        for (const sx of [-1, 1]) for (const yy of [0.15, 0.37]) g.add(E.sph, [sx * 0.17, yy, -0.2], null, [0.014, 0.014, 0.014], BRASS, 0.1);   // rebites
        g.add(S(0.247, 0.206, 0.30, 2.5, 1, 22), [0, 0.265, -0.02], null, null, STEEL, 0.32);           // placa das costas
        for (let i = 0; i < 4; i++) g.add(S(0.238 - i * 0.002, 0.217 - i * 0.002, 0.048, 4.3, -1, 22), [0, 0.088 - i * 0.043, -0.022], null, null, i % 2 ? STEEL2 : STEEL, 0.3);   // faixas do abdômen
        g.add(S(0.242, 0.222, 0.05, TAU, -1, 26), [0, -0.035, -0.022], null, null, BLACK, 0.2);         // cinto
        g.add(E.box, [0, -0.035, -0.255], null, [0.07, 0.05, 0.02], BRASS, 0.2);                         // fivela
        g.add(E.tor, [0, 0.452, -0.01], [PI / 2, 0, 0], [0.108, 0.108, 0.108], STEEL2, 0.2);           // gola
        g.add(S(0.12, 0.11, 0.11, 3.2, 1, 14), [0, 0.5, 0.004], null, null, STEEL2, 0.25);              // proteção da nuca
        for (const sx of [-1, 1]) c.add(E.box, [sx * 0.13, 0.46, -0.03], [0.2 * sx, 0, 0.08 * sx], [0.06, 0.02, 0.28], BLACK, 0.1);   // alças
        for (let i = -1; i <= 1; i++) c.add(E.box, [i * 0.082, 0.165, -0.268], null, [0.062, 0.09, 0.05], i ? OLIVE : CLOTH2, 0.3);       // porta-carregadores
        c.add(E.box, [-0.15, 0.0, -0.265], null, [0.09, 0.075, 0.05], CLOTH, 0.3); c.add(E.box, [0.15, 0.0, -0.265], null, [0.09, 0.075, 0.05], CLOTH, 0.3);
        c.add(E.box, [0, 0.215, 0.285], null, [0.3, 0.34, 0.15], CLOTH2, 0.35);                             // mochila
        c.add(E.cyl, [0, 0.43, 0.285], [0, 0, PI / 2], [0.055, 0.34, 0.055], BLACK, 0.3);                  // rolo
        c.add(E.cyl, [0.13, 0.78, 0.31], [-0.08, 0, 0.05], [0.004, 0.5, 0.004], BLACK, 0);                  // antena
        for (const [gx, gy] of [[-0.155, 0.37], [-0.2, 0.345]]) { g.add(E.cyl, [gx, gy, -0.255], null, [0.02, 0.07, 0.02], 0x394a2c, 0.2); g.add(E.cyl, [gx, gy + 0.04, -0.255], null, [0.014, 0.014, 0.014], BLACK, 0); }
      }));
      // ---- ombros e braços ----
      for (const [sh, el, wr, sx] of [[this.sL, this.eL, this.wL, -1], [this.sR, this.eR, this.wR, 1]]) {
        put2(sh, mk((g) => {
          g.add(E.hsph, [sx * 0.03, 0.045, 0], [0, 0, -sx * 0.18], [0.135, 0.095, 0.125], STEEL, 0.3);            // ombreira
          for (let i = 0; i < 3; i++) g.add(S(0.112 - i * 0.008, 0.108 - i * 0.008, 0.05, TAU, -1, 16), [sx * 0.012, -0.012 - i * 0.045, 0], null, null, i % 2 ? STEEL : STEEL2, 0.3);
        }));
        put2(el, mk((g, c) => {
          g.add(E.sph, [0, 0.0, 0.022], null, [0.06, 0.05, 0.06], STEEL2, 0.25);                                  // cotoveleira
          g.add(S(0.078, 0.078, 0.17, 5.6, -1, 16), [0, -0.125, 0], null, null, STEEL, 0.3);                      // protetor do antebraço
          c.add(S(0.082, 0.082, 0.025, TAU, -1, 14), [0, -0.205, 0], null, null, BLACK, 0.1);
        }));
        put2(wr, mk((g) => { g.add(S(0.07, 0.068, 0.05, TAU, -1, 14), [0, -0.02, 0], null, null, STEEL2, 0.25); }));
      }
      // ---- pernas ----
      for (const [hip, knee] of [[this.hL, this.kL], [this.hR, this.kR]]) {
        put2(hip, mk((g, c) => {
          g.add(S(0.118, 0.122, 0.27, 3.0, -1, 14), [0, -0.19, 0], null, null, STEEL, 0.3);
          c.add(S(0.12, 0.123, 0.04, TAU, -1, 14), [0, -0.06, 0], null, null, BLACK, 0.1);
        }));
        put2(knee, mk((g, c) => {
          g.add(E.sph, [0, 0.01, -0.06], null, [0.075, 0.065, 0.055], STEEL2, 0.25);
          g.add(S(0.075, 0.08, 0.27, 3.0, -1, 14), [0, -0.21, 0], null, null, STEEL, 0.3);
          g.add(E.box, [0, -0.425, -0.135], null, [0.105, 0.05, 0.12], STEEL2, 0.25);                               // bico de aço da bota
          c.add(S(0.082, 0.084, 0.04, TAU, -1, 14), [0, -0.38, 0], null, null, BLACK, 0.1);
        }));
      }
      // ---- capacete pesado ----
      const hz = ZH.HZ;
      put2(this.head, mk((g, c) => {
        g.add(new THREE.SphereGeometry(1, 20, 12, 0, TAU, 0, PI * 0.58), [0, hz + 0.03, -0.004], null, [0.127, 0.125, 0.143], 0x3d4430, 0.35);
        g.add(E.tor, [0, hz + 0.0, -0.004], [PI / 2, 0, 0], [0.13, 0.14, 0.13], STEEL2, 0.2);                    // aro
        g.add(E.box, [0, hz + 0.075, -0.13], [0.35, 0, 0], [0.11, 0.022, 0.05], STEEL, 0.25);                     // aba frontal
        g.add(E.box, [0, hz + 0.085, -0.115], [0.0, 0, 0], [0.04, 0.03, 0.04], BLACK, 0.1);                        // suporte de visão noturna
        g.add(S(0.14, 0.15, 0.1, 3.0, 1, 14), [0, hz - 0.02, 0.0], null, null, 0x3d4430, 0.35);                  // protetor da nuca
        for (const sx of [-1, 1]) g.add(E.cyl, [sx * 0.128, hz - 0.01, 0.0], [0, 0, PI / 2], [0.045, 0.03, 0.045], STEEL2, 0.2);   // proteção das orelhas
        for (let i = 0; i < 5; i++) c.add(E.box, [(i - 2) * 0.045, hz + 0.1 - Math.abs(i - 2) * 0.012, -0.03 + (i % 2) * 0.05], [0.2, 0, (i - 2) * 0.25], [0.015, 0.002, 0.14], 0x2f3a22, 0.3);   // trapos de camuflagem
      }));
      // ---- escudo ----
      const sg = (this.shield = new THREE.Group()); sg.rotation.order = "YXZ";
      {
        const R0 = 0.52, H = 0.82, ARC = 1.45;
        const panel = new THREE.CylinderGeometry(R0, R0, H, 24, 1, true, PI - ARC / 2, ARC); panel.translate(0, 0, R0);
        const pm = new THREE.MeshPhongMaterial({ map: R.shieldTex(), specular: 0x7a828a, shininess: 52, side: THREE.DoubleSide }); pm.userData.own = true; this.gm.push(pm);
        const front = new THREE.Mesh(panel, pm); front.castShadow = true; sg.add(front);
        const [a, b] = mk((g, c) => {
          g.add(new THREE.CylinderGeometry(R0 - 0.012, R0 - 0.012, H - 0.02, 24, 1, true, PI - ARC / 2 + 0.02, ARC - 0.04), [0, 0, R0], null, null, 0x23272b, 0.2);        // verso
          for (const sx of [-1, 1]) g.add(new THREE.CylinderGeometry(R0 + 0.006, R0 + 0.006, H + 0.02, 6, 1, true, PI + sx * ARC / 2 - (sx > 0 ? 0.05 : 0), 0.05), [0, 0, R0], null, null, 0x1b1e21, 0.1);   // laterais
          for (const sy of [-1, 1]) g.add(new THREE.CylinderGeometry(R0 + 0.006, R0 + 0.006, 0.026, 24, 1, true, PI - ARC / 2, ARC), [0, sy * (H / 2), R0], null, null, 0x1b1e21, 0.1);          // bordas
          c.add(E.box, [-0.12, 0.02, 0.12], null, [0.2, 0.034, 0.034], BLACK, 0.1);                                         // punho
          c.add(E.box, [-0.12, 0.02, 0.1], null, [0.05, 0.05, 0.05], BLACK, 0.1);
          c.add(E.box, [-0.12, 0.2, 0.1], null, [0.04, 0.04, 0.2], CLOTH2, 0.1);                                            // alça
        });
        sg.add(a.mesh(steel), b.mesh(cloth));
        this.spine.add(sg);
        this.handle = new V(-0.12, 0.02, 0.11);
      }
      this.spine.updateMatrixWorld(true);
    }
    // alvo do pé: posição do escudo e inclinação segundo a fase
    update(z) {
      const dt = this.dtNow(), R = ZE, sm = R.sm, mix = R.mix;
      this.hotFlash(z);
      if (z.state === "dead") {
        if (!this.fell) { this.fell = true; this.dropShield(); }
        super.update(z); this.fallShield(dt); return;
      }
      const hot = z.hitT > 0;
      if (hot !== this.hot) { this.hot = hot; for (const m of this.mats) if (m.emissive && !m.userData.glow) m.emissive.setHex(hot ? 0x661100 : (m.userData.base || 0)); }
      put(this.shadow, z.x, z.y, 0.02);
      const ph = z.phase, sw = Math.sin(ph), cw = Math.cos(ph), t = z.seqT;
      let lean = 0.1, crouch = 0, twist = -sw * 0.08, legAmp = 0.4, legSw = 1, jaw = 0.08 + 0.1 * Math.max(0, Math.sin(ph * 0.5)), headX = 0.15, rS = -sw * 0.32 + 0.1, rE = 0.55, rZ = 0.12, bob = Math.abs(sw) * 0.045;
      let sp = [-0.04, 0.12 + Math.sin(ph * 2) * 0.008, -0.36], sr = [-0.05, 0, 0], rate = 10, shake = 0;
      const seq = z.act === "seq";
      if (seq && t < 1.1) {                                         // 1) prepara a investida
        const u = sm(t / 0.45);
        crouch = 0.9 * u; lean = 0.15 + 0.3 * u; legSw = 0; twist = 0; headX = 0.4 * u; jaw = 0.55 * sm((t - 0.15) / 0.2) * (1 - sm((t - 0.85) / 0.25));
        sp = [-0.04, 0.0 + 0.04 * u, -0.28 - 0.04 * u]; sr = [-0.15 - 0.3 * u, 0, 0]; rS = -0.9 * u; rE = 0.9; rate = 12; shake = 0.012 * u;
      } else if (seq && t < 2.2) {                                  // 2) corre com o escudo à frente
        crouch = 0.4; lean = 0.5; legAmp = 0.95; twist = -sw * 0.05; headX = 0.3; jaw = 0.5; bob = Math.abs(sw) * 0.06;
        sp = [-0.04, 0.02, -0.5]; sr = [-0.48, 0, 0]; rS = -sw * 0.9 + 0.3; rE = 1.1; rate = 14;
      } else if (seq && t < 3.2) {                                  // 3) ergue e bate o escudo no chão
        const u = (t - 2.2) / 1.0;
        legSw = 0; twist = 0; legAmp = 0;
        if (u < 0.4) { const k = sm(u / 0.4); sp = [-0.04, mix(0.04, 0.82, k), mix(-0.5, -0.26, k)]; sr = [mix(-0.45, 0.35, k), 0, 0]; lean = mix(0.4, -0.15, k); crouch = mix(0.4, 0.1, k); jaw = 0.8 * k; headX = mix(0.3, -0.25, k); rS = mix(0.3, 2.4, k); rE = 0.5; rate = 16; }
        else if (u < 0.58) { const k = sm((u - 0.4) / 0.18); sp = [-0.04, mix(0.82, -0.24, k), mix(-0.26, -0.64, k)]; sr = [mix(0.35, -1.25, k), 0, 0]; lean = mix(-0.15, 0.65, k); crouch = mix(0.1, 0.65, k); jaw = 0.8; headX = mix(-0.25, 0.45, k); rS = mix(2.4, 0.2, k); rE = 0.4; rate = 38; }
        else { sp = [-0.04, -0.24, -0.64]; sr = [-1.25, 0, 0]; lean = 0.65; crouch = 0.65; jaw = 0.3; headX = 0.45; rS = 0.2; rE = 0.4; rate = 10; shake = 0.02 * Math.exp(-(u - 0.58) * 9); }
      } else if (seq) {                                             // 4) exausto: escudo baixo, respirando fundo
        const u = sm((t - 3.2) / 0.35), br = Math.sin(t * 8.5);
        legSw = 0; twist = 0.08 * br; legAmp = 0; crouch = 0.62 * u; lean = 0.62 * u + 0.03 * br; headX = 0.5 * u + 0.05 * br; jaw = 0.35 + 0.25 * br;
        sp = [-0.46, -0.16, -0.17]; sr = [0.05, 0.55, -0.32]; rS = 0.25 + 0.05 * br; rE = 0.2; rZ = 0.1; rate = 6; bob = 0;
      } else if (z.state === "attack") {                            // golpe de escudo
        const p = z.attackCd / 1.8, k = p < 0.3 ? sm((0.3 - p) / 0.3) : 0, pull = p < 0.62 && p >= 0.3 ? sm((0.62 - p) / 0.32) : 0;
        legSw = 0.2; legAmp = 0.2; lean = 0.1 + 0.3 * k - 0.08 * pull; bob = 0; twist = 0; jaw = 0.4 + 0.3 * k; headX = 0.2 + 0.2 * k;
        sp = [-0.04, 0.12, mix(-0.36, -0.7, k) + 0.14 * pull]; sr = [-0.05 - 0.12 * k, 0, 0]; rS = mix(0.2, 1.6, k) - 0.9 * pull; rE = 0.5; rate = k > 0 ? 30 : 14;
      }
      const e = (k, v, r) => this.ease(k, v, dt, r || rate);
      lean = e("lean", lean, 10); crouch = e("crouch", crouch, 9); twist = e("twist", twist, 12); headX = e("headX", headX, 9); jaw = e("jaw", jaw, 14);
      const px = e("px", sp[0]), py = e("py", sp[1]), pz = e("pz", sp[2]), rx = e("rx", sr[0]), ry = e("ry", sr[1]), rz = e("rz", sr[2]);
      const aS = e("rS", rS, 12), aE = e("rE", rE, 12), lS = e("lS", legSw, 8);
      const jx = shake ? (Math.random() - 0.5) * shake : 0, jy = shake ? (Math.random() - 0.5) * shake : 0;
      const root = this.root;
      put(root, z.x + jx, z.y + jy, bob - 0.3 * crouch * 0.6);
      root.rotation.set(-lean * 0.3, z.yaw, 0);
      this.spine.rotation.set(-lean * 0.7, twist, 0);
      // pernas
      const A = legAmp * (0.4 + 0.6 * lS);
      this.hL.rotation.x = sw * A * lS + 0.7 * crouch; this.hR.rotation.x = -sw * A * lS + 0.7 * crouch;
      this.kL.rotation.x = -(0.1 + Math.max(0, cw) * 0.75 * A * lS + 1.15 * crouch); this.kR.rotation.x = -(0.1 + Math.max(0, -cw) * 0.75 * A * lS + 1.15 * crouch);
      // escudo + braço esquerdo (cinemática inversa até a alça)
      const sg = this.shield; sg.position.set(px, py, pz); sg.rotation.set(rx, ry, rz); sg.updateMatrix();
      const hv = this._hv || (this._hv = new THREE.Vector3()), pole = this._pole || (this._pole = new THREE.Vector3(-0.4, -0.8, 0.5));
      hv.copy(this.handle).applyMatrix4(sg.matrix);
      R.ik(this.sL, this.eL, hv, pole, 0.29, 0.258);
      this.wL.rotation.set(0.1, 0, 0.1);
      // braço direito (livre)
      this.sR.rotation.set(aS, 0, rZ); this.eR.rotation.x = aE; this.wR.rotation.x = 0.25;
      this.head.rotation.set(headX, Math.sin(ph * 0.4) * 0.06, 0);
      this.setJaw(jaw);
    }
    dropShield() {
      const sg = this.shield; sg.updateWorldMatrix(true, false);
      const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
      sg.matrixWorld.decompose(p, q, s);
      this.spine.remove(sg); scene.add(sg);
      sg.position.copy(p); sg.quaternion.copy(q); sg.scale.copy(s);
      this.detached = [sg]; this.fallT = 0; this.sgFrom = p.clone(); this.sgQ0 = q.clone();
      // deita para a esquerda do corpo
      const yaw = new THREE.Euler(0, 0, 0, "YXZ").setFromQuaternion(q).y;
      this.sgTo = new THREE.Vector3(p.x + Math.cos(yaw) * -1.1, 0.18 * s.y, p.z - Math.sin(yaw) * -1.1);
      this.sgQ1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(-PI / 2 + 0.15, yaw + 0.4, 0, "YXZ"));
    }
    fallShield(dt) {
      if (!this.detached) return;
      this.fallT = Math.min(1, this.fallT + dt / 0.6);
      const k = this.fallT * this.fallT, sg = this.shield;
      sg.position.lerpVectors(this.sgFrom, this.sgTo, k); sg.position.y = Math.max(0.12, mix(this.sgFrom.y, this.sgTo.y, k) + Math.sin(this.fallT * PI) * 0.25);
      sg.quaternion.slerpQuaternions(this.sgQ0, this.sgQ1, k);
    }
  }

  // ======================================================================
  //  MESTRE DA KATANA
  // ======================================================================
  // base ortonormal de uma espada: Y = rumo da ponta, -Z = lado do fio
  function swordQuat(q, d, e) {
    const V = THREE.Vector3, y = new V(d[0], d[1], d[2]).normalize(), ev = new V(e[0], e[1], e[2]);
    const z = ev.addScaledVector(y, -ev.dot(y)).negate();
    if (z.lengthSq() < 1e-6) z.set(0, 0, 1).addScaledVector(y, -y.z);
    z.normalize();
    const x = new V().crossVectors(y, z);
    q.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    return q;
  }
  const bowZ = (u, k) => -k * 4 * u * (1 - u);                         // curvatura da lâmina (sori)
  function makeKatana() {
    const g = new THREE.Group(), mats = [], geos = [];
    const phong = (o) => { const m = new THREE.MeshPhongMaterial(o); m.userData.own = true; mats.push(m); return m; };
    // lâmina: prisma triangular com ponta afilada e brilho no fio
    {
      const N = 18, LEN = 0.8, P = [], C = [], I = [];
      const st = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N, y = u * LEN, w = (0.032 - 0.009 * u) * (u > 0.94 ? Math.max(0.05, 1 - (u - 0.94) / 0.06) : 1), t = 0.0075 * (1 - 0.45 * u) * (u > 0.94 ? Math.max(0.05, 1 - (u - 0.94) / 0.06) : 1), zc = bowZ(u, 0.022);
        st.push({ y, E: [0, y, zc - w / 2], R: [t, y, zc + w / 2], L: [-t, y, zc + w / 2], u });
      }
      const tri = (a, b, c, ca, cb, cc) => { const n = P.length / 3; P.push(...a, ...b, ...c); C.push(...ca, ...cb, ...cc); I.push(n, n + 1, n + 2); };
      const hm = (u, side) => { const wv = 0.5 + 0.5 * Math.sin(u * 60 + side * 2) * Math.sin(u * 23); return 0.62 + 0.18 * wv; };   // linha de têmpera
      for (let i = 0; i < N; i++) {
        const a = st[i], b = st[i + 1], eC = [0.92, 0.94, 0.97], fC = (u, s) => { const k = hm(u, s); return [k, k + 0.02, k + 0.05]; }, sC = [0.42, 0.44, 0.48];
        // face direita (E -> R), face esquerda (L -> E), dorso (R -> L)
        tri(a.E, a.R, b.R, eC, fC(a.u, 1), fC(b.u, 1)); tri(a.E, b.R, b.E, eC, fC(b.u, 1), eC);
        tri(a.L, a.E, b.E, fC(a.u, 2), eC, eC); tri(a.L, b.E, b.L, fC(a.u, 2), eC, fC(b.u, 2));
        tri(a.R, a.L, b.L, sC, sC, sC); tri(a.R, b.L, b.R, sC, sC, sC);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(C, 3)); geo.setIndex(I); geo.computeVertexNormals();
      geo.userData.ownGeo = true;
      const blade = new THREE.Mesh(geo, phong({ vertexColors: true, specular: 0xffffff, shininess: 160, side: THREE.DoubleSide })); blade.castShadow = true;
      g.add(blade); g.userData.blade = blade;
    }
    const iron = phong({ color: 0x1a1a1d, specular: 0x666666, shininess: 60 }), gold = phong({ color: 0xb08a2e, specular: 0xffe08a, shininess: 90 });
    const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.007, 20), iron); tsuba.scale.set(1, 1, 0.88); tsuba.position.y = -0.003; tsuba.userData.ownGeo = true;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.0035, 6, 20), gold); rim.rotation.x = Math.PI / 2; rim.scale.set(1, 0.88, 1); rim.position.y = -0.003; rim.userData.ownGeo = true;
    const hab = new THREE.Mesh(new THREE.BoxGeometry(0.019, 0.03, 0.036), gold); hab.position.y = 0.017; hab.userData.ownGeo = true;
    // cabo com trançado em losangos
    const cv = document.createElement("canvas"); cv.width = 64; cv.height = 128;
    { const c = cv.getContext("2d"); c.fillStyle = "#d9d4c4"; c.fillRect(0, 0, 64, 128); c.strokeStyle = "#16203a"; c.lineWidth = 7;
      for (let k = -2; k < 6; k++) { c.beginPath(); c.moveTo(0, k * 32); c.lineTo(32, k * 32 + 32); c.lineTo(64, k * 32); c.stroke(); c.beginPath(); c.moveTo(0, k * 32 + 32); c.lineTo(32, k * 32); c.lineTo(64, k * 32 + 32); c.stroke(); }
      c.fillStyle = "rgba(0,0,0,0.25)"; for (let i = 0; i < 200; i++) c.fillRect(Math.random() * 64, Math.random() * 128, 1, 2); }
    const tt = new THREE.CanvasTexture(cv); tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.repeat.set(1, 1.6);
    const tsukaM = phong({ map: tt, specular: 0x222222, shininess: 20 }); g.userData.tex = tt;
    const tsuka = new THREE.Mesh(new THREE.CylinderGeometry(0.0155, 0.0175, 0.27, 12), tsukaM); tsuka.scale.set(1, 1, 1.22); tsuka.position.y = -0.14; tsuka.userData.ownGeo = true;
    const fuchi = new THREE.Mesh(new THREE.CylinderGeometry(0.0195, 0.0195, 0.018, 12), gold); fuchi.scale.set(1, 1, 1.22); fuchi.position.y = -0.013; fuchi.userData.ownGeo = true;
    const kash = new THREE.Mesh(new THREE.SphereGeometry(0.0185, 10, 8), gold); kash.scale.set(1, 0.55, 1.2); kash.position.y = -0.277; kash.userData.ownGeo = true;
    g.add(tsuba, rim, hab, tsuka, fuchi, kash);
    g.userData.mats = mats; g.userData.tex = tt;
    return g;
  }
  function makeSaya() {
    const N = 20, LEN = 0.83, ring = 10, P = [], I = [], C = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, y = 0.03 + u * LEN, zc = bowZ(Math.min(1, (y - 0.0) / 0.8), 0.022), rr = u > 0.93 ? Math.sqrt(Math.max(0, 1 - (u - 0.93) / 0.07)) * 0.9 + 0.1 : 1;
      for (let j = 0; j < ring; j++) { const a = (j / ring) * Math.PI * 2; P.push(Math.cos(a) * 0.0125 * rr * (1 - 0.15 * u), y, zc + Math.sin(a) * 0.0225 * rr * (1 - 0.15 * u)); const k = 0.05 + 0.04 * Math.max(0, Math.sin(a)); C.push(k, k * 0.95, k * 1.1); }
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < ring; j++) { const a = i * ring + j, b = i * ring + (j + 1) % ring, c = a + ring, d = b + ring; I.push(a, c, b, b, c, d); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(C, 3)); geo.setIndex(I); geo.computeVertexNormals(); geo.userData.ownGeo = true;
    const g = new THREE.Group(), mats = [];
    const lac = new THREE.MeshPhongMaterial({ vertexColors: true, specular: 0x8a8a9a, shininess: 90 }); lac.userData.own = true; mats.push(lac);
    const gold = new THREE.MeshPhongMaterial({ color: 0xb08a2e, specular: 0xffe08a, shininess: 90 }); gold.userData.own = true; mats.push(gold);
    const red = new THREE.MeshLambertMaterial({ color: 0x7a1010 }); red.userData.own = true; mats.push(red);
    const body = new THREE.Mesh(geo, lac); body.castShadow = true; g.add(body);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.0145, 0.0145, 0.04, 10), gold); col.scale.set(0.92, 1, 1.75); col.position.set(0, 0.055, 0); col.userData.ownGeo = true;
    const kur = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.034, 0.012), gold); kur.position.set(0, 0.17, -0.027); kur.userData.ownGeo = true;
    const cord = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.004, 5, 14, Math.PI * 1.3), red); cord.position.set(0, 0.11, -0.04); cord.rotation.set(0, Math.PI / 2, -0.4); cord.userData.ownGeo = true;
    g.add(col, kur, cord);
    g.userData.mats = mats;
    return g;
  }

  // poses (espaço do tronco, frente = -Z): p = posição da guarda, d = rumo da ponta, e = lado do fio
  const SP = {
    sheath: { p: [-0.06, -0.03, -0.19], d: [-0.2, -0.22, 0.95], e: [0, 1, 0], lean: 0.2, twist: 0, crouch: 0.15, head: 0.2, lunge: 0 },
    ready: { p: [0.0, 0.1, -0.36], d: [0, 0.43, -0.9], e: [0, -1, 0], lean: 0.14, twist: 0, crouch: 0.4, head: 0.1, lunge: 0.35 },
    slashW: { p: [0.3, 0.2, -0.1], d: [0.98, 0.15, -0.02], e: [0, 0, -1], lean: 0.08, twist: -0.65, crouch: 0.5, head: 0.0, lunge: 0.2 },
    slashS: { p: [-0.12, 0.16, -0.42], d: [-0.93, -0.1, -0.35], e: [0, 0, -1], lean: 0.32, twist: 0.7, crouch: 0.58, head: 0.1, lunge: 1 },
    overW: { p: [0.04, 0.64, -0.1], d: [0, 0.96, 0.28], e: [0, 0, -1], lean: -0.2, twist: 0, crouch: 0.2, head: -0.2, lunge: 0.1 },
    overS: { p: [0.02, 0.04, -0.46], d: [0, -0.35, -0.94], e: [0, -0.9, 0.3], lean: 0.55, twist: 0, crouch: 0.62, head: 0.35, lunge: 1 },
    thrustW: { p: [0.14, 0.03, -0.05], d: [0, 0.05, -1], e: [0, 1, 0], lean: 0.1, twist: -0.45, crouch: 0.58, head: 0.05, lunge: 0.15 },
    thrustS: { p: [0.06, 0.14, -0.5], d: [0, 0.1, -1], e: [0, 1, 0], lean: 0.42, twist: 0.12, crouch: 0.62, head: 0.25, lunge: 1 },
    flick0: { p: [0.26, 0.05, -0.22], d: [0.45, 0.5, -0.74], e: [0, 0, -1], lean: 0.2, twist: -0.2, crouch: 0.3, head: 0.15, lunge: 0.3, one: 1 },
    flick1: { p: [0.3, -0.1, -0.18], d: [0.5, -0.82, -0.28], e: [0, 0, -1], lean: 0.3, twist: -0.3, crouch: 0.35, head: 0.25, lunge: 0.3, one: 1 },
  };
  const spMix = (a, b, k) => {
    const o = {}, L = (x, y) => x + (y - x) * k, V = (u, v) => [L(u[0], v[0]), L(u[1], v[1]), L(u[2], v[2])];
    o.p = V(a.p, b.p); o.d = V(a.d, b.d); o.e = V(a.e, b.e);
    for (const key of ["lean", "twist", "crouch", "head", "lunge"]) o[key] = L(a[key], b[key]);
    o.one = L(a.one || 0, b.one || 0);
    return o;
  };

  class SamuraiView extends EliteView {
    constructor(z) {
      super(z);
      this.buildGear();
    }
    buildGear() {
      const R = ZE, V = THREE.Vector3;
      this.katana = makeKatana(); this.saya = makeSaya();
      for (const m of this.katana.userData.mats.concat(this.saya.userData.mats)) this.gm.push(m);
      this.spine.add(this.saya, this.katana);
      this.dotex = this.katana.userData.tex;
      // hakama (calça larga) e mangas largas do quimono
      const rgb = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
      const clothMat = new THREE.MeshLambertMaterial({ map: ZA.tex("cloth"), vertexColors: true, side: THREE.DoubleSide }); clothMat.userData.own = true; this.gm.push(clothMat);
      const add = (bone, geo, col, seed, o) => { const m = new THREE.Mesh(ZA.paint(geo, rgb(col), Object.assign({ mode: "cloth", seed, dirt: 0.55 }, o || {})), clothMat); m.userData.ownGeo = true; m.castShadow = true; bone.add(m); return m; };
      const HK = 0x15171f, KM = 0x2a3350;
      for (const [hip, knee, sh, el, k] of [[this.hL, this.kL, this.sL, this.eL, 0], [this.hR, this.kR, this.sR, this.eR, 1]]) {
        add(hip, ZA.part("thigh", { cloth: true, infl: 1.62, hem: 0.0 }), HK, 60 + k, { hemY: -0.45 });
        add(knee, ZA.part("shin", { cloth: true, infl: 1.5, openBot: true, hem: 0.03 }), HK, 62 + k, { hemY: -0.4 });
        add(sh, ZA.part("upper", { cloth: true, infl: 1.7, y1: -0.3, hem: 0.03 }), KM, 64 + k, { hemY: -0.3 });
        add(el, ZA.part("fore", { cloth: true, infl: 1.8, openBot: true, hem: 0.035, y0: 0.0, y1: -0.2 }), KM, 66 + k, { hemY: -0.2 });
      }
      // faixa (obi), nó, gola branca e coque
      const gb = new R.GB(), gc = new R.GB(), ph = (o) => R.mkPhong(o);
      const obiM = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }); obiM.userData.own = true; this.gm.push(obiM);
      gb.add(R.shell(0.19, 0.127, 0.11, R.TAU, -1, 26), [0, 0.03, -0.006], null, null, 0x6a1a1a, 0.3);
      gb.add(R.GEO.box, [0, 0.03, 0.12], null, [0.1, 0.09, 0.04], 0x5a1414, 0.3);
      for (const sx of [-1, 1]) gc.add(R.GEO.box, [sx * 0.032, 0.37, -0.1], [0, 0, -sx * 0.5], [0.022, 0.15, 0.014], 0xd8d2c0, 0.25);
      this.spine.add(gb.mesh(obiM), gc.mesh(obiM));
      const hm = new THREE.MeshLambertMaterial({ color: 0xd2d0c8 }); hm.userData.own = true; this.gm.push(hm);
      const knot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), hm); knot.position.set(0, ZH.HZ + 0.15, 0.035); knot.scale.set(1, 0.9, 1.2); this.head.add(knot);
      const tie = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.012, 10), obiM.clone()); tie.material.color.setHex(0x701818); tie.position.set(0, ZH.HZ + 0.12, 0.035); this.head.add(tie); this.gm.push(tie.material);
      // brilho do fio e rastro do golpe
      const gtex = puffTex;
      this.glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: gtex, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 })); this.glint.visible = false; this.spine.add(this.glint); this.gm.push(this.glint.material);
      const tm = () => { const m = new THREE.MeshBasicMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); m.userData.own = true; this.gm.push(m); return m; };
      this.tr = {};
      this.tr.slash = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.95, 28, 1, 0.12, Math.PI - 0.24), tm()); this.tr.slash.rotation.x = -Math.PI / 2; this.tr.slash.position.set(0, 0.17, 0.0);
      this.tr.over = new THREE.Mesh(new THREE.RingGeometry(0.38, 0.9, 28, 1, -0.35, 2.3), tm()); this.tr.over.rotation.y = Math.PI / 2; this.tr.over.position.set(0, 0.12, 0.05);
      this.tr.thrust = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 1.3), tm()); this.tr.thrust.rotation.x = -Math.PI / 2; this.tr.thrust.position.set(0.06, 0.14, -0.95);
      for (const k in this.tr) { this.tr[k].visible = false; this.tr[k].geometry.userData.ownGeo = true; this.spine.add(this.tr[k]); }
      this.trT = 0; this.trK = "slash"; this.lastAct = ""; this.pose = null;
      this._p = new V(); this._q = new THREE.Quaternion();
    }
    update(z) {
      const dt = this.dtNow(), R = ZE, sm = R.sm;
      this.hotFlash(z);
      if (z.state === "dead") {
        if (!this.fell) { this.fell = true; this.katana.visible = true; this.wR.add(this.katana); this.katana.position.set(0.0, -0.08, 0.0); this.katana.rotation.set(-1.45, 0, 0.1); this.glint.visible = false; for (const k in this.tr) this.tr[k].visible = false; }
        super.update(z);
        const f = z.fall, kk = Math.sin(Math.min(1, f * 1.4) * Math.PI * 0.5) * (1 - f * 0.25);
        this.hL.rotation.x = 1.15 * kk; this.hR.rotation.x = 1.0 * kk; this.kL.rotation.x = -2.0 * kk; this.kR.rotation.x = -1.9 * kk;
        return;
      }
      const hot = z.hitT > 0;
      if (hot !== this.hot) { this.hot = hot; for (const m of this.mats) if (m.emissive && !m.userData.glow) m.emissive.setHex(hot ? 0x661100 : (m.userData.base || 0)); }
      put(this.shadow, z.x, z.y, 0.02);
      const A = L.SAM[z.atk] || L.SAM.slash, t = z.actT, act = z.act, ph = z.phase, sw = Math.sin(ph), cw = Math.cos(ph);
      let tg = SP.ready, leg = 0.2, jaw = 0.06, rate = 14, sayaZ = 0, saya = 0, bob = 0, tilt = 0, sheathed = false, leftOnSaya = false, rootDrop = 0, hop = 0;
      const wN = (A.wind * (z.combo ? 0.7 : 1));
      const atkW = SP[z.atk + "W"] || SP.slashW, atkS = SP[z.atk + "S"] || SP.slashS;
      switch (act) {
        case "approach":
          tg = SP.sheath; sheathed = true; leftOnSaya = true; leg = 0.55; bob = Math.abs(sw) * 0.02; rate = 8; break;
        case "draw": {
          const u = cl01(t / 0.75);
          sheathed = u < 0.02; leftOnSaya = u < 0.5; leg = 0.15 * (1 - u); rate = 22;
          if (u < 0.45) {                                    // 1) desliza a lâmina para fora, a mão esquerda puxa a bainha
            const k = sm(u / 0.45), s0 = SP.sheath, d0 = s0.d, L0 = Math.hypot(d0[0], d0[1], d0[2]);
            tg = Object.assign({}, s0, { p: [s0.p[0] - (d0[0] / L0) * 0.38 * k, s0.p[1] - (d0[1] / L0) * 0.38 * k, s0.p[2] - (d0[2] / L0) * 0.38 * k + 0.22 * k] });
            sayaZ = 0.22 * k; tg.crouch = 0.15 + 0.15 * k; tg.twist = 0.25 * k;
          } else {                                           // 2) gira a ponta para a frente e assume a guarda
            const k = sm((u - 0.45) / 0.55), s0 = SP.sheath, d0 = s0.d, L0 = Math.hypot(d0[0], d0[1], d0[2]);
            const mid = Object.assign({}, s0, { p: [s0.p[0] - (d0[0] / L0) * 0.38, s0.p[1] - (d0[1] / L0) * 0.38, s0.p[2] - (d0[2] / L0) * 0.38 + 0.22], crouch: 0.3, twist: 0.25 });
            tg = spMix(mid, SP.ready, k); sayaZ = 0.22 * (1 - k);
          }
          jaw = 0.1; break;
        }
        case "stalk": tg = SP.ready; leg = 0.3; bob = Math.abs(sw) * 0.012; rate = 12; break;
        case "windup": {
          const u = sm(cl01(t / wN)); tg = spMix(SP.ready, atkW, u); leg = 0; rate = 18; jaw = 0.05;
          if (u > 0.55) { this.glint.visible = true; this.glint.material.opacity = Math.min(1, (u - 0.55) * 3); const s = 0.12 + 0.2 * u; this.glint.scale.set(s, s, 1); this.glint.position.set(atkW.p[0] + atkW.d[0] * 0.78, atkW.p[1] + atkW.d[1] * 0.78, atkW.p[2] + atkW.d[2] * 0.78); }
          break;
        }
        case "strike": {
          const u = cl01(t / A.strike); tg = spMix(atkW, atkS, 1 - Math.pow(1 - u, 2.2)); leg = 0; rate = 60; jaw = 0.55;
          if (this.lastAct !== "strike") { this.trK = z.atk; this.trT = 0.26; }
          break;
        }
        case "recover": {
          const u = cl01(t / A.rec); tg = spMix(atkS, SP.ready, sm((u - 0.35) / 0.65)); leg = 0; rate = 16; jaw = 0.1; break;
        }
        case "retreat": tg = SP.ready; leg = 0.9; hop = Math.abs(sw) * 0.09; rate = 14; tilt = -0.1; break;
        case "flourish": {
          const u = cl01(t / 0.7), k = u < 0.4 ? sm(u / 0.4) : 1; tg = spMix(SP.ready, SP.flick0, k); if (u > 0.4) tg = spMix(SP.flick0, SP.flick1, sm((u - 0.4) / 0.2)); if (u > 0.7) tg = spMix(SP.flick1, SP.ready, sm((u - 0.7) / 0.3)); leg = 0; rate = 20; break;
        }
        case "dodge": {
          const u = cl01(t / 0.4); tg = SP.ready; leg = 0; rate = 20; tilt = 0.55 * Math.sin(u * Math.PI) * (z.dodgeDir || 1); rootDrop = 0.15; if (this.lastAct !== "dodge") this.dodgeT = 0.4; break;
        }
        default: tg = SP.ready;
      }
      this.lastAct = act;
      if (act !== "windup") { this.glint.visible = false; this.glint.material.opacity = 0; }
      // suaviza todos os canais
      const e = (k, v, r) => this.ease(k, v, dt, r || rate);
      const P = [e("px", tg.p[0]), e("py", tg.p[1]), e("pz", tg.p[2])], D = [e("dx", tg.d[0]), e("dy", tg.d[1]), e("dz", tg.d[2])], E = [e("ex", tg.e[0]), e("ey", tg.e[1]), e("ez", tg.e[2])];
      const lean = e("lean", tg.lean + (act === "approach" ? 0.08 : 0), 10), twist = e("twist", tg.twist, rate), crouch = e("crouch", tg.crouch, 10), head = e("head", tg.head, 10), lunge = e("lunge", tg.lunge, 12), one = e("one", tg.one || 0, 14);
      // corpo
      put(this.root, z.x, z.y, bob + hop - 0.22 * crouch - rootDrop);
      this.root.rotation.set(-lean * 0.25, z.yaw, tilt);
      this.spine.rotation.set(-lean * 0.75, twist, 0);
      const lg = e("leg", leg, 6), amp = lg * 0.9;
      const fl = lunge * 0.62, bl = lunge * 0.42;
      this.hR.rotation.x = -sw * amp + 0.65 * crouch + fl; this.hL.rotation.x = sw * amp + 0.65 * crouch - bl;
      this.kR.rotation.x = -(0.08 + Math.max(0, -cw) * amp * 0.9 + 1.0 * crouch + 0.35 * lunge); this.kL.rotation.x = -(0.08 + Math.max(0, cw) * amp * 0.9 + 1.0 * crouch + 0.1 * lunge);
      this.hR.rotation.z = -0.05 - 0.07 * crouch; this.hL.rotation.z = 0.05 + 0.07 * crouch;
      // espada e bainha
      const q = swordQuat(this._q, D, E);
      this.katana.position.set(P[0], P[1], P[2]); this.katana.quaternion.copy(q);
      const sh0 = SP.sheath;
      this.saya.position.set(sh0.p[0], sh0.p[1], sh0.p[2] + sayaZ);
      swordQuat(this._q, sh0.d, sh0.e); this.saya.quaternion.copy(this._q);
      // braços (IK até a empunhadura)
      const dv = this._d || (this._d = new THREE.Vector3()), gv = this._g || (this._g = new THREE.Vector3());
      dv.set(D[0], D[1], D[2]).normalize();
      const poleR = this._pr || (this._pr = new THREE.Vector3(0.5, -0.7, 0.5)), poleL = this._pl || (this._pl = new THREE.Vector3(-0.5, -0.7, 0.5));
      gv.set(P[0], P[1], P[2]).addScaledVector(dv, -0.075);
      R.ik(this.sR, this.eR, gv, poleR, 0.29, 0.258);
      this.wR.rotation.set(0.2, 0, -0.2);
      { const lw = e("lsaya", leftOnSaya ? 1 : 0, 16), sv = this._sv || (this._sv = new THREE.Vector3());
        gv.set(P[0], P[1], P[2]).addScaledVector(dv, -0.2); sv.set(sh0.p[0] - 0.02, sh0.p[1] - 0.03, sh0.p[2] + sayaZ + 0.09); gv.lerp(sv, lw); }
      if (one > 0.5) { this.sL.rotation.set(0.15, 0, -0.15); this.eL.rotation.x = 0.5; }
      else R.ik(this.sL, this.eL, gv, poleL, 0.29, 0.258);
      this.wL.rotation.set(0.2, 0, 0.2);
      this.head.rotation.set(head, Math.sin(ph * 0.4) * 0.05, 0);
      this.setJaw(jaw);
      // rastro
      for (const k in this.tr) {
        const m = this.tr[k];
        if (k === this.trK && this.trT > 0) { m.visible = true; m.material.opacity = Math.min(0.75, this.trT * 3.2); } else m.visible = false;
      }
      if (this.trT > 0) this.trT -= dt;
    }
  }
  const cl01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  // ======================================================================
  //  ESPECTRO DA ESPADA GIGANTE
  // ======================================================================
  const CW_LEN = 2.6, CW_GRIP = 0.5, CW_DT = 3.28, CW_LUNGE = 0.45, CW_SINK = 0.1;   // 3,28 (modelo) x ~1,28 de escala = 4,2 m de impacto
  const nrm3 = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const mixA = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const CW_TH0 = 0.5;                                                            // inclinação da espada cravada (rad)
  const CW_D0 = [0, -Math.sin(CW_TH0), -Math.cos(CW_TH0)];
  const CW_T = [0, -CW_SINK, -CW_DT];                                           // ponta cravada no chão (espaço da raiz)
  const CW_G0 = [CW_T[0] - CW_D0[0] * CW_LEN, CW_T[1] - CW_D0[1] * CW_LEN, CW_T[2] - CW_D0[2] * CW_LEN];
  const CW_CARRY = { G: [0.3, 1.36, -0.2], d: nrm3([0.12, 0.56, 0.82]) };
  const CW_OVER = { G: [0.0, 1.78, 0.14], d: nrm3([0, 0.78, 0.62]) };
  // tentativa de arrancar a espada: sobe até 'peak', segura, e escorrega de volta
  const attempt = (t, t0, t1, t2, t3, peak) => (t < t0 ? 0 : t < t1 ? peak * ZE.sm((t - t0) / (t1 - t0)) : t < t2 ? peak : t < t3 ? peak * (1 - ZE.sm((t - t2) / (t3 - t2))) : 0);

  function runeTex() {
    const cv = document.createElement("canvas"); cv.width = 48; cv.height = 768;
    const c = cv.getContext("2d"), r = ZH.mulberry(909);
    c.lineCap = "round"; c.lineJoin = "round"; c.shadowColor = "#38e8ff"; c.shadowBlur = 9;
    c.strokeStyle = "rgba(120,240,255,0.55)"; c.lineWidth = 2; c.beginPath(); c.moveTo(24, 8); c.lineTo(24, 760); c.stroke();
    c.strokeStyle = "#a8fbff"; c.lineWidth = 3.2;
    for (let i = 0; i < 15; i++) {
      const y = 22 + i * 49, k = Math.floor(r() * 5);
      c.beginPath();
      if (k === 0) { c.moveTo(10, y); c.lineTo(24, y + 18); c.lineTo(38, y); c.moveTo(24, y + 18); c.lineTo(24, y + 34); }
      else if (k === 1) { c.moveTo(10, y + 4); c.lineTo(38, y + 4); c.moveTo(24, y + 4); c.lineTo(12, y + 30); c.moveTo(24, y + 4); c.lineTo(36, y + 30); }
      else if (k === 2) { c.moveTo(12, y); c.lineTo(36, y + 16); c.lineTo(12, y + 32); c.moveTo(36, y); c.lineTo(36, y + 34); }
      else if (k === 3) { c.arc(24, y + 16, 11, 0, 6.283); c.moveTo(24, y + 5); c.lineTo(24, y + 28); }
      else { c.moveTo(12, y + 30); c.lineTo(12, y); c.lineTo(36, y + 30); c.lineTo(36, y); }
      c.stroke();
    }
    const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t;
  }
  function makeClaymore() {
    const g = new THREE.Group(), LEN = CW_LEN;
    const own = [], mats = [], glows = [];
    // lâmina: seção hexagonal achatada, afilada até a ponta; faces planas
    {
      const N = 28, P = [], C = [], wd = (u) => { const tk = u > 0.9 ? Math.sqrt(Math.max(0, 1 - (u - 0.9) / 0.1)) : 1; return [(0.135 - 0.03 * u) * tk, (0.036 - 0.012 * u) * (0.3 + 0.7 * tk)]; };
      const ring = (u) => { const [w, t] = wd(u), y = u * LEN; return [[0, y, -w], [t, y, -w * 0.4], [t, y, w * 0.4], [0, y, w], [-t, y, w * 0.4], [-t, y, -w * 0.4]]; };
      let prev = ring(0);
      for (let i = 1; i <= N; i++) {
        const cur = ring(i / N);
        for (let f = 0; f < 6; f++) {
          const f2 = (f + 1) % 6, a = prev[f], b = prev[f2], c2 = cur[f2], d = cur[f], bev = f % 3 !== 1;
          const k = (bev ? 0.62 : 0.2) * (0.82 + 0.36 * ZE.hash3(i * 3.1, f * 7.7, 1.3)), col = [k * 0.95, k * 1.02, k * 1.1];
          P.push(...a, ...b, ...c2, ...a, ...c2, ...d); for (let q = 0; q < 6; q++) C.push(...col);
        }
        prev = cur;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(C, 3)); geo.computeVertexNormals();
      const m = ZE.mkPhong({ specular: 0x9fb4c0, shininess: 120, transparent: true, emissive: 0x03090c }); m.userData.base = 0x03090c; mats.push(m);
      const blade = new THREE.Mesh(geo, m); blade.castShadow = true; blade.userData.ownGeo = true; g.add(blade);
      // fio brilhante nas duas bordas
      const gm = new THREE.MeshBasicMaterial({ color: 0x5eeaff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }); gm.userData.k = 0.9; glows.push(gm);
      for (const sg of [-1, 1]) {
        const Q = [], I = [];
        for (let i = 0; i <= N; i++) { const [w] = wd(i / N), y = (i / N) * LEN; Q.push(0, y, sg * w, 0, y, sg * (w - 0.026)); if (i) { const a = (i - 1) * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
        const eg = new THREE.BufferGeometry(); eg.setAttribute("position", new THREE.Float32BufferAttribute(Q, 3)); eg.setIndex(I);
        const em = new THREE.Mesh(eg, gm); em.userData.ownGeo = true; g.add(em);
      }
      // runas nas duas faces
      const tx = runeTex(), rm = new THREE.MeshBasicMaterial({ map: tx, color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }); rm.userData.k = 1; rm.userData.pulse = 1; glows.push(rm); g.userData.tex = tx;
      for (const sg of [-1, 1]) { const pg = new THREE.PlaneGeometry(0.12, 1.84); pg.rotateY(sg * Math.PI / 2); const pm = new THREE.Mesh(pg, rm); pm.position.set(sg * 0.0385, 0.4 + 0.92, 0); pm.userData.ownGeo = true; g.add(pm); }
    }
    // guarda, empunhadura, pomo
    const gb = new ZE.GB(), mm = ZE.mkPhong({ specular: 0x667788, shininess: 55, transparent: true, emissive: 0x02080a }); mm.userData.base = 0x02080a; mats.push(mm);
    const iron = 0x23282d, dark = 0x14171a, leather = 0x1b1411;
    gb.add(ZE.GEO.box, [0, -0.02, 0], null, [0.1, 0.1, 0.9], iron, 0.5);
    for (const sg of [-1, 1]) {
      gb.add(ZE.GEO.box, [0, 0.07, sg * 0.46], [sg * 0.0, 0, sg * -0.0], [0.085, 0.2, 0.07], iron, 0.5);
      gb.add(ZE.GEO.cone, [0, 0.2, sg * 0.46], null, [0.06, 0.16, 0.05], dark, 0.4);
      gb.add(ZE.GEO.sph, [0, -0.02, sg * 0.46], null, [0.06, 0.06, 0.06], dark, 0.3);
    }
    gb.add(ZE.GEO.box, [0, 0.07, 0], null, [0.075, 0.14, 0.2], dark, 0.5);
    gb.add(ZE.GEO.cyl, [0, -(CW_GRIP / 2) - 0.07, 0], null, [0.034, CW_GRIP, 0.034], leather, 0.5);
    for (let i = 0; i < 9; i++) gb.add(ZE.GEO.tor, [0, -0.1 - i * 0.052, 0], [Math.PI / 2, 0, 0], [0.036, 0.036, 0.1], 0x2e2218, 0.4);
    gb.add(ZE.GEO.sph, [0, -CW_GRIP - 0.14, 0], null, [0.085, 0.085, 0.085], iron, 0.5);
    gb.add(ZE.GEO.cone, [0, -CW_GRIP - 0.25, 0], [Math.PI, 0, 0], [0.05, 0.14, 0.05], dark, 0.4);
    g.add(gb.mesh(mm));
    g.userData.mats = mats; g.userData.glows = glows;
    return g;
  }

  // capa em tiras: malha de anéis com a barra esfarrapada, animada a cada quadro
  function makeCloak(mat, seed) {
    const SEG = 30, RINGS = [[0.6, 0.09, 0.085], [0.55, 0.17, 0.14], [0.48, 0.29, 0.2], [0.32, 0.32, 0.22], [0.1, 0.31, 0.23], [-0.12, 0.34, 0.255], [-0.34, 0.4, 0.3], [-0.56, 0.47, 0.37], [-0.74, 0.55, 0.44], [-0.84, 0.58, 0.47]];
    const rnd = ZH.mulberry(seed), NR = RINGS.length, pos = new Float32Array(SEG * NR * 3), base = new Float32Array(SEG * NR * 3), col = new Float32Array(SEG * NR * 3), idx = [];
    const rag = [], rag2 = [];
    for (let i = 0; i < SEG; i++) { const s = rnd(); rag.push(s < 0.3 ? 0.25 + rnd() * 0.2 : rnd() * 0.12); rag2.push(rag[i] * 0.45); }
    for (let j = 0; j < NR; j++) {
      for (let i = 0; i < SEG; i++) {
        const a = (i / SEG) * Math.PI * 2, [y0, rx, rz] = RINGS[j], k = (j * SEG + i) * 3;
        let y = y0; if (j === NR - 1) y -= rag[i]; else if (j === NR - 2) y -= rag2[i];
        base[k] = Math.sin(a) * rx; base[k + 1] = y; base[k + 2] = Math.cos(a) * rz;
        const h = j / (NR - 1), n = 0.75 + 0.25 * ZE.hash3(i * 1.7, j * 2.3, seed), f = (0.2 - 0.13 * h) * n;
        col[k] = f * 0.55; col[k + 1] = f * 0.85; col[k + 2] = f * 1.0;
        if (j < NR - 1) { const i2 = (i + 1) % SEG, a0 = j * SEG + i, a1 = j * SEG + i2, b0 = (j + 1) * SEG + i, b1 = (j + 1) * SEG + i2; idx.push(a0, b0, a1, a1, b0, b1); }
      }
    }
    pos.set(base);
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    geo.userData.ownGeo = true;
    const mesh = new THREE.Mesh(geo, mat); mesh.userData.ownGeo = true; mesh.frustumCulled = false;
    let nTick = 0;
    mesh.userData.upd = (time, ox, oz, flare, sag) => {
      for (let j = 1; j < NR; j++) {
        const h = j / (NR - 1), hh = h * h;
        for (let i = 0; i < SEG; i++) {
          const k = (j * SEG + i) * 3, a = (i / SEG) * 6.2832, sc = 1 + flare * hh * 0.5;
          const wv = Math.sin(time * 2.7 + a * 3 + j * 0.8) * 0.035 + Math.sin(time * 4.1 - a * 2 + j) * 0.015;
          pos[k] = base[k] * sc + (ox + wv) * hh;
          pos[k + 1] = base[k + 1] + sag * h * 0.1 + (j === NR - 1 ? Math.sin(time * 3.3 + i) * 0.03 : 0);
          pos[k + 2] = base[k + 2] * sc + (oz + wv * 0.8) * hh;
        }
      }
      geo.attributes.position.needsUpdate = true;
      if ((nTick++ & 1) === 0) geo.computeVertexNormals();
    };
    return mesh;
  }

  class WraithView {
    constructor(z) {
      const R = ZE;
      this.id = z.id; this.sp = {}; this.tlast = performance.now(); this.time = (z.id * 1.37) % 20;
      this.px = z.x; this.py = z.y; this.vxs = 0; this.vzs = 0; this.hot = false; this.lastT = 0; this.drop1 = this.drop2 = this.drop3 = false;
      this.solid = []; this.glowM = []; this.mats = []; this.dispT = 0;
      const root = (this.root = new THREE.Group()); root.rotation.order = "YXZ"; root.scale.setScalar(z.s || 1.28); scene.add(root);
      const mkSolid = (m, em) => { m.transparent = true; m.userData.own = true; m.userData.base = em || 0; if (em !== undefined && m.emissive) m.emissive.setHex(em); this.solid.push(m); this.mats.push(m); return m; };
      const cloakM = mkSolid(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), 0x031a1f);
      const boneM = mkSolid(R.mkPhong({ specular: 0x445a5c, shininess: 22 }), 0x0b2428);
      const darkM = mkSolid(new THREE.MeshLambertMaterial({ color: 0x020506 }), 0x000000);
      const body = (this.body = new THREE.Group()); body.position.y = 0.95; root.add(body);
      this.cloak = makeCloak(cloakM, z.id * 13 + 5); body.add(this.cloak);
      const torso = (this.torso = new THREE.Group()); torso.position.y = 0.2; body.add(torso);
      // peito ósseo por dentro da capa (visível pela abertura da frente)
      const tb = new R.GB();
      for (let i = 0; i < 5; i++) { tb.add(R.GEO.tor, [0, 0.06 + i * 0.075, -0.012], [Math.PI / 2, 0, 0], [0.13 - i * 0.008, 0.095 - i * 0.004, 0.55], 0xb9bdb2, 0.5); }
      tb.add(R.GEO.cyl, [0, 0.2, 0.05], null, [0.018, 0.5, 0.018], 0xa5a89c, 0.4);
      torso.add(tb.mesh(boneM));
      // cabeça: crânio, mandíbula articulada, capuz
      const head = (this.head = new THREE.Group()); head.position.set(0, 0.52, -0.02); torso.add(head);
      {
        const hb = new R.GB();
        hb.add(R.GEO.sph, [0, 0.01, 0.0], null, [0.098, 0.112, 0.108], 0xd3d6cb, 0.5);
        hb.add(R.GEO.sph, [0, -0.035, -0.055], null, [0.07, 0.05, 0.05], 0xcdd0c4, 0.5);
        for (const sg of [-1, 1]) {
          hb.add(R.GEO.sph, [sg * 0.042, 0.02, -0.085], null, [0.033, 0.036, 0.03], 0x020405, 0);
          hb.add(R.GEO.sph, [sg * 0.075, -0.03, -0.045], null, [0.028, 0.03, 0.035], 0xc6c9bd, 0.5);
        }
        hb.add(R.GEO.cone, [0, -0.02, -0.108], [-Math.PI / 2 + 0.2, 0, 0], [0.014, 0.03, 0.01], 0x040708, 0);
        for (let i = 0; i < 8; i++) hb.add(R.GEO.box, [-0.0308 * 3.5 + i * 0.0308, -0.065, -0.098 + Math.abs(i - 3.5) * 0.0045], null, [0.021, 0.02, 0.012], 0xe6e7de, 0.2);
        head.add(hb.mesh(boneM));
        const jaw = (this.jaw = new THREE.Group()); jaw.position.set(0, -0.052, 0.04); head.add(jaw);
        const jb = new R.GB();
        jb.add(R.GEO.box, [0, -0.026, -0.09], null, [0.1, 0.034, 0.08], 0xc8cbbf, 0.5);
        jb.add(R.GEO.box, [0, -0.01, -0.02], null, [0.13, 0.03, 0.07], 0xc8cbbf, 0.5);
        for (let i = 0; i < 7; i++) jb.add(R.GEO.box, [-0.0295 * 3 + i * 0.0295, -0.002, -0.128 + Math.abs(i - 3) * 0.006], null, [0.02, 0.022, 0.012], 0xe6e7de, 0.2);
        jaw.add(jb.mesh(boneM));
        // capuz: casca aberta na frente + ponta curvada para trás
        const hg = new THREE.SphereGeometry(0.165, 18, 12, -0.62, Math.PI + 1.24, 0, 2.35); hg.scale(1, 1.1, 1.22);
        const hc = new Float32Array(hg.attributes.position.count * 3); for (let i = 0; i < hc.length; i += 3) { const k = 0.07 + 0.06 * ZE.hash3(i, 3.3, 1.1); hc[i] = k * 0.6; hc[i + 1] = k * 0.9; hc[i + 2] = k; }
        hg.setAttribute("color", new THREE.BufferAttribute(hc, 3));
        const hood = new THREE.Mesh(hg, cloakM); hood.position.set(0, 0.0, 0.02); hood.userData.ownGeo = true; hood.castShadow = true; head.add(hood);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.34, 10), mkSolid(new THREE.MeshLambertMaterial({ color: 0x0a171b }), 0x031a1f)); tip.position.set(0, 0.13, 0.24); tip.rotation.x = 1.15; tip.userData.ownGeo = true; head.add(tip);
        // olhos brilhantes
        this.eyes = [];
        for (const sg of [-1, 1]) {
          const sm2 = new THREE.SpriteMaterial({ map: puffTex, color: 0x7ffcff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0 }); sm2.userData.own = true; this.mats.push(sm2);
          const sp = new THREE.Sprite(sm2); sp.position.set(sg * 0.042, 0.02, -0.092); sp.scale.set(0.11, 0.11, 1); head.add(sp); this.eyes.push(sm2);
          const co = new THREE.Sprite(sm2); co.position.copy(sp.position); co.position.z -= 0.004; co.scale.set(0.04, 0.04, 1); head.add(co);
        }
      }
      // braços ósseos com mangas rasgadas
      const armMat = boneM;
      this.arm = {};
      for (const sg of [-1, 1]) {
        const key = sg < 0 ? "L" : "R";
        const sh = new THREE.Group(); sh.position.set(sg * 0.25, 0.27, 0.0); torso.add(sh);
        const el = new THREE.Group(); el.position.y = -0.33; sh.add(el);
        const wr = new THREE.Group(); wr.position.y = -0.33; el.add(wr);
        const ub = new R.GB(), fb = new R.GB(), hb2 = new R.GB(), sb = new R.GB();
        ub.add(R.GEO.cyl, [0, -0.165, 0], null, [0.028, 0.33, 0.028], 0xb2b6aa, 0.5); ub.add(R.GEO.sph, [0, 0, 0], null, [0.04, 0.04, 0.04], 0xb7baae, 0.5);
        fb.add(R.GEO.cyl, [0, -0.165, 0], null, [0.024, 0.33, 0.024], 0xb2b6aa, 0.5); fb.add(R.GEO.sph, [0, 0, 0], null, [0.036, 0.036, 0.036], 0xb7baae, 0.5);
        hb2.add(R.GEO.box, [0, -0.035, 0], null, [0.1, 0.07, 0.05], 0xb9bcb0, 0.5);
        for (let i = 0; i < 4; i++) hb2.add(R.GEO.tor, [-0.036 + i * 0.024, -0.075, 0], [0, Math.PI / 2, 0], [0.04, 0.04, 0.5], 0xc7cabd, 0.4);
        hb2.add(R.GEO.cyl, [0.06, -0.05, -0.02], [0, 0, 0.8], [0.014, 0.075, 0.014], 0xc7cabd, 0.3);
        sh.add(ub.mesh(armMat)); el.add(fb.mesh(armMat)); wr.add(hb2.mesh(armMat));
        const sl1 = new THREE.CylinderGeometry(0.075, 0.125, 0.34, 10, 1, true), sl2 = new THREE.CylinderGeometry(0.065, 0.16, 0.36, 10, 1, true);
        const c1 = new THREE.Float32BufferAttribute(new Float32Array(sl1.attributes.position.count * 3).fill(0.1), 3), c2 = new THREE.Float32BufferAttribute(new Float32Array(sl2.attributes.position.count * 3).fill(0.09), 3);
        sl1.setAttribute("color", c1); sl2.setAttribute("color", c2);
        const m1 = new THREE.Mesh(sl1, cloakM); m1.position.y = -0.16; m1.userData.ownGeo = true; sh.add(m1);
        const m2 = new THREE.Mesh(sl2, cloakM); m2.position.y = -0.17; m2.userData.ownGeo = true; el.add(m2);
        this.arm[key] = { sh, el, wr };
      }
      // espada gigante
      this.sword = makeClaymore(); root.add(this.sword);
      for (const m of this.sword.userData.mats) { this.solid.push(m); this.mats.push(m); }
      for (const m of this.sword.userData.glows) { this.glowM.push(m); this.mats.push(m); }
      this.rtex = this.sword.userData.tex;
      // rastro de névoa e aro de luz no chão (denunciam o fantasma invisível)
      const rg = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: puffTex, color: 0x4fdcff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, fog: false }));
      rg.rotation.x = -Math.PI / 2; rg.position.y = 0.04; rg.userData.ownGeo = true; rg.material.userData.own = true; root.add(rg); this.ring = rg; this.mats.push(rg.material);
      this.shadow = new THREE.Object3D();
      this._v = new THREE.Vector3(); this._w = new THREE.Vector3(); this._q = new THREE.Quaternion(); this._q2 = new THREE.Quaternion(); this._x = new THREE.Vector3(1, 0, 0);
      this.poleR = new THREE.Vector3(0.6, -0.6, 0.5); this.poleL = new THREE.Vector3(-0.6, -0.6, 0.5);
      this.meshesShadow = []; root.traverse((o) => { if (o.isMesh && o.castShadow) this.meshesShadow.push(o); });
    }
    dtNow() { const n = performance.now(), dt = Math.min(0.05, Math.max(0.001, (n - this.tlast) / 1000)); this.tlast = n; return dt; }
    ease(key, target, dt, rate) { const o = this.sp; if (o[key] === undefined) o[key] = target; o[key] += (target - o[key]) * (1 - Math.exp(-(rate || 14) * dt)); return o[key]; }
    // alvo no espaço da raiz -> espaço do tronco (pai dos ombros)
    toTorso(v) { this.root.localToWorld(v); return this.torso.worldToLocal(v); }
    setAlpha(a, tell, hotCol) {
      for (const m of this.solid) { m.opacity = a; m.visible = a > 0.012; m.depthWrite = a > 0.97; }
      for (const m of this.glowM) { m.opacity = a * (m.userData.k || 1) * (m.userData.pulse ? this.runeK : 1); m.visible = a > 0.012; }
      const eo = Math.max(a, tell);
      for (const m of this.eyes) { m.opacity = eo; m.visible = eo > 0.01; }
      const sh = a > 0.6; for (const o of this.meshesShadow) o.castShadow = sh;
    }
    update(z) {
      const dt = this.dtNow(), R = ZE, sm = R.sm, mixn = R.mix;
      this.time += dt;
      const time = this.time, dead = z.state === "dead";
      const hot = z.hitT > 0;
      if (hot !== this.hot) { this.hot = hot; for (const m of this.solid) if (m.emissive) m.emissive.setHex(hot ? 0x2a6a74 : (m.userData.base || 0)); }
      // velocidade local (a capa e o corpo acompanham o deslocamento)
      const vx = (z.x - this.px) / dt, vy = (z.y - this.py) / dt; this.px = z.x; this.py = z.y;
      const fx = -Math.sin(z.yaw), fy = Math.cos(z.yaw), rx = Math.cos(z.yaw), ry = Math.sin(z.yaw);
      const vF = vx * fx + vy * fy, vR = vx * rx + vy * ry;
      this.vzs += (vF - this.vzs) * (1 - Math.exp(-6 * dt)); this.vxs += (vR - this.vxs) * (1 - Math.exp(-6 * dt));
      const spd = Math.min(1, Math.hypot(this.vxs, this.vzs) / 9);
      const seq = z.act === "seq" && !dead, t = z.seqT;
      // --- pose da espada e do corpo ---
      let G = CW_CARRY.G, d = CW_CARRY.d, e = [0, 0, -1], lean = 0.28 * spd + 0.05, lunge = 0, strain = 0, jaw = 0.12, headX = 0.0, leftW = 0, bodyDrop = 0, flare = 0, thud = 0, hover = 0.1 + 0.05 * spd, rate = 24, tip = false;
      this.runeK = 0.55 + 0.25 * Math.sin(time * 3.1);
      if (dead) {
        this.dispT += dt; const u = Math.min(1, this.dispT / 1.4);
        G = mixA(CW_CARRY.G, [0.45, 0.14, -0.7], sm(u * 1.5)); d = nrm3(mixA(CW_CARRY.d, [0.15, 0.02, -1], sm(u * 1.5))); lean = 0.6 * sm(u); bodyDrop = 0.45 * sm(u); hover = 0; jaw = 0.8; rate = 12; flare = 0.6;
        this.deadA = 1 - sm((this.dispT - 0.35) / 1.0);
      } else if (!seq) {
        this.lastT = 0; this.drop1 = this.drop2 = this.drop3 = this.pl1 = this.pl2 = this.pl3 = false;
        // desliza com a espada apoiada no ombro; a mão livre vai para trás
        G = mixA(CW_CARRY.G, [CW_CARRY.G[0], CW_CARRY.G[1] + 0.05, CW_CARRY.G[2] - 0.1], spd); d = nrm3(mixA(CW_CARRY.d, [0.1, 0.5, 0.86], spd)); jaw = 0.25 + 0.2 * spd; headX = 0.28 * spd;
      } else {
        const L = CW_LEN, ov = CW_OVER, ca = CW_CARRY;
        if (t < 0.6) { strain = 0.003; jaw = 0.08 + 0.1 * (t / 0.6); }
        else if (t < 2.0) {                                      // 1) ergue a espada devagar, tremendo com o peso
          const u = (t - 0.6) / 1.4, k = sm(u) * 0.9 + sm(sm(u)) * 0.1, tr = 1 + 0.0 * u;
          G = mixA(ca.G, ov.G, k); d = nrm3(mixA(ca.d, ov.d, k)); e = [0, 0, -1];
          G[0] += Math.sin(t * 17) * 0.012 * u; G[1] += Math.sin(t * 23) * 0.01 * u; d = nrm3([d[0] + Math.sin(t * 13) * 0.025 * u, d[1], d[2]]);
          lean = mixn(0.05, -0.34, sm(u)); bodyDrop = 0.12 * sm(u) + 0.03 * Math.sin(t * 9) * u; strain = 0.004 + 0.014 * u; headX = mixn(0, -0.3, sm(u)); jaw = 0.1 + 0.4 * u; leftW = sm((u - 0.1) / 0.35); hover = 0.04; rate = 18;
        } else if (t < 2.5) {                                    // 2) segura no alto, vacilando
          const u = (t - 2.0) / 0.5; G = ov.G.slice(); d = ov.d.slice();
          G[0] += Math.sin(t * 14) * 0.03; G[1] += Math.sin(t * 19) * 0.02; d = nrm3([d[0] + Math.sin(t * 11) * 0.05, d[1], d[2] + Math.sin(t * 9) * 0.03]);
          lean = -0.38 - 0.04 * Math.sin(t * 12); bodyDrop = 0.14 + 0.02 * Math.sin(t * 15); strain = 0.02; headX = -0.3; jaw = 0.75; leftW = 1; flare = 0.4 + 0.5 * u; hover = 0.03; rate = 22;
          this.runeK = 0.8 + 0.2 * Math.sin(time * 20);
        } else if (t < 2.8) {                                    // 3) golpe: a espada despenca e crava no chão
          const u = (t - 2.5) / 0.3, k = Math.pow(u, 2.4);
          G = mixA(ov.G, CW_G0, k); d = nrm3(mixA(ov.d, CW_D0, k));
          lean = mixn(-0.38, 0.62, sm(u)); lunge = CW_LUNGE * k; bodyDrop = mixn(0.14, 0.05, u); headX = mixn(-0.3, 0.4, u); jaw = 0.85; leftW = 1; flare = 1; strain = 0.01; hover = 0; rate = 70; this.runeK = 1;
        } else {
          // 4) cravada: tenta arrancar três vezes
          lunge = CW_LUNGE; leftW = 1; hover = 0; tip = true;
          const ti = t - 2.8; thud = Math.exp(-ti * 6);
          const l1 = attempt(t, 3.05, 3.6, 3.72, 3.82, 0.42), l2 = attempt(t, 4.1, 4.75, 4.9, 5.0, 0.74);
          let lift = Math.max(l1, l2), freed = 0;
          if (t >= 5.15) { const l3 = sm((t - 5.15) / 0.38); lift = Math.max(lift, l3); }
          if (t >= 5.53) freed = sm((t - 5.53) / 0.4);
          const pull = lift * 0.38;
          G = [CW_G0[0] - CW_D0[0] * pull, CW_G0[1] - CW_D0[1] * pull, CW_G0[2] - CW_D0[2] * pull]; d = CW_D0.slice();
          const sk = lift > 0.02 ? 0.012 * lift : 0;
          G[0] += Math.sin(t * 31) * sk; G[1] += Math.sin(t * 27) * sk * 0.8;
          d = nrm3([d[0] + Math.sin(t * 36) * 0.06 * thud, d[1] + Math.sin(t * 29) * 0.03 * thud, d[2]]);
          lean = 0.62 - 1.0 * lift + 0.04 * Math.sin(t * 40) * thud; bodyDrop = 0.05 + 0.08 * lift + 0.05 * thud; headX = 0.4 - 0.7 * lift; jaw = 0.25 + 0.5 * lift; strain = 0.012 + 0.03 * lift; lunge = CW_LUNGE * (1 - 0.7 * lift); flare = 0.4 * lift + 0.6 * thud;
          if (freed > 0) {                                       // 5) solta: a espada sai do chão e vai para o ombro
            const arc = Math.sin(freed * Math.PI) * 0.35;
            G = mixA(G, ca.G, freed); G[1] += arc; d = nrm3(mixA(d, ca.d, freed)); lean = mixn(lean, -0.12, freed); headX = mixn(headX, 0, freed); lunge = lunge * (1 - freed); leftW = 1 - sm((freed - 0.35) / 0.4); flare = mixn(flare, 0.3, freed); tip = false;
          }
          // pancadas da espada voltando ao chão (poeira e som)
          if (!this.drop1 && t >= 3.72) { this.drop1 = true; WraithView.onThud && WraithView.onThud(z, 0.5); }
          if (!this.drop2 && t >= 4.9) { this.drop2 = true; WraithView.onThud && WraithView.onThud(z, 0.7); }
          if (!this.pl1 && t >= 3.05) { this.pl1 = true; WraithView.onPull && WraithView.onPull(z); }
          if (!this.pl2 && t >= 4.1) { this.pl2 = true; WraithView.onPull && WraithView.onPull(z); }
          if (!this.pl3 && t >= 5.15) { this.pl3 = true; WraithView.onPull && WraithView.onPull(z); }
        }
      }
      // --- aplica corpo ---
      const gR = this.ease("gR", 1, dt, 1);
      const eG = [this.ease("gx", G[0], dt, rate), this.ease("gy", G[1], dt, rate), this.ease("gz", G[2], dt, rate)];
      const eD = [this.ease("dx", d[0], dt, rate), this.ease("dy", d[1], dt, rate), this.ease("dz", d[2], dt, rate)];
      const eLean = this.ease("lean", lean, dt, 10), eLunge = this.ease("lunge", lunge, dt, rate > 40 ? 40 : 12), eDrop = this.ease("drop", bodyDrop, dt, 10), eLW = this.ease("lw", leftW, dt, 8), eHead = this.ease("hx", headX, dt, 8), eJaw = this.ease("jaw", jaw, dt, 12), eFlare = this.ease("flare", flare, dt, 6);
      const jx = strain ? (Math.random() - 0.5) * strain : 0, jz = strain ? (Math.random() - 0.5) * strain : 0;
      put(this.root, z.x, z.y, 0);
      this.root.rotation.set(0, z.yaw, 0);
      this.body.position.set(jx, 0.95 + hover + Math.sin(time * 1.8) * 0.03 - eDrop, -eLunge + jz);
      this.body.rotation.set(-eLean * 0.55 + 0.0, 0, -this.vxs * 0.012);
      this.torso.rotation.set(-eLean * 0.6, Math.sin(time * 0.9) * 0.05, 0);
      this.head.rotation.set(eHead + Math.sin(time * 1.1) * 0.03, Math.sin(time * 0.7) * 0.09, 0);
      this.jaw.rotation.x = -eJaw;
      this.cloak.userData.upd(time, -this.vxs * 0.045, this.vzs * 0.06 + 0.05 + (seq ? Math.sin(time * 6) * 0.01 : 0), eFlare, thud * 0.8 + eDrop * 2);
      // --- alpha ---
      let a, tell = 0;
      if (dead) a = this.deadA; else { a = z.vis; tell = 0.0; }
      if (!dead && a < 0.05) tell = 0.06 + 0.06 * Math.sin(time * 9) * Math.sin(time * 3.7);
      a = Math.max(0, Math.min(1, a));
      this.setAlpha(a, dead ? 0 : Math.max(0, tell), 0);
      const ringA = dead ? 0 : (a < 0.5 ? 0.1 + 0.05 * Math.sin(time * 6) : 0.08);
      this.ring.material.opacity = ringA * (1 - a * 0.4); this.ring.scale.setScalar(1 + 0.15 * Math.sin(time * 5) + (seq ? 0.4 : 0));
      // --- espada ---
      swordQuat(this._q, eD, e); this.sword.position.set(eG[0], eG[1], eG[2]); this.sword.quaternion.copy(this._q);
      // --- braços: cinemática inversa até a empunhadura ---
      this.root.updateMatrixWorld(true);
      const dv = this._v.set(eD[0], eD[1], eD[2]).normalize();
      const aR = this.arm.R, aL = this.arm.L, w = this._w;
      // mão direita no cabo (0,18 abaixo da guarda), esquerda mais embaixo (0,40)
      w.set(eG[0], eG[1], eG[2]).addScaledVector(dv, -0.18); this.toTorso(w); R.ik(aR.sh, aR.el, w, this.poleR, 0.33, 0.33);
      // alvo da esquerda: no cabo ou pendurada para trás
      const lg = this._lg || (this._lg = new THREE.Vector3()); lg.set(eG[0], eG[1], eG[2]).addScaledVector(dv, -0.4);
      const hang = this._hg || (this._hg = new THREE.Vector3());
      aL.sh.getWorldPosition(hang); this.root.worldToLocal(hang); hang.add(w.set(-0.12 - 0.1 * spd, -0.52, 0.12 + 0.3 * spd));
      lg.lerp(hang, 1 - eLW); this.toTorso(lg); R.ik(aL.sh, aL.el, lg, this.poleL, 0.33, 0.33);
      // punhos alinhados com o cabo
      aR.sh.updateMatrixWorld(true); aL.sh.updateMatrixWorld(true);
      const dw = this._w.set(eD[0], eD[1], eD[2]).applyQuaternion(this.root.quaternion);
      for (const A of [aR, aL]) {
        A.el.getWorldQuaternion(this._q2); const loc = this._v.copy(dw).applyQuaternion(this._q2.invert());
        if (A === aL && eLW < 0.5) A.wr.rotation.set(0.3, 0, 0); else A.wr.quaternion.setFromUnitVectors(this._x, loc.normalize());
      }
    }
    destroy() {
      scene.remove(this.root);
      this.root.traverse((o) => { if (o.isMesh && o.geometry && (o.userData.ownGeo || o.userData.merged)) o.geometry.dispose(); });
      for (const m of this.mats) m.dispose();
      if (this.rtex) this.rtex.dispose();
    }
  }
  WraithView.onThud = null; WraithView.onPull = null;
