  // =====================================================================================================
  //  CO-OP ONLINE — cliente: sala, mensagens, aliados na cena e lobby.
  //  O anfitrião roda o mundo (Game com enableCoop("host")); convidados mandam posição/tiros e recebem snapshots.
  // =====================================================================================================
  const SHIRTS = [0xd8412f, 0x2f7bd8, 0x39b35a, 0xe8b82a];                // vermelha, azul, verde, amarela
  const colorHex = (n) => "#" + n.toString(16).padStart(6, "0");
  const allyViews = new Map();
  function allyTag(name) {
    const cv = document.createElement("canvas"); cv.width = 256; cv.height = 64;
    const x = cv.getContext("2d"); x.font = "700 34px Teko, Arial Narrow, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
    x.lineWidth = 6; x.strokeStyle = "rgba(0,0,0,0.85)"; x.strokeText(name, 128, 34); x.fillStyle = "#d8ffe2"; x.fillText(name, 128, 34);
    const tex = new THREE.CanvasTexture(cv);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sp.scale.set(1.5, 0.375, 1); sp.position.y = 2.1; sp.renderOrder = 10;
    return sp;
  }
  function makeAlly(shirt, name) {
    const col = new THREE.Color(shirt), dark = col.clone().multiplyScalar(0.62);
    const M = (c, r, m) => new THREE.MeshStandardMaterial({ color: c, roughness: r === undefined ? 0.85 : r, metalness: m || 0 });
    const mShirt = M(col), mShirtD = M(dark), mPants = M(0x3a3f47), mBoot = M(0x17181a, 0.9), mSkin = M(0xd0a07c, 0.9), mHair = M(0x2a1d14), mVest = M(0x2d3328), mVestD = M(0x22271e);
    const mHelm = M(0x3b4636, 0.6), mPack = M(0x4a4a34), mGun = M(0x15171a, 0.45, 0.4), mGunL = M(0x30343a, 0.5, 0.3), mEye = new THREE.MeshBasicMaterial({ color: 0x0b0b0b });
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const box = (w, h, d, m, x, y, z, p) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); (p || body).add(o); return o; };
    const cyl = (rt, rb, h, m, x, y, z, p, seg) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 10), m); o.position.set(x, y, z); (p || body).add(o); return o; };
    const sph = (r, m, x, y, z, p, sx, sy, sz) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), m); o.position.set(x, y, z); o.scale.set(sx || 1, sy || 1, sz || 1); (p || body).add(o); return o; };
    const limb = (a, b, r0, r1, m, p) => {                                  // cilindro entre dois pontos
      const A = new THREE.Vector3(a[0], a[1], a[2]), B = new THREE.Vector3(b[0], b[1], b[2]), d = B.clone().sub(A), L = d.length();
      const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, L, 9), m); o.position.copy(A.clone().add(B).multiplyScalar(0.5));
      o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); (p || body).add(o); return o;
    };
    // pernas (pivô no quadril, para balançar ao andar)
    const legs = [];
    for (const sx of [-0.1, 0.1]) {
      const lg = new THREE.Group(); lg.position.set(sx, 0.9, 0); body.add(lg); legs.push(lg);
      cyl(0.085, 0.07, 0.78, mPants, 0, -0.42, 0, lg);
      box(0.13, 0.1, 0.05, mVestD, 0, -0.5, -0.07, lg);                    // joelheira
      box(0.15, 0.14, 0.27, mBoot, 0, -0.83, -0.04, lg);
      box(0.15, 0.04, 0.29, M(0x0d0d0e), 0, -0.9, -0.04, lg);
    }
    box(0.4, 0.09, 0.25, M(0x1a1a1a), 0, 0.93, 0);                         // cinto
    box(0.42, 0.1, 0.26, mPants, 0, 0.86, 0);
    // tronco: camisa colorida + colete tático
    box(0.44, 0.34, 0.25, mShirt, 0, 1.12, 0);
    box(0.4, 0.18, 0.24, mShirt, 0, 0.98, 0);
    box(0.46, 0.3, 0.29, mVest, 0, 1.17, 0);
    box(0.34, 0.07, 0.3, mVestD, 0, 1.34, 0);
    for (const px of [-0.12, 0, 0.12]) box(0.1, 0.12, 0.06, mVestD, px, 1.07, -0.16);   // bolsos
    box(0.3, 0.1, 0.05, mVestD, 0, 1.24, -0.16);
    box(0.34, 0.4, 0.14, mPack, 0, 1.17, 0.2); box(0.3, 0.1, 0.16, mVestD, 0, 1.4, 0.2);   // mochila
    // ombros e mangas (cor da camisa)
    sph(0.075, mShirt, -0.26, 1.34, 0); sph(0.075, mShirt, 0.26, 1.34, 0);
    // pescoço e cabeça
    cyl(0.055, 0.06, 0.1, mSkin, 0, 1.43, 0);
    const head = new THREE.Group(); head.position.set(0, 1.58, -0.01); body.add(head);
    sph(0.115, mSkin, 0, 0, 0, head, 0.95, 1.12, 1.0);
    box(0.03, 0.02, 0.01, mEye, -0.045, 0.02, -0.108, head); box(0.03, 0.02, 0.01, mEye, 0.045, 0.02, -0.108, head);
    box(0.04, 0.03, 0.02, M(0xc08e6c), 0, -0.01, -0.113, head);
    box(0.06, 0.012, 0.01, M(0x7a3b30), 0, -0.05, -0.108, head);
    const hair = sph(0.118, mHair, 0, 0.02, 0.03, head, 0.97, 1.0, 1.0);
    const helm = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mHelm); helm.position.set(0, 0.035, 0); head.add(helm);
    cyl(0.16, 0.16, 0.015, mHelm, 0, 0.055, -0.01, head, 18).scale.set(1, 1, 1.1);   // aba
    box(0.012, 0.09, 0.012, mVestD, -0.11, -0.04, -0.02, head); box(0.012, 0.09, 0.012, mVestD, 0.11, -0.04, -0.02, head);   // jugular
    // arma + braços (o grupo "aim" inclina com o olhar)
    const aim = new THREE.Group(); aim.position.set(0.02, 1.3, -0.12); body.add(aim);
    box(0.06, 0.1, 0.34, mGun, 0, 0, -0.18, aim);                          // receptor
    box(0.055, 0.07, 0.3, mGunL, 0, 0.005, -0.5, aim);                     // guarda-mão
    cyl(0.011, 0.011, 0.22, mGun, 0, 0.01, -0.76, aim, 8).rotation.x = Math.PI / 2;   // cano
    cyl(0.017, 0.017, 0.05, mGun, 0, 0.01, -0.88, aim, 8).rotation.x = Math.PI / 2;
    box(0.05, 0.06, 0.2, mGun, 0, -0.01, 0.1, aim);                        // coronha
    box(0.05, 0.14, 0.1, mGun, 0, -0.1, 0.0, aim).rotation.x = 0.35;       // empunhadura
    box(0.045, 0.17, 0.07, mGunL, 0, -0.14, -0.26, aim).rotation.x = -0.18; // carregador
    box(0.05, 0.05, 0.12, mGun, 0, 0.075, -0.2, aim);                      // mira
    const flash = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd36a })); flash.position.set(0, 0.01, -0.95); flash.visible = false; aim.add(flash);
    // braço direito (no punho) e esquerdo (na guarda-mão)
    const sh = [[0.26, 1.34, 0], [-0.26, 1.34, 0]];
    limb(sh[0], [0.2, 1.17, -0.15], 0.062, 0.052, mShirt); limb([0.2, 1.17, -0.15], [0.05, 1.2, -0.3], 0.05, 0.042, mSkin); sph(0.045, mSkin, 0.05, 1.2, -0.3);
    limb(sh[1], [-0.22, 1.2, -0.2], 0.062, 0.052, mShirt); limb([-0.22, 1.2, -0.2], [-0.02, 1.3, -0.52], 0.05, 0.042, mSkin); sph(0.045, mSkin, -0.02, 1.3, -0.52);
    const tag = allyTag(name || "Aliado"); tag.position.y = 2.0; root.add(tag);
    scene.add(root);
    return { root, body, legs, aim, flash, tag, name, step: 0 };
  }
  function syncAllies(g, dt) {
    const seen = new Set();
    g.others.forEach((o, i) => {
      if (o.team === "z") return;
      seen.add(o.id);
      let v = allyViews.get(o.id);
      const nm = o.name || Coop.nameOf(o.id);
      if (!v || v.name !== nm) { if (v) { scene.remove(v.root); } v = makeAlly(Coop.shirtOf(o.id), nm); allyViews.set(o.id, v); }
      v.root.position.set(o.x, 0, -o.y); v.root.rotation.y = o.yaw; v.body.position.x = 0;
      v.aim.rotation.x = clamp(o.pitch || 0, -1, 1);
      v.step += (o.mv ? 8 : 0) * dt; const sw = o.mv && o.alive ? Math.sin(v.step) * 0.6 : 0;
      v.legs[0].rotation.x = sw; v.legs[1].rotation.x = -sw;
      const down = !o.alive;
      v.body.rotation.x += ((down ? -1.45 : 0) - v.body.rotation.x) * Math.min(1, dt * 10);
      v.body.position.y += ((down ? 0.16 : 0) - v.body.position.y) * Math.min(1, dt * 10);
      v.body.scale.y += ((o.cr && !down ? 0.78 : 1) - v.body.scale.y) * Math.min(1, dt * 10);
      v.flash.visible = (o.flash || 0) > 0;
      v.tag.visible = true; v.tag.material.opacity = down ? 0.5 : 1;
    });
    for (const [id, v] of allyViews) if (!seen.has(id)) { scene.remove(v.root); allyViews.delete(id); }
  }
  function clearAllies() { for (const v of allyViews.values()) scene.remove(v.root); allyViews.clear(); }

  function buildZArms(THREE, J, opts) {
    opts = opts || {};
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(J.pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(J.nrm, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(J.uv, 2));
    const n = J.pos.length / 3, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) for (let j = 0; j < 3; j++) { si[i * 4 + j] = J.si[i * 3 + j]; sw[i * 4 + j] = J.sw[i * 3 + j]; }
    g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(si, 4));
    g.setAttribute("skinWeight", new THREE.Float32BufferAttribute(sw, 4));
    const keys = Object.keys(J.groups), idx = [];
    keys.forEach((k, m) => { g.addGroup(idx.length, J.groups[k].length, m); for (const v of J.groups[k]) idx.push(v); });
    g.setIndex(idx);
    const mats = keys.map((k) => new THREE.MeshStandardMaterial({ color: opts.colors ? opts.colors[k] : 0xa01c24, roughness: 0.55, skinning: true, side: THREE.DoubleSide }));
    const mesh = new THREE.SkinnedMesh(g, mats);
    const bones = J.bones.map((b) => { const o = new THREE.Bone(); o.position.set(b[1], b[2], b[3]); o.quaternion.set(b[4], b[5], b[6], b[7]); return o; });
    J.bones.forEach((b, i) => { if (b[0] >= 0) bones[b[0]].add(bones[i]); else mesh.add(bones[i]); });
    mesh.updateMatrixWorld(true);
    mesh.bind(new THREE.Skeleton(bones));
    mesh.frustumCulled = false;
    const conv = new THREE.Group();                 // Source (x frente, y esquerda, z cima, polegadas) -> three (−z frente, y cima, metros)
    const m4 = new THREE.Matrix4().set(0, -1, 0, 0, 0, 0, 1, 0, -1, 0, 0, 0, 0, 0, 0, 1);
    conv.quaternion.setFromRotationMatrix(m4); conv.scale.setScalar(0.0254); conv.add(mesh);
    const qa = new THREE.Quaternion(), qb = new THREE.Quaternion();
    function pose(name, t, loop) {               // t em segundos
      const A = J.anims[name]; if (!A) return 0;
      const nf = A.f.length, ft = t * A.fps;
      let f0 = Math.floor(ft), k = ft - f0;
      if (loop) f0 = ((f0 % nf) + nf) % nf; else if (f0 >= nf - 1) { f0 = nf - 1; k = 0; }
      const f1 = loop ? (f0 + 1) % nf : Math.min(nf - 1, f0 + 1), a = A.f[f0], b = A.f[f1];
      for (let i = 0; i < bones.length; i++) {
        const o = i * 7, B = bones[i];
        B.position.set(a[o] + (b[o] - a[o]) * k, a[o + 1] + (b[o + 1] - a[o + 1]) * k, a[o + 2] + (b[o + 2] - a[o + 2]) * k);
        qa.set(a[o + 3], a[o + 4], a[o + 5], a[o + 6]); qb.set(b[o + 3], b[o + 4], b[o + 5], b[o + 6]);
        B.quaternion.copy(qa).slerp(qb, k);
      }
      return nf / A.fps;
    }
    return { root: conv, mesh, pose, dur: (name) => J.anims[name] ? J.anims[name].f.length / J.anims[name].fps : 0 };
  }
  // ---------- braços de zumbi em primeira pessoa (modo Infecção) ----------
  const ZArms = (() => {
    let Z = null, act = "", actT = 0, side = 0, idleT = 0;
    function swipe() { act = side ? "light_miss2" : "light_miss1"; side ^= 1; actT = 0; }
    function update(g, dt) {
      const on = g.team === "z" && g.alive;
      if (!Z) {
        if (!on) return;
        Z = buildZArms(THREE, ZARMS_DATA, { colors: { 0: 0x1e1416, 1: 0x9a1b22 } });
        Z.fov = new THREE.Group(); Z.fov.add(Z.root); camera.add(Z.fov);
      }
      Z.fov.visible = on; if (!on) return;
      // o modelo foi feito para FOV de arma ~54°; a câmera do jogo é mais aberta e mostrava o corte dos braços.
      // Comprime X/Y na proporção certa: a imagem fica igual à de uma câmera de 54°.
      const k = Math.tan((camera.fov * Math.PI) / 360) / Math.tan((54 * Math.PI) / 360);
      Z.fov.scale.set(k, k, 1);
      idleT += dt;
      if (act) { actT += dt; if (actT >= Z.dur(act)) act = ""; else { Z.pose(act, actT, false); return; } }
      Z.pose("idle1", idleT, true);
      Z.root.position.y = g.moving ? Math.sin(g.bob * 0.9) * 0.006 : 0;
    }
    return { swipe, update };
  })();
  function redSkin(v) {                                     // zumbis-jogadores: pele vermelha
    for (const m of v.mats || []) { if (m.color) m.color.setRGB(1.4, 0.36, 0.36); if (m.emissive) { m.userData.base = 0x260406; m.emissive.setHex(0x260406); } }
  }

  const Coop = (() => {
    const st = { ws: null, id: null, host: false, code: "", status: "off", msg: "", players: [], stamp: "0", gm: "coop", gmSel: "coop", started: false, diff: "normal", starting: false, over: false, name: "" };
    const lobby = {};                       // anfitrião: id -> { name, info, full }
    let acc = 0, sAcc = 0, sentZ = new Set(), sentP = new Set(), pingT = 0, game0 = null;
    const WORLD = /^(wave|giant|elite|kill|clear|wall|hit|rshot|ally_down|infected|claw|inf_end|zrespawn|tank_|sam_|wraith_)/;
    const setMsg = (m, cls) => { st.msg = m; const e = $("coopStatus"); if (e) { e.textContent = m; e.className = "coop-status " + (cls || ""); } };
    const DEFAULT_SERVER = "arena-zumbi.playes.workers.dev";       // servidor online (salas co-op); o jogo pode ficar em outro endereço
    function serverHost() {
      if (/^https?:$/.test(location.protocol) && /^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname)) return location.host;   // teste local (online/dev-server.js)
      return DEFAULT_SERVER;
    }
    const roomKey = (n) => String(n || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
    async function hashPw(pw) {
      if (!pw) return "";
      try { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("arena-zumbi:" + pw)); return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 32); }
      catch (e) { let h = 5381; for (const c of "arena-zumbi:" + pw) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0; return "x" + h.toString(16); }
    }
    function send(o, to) { if (!st.ws || st.ws.readyState !== 1) return; if (to) o.to = to; try { st.ws.send(JSON.stringify(o)); } catch (e) {} }
    const connected = () => !!st.ws && st.status === "on";
    function nameOf(id) { const p = st.players.find((q) => q.id === id); return p ? p.name : id === "p1" ? "Anfitrião" : "Jogador"; }
    function shirtOf(id) {                                                  // cada jogador tem uma das 4 cores; a ordem é sorteada por sala
      let h = 2166136261; for (const c of st.code + "|" + st.stamp) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
      const p = [0, 1, 2, 3]; for (let i = 3; i > 0; i--) { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; const j = h % (i + 1); [p[i], p[j]] = [p[j], p[i]]; }
      return SHIRTS[p[(Number(String(id).slice(1)) - 1 || 0) % 4]];
    }
    function slotOf(id) { const i = st.players.findIndex((q) => q.id === id); return i < 0 ? Number(String(id).slice(1)) - 1 || 0 : i; }
    function renderLobby() {
      const e = $("coopPlayers"); if (!e) return;
      const on = connected();
      $("coopOff").hidden = on; $("coopOn").hidden = !on; $("coopModes").hidden = on;
      if (on) {
        $("coopRoom").textContent = st.label || st.code;
        $("coopMode").textContent = st.gm === "infect" ? "Infecção · até 8 jogadores" : "Co-op · até 4 jogadores";
        e.innerHTML = st.players.map((p, i) => '<div class="coop-p"><i style="background:' + colorHex(shirtOf(p.id)) + '"></i><b>' + p.name.replace(/[<>&]/g, "") + "</b>" + (p.id === "p1" ? "<span>anfitrião</span>" : "") + (p.id === st.id ? "<span>você</span>" : "") + "</div>").join("");
        $("coopHint").textContent = st.host ? (st.started ? "Partida em andamento. Quem entrar agora cai direto no jogo." : "Quando todos entrarem, clique em Jogar (embaixo) para começar.") : (st.started ? "Partida em andamento." : "Aguardando o anfitrião iniciar a partida.");
      }
      const pb = $("btnPlay"); if (pb) pb.textContent = on && !st.host ? "Aguardando anfitrião" : on ? (st.gm === "infect" ? "Iniciar infecção" : "Jogar em co-op") : "Jogar";
    }
    function lobbyList() { return Object.keys(lobby).map((id) => ({ id, name: lobby[id].name })); }
    function hostLobby() {
      st.players = [{ id: "p1", name: st.name || "Anfitrião" }].concat(lobbyList());
      send({ t: "lobby", players: st.players, started: st.started, diff: st.diff, stamp: st.stamp, gm: st.gm }); renderLobby();
    }
    async function open(role, label, pass) {
      leave(true);
      const code = roomKey(label);
      if (code.length < 3) { setMsg("O nome da sala precisa de pelo menos 3 letras ou números.", "err"); return; }
      const h = serverHost(), pw = await hashPw(pass);
      st.name = (S.name || "Sobrevivente").slice(0, 14); st.code = code; st.label = String(label).trim().slice(0, 16); st.host = role === "host"; if (st.host) st.gm = st.gmSel; st.status = "connecting"; setMsg("Conectando...");
      const local = /^(localhost|127\.|192\.168\.|10\.)/.test(h);
      let ws; try { ws = new WebSocket((local ? "ws://" : "wss://") + h + "/ws/" + code + "?role=" + role + (pw ? "&pw=" + pw : "") + (role === "host" ? "&max=" + (st.gmSel === "infect" ? 8 : 4) : "")); } catch (e) { setMsg("Não consegui conectar ao servidor.", "err"); st.status = "off"; return; }
      st.ws = ws;
      ws.onopen = () => { pingT = performance.now(); };
      ws.onmessage = (ev) => { if (ws !== st.ws) return; if (ev.data === "pong") return; let m; try { m = JSON.parse(ev.data); } catch (e) { return; } onMsg(m); };
      ws.onclose = () => { if (ws !== st.ws) return; const was = st.status; st.ws = null; st.status = "off"; st.started = false; st.players = []; for (const k in lobby) delete lobby[k];
        if (was === "on") setMsg("Conexão encerrada.", "err"); else if (was === "connecting" && !st.msg.startsWith("Sala") && !st.msg.startsWith("Essa") ) setMsg("Não consegui conectar ao servidor.", "err");
        renderLobby(); };
      ws.onerror = () => {};
    }
    function leave(silent) {
      const ws = st.ws; st.ws = null; st.status = "off"; st.started = false; st.players = []; st.over = false; for (const k in lobby) delete lobby[k];
      if (ws) { try { ws.close(); } catch (e) {} }
      if (!silent) setMsg("");
      renderLobby();
    }
    // ---------------- mensagens ----------------
    function onMsg(m) {
      switch (m.t) {
        case "welcome":
          st.id = m.id; st.status = "on"; setMsg(st.host ? "Sala criada. Passe o nome (e a senha) aos amigos." : "Você entrou na sala.", "ok");
          if (st.host) { st.started = false; st.stamp = Math.random().toString(36).slice(2, 8); hostLobby(); } else { send({ t: "hello", name: st.name }); renderLobby(); }
          break;
        case "error": setMsg(m.m || "Erro.", "err"); st.status = "error"; break;
        case "closed": setMsg("O anfitrião saiu da sala.", "err"); endMatchForGuest(); leave(true); break;
        // --- anfitrião ---
        case "join": break;
        case "hello": if (!st.host) break; lobby[m.from] = Object.assign(lobby[m.from] || {}, { name: String(m.name || "Jogador").slice(0, 14) }); hostLobby();
          if (st.started) send({ t: "start", diff: st.diff, gm: st.gm }, m.from); break;
        case "info": if (!st.host || !lobby[m.from]) break; lobby[m.from].info = m.info; lobby[m.from].full = true; if (game && game.coop) hostAddRemote(m.from); break;
        case "leave": if (!st.host) break; delete lobby[m.id]; if (game && game.coop) game.removeRemote(m.id); hostLobby();
          if (game && game.coop) feedLine("JOGADOR SAIU", false, "dim"); break;
        case "gone": if (st.host) { if (lobby[m.from]) lobby[m.from].full = false; if (game && game.coop) game.removeRemote(m.from); } break;
        case "s": if (st.host && game && game.coop) game.setRemote(m.from, m); break;
        case "shot": if (st.host && game && game.coop) game.remoteShot(m.from, m); break;
        case "melee": if (st.host && game && game.coop) game.remoteMelee(m.from); break;
        case "claw": if (st.host && game && game.coop) game.claw(m.from); break;
        // --- convidado ---
        case "lobby": st.players = m.players || []; st.stamp = m.stamp || st.stamp; st.gm = m.gm || "coop"; st.started = !!m.started; st.diff = m.diff || st.diff; renderLobby(); break;
        case "start": st.diff = m.diff || "normal"; st.gm = m.gm || st.gm; st.started = true; st.over = false;
          if (state === "menu" || state === "dead") { st.starting = true; try { startGame(); } finally { st.starting = false; } }
          renderLobby(); break;
        case "snap": if (game && game.coop && game.coop.role === "guest") game.applySnapshot(m, 0); break;
        case "ev": if (game && game.coop && game.coop.role === "guest") for (const e of m.e) game.events.push(e); break;
        case "fx": if (game && game.coop && game.coop.role === "guest") for (const e of m.e) game.applyFx(e); break;
        case "over": st.over = true; break;
      }
    }
    function endMatchForGuest() { if (state === "run" || state === "pause") { st.over = true; } }
    function hostAddRemote(id) {
      const L = lobby[id]; if (!L || !game || !game.coop) return;
      game.addRemote(id, L.name, L.info || {}); L.needFull = true;
      if (game.gm === "infect" && game.inf && game.inf.ph !== "prep") game.becomeZombie(id);   // entrou no meio: já chega zumbi
    }
    // ---------------- ligação com o jogo ----------------
    function hostStartBroadcast() { st.started = true; st.over = false; st.diff = S.diff; send({ t: "start", diff: st.diff, gm: st.gm }); hostLobby(); }
    function attach(g) {
      if (!connected()) { game0 = null; return; }
      g.enableCoop(st.host ? "host" : "guest", st.id); game0 = g; acc = sAcc = 0; sentZ = new Set(); sentP = new Set(); st.over = false;
      if (st.host && st.gm === "infect") g.infectStart(); else if (!st.host) g.gm = st.gm === "infect" ? "infect" : "";
      if (st.host) { for (const id in lobby) if (lobby[id].info) hostAddRemote(id); }
    }
    const active = () => connected() && !!game && !!game.coop;
    function ended() { return !active() || (st.host ? !!game.over : st.over); }
    function guestInfo(ro) {
      const p = ro.perks || {};
      return { loadout: loadoutSel(), perks: { hp: p.hp, armor: p.armor, dmg: p.dmg, vest: p.vest }, melee: ro.melee };
    }
    function sendInfo(ro) { if (connected() && !st.host) send({ t: "info", info: guestInfo(ro) }); }
    // chamado a cada quadro, depois de game.update e antes de processEvents
    function afterUpdate(g, dt) {
      if (!active()) return;
      if (st.host) hostRelay(g, dt); else guestSend(g, dt);
      if (performance.now() - pingT > 15000) { pingT = performance.now(); try { st.ws.send("ping"); } catch (e) {} }
    }
    function guestSend(g, dt) {
      if (g.lastShot) { const s = g.lastShot; g.lastShot = null; send({ t: "shot", s: s.s, o: s.o, d: s.d }); }
      for (const e of g.events) if (e[0] === "melee_swing") send({ t: "melee" });
      acc += dt; if (acc >= 0.05) { acc = 0; send({ t: "s", x: +g.px.toFixed(2), y: +g.py.toFixed(2), yaw: +g.yaw.toFixed(3), pitch: +g.pitch.toFixed(3), cr: g.crouchT > 0.5 ? 1 : 0, w: g.w().cfg.id }); }
    }
    function hostRelay(g, dt) {
      const ids = Object.keys(lobby).filter((id) => lobby[id].full);
      if (g.over && !st.overSent) { st.overSent = true; send({ t: "over" }); }
      if (!g.over) st.overSent = false;
      const fx = g.popOut();
      if (!ids.length) return;
      // efeitos para cada convidado
      const list = [];
      for (const e of g.events) {
        if (e.drop) continue;
        const k = e[0];
        if (k === "shot") list.push(Object.assign(["rshot", st.id, e[1], g.px - Math.sin(g.yaw) * 0.7, g.py + Math.cos(g.yaw) * 0.7, g.eyeH() - 0.2, e[2], e[3], e[4], !!e[5]], { src: "host" }));
        else if (WORLD.test(k)) list.push(e);
      }
      if (list.length) for (const id of ids) {
        const mine = list.filter((e) => e.src !== id && !(e[0] === "rshot" && e[1] === id));
        if (mine.length) send({ t: "ev", e: mine }, id);
      }
      const per = {}; for (const f of fx) (per[f[0]] = per[f[0]] || []).push(f[1]);
      for (const id in per) send({ t: "fx", e: per[id] }, id);
      // estado do mundo ~15 vezes por segundo
      sAcc += dt; if (sAcc < 1 / 15) return; sAcc = 0;
      const nz = [], np = [];
      for (const q of g.zombies) if (!sentZ.has(q.id)) { sentZ.add(q.id); nz.push(g.staticZombie(q)); }
      for (const p of g.pickups) if (!sentP.has(p.id)) { sentP.add(p.id); np.push(g.staticPickup(p)); }
      if (sentZ.size > 400) { const live = new Set(g.zombies.map((q) => q.id)); sentZ = new Set([...sentZ].filter((i) => live.has(i))); }
      if (sentP.size > 400) { const live = new Set(g.pickups.map((q) => q.id)); sentP = new Set([...sentP].filter((i) => live.has(i))); }
      const snap = g.makeSnapshot(nz, np); snap.t = "snap";
      const fullIds = ids.filter((id) => lobby[id].needFull), rest = ids.filter((id) => !lobby[id].needFull);
      if (rest.length) { const s = JSON.stringify(snap); for (const id of rest) { try { st.ws.send(JSON.stringify({ t: "snap", to: id }).slice(0, -1) + "," + s.slice(1)); } catch (e) {} } }
      for (const id of fullIds) {
        const full = g.makeSnapshot(g.zombies.map((q) => g.staticZombie(q)), g.pickups.map((p) => g.staticPickup(p))); full.t = "snap"; send(full, id); lobby[id].needFull = false;
      }
    }
    let clawCd = 0;
    function claw(g) {                                                     // jogador zumbi ataca com as garras
      if (g.team !== "z" || !g.alive) return;
      const now = performance.now(); if (now < clawCd) return; clawCd = now + 700;
      if (st.host) g.claw(st.id); else send({ t: "claw" });
      Snd.play("melee", 0.8, rand(0.7, 0.85)); g.shake = Math.max(g.shake, 0.25); ZArms.swipe();
    }
    function onToMenu() {
      if (!connected()) return;
      if (st.host && st.started) { st.started = false; send({ t: "over" }); hostLobby(); }
      else if (!st.host) send({ t: "gone" });
      clearAllies();
    }
    // ---------------- HUD do time ----------------
    let teamKey = "", infKey = "";
    function infHud(g) {
      const e = $("inf"); if (!e) return;
      const on = g.gm === "infect" && !!g.inf;
      $("hud").classList.toggle("infmode", on);
      let t = "";
      if (on) {
        const I = g.inf, mm = Math.floor(Math.max(0, I.t) / 60), ss = String(Math.max(0, Math.ceil(I.t)) % 60).padStart(2, "0");
        t = I.ph === "play" ? "HUMANOS " + I.hu + " · ZUMBIS " + I.zo + " · " + mm + ":" + ss : I.ph === "end" ? (I.win === "h" ? "HUMANOS VENCERAM" : "ZUMBIS VENCERAM") : "PREPARE-SE";
        if (g.team === "z") t = "VOCÊ É ZUMBI · " + t;
      }
      if (t !== infKey) { infKey = t; e.textContent = t; e.hidden = !t; e.classList.toggle("z", g.team === "z"); }
    }
    function hud(g) {
      const e = $("team"); if (!e) return;
      if (!active()) { infHud(g); if (teamKey) { teamKey = ""; e.innerHTML = ""; } return; }
      if (!g.others.length) { infHud(g); if (teamKey) { teamKey = ""; e.innerHTML = ""; } return; }
      infHud(g);
      const rows = g.others.map((o) => [(o.name || nameOf(o.id)) + (o.team === "z" ? " (zumbi)" : ""), Math.max(0, Math.round(o.hp)), o.maxHp || 100, o.alive && o.team !== "z", slotOf(o.id), o.id]);
      const k = JSON.stringify(rows); if (k === teamKey) return; teamKey = k;
      e.innerHTML = rows.map((r) => '<div class="tm' + (r[3] ? "" : " down") + '"><i style="background:' + colorHex(shirtOf(r[5])) + '"></i><b>' + String(r[0]).replace(/[<>&]/g, "") + '</b><u><s style="width:' + Math.round(100 * clamp(r[1] / r[2], 0, 1)) + '%"></s></u></div>').join("");
    }
    // ---------------- UI do lobby ----------------
    function bindUI() {
      const nm = $("coopName"); if (!nm) return;
      try { nm.value = localStorage.getItem("arena-zumbi-room") || ""; } catch (e) {}
      const modes = document.querySelectorAll("[data-gm]");
      const paint = () => modes.forEach((b) => b.classList.toggle("on", b.getAttribute("data-gm") === st.gmSel));
      modes.forEach((b) => b.addEventListener("click", () => { st.gmSel = b.getAttribute("data-gm"); paint(); }));
      paint();
      const go = (role) => { try { localStorage.setItem("arena-zumbi-room", nm.value.trim()); } catch (e) {} open(role, nm.value, $("coopPass").value); };
      $("btnCoopCreate").addEventListener("click", () => go("host"));
      $("btnCoopJoin").addEventListener("click", () => go("guest"));
      $("btnCoopLeave").addEventListener("click", () => { onToMenu(); leave(); });
      for (const id of ["coopName", "coopPass"]) $(id).addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter") go("guest"); });
      renderLobby();
    }
    return { st, active, ended, attach, afterUpdate, hostStartBroadcast, sendInfo, hud, onToMenu, bindUI, nameOf, slotOf, shirtOf, claw, connected, leave, isHost: () => st.host, inRoom: () => connected(), toast: (m) => setMsg(m, "err"), lobby };
  })();
