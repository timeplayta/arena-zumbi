
  // ======================================================================
  //  JOGO: estado, entrada, animação, HUD e laço principal
  // ======================================================================
  let game = new Game({ loadout: loadoutSel(), diff: S.diff });
  let menuGame = null;
  const zviews = new Map(), pviews = new Map(), keys = new Set();
  let mouseDown = false, adsHeld = false, lockHeld = false, torchEnabled = true;
  let adsT = 0, sprintBlend = 0, lagX = 0, lagY = 0, camRoll = 0, lastInp = {}, menuAng = 0, last = performance.now(), flickerT = 0, dmgT = 0;
  const tmpV = new THREE.Vector3();
  const lerp = (a, b, t) => a + (b - a) * t;
  let runUsed = [], burnFlash = 0;
  let zPrevFire = false, zPrevAds = false;

  // ---------------- efeitos dos zumbis especiais ----------------
  const shocks = [], crackViews = new Map();
  const ringGeo = new THREE.RingGeometry(0.8, 1, 56);
  // onda de choque no chão (coordenadas lógicas)
  function shockwave(x, y, R, col, dur, op) {
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op || 0.8, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.07, -y); m.scale.setScalar(0.3); scene.add(m);
    shocks.push({ m, t: 0, dur: dur || 0.7, R, op: op || 0.8 });
    while (shocks.length > 8) { const o = shocks.shift(); scene.remove(o.m); o.m.material.dispose(); }
  }
  function updateShocks(dt) {
    for (let i = shocks.length - 1; i >= 0; i--) {
      const s = shocks[i]; s.t += dt; const u = s.t / s.dur;
      if (u >= 1) { scene.remove(s.m); s.m.material.dispose(); shocks.splice(i, 1); continue; }
      s.m.scale.setScalar(0.3 + s.R * (1 - Math.pow(1 - u, 2.2)));
      s.m.material.opacity = s.op * Math.pow(1 - u, 1.6);
    }
  }
  // nuvem de poeira em volta de um ponto
  function dust(x, y, n, spread, size) {
    n = Math.max(2, Math.round(n * fxK()));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, r = Math.random() * spread;
      fxSmoke.emit(x + Math.cos(a) * r, 0.12, -(y + Math.sin(a) * r), (size || 0.9) * (0.7 + Math.random() * 0.6), 1.1 + Math.random() * 0.7, 0.38, Math.cos(a) * 1.3, 0.5 + Math.random() * 0.5, -Math.sin(a) * 1.3);
    }
  }
  // rachaduras da espada do Espectro: desenhadas num canvas por rachadura, somem em 10 s
  function makeCrackView(c) {
    let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
    for (const ln of c.lines) for (const p of ln) { minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]); miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); }
    const cx = (minx + maxx) / 2, cy = (miny + maxy) / 2, size = Math.max(maxx - minx, maxy - miny) + 3;
    const N = 512, k = N / size, cv = document.createElement("canvas"); cv.width = cv.height = N;
    const g = cv.getContext("2d"), X = (x) => (x - cx) * k + N / 2, Y = (y) => N / 2 - (y - cy) * k;
    const hole = g.createRadialGradient(X(c.x), Y(c.y), 2, X(c.x), Y(c.y), c.r * k);
    hole.addColorStop(0, "rgba(0,4,6,0.96)"); hole.addColorStop(0.7, "rgba(2,14,18,0.85)"); hole.addColorStop(1, "rgba(10,60,72,0)");
    g.fillStyle = hole; g.beginPath(); g.arc(X(c.x), Y(c.y), c.r * k, 0, 6.2832); g.fill();
    g.lineCap = "round"; g.lineJoin = "round";
    for (const [w, col] of [[15, "rgba(40,200,240,0.16)"], [8, "rgba(110,235,255,0.5)"], [3.4, "#01090c"]]) {
      g.lineWidth = w; g.strokeStyle = col;
      for (const ln of c.lines) { g.beginPath(); ln.forEach((p, i) => { if (i) g.lineTo(X(p[0]), Y(p[1])); else g.moveTo(X(p[0]), Y(p[1])); }); g.stroke(); }
    }
    g.lineWidth = 3; g.strokeStyle = "rgba(150,245,255,0.7)"; g.beginPath(); g.arc(X(c.x), Y(c.y), c.r * k * 0.92, 0, 6.2832); g.stroke();
    const tex = new THREE.CanvasTexture(cv);
    const mt = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mt); m.rotation.x = -Math.PI / 2; m.position.set(cx, 0.04, -cy); scene.add(m);
    return { m, mt, tex, size, cx, cy };
  }
  function syncCracks(g) {
    const seen = new Set();
    for (const c of g.cracks) {
      seen.add(c.id);
      let v = crackViews.get(c.id); if (!v) { v = makeCrackView(c); crackViews.set(c.id, v); }
      const open = Math.min(1, c.t / 0.35), left = c.ttl - c.t;
      v.m.scale.setScalar(0.35 + 0.65 * (1 - Math.pow(1 - open, 3)));
      v.mt.opacity = Math.min(1, open * 1.2) * Math.min(1, left / 2.5) * (left > 2.5 ? 0.9 + 0.1 * Math.sin(c.t * 7) : 1);
    }
    for (const [id, v] of crackViews) if (!seen.has(id)) { scene.remove(v.m); v.m.geometry.dispose(); v.mt.dispose(); v.tex.dispose(); crackViews.delete(id); }
  }
  function clearSpecialFx() {
    for (const s of shocks) { scene.remove(s.m); s.m.material.dispose(); }
    shocks.length = 0;
    for (const [, v] of crackViews) { scene.remove(v.m); v.m.geometry.dispose(); v.mt.dispose(); v.tex.dispose(); }
    crackViews.clear();
  }

  function makeMenuGame() {
    const g = new Game({}), n = 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.283 + Math.random(), r = 6 + Math.random() * 7;
      const p = L.pushOut(Math.cos(a) * r, Math.sin(a) * r, 0.5);
      const z = new L.Zombie(p[0], p[1], 100, 1, i % 5 === 0 ? "brute" : i % 3 === 0 ? "runner" : "walker", i % 3, g, 1);
      z.yaw = Math.random() * 6.28; g.zombies.push(z);
    }
    return g;
  }
  function syncZombies(g) {
    const seen = new Set();
    for (const z of g.zombies) {
      if (z.puppet && z.puppet === Coop.st.id) continue;                 // infecção: o próprio zumbi não aparece na câmera
      seen.add(z.id);
      let v = zviews.get(z.id);
      if (!v) { v = z.tank ? new TankView(z) : z.samurai ? new SamuraiView(z) : z.wraith ? new WraithView(z) : new ZombieView(z); if (z.puppet) redSkin(v); zviews.set(z.id, v); }
      v.update(z);
      if (z.gz && v.root) { v.root.position.y += z.gz; if (v.shadow) v.shadow.position.y += z.gz; }   // morros e escadas (vila da Infecção)
    }
    for (const [id, v] of zviews) if (!seen.has(id)) { v.destroy(); zviews.delete(id); }
  }
  function syncPickups(g) {
    const seen = new Set();
    for (const p of g.pickups) {
      if (!g.mine(p)) continue;                                   // item de outro jogador: invisível
      seen.add(p);
      let v = pviews.get(p);
      if (!v) { v = new PickupView(p.kind); pviews.set(p, v); }
      v.update(p, g.time);
      if (p.gz === undefined) p.gz = Logic.groundAt(p.x, p.y, 99);
      v.root.position.y = p.gz;
    }
    for (const [p, v] of pviews) if (!seen.has(p)) { v.destroy(); pviews.delete(p); }
  }
  function clearViews() {
    for (const [, v] of zviews) v.destroy();
    zviews.clear();
    for (const [, v] of pviews) v.destroy();
    pviews.clear();
    clearSpecialFx();
  }

  // ---------------- fluxo ----------------
  let lockFailed = false;
  function lockPointer() {
    canvas.style.cursor = "none";
    setTimeout(() => { lockFailed = state === "run" && document.pointerLockElement !== canvas; }, 600);
    try {
      const p = canvas.requestPointerLock({ unadjustedMovement: true });
      if (p && p.catch) p.catch(() => { try { canvas.requestPointerLock(); } catch (e) {} });
    } catch (e) { try { canvas.requestPointerLock(); } catch (e2) {} }
  }
  document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement === canvas) lockHeld = true;
    else if (lockHeld) { lockHeld = false; if (state === "run") pause(); }
  });
  function startGame() {
    if (Coop.inRoom() && !Coop.st.starting) {
      if (!Coop.isHost()) { Coop.toast("Só o anfitrião inicia a partida."); return; }
      Coop.hostStartBroadcast();
    }
    Snd.init(); applySound();
    clearViews(); resetFx(); clearDropped();
    sanitizeOwned();
    payRun(game, runUsed);
    const ro = runOpts(); runUsed = ro.used; burnFlash = 0;
    game = new Game({ loadout: loadoutSel(), diff: Coop.inRoom() && !Coop.isHost() ? Coop.st.diff : S.diff, perks: ro.perks, melee: ro.melee });
    clearAllies(); Coop.attach(game); Coop.sendInfo(ro);
    useMap(game.gm === "infect" ? "italia" : "arena");                            // Infecção: vila italiana; resto: arena
    setMeleeModel(wallet.melee); updateWho();
    vmKey = ""; setViewGun(game.w());
    adsT = 0; sprintBlend = 0; hfov = S.fov; dmgT = 0; $("feed").innerHTML = "";
    for (const k of ro.used) feedLine(k === "revive" ? "SEGUNDA CHANCE ATIVA" : k === "ammoPack" ? "MOCHILA DUPLA ATIVA" : "COLETE EXTRA ATIVO", false);
    $("menu").hidden = true; $("hud").hidden = false; $("pause").hidden = true; $("dead").hidden = true;
    $("hud").querySelector(".radar-box").hidden = !S.radar;
    applyCrosshair();
    state = "run"; applyEnv();
    last = performance.now(); mouseDown = false; adsHeld = false;
    resetTouch(); applyTouchUI();
    $("hint").textContent = touchOn() ? TOUCH_HINT : keyHint();
    if (touchOn()) goFullscreen(); else lockPointer();
  }
  function pause() {
    if (state !== "run") return;
    state = "pause"; mouseDown = false; adsHeld = false; keys.clear();
    try { document.exitPointerLock(); } catch (e) {}
    canvas.style.cursor = ""; lockFailed = false;
    $("pause").hidden = false;
    resetTouch(); applyTouchUI();
  }
  function resume() {
    $("pause").hidden = true; state = "run"; last = performance.now(); applyTouchUI();
    if (!touchOn()) lockPointer();
  }
  function toMenu() {
    try { document.exitPointerLock(); } catch (e) {}
    canvas.style.cursor = ""; state = "menu"; Coop.onToMenu(); payRun(game, runUsed); useMap("arena"); clearViews(); resetFx(); menuGame = makeMenuGame(); hfov = 70;
    $("menu").hidden = false; $("hud").hidden = true; $("pause").hidden = true; $("dead").hidden = true; $("scope").style.opacity = "0";
    $("view").classList.remove("low"); $("fx-low").style.opacity = "0"; $("fx-hurt").style.opacity = "0";
    applyEnv(); renderAll(); showTab(ui.tab); resetTouch(); applyTouchUI();
  }
  function onDeath() {
    state = "dead"; mouseDown = false; adsHeld = false; canvas.style.cursor = "";
    resetTouch(); applyTouchUI();
    try { document.exitPointerLock(); } catch (e) {}
    const g = game, acc = g.shots ? Math.round((100 * g.hits) / g.shots) : 0;
    $("fWave").textContent = g.wave; $("fScore").textContent = g.score; $("fKills").textContent = g.kills;
    $("fHead").textContent = g.headshots; $("fAcc").textContent = acc + "%"; $("fTime").textContent = fmtTime(g.time);
    const top = g.score > 0 ? saveScore({ name: S.name || "Sobrevivente", score: g.score, wave: g.wave, kills: g.kills, diff: DIFF[S.diff].name, date: Date.now() }) : false;
    $("newrec").hidden = !top;
    const earned = payRun(g, runUsed);
    $("fCoins").textContent = String(earned);
    $("fCoinsNote").textContent = "Você ganhou " + earned + " moedas. Na carteira: " + wallet.coins + ". Gaste na Loja do menu.";
    setTimeout(() => { if (state === "dead") $("dead").hidden = false; }, 900);
  }
  $("btnPlay").addEventListener("click", startGame);
  $("btnResume").addEventListener("click", resume);
  $("btnRestart").addEventListener("click", startGame);
  $("btnToMenu1").addEventListener("click", toMenu);
  $("btnToMenu2").addEventListener("click", toMenu);

  // ---------------- teclas configuráveis (Controles > Teclado) ----------------
  const BIND_DEF = { fwd: "KeyW", back: "KeyS", left: "KeyA", right: "KeyD", sprint: "ShiftLeft", crouch: "KeyC", reload: "KeyR", slot1: "Digit1", slot2: "Digit2", swap: "KeyQ", melee: "KeyV", mode: "KeyB", torch: "KeyF", mute: "KeyM", pause: "KeyP" };
  const BIND_LABEL = { fwd: "Andar para frente", back: "Andar para trás", left: "Andar para a esquerda", right: "Andar para a direita", sprint: "Correr / prender a respiração", crouch: "Agachar",
    reload: "Recarregar", slot1: "Arma 1", slot2: "Arma 2", swap: "Trocar de arma", melee: "Golpe de faca", mode: "Modo de tiro (auto / semi / rajada)", torch: "Lanterna", mute: "Som liga/desliga", pause: "Pausar (Esc sempre pausa)" };
  function loadBinds() { let b = {}; try { b = JSON.parse(S.binds || "{}") || {}; } catch (e) {} const o = Object.assign({}, BIND_DEF); for (const k in o) if (typeof b[k] === "string" && b[k]) o[k] = b[k]; return o; }
  let KB = loadBinds(), bindWait = null;
  function keyName(c) {
    if (!c) return "—";
    if (/^Key[A-Z]$/.test(c)) return c.slice(3);
    if (/^Digit\d$/.test(c)) return c.slice(5);
    if (/^Numpad\d$/.test(c)) return "Num " + c.slice(6);
    const N = { ShiftLeft: "Shift", ShiftRight: "Shift dir.", ControlLeft: "Ctrl", ControlRight: "Ctrl dir.", AltLeft: "Alt", AltRight: "Alt Gr", Space: "Espaço", Tab: "Tab", CapsLock: "Caps Lock",
      Enter: "Enter", Backspace: "Backspace", ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→", Backquote: "'", Minus: "-", Equal: "=", BracketLeft: "´", BracketRight: "[", Semicolon: "Ç", Quote: "~", Backslash: "]", Comma: ",", Period: ".", Slash: ";", IntlBackslash: "\\" };
    return N[c] || c;
  }
  function keyHint() {
    return keyName(KB.fwd) + keyName(KB.left) + keyName(KB.back) + keyName(KB.right) + " mover · Mouse mirar · Clique atirar · Botão direito mirar · " + keyName(KB.reload) + " recarregar · " + keyName(KB.slot1) + "/" + keyName(KB.slot2) +
      " ou roda trocar arma · " + keyName(KB.crouch) + " agachar · " + keyName(KB.melee) + " faca · " + keyName(KB.mode) + " modo de tiro · " + keyName(KB.sprint) + " correr · " + keyName(KB.torch) + " lanterna · Esc pausar";
  }
  function renderBinds() {
    const box = $("bindList"); if (!box) return;
    box.innerHTML = Object.keys(BIND_DEF).map((k) => '<div class="bind"><span>' + BIND_LABEL[k] + '</span><button type="button" class="bkey' + (bindWait === k ? " wait" : "") + '" data-bind="' + k + '">' + (bindWait === k ? "Aperte uma tecla…" : keyName(KB[k])) + "</button></div>").join("");
  }
  function saveBinds() {
    const o = {}; for (const k in KB) if (KB[k] !== BIND_DEF[k]) o[k] = KB[k];
    S.binds = Object.keys(o).length ? JSON.stringify(o) : ""; saveSettings(); renderBinds();
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-bind]");
    if (b) { bindWait = bindWait === b.getAttribute("data-bind") ? null : b.getAttribute("data-bind"); renderBinds(); return; }
    if (e.target.id === "btnBindReset") { KB = Object.assign({}, BIND_DEF); bindWait = null; saveBinds(); }
  });
  window.addEventListener("keydown", (e) => {                                     // esperando a nova tecla: pega antes do jogo
    if (!bindWait) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const c = e.code, k = bindWait; bindWait = null;
    if (c && c !== "Escape") {
      const other = Object.keys(KB).find((q) => q !== k && KB[q] === c);
      if (other) KB[other] = KB[k];                                                  // tecla já usada: as duas trocam de lugar
      KB[k] = c;
    }
    saveBinds();
  }, true);

  // ---------------- entrada ----------------
  window.addEventListener("keydown", (e) => {
    if (e.target && e.target.tagName === "INPUT") return;
    const c = e.code;
    if (state !== "menu" && ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].indexOf(c) >= 0) e.preventDefault();
    if (e.repeat) return;
    keys.add(c);
    if (state === "run") {
      if (c === "Escape" || c === KB.pause) pause();
      else if (c === KB.reload) game.startReload();
      else if (c === KB.slot1) game.switchWeapon(0);
      else if (c === KB.slot2) game.switchWeapon(1);
      else if (c === KB.swap) game.switchWeapon(1 - game.cur);
      else if (c === KB.melee) game.requestMelee();
      else if (c === KB.mode) game.toggleFireMode();
      else if (c === KB.torch) { torchEnabled = !torchEnabled; }
      else if (c === KB.mute) { S.muted = Snd.toggleMute(); saveSettings(); }
    } else if (state === "dead" && (c === KB.reload || c === "Space")) startGame();
  });
  window.addEventListener("keyup", (e) => keys.delete(e.code));
  window.addEventListener("blur", () => { keys.clear(); mouseDown = false; adsHeld = false; if (state === "run") pause(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && state === "run") pause(); });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("mousedown", (e) => { if (state !== "run") return; if (e.button === 0) mouseDown = true; else if (e.button === 2) adsHeld = true; });
  window.addEventListener("mouseup", (e) => { if (e.button === 0) mouseDown = false; else if (e.button === 2) adsHeld = false; });
  window.addEventListener("mousemove", (e) => {
    if (state !== "run" || (document.pointerLockElement !== canvas && !lockFailed) || !game.alive) return;
    const ratio = adsHeld ? adsRatio() : 1;
    const k = (S.sens / 12) * 0.0022 * ratio;
    game.look(-e.movementX * k, -e.movementY * k * (S.invertY ? -1 : 1));
    lagX = clamp(lagX - e.movementX * 0.00018, -0.03, 0.03); lagY = clamp(lagY + e.movementY * 0.00018, -0.03, 0.03);
  });
  window.addEventListener("wheel", (e) => { if (state !== "run") return; e.preventDefault(); game.switchWeapon(1 - game.cur); }, { passive: false });

  // ---------------- toque (celular) ----------------
  const TOUCH_HINT = "Esquerda: arraste para andar (empurre até o fim para correr) · Direita: arraste para olhar · ● atirar · ◎ mirar";
  const adsRatio = () => (Math.tan((hfov * Math.PI) / 360) / Math.tan((S.fov * Math.PI) / 360)) * (S.adsSens / 70);
  const TS = { ptr: new Map(), move: null, mx: 0, my: 0, fire: false, ads: false, crouch: false, sprint: false, alt: false };
  const touchEl = $("touch"), stickEl = $("stick"), knobEl = $("knob");
  function buzz(ms) { if (S.vibrate && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} } }
  function resetTouch() {
    TS.ptr.clear(); TS.move = null; TS.mx = TS.my = 0; TS.fire = false; TS.sprint = false;
    if (state !== "pause") { TS.ads = false; TS.crouch = false; }
    stickEl.classList.remove("show", "run"); knobEl.style.transform = "";
    touchEl.querySelectorAll(".press").forEach((b) => b.classList.remove("press"));
  }
  function syncTouchBtns() {
    const set = (act, on) => { const b = touchEl.querySelector('[data-act="' + act + '"]'); if (b) b.classList.toggle("on", on); };
    set("ads", TS.ads); set("crouch", TS.crouch); set("torch", torchEnabled); set("autofire", !!S.autoFire);
    const md = touchEl.querySelector('[data-act="mode"]');
    if (md) md.hidden = !(game.w().cfg.modes && game.w().cfg.modes.length > 1);
  }
  function applyTouchUI() {
    const on = touchOn();
    $("stage").classList.toggle("touchmode", on);
    touchEl.hidden = !(on && state === "run");
    touchEl.style.setProperty("--bs", String(S.btnSize / 100));
    touchEl.style.setProperty("--ba", String(S.btnAlpha / 100));
    $("stage").style.setProperty("--hs", String(clamp(S.hudSize || 100, 50, 120) / 100));
    $("tzone").hidden = !(state === "run" && game.time < 12);
    syncTouchBtns();
    if (tEdit) { touchEl.hidden = false; $("tzone").hidden = false; }
    if (!touchEl.hidden) applyTouchPos();
  }
  // ---------------- editor: posição de cada botão de toque (Ajustes > Posicionar botões) ----------------
  let tEdit = null;
  const TPOS_ACTS = ["fire", "ads", "reload", "swap", "melee", "crouch", "mode"];
  function tposGet() { try { return JSON.parse(S.tpos || "{}") || {}; } catch (e) { return {}; } }
  function applyTouchPos() {
    const P = tposGet(), r = touchEl.getBoundingClientRect();
    for (const a of TPOS_ACTS) {
      const b = touchEl.querySelector('.tb[data-act="' + a + '"]'); if (!b) continue;
      const p = P[a];
      if (p && r.width) { b.style.left = p[0] * r.width - b.offsetWidth / 2 + "px"; b.style.top = p[1] * r.height - b.offsetHeight / 2 + "px"; b.style.right = "auto"; b.style.bottom = "auto"; }
      else b.style.left = b.style.top = b.style.right = b.style.bottom = "";
    }
  }
  function openTouchEdit() {
    tEdit = { drag: null }; $("menu").hidden = true; $("tedit").hidden = false;
    touchEl.classList.add("editing"); applyTouchUI();
  }
  function closeTouchEdit() {
    tEdit = null; touchEl.classList.remove("editing"); $("tedit").hidden = true; $("menu").hidden = false; applyTouchUI();
  }
  touchEl.addEventListener("pointerdown", (e) => {
    if (!tEdit) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const b = e.target.closest && e.target.closest(".tb[data-act]"); if (!b || b.closest(".ttop")) return;
    try { touchEl.setPointerCapture(e.pointerId); } catch (err) {}
    const br = b.getBoundingClientRect();
    tEdit.drag = { id: e.pointerId, b, dx: e.clientX - (br.left + br.width / 2), dy: e.clientY - (br.top + br.height / 2) };
    b.classList.add("press");
  }, true);
  touchEl.addEventListener("pointermove", (e) => {
    if (!tEdit) return; e.stopImmediatePropagation();
    const d = tEdit.drag; if (!d || d.id !== e.pointerId) return;
    const r = touchEl.getBoundingClientRect(), w = d.b.offsetWidth, h = d.b.offsetHeight;
    const cx = clamp(e.clientX - d.dx - r.left, w / 2, r.width - w / 2), cy = clamp(e.clientY - d.dy - r.top, h / 2, r.height - h / 2);
    d.b.style.left = cx - w / 2 + "px"; d.b.style.top = cy - h / 2 + "px"; d.b.style.right = "auto"; d.b.style.bottom = "auto"; d.cx = cx / r.width; d.cy = cy / r.height;
  }, true);
  const tEditUp = (e) => {
    if (!tEdit) return; e.stopImmediatePropagation();
    const d = tEdit.drag; if (!d || d.id !== e.pointerId) return;
    d.b.classList.remove("press"); tEdit.drag = null;
    if (d.cx !== undefined) { const P = tposGet(); P[d.b.getAttribute("data-act")] = [+d.cx.toFixed(4), +d.cy.toFixed(4)]; S.tpos = JSON.stringify(P); saveSettings(); }
  };
  touchEl.addEventListener("pointerup", tEditUp, true); touchEl.addEventListener("pointercancel", tEditUp, true);
  $("btnTouchEdit").addEventListener("click", openTouchEdit);
  $("btnTeditDone").addEventListener("click", closeTouchEdit);
  $("btnTeditReset").addEventListener("click", () => { S.tpos = ""; saveSettings(); applyTouchPos(); });
  window.addEventListener("resize", () => { if (!touchEl.hidden) applyTouchPos(); });
  function goFullscreen() {
    if (!S.fullscreen) return;
    const d = document.documentElement, fn = d.requestFullscreen || d.webkitRequestFullscreen;
    if (fn && !document.fullscreenElement) { try { const r = fn.call(d, { navigationUI: "hide" }); if (r && r.catch) r.catch(() => {}); } catch (e) {} }
    try { const r = screen.orientation && screen.orientation.lock && screen.orientation.lock("landscape"); if (r && r.catch) r.catch(() => {}); } catch (e) {}
  }
  function pressAct(act, down) {
    if (act === "fire") { TS.fire = down; return; }
    if (!down) return;
    if (act === "ads" && game.team === "z") { Coop.claw(game, true); return; }   // infectado: botão de mira = golpe pesado
    if (act === "ads") TS.ads = !TS.ads;
    else if (act === "reload") game.startReload();
    else if (act === "swap") game.switchWeapon(1 - game.cur);
    else if (act === "melee") game.requestMelee();
    else if (act === "crouch") TS.crouch = !TS.crouch;
    else if (act === "mode") game.toggleFireMode();
    else if (act === "torch") torchEnabled = !torchEnabled;
    else if (act === "autofire") { S.autoFire = !S.autoFire; saveSettings(); feedLine(S.autoFire ? "TIRO AUTOMÁTICO LIGADO" : "TIRO AUTOMÁTICO DESLIGADO", false); }   // só existe no HUD de toque
    else if (act === "pause") { pause(); return; }
    syncTouchBtns();
  }
  touchEl.addEventListener("pointerdown", (e) => {
    if (state !== "run") return;
    e.preventDefault();
    try { touchEl.setPointerCapture(e.pointerId); } catch (err) {}
    Snd.init();
    const b = e.target.closest && e.target.closest("[data-act]");
    if (b) {
      const act = b.getAttribute("data-act");
      TS.ptr.set(e.pointerId, { role: act, x: e.clientX, y: e.clientY, el: b });
      b.classList.add("press");
      pressAct(act, true);
      return;
    }
    const r = touchEl.getBoundingClientRect();
    if (e.clientX - r.left < r.width * 0.45 && !TS.move) {
      TS.move = { id: e.pointerId, ox: e.clientX, oy: e.clientY };
      TS.ptr.set(e.pointerId, { role: "move" });
      stickEl.style.left = e.clientX - r.left + "px"; stickEl.style.top = e.clientY - r.top + "px";
      stickEl.classList.add("show"); knobEl.style.transform = "";
      $("tzone").hidden = true;
    } else TS.ptr.set(e.pointerId, { role: "look", x: e.clientX, y: e.clientY });
  }, { passive: false });
  touchEl.addEventListener("pointermove", (e) => {
    const p = TS.ptr.get(e.pointerId);
    if (!p || state !== "run") return;
    e.preventDefault();
    if (p.role === "move") {
      const R = 62 * (S.btnSize / 100), m = TS.move;
      let dx = e.clientX - m.ox, dy = e.clientY - m.oy, len = Math.hypot(dx, dy);
      if (len > R * 1.7) {                      // o direcional acompanha o dedo
        const k = (len - R * 1.7) / len; m.ox += dx * k; m.oy += dy * k; dx = e.clientX - m.ox; dy = e.clientY - m.oy; len = Math.hypot(dx, dy);
        const r = touchEl.getBoundingClientRect(); stickEl.style.left = m.ox - r.left + "px"; stickEl.style.top = m.oy - r.top + "px";
      }
      const c = Math.min(1, R / Math.max(len, 1e-6));
      TS.mx = (dx * c) / R; TS.my = (dy * c) / R;
      knobEl.style.transform = "translate(" + (dx * c).toFixed(1) + "px," + (dy * c).toFixed(1) + "px)";
      TS.sprint = -TS.my > 0.9 && Math.abs(TS.mx) < 0.45 && len > R * 1.05;
      stickEl.classList.toggle("run", TS.sprint);
    } else if (p.role === "look" || p.role === "fire") {
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (!game.alive) return;
      const k = (S.touchSens / 12) * 0.0045 * (game.ads ? adsRatio() : 1);
      game.look(-dx * k, -dy * k * (S.invertY ? -1 : 1));
      lagX = clamp(lagX - dx * 0.00012, -0.03, 0.03); lagY = clamp(lagY + dy * 0.00012, -0.03, 0.03);
    }
  }, { passive: false });
  function endPtr(e) {
    const p = TS.ptr.get(e.pointerId);
    if (!p) return;
    TS.ptr.delete(e.pointerId);
    if (p.role === "move") { TS.move = null; TS.mx = TS.my = 0; TS.sprint = false; stickEl.classList.remove("show", "run"); knobEl.style.transform = ""; }
    else if (p.el) { p.el.classList.remove("press"); pressAct(p.role, false); }
  }
  touchEl.addEventListener("pointerup", endPtr);
  touchEl.addEventListener("pointercancel", endPtr);
  touchEl.addEventListener("contextmenu", (e) => e.preventDefault());
  // entrada combinada (teclado/mouse + toque), com tiro automático opcional
  function touchInput(inp) {
    if (!touchOn()) return inp;
    inp.fwd = clamp(inp.fwd - TS.my, -1, 1); inp.strafe = clamp(inp.strafe + TS.mx, -1, 1);
    inp.sprint = inp.sprint || TS.sprint; inp.ads = inp.ads || TS.ads; inp.crouch = inp.crouch || TS.crouch;
    let want = TS.fire;
    if (!want && S.autoFire && game.alive && game.team !== "z" && game.switchT <= 0 && game.aimTarget(game.ads ? 60 : 35)) want = true;   // tiro automático: nunca para garra
    if (want) {
      TS.alt = !TS.alt;                          // armas semiautomáticas: "aperta e solta" sozinho
      inp.fire = inp.fire || (game.mode() === "auto" ? true : TS.alt);
    }
    return inp;
  }

  // ---------------- animação da arma e da câmera ----------------
  // carregadores jogados no chão
  const dropped = [];
  let magDropped = false;
  const dropGeo = new THREE.BoxGeometry(0.03, 0.12, 0.05), dropMat = new THREE.MeshLambertMaterial({ color: 0x1a1b1e });
  function dropMag() {
    const m = new THREE.Mesh(dropGeo, dropMat);
    camera.updateMatrixWorld(true);
    if (vm.parts.mag) vm.parts.mag.getWorldPosition(tmpV); else vm.group.getWorldPosition(tmpV);
    m.position.set(tmpV.x, tmpV.y - 0.05, tmpV.z);
    const e = camera.matrixWorld.elements;
    scene.add(m);
    dropped.push({ m, vx: e[0] * 0.5 - e[8] * 0.1, vy: -0.3, vz: e[2] * 0.5 - e[10] * 0.1, sx: rand(-5, 5), sz: rand(-5, 5), age: 0 });
    if (dropped.length > 6) { const o = dropped.shift(); scene.remove(o.m); }
    setTimeout(() => { if (state === "run") Snd.play("casing", 0.35, 0.6, 0.2, 0.1); }, 330);
  }
  function updateDropped(dt) {
    for (let i = dropped.length - 1; i >= 0; i--) {
      const d = dropped[i]; d.age += dt;
      if (d.m.position.y > 0.03) { d.vy -= 9.8 * dt; d.m.position.x += d.vx * dt; d.m.position.y += d.vy * dt; d.m.position.z += d.vz * dt; d.m.rotation.x += d.sx * dt; d.m.rotation.z += d.sz * dt; }
      else { d.m.position.y = 0.03; d.m.rotation.x = 1.57; d.m.rotation.z = 0; }
      if (d.age > 12) { scene.remove(d.m); dropped.splice(i, 1); }
    }
  }
  function clearDropped() { while (dropped.length) scene.remove(dropped.pop().m); }

  function animateGun(dt, g) {
    const c = g.w().cfg, v = VM[c.id], P = vm.parts;
    adsT += ((g.ads ? 1 : 0) - adsT) * Math.min(1, dt * 11);
    sprintBlend += ((g.sprinting ? 1 : 0) - sprintBlend) * Math.min(1, dt * 8);
    const a = adsT, wa = 1 - a;
    let x = lerp(v.hip[0], 0, a), y = lerp(v.hip[1], -vm.sightTop, a), z = lerp(v.hip[2], v.adsZ, a);
    let rx = 0, ry = 0, rz = 0;
    const walk = g.moving ? (g.sprinting ? 1.7 : 1) : 0;
    if (S.bob) { x += Math.sin(g.bob) * 0.008 * walk * wa; y += Math.abs(Math.cos(g.bob)) * 0.01 * walk * wa; }
    y += Math.sin(g.time * 1.6) * 0.0015; x += Math.sin(g.time * 0.9) * 0.001;
    const dec = Math.exp(-8 * dt); lagX *= dec; lagY *= dec;
    x += lagX * wa; y += lagY * wa;
    const km = 0.45 + c.rec.v * 0.17;                    // o modelo da arma coice conforme o recuo dela
    z += g.kick * 0.05 * km; rx += g.kick * 0.08 * km * (1 - a * 0.5);
    y -= sprintBlend * 0.07; x -= sprintBlend * 0.03; rz += sprintBlend * 0.4; ry -= sprintBlend * 0.5;
    let magVis = true, magY = 0, lhX = 0, lhY = 0, lhZ = 0, lhRx = 0;
    const lh = P.lhand, lb = lh && lh.userData.base;
    if (g.reloading) {
      const p = clamp(1 - g.reloadT / g.reloadTotal, 0, 1);
      if (c.shell) { rz += 0.5; rx += 0.25; y -= 0.03; x += Math.sin(g.time * 16) * 0.01; }
      else {
        const dip = Math.sin(Math.PI * p);
        rz += dip * 0.35; rx -= dip * 0.25; y -= dip * 0.06; x -= dip * 0.03;
        // mão de apoio desce até o carregador, tira, pega outro e insere
        if (lb) { const m = Math.sin(Math.PI * clamp(p * 1.05, 0, 1)); lhY = -m * 0.1 + (p > 0.55 && p < 0.8 ? 0.03 : 0); lhX = m * 0.05; lhZ = m * (c.id === "p45" ? 0 : 0.14 + (c.id === "falcao" ? 0.03 : 0)); lhRx = m * 0.5; }
        if (P.mag) {
          if (p < 0.25) magY = -(p / 0.25) * 0.18;
          else if (p < 0.55) { magVis = false; if (!magDropped) { magDropped = true; dropMag(); } }
          else if (p < 0.8) magY = -(1 - (p - 0.55) / 0.25) * 0.18;
        }
      }
    } else magDropped = false;
    if (P.mag) { P.mag.visible = magVis; P.mag.position.y = magY; }
    if (lh && lb) lh.position.set(lb[0] + lhX, lb[1] + lhY, lb[2] + lhZ);
    if (lh && lb) lh.rotation.x = 0.3 + lhRx;
    let off = 0;
    if (c.delay > 0.3 && g.cool > 0) off = Math.sin(Math.PI * clamp((1 - g.cool / c.delay - 0.3) / 0.4, 0, 1));
    const empty = g.w().mag === 0 && !g.reloading;
    if (P.pump) P.pump.position.z = off * 0.09;
    if (P.bolt) {
      if (c.delay > 0.3) { P.bolt.position.z = off * 0.08; P.bolt.rotation.z = off * 0.6; }
      else { P.bolt.position.z = Math.min(1, g.kick * 1.4) * 0.035 + (empty ? 0.035 : 0); P.bolt.rotation.z = 0; }
    }
    if (P.slide) P.slide.position.z = Math.min(1, g.kick * 1.4) * 0.035 + (empty ? 0.04 : 0);
    if (g.switchT > 0) { const d = Math.sin(Math.PI * (1 - g.switchT / SWITCH_TIME)); y -= d * 0.3; rx -= d * 0.7; }
    const mt = g.meleeT > 0 ? 1 - g.meleeT / g.mel.cd : 1;
    if (g.meleeT > 0) { y -= Math.sin(Math.PI * Math.min(1, mt / 0.7)) * 0.25; rx -= 0.2; }
    // ---- animação das mãos: dedos no gatilho, aperto no recuo, abrir e fechar na recarga ----
    {
      const sm = (e0, e1, v) => { const t = clamp((v - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
      const kk = Math.min(1, g.kick * 1.5), idle = Math.sin(g.time * 1.3) * 0.025, breath = Math.sin(g.time * 0.9) * 0.012;
      const sw = g.switchT > 0 ? Math.sin(Math.PI * (1 - g.switchT / SWITCH_TIME)) : 0;
      const rest = 0.1 - sprintBlend * 0.12 + sw * 0.2;
      if (P.rrig) {
        const reloadingNow = g.reloading;
        HK.pose(P.rrig, { grip: rest + idle + kk * 0.22, trig: reloadingNow || sprintBlend > 0.5 ? -0.2 : 0.02 + kk * 0.85, thumb: kk * 0.18 - sprintBlend * 0.1, rx: kk * 0.05 + breath });
      }
      if (P.lrig) {
        let lg = rest + idle * 0.8, lth = 0, lrx = 0;
        if (g.reloading && !c.shell) {
          const pr = clamp(1 - g.reloadT / g.reloadTotal, 0, 1);
          lg = -0.35 * sm(0, 0.15, pr) * (1 - sm(0.15, 0.22, pr)) + 0.5 * sm(0.18, 0.26, pr) * (1 - sm(0.78, 0.92, pr)) + rest * sm(0.9, 1, pr);
          lth = 0.3 * sm(0.2, 0.28, pr) * (1 - sm(0.8, 0.92, pr));
          lrx = 0.1 * Math.sin(Math.PI * pr);
        } else if (c.shell) lg = 0.2 + 0.25 * off + idle * 0.5;
        HK.pose(P.lrig, { grip: lg, thumb: lth, rx: lrx + breath });
      }
    }
    gunRoot.position.set(x, y, z); gunRoot.rotation.set(rx, ry, rz);
    vm.group.visible = !(c.scope && a > 0.85);
    if (g.meleeT > 0 && mt < 0.6) {
      const s = mt / 0.6, e = s * s * (3 - 2 * s);
      if (knifeRig) HK.pose(knifeRig, { grip: 0.1 + 0.35 * Math.sin(Math.PI * s), thumb: 0.25 * s, rz: -0.25 * e });
      knife.visible = true; knife.position.set(lerp(0.35, -0.2, e), lerp(-0.35, -0.15, e), lerp(-0.25, -0.55, e)); knife.rotation.set(-0.3, lerp(0.3, -0.5, e), lerp(1.0, -0.6, e));
    } else knife.visible = false;
    if (g.flashT > 0) {
      const s = c.flash * (0.8 + Math.random() * 0.6);
      flashSprite.scale.set(s, s, 1); flashSprite.material.rotation = Math.random() * 6; flashSprite.visible = true; flashLight.intensity = 4;
    } else { flashSprite.visible = false; flashLight.intensity = 0; }
    $("scope").style.opacity = c.scope ? String(clamp((a - 0.8) * 5, 0, 1)) : "0";
    $("cross").classList.toggle("scoped", !!c.scope && a > 0.8);
  }

  function syncGame(dt) {
    const g = game, c = g.w().cfg;
    setViewGun(g.w());
    const zm = g.team === "z";
    gunRoot.visible = !zm; torch.visible = torchEnabled;
    $("view").classList.toggle("zmode", zm); $("hud").classList.toggle("zhud", zm);
    const bobh = S.bob && g.moving ? Math.abs(Math.sin(g.bob)) * (g.sprinting ? 0.05 : 0.03) : 0;
    const sh = g.hurtT * 0.05 + g.shake * 0.03, sway = g.aimSway();
    camera.position.set(g.px, g.eyeH() + bobh, -g.py);
    camRoll += (-(lastInp.strafe || 0) * 0.012 - camRoll) * Math.min(1, dt * 8);
    camera.rotation.set(g.pitch + g.recoil + sway[1] + (sh ? (Math.random() - 0.5) * sh : 0), g.yaw + g.recoilYaw + sway[0] + (sh ? (Math.random() - 0.5) * sh : 0), camRoll);
    hfov += ((g.ads ? c.adsFov : S.fov) - hfov) * Math.min(1, dt * 12);
    camera.fov = vfovFor(hfov); camera.updateProjectionMatrix();
    animateGun(dt, g); if (zm) knife.visible = false; ZArms.update(g, dt);
    flickerT -= dt;
    if (flickerT <= 0) { flickerT = rand(0.04, 0.2); lampLights[2].intensity = env.lamp * (Math.random() < 0.25 ? rand(0, 0.5) : 1); }
    syncZombies(g); syncPickups(g); syncCracks(g); updateShocks(dt); syncAllies(g, dt); syncBoosts(g);
    fxBlood.update(dt); fxSpark.update(dt); fxBrass.update(dt); fxShell.update(dt); fxSmoke.update(dt); fxTrace.update(dt); updatePools(dt); updateDropped(dt);
  }

  // ---------------- eventos do jogo -> som e efeitos ----------------
  function feedLine(text, head, cls) {
    const d = document.createElement("div"); d.textContent = text; if (head) d.className = "head"; if (cls) d.className = cls;
    const f = $("feed"); f.appendChild(d);
    while (f.children.length > 4) f.removeChild(f.firstChild);
    setTimeout(() => { if (d.parentNode) d.parentNode.removeChild(d); }, 1900);
  }
  // som posicional simples: volume pela distância e pan pelo lado
  const distTo = (x, y) => Math.hypot(x - game.px, y - game.py);
  const panOf = (x, y) => { const d = distTo(x, y) || 1; return clamp(((x - game.px) * Math.cos(game.yaw) + (y - game.py) * Math.sin(game.yaw)) / d, -1, 1); };
  const volAt = (x, y, far) => Math.pow(clamp(1 - distTo(x, y) / (far || 30), 0, 1), 1.2);
  const spatial = (name, x, y, v, pitch, wet, far) => Snd.play(name, Math.max(0.05, volAt(x, y, far)) * v, pitch, panOf(x, y), wet === undefined ? 0.2 : wet);
  WraithView.onThud = (z, k) => {
    if (z.ix === undefined || state === "menu") return;
    spatial("sword_thud", z.ix, z.iy, 1.0, rand(0.9, 1.05), 0.3, 34);
    dust(z.ix, z.iy, 5, 1.8, 0.8); shockwave(z.ix, z.iy, 1.8 + k, 0x7ff0ff, 0.5, 0.45);
    game.shake = Math.max(game.shake, 0.3 * k + 0.1);
  };
  WraithView.onPull = (z) => { if (state !== "menu") spatial("sword_pull", z.x, z.y, 0.9, rand(0.9, 1.1), 0.3, 40); };
  const MODE_NAME = { auto: "AUTOMÁTICO", semi: "SEMIAUTOMÁTICO", burst: "RAJADA DE 3" };
  const SHOT_VOL = { p45: 0.85, smg: 0.75, ax4: 0.9, brutus: 1, falcao: 1 };
  function processEvents() {
    for (const ev of game.popEvents()) {
      if (ev.drop) continue;
      switch (ev[0]) {
        case "rshot": {
          const wid = ev[2], o = game.others.find((q) => q.id === ev[1]);
          fxTrace.emit(ev[3], ev[5], -ev[4], ev[6], ev[8], -ev[7], ev[9]);
          if (o) o.flash = 0.07;
          if (ev[9]) spatial("shot_sil", ev[3], ev[4], 0.8, 1, 0.05, 40);
          else spatial("shot_" + wid, ev[3], ev[4], SHOT_VOL[wid] || 0.9, rand(0.96, 1.05), 0.3, 55);
          break;
        }
        case "infected": {
          const me = ev[1] === Coop.st.id, nm = me ? "VOCÊ" : (Coop.nameOf(ev[1]) || "ALGUÉM").toUpperCase();
          feedLine(ev[2] ? nm + (me ? " É O PRIMEIRO ZUMBI!" : " É O PRIMEIRO ZUMBI") : nm + (me ? " VIROU ZUMBI!" : " VIROU ZUMBI"), true);
          Snd.play("giantroar", me ? 0.9 : 0.5, 1.25, 0, 0.2); if (me) { buzz([80, 40, 160]); game.shake = Math.max(game.shake, 0.8); }
          break;
        }
        case "claw": spatial("melee", ev[1], ev[2], ev[3] ? 1 : 0.9, ev[3] ? rand(0.5, 0.6) : rand(0.65, 0.8), 0.1, 25); break;
        case "boost": spatial("pickup", ev[2], ev[3], 0.7, ev[1] === "speed" ? 1.4 : 1, 0.2, 30); break;
        case "boost_me": feedLine(ev[1] === "speed" ? "VELOCIDADE +40% POR 8 s" : "VIDA RECUPERADA", true, "hp"); Snd.play("pickup", 1, ev[1] === "speed" ? 1.5 : 1.1); buzz(30); break;
        case "zrespawn": if (ev[1] === Coop.st.id) feedLine("VOCÊ VOLTOU", false); break;
        case "inf_end": Snd.play("horn", 1, ev[1] === "h" ? 1.1 : 0.6, 0, 0); break;
        case "ally_down": feedLine((Coop.nameOf(ev[1]) || "ALIADO").toUpperCase() + " CAIU", true); break;
        case "shot": {
          const id = ev[1];
          camera.updateMatrixWorld(true); vm.muzzle.getWorldPosition(tmpV);
          fxTrace.emit(tmpV.x, tmpV.y, tmpV.z, ev[2], ev[4], -ev[3], ev[5]);
          if (ev[5]) { Snd.play("shot_sil", 0.8, id === "falcao" ? 0.7 : id === "brutus" ? 0.8 : 1, 0, 0.05); }
          else { Snd.play("shot_" + id, SHOT_VOL[id], rand(0.96, 1.05), 0, 0.3); if (Math.random() < fxK()) fxSmoke.emit(tmpV.x, tmpV.y, tmpV.z, 0.1, 0.9, 0.3, 0, 0.3, -0.1); }
          break;
        }
        case "eject": {
          const id = ev[1], delay = id === "brutus" ? 330 : id === "falcao" ? 520 : 0;
          const spawn = () => {
            if (state !== "run") return;
            camera.updateMatrixWorld(true); vm.eject.getWorldPosition(tmpV);
            const e = camera.matrixWorld.elements, s1 = rand(1.2, 2.2), s2 = rand(0.8, 1.8), s3 = rand(-0.3, 0.5);
            (id === "brutus" ? fxShell : fxBrass).emit(tmpV.x, tmpV.y, tmpV.z, e[0] * s1 + e[4] * s2 - e[8] * s3, e[1] * s1 + e[5] * s2 - e[9] * s3, e[2] * s1 + e[6] * s2 - e[10] * s3, 4, 1, rand(8, 18));
            setTimeout(() => Snd.play("casing", 0.22, rand(0.9, 1.2), 0.3, 0.1), 380);
          };
          if (delay) setTimeout(spawn, delay); else spawn();
          break;
        }
        case "wall": {
          const tx = ev[1], ty = ev[3], tz = -ev[2], nx = ev[4], ny = ev[6], nz = -ev[5];
          bulletHole(tx, ty, tz, nx, ny, nz);
          if (S.gore) for (let i = 0, n = Math.round(4 * fxK()); i < n; i++) fxSpark.emit(tx, ty, tz, nx * 2 + rand(-1, 1), ny * 2 + rand(-0.5, 1.5), nz * 2 + rand(-1, 1), 0.3 + Math.random() * 0.3, 1);
          if (Math.random() < fxK()) fxSmoke.emit(tx + nx * 0.05, ty + ny * 0.05, tz + nz * 0.05, 0.12, 0.5, 0.18, nx * 0.2, ny * 0.2 + 0.1, nz * 0.2);
          break;
        }
        case "hit": bloodBurst(ev[1], ev[2], ev[3], ev[4] ? 9 : 6, 3.2, ev[4] ? 1.2 : 1); Snd.play("hit", 0.7, rand(0.9, 1.15), 0, 0.08); break;
        case "kill": {
          const kd = ev[8];
          if (kd === "wraith") {
            for (let i = 0, n = Math.round(14 * fxK()); i < n; i++) fxSpark.emit(ev[1], 1.0 + rand(-0.6, 0.8), -ev[2], rand(-2, 2), rand(0.5, 3), rand(-2, 2), 0.5 + Math.random() * 0.6, 1.2);
            shockwave(ev[1], ev[2], 3, 0x7ff0ff, 0.9, 0.6);
            spatial("wail", ev[1], ev[2], 0.9, 0.6, 0.5, 40);
          } else {
            bloodBurst(ev[1], ev[2], 1.0, ev[6] ? 22 : kd === "tank" ? 30 : 14, 3.5, 1.4);
            if (S.gore) bloodPool(ev[1], ev[2], ev[5] || kd === "tank");
            Snd.play("die", 0.8, ev[5] || kd === "tank" ? 0.6 : rand(0.9, 1.1), 0, 0.1);
            if (kd === "tank") { spatial("tankroar", ev[1], ev[2], 1, 0.6, 0.3, 40); dust(ev[1], ev[2], 8, 2.2, 1.2); }
          }
          const nm = kd === "tank" ? "COLOSSO " : kd === "samurai" ? "MESTRE " : kd === "wraith" ? "ESPECTRO " : ev[7] ? "GIGANTE " : ev[5] ? "BRUTO " : "";
          feedLine((ev[3] ? "HEADSHOT " : "") + nm + "ABATIDO +" + ev[4], ev[3] || !!kd);
          break;
        }
        case "hurt": buzz(45); dmgT = 1.2; $("dmgdir").style.transform = "rotate(" + ((-ev[1] * 180) / Math.PI).toFixed(1) + "deg)"; Snd.play("hurt", 1, rand(0.9, 1.1), 0, 0.05); break;
        case "groan": {
          const vol = Math.pow(clamp(1 - ev[1] / 26, 0, 1), 1.5) * 0.85, k = ev[2];
          if (k === "runner") Snd.play("scream", vol * 0.8, rand(0.9, 1.15), ev[3], 0.2);
          else if (k === "giant") Snd.play("giantroar", Math.min(1, vol * 1.3), rand(0.9, 1.05), ev[3], 0.25);
          else if (k === "brute") Snd.play("roar", vol, rand(0.9, 1.1), ev[3], 0.25);
          else if (k === "tank") Snd.play(Math.random() < 0.4 ? "tankroar" : "tankgrunt", Math.min(1, vol * 1.2), rand(0.9, 1.05), ev[3], 0.25);
          else if (k === "samurai") { if (Math.random() < 0.5) Snd.play("kiai", vol * 0.55, rand(0.8, 0.95), ev[3], 0.2); }
          else Snd.play("groan" + Math.floor(Math.random() * 3), vol, rand(0.85, 1.1), ev[3], 0.2);
          break;
        }
        case "step": Snd.play("step", 0.16 * ev[1] + 0.05, rand(0.85, 1.15), 0, 0.05); break;
        case "reload_start": Snd.play(ev[1] === "p45" ? "rl_pistol" : ev[1] === "falcao" ? "rl_bolt" : ev[1] === "brutus" ? "shell" : "rl_mag", 0.7, ev[1] === "smg" ? 1.1 : 1, 0, 0.04); break;
        case "shell_in": Snd.play("shell", 0.6, rand(0.9, 1.1), 0, 0.04); break;
        case "reload_done": if (ev[1] === "brutus") Snd.play("pump", 0.7, 1, 0, 0.05); break;
        case "pump": Snd.play("pump", 0.8, rand(0.95, 1.05), 0, 0.1); break;
        case "bolt": Snd.play("bolt", 0.8, 1, 0, 0.1); break;
        case "empty": Snd.play("empty", 0.8); break;
        case "switch": Snd.play("switch", 0.6); setTimeout(syncTouchBtns, 0); break;
        case "mode": Snd.play("switch", 0.5, 1.6); feedLine("MODO: " + MODE_NAME[game.mode()], false); break;
        case "melee_swing": Snd.play("melee", 0.6, rand(0.9, 1.1)); break;
        case "melee_hit": Snd.play("melee_hit", 0.9, rand(0.9, 1.1)); break;
        case "heart": Snd.play("heart", 0.8, 1, 0, 0); break;
        case "winded": Snd.play("winded", 0.5, 1, 0, 0); break;
        case "pickup":
          Snd.play("pickup", 0.8);
          feedLine(ev[1] === "health" ? "+" + ev[2] + " VIDA" : "+" + ev[2] + " MUNIÇÃO", false, ev[1] === "health" ? "hp" : "am");
          if (ev[1] === "health") { $("fx-hurt").style.opacity = "0"; }
          buzz(15);
          break;
        case "pickup_full": feedLine("VIDA CHEIA", false, "dim"); break;
        case "wave": Snd.play("horn", 0.9); break;
        case "giant": Snd.play("giantroar", 1, 0.9, 0, 0); Snd.play("horn", 0.7, 0.6, 0, 0); buzz([60, 40, 90]); break;
        case "stomp": Snd.play("stomp", Math.pow(clamp(1 - ev[1] / 28, 0, 1), 1.2) * (ev[2] ? 1.2 : 0.9), ev[2] ? rand(0.65, 0.8) : rand(0.9, 1.1), 0, 0.05); break;
        // ---- zumbis especiais ----
        case "elite": {
          const k = ev[1];
          Snd.play("horn", 0.8, 0.55, 0, 0);
          if (k === "tank") Snd.play("tankroar", 0.9, 0.9, 0, 0.3); else if (k === "samurai") Snd.play("kiai", 0.8, 0.9, 0, 0.3); else Snd.play("wail", 0.8, 0.8, 0, 0.5);
          buzz([60, 40, 120]); break;
        }
        case "block": {
          const tx = ev[1], ty = ev[3], tz = -ev[2];
          for (let i = 0, n = Math.round(8 * fxK()); i < n; i++) fxSpark.emit(tx, ty, tz, rand(-2.5, 2.5), rand(0, 3), rand(-2.5, 2.5), 0.25 + Math.random() * 0.3, 1.4);
          spatial("clang", ev[1], ev[2], 0.9, rand(0.85, 1.2), 0.3, 60); break;
        }
        case "armor": Snd.play("armor", 0.8, rand(0.9, 1.1), 0, 0.1); if (ev[1]) feedLine("ARMADURA DESTRUÍDA", false, "dim"); break;
        case "revive": Snd.play("revive", 1, 1, 0, 0.4); buzz([80, 40, 80, 40, 160]); feedLine("SEGUNDA CHANCE", true); break;
        case "burn": burnFlash = 0.35; Snd.play("burn", 0.45, rand(0.9, 1.1), 0, 0.05); buzz(25); break;
        case "tank_wind": spatial("tankroar", ev[1], ev[2], 1, 0.85, 0.3, 46); break;
        case "tank_charge": spatial("tank_charge", ev[1], ev[2], 1, 1, 0.2, 46); break;
        case "tank_ram": spatial("tank_slam", ev[1], ev[2], 0.9, 1.2, 0.2, 40); dust(ev[1], ev[2], 6, 1.2); buzz([120, 50, 120]); break;
        case "tank_slam": {
          shockwave(ev[1], ev[2], 4.6, 0xffb24a, 0.65); shockwave(ev[1], ev[2], 3, 0xffe0a0, 0.45, 0.5);
          dust(ev[1], ev[2], 10, 3.2, 1.1);
          for (let i = 0, n = Math.round(10 * fxK()); i < n; i++) { const a = Math.random() * 6.283; fxSpark.emit(ev[1], 0.1, -ev[2], Math.cos(a) * 3, rand(1, 4), -Math.sin(a) * 3, 0.5, 1.5); }
          spatial("tank_slam", ev[1], ev[2], 1.2, 1, 0.3, 60); buzz([90, 40, 160]); break;
        }
        case "tank_tired": spatial("breath", ev[1], ev[2], 0.9, 0.6, 0.2, 30); break;
        case "tank_bash": spatial("clang", ev[1], ev[2], 1, 0.6, 0.2, 40); spatial("tankgrunt", ev[1], ev[2], 0.8, 0.9, 0.2, 40); break;
        case "sam_draw": spatial("katana_draw", ev[1], ev[2], 0.95, 1, 0.3, 50); break;
        case "sam_wind": spatial("katana_swish", ev[3], ev[4], 0.35, 0.7, 0.1, 30); break;
        case "sam_slash": spatial("katana_swish", ev[3], ev[4], 1.0, rand(0.9, 1.15), 0.15, 40); if (Math.random() < 0.4) spatial("kiai", ev[3], ev[4], 0.8, rand(0.9, 1.1), 0.2, 40); break;
        case "sam_hit": Snd.play("katana_hit", 1, rand(0.9, 1.1), 0, 0.1); break;
        case "sam_dodge": spatial("dodge", ev[1], ev[2], 0.8, rand(0.9, 1.2), 0.1, 30); dust(ev[1], ev[2], 4, 0.8, 0.6); break;
        case "wraith_appear": spatial("wail", ev[1], ev[2], 1, rand(0.85, 1), 0.5, 50); spatial("whisper", ev[1], ev[2], 0.8, 1, 0.5, 40); break;
        case "wraith_hold": spatial("wraith_hold", ev[1], ev[2], 1, 1, 0.4, 50); break;
        case "wraith_slam": {
          shockwave(ev[1], ev[2], 5.2, 0x7ff0ff, 0.8); shockwave(ev[1], ev[2], 3.4, 0xffffff, 0.5, 0.5);
          dust(ev[1], ev[2], 12, 3.6, 1.2);
          for (let i = 0, n = Math.round(14 * fxK()); i < n; i++) { const a = Math.random() * 6.283; fxSpark.emit(ev[1], 0.1, -ev[2], Math.cos(a) * 4, rand(1, 5), -Math.sin(a) * 4, 0.6, 1.5); }
          Snd.play("sword_slam", 1, rand(0.95, 1.05), panOf(ev[1], ev[2]) * 0.5, 0.4); buzz([100, 50, 200]); break;
        }
        case "wraith_vanish": spatial("whisper", ev[1], ev[2], 0.7, 1.3, 0.5, 40); break;
        case "dead": Snd.play("die", 1, 0.7); if (Coop.active() && !Coop.ended()) feedLine("VOCÊ CAIU - RENASCE NA PRÓXIMA ONDA", true); break;
      }
    }
  }

  // ---------------- HUD ----------------
  const el = {
    wave: $("wave"), zleft: $("zleft"), score: $("score"), kills: $("kills"), hpnum: $("hpnum"), hpfill: $("hpfill"), stfill: $("stfill"),
    mag: $("mag"), reserve: $("reserve"), wname: $("wname"), wmode: $("wmode"), s0: $("s0"), s1: $("s1"), cross: $("cross"),
    banner: $("banner"), bigB: $("bannerBig"), subB: $("bannerSub"), msg: $("msg"), hint: $("hint"), hurt: $("fx-hurt"), low: $("fx-low"),
    radar: $("radar"), dir: $("dmgdir"), boss: $("boss"), bossfill: $("bossfill"), bossName: $("bossName"), arbar: $("arbar"), arfill: $("arfill"), coins: $("runCoins"),
  };
  const BOSS_NAME = { tank: "COLOSSO BLINDADO", wraith: "O ESPECTRO", giant: "GIGANTE" };
  const rctx = el.radar.getContext("2d");
  function drawRadar() {
    const g = game, Sz = el.radar.width, h = Sz / 2, sc = (h - 8) / RADAR_RANGE;
    rctx.clearRect(0, 0, Sz, Sz);
    const fx = -Math.sin(g.yaw), fy = Math.cos(g.yaw), rx = Math.cos(g.yaw), ry = Math.sin(g.yaw);
    rctx.strokeStyle = "rgba(255,255,255,0.12)"; rctx.lineWidth = 2;
    rctx.beginPath(); rctx.arc(h, h, h - 8, 0, 6.283); rctx.stroke();
    rctx.beginPath(); rctx.arc(h, h, (h - 8) / 2, 0, 6.283); rctx.stroke();
    const dot = (x, y, col, r) => {
      const dx = x - g.px, dy = y - g.py, lx = (dx * rx + dy * ry) * sc, ly = (dx * fx + dy * fy) * sc;
      if (Math.abs(lx) < h - 6 && Math.abs(ly) < h - 6) { rctx.fillStyle = col; rctx.fillRect(h + lx - r, h - ly - r, r * 2, r * 2); }
    };
    for (const o of g.others) if (o.alive && o.team !== "z") dot(o.x, o.y, "#6fe08a", 6);
    for (const z of g.zombies) {
      if (z.state === "dead") continue;
      if (z.wraith) { rctx.globalAlpha = z.vis > 0.3 ? 1 : 0.25 + 0.2 * Math.sin(g.time * 9); dot(z.x, z.y, "#7ffcff", 7); rctx.globalAlpha = 1; }
      else dot(z.x, z.y, z.tank ? "#b9dc4a" : z.samurai ? "#4ac8ff" : z.giant ? "#ff2ec8" : z.brute ? "#ff8a2e" : "#ff3b2e", z.tank ? 11 : z.giant ? 10 : z.samurai ? 6 : z.brute ? 7 : 5);
    }
    for (const p of g.pickups) if (g.mine(p)) dot(p.x, p.y, p.kind === "health" ? "#4ddc84" : "#ffc020", 4);
    rctx.fillStyle = "#fff"; rctx.fillRect(h - 6, h - 6, 12, 12); rctx.fillRect(h - 2, h - 22, 4, 14);
  }
  const hudLast = {};
  const setText = (node, key, val) => { if (hudLast[key] !== val) { hudLast[key] = val; node.textContent = val; } };
  function updateHud(dt) {
    const g = game, s = g.w(), c = s.cfg;
    Coop.hud(g);
    setText(el.wave, "wave", "ONDA " + Math.max(1, g.wave));
    setText(el.zleft, "zleft", String(g.aliveZombies().length + g.toSpawn));
    setText(el.score, "score", String(g.score)); setText(el.kills, "kills", String(g.kills));
    const [hpV, hpM] = g.coop ? g.lifeOf(g.coop.id, g) : [g.hp, g.maxHp];     // infectado: mostra a vida do zumbi
    setText(el.hpnum, "hp", String(Math.ceil(hpV)));
    el.hpfill.style.transform = "scaleX(" + clamp(hpV / hpM, 0, 1).toFixed(3) + ")";
    el.hpfill.style.background = hpV > hpM * 0.5 ? "var(--ok)" : hpV > hpM * 0.25 ? "var(--amber)" : "var(--danger)";
    el.arbar.classList.toggle("show", g.armorMax > 0);
    if (g.armorMax > 0) el.arfill.style.transform = "scaleX(" + clamp(g.armor / g.armorMax, 0, 1).toFixed(3) + ")";
    setText(el.coins, "coins", String(g.coins()));
    const scoped = c.scope && g.ads;
    el.stfill.style.transform = "scaleX(" + clamp(scoped ? g.breath / 4 : g.stamina / 100, 0, 1).toFixed(3) + ")";
    el.stfill.style.background = g.exhausted || g.breathLock ? "var(--danger)" : "#6fb7ff";
    setText(el.wname, "wname", c.name.toUpperCase());
    setText(el.wmode, "wmode", (c.pump ? "AÇÃO DE BOMBA" : c.bolt ? "FERROLHO" : { auto: "AUTOMÁTICA", semi: "SEMIAUTOMÁTICA", burst: "RAJADA 3" }[g.mode()]) + (c.modes && c.modes.length > 1 ? " [B]" : "") + (c.hasSil ? " · SILENC." : ""));
    setText(el.mag, "mag", String(s.mag)); el.mag.style.color = s.mag > Math.ceil(c.magMax * 0.2) ? "" : "var(--danger)";
    setText(el.reserve, "res", "/ " + s.reserve);
    setText(el.s0, "s0", "1 " + g.slots[0].cfg.name); setText(el.s1, "s1", "2 " + g.slots[1].cfg.name);
    el.s0.classList.toggle("on", g.cur === 0); el.s1.classList.toggle("on", g.cur === 1);
    el.cross.style.setProperty("--gap", (5 + g.spread() * 650).toFixed(1) + "px");
    el.cross.style.setProperty("--c", g.hitmarkT > 0 ? (g.hitmarkHead ? "#ffe34a" : "#ff4a3d") : S.crossColor);
    burnFlash = Math.max(0, burnFlash - (dt || 0.016));
    el.hurt.style.opacity = String(Math.min(0.9, Math.max(g.hurtT * 1.6, burnFlash * 1.4)));
    const lowHp = g.alive && g.hp < g.maxHp * 0.3;
    el.low.style.opacity = lowHp ? String(0.55 + 0.3 * Math.sin(g.time * 6)) : "0";
    $("view").classList.toggle("low", lowHp);
    dmgT = Math.max(0, dmgT - (dt || 0.016)); el.dir.style.opacity = String(Math.min(1, dmgT));
    if (g.bannerT > 0) {
      setText(el.bigB, "bb", g.banner);
      setText(el.subB, "bs", g.between && g.alive ? (g.bannerSub ? g.bannerSub + " · " : "") + "próxima onda em " + Math.ceil(g.pauseT) : g.bannerSub);
      el.banner.style.opacity = String(Math.min(1, g.bannerT));
    } else el.banner.style.opacity = "0";
    let msg = "";
    if (g.reloading) msg = "RECARREGANDO...";
    else if (s.mag === 0 && s.reserve === 0 && g.alive) msg = "SEM MUNIÇÃO";
    else if (g.exhausted && g.moving) msg = "SEM FÔLEGO";
    setText(el.msg, "msg", msg);
    el.hint.style.opacity = S.hints && g.time < 14 ? String(Math.min(1, (14 - g.time) / 3)) : "0";
    let bz = null, bp = 0;
    for (const z of g.zombies) {
      if (z.state === "dead") continue;
      const pr = z.wraith ? 3 : z.tank ? 2 : z.giant ? 1 : 0;
      if (pr && (pr > bp || (pr === bp && z.hp > bz.hp))) { bz = z; bp = pr; }
    }
    if (bz) {
      if (el.boss.hidden) el.boss.hidden = false;
      const kd = bz.wraith ? "wraith" : bz.tank ? "tank" : "giant";
      if (el.boss.dataset.k !== kd) { el.boss.dataset.k = kd; el.bossName.textContent = BOSS_NAME[kd]; }
      el.bossfill.style.transform = "scaleX(" + clamp(bz.hp / bz.maxHp, 0, 1).toFixed(3) + ")";
    } else if (!el.boss.hidden) el.boss.hidden = true;
    if (S.radar) drawRadar();
  }

  // ---------------- laço principal ----------------
  function menuTick(dt) {
    menuAng += dt * 0.08;
    camera.position.set(Math.cos(menuAng) * 14, 5.2, Math.sin(menuAng) * 14);
    camera.lookAt(0, 1.3, 0);
    hfov += (70 - hfov) * Math.min(1, dt * 4);
    camera.fov = vfovFor(hfov); camera.updateProjectionMatrix();
    gunRoot.visible = false; knife.visible = false; torch.visible = false;
    for (const z of menuGame.zombies) z.phase += dt * 1.3;
    syncZombies(menuGame);
    updateWeather(dt);
  }
  let lastDraw = 0, fpsN = 0, fpsT = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const cap = Number(S.fpsCap) || 0;
    if (cap && now - lastDraw < 1000 / cap - 2) return;
    lastDraw = now;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (S.showFps) { fpsN++; fpsT += dt; if (fpsT >= 0.5) { $("fps").textContent = Math.round(fpsN / fpsT) + " FPS"; fpsN = 0; fpsT = 0; } }
    if (state === "run") {
      const k = 1.9 * dt;
      if (keys.has("ArrowLeft")) game.look(k, 0);
      if (keys.has("ArrowRight")) game.look(-k, 0);
      if (keys.has("ArrowUp")) game.look(0, k);
      if (keys.has("ArrowDown")) game.look(0, -k);
      const shift = keys.has(KB.sprint) || (KB.sprint === "ShiftLeft" && keys.has("ShiftRight"));
      lastInp = {
        fwd: (keys.has(KB.fwd) ? 1 : 0) - (keys.has(KB.back) ? 1 : 0), strafe: (keys.has(KB.right) ? 1 : 0) - (keys.has(KB.left) ? 1 : 0),
        sprint: shift, hold: shift, fire: mouseDown, ads: adsHeld, crouch: keys.has(KB.crouch),
      };
      touchInput(lastInp);
      if (game.team === "z") {                                   // infectado: um golpe por clique (segurar não repete)
        const f = !!lastInp.fire, a = !!lastInp.ads;
        if (f && !zPrevFire) Coop.claw(game); else if (a && !zPrevAds) Coop.claw(game, true);
        zPrevFire = f; zPrevAds = a; lastInp.fire = false; lastInp.ads = false;
      }   // infecção: zumbi ataca com as garras
      if (game.time > 12 && !$("tzone").hidden) $("tzone").hidden = true;
      game.update(dt, lastInp); Coop.afterUpdate(game, dt); processEvents(); syncGame(dt); updateHud(dt); updateWeather(dt);
      if (!game.alive && Coop.ended()) onDeath();
      else if (Coop.active() && Coop.ended()) onDeath();
    } else if (state === "pause" && Coop.active()) {
      game.update(dt, {}); Coop.afterUpdate(game, dt); processEvents(); syncGame(dt); updateHud(dt); updateWeather(dt);
      if (Coop.ended()) onDeath();
    } else if (state === "dead") {
      game.update(dt, {}); processEvents(); syncGame(dt); updateHud(dt); updateWeather(dt);
    } else if (state === "menu") menuTick(dt);
    renderer.render(scene, camera);
    if (state === "menu" && ui.tab === "arsenal" && pvRenderer) { pvPivot.rotation.y += dt * 0.7; pvRenderer.render(pvScene, pvCam); }
  }

  // co-op: aba em segundo plano não recebe quadros; um timer de Worker mantém o mundo do anfitrião rodando
  let bgLast = performance.now();
  function bgTick() {
    const now = performance.now(), dt = Math.min((now - bgLast) / 1000, 0.1); bgLast = now;
    if (!document.hidden || !Coop.active() || (state !== "run" && state !== "pause")) return;
    last = now; game.update(dt, {}); Coop.afterUpdate(game, dt); processEvents();
    if (Coop.ended()) onDeath();
  }
  try {
    const bgw = new Worker(URL.createObjectURL(new Blob(["setInterval(function(){postMessage(0)},50)"], { type: "text/javascript" })));
    bgw.onmessage = bgTick;
  } catch (e) {}

  // ---------------- atualizações ----------------
  // Novidades: aparece uma vez quando a versão sobe (site, .exe e APK). No site, avisa se publicaram versão nova com a aba aberta.
  const UPD_HOST = "https://arena-zumbi.playes.workers.dev/";
  (function () {
    if (typeof GAME_VERSION === "undefined") return;
    const KEY = "arena-zumbi-ver";
    let seen = 0; try { seen = Number(localStorage.getItem(KEY)) || 0; } catch (e) {}
    const show = (title, notes, btn, fn) => {
      const o = $("upd"); if (!o) return;
      $("updTitle").textContent = title;
      $("updBody").innerHTML = "<b>" + String(notes.t || "").replace(/[<>&]/g, "") + "</b>" + (notes.b || []).map((l) => "<div>• " + String(l).replace(/[<>&`*]/g, "") + "</div>").join("");
      $("updOk").textContent = btn; $("updOk").onclick = () => { o.hidden = true; if (fn) fn(); };
      o.hidden = false;
    };
    if (seen && GAME_VERSION > seen) setTimeout(() => show("Jogo atualizado!", GAME_NOTES || {}, "OK"), 900);
    try { localStorage.setItem(KEY, String(GAME_VERSION)); } catch (e) {}
    if (!/^https?:$/.test(location.protocol) || /^(localhost|127\.)/.test(location.hostname)) return;   // apps: atualizam ao abrir
    const check = () => {
      if (state !== "menu") return;
      fetch(UPD_HOST + "version.json?t=" + Date.now(), { cache: "no-store" }).then((r) => r.json()).then((j) => {
        if (j && j.v > GAME_VERSION) show("Nova versão disponível", j.notes || {}, "Atualizar agora", () => location.reload());
      }).catch(() => {});
    };
    setTimeout(check, 4000); setInterval(check, 10 * 60 * 1000);
  })();

  // ---------------- início ----------------
  window.__arena = { get game() { return game; }, get state() { return state; }, S, startGame, toMenu, TS, touchOn, get pvPivot() { return pvPivot; }, showTab, renderArsenal, ui };
  hfov = 70;
  Coop.bindUI(); renderBinds();
  menuGame = makeMenuGame();
  resize(); applyQuality(); applyEnv(); applySound(); applyTouchUI(); $("fps").hidden = !S.showFps; renderAll(); showTab("mission");
  requestAnimationFrame(frame);
})();
