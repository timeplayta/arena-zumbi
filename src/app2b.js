  // ======================================================================
  //  ZUMBIS: corpo anatômico (tronco, bacia, pescoço, cabeça com rosto, braços com mãos,
  //  pernas com pés) e personagens variados: roupas, cabelos, chapéus, barba e tom de pele.
  // ======================================================================
  const ZG = (function () {
    const V2 = (a, b) => new THREE.Vector2(Math.max(1e-4, a), b);
    const lathe = (pts, seg, ps, pl) => new THREE.LatheGeometry(pts.map((p) => V2(p[0], p[1])), seg || 14, ps || 0, pl || Math.PI * 2);
    const sq = (geo, sx, sy, sz) => geo.scale(sx, sy, sz);
    // membro com pivô no topo, descendo em -y, pontas arredondadas e "músculo" no meio
    const limb = (r1, rm, r2, len, k) => lathe([[0, -len - r2 * 0.8], [r2 * 0.75, -len - r2 * 0.55], [r2, -len], [rm, -len * (k || 0.4)], [r1, -0.03], [r1 * 0.8, r1 * 0.45], [0, r1 * 0.7]], 12);
    const sph = (w, h) => new THREE.SphereGeometry(1, w || 12, h || 9);
    const G = {
      // troncos (pivô na cintura): masculino, feminino, gordo
      torsoM: sq(lathe([[0, -0.02], [0.138, 0], [0.14, 0.08], [0.152, 0.2], [0.168, 0.31], [0.176, 0.37], [0.162, 0.425], [0.1, 0.465], [0, 0.475]], 16), 1, 1, 0.62),
      torsoF: sq(lathe([[0, -0.02], [0.13, 0], [0.114, 0.1], [0.13, 0.2], [0.148, 0.28], [0.15, 0.35], [0.14, 0.41], [0.088, 0.445], [0, 0.455]], 16), 1, 1, 0.66),
      torsoFat: sq(lathe([[0, -0.02], [0.18, 0], [0.21, 0.09], [0.218, 0.17], [0.2, 0.29], [0.205, 0.37], [0.185, 0.425], [0.115, 0.468], [0, 0.48]], 16), 1, 1, 0.8),
      pelvis: sq(lathe([[0, -0.11], [0.1, -0.115], [0.142, -0.06], [0.145, 0.03], [0.136, 0.085], [0, 0.095]], 14), 1, 1, 0.72),
      neck: lathe([[0, 0], [0.062, 0], [0.054, 0.04], [0.056, 0.1], [0, 0.1]], 12),
      shoulder: sph(10, 8),
      upper: limb(0.058, 0.054, 0.045, 0.29, 0.35), fore: limb(0.047, 0.048, 0.035, 0.25, 0.25), joint: sph(10, 8),
      thigh: limb(0.086, 0.08, 0.058, 0.44, 0.3), shin: limb(0.058, 0.062, 0.042, 0.42, 0.25),
      palm: sq(sph(10, 8), 0.04, 0.052, 0.02), fingers: sq(sph(10, 8), 0.036, 0.055, 0.015), thumb: sq(sph(8, 6), 0.012, 0.032, 0.012),
      foot: sq(sph(12, 8), 0.05, 0.038, 0.12), boot: lathe([[0, 0], [0.055, 0], [0.056, 0.1], [0, 0.1]], 12),
      // cabeça
      skull: sq(sph(16, 12), 0.094, 0.114, 0.104), jaw: sq(sph(12, 8), 0.074, 0.048, 0.07), nose: new THREE.ConeGeometry(0.017, 0.042, 8).rotateX(-Math.PI / 2),
      ear: sq(sph(8, 6), 0.012, 0.03, 0.02), socket: sq(sph(10, 8), 0.022, 0.016, 0.012), pupil: sph(8, 6).scale(0.008, 0.008, 0.008),
      brow: new THREE.BoxGeometry(0.12, 0.02, 0.03), mouth: new THREE.BoxGeometry(0.05, 0.012, 0.012), teeth: new THREE.BoxGeometry(0.044, 0.008, 0.008),
      stump: new THREE.CircleGeometry(0.05, 12).rotateX(-Math.PI / 2),
      // cabelos
      hairCap: sq(new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, 1.3), 0.103, 0.124, 0.114),
      hairLong: sq(sph(12, 9), 0.1, 0.17, 0.05), hairLock: sq(sph(8, 6), 0.025, 0.1, 0.03),
      tail: sq(sph(10, 8), 0.028, 0.09, 0.028), bun: sph(10, 8).scale(0.042, 0.042, 0.042),
      mohawk: new THREE.BoxGeometry(0.026, 0.05, 0.2), afro: sq(sph(14, 10), 0.14, 0.13, 0.14),
      ring: new THREE.TorusGeometry(0.098, 0.022, 6, 16, Math.PI * 1.25), beard: sq(new THREE.SphereGeometry(1, 12, 8, Math.PI * 1.15, Math.PI * 0.7, Math.PI * 0.45, Math.PI * 0.55), 0.078, 0.06, 0.076),
      // chapéus e capacetes
      capCrown: sq(new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0.108, 0.075, 0.116), visor: sq(new THREE.CylinderGeometry(1, 1, 0.008, 16, 1, false, Math.PI * 0.6, Math.PI * 0.8), 0.11, 1, 0.11),
      police: lathe([[0, 0], [0.108, 0], [0.12, 0.05], [0.13, 0.075], [0, 0.08]], 16), beanie: sq(new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, 1.65), 0.108, 0.12, 0.114),
      helmet: sq(new THREE.SphereGeometry(1, 16, 9, 0, Math.PI * 2, 0, Math.PI / 2), 0.125, 0.11, 0.135), brim: lathe([[0.12, 0], [0.18, -0.01], [0.18, 0.004], [0.12, 0.012]], 18),
      hood: sq(new THREE.SphereGeometry(1, 14, 10, Math.PI * 1.85, Math.PI * 1.3, 0, 2.1), 0.13, 0.145, 0.13), hoodDown: sq(sph(10, 8), 0.13, 0.06, 0.08),
      // roupas extras
      skirt: sq(lathe([[0.135, 0.02], [0.155, -0.12], [0.215, -0.4], [0.232, -0.45]], 18), 1, 1, 0.8),
      coat: sq(lathe([[0.152, 0.02], [0.17, -0.18], [0.2, -0.56]], 18, Math.PI + 0.32, Math.PI * 2 - 0.64), 1, 1, 0.8),
      gown: sq(lathe([[0.15, 0.02], [0.17, -0.32]], 16), 1, 1, 0.8),
      tie: new THREE.BoxGeometry(0.04, 0.26, 0.012).translate(0, -0.13, 0), plate: new THREE.BoxGeometry(1, 1, 1),
      band: sq(lathe([[0.18, 0], [0.18, 0.035]], 16), 1, 1, 0.64), belt: sq(lathe([[0.148, 0], [0.148, 0.035]], 16), 1, 1, 0.74),
      wound: sq(sph(8, 6), 0.042, 0.034, 0.012), rib: new THREE.BoxGeometry(0.07, 0.012, 0.012),
      shadow: new THREE.CircleGeometry(0.55, 14).rotateX(-Math.PI / 2),
    };
    return G;
  })();
  const GZ = { shadow: ZG.shadow };

  // tons de pele (vivos) misturados com o cinza-esverdeado da decomposição
  const SKIN_BASE = [0xd6b296, 0xb98d6c, 0x8d6448, 0x5e4130, 0xc9a07c];
  const ROT = new THREE.Color(0x7c8a68);
  const HAIRC = { preto: 0x141110, castanho: 0x3a2516, castClaro: 0x6a4626, loiro: 0xb59a5c, ruivo: 0x7a3418, grisalho: 0x8c8a86, branco: 0xc8c6c0 };
  const C = (h) => new THREE.Color(h);
  // personagens: roupas (top/bottom), calçado, cabelo possível, chapéu, barba, sexo
  const ARCH = {
    operario: { sex: "m", top: [0x7a2a20, 0x2c4a6e, 0x4e5a2c], plaid: true, sleeve: "long", bot: [0x23324e, 0x34302a], shoe: 0x3a2a1c, boot: true, hair: ["short", "short", "side", "balding", "buzz", "messy", "curly"], hat: [["cap", 0.45]], beard: 0.45, belt: true },
    executivo: { sex: "m", top: [0xd8d8d0, 0xbcc8d8], sleeve: "long", bot: [0x1a1c22, 0x2a2c30], shoe: 0x0e0e0e, hair: ["short", "side", "side", "balding", "bald"], tie: [0x7a1010, 0x14284a, 0x2a2a2a], beard: 0.1, belt: true },
    policial: { sex: "mf", top: [0x161e34], sleeve: "long", bot: [0x161e34], shoe: 0x0c0c0c, boot: true, hair: ["buzz", "short", "bun", "tail", "side"], hat: [["police", 0.55]], badge: true, belt: true, beard: 0.15 },
    enfermeira: { sex: "f", top: [0x2c7a78, 0x4a6a9a, 0x7a4a8a], sleeve: "short", bot: "same", shoe: 0xd8d8d8, hair: ["tail", "bun", "long", "bob", "wavy"] },
    medico: { sex: "mf", top: [0x8aa8c8, 0x6a8a6a], sleeve: "long", coat: 0xdedcd4, bot: [0x2a2c30, 0x3a3a3e], shoe: 0x1a1a1a, hair: ["short", "side", "tail", "long", "bob", "balding", "curly"], beard: 0.2 },
    adolescente: { sex: "mf", top: [0x4a4c50, 0x7a1c1c, 0x1c1c1e, 0x2a5a3a], sleeve: "long", hoodie: true, bot: [0x23324e, 0x2a2a2c, 0x5a5a5e], shoe: 0xe8e8e4, hair: ["short", "mohawk", "long", "afro", "tail", "messy", "curly", "side"], hat: [["hood", 0.4], ["beanie", 0.15]] },
    mulher: { sex: "f", top: [0x8a1c2a, 0x2a4a8a, 0xc8a840, 0x2a6a4a], dress: true, sleeve: "none", shoe: 0x2a1a14, hair: ["long", "wavy", "bob", "bun", "afro", "tail", "curly", "side"] },
    idosa: { sex: "f", top: [0x7a6a8a, 0x6a5a4a], sleeve: "long", dress: true, shoe: 0x3a2a20, hair: ["bun", "short", "curly", "bob", "balding"], hairColor: ["grisalho", "branco"] },
    mendigo: { sex: "m", top: [0x4a4030], coat: 0x3e3424, sleeve: "long", bot: [0x3a3428], shoe: 0x2a2018, boot: true, hair: ["balding", "long", "messy", "wavy", "bald"], hat: [["beanie", 0.5]], beard: 0.9, hairColor: ["grisalho", "castanho", "preto"] },
    soldado: { sex: "m", top: [0x4a5232], camo: true, sleeve: "long", bot: [0x4a5232], shoe: 0x1c1a16, boot: true, hair: ["buzz"], hat: [["helmet", 0.7]], vest: 0x3a3e2a, beard: 0.15 },
    bombeiro: { sex: "m", top: [0x4a3e24, 0x2a2a26], stripes: true, sleeve: "long", bot: [0x4a3e24, 0x2a2a26], shoe: 0x111111, boot: true, hair: ["short", "buzz", "side", "curly"], hat: [["fire", 0.75]], beard: 0.3 },
    paciente: { sex: "mf", top: [0x9ab8b4, 0xa8b8c8], gown: true, sleeve: "short", bot: "skin", shoe: "skin", hair: ["short", "long", "balding", "messy", "wavy", "bob", "bald"] },
    corredora: { sex: "f", top: [0xd84a6a, 0x2a8ac8, 0xe8e8e8], sleeve: "none", bot: [0x141416], shoe: 0xe8e8e4, hair: ["tail", "tail", "bun", "bob", "short"] },
    acougueiro: { sex: "m", top: [0xd8d4c8], sleeve: "short", apron: 0xdcd8cc, bot: [0x2a2c30], shoe: 0x111111, boot: true, hair: ["bald", "bald", "buzz", "mohawk", "balding"], beard: 0.6, fat: true },
    presidiario: { sex: "m", top: [0xd8601a], sleeve: "short", bot: "same", shoe: 0xd8d8d0, hair: ["buzz", "bald", "short", "messy", "balding"], beard: 0.4 },
    turista: { sex: "mf", top: [0x2a8a9a, 0xd84a2a, 0xe8c84a], plaid: true, sleeve: "short", bot: [0xb8a888, 0x4a5a7a], shorts: true, shoe: 0x8a6a4a, hair: ["short", "long", "tail", "balding", "curly", "wavy", "bob", "side"], hat: [["cap", 0.5]] },
    noiva: { sex: "f", top: [0xece8e0], dress: true, sleeve: "none", shoe: 0xe8e4dc, hair: ["long", "bun", "wavy", "tail"], hairColor: ["preto", "castanho", "loiro", "ruivo"] },
    // ---- especiais dos níveis extremos ----
    blindado: { sex: "m", top: [0x3a4230], camo: true, sleeve: "long", bot: [0x343a2a], shoe: 0x121210, boot: true, hair: ["buzz"], hairColor: ["preto", "castanho"], vest: 0x2a2f22, beard: 0.15, fat: true },
    mestre: { sex: "m", top: [0x2c3550], sleeve: "long", bot: [0x16161e], shoe: "skin", hair: ["balding"], hairColor: ["branco"], beard: 1 },
    atleta: { sex: "m", top: [0x1a2a6a, 0x6a1a1a, 0x1a1a1a], sleeve: "long", stripes2: true, bot: "same", shoe: 0xe8e8e4, hair: ["short", "buzz", "mohawk", "afro", "curly", "side"] },
    motoqueiro: { sex: "m", top: [0x141414], vestOnly: true, sleeve: "none", bot: [0x23324e], shoe: 0x111111, boot: true, hair: ["bald", "long", "wavy", "mohawk", "balding", "messy"], beard: 0.95, fat: true, hat: [["bandana", 0.3]] },
  };
  const POOL = {
    walker: ["operario", "executivo", "policial", "enfermeira", "medico", "adolescente", "mulher", "idosa", "mendigo", "soldado", "bombeiro", "presidiario", "turista", "noiva"],
    runner: ["corredora", "paciente", "adolescente", "atleta"],
    brute: ["acougueiro", "motoqueiro", "presidiario", "bombeiro"],
    giant: ["acougueiro", "motoqueiro", "presidiario"],
    tank: ["blindado"], samurai: ["mestre"],
  };
  function zrng(seed) {           // mulberry32: o mesmo zumbi sempre tem a mesma aparência
    let a = seed >>> 0;
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];

  // ---------------- itens: kit médico e caixa de munição ----------------
  const PK = (function () {
    const ph = (c, e, s) => new THREE.MeshPhongMaterial({ color: c, emissive: e || 0, specular: s || 0x222222, shininess: 40 });
    const tex = (stops) => {
      const c = document.createElement("canvas"); c.width = c.height = 64;
      const x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      stops.forEach((s) => g.addColorStop(s[0], s[1])); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    };
    const beamTex = (function () {
      const c = document.createElement("canvas"); c.width = 4; c.height = 64;
      const x = c.getContext("2d"), g = x.createLinearGradient(0, 0, 0, 64);
      g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.7, "rgba(255,255,255,0.45)"); g.addColorStop(1, "rgba(255,255,255,0.9)");
      x.fillStyle = g; x.fillRect(0, 0, 4, 64);
      return new THREE.CanvasTexture(c);
    })();
    const glowTex = tex([[0, "rgba(255,255,255,0.9)"], [0.35, "rgba(255,255,255,0.35)"], [1, "rgba(255,255,255,0)"]]);
    const add = (color, map, op) => new THREE.MeshBasicMaterial({ color, map, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide });
    const K = {
      white: ph(0xe9e6df, 0x1e1d1b, 0x666666), red: ph(0xd8201a, 0x5a0806), dark: ph(0x1c1d20), olive: ph(0x4c5532, 0x0d0f08, 0x333333),
      oliveD: ph(0x343b22), yellow: ph(0xf0c020, 0x403005), brass: ph(0xc8962e, 0x2a1c05, 0xffe0a0), copper: ph(0xb0603a, 0x200c04, 0xffc0a0),
    };
    const colors = { health: 0x3dff7a, ammo: 0xffc030 };
    const G = {
      ring: new THREE.RingGeometry(0.42, 0.52, 40).rotateX(-Math.PI / 2), disc: new THREE.CircleGeometry(0.75, 24).rotateX(-Math.PI / 2),
      beam: new THREE.CylinderGeometry(0.1, 0.32, 2.4, 16, 1, true).translate(0, 1.2, 0),
      shadow: new THREE.CircleGeometry(0.28, 20).rotateX(-Math.PI / 2),
    };
    const box = (g, sx, sy, sz, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); o.position.set(x, y, z); g.add(o); return o; };
    function medkit() {
      const g = new THREE.Group();
      box(g, 0.4, 0.26, 0.16, K.white, 0, 0, 0);
      box(g, 0.41, 0.03, 0.165, K.dark, 0, 0.03, 0);                       // fecho
      for (const z of [-0.081, 0.081]) { box(g, 0.2, 0.06, 0.004, K.red, 0, -0.03, z); box(g, 0.06, 0.2, 0.004, K.red, 0, -0.03, z); }
      box(g, 0.16, 0.025, 0.04, K.dark, 0, 0.15, 0); box(g, 0.025, 0.03, 0.04, K.dark, -0.07, 0.135, 0); box(g, 0.025, 0.03, 0.04, K.dark, 0.07, 0.135, 0);
      return g;
    }
    function ammoCan() {
      const g = new THREE.Group();
      box(g, 0.42, 0.22, 0.2, K.olive, 0, 0, 0);
      box(g, 0.44, 0.04, 0.22, K.oliveD, 0, 0.12, 0);                      // tampa
      box(g, 0.43, 0.045, 0.205, K.yellow, 0, -0.035, 0);                  // faixa
      box(g, 0.2, 0.02, 0.03, K.dark, 0, 0.16, 0);
      for (let i = 0; i < 4; i++) {                                          // balas em cima
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.09, 10), K.brass);
        b.rotation.z = Math.PI / 2; b.position.set(0, 0.165, -0.06 + i * 0.04); g.add(b);
        const t = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.035, 10), K.copper);
        t.rotation.z = -Math.PI / 2; t.position.set(0.062, 0.165, -0.06 + i * 0.04); g.add(t);
      }
      return g;
    }
    return { K, G, colors, add, glowTex, beamTex, build: (kind) => (kind === "health" ? medkit() : ammoCan()) };
  })();

  class PickupView {
    constructor(kind) {
      const c = PK.colors[kind];
      this.root = new THREE.Group();
      this.item = PK.build(kind); this.root.add(this.item);
      this.item.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      this.mats = [PK.add(c, null, 0.9), PK.add(c, PK.glowTex, 0.55), PK.add(c, PK.beamTex, 0.35)];
      this.ring = new THREE.Mesh(PK.G.ring, this.mats[0]);
      this.glow = new THREE.Mesh(PK.G.disc, this.mats[1]);
      this.beam = new THREE.Mesh(PK.G.beam, this.mats[2]);
      this.shadow = new THREE.Mesh(PK.G.shadow, M.shadow);
      for (const o of [this.ring, this.glow, this.beam, this.shadow]) { o.renderOrder = 2; this.root.add(o); }
      this.ring.position.y = 0.025; this.glow.position.y = 0.02; this.shadow.position.y = 0.015;
      scene.add(this.root);
    }
    update(p, t) {
      put(this.root, p.x, p.y, 0);
      const pop = Math.min(1, p.age / 0.25), s = 0.4 + 0.6 * pop * (2 - pop);
      const hover = p.landed ? 0.42 + Math.sin(p.age * 3) * 0.06 + p.h : 0.2 + p.h;
      this.item.position.y = hover; this.item.scale.setScalar(s * (1 + 0.15 * p.pull));
      this.item.rotation.set(p.landed ? 0.15 : p.age * 9, p.age * 1.6, p.landed ? 0 : p.age * 6);
      const blink = p.ttl > 6 || Math.floor(p.ttl * 6) % 2 === 0;
      this.root.visible = blink;
      const pulse = 0.5 + 0.5 * Math.sin(t * 4 + p.age);
      const on = p.landed ? 1 : 0.3;
      this.mats[0].opacity = (0.55 + 0.4 * pulse) * on;
      this.mats[1].opacity = (0.3 + 0.25 * pulse) * on;
      this.mats[2].opacity = (0.18 + 0.12 * pulse) * on * (1 - 0.7 * p.pull);
      this.ring.scale.setScalar(1 + 0.12 * pulse);
      this.shadow.scale.setScalar(Math.max(0.3, 1 - hover * 0.6));
    }
    destroy() { scene.remove(this.root); for (const m of this.mats) m.dispose(); }
  }

  // ======================================================================
  //  EFEITOS (todos reaproveitados, nada é criado durante o jogo)
  // ======================================================================
  class Pool {
    constructor(geo, material, n, o) {
      this.o = Object.assign({ g: 9.8, floor: 0.03, bounce: 0, fade: 0.25, shadow: false }, o || {});
      this.items = []; this.cursor = 0;
      for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, material); m.visible = false; scene.add(m); this.items.push({ m, life: 0, size: 1, vx: 0, vy: 0, vz: 0, sx: 0, sy: 0 }); }
    }
    emit(x, y, z, vx, vy, vz, life, size, spin) {
      const it = this.items[this.cursor]; this.cursor = (this.cursor + 1) % this.items.length;
      it.m.position.set(x, y, z); it.vx = vx; it.vy = vy; it.vz = vz; it.life = life; it.size = size; it.sx = spin || 0; it.sy = (spin || 0) * 0.7;
      it.m.rotation.set(Math.random() * 3, Math.random() * 3, 0); it.m.visible = true; it.m.scale.set(size, size, size);
    }
    update(dt) {
      const o = this.o;
      for (const it of this.items) {
        if (it.life <= 0) continue;
        it.life -= dt;
        if (it.life <= 0) { it.m.visible = false; continue; }
        const p = it.m.position;
        it.vy -= o.g * dt; p.x += it.vx * dt; p.y += it.vy * dt; p.z += it.vz * dt;
        if (p.y < o.floor) {
          p.y = o.floor;
          if (o.bounce > 0 && it.vy < -0.8) { it.vy = -it.vy * o.bounce; it.vx *= 0.5; it.vz *= 0.5; it.sx *= 0.6; it.sy *= 0.6; }
          else { it.vy = 0; it.vx = it.vz = 0; it.sx = it.sy = 0; }
        }
        it.m.rotation.x += it.sx * dt; it.m.rotation.y += it.sy * dt;
        const s = it.size * Math.min(1, it.life / o.fade);
        it.m.scale.set(s, s, s);
      }
    }
  }
  const fxBlood = new Pool(new THREE.BoxGeometry(0.07, 0.07, 0.07), M.blood, 80);
  const fxSpark = new Pool(new THREE.BoxGeometry(0.04, 0.04, 0.04), M.spark, 36);
  const brass = new THREE.MeshLambertMaterial({ color: 0xc8a040, emissive: 0x403010 });
  const shellRed = new THREE.MeshLambertMaterial({ color: 0xb02010, emissive: 0x300800 });
  const fxBrass = new Pool(new THREE.CylinderGeometry(0.006, 0.006, 0.03, 6), brass, 40, { floor: 0.008, bounce: 0.35, fade: 0.6 });
  const fxShell = new Pool(new THREE.CylinderGeometry(0.011, 0.011, 0.07, 8), shellRed, 20, { floor: 0.011, bounce: 0.3, fade: 0.6 });

  const puffTex = (function () {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 2, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  class Smoke {
    constructor(n) {
      this.items = []; this.cursor = 0;
      for (let i = 0; i < n; i++) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, transparent: true, depthWrite: false, opacity: 0, color: 0xb8bcc4 }));
        sp.visible = false; scene.add(sp); this.items.push({ sp, life: 0, max: 1, size: 0.3, vx: 0, vy: 0, vz: 0, a: 0.3 });
      }
    }
    emit(x, y, z, size, life, a, vx, vy, vz) {
      const it = this.items[this.cursor]; this.cursor = (this.cursor + 1) % this.items.length;
      it.sp.position.set(x, y, z); it.life = it.max = life; it.size = size; it.a = a; it.vx = vx || 0; it.vy = vy === undefined ? 0.25 : vy; it.vz = vz || 0;
      it.sp.visible = true;
    }
    update(dt) {
      for (const it of this.items) {
        if (it.life <= 0) continue;
        it.life -= dt;
        if (it.life <= 0) { it.sp.visible = false; continue; }
        const k = 1 - it.life / it.max, p = it.sp.position;
        p.x += it.vx * dt; p.y += it.vy * dt; p.z += it.vz * dt;
        const s = it.size * (1 + k * 2.2); it.sp.scale.set(s, s, 1);
        it.sp.material.opacity = it.a * (1 - k) * Math.min(1, k * 8);
      }
    }
  }
  const fxSmoke = new Smoke(28);

  class Tracers {
    constructor(n) {
      this.items = []; this.cursor = 0;
      const geo = new THREE.BoxGeometry(0.012, 0.012, 1);
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
        m.visible = false; scene.add(m); this.items.push({ m, life: 0 });
      }
    }
    emit(ax, ay, az, bx, by, bz, faint) {
      const it = this.items[this.cursor]; this.cursor = (this.cursor + 1) % this.items.length;
      const dx = bx - ax, dy = by - ay, dz = bz - az, len = Math.max(0.1, Math.hypot(dx, dy, dz));
      it.m.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2); it.m.scale.set(1, 1, len); it.m.lookAt(bx, by, bz);
      it.life = 0.07; it.m.material.opacity = faint ? 0.25 : 0.8; it.m.visible = true;
    }
    update(dt) { for (const it of this.items) { if (it.life <= 0) continue; it.life -= dt; if (it.life <= 0) it.m.visible = false; } }
  }
  const fxTrace = new Tracers(10);

  const holeMat = new THREE.MeshBasicMaterial({ color: 0x060606, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const holes = []; let holeCur = 0;
  for (let i = 0; i < 90; i++) { const m = new THREE.Mesh(new THREE.CircleGeometry(0.035, 8), holeMat); m.visible = false; scene.add(m); holes.push(m); }
  function bulletHole(tx, ty, tz, nx, ny, nz) {
    const m = holes[holeCur]; holeCur = (holeCur + 1) % holes.length;
    m.position.set(tx + nx * 0.006, ty + ny * 0.006, tz + nz * 0.006);
    m.lookAt(tx + nx, ty + ny, tz + nz); m.rotateZ(Math.random() * 6); const s = 0.7 + Math.random() * 0.8; m.scale.set(s, s, s); m.visible = true;
  }
  const poolMat = new THREE.MeshBasicMaterial({ color: 0x4a0606, transparent: true, opacity: 0.88, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const bpools = []; let bpCur = 0;
  for (let i = 0; i < 24; i++) { const m = new THREE.Mesh(new THREE.CircleGeometry(0.5, 14), poolMat); m.rotation.x = -Math.PI / 2; m.visible = false; scene.add(m); bpools.push({ m, age: 9, size: 1 }); }
  function bloodPool(lx, ly, big) {
    const b = bpools[bpCur]; bpCur = (bpCur + 1) % bpools.length;
    b.age = 0; b.size = (big ? 1.5 : 1) * (0.8 + Math.random() * 0.5); put(b.m, lx, ly, 0.016 + Math.random() * 0.004); b.m.scale.set(0.1, 0.1, 0.1); b.m.visible = true;
  }
  function updatePools(dt) { for (const b of bpools) { if (!b.m.visible) continue; b.age += dt; const k = Math.min(1, b.age / 2.2), s = 0.15 + b.size * (1 - Math.pow(1 - k, 2)); b.m.scale.set(s, s, s); } }
  function resetFx() { for (const h of holes) h.visible = false; for (const b of bpools) b.m.visible = false; }

  // sangue/fagulhas a partir de coordenadas lógicas (x, y, altura)
  function bloodBurst(lx, ly, lz, n, speed, size) {
    if (!S.gore) return;
    n = Math.max(1, Math.round(n * fxK()));
    for (let k = 0; k < n; k++) {
      const a = Math.random() * 6.283, s = (0.3 + Math.random() * 0.7) * speed;
      fxBlood.emit(lx, lz, -ly, Math.cos(a) * s, (0.2 + Math.random() * 0.8) * speed, -Math.sin(a) * s, 0.35 + Math.random() * 0.45, (size || 1) * (0.6 + Math.random() * 0.7));
    }
  }
