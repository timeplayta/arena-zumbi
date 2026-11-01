  // =====================================================================================================
  //  CO-OP ONLINE — cliente: sala, mensagens, aliados na cena e lobby.
  //  O anfitrião roda o mundo (Game com enableCoop("host")); convidados mandam posição/tiros e recebem snapshots.
  // =====================================================================================================
  const ALLY_COLORS = [0x3d8bff, 0x39c46a, 0xe6b422, 0xc45ad8];
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
  function makeAlly(idx, name) {
    const col = ALLY_COLORS[idx % ALLY_COLORS.length];
    const mat = (c, r) => new THREE.MeshStandardMaterial({ color: c, roughness: r === undefined ? 0.8 : r });
    const mVest = mat(col), mCloth = mat(0x2b3138), mSkin = mat(0xc9916b, 0.9), mHelm = mat(0x1f2a24), mGun = mat(0x15171a, 0.5);
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const box = (w, h, d, m, x, y, z, p) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); (p || body).add(o); return o; };
    const legs = [];
    for (const sx of [-0.11, 0.11]) { const lg = new THREE.Group(); lg.position.set(sx, 0.86, 0); body.add(lg); box(0.17, 0.86, 0.2, mCloth, 0, -0.43, 0, lg); legs.push(lg); }
    box(0.5, 0.62, 0.28, mVest, 0, 1.18, 0);
    box(0.44, 0.2, 0.26, mCloth, 0, 0.9, 0);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 12, 10), mSkin); head.position.set(0, 1.64, 0); body.add(head);
    const helm = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mHelm); helm.position.set(0, 1.66, 0); body.add(helm);
    const aim = new THREE.Group(); aim.position.set(0, 1.38, -0.12); body.add(aim);
    box(0.06, 0.1, 0.62, mGun, 0.1, -0.02, -0.34, aim);
    box(0.05, 0.05, 0.16, mGun, 0.1, -0.02, -0.7, aim);
    box(0.09, 0.09, 0.4, mSkin, -0.14, -0.04, -0.2, aim); box(0.09, 0.09, 0.3, mSkin, 0.18, -0.08, -0.12, aim);
    const flash = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd36a })); flash.position.set(0.1, -0.02, -0.82); flash.visible = false; aim.add(flash);
    const tag = allyTag(name || "Aliado"); root.add(tag);
    scene.add(root);
    return { root, body, legs, aim, flash, tag, name, step: 0 };
  }
  function syncAllies(g, dt) {
    const seen = new Set();
    g.others.forEach((o, i) => {
      seen.add(o.id);
      let v = allyViews.get(o.id);
      const nm = o.name || Coop.nameOf(o.id);
      if (!v || v.name !== nm) { if (v) { scene.remove(v.root); } v = makeAlly(Coop.slotOf(o.id), nm); allyViews.set(o.id, v); }
      v.root.position.set(o.x, 0, -o.y); v.root.rotation.y = o.yaw;
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

  const Coop = (() => {
    const st = { ws: null, id: null, host: false, code: "", status: "off", msg: "", players: [], started: false, diff: "normal", starting: false, over: false, name: "" };
    const lobby = {};                       // anfitrião: id -> { name, info, full }
    let acc = 0, sAcc = 0, sentZ = new Set(), sentP = new Set(), pingT = 0, game0 = null;
    const WORLD = /^(wave|giant|elite|kill|clear|wall|hit|rshot|ally_down|tank_|sam_|wraith_)/;
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
    function slotOf(id) { const i = st.players.findIndex((q) => q.id === id); return i < 0 ? Number(String(id).slice(1)) - 1 || 0 : i; }
    function renderLobby() {
      const e = $("coopPlayers"); if (!e) return;
      const on = connected();
      $("coopOff").hidden = on; $("coopOn").hidden = !on;
      if (on) {
        $("coopRoom").textContent = st.label || st.code;
        e.innerHTML = st.players.map((p, i) => '<div class="coop-p"><i style="background:#' + ALLY_COLORS[i % 4].toString(16).padStart(6, "0") + '"></i><b>' + p.name.replace(/[<>&]/g, "") + "</b>" + (p.id === "p1" ? "<span>anfitrião</span>" : "") + (p.id === st.id ? "<span>você</span>" : "") + "</div>").join("");
        $("coopHint").textContent = st.host ? (st.started ? "Partida em andamento. Quem entrar agora cai direto no jogo." : "Quando todos entrarem, clique em Jogar (embaixo) para começar.") : (st.started ? "Partida em andamento." : "Aguardando o anfitrião iniciar a partida.");
      }
      const pb = $("btnPlay"); if (pb) pb.textContent = on && !st.host ? "Aguardando anfitrião" : on ? "Jogar em co-op" : "Jogar";
    }
    function lobbyList() { return Object.keys(lobby).map((id) => ({ id, name: lobby[id].name })); }
    function hostLobby() {
      st.players = [{ id: "p1", name: st.name || "Anfitrião" }].concat(lobbyList());
      send({ t: "lobby", players: st.players, started: st.started, diff: st.diff }); renderLobby();
    }
    async function open(role, label, pass) {
      leave(true);
      const code = roomKey(label);
      if (code.length < 3) { setMsg("O nome da sala precisa de pelo menos 3 letras ou números.", "err"); return; }
      const h = serverHost(), pw = await hashPw(pass);
      st.name = (S.name || "Sobrevivente").slice(0, 14); st.code = code; st.label = String(label).trim().slice(0, 16); st.host = role === "host"; st.status = "connecting"; setMsg("Conectando...");
      const local = /^(localhost|127\.|192\.168\.|10\.)/.test(h);
      let ws; try { ws = new WebSocket((local ? "ws://" : "wss://") + h + "/ws/" + code + "?role=" + role + (pw ? "&pw=" + pw : "")); } catch (e) { setMsg("Não consegui conectar ao servidor.", "err"); st.status = "off"; return; }
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
          if (st.host) { st.started = false; hostLobby(); } else { send({ t: "hello", name: st.name }); renderLobby(); }
          break;
        case "error": setMsg(m.m || "Erro.", "err"); st.status = "error"; break;
        case "closed": setMsg("O anfitrião saiu da sala.", "err"); endMatchForGuest(); leave(true); break;
        // --- anfitrião ---
        case "join": break;
        case "hello": if (!st.host) break; lobby[m.from] = Object.assign(lobby[m.from] || {}, { name: String(m.name || "Jogador").slice(0, 14) }); hostLobby();
          if (st.started) send({ t: "start", diff: st.diff }, m.from); break;
        case "info": if (!st.host || !lobby[m.from]) break; lobby[m.from].info = m.info; lobby[m.from].full = true; if (game && game.coop) hostAddRemote(m.from); break;
        case "leave": if (!st.host) break; delete lobby[m.id]; if (game && game.coop) game.removeRemote(m.id); hostLobby();
          if (game && game.coop) feedLine("JOGADOR SAIU", false, "dim"); break;
        case "gone": if (st.host) { if (lobby[m.from]) lobby[m.from].full = false; if (game && game.coop) game.removeRemote(m.from); } break;
        case "s": if (st.host && game && game.coop) game.setRemote(m.from, m); break;
        case "shot": if (st.host && game && game.coop) game.remoteShot(m.from, m); break;
        case "melee": if (st.host && game && game.coop) game.remoteMelee(m.from); break;
        // --- convidado ---
        case "lobby": st.players = m.players || []; st.started = !!m.started; st.diff = m.diff || st.diff; renderLobby(); break;
        case "start": st.diff = m.diff || "normal"; st.started = true; st.over = false;
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
    }
    // ---------------- ligação com o jogo ----------------
    function hostStartBroadcast() { st.started = true; st.over = false; st.diff = S.diff; send({ t: "start", diff: st.diff }); hostLobby(); }
    function attach(g) {
      if (!connected()) { game0 = null; return; }
      g.enableCoop(st.host ? "host" : "guest", st.id); game0 = g; acc = sAcc = 0; sentZ = new Set(); sentP = new Set(); st.over = false;
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
    function onToMenu() {
      if (!connected()) return;
      if (st.host && st.started) { st.started = false; send({ t: "over" }); hostLobby(); }
      else if (!st.host) send({ t: "gone" });
      clearAllies();
    }
    // ---------------- HUD do time ----------------
    let teamKey = "";
    function hud(g) {
      const e = $("team"); if (!e) return;
      if (!active() || !g.others.length) { if (teamKey) { teamKey = ""; e.innerHTML = ""; } return; }
      const rows = g.others.map((o) => [o.name || nameOf(o.id), Math.max(0, Math.round(o.hp)), o.maxHp || 100, o.alive, slotOf(o.id)]);
      const k = JSON.stringify(rows); if (k === teamKey) return; teamKey = k;
      e.innerHTML = rows.map((r) => '<div class="tm' + (r[3] ? "" : " down") + '"><i style="background:#' + ALLY_COLORS[r[4] % 4].toString(16).padStart(6, "0") + '"></i><b>' + String(r[0]).replace(/[<>&]/g, "") + '</b><u><s style="width:' + Math.round(100 * clamp(r[1] / r[2], 0, 1)) + '%"></s></u></div>').join("");
    }
    // ---------------- UI do lobby ----------------
    function bindUI() {
      const nm = $("coopName"); if (!nm) return;
      try { nm.value = localStorage.getItem("arena-zumbi-room") || ""; } catch (e) {}
      const go = (role) => { try { localStorage.setItem("arena-zumbi-room", nm.value.trim()); } catch (e) {} open(role, nm.value, $("coopPass").value); };
      $("btnCoopCreate").addEventListener("click", () => go("host"));
      $("btnCoopJoin").addEventListener("click", () => go("guest"));
      $("btnCoopLeave").addEventListener("click", () => { onToMenu(); leave(); });
      for (const id of ["coopName", "coopPass"]) $(id).addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter") go("guest"); });
      renderLobby();
    }
    return { st, active, ended, attach, afterUpdate, hostStartBroadcast, sendInfo, hud, onToMenu, bindUI, nameOf, slotOf, connected, leave, isHost: () => st.host, inRoom: () => connected(), toast: (m) => setMsg(m, "err"), lobby };
  })();
