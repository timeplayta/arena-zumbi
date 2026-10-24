
  // ======================================================================
  //  MODELOS DAS ARMAS
  //  Baseados nas medidas reais das armas de referência:
  //    P45 Marshal  ~ pistola 1911 (218 mm, cano de 127 mm, empunhadura inclinada ~18°)
  //    Vespa SMG-9  ~ MP5 (680 mm, cano de 225 mm, carregador curvo, mira de tambor e massa em anel)
  //    Fuzil AX-4   ~ carabina M4 (757-838 mm, cano de 368 mm, trilho no topo, guarda-mão redondo)
  //    Brutus 12    ~ espingarda de bomba 870 (978 mm, cano de 470 mm, tubo de carregador sob o cano)
  //    Falcão .308  ~ rifle M24 (1092 mm, cano de 610 mm, luneta 10x40 de 333 mm)
  //  Técnica: silhuetas laterais em THREE.Shape extrudadas com chanfro (ExtrudeGeometry), peças
  //  redondas em LatheGeometry e materiais PBR (MeshStandardMaterial) com mapa de ambiente (PMREM).
  //  Eixos: cano para -z, topo +y, direita +x. Unidades em metros. Nos perfis, u = para a frente.
  // ======================================================================
  const GUN_ENV = new Map();
  function gunEnv(rend) {
    if (!rend) return null;
    if (GUN_ENV.has(rend)) return GUN_ENV.get(rend);
    let tex = null;
    try {
      const es = new THREE.Scene();
      es.add(new THREE.Mesh(new THREE.SphereGeometry(8, 24, 12), new THREE.MeshBasicMaterial({ color: 0x1e2229, side: THREE.BackSide })));
      const panel = (w, h, c, x, y, z) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
        m.position.set(x, y, z); m.lookAt(0, 0, 0); es.add(m);
      };
      panel(6, 2, new THREE.Color(2.4, 2.2, 1.9), 0, 6, 1);          // luz de cima, quente
      panel(2, 5, new THREE.Color(0.8, 0.9, 1.2), -6, 1, 2);       // luz lateral, fria
      panel(3, 3, new THREE.Color(1.1, 1.0, 0.9), 5, 2, -4);
      panel(10, 3, new THREE.Color(0.25, 0.22, 0.2), 0, -5, 0);    // chão escuro
      const pm = new THREE.PMREMGenerator(rend);
      tex = pm.fromScene(es, 0.03).texture;
      pm.dispose();
    } catch (e) { tex = null; }
    GUN_ENV.set(rend, tex);
    return tex;
  }
  const GUN_TEX = {};
  function gunTex(kind) {
    if (GUN_TEX[kind]) return GUN_TEX[kind];
    const c = document.createElement("canvas"), x = c.getContext("2d");
    let rep = [1, 1];
    if (kind === "checker") {                 // quadriculado de empunhadura
      c.width = c.height = 32; x.fillStyle = "#808080"; x.fillRect(0, 0, 32, 32); x.strokeStyle = "#000"; x.lineWidth = 3;
      x.beginPath(); x.moveTo(0, 16); x.lineTo(16, 0); x.moveTo(16, 32); x.lineTo(32, 16); x.moveTo(0, 16); x.lineTo(16, 32); x.moveTo(16, 0); x.lineTo(32, 16); x.stroke();
      rep = [260, 260];
    } else if (kind === "grain") {            // veios da madeira
      c.width = 256; c.height = 64; x.fillStyle = "#6b3f1e"; x.fillRect(0, 0, 256, 64);
      for (let i = 0; i < 46; i++) {
        x.strokeStyle = "rgba(" + (30 + Math.random() * 30) + "," + (14 + Math.random() * 12) + ",5," + (0.25 + Math.random() * 0.35) + ")";
        x.lineWidth = 0.5 + Math.random() * 2; x.beginPath();
        let y = Math.random() * 64; x.moveTo(0, y);
        for (let k = 0; k <= 256; k += 16) { y += (Math.random() - 0.5) * 3; x.lineTo(k, y); }
        x.stroke();
      }
      rep = [9, 9];
    } else if (kind === "stipple") {          // textura de polímero
      c.width = c.height = 64; x.fillStyle = "#7f7f7f"; x.fillRect(0, 0, 64, 64);
      for (let i = 0; i < 900; i++) { const v = Math.floor(Math.random() * 255); x.fillStyle = "rgb(" + v + "," + v + "," + v + ")"; x.fillRect(Math.random() * 64, Math.random() * 64, 1.5, 1.5); }
      rep = [90, 90];
    } else {                                  // tecido da manga
      c.width = c.height = 32; x.fillStyle = "#808080"; x.fillRect(0, 0, 32, 32); x.fillStyle = "#5a5a5a";
      for (let i = 0; i < 32; i += 4) { x.fillRect(i, 0, 2, 32); x.fillRect(0, i + 1, 32, 1); }
      rep = [40, 40];
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]);
    GUN_TEX[kind] = t;
    return t;
  }

  function buildGun(id, camoKey, at, withHands, rend) {
    at = at || {};
    const cm = CAMOS[camoKey] || CAMOS.black, w = W[id];
    const has = (k) => !!at[k] && w.attach.indexOf(k) >= 0;
    const env = gunEnv(rend || renderer);
    const std = (o) => {
      const ei = o.envI || 1; delete o.envI;
      const m = new THREE.MeshStandardMaterial(o);
      if (env) { m.envMap = env; m.envMapIntensity = ei; }
      return m;
    };
    const K = {
      steel: std({ color: 0x24262b, metalness: 0.9, roughness: 0.32 }),
      park: std({ color: 0x2c2e31, metalness: 0.7, roughness: 0.55 }),
      dark: std({ color: 0x0d0e10, metalness: 0.4, roughness: 0.7 }),
      bright: std({ color: 0x8c9096, metalness: 1, roughness: 0.25 }),
      poly: std({ color: 0x141517, metalness: 0.05, roughness: 0.72, bumpMap: gunTex("stipple"), bumpScale: 0.0006, envI: 0.3 }),
      body: std({ color: cm.c, metalness: cm.m === undefined ? 0.12 : cm.m, roughness: cm.r === undefined ? 0.62 : cm.r, emissive: cm.em || 0, bumpMap: gunTex("stipple"), bumpScale: 0.0005, envI: cm.m ? 1 : 0.3 }),
      grip: std({ color: cm.c, metalness: cm.m ? cm.m * 0.5 : 0.05, roughness: cm.r === undefined ? 0.78 : cm.r + 0.2, emissive: cm.em || 0, bumpMap: gunTex("checker"), bumpScale: 0.0012, envI: cm.m ? 0.8 : 0.25 }),
      wood: std({ color: 0x9a7d68, map: gunTex("grain"), metalness: 0, roughness: 0.48, bumpMap: gunTex("checker"), bumpScale: 0.0008, envI: 0.35 }),
      rubber: std({ color: 0x0c0c0d, metalness: 0, roughness: 0.92, envI: 0.3 }),
      brass: std({ color: 0xc08f35, metalness: 1, roughness: 0.28 }),
      copper: std({ color: 0xb4683e, metalness: 1, roughness: 0.3 }),
      shell: std({ color: 0x781410, metalness: 0.05, roughness: 0.42 }),
      glass: std({ color: 0x0c1a28, metalness: 0.2, roughness: 0.04, transparent: true, opacity: 0.88, emissive: 0x050c18, side: THREE.DoubleSide, envI: 2 }),
      lensA: std({ color: 0x3a1a5a, metalness: 0.6, roughness: 0.05, emissive: 0x100620, side: THREE.DoubleSide, envI: 2.5 }),
      dot: new THREE.MeshBasicMaterial({ color: 0xff2a20, fog: false }),
      white: new THREE.MeshBasicMaterial({ color: 0xf2f0e2 }),
      glove: std({ color: 0x111215, metalness: 0, roughness: 0.86, bumpMap: gunTex("cloth"), bumpScale: 0.0006, envI: 0.25 }),
      sleeve: std({ color: 0x2a3023, metalness: 0, roughness: 0.95, bumpMap: gunTex("cloth"), bumpScale: 0.0009, envI: 0.2 }),
      pad: std({ color: 0x26282c, metalness: 0.15, roughness: 0.5, envI: 0.5 }),
      strap: std({ color: 0x33363a, metalness: 0, roughness: 0.85, bumpMap: gunTex("cloth"), bumpScale: 0.0008, envI: 0.2 }),
      skin: std({ color: 0xb58163, metalness: 0, roughness: 0.72, envI: 0.25 }),
    };
    const g = new THREE.Group(), parts = {};
    // ---------- primitivas ----------
    const shp = (pts) => {
      const s = new THREE.Shape();
      s.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) { const p = pts[i]; if (p.length === 4) s.quadraticCurveTo(p[0], p[1], p[2], p[3]); else s.lineTo(p[0], p[1]); }
      return s;
    };
    // silhueta lateral (u para a frente, v para cima) extrudada na largura wd, centrada em x
    const ext = (pts, wd, m, o) => {
      o = o || {};
      const s = shp(pts);
      if (o.holes) for (const h of o.holes) s.holes.push(shp(h));
      const bev = Math.min(o.bev === undefined ? 0.0025 : o.bev, wd * 0.3);
      const geo = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.0004, wd - 2 * bev), bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev * 0.8, bevelSegments: 2, curveSegments: 10 });
      geo.translate(0, 0, -(wd - 2 * bev) / 2); geo.rotateY(Math.PI / 2);
      const mesh = new THREE.Mesh(geo, m); mesh.position.x = o.x || 0; (o.p || g).add(mesh); return mesh;
    };
    // peça de revolução ao longo do cano: prof = [[raio, u], ...] a partir de u0, eixo na altura v
    const lathe = (prof, m, v, u0, o) => {
      o = o || {};
      const geo = new THREE.LatheGeometry(prof.map((q) => new THREE.Vector2(Math.max(0, q[0]), q[1])), o.seg || 22);
      geo.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geo, m); mesh.position.set(o.x || 0, v, -u0); (o.p || g).add(mesh); return mesh;
    };
    const tube = (r, u0, u1, v, m, o) => lathe([[0, 0], [r, 0], [r, u1 - u0], [0, u1 - u0]], m, v, u0, o);
    const box = (sx, sy, sl, m, x, v, u, o) => {
      o = o || {};
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sl), m); mesh.position.set(x, v, -u);
      if (o.rx || o.ry || o.rz) mesh.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
      (o.p || g).add(mesh); return mesh;
    };
    const cylX = (r, len, m, x, v, u, o) => {     // cilindro atravessado (pinos, botões, tambor de mira)
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 16), m); mesh.rotation.z = Math.PI / 2; mesh.position.set(x, v, -u);
      ((o && o.p) || g).add(mesh); return mesh;
    };
    const cylY = (r, len, m, x, v, u, o) => { const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 16), m); mesh.position.set(x, v, -u); ((o && o.p) || g).add(mesh); return mesh; };
    const grp = (name, parent) => { const o = new THREE.Group(); (parent || g).add(o); if (name) parts[name] = o; return o; };
    // trilho Picatinny com dentes
    const rail = (u0, u1, v, wd, m) => {
      box(wd, 0.006, u1 - u0, m || K.park, 0, v + 0.003, (u0 + u1) / 2);
      for (let u = u0 + 0.004; u < u1 - 0.004; u += 0.01) box(wd + 0.004, 0.004, 0.0052, m || K.park, 0, v + 0.008, u);
    };
    // mira red dot (tubo com lente, estilo T1/Aimpoint)
    const redDot = (u, v) => {
      box(0.022, 0.012, 0.03, K.park, 0, v + 0.006, u);
      lathe([[0, 0], [0.0165, 0], [0.0175, 0.004], [0.0165, 0.008], [0.0165, 0.052], [0.0178, 0.056], [0.0165, 0.06], [0, 0.06]], K.park, v + 0.03, u - 0.03);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.0145, 20), K.lensA); lens.position.set(0, v + 0.03, -(u + 0.0302)); g.add(lens);
      const d = new THREE.Mesh(new THREE.CircleGeometry(0.0012, 8), K.dot); d.position.set(0, v + 0.03, -(u + 0.028)); g.add(d);
      cylY(0.0065, 0.008, K.park, 0, v + 0.05, u + 0.004); cylX(0.0065, 0.008, K.park, 0.02, v + 0.03, u + 0.004);
      return v + 0.03;
    };
    // silenciador: corpo com anéis, recua o ponto do clarão
    const silencer = (u, v, r, len) => {
      lathe([[0, 0], [r * 0.7, 0], [r, 0.008], [r, len - 0.006], [r * 0.85, len], [0.004, len], [0, len]], K.park, v, u);
      for (let k = 0; k < 3; k++) tube(r + 0.0012, u + 0.025 + k * (len - 0.05) / 2, u + 0.03 + k * (len - 0.05) / 2, v, K.dark);
      return u + len;
    };
    // ---------- mãos e braços ----------
    // mãos: modelo em zhand.js (luva com dedos articulados, polegar, indicador no gatilho, antebraço)
    // mão fechada envolvendo uma empunhadura inclinada (ang em rad, para trás); o.trig = [u, v] do gatilho no referencial da arma
    const rigs = [];                                 // esqueletos das mãos: [0] direita, [1] esquerda
    const fist = (u, v, ang, side, o) => {
      o = Object.assign({}, o || {});
      const h = new THREE.Group(); h.position.set(o.x || 0, v, -u); h.rotation.x = -ang; g.add(h);
      if (o.trig) {                                   // ponto do gatilho no referencial da mão
        const dy = o.trig[1] - v, dz = -o.trig[0] + u, ca = Math.cos(ang), sa = Math.sin(ang);
        o.trig = [-(o.x || 0), dy * ca - dz * sa, dy * sa + dz * ca];
      }
      rigs.push(HK.fist(K, h, side, o));
      return h;
    };
    // mão de apoio por baixo do guarda-mão
    const support = (u, v, r, o) => {
      o = o || {};
      const h = new THREE.Group(); h.position.set(o.x || 0, v, -u); g.add(h);
      rigs.push(HK.support(K, h, r, o));
      h.userData.base = [h.position.x, h.position.y, h.position.z];
      return h;
    };

    let sightTop = 0.06, muzzle = [0, 0.03, -0.2], eject = [0.03, 0.04, 0], lhand = null;

    if (id === "p45") {
      // ---- pistola 1911: ferrolho de 218 mm, armação com guarda-mato e empunhadura a 18° ----
      const slide = grp("slide");
      ext([[-0.046, 0.02], [0.166, 0.02], [0.172, 0.026], [0.172, 0.045], [0.166, 0.05], [-0.04, 0.05], [-0.046, 0.044]], 0.023, K.steel, { p: slide, bev: 0.0018 });
      for (let k = 0; k < 9; k++) for (const sx of [-1, 1]) box(0.0012, 0.022, 0.0016, K.dark, sx * 0.0122, 0.035, -0.04 + k * 0.0032, { p: slide });   // serrilhado
      box(0.0014, 0.012, 0.036, K.dark, 0.0122, 0.041, 0.012, { p: slide });                    // janela de ejeção
      box(0.003, 0.007, 0.006, K.steel, 0, 0.0535, 0.162, { p: slide });                       // massa de mira
      box(0.0045, 0.006, 0.004, K.steel, -0.0045, 0.053, -0.034, { p: slide }); box(0.0045, 0.006, 0.004, K.steel, 0.0045, 0.053, -0.034, { p: slide });
      lathe([[0, 0], [0.0095, 0], [0.0095, 0.006], [0, 0.006]], K.bright, 0.034, 0.168, { p: slide });   // bucha do cano
      const bore = new THREE.Mesh(new THREE.CircleGeometry(0.0055, 16), K.dark); bore.position.set(0, 0.034, -0.1745); slide.add(bore);
      // armação com guarda-mato vazado
      ext([[-0.044, 0.021], [0.13, 0.021], [0.13, 0.008], [0.064, 0.006], [0.058, -0.014], [0.044, -0.028], [0.012, -0.028], [0.006, -0.016],
        [-0.021, -0.098], [-0.073, -0.098], [-0.049, -0.016], [-0.052, 0.002], [-0.066, 0.011], [-0.052, 0.018]], 0.021, K.steel,
        { bev: 0.0016, holes: [[[0.051, -0.001], [0.016, -0.001], [0.014, -0.021], [0.04, -0.022], [0.05, -0.012]]] });
      ext([[0.001, -0.019], [-0.02, -0.088], [-0.064, -0.088], [-0.045, -0.019]], 0.032, K.wood, { bev: 0.002 });            // talas de madeira
      cylX(0.0025, 0.0336, K.bright, 0, -0.03, -0.021); cylX(0.0025, 0.0336, K.bright, 0, -0.077, -0.035);   // parafusos das talas
      ext([[0.03, 0.002], [0.032, -0.004], [0.031, -0.014], [0.026, -0.016], [0.026, 0.002]], 0.006, K.bright, { bev: 0.0008 });   // gatilho
      ext([[-0.043, 0.032], [-0.05, 0.043], [-0.061, 0.047], [-0.06, 0.04], [-0.047, 0.027]], 0.008, K.steel, { bev: 0.0012 });   // cão
      box(0.004, 0.006, 0.016, K.steel, -0.0125, 0.015, -0.032); box(0.004, 0.005, 0.02, K.steel, -0.0125, 0.012, 0.045);          // trava e retém
      cylX(0.0045, 0.004, K.dark, -0.012, -0.007, 0.0);                                               // botão do carregador
      const mag = grp("mag"), ex = has("ext");
      ext([[-0.013, -0.02], [-0.04, -0.105 - (ex ? 0.03 : 0)], [-0.068, -0.105 - (ex ? 0.03 : 0)], [-0.045, -0.02]], 0.018, K.park, { p: mag, bev: 0.001 });
      ext([[-0.036, -0.1 - (ex ? 0.03 : 0)], [-0.04, -0.108 - (ex ? 0.03 : 0)], [-0.074, -0.108 - (ex ? 0.03 : 0)], [-0.07, -0.1 - (ex ? 0.03 : 0)]], 0.024, ex ? K.poly : K.steel, { p: mag, bev: 0.0015 });
      sightTop = 0.0565; muzzle = [0, 0.034, -0.176]; eject = [0.014, 0.043, -0.015];
      if (has("optic")) sightTop = redDot(-0.005, 0.05) - 0.0;
      if (has("sil")) muzzle[2] = -silencer(0.176, 0.034, 0.0165, 0.15);
      if (withHands) {
        fist(-0.036, -0.045, 0.31, 1, { wd: 0.033, armX: 1.35, trig: [0.024, -0.007], fw: 0.011 });
        lhand = support(-0.03, -0.07, 0.022, { x: -0.022, armX: 0.9 });
        lhand.rotation.set(0.2, 0, 0.5);
      }
    } else if (id === "smg") {
      // ---- submetralhadora tipo MP5: caixa da culatra arredondada, tubo de armar sobre o cano ----
      ext([[-0.105, 0.0], [0.17, 0.0], [0.17, 0.05], [0.16, 0.06], [-0.095, 0.06], [-0.105, 0.05]], 0.046, K.park, { bev: 0.006 });
      for (let k = 0; k < 6; k++) box(0.05, 0.004, 0.006, K.dark, 0, 0.061, -0.06 + k * 0.035);            // garras do trilho
      box(0.002, 0.016, 0.05, K.dark, 0.024, 0.035, 0.09);                                                  // janela de ejeção
      tube(0.0145, 0.17, 0.33, 0.046, K.park);                                                               // tubo de armar
      const bolt = grp("bolt");                                                                             // alavanca de armar a 45°
      const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.045, 10), K.steel);
      ch.position.set(-0.022, 0.056, -0.29); ch.rotation.set(0, 0, Math.PI / 4); bolt.add(ch);
      const chk = new THREE.Mesh(new THREE.SphereGeometry(0.008, 12, 8), K.poly); chk.position.set(-0.038, 0.072, -0.29); bolt.add(chk);
      ext([[0.17, -0.004], [0.33, 0.006], [0.335, 0.02], [0.33, 0.034], [0.17, 0.036]], 0.05, K.body, { bev: 0.006 });   // guarda-mão
      for (let k = 0; k < 6; k++) for (const sx of [-1, 1]) box(0.002, 0.026, 0.004, K.dark, sx * 0.026, 0.016, 0.19 + k * 0.024);
      // massa de mira em anel e mira de tambor
      box(0.012, 0.03, 0.02, K.park, 0, 0.068, 0.322);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0125, 0.0028, 8, 20), K.park); ring.position.set(0, 0.086, -0.325); g.add(ring);
      box(0.0022, 0.012, 0.003, K.steel, 0, 0.08, 0.325);
      box(0.026, 0.018, 0.03, K.park, 0, 0.068, -0.07);
      cylX(0.0135, 0.03, K.park, 0, 0.083, -0.07);
      box(0.0018, 0.006, 0.0025, K.dark, 0, 0.097, -0.07 + 0.0012);
      // cano curto com "3 lugs"
      tube(0.0095, 0.335, 0.365, 0.024, K.steel);
      for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; box(0.006, 0.006, 0.012, K.steel, Math.cos(a) * 0.011, 0.024 + Math.sin(a) * 0.011, 0.35); }
      // carregador curvo de 30
      const mag = grp("mag"), ex = has("ext"), L = ex ? 0.24 : 0.2;
      box(0.03, 0.036, 0.05, K.park, 0, -0.016, 0.092);                                                      // poço do carregador
      ext([[0.07, -0.03], [0.115, -0.03], [0.122, -L * 0.6, 0.175, -L], [0.13, -L - 0.006], [0.08, -L * 0.6, 0.07, -0.03]], 0.022, K.park, { p: mag, bev: 0.002 });
      // conjunto do gatilho e empunhadura em polímero
      ext([[-0.075, 0.002], [0.064, 0.002], [0.064, -0.008], [0.048, -0.038], [-0.004, -0.044], [-0.032, -0.135], [-0.08, -0.137], [-0.064, -0.03], [-0.078, -0.014]],
        0.034, K.poly, { bev: 0.004, holes: [[[0.042, -0.01], [0.004, -0.01], [0.002, -0.034], [0.038, -0.032]]] });
      ext([[-0.036, -0.045], [-0.06, -0.13], [-0.078, -0.13], [-0.062, -0.045]], 0.036, K.grip, { bev: 0.002 });
      ext([[0.026, -0.008], [0.028, -0.018], [0.022, -0.026], [0.019, -0.009]], 0.006, K.steel, { bev: 0.0008 });
      cylX(0.008, 0.004, K.steel, -0.019, -0.012, -0.04); box(0.004, 0.003, 0.016, K.white, -0.022, -0.012, -0.04);   // seletor
      // coronha fixa (A2) com soleira de borracha
      ext([[-0.1, 0.052], [-0.1, -0.012], [-0.22, -0.05], [-0.355, -0.08], [-0.355, 0.045], [-0.34, 0.052]], 0.04, K.body, { bev: 0.006 });
      ext([[-0.354, 0.046], [-0.354, -0.08], [-0.372, -0.082], [-0.372, 0.048]], 0.044, K.rubber, { bev: 0.004 });
      if (has("grip")) { ext([[0.27, -0.004], [0.27, -0.09], [0.24, -0.095], [0.235, -0.004]], 0.03, K.grip, { bev: 0.006 }); }
      sightTop = 0.088; muzzle = [0, 0.024, -0.366]; eject = [0.026, 0.036, -0.09];
      if (has("optic")) { box(0.03, 0.012, 0.06, K.park, 0, 0.066, 0.02); sightTop = redDot(0.02, 0.072); }
      if (has("sil")) muzzle[2] = -silencer(0.366, 0.024, 0.019, 0.17);
      if (withHands) {
        fist(-0.045, -0.06, 0.24, 1, { wd: 0.034, armX: 1.3, trig: [0.017, -0.016], fw: 0.012 });
        lhand = has("grip") ? fist(0.252, -0.05, 0.05, -1, { wd: 0.03, armX: 0.8, armY: 0.55 }) : support(0.24, 0.015, 0.026, { armX: 0.8 });
        lhand.userData.base = [lhand.position.x, lhand.position.y, lhand.position.z];
      }
    } else if (id === "ax4") {
      // ---- carabina tipo M4: receptores superior/inferior, trilho, guarda-mão redondo, massa em "A" ----
      ext([[-0.092, 0.0], [0.142, 0.0], [0.142, 0.055], [0.135, 0.06], [-0.085, 0.06], [-0.092, 0.052]], 0.03, K.park, { bev: 0.003 });   // superior
      rail(-0.088, 0.14, 0.06, 0.022);
      box(0.0015, 0.016, 0.052, K.dark, 0.0152, 0.033, 0.03);                                               // janela de ejeção
      ext([[-0.012, 0.038], [0.006, 0.05], [0.0, 0.056], [-0.016, 0.05]], 0.008, K.park, { x: 0.017, bev: 0.001 });           // defletor de cartucho
      lathe([[0, 0], [0.0085, 0], [0.0085, 0.012], [0.006, 0.016], [0, 0.016]], K.park, 0.038, -0.06, { x: 0.02 }).rotation.y = -0.35;   // assistente de ferrolho
      const bolt = grp("bolt");                                                                             // alavanca de manejo em T
      box(0.008, 0.006, 0.04, K.park, 0, 0.056, -0.11, { p: bolt }); box(0.034, 0.008, 0.01, K.park, 0, 0.056, -0.128, { p: bolt });
      // inferior com poço do carregador alargado
      ext([[-0.092, 0.001], [0.12, 0.001], [0.12, -0.012], [0.108, -0.052], [0.04, -0.052], [0.034, -0.02], [-0.03, -0.02], [-0.09, -0.012]], 0.028, K.park, { bev: 0.003 });
      ext([[0.036, -0.018], [0.036, -0.048], [-0.03, -0.05], [-0.03, -0.018]], 0.012, K.park, { bev: 0.0015, holes: [[[0.031, -0.022], [0.031, -0.043], [-0.025, -0.045], [-0.025, -0.022]]] });
      ext([[0.012, -0.012], [0.014, -0.022], [0.009, -0.034], [0.005, -0.021]], 0.006, K.bright, { bev: 0.0008 });             // gatilho
      cylX(0.006, 0.004, K.park, -0.016, -0.004, -0.02); box(0.003, 0.003, 0.014, K.white, -0.019, -0.004, -0.02);           // seletor
      cylX(0.0055, 0.006, K.park, 0.016, -0.012, 0.035);                                                    // botão do carregador
      // empunhadura A2 (~25°) com apoio de dedo
      ext([[-0.026, -0.019], [-0.034, -0.048], [-0.041, -0.06], [-0.06, -0.114], [-0.077, -0.121], [-0.1, -0.11], [-0.071, -0.019]], 0.03, K.grip, { bev: 0.004 });
      // tubo do amortecedor e coronha retrátil
      tube(0.0145, -0.38, -0.09, 0.03, K.park);
      ext([[-0.205, 0.05], [-0.385, 0.056], [-0.392, 0.05], [-0.392, -0.075], [-0.376, -0.08], [-0.3, -0.026], [-0.22, 0.006], [-0.205, 0.014]], 0.044, K.body, { bev: 0.005 });
      ext([[-0.391, 0.052], [-0.391, -0.076], [-0.405, -0.078], [-0.405, 0.054]], 0.046, K.rubber, { bev: 0.004 });
      // anel delta, guarda-mão nervurado e capa
      lathe([[0.0, 0], [0.032, 0], [0.032, 0.014], [0, 0.014]], K.park, 0.03, 0.142);
      const hg = [[0, 0]];
      for (let k = 0; k <= 18; k++) hg.push([k % 2 ? 0.0272 : 0.0292, 0.004 + k * 0.0098]);
      hg.push([0.026, 0.182], [0, 0.182]);
      lathe(hg, K.body, 0.03, 0.156, { seg: 18 });
      lathe([[0, 0], [0.025, 0], [0.025, 0.012], [0.012, 0.016], [0, 0.016]], K.park, 0.03, 0.338);
      // cano com degrau, base de massa em "A", baioneta e quebra-chamas
      lathe([[0, 0], [0.0098, 0], [0.0098, 0.06], [0.0085, 0.064], [0.0085, 0.16], [0, 0.16]], K.park, 0.03, 0.35);
      ext([[0.36, 0.02], [0.388, 0.02], [0.388, 0.044], [0.379, 0.098], [0.368, 0.098], [0.36, 0.044]], 0.018, K.park, { bev: 0.002, holes: [[[0.37, 0.055], [0.377, 0.055], [0.376, 0.085], [0.371, 0.085]]] });
      box(0.0028, 0.012, 0.003, K.dark, 0, 0.097, 0.373);
      box(0.003, 0.016, 0.006, K.park, -0.007, 0.096, 0.373); box(0.003, 0.016, 0.006, K.park, 0.007, 0.096, 0.373);
      box(0.008, 0.012, 0.02, K.park, 0, 0.012, 0.395);
      lathe([[0, 0], [0.011, 0], [0.011, 0.045], [0.0085, 0.048], [0, 0.048]], K.park, 0.03, 0.47);
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 + 0.3; box(0.0035, 0.0035, 0.03, K.dark, Math.cos(a) * 0.0105, 0.03 + Math.sin(a) * 0.0105, 0.493); }
      // carregador STANAG curvo
      const mag = grp("mag"), ex = has("ext"), L = ex ? 0.27 : 0.215;
      ext([[0.048, -0.04], [0.104, -0.04], [0.11, -L * 0.6, 0.136, -L], [0.078, -L - 0.006], [0.055, -L * 0.6, 0.048, -0.04]], 0.022, K.park, { p: mag, bev: 0.0015 });
      ext([[0.074, -L - 0.002], [0.14, -L + 0.004], [0.142, -L - 0.006], [0.074, -L - 0.014]], 0.026, K.park, { p: mag, bev: 0.002 });
      if (has("grip")) ext([[0.27, 0.0], [0.268, -0.085], [0.245, -0.09], [0.238, 0.0]], 0.032, K.grip, { bev: 0.006 });
      sightTop = 0.094; muzzle = [0, 0.03, -0.518]; eject = [0.03, 0.036, -0.03];
      if (has("optic")) sightTop = redDot(0.03, 0.068);
      else {                                              // alça de mira rebatível no trilho
        ext([[-0.06, 0.068], [-0.03, 0.068], [-0.032, 0.088], [-0.04, 0.104], [-0.05, 0.104], [-0.058, 0.088]], 0.024, K.park,
          { bev: 0.0015, holes: [[[-0.042, 0.091], [-0.048, 0.091], [-0.048, 0.098], [-0.042, 0.098]]] });
      }
      if (has("sil")) muzzle[2] = -silencer(0.518, 0.03, 0.02, 0.17);
      if (withHands) {
        fist(-0.06, -0.066, 0.43, 1, { wd: 0.03, armX: 1.35, trig: [0.004, -0.022], fw: 0.012 });
        lhand = has("grip") ? fist(0.254, -0.05, 0.05, -1, { wd: 0.032, armX: 0.8, armY: 0.55 }) : support(0.25, 0.03, 0.03, { armX: 0.8 });
        lhand.userData.base = [lhand.position.x, lhand.position.y, lhand.position.z];
      }
    } else if (id === "brutus") {
      // ---- espingarda de bomba tipo 870: caixa da culatra, tubo de carregador e telha de bomba ----
      ext([[-0.06, -0.004], [0.155, -0.004], [0.155, 0.062], [0.148, 0.068], [-0.03, 0.068], [-0.06, 0.052]], 0.044, K.steel, { bev: 0.004 });
      box(0.002, 0.03, 0.09, K.dark, 0.0222, 0.036, 0.075);                                                 // janela de ejeção
      box(0.002, 0.018, 0.05, K.bright, 0.0222, 0.038, 0.07);                                               // ferrolho à mostra
      box(0.03, 0.002, 0.08, K.dark, 0, -0.005, 0.07);
      ext([[-0.035, -0.004], [0.11, -0.004], [0.106, -0.018], [0.09, -0.04], [0.035, -0.042], [0.0, -0.022], [-0.035, -0.018]], 0.03, K.park,
        { bev: 0.002, holes: [[[0.085, -0.012], [0.04, -0.012], [0.038, -0.034], [0.078, -0.034]]] });
      ext([[0.066, -0.006], [0.068, -0.016], [0.062, -0.028], [0.058, -0.008]], 0.007, K.steel, { bev: 0.0008 });
      cylX(0.005, 0.034, K.steel, 0, -0.01, 0.022);                                                         // trava transversal
      // cano com massa de pérola e tubo do carregador
      const ex = has("ext"), bl = 0.47;
      lathe([[0, 0], [0.0145, 0], [0.0145, 0.03], [0.0135, 0.04], [0.0135, bl], [0, bl]], K.steel, 0.044, 0.155);
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.0032, 10, 8), K.white); bead.position.set(0, 0.0605, -(0.155 + bl - 0.012)); g.add(bead);
      const tl = ex ? 0.46 : 0.38;
      tube(0.0125, 0.155, 0.155 + tl, 0.012, K.steel);
      lathe([[0, 0], [0.0138, 0], [0.0138, 0.026], [0.009, 0.034], [0, 0.034]], K.park, 0.012, 0.155 + tl);
      ext([[0.155 + tl - 0.03, 0.0], [0.155 + tl - 0.005, 0.0], [0.155 + tl - 0.005, 0.058], [0.155 + tl - 0.03, 0.058]], 0.03, K.park, { bev: 0.003 });   // braçadeira
      // telha de bomba nervurada com barras de ação
      const pump = grp("pump");
      ext([[0.2, -0.014], [0.37, -0.014], [0.378, 0.0], [0.37, 0.034], [0.2, 0.034], [0.192, 0.01]], 0.052, K.body, { p: pump, bev: 0.008 });
      for (let k = 0; k < 9; k++) for (const sx of [-1, 1]) box(0.003, 0.034, 0.005, K.dark, sx * 0.027, 0.01, 0.215 + k * 0.018, { p: pump });
      for (const sx of [-1, 1]) box(0.003, 0.005, 0.2, K.steel, sx * 0.017, 0.0, 0.1, { p: pump });
      // coronha com punho e soleira
      ext([[-0.058, 0.052], [-0.25, 0.04], [-0.405, 0.034], [-0.405, -0.118], [-0.39, -0.124], [-0.17, -0.06], [-0.11, -0.05, -0.065, -0.018], [-0.058, -0.004]],
        0.042, ex ? K.body : K.wood, { bev: 0.006 });
      ext([[-0.403, 0.035], [-0.403, -0.12], [-0.426, -0.124], [-0.426, 0.036]], 0.046, K.rubber, { bev: 0.005 });
      // cartuchos no porta-cartuchos lateral
      box(0.004, 0.034, 0.11, K.park, -0.025, 0.026, 0.04);
      for (let k = 0; k < 4; k++) {
        const sh = lathe([[0, 0], [0.0105, 0], [0.0105, 0.05], [0.009, 0.056], [0, 0.056]], K.shell, 0, 0, { seg: 14 });
        sh.rotation.x = Math.PI / 2; sh.position.set(-0.034, 0.008, -(k * 0.026));
        cylY(0.0112, 0.01, K.brass, -0.034, 0.005, k * 0.026);
      }
      sightTop = 0.07; muzzle = [0, 0.044, -(0.155 + bl + 0.002)]; eject = [0.026, 0.036, -0.07];
      if (has("grip")) lathe([[0, 0], [0.019, 0], [0.019, 0.04], [0.016, 0.044], [0, 0.044]], K.park, 0.044, 0.155 + bl - 0.03);
      if (has("optic")) { rail(-0.02, 0.12, 0.068, 0.02); sightTop = redDot(0.05, 0.078); }
      if (withHands) {
        fist(-0.075, -0.035, 0.75, 1, { wd: 0.034, armX: 1.45 });
        lhand = support(0.285, 0.01, 0.028, { p: pump, armX: 0.8 });
        g.remove(lhand); pump.add(lhand); lhand.userData.base = null;
      }
    } else if (id === "falcao") {
      // ---- rifle de precisão tipo M24: ação redonda, ferrolho, cano pesado, luneta 10x40, coronha com pistola vertical ----
      lathe([[0, 0], [0.0175, 0], [0.0175, 0.22], [0, 0.22]], K.steel, 0.03, -0.08, { seg: 24 });
      box(0.002, 0.016, 0.07, K.dark, 0.0172, 0.036, 0.03);
      const bolt = grp("bolt"); bolt.position.set(0, 0.03, 0);
      tube(0.0105, -0.115, -0.07, 0, K.bright, { p: bolt });
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.055, 10), K.bright); arm.position.set(0.028, -0.008, 0.088); arm.rotation.z = Math.PI / 2 + 0.35; bolt.add(arm);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.011, 14, 10), K.bright); knob.position.set(0.054, -0.018, 0.088); bolt.add(knob);
      lathe([[0, 0], [0.0152, 0], [0.0152, 0.05], [0.0142, 0.25], [0.0118, 0.52], [0.0118, 0.566], [0.0085, 0.57], [0, 0.57]], K.steel, 0.03, 0.14, { seg: 22 });
      // luneta 10x40 com anéis e torres
      const sv = 0.092, su = -0.13;
      lathe([[0, 0], [0.0205, 0], [0.0215, 0.006], [0.0215, 0.055], [0.0152, 0.085], [0.0152, 0.235], [0.0245, 0.285], [0.0245, 0.333], [0, 0.333]], K.park, sv, su, { seg: 28 });
      const lo = new THREE.Mesh(new THREE.CircleGeometry(0.021, 24), K.lensA); lo.position.set(0, sv, -(su + 0.3335)); g.add(lo);
      const le = new THREE.Mesh(new THREE.CircleGeometry(0.018, 24), K.glass); le.rotation.y = Math.PI; le.position.set(0, sv, -(su - 0.0005)); g.add(le);
      cylY(0.0135, 0.034, K.park, 0, sv + 0.022, su + 0.16); cylX(0.0135, 0.034, K.park, 0.022, sv, su + 0.16);
      for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; box(0.002, 0.03, 0.002, K.dark, Math.cos(a) * 0.0137, sv + 0.022, su + 0.16 + Math.sin(a) * 0.0137); }
      for (const ru of [-0.03, 0.12]) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0172, 0.0032, 8, 22), K.park); ring.position.set(0, sv, -ru); g.add(ring);
        box(0.02, sv - 0.045, 0.016, K.park, 0, (sv + 0.045) / 2, ru);
      }
      box(0.024, 0.006, 0.2, K.park, 0, 0.048, 0.05);                                                        // base da luneta
      // coronha (fibra, padrão da camuflagem) com pistola quase vertical e apoio de rosto
      ext([[0.43, 0.012], [0.43, -0.012, 0.425, -0.036], [0.4, -0.042], [0.02, -0.048], [-0.012, -0.052], [-0.03, -0.064], [-0.052, -0.13], [-0.1, -0.134],
        [-0.104, -0.075], [-0.14, -0.06], [-0.395, -0.102], [-0.395, 0.045], [-0.22, 0.05], [-0.13, 0.044], [-0.1, 0.02], [-0.07, 0.012]], 0.05, K.body, { bev: 0.007 });
      ext([[-0.394, 0.046], [-0.394, -0.103], [-0.418, -0.106], [-0.418, 0.048]], 0.052, K.rubber, { bev: 0.004 });
      ext([[-0.022, -0.05], [0.04, -0.05], [0.04, -0.06], [0.03, -0.078], [-0.024, -0.078], [-0.03, -0.058]], 0.018, K.steel, { bev: 0.0015, holes: [[[0.03, -0.054], [-0.016, -0.054], [-0.02, -0.072], [0.026, -0.072]]] });
      ext([[0.012, -0.05], [0.014, -0.06], [0.009, -0.07], [0.006, -0.058]], 0.006, K.bright, { bev: 0.0008 });
      for (const su2 of [-0.32, 0.38]) cylY(0.004, 0.02, K.steel, 0, su2 > 0 ? -0.05 : -0.1, su2);   // porta-bandoleira
      const mag = grp("mag"), ex = has("ext");
      box(0.03, ex ? 0.05 : 0.026, 0.07, K.park, 0, ex ? -0.068 : -0.056, 0.075, { p: mag });
      if (has("grip")) {                                   // bípode
        box(0.02, 0.012, 0.03, K.park, 0, -0.048, 0.38);
        for (const sx of [-1, 1]) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0045, 0.17, 8), K.park);
          leg.position.set(sx * 0.03, -0.12, -0.36); leg.rotation.set(-0.35, 0, sx * 0.3); g.add(leg);
        }
      }
      sightTop = sv; muzzle = [0, 0.03, -0.71]; eject = [0.03, 0.04, -0.03];
      if (has("sil")) muzzle[2] = -silencer(0.71, 0.03, 0.021, 0.2);
      if (withHands) {
        fist(-0.075, -0.08, 0.1, 1, { wd: 0.036, armX: 1.2, trig: [0.006, -0.058], fw: 0.012 });
        lhand = support(0.22, -0.02, 0.028, { armX: 0.8 });
        lhand.userData.base = [lhand.position.x, lhand.position.y, lhand.position.z];
      }
    }
    else if (id === "revolver") {
      // ---- revólver .50 de cano pesado: armação, tambor com estrias, cão e empunhadura de madeira ----
      const ex = has("ext"), cr = ex ? 0.0295 : 0.027;
      ext([[-0.06, 0.058], [0.075, 0.058], [0.075, 0.012], [0.035, -0.014], [0.012, -0.03], [-0.004, -0.014], [-0.05, -0.014], [-0.064, 0.02]], 0.02, K.steel, { bev: 0.002 });
      ext([[0.036, -0.012], [0.034, -0.034], [0.0, -0.05], [-0.032, -0.034], [-0.014, -0.012]], 0.008, K.steel,
        { bev: 0.001, holes: [[[0.026, -0.02], [0.022, -0.034], [0.0, -0.043], [-0.02, -0.034], [-0.008, -0.02]]] });                       // guarda-mato
      const cyl = grp("cyl");
      lathe([[0, 0], [cr, 0], [cr, 0.074], [cr * 0.92, 0.078], [0, 0.078]], K.steel, 0.034, 0.0, { p: cyl, seg: 24 });
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + 0.52; box(0.012, 0.012, 0.046, K.dark, Math.cos(a) * cr, 0.034 + Math.sin(a) * cr, 0.039, { p: cyl, rz: a }); }   // estrias
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; const h = new THREE.Mesh(new THREE.CircleGeometry(0.0072, 12), K.dark); h.position.set(Math.cos(a) * cr * 0.58, 0.034 + Math.sin(a) * cr * 0.58, -0.0785); cyl.add(h); }
      lathe([[0, 0], [0.0135, 0], [0.0135, 0.19], [0.011, 0.194], [0.011, 0.2], [0, 0.2]], K.steel, 0.04, 0.075, { seg: 20 });         // cano pesado
      tube(0.0105, 0.075, 0.185, 0.01, K.steel);                                                                                       // alavanca do extrator
      box(0.009, 0.007, 0.2, K.park, 0, 0.0555, 0.178);                                                                                // costela superior
      box(0.0035, 0.01, 0.008, K.steel, 0, 0.0645, 0.268); box(0.016, 0.008, 0.012, K.steel, 0, 0.0625, -0.052);                     // massa e alça de mira
      box(0.004, 0.005, 0.012, K.dark, 0, 0.0675, -0.052);
      ext([[-0.058, 0.058], [-0.082, 0.07], [-0.092, 0.066], [-0.078, 0.048], [-0.06, 0.04]], 0.01, K.steel, { bev: 0.0012 });          // cão
      ext([[0.01, -0.008], [0.014, -0.02], [0.008, -0.03], [0.004, -0.02]], 0.006, K.bright, { bev: 0.0008 });                        // gatilho
      ext([[-0.004, -0.016], [-0.032, -0.108], [-0.092, -0.122], [-0.098, -0.04], [-0.066, 0.0]], 0.034, K.wood, { bev: 0.003 });      // coronha de madeira
      ext([[-0.03, -0.106], [-0.034, -0.116], [-0.096, -0.13], [-0.1, -0.12]], 0.036, K.steel, { bev: 0.002 });                       // base metálica
      cylX(0.003, 0.038, K.bright, 0, -0.05, -0.04);
      sightTop = 0.0685; muzzle = [0, 0.04, -0.277]; eject = [0.02, 0.03, 0.0];
      if (has("optic")) sightTop = redDot(0.0, 0.0615);
      if (withHands) {
        fist(-0.045, -0.062, 0.3, 1, { wd: 0.034, armX: 1.35, trig: [0.004, -0.017], fw: 0.011 });
        lhand = support(-0.03, -0.075, 0.022, { x: -0.022, armX: 0.9 });
        lhand.rotation.set(0.2, 0, 0.5);
      }
    } else if (id === "titan") {
      // ---- metralhadora leve tipo M60: caixa da culatra, tubo de gás, guarda-mão, bipé e cinto de balas ----
      ext([[-0.125, 0.0], [0.2, 0.0], [0.2, 0.074], [0.182, 0.082], [-0.1, 0.082], [-0.13, 0.062]], 0.042, K.park, { bev: 0.004 });
      box(0.036, 0.012, 0.13, K.dark, 0, 0.088, 0.0);                                                       // tampa de alimentação
      rail(-0.11, 0.19, 0.082, 0.024);
      box(0.0016, 0.026, 0.07, K.dark, 0.0212, 0.04, 0.045);                                               // janela de ejeção
      const bolt = grp("bolt");
      box(0.014, 0.012, 0.045, K.steel, 0.024, 0.052, -0.0, { p: bolt }); cylX(0.0075, 0.016, K.bright, 0.036, 0.052, -0.026, { p: bolt });
      lathe([[0, 0], [0.034, 0], [0.034, 0.21], [0.03, 0.216], [0, 0.216]], K.body, 0.036, 0.2, { seg: 18 });   // guarda-mão
      for (let k = 0; k < 5; k++) box(0.062, 0.0045, 0.012, K.dark, 0, 0.036, 0.226 + k * 0.034 - 0.02);
      lathe([[0, 0], [0.0125, 0], [0.0125, 0.18], [0.0098, 0.186], [0.0098, 0.25], [0, 0.25]], K.steel, 0.036, 0.416, { seg: 20 });   // cano
      tube(0.0105, 0.23, 0.56, 0.007, K.park);                                                              // tubo de gás
      lathe([[0, 0], [0.0145, 0], [0.0145, 0.052], [0, 0.052]], K.dark, 0.036, 0.62, { seg: 14 });         // quebra-chamas
      for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + 0.78; box(0.004, 0.004, 0.036, K.park, Math.cos(a) * 0.0145, 0.036 + Math.sin(a) * 0.0145, 0.646); }
      ext([[0.5, 0.05], [0.52, 0.05], [0.52, 0.078], [0.508, 0.092], [0.5, 0.078]], 0.012, K.park, { bev: 0.0012 });   // base da massa de mira
      box(0.002, 0.016, 0.003, K.white, 0, 0.088, 0.512);
      ext([[-0.06, 0.082], [-0.03, 0.082], [-0.032, 0.1], [-0.04, 0.108], [-0.05, 0.108], [-0.058, 0.1]], 0.02, K.park, { bev: 0.0015, holes: [[[-0.042, 0.094], [-0.048, 0.094], [-0.048, 0.1], [-0.042, 0.1]]] });
      ext([[-0.125, 0.064], [-0.41, 0.054], [-0.42, 0.046], [-0.42, -0.1], [-0.36, -0.108], [-0.25, -0.04], [-0.125, -0.016]], 0.05, K.poly, { bev: 0.006 });   // coronha
      ext([[-0.418, 0.048], [-0.418, -0.102], [-0.436, -0.104], [-0.436, 0.05]], 0.052, K.rubber, { bev: 0.004 });
      ext([[-0.04, 0.0], [-0.052, -0.07], [-0.07, -0.122], [-0.102, -0.118], [-0.086, -0.012]], 0.032, K.grip, { bev: 0.004 });          // empunhadura
      ext([[0.02, -0.002], [0.016, -0.036], [-0.01, -0.054], [-0.04, -0.036], [-0.034, -0.002]], 0.01, K.park,
        { bev: 0.0015, holes: [[[0.012, -0.01], [0.01, -0.032], [-0.008, -0.043], [-0.028, -0.032], [-0.026, -0.01]]] });
      ext([[0.0, -0.003], [0.004, -0.016], [-0.002, -0.026], [-0.006, -0.014]], 0.006, K.bright, { bev: 0.0008 });
      const mag = grp("mag"), ex = has("ext");
      box(0.056, ex ? 0.13 : 0.1, 0.12, K.park, -0.062, ex ? -0.1 : -0.085, 0.02, { p: mag });                  // caixa de munição
      box(0.058, 0.012, 0.124, K.dark, -0.062, ex ? -0.032 : -0.032, 0.02, { p: mag });
      for (let k = 0; k < 8; k++) { const t = k / 7; box(0.014, 0.012, 0.009, K.brass, -0.052 + t * 0.03, -0.03 + t * 0.095, 0.02 - t * 0.005, { p: mag, rz: -0.5 + t * 0.2 }); }   // cinto subindo
      if (has("grip")) {                                                                                      // bipé aberto
        box(0.02, 0.012, 0.03, K.park, 0, 0.0, 0.5);
        for (const sx of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0045, 0.19, 8), K.park); leg.position.set(sx * 0.034, -0.09, -0.48); leg.rotation.set(-0.3, 0, sx * 0.32); g.add(leg); }
      }
      sightTop = 0.1; muzzle = [0, 0.036, -0.674]; eject = [0.03, 0.04, 0.02];
      if (has("optic")) sightTop = redDot(0.02, 0.09);
      if (has("sil")) muzzle[2] = -silencer(0.674, 0.036, 0.022, 0.2);
      if (withHands) {
        fist(-0.07, -0.074, 0.3, 1, { wd: 0.034, armX: 1.3, trig: [-0.004, -0.014], fw: 0.012 });
        lhand = support(0.31, 0.036, 0.034, { armX: 0.8 });
        lhand.userData.base = [lhand.position.x, lhand.position.y, lhand.position.z];
      }
    }
    if (lhand) parts.lhand = lhand;
    parts.rrig = rigs[0] || null; parts.lrig = rigs[1] || null;
    g.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = false; } });
    const mz = new THREE.Object3D(); mz.position.set(muzzle[0], muzzle[1], muzzle[2]); g.add(mz);
    const ej = new THREE.Object3D(); ej.position.set(eject[0], eject[1], eject[2]); g.add(ej);
    return { group: g, muzzle: mz, eject: ej, parts, sightTop };
  }
  // cápsula (o r128 não tem CapsuleGeometry): perfil de revolução com pontas esféricas, eixo em y
  function capsule(r, len) {
    const pts = [], n = 6, h = len / 2;
    for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i / n) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.max(1e-4, Math.cos(a) * r), -h + Math.sin(a) * r)); }
    for (let i = 0; i <= n; i++) { const a = (i / n) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.max(1e-4, Math.cos(a) * r), h + Math.sin(a) * r)); }
    return new THREE.LatheGeometry(pts, 12);
  }

  // posição de cada arma na tela: quadril e z da mira (x/y da mira vêm da altura da massa de mira)
  const VM = {
    p45: { hip: [0.15, -0.135, -0.38], adsZ: -0.3 }, smg: { hip: [0.19, -0.2, -0.44], adsZ: -0.32 },
    ax4: { hip: [0.2, -0.21, -0.46], adsZ: -0.32 }, brutus: { hip: [0.21, -0.21, -0.48], adsZ: -0.34 },
    falcao: { hip: [0.22, -0.23, -0.5], adsZ: -0.36 },
    revolver: { hip: [0.15, -0.14, -0.4], adsZ: -0.3 }, titan: { hip: [0.22, -0.24, -0.5], adsZ: -0.36 },
  };

  // clarão, luz do tiro e faca (vivem na câmera)
  const gunRoot = new THREE.Group();
  camera.add(gunRoot);
  let vm = null, vmKey = "";
  const flashSprite = (function () {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 1, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,240,1)"); gr.addColorStop(0.25, "rgba(255,210,120,0.9)"); gr.addColorStop(1, "rgba(255,120,20,0)");
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    x.strokeStyle = "rgba(255,230,160,0.9)"; x.lineWidth = 3;
    for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283; x.beginPath(); x.moveTo(32, 32); x.lineTo(32 + Math.cos(a) * 31, 32 + Math.sin(a) * 31); x.stroke(); }
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    sp.visible = false;
    return sp;
  })();
  const flashLight = new THREE.PointLight(0xffb060, 0, 9, 2);
  const knife = new THREE.Group();
  let knifeRig = null;
  const meleeSets = {};
  (function () {
    const steel = new THREE.MeshPhongMaterial({ color: 0x9aa0a8, specular: 0xffffff, shininess: 90, emissive: 0x25282c });
    const dark = new THREE.MeshPhongMaterial({ color: 0x1b1d22, specular: 0x555555, shininess: 40 });
    const grip = new THREE.MeshLambertMaterial({ color: 0x151517, emissive: 0x040405 });
    const wood = new THREE.MeshLambertMaterial({ color: 0x6b4a2a, emissive: 0x120a04 });
    const wrap = new THREE.MeshLambertMaterial({ color: 0x1c2640, emissive: 0x050810 });
    const gold = new THREE.MeshPhongMaterial({ color: 0xb08a2e, specular: 0xffe08a, shininess: 80 });
    const bx = (g, m, sx, sy, sz, x, y, z, rx) => { const o = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); o.position.set(x, y, z); if (rx) o.rotation.x = rx; g.add(o); return o; };
    // faca de combate
    const k0 = new THREE.Group();
    bx(k0, steel, 0.012, 0.036, 0.19, 0, 0, -0.115); bx(k0, steel, 0.01, 0.024, 0.04, 0, -0.004, -0.225, 0.3);
    bx(k0, grip, 0.02, 0.05, 0.008, 0, 0, -0.012); bx(k0, grip, 0.026, 0.038, 0.11, 0, 0, 0.045);
    // facão
    const k1 = new THREE.Group();
    bx(k1, steel, 0.007, 0.056, 0.3, 0, 0, -0.17); bx(k1, steel, 0.006, 0.04, 0.06, 0, -0.01, -0.34, 0.35); bx(k1, dark, 0.008, 0.01, 0.3, 0, 0.028, -0.17);
    bx(k1, grip, 0.02, 0.05, 0.008, 0, 0, -0.012); bx(k1, grip, 0.028, 0.04, 0.12, 0, 0, 0.045);
    // katana
    const k2 = new THREE.Group();
    bx(k2, steel, 0.007, 0.032, 0.56, 0, 0, -0.3); bx(k2, steel, 0.006, 0.026, 0.08, 0, -0.008, -0.62, 0.22); bx(k2, new THREE.MeshPhongMaterial({ color: 0xe8eef6, specular: 0xffffff, shininess: 150 }), 0.0075, 0.004, 0.56, 0, -0.016, -0.3);
    const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.007, 18), dark); tsuba.rotation.x = Math.PI / 2; tsuba.position.z = -0.012; tsuba.scale.set(1, 1, 0.8); k2.add(tsuba);
    bx(k2, gold, 0.016, 0.03, 0.02, 0, 0, -0.026); bx(k2, wrap, 0.026, 0.03, 0.23, 0, 0, 0.1); bx(k2, gold, 0.03, 0.034, 0.012, 0, 0, 0.222);
    // machado
    const k3 = new THREE.Group();
    bx(k3, wood, 0.03, 0.03, 0.62, 0, 0, -0.04); bx(k3, steel, 0.024, 0.15, 0.1, 0, 0.02, -0.34); bx(k3, steel, 0.008, 0.22, 0.045, 0, 0.02, -0.4); bx(k3, dark, 0.026, 0.05, 0.06, 0, 0.1, -0.27, 0.0);
    bx(k3, grip, 0.034, 0.034, 0.1, 0, 0, 0.1);
    for (const [id, g] of [["knife", k0], ["machete", k1], ["katana", k2], ["axe", k3]]) { g.visible = id === "knife"; knife.add(g); meleeSets[id] = g; }
    const mh = new THREE.Group(); knife.add(mh);
    knifeRig = HK.melee(HK.mats((o) => new THREE.MeshStandardMaterial(o)), mh);
    knife.visible = false; camera.add(knife);
  })();
  function setMeleeModel(id) { for (const k in meleeSets) meleeSets[k].visible = k === id; }

  function setViewGun(slot) {
    const c = slot.cfg, key = [c.id, S.camo, c.hasSil, c.hasExt, c.hasOptic, c.hasGrip].join("|");
    if (key === vmKey) return;
    vmKey = key;
    if (vm) { gunRoot.remove(vm.group); vm.muzzle.remove(flashSprite); vm.muzzle.remove(flashLight); }
    vm = buildGun(c.id, S.camo, { sil: c.hasSil, ext: c.hasExt, optic: c.hasOptic, grip: c.hasGrip }, true);
    gunRoot.add(vm.group); vm.muzzle.add(flashSprite); vm.muzzle.add(flashLight);
  }
