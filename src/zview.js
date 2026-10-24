  // ======================================================================
  //  ZUMBI (visual): corpo + rosto + cabelo + ferimentos. Tudo sorteado quando o zumbi nasce:
  //  cada um pode ou não ter partes faltando, sangue, ossos à mostra e feridas — nunca o mesmo padrão.
  // ======================================================================
  const HOLES = [[0.5, 0.85], [-0.5, 0.85], [1.0, 1.0], [-1.0, 1.0], [0, 0.6], [0.9, 0.5], [-0.9, 0.5]];
  const PINK = [0xff2a8a, 0x2ab04a, 0x2a6ae0, 0xe0a020, 0x8a2ae0];
  const lathePts = (pts) => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(Math.max(1e-4, p[0]), p[1])), 12);
  const cutLimb = (r1, rm, r2, len, k) => lathePts([[0, -len], [r2, -len], [rm, -len * k], [r1, -0.03], [r1 * 0.8, r1 * 0.45], [0, r1 * 0.7]]);
  const ZC = {
    upperCut: cutLimb(0.058, 0.054, 0.045, 0.29, 0.35), foreCut: cutLimb(0.047, 0.048, 0.035, 0.25, 0.25),
    shinCut: cutLimb(0.058, 0.062, 0.042, 0.42, 0.25), stub: cutLimb(0.058, 0.056, 0.05, 0.1, 0.5),
    lid: new THREE.SphereGeometry(0.0128, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.46),
    eye: new THREE.SphereGeometry(0.0118, 14, 10), tooth: new THREE.BoxGeometry(0.0058, 0.0085, 0.004), gum: new THREE.BoxGeometry(1, 1, 1),
    cavity: new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    spike: new THREE.ConeGeometry(0.03, 0.2, 6), earG: new THREE.SphereGeometry(1, 8, 6), blob: new THREE.SphereGeometry(1, 10, 8),
  };

  // sorteia o "destino" do zumbi: ferimentos e partes que faltam
  function planZombie(r, A, kind, fem, limp, hatName) {
    const gm = kind === "giant" ? 1.9 : kind === "brute" || kind === "tank" ? 1.3 : 1;
    const P = { dead: 0.5 + r() * 0.5, W: {}, noEye: [], noEar: [], armCut: [0, 0], footCut: [0, 0], parts: 0 };
    const W = P.W, sd = () => (r() < 0.5 ? -1 : 1);
    const lonOf = (min, max) => sd() * (min + r() * (max - min));
    if (r() < 0.5) W.mouthBlood = 0.2 + r() * 0.8;
    if (r() < 0.24) W.noseBlood = 1;
    if (r() < 0.3) W.tears = 1;
    W.splat = Math.floor(r() * 5 * gm);
    if (r() < 0.32 * gm) { W.gash = []; for (let i = 0, n = 1 + Math.floor(r() * 2); i < n; i++) W.gash.push({ lon: lonOf(0.05, 0.85), ny: -0.5 + r() * 1.05, len: 16 + r() * 22, ang: (r() - 0.5) * 2.2, w: 3 + r() * 4 }); }
    if (r() < 0.2 * gm) { W.claws = [{ lon: lonOf(0.4, 0.8), ny: -0.1 + r() * 0.3, s: sd() }]; }
    if (r() < 0.18 * gm) { W.bite = [{ lon: lonOf(0.5, 0.95), ny: -0.5 + r() * 0.5 }]; }
    if (r() < 0.08 * gm) { W.cheekHole = sd(); P.parts++; }
    if (r() < 0.1) W.burn = sd() * (0.2 + r() * 0.4);
    if (r() < 0.07 * gm) { W.bullet = [{ lon: lonOf(0.05, 0.7), ny: 0.1 + r() * 0.5 }]; }
    const hasHat = !!hatName;
    if (!hasHat && r() < 0.11 * gm) { const h = Math.floor(r() * HOLES.length), H = HOLES[h]; P.hole = [H[0], H[1], 0.04 + r() * 0.025]; W.skullBone = { lon: H[0], ny: Math.cos(H[1]), r: 0.2 + r() * 0.12 }; P.parts++; }
    for (const s of [-1, 1]) {
      if (r() < 0.08 * gm) { P.noEye.push(s); P.parts++; }
      if (r() < 0.12 * gm) { P.noEar.push(s); P.parts++; }
    }
    if (P.noEye.length) W.noEye = P.noEye;
    if (P.noEar.length) W.noEar = P.noEar;
    P.noNose = r() < 0.05 * gm; P.lostJaw = r() < 0.05 * gm; P.eyeHang = !P.noEye.length && r() < 0.03 * gm; P.tongue = r() < 0.12;
    P.parts += (P.noNose ? 1 : 0) + (P.lostJaw ? 1 : 0) + (P.eyeHang ? 1 : 0);
    // braços e pés
    for (let i = 0; i < 2; i++) { const q = r(); P.armCut[i] = q < 0.03 * gm ? 3 : q < 0.065 * gm ? 2 : q < 0.1 * gm ? 1 : 0; if (P.armCut[i]) P.parts++; }
    if (limp) for (let i = 0; i < 2; i++) if (r() < 0.14) { P.footCut[i] = 1; P.parts++; break; }
    // corpo
    P.belly = r() < 0.16 * gm; P.gut = P.belly && r() < 0.55; P.chest = !P.belly && r() < 0.09 * gm; P.shoulderBite = r() < 0.12 * gm;
    P.splats = 1 + Math.floor(r() * 3.5 * gm); P.gashes = Math.floor(r() * 2.7 * gm); P.bites = r() < 0.22 * gm ? 1 + Math.floor(r() * 2) : 0;
    P.bullets = r() < 0.18 * gm ? 1 + Math.floor(r() * 3) : 0; P.claws = r() < 0.16; P.rot = r() < 0.22; P.hands = r() < 0.12; P.drips = r() < 0.72;
    P.bloodyHands = r() < 0.38;
    P.blood = (W.gash || W.skullBone || W.bite ? 0.25 : 0) + (r() < 0.2 ? 0.2 : 0);
    if (P.belly || P.chest) P.parts++;
    return P;
  }

  class ZombieView {
    constructor(z) {
      const r = zrng(z.id * 7919 + 13), G = ZG;
      const kind = z.tank ? "tank" : z.samurai ? "samurai" : z.giant ? "giant" : z.brute ? "brute" : z.runner ? "runner" : "walker";
      const A = ARCH[pick(r, POOL[kind])];
      const fem = A.sex === "f" || (A.sex === "mf" && r() < 0.45);
      const fat = !!A.fat || (z.brute && r() < 0.6);
      this.mats = []; this.hot = false;
      const lam = (hex, extra) => { const m = new THREE.MeshLambertMaterial(Object.assign({ color: hex }, extra || {})); m.userData.own = true; this.mats.push(m); return m; };
      const tok = (hex, extra) => { const m = new THREE.MeshLambertMaterial(Object.assign({ color: hex }, extra || {})); m.userData.own = true; return m; };   // só cor; some depois da fusão
      const vary = (hex, k) => { const c = C(hex); const f = 1 + (r() - 0.5) * (k || 0.25); c.r *= f; c.g *= f; c.b *= f; return c; };
      const dirty = (c) => { const hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h, hsl.s * (0.38 + r() * 0.22), hsl.l * (0.5 + r() * 0.2)); return c; };   // roupa suja, desbotada e escurecida
      // pele: tom humano misturado com a podridão
      const skinC = C(pick(r, SKIN_BASE)).lerp(ROT, 0.5 + r() * 0.2).multiplyScalar(0.8 + r() * 0.2);
      { const hsl = {}; skinC.getHSL(hsl); skinC.setHSL(hsl.h, hsl.s * 0.55, Math.min(0.62, hsl.l * 1.06)); }
      const hairName = pick(r, A.hairColor || ["preto", "preto", "castanho", "castanho", "castClaro", "loiro", "ruivo", "grisalho"]);
      let hairC = vary(HAIRC[hairName], 0.15).multiplyScalar(0.85);
      const hatName = (() => { let h = null; for (const [n, p] of A.hat || []) if (!h && r() < p) h = n; return h; })();
      const P = (this.plan = planZombie(r, A, kind, fem, z.limp, hatName));
      const W = P.W;
      const skin = tok(skinC), skinM = lam(skinC);
      const top = A.top ? lam(dirty(vary(pick(r, A.top)))) : skinM;
      const bot = A.bot === "same" ? top : A.bot === "skin" || !A.bot ? (A.dress ? top : skinM) : lam(dirty(vary(pick(r, A.bot))));
      const shoe = A.shoe === "skin" ? skinM : lam(vary(A.shoe, 0.15));
      const bloodC = C(0x5a0a0c);
      const handM = P.bloodyHands ? tok(skinC.clone().lerp(bloodC, 0.55)) : skin;
      const dark = M.wound, white = tok(0xd8d2c0);
      const root = (this.root = new THREE.Group()); root.rotation.order = "YXZ";
      const s = z.s, wide = z.giant ? 1.22 : z.brute ? 1.18 : fat ? 1.08 : z.runner ? 0.92 : 1;
      root.scale.set(s * wide, s * (fem ? 0.96 : 1), s * wide);
      const add = (geo, m, x, y, zz, p, shadow) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, zz); (p || root).add(o); if (shadow) o.castShadow = true; return o; };
      let bodyMats = {};
      const bodyMat = (side) => bodyMats[side] || (bodyMats[side] = (() => { const m = new THREE.MeshLambertMaterial({ vertexColors: true, side }); m.userData.own = true; this.mats.push(m); return m; })());
      const bones = [root];
      // ======== CORPO ANATÔMICO (tubos esculpidos + roupas em cascas + textura) ========
      const zsd = (r() * 900) | 0, PI = Math.PI;
      const rgbOf = (c) => [c.r, c.g, c.b];
      const skinRGB = rgbOf(skinC), topRGB = rgbOf(top.color), botRGB = A.bot === "same" ? topRGB : rgbOf(bot.color);
      const texMats = {};
      const tmat = (kind, side) => { const k = kind + (side || 0); return texMats[k] || (texMats[k] = (() => { const m = new THREE.MeshLambertMaterial({ map: ZA.tex(kind), vertexColors: true, side: side || THREE.FrontSide }); m.userData.own = true; this.mats.push(m); return m; })()); };
      const plainM = lam(0xffffff);
      const skinO = (k) => ({ mode: "skin", seed: zsd + k, rot: 0.15 + P.dead * 0.75 });
      const clothO = (k, ex) => Object.assign({ mode: "cloth", seed: zsd + k, dirt: 0.45 + r() * 0.5 }, ex || {});
      const clothKind = A.plaid ? "plaid" : "cloth";
      // põe uma peça pintada num osso; mat: "skin" | "cloth" | "plaid" | "plain"
      const body = (tg, base, opt, mat, x, y, zz, parent, shadow, sc, side) => {
        const g = ZA.paint(tg, base, opt);
        const m = new THREE.Mesh(g, mat === "plain" ? plainM : tmat(mat, side));
        m.position.set(x, y, zz); m.userData.ownGeo = true; if (shadow) m.castShadow = true;
        if (sc) m.scale.set(sc[0], sc[1], sc[2]);
        parent.add(m); return m;
      };
      const legCloth = !(A.dress || A.gown) && A.bot !== "skin";
      const stripeFn = (sx, mxk) => (x, y, zq, c, cx) => { if (x * sx > (mxk || 0.55) * cx.mx && Math.abs(zq) < 0.02) { c[0] = 0.85; c[1] = 0.85; c[2] = 0.82; } };
      const camoFn = A.camo ? ((x, y, zq, c, cx) => { if (cx.n1 < 0.34) { c[0] *= 0.55; c[1] *= 0.6; c[2] *= 0.5; } else if (cx.n3 > 0.62) { c[0] = c[0] * 0.8 + 0.1; c[1] = c[1] * 0.8 + 0.07; c[2] *= 0.65; } }) : null;
      const bandRGB = [0.8, 0.84, 0.3];
      const legOpt = (k, sx, ex) => { const o = clothO(k, Object.assign({ hemY: -0.25 }, ex || {})); const f1 = A.stripes2 ? stripeFn(sx, 0.55) : null, f2 = camoFn; if (f1 || f2) o.fn = (...a) => { if (f2) f2(...a); if (f1) f1(...a); }; return o; };
      const armOpt = (k, sx, ex) => { const o = clothO(k, ex); const f1 = A.stripes2 ? stripeFn(sx, 0.55) : null, f2 = camoFn; if (f1 || f2) o.fn = (...a) => { if (f2) f2(...a); if (f1) f1(...a); }; return o; };
      const mark = (dec, prof, y0, y1, o) => {                      // sangue e feridas num membro
        const L = ZB.CELLS, ph = () => r() * Math.PI * 2, yy = () => y0 + (y1 - y0) * r(), k = o.k || 1, op = (e) => Object.assign({ sx: k, sz: k, eps: 0.003 + (k > 1 ? 0.0025 : 0) }, e);
        if (r() < 0.38 * (o.gm || 1)) dec.add(prof, yy(), ph(), 0.08 + r() * 0.07, 0.08 + r() * 0.07, r() < 0.5 ? L.splat0 : L.splat1, op({ rot: r() * 6, tint: 0.7 + r() * 0.3 }));
        if (r() < 0.22 * (o.gm || 1)) dec.add(prof, yy(), ph(), 0.09 + r() * 0.04, 0.07 + r() * 0.03, L.tear, op({ rot: r() * 6 }));
        if (r() < 0.14 * (o.gm || 1)) dec.add(prof, yy(), ph(), 0.07 + r() * 0.03, 0.06 + r() * 0.02, L.gash, op({ rot: (r() - 0.5) * 2 }));
        if (r() < 0.09 * (o.gm || 1)) dec.add(prof, yy(), ph(), 0.07, 0.07, L.bite, op({ rot: r() * 6 }));
        if (r() < 0.12) dec.add(prof, yy(), ph(), 0.08, 0.1, L.claws, op({ rot: r() * 0.5 }));
        if (r() < 0.14) dec.add(prof, yy(), ph(), 0.1, 0.1, L.bruise, op({ rot: r() * 6 }));
        if (r() < 0.1) dec.add(prof, yy(), ph(), 0.09, 0.09, L.rot, op({ rot: r() * 6 }));
        if (r() < 0.16) dec.add(prof, yy(), ph(), 0.1, 0.12, L.smear, op({ rot: r() * 6 }));
        if (r() < 0.2) dec.add(prof, y0 + (y1 - y0) * 0.8, ph(), 0.09, 0.2, L.drips, op({ tint: 0.8 }));
        return dec;
      };
      // ----- bacia e cinto -----
      const hipX = fem ? 0.088 : fat ? 0.108 : 0.095;
      body(ZA.part("pelvis", { cloth: legCloth }), legCloth ? botRGB : skinRGB, legCloth ? clothO(1) : skinO(1), legCloth ? "cloth" : "skin", 0, 0.92, 0, root, true, [fem ? 1.06 : fat ? 1.22 : 1, 1, fat ? 1.25 : 1]);
      // ----- pernas -----
      const legW = fem ? 0.92 : fat ? 1.12 : 1;
      const footKind = A.shoe === "skin" ? "bare" : A.boot ? "boot" : "shoe";
      const shoeRGB = A.shoe === "skin" ? skinRGB : rgbOf(shoe.color).map((v) => v * (0.62 + r() * 0.2));
      const leg = (sx, idx) => {
        const hip = new THREE.Group(); hip.position.set(sx * hipX, 0.9, 0); root.add(hip); bones.push(hip);
        const pants = legCloth && !A.shorts, cut = P.footCut[idx];
        if (pants) body(ZA.part("thigh", { cloth: true }), botRGB, legOpt(2 + idx * 7, sx), clothKind === "plaid" ? "cloth" : "cloth", 0, 0, 0, hip, true, [legW, 1, legW]);
        else {
          body(ZA.part("thigh"), skinRGB, skinO(2 + idx * 7), "skin", 0, 0, 0, hip, true, [legW, 1, legW]);
          if (A.shorts && legCloth) body(ZA.part("thigh", { cloth: true, y1: -0.3, hem: 0.03, infl: 1.1 }), botRGB, legOpt(3 + idx * 7, sx), "cloth", 0, 0, 0, hip, true, [legW, 1, legW], THREE.DoubleSide);
        }
        const knee = new THREE.Group(); knee.position.set(0, -0.44, 0); hip.add(knee); bones.push(knee);
        if (pants) body(ZA.part("shin", { cloth: true, openBot: true, hem: cut ? 0.012 : 0.016 }), botRGB, legOpt(4 + idx * 7, sx), "cloth", 0, 0, 0, knee, true, [legW, 1, legW], THREE.DoubleSide);
        else body(ZA.part("shin", { openBot: !!cut }), skinRGB, skinO(4 + idx * 7), "skin", 0, 0, 0, knee, true, [legW, 1, legW]);
        if (cut) { const st = ZB.stump(0.034 * legW, 0.05); st.position.y = -0.44; knee.add(st); }
        else {
          const T = ZA.footTpl(footKind), fm = ZA.fromTpl(T, (p, o) => {
            if (p === 3) { o[0] = o[1] = o[2] = 0.05; }
            else if (p === 4) { const lt = (shoeRGB[0] + shoeRGB[1] + shoeRGB[2]) / 3 > 0.45 ? 0.5 : 0.16; o[0] = o[1] = lt; o[2] = lt * 0.95; }
            else { const k = p === 2 ? 1.06 : 1; o[0] = shoeRGB[0] * k; o[1] = shoeRGB[1] * k; o[2] = shoeRGB[2] * k; }
          }, zsd + idx);
          const fo = new THREE.Mesh(fm, plainM); fo.position.set(0, -0.46, 0); fo.scale.set(legW, 1, legW); fo.castShadow = true; fo.userData.ownGeo = true; knee.add(fo);
        }
        const lk = pants ? 1.062 : 1;                                 // decalques acompanham a superfície (roupa ou pele)
        const d1 = mark(new ZB.Decals(), "thigh", -0.38, -0.06, { gm: 0.8, k: lk });
        if (!d1.empty) { const m = d1.mesh(); m.scale.set(legW, 1, legW); hip.add(m); }
        const d2 = mark(new ZB.Decals(), "shin", -0.36, -0.06, { gm: 0.8, k: lk });
        if (!d2.empty) { const m = d2.mesh(); m.scale.set(legW, 1, legW); knee.add(m); }
        if (r() < 0.05) { const bp = ZB.bonePoke(0.1, 0.012); bp.position.set(0.045 * legW, -0.2, -0.04); bp.rotation.set(-0.5, 0, 0.4); knee.add(bp); }   // osso saindo
        return { hip, knee };
      };
      const lL = leg(-1, 0), lR = leg(1, 1);
      // ----- tronco -----
      const spine = (this.spine = new THREE.Group()); spine.position.y = 0.98; root.add(spine); bones.push(spine);
      const profName = fat ? "torsoFat" : fem ? "torsoF" : "torsoM";
      const tOpt = { cloth: true };
      if (A.belt && !fat) {
        body(ZA.beltGeo(false), [0.07, 0.05, 0.04], { mode: "cloth", seed: zsd + 9, dirt: 0.3 }, "plain", 0, -0.01, 0, spine);
        const bk = add(G.plate, tok(0xb8a050), 0, 0.0, -0.1085, spine); bk.scale.set(0.028, 0.024, 0.008);
      }
      {
        const neckLine = A.tie || A.hoodie || A.coat || A.camo || A.stripes || A.badge ? "none" : (fem || A.dress || A.gown || A.vestOnly) ? "v" : "round";
        const armhole = A.sleeve === "none" && !A.vestOnly && !A.gown;
        const gownCut = A.gown;
        const skinMix = (c, m, sh) => { c[0] += (skinRGB[0] * sh - c[0]) * m; c[1] += (skinRGB[1] * sh - c[1]) * m; c[2] += (skinRGB[2] * sh - c[2]) * m; };
        const fT = (x, y, zq, c, cx) => {
          if (camoFn) camoFn(x, y, zq, c, cx);
          if (neckLine !== "none") {
            const ax = Math.abs(x), yv = zq < 0 ? (neckLine === "v" ? 0.395 + 0.5 * ax : 0.425 + 0.32 * ax) : 0.455;
            const m = ZA.sst(yv - 0.006, yv + 0.006, y); if (m > 0) skinMix(c, m, 0.95);
          }
          if (armhole && y > 0.3) { const m = ZA.sst(0.12, 0.134, Math.abs(x)) * ZA.sst(0.3, 0.32, y); if (m > 0) skinMix(c, m, 0.95); }
          if (A.vestOnly && zq < 0.02 && y > 0.04) { const m = 1 - ZA.sst(0.05 + 0.04 * (y - 0.04), 0.07 + 0.04 * (y - 0.04), Math.abs(x)); if (m > 0) skinMix(c, m, 0.92); }
          if (A.stripes2 && Math.abs(zq) < 0.025 && Math.abs(x) > 0.8 * cx.mx) { c[0] = 0.85; c[1] = 0.85; c[2] = 0.82; }
        };
        const tC = A.vestOnly ? [0.07, 0.065, 0.06] : topRGB;
        const plaidNeck = A.plaid && neckLine !== "none";
        if (plaidNeck) body(ZA.part(profName), skinRGB, skinO(10), "skin", 0, 0, 0, spine, true);
        body(ZA.part(profName, plaidNeck ? { cloth: true, y0: 0.44 } : tOpt), tC, clothO(10, { fn: plaidNeck ? camoFn : fT, hemY: 0.05, hemAmt: 0.25, dirt: A.vestOnly ? 0.2 : undefined }), A.vestOnly ? "cloth" : clothKind, 0, 0, 0, spine, true, null, plaidNeck ? THREE.DoubleSide : undefined);
        var decK = 1.046;
      }
      let coatM = null;
      if (A.dress) { const sk = body(ZA.skirtGeo(), topRGB, clothO(11, { hemY: -0.22 }), "cloth", 0, 0, 0, spine, true, null, THREE.DoubleSide); }
      if (A.gown) body(ZA.gownGeo(), topRGB, clothO(11, { hemY: -0.2 }), "cloth", 0, 0, 0, spine, true, null, THREE.DoubleSide);
      if (!A.dress && !A.gown && !A.belt && !A.vestOnly && A.bot !== "same" && legCloth) body(ZA.hemGeo(fat), topRGB, clothO(12, { hemY: -0.08 }), "cloth", 0, 0, 0, spine, false, null, THREE.DoubleSide);
      if (A.coat) {
        const cc = rgbOf(dirty(vary(A.coat, 0.15))); coatM = cc;
        body(ZA.part(profName, { cloth: true, infl: 1.105, phi0: PI + 0.34, phi1: 3 * PI - 0.34 }), cc, clothO(13, { hemY: 0.1 }), "cloth", 0, 0, 0, spine, true, null, THREE.DoubleSide);
        body(ZA.coatGeo(), cc, clothO(14, { hemY: -0.3 }), "cloth", 0, 0, 0, spine, true, null, THREE.DoubleSide);
        decK = 1.106;
      }
      if (A.vest) {
        const vc = rgbOf(C(A.vest));
        body(ZA.part(profName, { cloth: true, infl: 1.115, y0: 0.4, y1: 0.0 }), vc, clothO(15, { dirt: 0.7 }), "cloth", 0, 0, 0, spine, true, null, THREE.DoubleSide);
        for (const px of [-0.075, 0.075]) { const f = ZA.front(profName, { cloth: true, infl: 1.115 }, px, 0.14, 0.012); const pc = add(G.plate, tok(0x2e3220), f[0], f[1], f[2], spine); pc.scale.set(0.06, 0.07, 0.022); }
        decK = 1.116;
      }
      if (A.apron) {
        const ap = rgbOf(C(A.apron)).map((v) => v * 0.8);
        body(ZA.part(profName, { cloth: true, infl: 1.1, phi0: PI - 0.85, phi1: PI + 0.85, y0: 0.34, y1: -0.04 }), ap, clothO(16, { dirt: 1 }), "cloth", 0, 0, 0, spine, false, null, THREE.DoubleSide);
        body(ZA.part("pelvis", { cloth: true, infl: 1.1, phi0: PI - 0.85, phi1: PI + 0.85, y1: -0.1 }), ap, clothO(17, { dirt: 1 }), "cloth", 0, -0.06, 0, spine, false, fat ? [1.22, 1, 1.25] : null, THREE.DoubleSide);
        decK = 1.1;
      }
      if (A.tie) {
        const tc = rgbOf(C(pick(r, A.tie)));
        const knot = ZA.ribbon(profName, { cloth: true, hw: 0.02, yTop: 0.405, yBot: 0.378, eps: 0.0045 }), blade = ZA.ribbon(profName, { cloth: true, hw: 0.019, yTop: 0.378, yBot: 0.17, eps: 0.0045 });
        add(knot, tok(new THREE.Color().setRGB(tc[0], tc[1], tc[2])), 0, 0, 0, spine); add(blade, tok(new THREE.Color().setRGB(tc[0] * 0.9, tc[1] * 0.9, tc[2] * 0.9)), 0, 0, 0, spine);
      }
      if (A.badge) { const f = ZA.front(profName, { cloth: true }, -0.075, 0.32, 0.006); const bd = add(G.plate, tok(0xd8b040), f[0], f[1], f[2], spine); bd.scale.set(0.034, 0.04, 0.008); }
      if (A.stripes2) for (const px of [-0.06, 0.06]) add(ZA.ribbon(profName, { cloth: true, xc: px, hw: 0.007, yTop: 0.4, yBot: 0.0, eps: 0.0035 }), white, 0, 0, 0, spine);
      if (A.stripes) for (const by of [0.09, 0.27]) body(ZA.part(profName, { cloth: true, infl: 1.075, y0: by + 0.034, y1: by }), bandRGB, clothO(18, { dirt: 0.2 }), "cloth", 0, 0, 0, spine, false, null, THREE.DoubleSide);
      if (A.hoodie) { const f = ZA.front(profName, { cloth: true }, 0, 0.1, 0.008); add(ZA.ribbon(profName, { cloth: true, hw: 0.1, yTop: 0.16, yBot: 0.04, eps: 0.006 }), tok(top.color.clone().multiplyScalar(0.88)), 0, 0, 0, spine); }
      // ----- sangue e feridas no tronco (decalques moldados na superfície) -----
      {
        const L = ZB.CELLS, D = new ZB.Decals(), PI2 = Math.PI;
        const dopt = (o) => Object.assign({ sx: decK, sz: decK, eps: 0.0045 }, o || {});
        const front = () => PI2 + (r() - 0.5) * 1.9, any = () => (r() < 0.65 ? front() : r() * PI2 * 2);
        if (P.drips) D.add(profName, 0.3, PI2 + (r() - 0.5) * 0.4, 0.14, 0.3, L.drips, dopt({ tint: 0.7 + r() * 0.3 }));
        for (let i = 0; i < P.splats; i++) D.add(profName, 0.06 + r() * 0.34, any(), 0.09 + r() * 0.12, 0.09 + r() * 0.12, r() < 0.5 ? L.splat0 : L.splat1, dopt({ rot: r() * 6, tint: 0.65 + r() * 0.35 }));
        for (let i = 0; i < P.gashes; i++) D.add(profName, 0.08 + r() * 0.3, any(), 0.11 + r() * 0.06, 0.07 + r() * 0.03, L.gash, dopt({ rot: (r() - 0.5) * 2.4 }));
        for (let i = 0; i < P.bites; i++) D.add(profName, 0.1 + r() * 0.3, any(), 0.09 + r() * 0.04, 0.09 + r() * 0.04, L.bite, dopt({ rot: r() * 6 }));
        for (let i = 0; i < P.bullets; i++) D.add(profName, 0.08 + r() * 0.32, any(), 0.045, 0.045, L.bullet, dopt({ rot: r() * 0.4 }));
        if (P.claws) D.add(profName, 0.22 + r() * 0.1, any(), 0.12, 0.14, L.claws, dopt({ rot: (r() - 0.5) }));
        if (P.rot) D.add(profName, 0.1 + r() * 0.25, any(), 0.12, 0.12, L.rot, dopt({ rot: r() * 6 }));
        if (P.hands) D.add(profName, 0.2, PI2 + (r() - 0.5) * 2, 0.11, 0.13, L.hand, dopt({ rot: (r() - 0.5) * 2 }));
        if (P.shoulderBite) { const sd = r() < 0.5 ? -1 : 1; D.add(profName, 0.37, PI2 + sd * 0.95, 0.13, 0.1, L.bite, dopt({ rot: r() * 6 })); D.add(profName, 0.3, PI2 + sd * 0.95, 0.1, 0.2, L.drips, dopt({ tint: 0.9 })); }
        if (P.belly) D.add(profName, 0.1, PI2, (fat ? 0.2 : 0.16), 0.17, L.belly, dopt({ rot: (r() - 0.5) * 0.4, eps: 0.0055 }));
        if (P.chest) D.add(profName, 0.26, PI2 + (r() - 0.5) * 0.5, 0.15, 0.17, L.chest, dopt({ eps: 0.0055 }));
        if (!D.empty) spine.add(D.mesh());
        const ZS = ZA.surf(profName, { cloth: true }), zf = (y) => { const p = ZS.f(y); return p[2] - p[1]; };
        if (P.gut) { const g = (this.guts = ZB.intestines(r)); g.position.set((r() - 0.5) * 0.06, 0.12, zf(0.12) - 0.012); spine.add(g); }
        if (P.chest) { const rb = ZB.ribs(4); rb.position.set(0, 0.2, zf(0.2) + 0.004); spine.add(rb); }
        if (z.giant) for (let i = 0; i < 6; i++) {                                  // espinhos de osso nas costas
          const sp = add(ZC.spike, tok(0xcfc6aa), (r() - 0.5) * 0.16, 0.06 + i * 0.07, (fat ? 0.17 : 0.106) + 0.02, spine); sp.rotation.x = Math.PI / 2 + 0.3 + r() * 0.2; sp.scale.set(0.7 + r() * 0.5, 0.7 + r() * 0.8, 0.7);
        }
      }
      // ----- pescoço e cabeça -----
      { const ns = fat ? 1.25 : fem ? 0.85 : 1; body(ZA.part("neck"), skinRGB, skinO(20), "skin", 0, 0.43, 0.008, spine, false, [ns, 1, ns]); }
      add(G.stump, dark, 0, 0.545, 0.008, spine);                         // aparece se a cabeça explodir
      const head = (this.head = new THREE.Group()); head.position.set(0, 0.515, -0.008); spine.add(head); bones.push(head);
      try { this.buildHead(r, { head, fem, skinC, hairC, hairName, A, P, W, hatName, z, tok, lam, vary, white, add, kind, top }); }
      catch (e) { console.error("cabeça:", e); const sk = add(G.skull, skinM, 0, 0.12, 0, head); }
      if (A.hoodie && hatName !== "hood") add(G.hoodDown, top, 0, 0.44, 0.085, spine);
      // ----- braços -----
      const shX = fem ? 0.178 : fat ? 0.245 : 0.2, armW = fem ? 0.86 : fat || z.brute ? 1.3 : z.runner ? 0.88 : 1;
      const longS = A.sleeve === "long", shortS = A.sleeve === "short" && !A.vestOnly;
      const handRGB = P.bloodyHands ? skinRGB.map((v, i) => v + ([0.35, 0.04, 0.05][i] - v) * 0.5) : skinRGB;
      const claw = r() < 0.55;
      const arm = (sx, idx) => {
        const cut = P.armCut[idx];                                    // 0 inteiro, 1 sem mão, 2 sem antebraço, 3 só toco
        const sh = new THREE.Group(); sh.position.set(sx * shX, 0.372, 0); spine.add(sh); bones.push(sh);
        if (z.giant) sh.scale.set(1.1, 1.22, 1.1);
        const aw = [armW, 1, armW];
        const uOpt = cut === 3 ? { y1: -0.1 } : cut === 2 ? { openBot: true } : {};
        const ck = (cl) => Object.assign({ cloth: true }, uOpt, cl || {});
        if (longS) body(ZA.part("upper", ck()), topRGB, armOpt(30 + idx, sx, { hemY: -0.2 }), clothKind, 0, 0, 0, sh, true, aw);
        else {
          body(ZA.part("upper", uOpt), skinRGB, skinO(30 + idx), "skin", 0, 0, 0, sh, true, aw);
          if (shortS && cut < 2) body(ZA.part("upper", { cloth: true, y0: 0.04, y1: -0.13, hem: 0.022, infl: 1.1 }), topRGB, armOpt(32 + idx, sx), clothKind, 0, 0, 0, sh, true, aw, THREE.DoubleSide);
        }
        if (coatM && cut < 2) body(ZA.part("upper", { cloth: true, infl: 1.13, hem: 0.01, y1: -0.28 }), coatM, clothO(34 + idx, { hemY: -0.2 }), "cloth", 0, 0, 0, sh, true, aw, THREE.DoubleSide);
        const el = new THREE.Group(); el.position.set(0, -0.29, 0); sh.add(el); bones.push(el);
        const hand = new THREE.Group(); hand.position.set(0, -0.258, 0); el.add(hand); bones.push(hand);
        if (cut === 3) { const st = ZB.stump(0.052 * armW, 0.05); st.position.y = -0.1; sh.add(st); }
        else {
          if (cut === 2) { const st = ZB.stump(0.042 * armW, 0.05); st.position.y = -0.305; sh.add(st); }
          else {
            if (longS) body(ZA.part("fore", { cloth: true, openBot: true, hem: 0.014 }), topRGB, armOpt(36 + idx, sx, { hemY: -0.1 }), clothKind, 0, 0, 0, el, true, aw, THREE.DoubleSide);
            else body(ZA.part("fore", { openBot: cut === 1 }), skinRGB, skinO(36 + idx), "skin", 0, 0, 0, el, true, aw);
            if (coatM) body(ZA.part("fore", { cloth: true, infl: 1.14, openBot: true, hem: 0.016 }), coatM, clothO(38 + idx, { hemY: -0.1 }), "cloth", 0, 0, 0, el, true, aw, THREE.DoubleSide);
            if (A.stripes) body(ZA.part("fore", { cloth: true, infl: 1.075, y0: -0.07, y1: -0.1 }), bandRGB, clothO(39, { dirt: 0.2 }), "cloth", 0, 0, 0, el, false, aw, THREE.DoubleSide);
            if (cut === 1) { const st = ZB.stump(0.032 * armW, 0.04); st.position.y = -0.258; el.add(st); }
            else {
              const hm = ZA.fromTpl(ZA.handTpl(-sx, claw ? 1 : 0), (p, o) => {
                const k = p === 2 ? 0.88 : p === 1 ? 0.97 : 1; o[0] = handRGB[0] * k + (p === 2 ? 0.05 : 0); o[1] = handRGB[1] * k + (p === 2 ? 0.04 : 0); o[2] = handRGB[2] * k;
              }, zsd + idx);
              const hmesh = new THREE.Mesh(hm, plainM); hmesh.userData.ownGeo = true; hmesh.castShadow = false; hmesh.scale.set(armW > 1.1 ? 1.2 : 1, armW > 1.1 ? 1.2 : 1, armW > 1.1 ? 1.2 : 1); hand.add(hmesh);
            }
            const k2 = longS ? 1.064 : coatM ? 1.145 : 1;
            const d2 = mark(new ZB.Decals(), "fore", -0.23, -0.04, { gm: 0.9, k: k2 }); if (!d2.empty) { const m = d2.mesh(); m.scale.set(armW, 1, armW); el.add(m); }
          }
          const k1 = longS ? 1.064 : coatM ? 1.135 : 1;
          const d1 = mark(new ZB.Decals(), "upper", -0.26, -0.04, { gm: 0.9, k: k1 });
          if (!d1.empty) { const m = d1.mesh(); m.scale.set(armW, 1, armW); sh.add(m); }
        }
        return { sh, el, hand };
      };
      const aL = arm(-1, 0), aR = arm(1, 1);
      this.sL = aL.sh; this.eL = aL.el; this.sR = aR.sh; this.eR = aR.el; this.wL = aL.hand; this.wR = aR.hand;
      this.hL = lL.hip; this.kL = lL.knee; this.hR = lR.hip; this.kR = lR.knee;
      this.limp = !!z.limp || P.footCut[0] || P.footCut[1];
      // funde as peças de cada osso: poucas chamadas de desenho por zumbi
      for (const b of bones) ZB.consolidate(b, bodyMat);
      this.shadow = new THREE.Mesh(GZ.shadow, M.shadow);
      this.seed = r() * 10;
      this.jawAng = 0;
      scene.add(root, this.shadow);
      this.free = [];
      for (const b of bones) b.traverse((o) => { if (o.isMesh && o.material && o.material.userData && o.material.userData.own && this.mats.indexOf(o.material) < 0) this.mats.push(o.material); });
    }

    // ------------------------- cabeça: crânio, rosto, olhos, boca, cabelo, chapéu -------------------------
    buildHead(r, o) {
      const { head, fem, skinC, hairC, A, P, W, hatName, z, tok, white } = o;
      const dead = P.dead;
      const hs = ZH.headFor(r, fem, dead), S = hs.shape;
      const hc = new THREE.Group(); hc.position.y = ZH.HZ; head.add(hc);
      this.hc = hc;
      const skinRGB = ZH.colArr(skinC).map((v) => Math.min(255, v * 1.12));
      const hairRGB = ZH.colArr(hairC);
      // penteado e barba
      let style = pick(r, A.hair);
      if (hatName === "hood" && style === "afro") style = "short";
      if (P.hole && (style === "afro" || style === "long" || style === "wavy" || style === "bob" || style === "curly" || style === "messy")) style = r() < 0.5 ? "short" : "buzz";
      const bald = style === "bald";
      const hairHex = style === "mohawk" && r() < 0.45 ? PINK[Math.floor(r() * PINK.length)] : null;
      const scalp = bald ? "none" : style === "buzz" ? "buzz" : style === "balding" ? "sides" : style === "mohawk" ? "mohawk" : style === "afro" ? "none" : "full";
      const recede = style === "balding" ? -0.4 : (A.sex === "m" && r() < 0.15) ? -0.18 : 0;
      let beardKind = null;
      if (!fem && r() < (A.beard || 0)) beardKind = pick(r, A.beard > 0.7 ? ["full", "full", "short", "goatee"] : ["short", "short", "goatee", "mustache", "full"]);
      const stubble = beardKind ? 0 : (!fem && r() < 0.5 ? 0.35 + r() * 0.5 : 0);
      const face = ZH.paintFace(r, { skin: skinRGB, hairRGB, dead, fem, stubble, scalp, recede, wounds: W, noBrows: r() < 0.06 });
      this.tex = face;
      const skullM = new THREE.MeshPhongMaterial({ map: face, specular: 0x222020, shininess: 12 });
      const jawM = ZH.jawMaterial(face, 0xffffff);
      this.mats.push(skullM, jawM);
      this.jawU = jawM.userData.jaw;
      const sk = new THREE.Mesh(hs.geo.skull, skullM); sk.castShadow = true; sk.userData.keep = true; hc.add(sk);
      if (!P.lostJaw) { const jw = new THREE.Mesh(hs.geo.jaw, jawM); jw.castShadow = true; jw.userData.keep = true; hc.add(jw); }
      // interior da boca
      const cav = new THREE.Mesh(ZC.cavity, new THREE.MeshLambertMaterial({ color: 0x2a0808, side: THREE.BackSide }));
      cav.material.userData.own = true; cav.position.set(0, -0.0545 * S.h, 0.002); cav.scale.set(0.058, 0.052, 0.082); hc.add(cav);
      // olhos
      const glow = z.brute;
      const eyeT = ZH.eyeTex(r, glow ? { sclera: [150, 60, 40], iris: [220, 30, 20], pupil: "rgba(40,0,0,0.95)" } : r() < 0.5 ? { sclera: [206, 196, 160], iris: [150, 158, 150], cloud: 0.55 } : { sclera: [214, 170, 160], iris: [110, 78, 52] });
      this.eyeTex = eyeT;
      const eyeM = new THREE.MeshPhongMaterial({ map: eyeT, specular: 0x999999, shininess: 80, emissive: glow ? 0x701008 : 0x16120a });
      eyeM.userData.base = glow ? 0x701008 : 0x16120a; this.mats.push(eyeM);
      const ex = 0.0322 * S.w, ey = 0.0065 * S.h, ez = -0.0887 * S.d + (S.sink - 0.0027) + 0.0085;
      const lidM = tok(skinC.clone().multiplyScalar(0.78));
      const lidDrop = 0.25 + r() * 0.5;
      for (const sx of [-1, 1]) {
        if (P.noEye.indexOf(sx) >= 0) continue;
        const hang = P.eyeHang && sx === 1;
        const eg = new THREE.Mesh(ZC.eye, eyeM); eg.userData.keep = true;
        eg.position.set(sx * ex, ey, ez); eg.rotation.y = (r() - 0.5) * 0.5;
        if (hang) {                                                     // olho pendurado pelo nervo
          eg.position.set(sx * ex * 1.05, ey - 0.06, ez - 0.012);
          const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.06, 5), tok(0x9a2a34)); cord.position.set(sx * ex, ey - 0.03, ez + 0.002); hc.add(cord);
        } else {
          const lid = new THREE.Mesh(ZC.lid, lidM); lid.position.set(sx * ex, ey, ez); lid.rotation.set(-0.75 - lidDrop * 0.5, 0, 0); hc.add(lid);
        }
        hc.add(eg);
      }
      // orelhas
      for (const sx of [-1, 1]) {
        if (P.noEar.indexOf(sx) >= 0) continue;
        const ear = new THREE.Mesh(ZC.earG, skinC.r !== undefined ? tok(skinC.clone().multiplyScalar(0.95)) : tok(0x888888));
        ear.position.set(sx * 0.079 * S.w, -0.004, 0.012); ear.scale.set(0.0075, 0.03, 0.018); ear.rotation.set(0, sx * 0.4, sx * 0.12); hc.add(ear);
      }
      // nariz arrancado
      if (P.noNose) {
        const nb = new THREE.Mesh(ZC.blob, new THREE.MeshPhongMaterial({ color: 0x8a1c24, specular: 0x886666, shininess: 50 })); nb.material.userData.own = true; nb.position.set(0, -0.0295 * S.h, -0.1035 * S.d); nb.scale.set(0.0185, 0.021, 0.015); nb.userData.keep = true; hc.add(nb);
        const nh = new THREE.Mesh(ZC.blob, tok(0x1a0204)); nh.position.set(0, -0.0285 * S.h, -0.1145 * S.d); nh.scale.set(0.011, 0.014, 0.004); hc.add(nh);
      }
      // dentes, gengiva e língua
      const jr = (this.jr = new THREE.Group()); jr.position.copy(ZH.JAW_HINGE); hc.add(jr);
      const ym = -0.0545 * S.h, tw = 0.0586, tr = 0.0773;
      const toothC = () => tok(new THREE.Color().setRGB(0.78 + r() * 0.12, 0.72 + r() * 0.12, 0.52 + r() * 0.12).multiplyScalar(0.8 + dead * 0.0));
      const nT = 8;
      for (let i = 0; i < nT; i++) {
        const lon = ((i + 0.5) / nT - 0.5) * 0.62, x = tw * 0.92 * Math.sin(lon), zz = -tr * Math.cos(lon);
        if (r() < 0.84) { const t = new THREE.Mesh(ZC.tooth, toothC()); t.position.set(x, ym + 0.0053, zz); t.rotation.y = lon; hc.add(t); }          // em cima
        if (!P.lostJaw && r() < 0.86) { const t = new THREE.Mesh(ZC.tooth, toothC()); t.position.set(x, ym - 0.0053 - ZH.JAW_HINGE.y, zz - ZH.JAW_HINGE.z); t.rotation.y = lon; t.scale.y = 0.9; jr.add(t); }       // embaixo
      }
      { const gum = new THREE.Mesh(ZC.gum, tok(0x7a2230)); gum.position.set(0, ym + 0.0105, -tr * 0.97); gum.scale.set(0.05, 0.0035, 0.006); hc.add(gum); }
      if (!P.lostJaw) {
        const tg = new THREE.Mesh(ZC.blob, tok(0x8a3a44)); tg.position.set(0, ym - 0.012 - ZH.JAW_HINGE.y, -0.045 - ZH.JAW_HINGE.z); tg.scale.set(0.017, 0.006, 0.032); jr.add(tg);
        if (P.tongue) { const tl = new THREE.Mesh(ZC.blob, tok(0x8a3a44)); tl.position.set(0, ym - 0.02 - ZH.JAW_HINGE.y, -0.085 - ZH.JAW_HINGE.z); tl.scale.set(0.016, 0.0045, 0.05); tl.rotation.x = 0.35; jr.add(tl); }
      } else {                                                             // sem mandíbula: carne rasgada e língua pendurada
        const fl = new THREE.Mesh(ZC.blob, new THREE.MeshPhongMaterial({ color: 0x8a1c24, specular: 0x886666, shininess: 50 })); fl.material.userData.own = true;
        fl.position.set(0, -0.075, -0.03); fl.scale.set(0.05, 0.032, 0.05); fl.userData.keep = true; hc.add(fl);
        const tl = new THREE.Mesh(ZC.blob, tok(0x9a4a54)); tl.position.set(0, -0.12, -0.062); tl.scale.set(0.015, 0.06, 0.009); hc.add(tl);
      }
      // cabelo
      if (style !== "bald" && style !== "buzz") {
        const seed = 1 + Math.floor(r() * 4);
        const hg = ZHair.build(style, seed, { hat: !!hatName, recede, hole: P.hole, blood: Math.round(Math.min(0.6, P.blood) * 4) / 4 });
        const hm = ZHair.mat();
        const hcol = hairHex ? C(hairHex) : hairC.clone();
        hm.color.copy(hcol).multiplyScalar(0.9); hm.userData.own = true;
        this.mats.push(hm);
        const hmesh = new THREE.Mesh(hg, hm); hmesh.userData.keep = true; hmesh.castShadow = false; hc.add(hmesh);
      }
      if (beardKind) {
        const bg = ZHair.beard(beardKind, 1 + Math.floor(r() * 4));
        const bm = ZHair.mat(); bm.color.copy(hairC).multiplyScalar(0.85); bm.userData.own = true; this.mats.push(bm);
        const bmesh = new THREE.Mesh(bg, bm); bmesh.userData.keep = true;
        bmesh.position.set(-ZH.JAW_HINGE.x, -ZH.JAW_HINGE.y, -ZH.JAW_HINGE.z);
        if (P.lostJaw) hc.add(bmesh); else jr.add(bmesh);
      }
      // chapéus
      const HS = [0.9, 0.97, 0.93];
      const hatAdd = (geo, m, x, y, zz, extra) => { const h = new THREE.Mesh(geo, m); h.position.set(x, y, zz); h.scale.set(h.scale.x * HS[0], h.scale.y * HS[1], h.scale.z * HS[2]); if (extra) extra(h); hc.add(h); return h; };
      const G = ZG, lamH = (hex) => tok(hex);
      if (hatName === "cap") { const cm = lamH(o.vary(pick(r, [0x1a3a6a, 0x7a1a1a, 0x1c1c1c, 0x4a5a2a]))); hatAdd(G.capCrown, cm, 0, 0.045, 0.004); hatAdd(G.visor, cm, 0, 0.045, -0.05); }
      else if (hatName === "police") { hatAdd(G.police, lamH(0x141a2c), 0, 0.06, 0); hatAdd(G.visor, lamH(0x0a0a0a), 0, 0.065, -0.04); hatAdd(G.plate, lamH(0xd8b040), 0, 0.11, -0.12, (h) => h.scale.set(0.025, 0.025, 0.006)); }
      else if (hatName === "beanie") hatAdd(G.beanie, lamH(o.vary(pick(r, [0x2a2a2c, 0x6a1a1a, 0x2a3a5a, 0x5a4a2a]))), 0, 0.012, 0.004);
      else if (hatName === "helmet") { const h = hatAdd(G.helmet, lamH(0x3e4630), 0, 0.04, 0.006); h.castShadow = true; }
      else if (hatName === "fire") { const fm = lamH(0xc8a020); hatAdd(G.helmet, fm, 0, 0.045, 0.006).castShadow = true; hatAdd(G.brim, fm, 0, 0.04, 0.03, (h) => h.scale.set(1, 1, 1.15)); }
      else if (hatName === "hood") { const hm = new THREE.MeshLambertMaterial({ color: o.top.color.clone(), side: THREE.DoubleSide }); hm.userData.own = true; hatAdd(G.hood, hm, 0, 0.005, 0.012); }
      else if (hatName === "bandana") hatAdd(G.beanie, lamH(0x8a1010), 0, 0.02, 0.004, (h) => h.scale.set(1.0, 0.75, 1.0));
      // fusão das peças pequenas da cabeça (dentes, orelhas, tampas, chapéu)
      ZB.consolidate(hc, (side) => { const key = "hb" + side; if (!this[key]) { this[key] = new THREE.MeshLambertMaterial({ vertexColors: true, side }); this[key].userData.own = true; this.mats.push(this[key]); } return this[key]; });
      ZB.consolidate(jr, (side) => { const key = "jb" + side; if (!this[key]) { this[key] = new THREE.MeshLambertMaterial({ vertexColors: true, side }); this[key].userData.own = true; this.mats.push(this[key]); } return this[key]; });
    }

    setJaw(a) {
      if (a === this.jawAng) return;
      this.jawAng = a;
      if (this.jawU) this.jawU.value = a;
      if (this.jr) this.jr.rotation.x = -a;
    }
    update(z) {
      const r = this.root, hot = z.hitT > 0;
      if (hot !== this.hot) { this.hot = hot; for (const m of this.mats) if (m.emissive && !m.userData.glow) m.emissive.setHex(hot ? 0x661100 : (m.userData.base || 0)); }
      put(this.shadow, z.x, z.y, 0.02);
      if (z.state === "dead") {
        this.shadow.visible = z.fall < 0.9;
        if (z.headGone) this.head.visible = false;
        put(r, z.x, z.y, 0.12 * z.fall);
        r.rotation.set(z.fall * Math.PI / 2, z.yaw, 0);
        const f = z.fall;
        this.sL.rotation.set(0.6 * (1 - f) + 2.6 * f, 0, -0.3 * f); this.sR.rotation.set(0.6 * (1 - f) + 2.2 * f, 0, 0.4 * f);
        this.eL.rotation.x = this.eR.rotation.x = 0.3; this.hL.rotation.x = this.hR.rotation.x = 0.1 * f; this.kL.rotation.x = this.kR.rotation.x = -0.15;
        this.spine.rotation.set(0.15 * f, 0, 0); this.head.rotation.set(0.3 * f, 0.5 * f, 0); this.setJaw(0.4);
        return;
      }
      const ph = z.phase, sw = Math.sin(ph), cw = Math.cos(ph), t = ph + this.seed;
      const amp = z.runner ? 0.95 : z.brute ? (z.giant ? 0.42 : 0.5) : 0.62, limp = this.limp;
      put(r, z.x, z.y, Math.abs(sw) * (z.runner ? 0.05 : 0.03));
      const lean = z.runner ? 0.25 : z.giant ? 0.2 : z.brute ? 0.1 : 0.06 + (limp ? 0.05 : 0);
      r.rotation.set(-lean * 0.4, z.yaw, limp ? sw * 0.05 : 0);
      this.spine.rotation.set(-lean * 0.8 + (z.state === "attack" ? -0.2 : 0), -sw * 0.12, sw * 0.04 + (limp ? 0.05 : 0));
      this.hL.rotation.x = sw * amp * (limp ? 0.45 : 1); this.hR.rotation.x = -sw * amp;
      this.kL.rotation.x = -(0.08 + Math.max(0, cw) * 0.9 * amp * (limp ? 0.25 : 1)); this.kR.rotation.x = -(0.08 + Math.max(0, -cw) * 0.9 * amp);
      let al, ar, el, er;
      if (z.state === "attack") { al = 1.3 + Math.sin(z.attackT * 11) * 0.55; ar = 1.3 + Math.sin(z.attackT * 11 + 1.2) * 0.55; el = er = 0.45; }
      else if (z.runner) { al = 0.3 - sw * 0.9; ar = 0.3 + sw * 0.9; el = er = 1.25; }
      else if (z.armPose < 0.33) { al = 0.08 - sw * 0.25; ar = 0.08 + sw * 0.25; el = 0.2; er = 0.25; }
      else { const s2 = Math.sin(ph * 0.5) * 0.12, base = 1.2 + z.armPose * 0.3; al = base + s2; ar = base - s2 - (z.armPose > 0.8 ? 1.0 : 0); el = 0.25 + z.armPose * 0.2; er = 0.2; }
      this.sL.rotation.set(al, 0, -0.08); this.sR.rotation.set(ar, 0, 0.08); this.eL.rotation.x = el; this.eR.rotation.x = er;
      this.wL.rotation.x = this.wR.rotation.x = 0.25;
      this.head.rotation.set(0.1 + Math.sin(ph * 0.4) * 0.1 + lean * 0.6, Math.sin(ph * 0.5) * 0.2, Math.sin(t * 0.3) * 0.15);
      this.setJaw(z.state === "attack" ? 0.5 : 0.06 + 0.26 * Math.max(0, Math.sin(t * 1.7)));
      if (this.guts) { this.guts.rotation.x = Math.sin(t * 2.1) * 0.12; this.guts.rotation.z = Math.sin(t * 1.3) * 0.08; }
    }
    destroy() {
      scene.remove(this.root, this.shadow);
      this.root.traverse((o) => { if (o.isMesh && o.geometry && (o.userData.merged || o.userData.ownGeo)) o.geometry.dispose(); });
      for (const m of this.mats) m.dispose();
      if (this.tex) this.tex.dispose();
      if (this.eyeTex) this.eyeTex.dispose();
    }
  }
