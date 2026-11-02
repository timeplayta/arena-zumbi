  // ======================================================================
  //  POÇÕES ARREMESSÁVEIS (teste) — visual: garrafa voando, poça de fogo e nuvem de cura
  // ======================================================================
  const PotFX = (() => {
    const COL = { fire: 0xff6a1a, heal: 0x3dff7a };
    const radial = (stops) => {
      const c = document.createElement("canvas"); c.width = c.height = 64;
      const x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      stops.forEach((s) => gr.addColorStop(s[0], s[1])); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    };
    const flameTex = (() => {                                     // chama: gota com miolo claro
      const c = document.createElement("canvas"); c.width = 32; c.height = 64;
      const x = c.getContext("2d"), gr = x.createRadialGradient(16, 46, 0, 16, 40, 30);
      gr.addColorStop(0, "rgba(255,200,80,1)"); gr.addColorStop(0.3, "rgba(255,120,20,0.95)"); gr.addColorStop(0.65, "rgba(220,40,0,0.6)"); gr.addColorStop(1, "rgba(120,10,0,0)");
      x.fillStyle = gr; x.beginPath(); x.moveTo(16, 0); x.quadraticCurveTo(32, 36, 28, 50); x.quadraticCurveTo(16, 68, 4, 50); x.quadraticCurveTo(0, 36, 16, 0); x.fill();
      return new THREE.CanvasTexture(c);
    })();
    const poolTex = { fire: radial([[0, "rgba(255,110,10,0.95)"], [0.45, "rgba(200,40,0,0.85)"], [0.8, "rgba(60,15,5,0.6)"], [1, "rgba(30,10,5,0)"]]), heal: radial([[0, "rgba(40,255,110,0.75)"], [0.6, "rgba(20,200,80,0.5)"], [1, "rgba(10,120,40,0)"]]) };
    const wallTex = (() => {                                      // parede da nuvem: some para cima
      const c = document.createElement("canvas"); c.width = 4; c.height = 64;
      const x = c.getContext("2d"), gr = x.createLinearGradient(0, 0, 0, 64);
      gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.6, "rgba(255,255,255,0.35)"); gr.addColorStop(1, "rgba(255,255,255,0.9)");
      x.fillStyle = gr; x.fillRect(0, 0, 4, 64); return new THREE.CanvasTexture(c);
    })();
    const dotTex = radial([[0, "rgba(255,255,255,1)"], [0.4, "rgba(255,255,255,0.5)"], [1, "rgba(255,255,255,0)"]]);
    const addMat = (map, color, op, normal) => new THREE.MeshBasicMaterial({ map, color: color || 0xffffff, transparent: true, opacity: op, blending: normal ? THREE.NormalBlending : THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide });
    const disc = new THREE.CircleGeometry(1, 32).rotateX(-Math.PI / 2);
    const tube = new THREE.CylinderGeometry(1, 1, 2.2, 28, 1, true).translate(0, 1.1, 0);
    // ---------- modelos GoldSrc (CS 1.6) convertidos: ver potdata.js ----------
    const texCache = {};
    const gsTex = (uri) => texCache[uri] || (texCache[uri] = new THREE.TextureLoader().load(uri));
    function gsGeom(J, skinned) {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(J.pos, 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(J.nrm, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(J.uv, 2));
      if (skinned) {
        const n = J.bi.length, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
        for (let i = 0; i < n; i++) { si[i * 4] = J.bi[i]; sw[i * 4] = 1; }
        g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute("skinWeight", new THREE.Float32BufferAttribute(sw, 4));
      }
      const keys = Object.keys(J.groups), idx = [];
      keys.forEach((k, m) => { g.addGroup(idx.length, J.groups[k].length, m); for (const v of J.groups[k]) idx.push(v); });
      g.setIndex(idx);
      const mats = keys.map((k) => new THREE.MeshLambertMaterial({ map: gsTex(J.tex[k]), skinning: !!skinned, side: THREE.DoubleSide }));
      return { g, mats, keys };
    }
    // objeto parado (garrafa voando): centraliza, converte eixos (x frente, y esquerda, z cima) e põe no tamanho certo em metros
    function gsStatic(J, size) {
      const P = J.pos, lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
      for (let i = 0; i < P.length; i++) { const a = i % 3; lo[a] = Math.min(lo[a], P[i]); hi[a] = Math.max(hi[a], P[i]); }
      const c = lo.map((v, a) => (v + hi[a]) / 2), s = size / Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]);
      const { g, mats, keys } = gsGeom(J, false), pos = g.attributes.position, nr = g.attributes.normal;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i) - c[0], y = pos.getY(i) - c[1], z = pos.getZ(i) - c[2]; pos.setXYZ(i, x * s, z * s, -y * s);
        nr.setXYZ(i, nr.getX(i), nr.getZ(i), -nr.getY(i));
      }
      return { g, mats, keys, c, s };
    }
    let MW = null;
    function worldModels() {
      if (MW) return MW;
      const fire = gsStatic(POT_MODELS.w, 0.3), heal = gsStatic(POT_MODELS.p, 0.26);
      // ponta do pano do molotov (onde fica a chama)
      const P = POT_MODELS.w.pos, rag = POT_MODELS.w.groups["0"], tip = [0, 0, 0];
      let far = -1; for (const v of rag) { const x = P[v * 3] - fire.c[0], y = P[v * 3 + 1] - fire.c[1], z = P[v * 3 + 2] - fire.c[2], d = Math.hypot(x, y, z); if (d > far) { far = d; tip[0] = x * fire.s; tip[1] = z * fire.s; tip[2] = -y * fire.s; } }
      fire.tip = tip;
      return (MW = { fire, heal });
    }
    function bottle(k) {
      const M = worldModels()[k], g = new THREE.Group();
      g.add(new THREE.Mesh(M.g, M.mats));
      if (k === "fire") {                                           // pano em chamas
        const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, transparent: true, depthWrite: false, opacity: 0.95 }));
        f.scale.set(0.16, 0.28, 1); f.position.set(M.tip[0], M.tip[1] + 0.08, M.tip[2]); g.add(f); g.userData.flame = f;
      }
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: COL[k], transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
      gl.scale.set(0.45, 0.45, 1); g.add(gl);
      scene.add(g); return g;
    }
    const potV = new Map(), areaV = new Map();
    // luzes do fogo criadas uma vez só: adicionar luz nova faz o three.js recompilar todos os materiais (travada)
    let LT = [];
    function areaView(a) {
      const root = new THREE.Group(), fire = a.k === "fire", parts = [];
      const pool = new THREE.Mesh(disc, addMat(poolTex[a.k], 0xffffff, 0.9, true)); pool.position.y = 0.04; pool.renderOrder = 3; root.add(pool);
      let wall = null, light = null;
      if (fire) {
        for (let i = 0; i < Math.round(16 * fxK() + 4); i++) {
          const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, transparent: true, depthWrite: false, opacity: 0.95 }));
          const r = Math.sqrt(Math.random()) * a.r * 0.85, an = Math.random() * 6.283;
          parts.push({ sp, x: Math.cos(an) * r, z: Math.sin(an) * r, ph: Math.random() * 6.283, s: 0.6 + Math.random() * 0.7 }); root.add(sp);
        }
        const free = LT.find((q) => !q.used); if (free) { free.used = true; light = free; free.l.position.set(a.x, a.z + 1, -a.y); }
      } else {
        wall = new THREE.Mesh(tube, addMat(wallTex, 0x2bd862, 0.35, true)); wall.renderOrder = 3; root.add(wall);
        for (let i = 0; i < Math.round(14 * fxK() + 4); i++) {
          const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: 0x3dff7a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 }));
          const r = Math.sqrt(Math.random()) * a.r * 0.9, an = Math.random() * 6.283;
          parts.push({ sp, x: Math.cos(an) * r, z: Math.sin(an) * r, ph: Math.random(), s: 0.1 + Math.random() * 0.08 }); root.add(sp);
        }
      }
      root.position.set(a.x, a.z, -a.y); scene.add(root);
      return { root, pool, wall, parts, light, fire, dur: a.t, r: a.r };
    }
    let warmed = false;
    function warm() {                                              // compila os materiais das poções no começo da partida (sem travar no 1º arremesso)
      warmed = true;
      LT = [0, 1].map(() => { const l = new THREE.PointLight(0xff6a1a, 0, 9, 2); scene.add(l); return { l, used: false }; });   // entram junto com a partida
      const tmp = [bottle("fire"), bottle("heal")], ar = [areaView({ k: "fire", x: 0, y: 0, z: -50, r: 3, t: 1 }), areaView({ k: "heal", x: 0, y: 0, z: -50, r: 3.5, t: 1 })];
      try { renderer.compile(scene, camera); } catch (e) {}
      for (const o of tmp) scene.remove(o);
      for (const v of ar) { if (v.light) { v.light.used = false; v.light.l.intensity = 0; } scene.remove(v.root); }
    }
    function sync(g, t) {
      if (!warmed && g.gm === "infect") warm();
      const pots = g.pots || [], areas = g.areas || [];
      const seenP = new Set();
      for (const p of pots) {
        seenP.add(p.id);
        let v = potV.get(p.id); if (!v) { v = bottle(p.k); potV.set(p.id, v); }
        v.position.set(p.x, p.z, -p.y); v.rotation.set(t * 9 + p.id, Math.atan2(p.vx || 0, p.vy || 1), 0);
        if (v.userData.flame) { const f = v.userData.flame, k = 0.85 + 0.25 * Math.sin(t * 31 + p.id); f.scale.set(0.16 * k, 0.28 * k, 1); }
      }
      for (const [id, v] of potV) if (!seenP.has(id)) { scene.remove(v); potV.delete(id); }
      const seenA = new Set();
      for (const a of areas) {
        seenA.add(a.id);
        let v = areaV.get(a.id); if (!v) { v = areaView(a); areaV.set(a.id, v); }
        const life = Math.max(0, a.t), fadeIn = Math.min(1, (v.dur - life) / 0.25 + 0.2), fadeOut = Math.min(1, life / 0.8), k = Math.min(fadeIn, fadeOut);
        v.pool.scale.setScalar(v.r * (0.6 + 0.4 * fadeIn)); v.pool.material.opacity = (v.fire ? 0.85 + Math.sin(t * 17) * 0.1 : 0.7) * k;
        if (v.wall) { v.wall.scale.set(v.r, 0.4 + 0.6 * fadeIn, v.r); v.wall.material.opacity = (0.35 + Math.sin(t * 3) * 0.06) * k; }
        for (const q of v.parts) {
          if (v.fire) {
            const f = 0.75 + 0.35 * Math.sin(t * 13 + q.ph) + 0.15 * Math.sin(t * 29 + q.ph * 2);
            q.sp.scale.set(q.s * 0.7 * f, q.s * 1.5 * f * k, 1); q.sp.position.set(q.x, q.s * 0.7 * f * k, q.z); q.sp.material.opacity = 0.85 * k;
          } else {
            const u = (t * 0.45 + q.ph) % 1;
            q.sp.position.set(q.x, u * 2.2, q.z); q.sp.scale.setScalar(q.s); q.sp.material.opacity = Math.sin(u * Math.PI) * 0.9 * k;
          }
        }
        if (v.light) v.light.l.intensity = (0.8 + Math.sin(t * 19) * 0.2 + Math.sin(t * 7) * 0.15) * k;
      }
      for (const [id, v] of areaV) if (!seenA.has(id)) { if (v.light) { v.light.used = false; v.light.l.intensity = 0; } scene.remove(v.root); areaV.delete(id); }
    }
    function burst(k, x, y, z) {                                   // garrafa quebrando: cacos e faísca
      for (let i = 0, n = Math.round(10 * fxK()) + 4; i < n; i++) fxSpark.emit(x, z + 0.2, -y, (Math.random() - 0.5) * 5, 1 + Math.random() * 3, (Math.random() - 0.5) * 5, 0.35 + Math.random() * 0.4, 1);
    }
    function clear() { for (const v of potV.values()) scene.remove(v); potV.clear(); for (const v of areaV.values()) scene.remove(v.root); areaV.clear(); for (const q of LT) { q.used = false; q.l.intensity = 0; } }
    return { sync, burst, clear, gsGeom, flameTex, worldModels };
  })();
  // ---------- primeira pessoa: mãos acendendo e arremessando (molotov ou garrafa de cura) ----------
  const PotVM = (() => {
    let V = null, fovG = null, flame = null, healM = null, act = false, kind = "", phase = "", t = 0, released = false, onRel = null;
    const DEPLOY_END = 20 / 30, IGNITE = 16 / 50, WIND_FROM = 28 / 50;
    function build() {
      const J = POT_MODELS.v, { g, mats, keys } = PotFX.gsGeom(J, true);
      const mesh = new THREE.SkinnedMesh(g, mats);
      const bones = J.bones.map((b) => { const o = new THREE.Bone(); o.position.set(b[1], b[2], b[3]); o.quaternion.set(b[4], b[5], b[6], b[7]); return o; });
      J.bones.forEach((b, i) => { if (b[0] >= 0) bones[b[0]].add(bones[i]); else mesh.add(bones[i]); });
      mesh.updateMatrixWorld(true); mesh.bind(new THREE.Skeleton(bones)); mesh.frustumCulled = false;
      const conv = new THREE.Group();                               // GoldSrc (x frente, y esquerda, z cima, polegadas) -> three
      conv.quaternion.setFromRotationMatrix(new THREE.Matrix4().set(0, -1, 0, 0, 0, 0, 1, 0, -1, 0, 0, 0, 0, 0, 0, 1)); conv.scale.setScalar(0.0254); conv.add(mesh);
      const qa = new THREE.Quaternion(), qb = new THREE.Quaternion();
      function pose(name, tt) {
        const A = J.anims[name], nf = A.f.length, ft = tt * A.fps;
        let f0 = Math.floor(ft), k = ft - f0; if (f0 >= nf - 1) { f0 = nf - 1; k = 0; }
        const f1 = Math.min(nf - 1, f0 + 1), a = A.f[f0], b = A.f[f1];
        for (let i = 0; i < bones.length; i++) {
          const o = i * 7, B = bones[i];
          B.position.set(a[o] + (b[o] - a[o]) * k, a[o + 1] + (b[o + 1] - a[o + 1]) * k, a[o + 2] + (b[o + 2] - a[o + 2]) * k);
          qa.set(a[o + 3], a[o + 4], a[o + 5], a[o + 6]); qb.set(b[o + 3], b[o + 4], b[o + 5], b[o + 6]); B.quaternion.copy(qa).slerp(qb, k);
        }
      }
      const dur = (n) => J.anims[n].f.length / J.anims[n].fps;
      const mat = {}; keys.forEach((k, i) => { mat[k] = mats[i]; });
      return { root: conv, bones, pose, dur, mat };
    }
    function ensure() {
      if (V) return;
      V = build(); fovG = new THREE.Group(); fovG.add(V.root); fovG.visible = false; camera.add(fovG);
      flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: PotFX.flameTex, transparent: true, depthWrite: false, opacity: 0.95 }));
      flame.scale.set(2.6, 4.4, 1); flame.position.set(0, 0, 1.6); V.bones[39].add(flame);          // ponta do pano
      const P = PotFX.gsGeom(POT_MODELS.p, false); healM = new THREE.Mesh(P.g, P.mats);
      healM.scale.setScalar(0.55); healM.rotation.x = Math.PI / 2; healM.position.set(0.4, 5.3, 1.0); V.bones[18].add(healM);   // garrafa de cura na mão
    }
    function show(parts) {                                         // 2 pano · 3 isqueiro · 4 garrafa · 5 rótulo
      const fire = kind === "fire";
      V.mat["2"].visible = fire && parts; V.mat["3"].visible = fire; V.mat["4"].visible = fire && parts; V.mat["5"].visible = fire && parts;
      healM.visible = !fire && parts;
    }
    // G/H só tira a poção; o arremesso é no clique (como granada do CS)
    function start(k, release) {
      if (act) return false;
      ensure(); act = true; kind = k; phase = "deploy"; t = 0; released = false; onRel = release; show(true); fovG.visible = true;
      return true;
    }
    function fire() {                                              // clique: acende (fogo) e arremessa
      if (!act || (phase !== "hold" && phase !== "deploy")) return false;
      if (phase === "deploy") { want = true; return true; }
      phase = "pullpin"; t = kind === "fire" ? 0 : WIND_FROM; if (kind === "fire") Snd.play("molotov_light", 0.9, 1, 0, 0.1);
      return true;
    }
    let want = false;
    const holding = () => act && (phase === "deploy" || phase === "hold");
    function stop() { act = false; want = false; if (fovG) fovG.visible = false; }
    function update(g, dt) {
      if (!act) return;
      if (!g.alive || g.team === "z" || g.gm !== "infect") { stop(); return; }
      const k = Math.tan((camera.fov * Math.PI) / 360) / Math.tan((73.74 * Math.PI) / 360);   // modelo feito para FOV 90 (CS 1.6)
      fovG.scale.set(k, k, 1);
      if (phase === "deploy") { t += dt * 1.5; if (t >= DEPLOY_END) { phase = "hold"; t = 0; if (want) { want = false; fire(); } } }
      else if (phase === "hold") t += dt;
      else if (phase === "pullpin") { t += dt; if (t >= V.dur("pullpin")) { phase = "throw"; t = 0; } }
      else if (phase === "throw") {
        if (!released) { released = true; show(false); if (onRel) onRel(kind); }
        t += dt; if (t >= V.dur("throw")) { stop(); return; }
      }
      if (phase === "hold") V.pose("idle", t % V.dur("idle")); else V.pose(phase, t);
      flame.visible = kind === "fire" && phase === "pullpin" && t > IGNITE;
      if (flame.visible) { const f = 0.8 + 0.3 * Math.sin(g.time * 33) + 0.1 * Math.sin(g.time * 71); flame.scale.set(2.6 * f, 4.4 * f, 1); }
    }
    return { start, fire, update, stop, busy: () => act, holding, kind: () => kind };
  })();
