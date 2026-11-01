
  // ======================================================================
  //  MENU
  // ======================================================================
  let state = "menu"; // menu | run | pause | dead
  const ui = { tab: "mission", slot: 0 };
  const optBtn = (key, val, label, sub, on) =>
    '<button type="button" class="opt' + (on ? " on" : "") + '" data-set="' + key + '" data-val="' + val + '"><b>' + esc(label) + "</b>" + (sub ? "<span>" + esc(sub) + "</span>" : "") + "</button>";
  const pct = (v) => v + "%";
  const RANGE_FMT = { fov: (v) => v + "°", sens: (v) => v, adsSens: pct, vol: pct, crossSize: (v) => v, res: pct, volSfx: pct, volVoice: pct, volAmb: pct,
    touchSens: (v) => v, btnSize: pct, btnAlpha: pct };
  const RANGE_OUT = { fov: "oFov", sens: "oSens", adsSens: "oAds", vol: "oVol", crossSize: "oCrossSize", res: "oRes", volSfx: "oSfx", volVoice: "oVoice",
    volAmb: "oAmb", touchSens: "oTsens", btnSize: "oBsize", btnAlpha: "oBalpha" };

  // aplica na hora o efeito de cada ajuste
  function applySound() { Snd.setVolume(S.vol / 100); Snd.setMuted(S.muted); Snd.setMix(S.volSfx / 100, S.volVoice / 100, S.volAmb / 100); }
  function applySetting(k) {
    if (k === "quality") { Object.assign(S, (QUALITY[S.quality] || QUALITY.med).set); applyQuality(); }
    else if (k === "shadows" || k === "res") applyQuality();
    else if (k === "env" || k === "rainFx") applyEnv();
    else if (k === "fov") hfov = S.fov;
    else if (k === "vol" || k === "muted" || k === "volSfx" || k === "volVoice" || k === "volAmb") applySound();
    else if (k === "radar") $("hud").querySelector(".radar-box").hidden = !S.radar;
    else if (k === "showFps") $("fps").hidden = !S.showFps;
    else if (k === "touch" || k === "btnSize" || k === "btnAlpha") applyTouchUI();
    else if (k === "camo") vmKey = "";
    if (k === "camo" || k === "crossStyle" || k === "crossColor" || k === "crossSize") applyCrosshair();
  }

  function applyCrosshair() {
    for (const id of ["cross", "cross2"]) {
      const el = $(id);
      el.className = "xh st-" + S.crossStyle;
      el.style.setProperty("--c", S.crossColor);
      el.style.setProperty("--s", String(S.crossSize / 10));
    }
    $("cross2").style.setProperty("--gap", "8px");
  }
  const hexCss = (n) => "#" + n.toString(16).padStart(6, "0");

  function renderMission() {
    $("pname").value = S.name;
    $("optDiff").innerHTML = Object.keys(DIFF).map((k) => optBtn("diff", k, DIFF[k].name, DIFF[k].sub, S.diff === k)).join("");
    $("optEnv").innerHTML = Object.keys(ENVS).map((k) => optBtn("env", k, ENVS[k].n, ENVS[k].sub, S.env === k)).join("");
  }
  // gráfico: dano de um tiro (todos os projéteis acertando) conforme a distância
  function renderWeaponRange(c, st) {
    const W_ = 520, H_ = 190, ml = 34, mr = 10, mt = 12, mb = 24, X = 60;
    const body = (d) => L.damageAt(c, d, "torso") * c.pellets, head = (d) => L.damageAt(c, d, "head") * c.pellets;
    const ymax = Math.max(120, Math.ceil(head(0) / 50) * 50);
    const sx = (d) => ml + (d / X) * (W_ - ml - mr), sy = (v) => H_ - mb - (Math.min(v, ymax) / ymax) * (H_ - mt - mb);
    const path = (f) => {
      let p = "";
      for (let d = 0; d <= X; d += 1) { const v = d > c.range.max ? 0 : f(d); p += (p ? "L" : "M") + sx(d).toFixed(1) + " " + sy(v).toFixed(1); }
      return p;
    };
    let g = "";
    const ticks = ymax > 250 ? 100 : 50;
    for (let v = 0; v <= ymax; v += ticks) g += '<line x1="' + ml + '" x2="' + (W_ - mr) + '" y1="' + sy(v) + '" y2="' + sy(v) + '" stroke="#1c2432"/><text x="' + (ml - 5) + '" y="' + (sy(v) + 3) + '" text-anchor="end">' + v + "</text>";
    for (let d = 0; d <= X; d += 10) g += '<text x="' + sx(d) + '" y="' + (H_ - 8) + '" text-anchor="middle">' + d + (d === 60 ? " m" : "") + "</text>";
    g += '<line x1="' + ml + '" x2="' + (W_ - mr) + '" y1="' + sy(100) + '" y2="' + sy(100) + '" stroke="#4ddc84" stroke-dasharray="4 4" opacity="0.7"/><text x="' + (W_ - mr - 2) + '" y="' + (sy(100) - 4) + '" text-anchor="end" style="fill:#4ddc84">100 = um zumbi comum</text>';
    const eff = Math.min(X, c.range.full);
    g += '<rect x="' + sx(0) + '" y="' + mt + '" width="' + (sx(eff) - sx(0)) + '" height="' + (H_ - mt - mb) + '" fill="#ffb24a" opacity="0.07"/>';
    g += '<line x1="' + sx(eff) + '" x2="' + sx(eff) + '" y1="' + mt + '" y2="' + (H_ - mb) + '" stroke="#ffb24a" stroke-dasharray="3 3" opacity="0.8"/>';
    g += '<text x="' + (sx(eff) + 4) + '" y="' + (mt + 10) + '" style="fill:#ffb24a">dano total até ' + Math.round(c.range.full) + " m</text>";
    if (c.range.max <= X) g += '<line x1="' + sx(c.range.max) + '" x2="' + sx(c.range.max) + '" y1="' + mt + '" y2="' + (H_ - mb) + '" stroke="#ff5a4a" stroke-dasharray="3 3"/><text x="' + (sx(c.range.max) - 4) + '" y="' + (mt + 22) + '" text-anchor="end" style="fill:#ff5a4a">alcance máx. ' + Math.round(c.range.max) + " m</text>";
    g += '<path d="' + path(head) + '" fill="none" stroke="#ff5a4a" stroke-width="2"/><path d="' + path(body) + '" fill="none" stroke="#ffb24a" stroke-width="2"/>';
    const ttkRow = (d) => {
      const f = (zone) => { const v = L.damageAt(c, d, zone) * c.pellets; return v <= 0 ? "—" : Math.ceil(100 / v); };
      return "<tr><td class=\"k\">" + d + " m</td><td>" + f("torso") + "</td><td>" + f("head") + "</td><td>" + Math.round(body(d)) + " / " + Math.round(head(d)) + "</td></tr>";
    };
    const pct = (d) => Math.round(L.rangeFactor(c, d) * 100);
    $("wrange").innerHTML = '<div class="wchart"><svg viewBox="0 0 ' + W_ + " " + H_ + '" role="img" aria-label="Dano por distância">' + g + "</svg>" +
      '<div class="lg"><span><i style="background:#ffb24a"></i>Tiro no corpo</span><span><i style="background:#ff5a4a"></i>Tiro na cabeça (x' + c.head + ")</span></div></div>" +
      '<div class="wtiles">' +
      '<div class="wtile"><span>Dano total até</span><b>' + Math.round(c.range.full) + "<small>m</small></b></div>" +
      '<div class="wtile"><span>Dano mínimo em</span><b>' + Math.round(c.range.end) + "<small>m · " + pct(c.range.end) + "%</small></b></div>" +
      '<div class="wtile"><span>Alcance máximo</span><b>' + Math.round(c.range.max) + "<small>m</small></b></div>" +
      '<div class="wtile"><span>A 30 m faz</span><b>' + pct(30) + "<small>% do dano</small></b></div></div>" +
      '<table class="ttk"><thead><tr><th>Distância</th><th>Tiros p/ abater (corpo)</th><th>Tiros p/ abater (cabeça)</th><th>Dano por tiro</th></tr></thead><tbody>' +
      [5, 15, 30, 50].map(ttkRow).join("") + "</tbody></table>" +
      '<p class="wnote">Zumbi comum = 100 de vida (sobe a cada onda e nas dificuldades altas). Pernas recebem 65% do dano.' + (c.pellets > 1 ? " Escopeta: valores contam os " + c.pellets + " projéteis acertando; de longe muitos se perdem." : "") + (c.pierce ? " Atravessa até " + c.pierce + " alvos extras, com 30% menos dano a cada um." : "") + "</p>";
  }
  // recuo: números e o "desenho" que uma rajada contínua faz no alvo
  function renderWeaponRecoil(c, st) {
    const n = Math.min(c.magMax, 24), pts = L.recoilPattern(c, n);
    const Wd = 230, Hd = 190, cx = Wd / 2;
    let ext = 1.5;
    for (const p of pts) ext = Math.max(ext, Math.abs(p[0]) * 1.3, p[1] * 1.15);
    const sc = Math.min((Hd - 40) / ext, (Wd / 2 - 20) / ext);
    const X = (h) => cx + h * sc, Y = (v) => Hd - 24 - v * sc;
    let g = '<line x1="' + cx + '" x2="' + cx + '" y1="8" y2="' + (Hd - 14) + '" stroke="#1c2432"/><line x1="12" x2="' + (Wd - 12) + '" y1="' + Y(0) + '" y2="' + Y(0) + '" stroke="#1c2432"/>';
    let d = "";
    pts.forEach((p, i) => { d += (i ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1); });
    g += '<path d="' + d + '" fill="none" stroke="#ffb24a" stroke-width="1" opacity="0.5"/>';
    pts.forEach((p, i) => { g += '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="' + (i === 0 ? 4 : 3) + '" fill="' + (i === 0 ? "#4ddc84" : "#ff5a4a") + '" opacity="' + (0.5 + 0.5 * (1 - i / n)) + '"/>'; });
    g += '<text x="' + (cx + 6) + '" y="' + (Y(0) + 13) + '">1º tiro</text><text x="6" y="' + (Hd - 4) + '">' + n + " tiros seguidos (ângulo em graus)</text>";
    const rec = st.recRec >= 9 ? "Muito rápida" : st.recRec >= 6.5 ? "Rápida" : st.recRec >= 4.2 ? "Média" : "Lenta";
    $("wrecoil").innerHTML = '<div class="recwrap"><div class="wchart"><svg viewBox="0 0 ' + Wd + " " + Hd + '" role="img" aria-label="Padrão de recuo">' + g + "</svg></div><div>" +
      '<div class="wtiles" style="margin-top:0">' +
      '<div class="wtile"><span>Sobe por tiro</span><b>' + st.recV.toFixed(1) + "<small>°</small></b></div>" +
      '<div class="wtile"><span>Desvio lateral</span><b>±' + st.recH.toFixed(1) + "<small>°</small></b></div>" +
      '<div class="wtile"><span>Acumula em rajada</span><b>+' + Math.round(st.climb * 100) + "<small>%</small></b></div>" +
      '<div class="wtile"><span>Recuperação</span><b>' + rec + "</b></div></div>" +
      '<p class="wnote">Parte do coice sobe a mira e fica lá: puxe o mouse para baixo em rajadas longas. Mirar, agachar' + (c.hasGrip ? "" : " e usar empunhadura") + " reduzem o recuo.</p></div></div>";
  }
  function renderArsenal() {
    const slot = ui.slot;
    $("slotTabs").innerHTML = [0, 1].map((i) => '<button type="button" class="tab' + (i === slot ? " on" : "") + '" data-slot="' + i + '"><span>' + (i ? "Secundária (tecla 2)" : "Primária (tecla 1)") + "</span><b>" + esc(W[S.loadout[i]].name) + "</b></button>").join("");
    $("wlist").innerHTML = WEAPON_ORDER.map((id) => {
      const w = W[id], used = S.loadout.indexOf(id);
      return '<button type="button" class="wcard' + (S.loadout[slot] === id ? " on" : "") + '" data-weapon="' + id + '"><b>' + esc(w.name) + "</b><span>" + esc(w.cls) + "</span>" +
        (!ownsWeapon(id) ? "<em>Na loja · ver</em>" : used >= 0 && used !== slot ? "<em>" + (used ? "Secundária" : "Primária") + "</em>" : "") + "</button>";
    }).join("");
    const id = S.loadout[slot], w = W[id], at = attOf(id);
    $("winfo").innerHTML = '<h4>' + esc(w.name) + '</h4><div class="cls">' + esc(w.cls) + "</div><p>" + esc(w.desc) + "</p>";
    const cfg = L.buildSlot({ id, a: Object.assign({}, at) }).cfg, st = L.weaponStats(cfg);
    const cl = (v) => Math.round(clamp(v, 2, 100));
    const bars = [
      ["Dano por tiro", cl(st.shot / 1.5), Math.round(st.shot)],
      ["Cadência", cl((st.rof / 15) * 100), st.rof.toFixed(1) + "/s"],
      ["Alcance útil", cl((st.usefulRange / 80) * 100), Math.round(st.usefulRange) + " m"],
      ["Controle", cl(100 - st.recV * (1 + st.climb * 0.5) * 14), ""],
      ["Precisão", cl(100 - ((st.spread + st.spreadAds) / 2) * 22), ""],
      ["Mobilidade", cl(((w.speed + w.adsSpeed) / 2) * 100 - w.move * 300), ""],
    ];
    $("wbars").innerHTML = bars.map((b) => '<div class="brow"><span>' + b[0] + '</span><div class="tr"><i style="width:' + b[1] + '%"></i></div><b>' + (b[2] || b[1]) + "</b></div>").join("");
    renderWeaponRange(cfg, st);
    renderWeaponRecoil(cfg, st);
    $("watt").innerHTML = w.attach.map((k) => '<button type="button" class="chip' + (at[k] ? " on" : "") + '" data-att="' + k + '"><b>' + esc(ATT[k].label(w)) + "</b><span>" + esc(ATT[k].desc(w)) + "</span></button>").join("");
    buildPreview();
  }
  function renderCustom() {
    $("swCamo").innerHTML = Object.keys(CAMOS).filter(ownsCamo).map((k) => '<button type="button" class="sw' + (S.camo === k ? " on" : "") + '" data-set="camo" data-val="' + k + '"><i style="background:' + hexCss(CAMOS[k].c) + '"></i><span>' + CAMOS[k].n + "</span></button>").join("");
    $("optCross").innerHTML = Object.keys(CROSS_STYLES).map((k) => optBtn("crossStyle", k, CROSS_STYLES[k], "", S.crossStyle === k)).join("");
    $("swCross").innerHTML = Object.keys(CROSS_COLORS).map((c) => '<button type="button" class="sw' + (S.crossColor === c ? " on" : "") + '" data-set="crossColor" data-val="' + c + '"><i style="background:' + c + '"></i><span>' + CROSS_COLORS[c] + "</span></button>").join("");
  }
  function syncRanges() {
    document.querySelectorAll("[data-range]").forEach((el) => {
      const k = el.getAttribute("data-range");
      el.value = S[k]; $(RANGE_OUT[k]).textContent = RANGE_FMT[k](S[k]);
    });
  }
  function syncToggles() {
    document.querySelectorAll("[data-toggle]").forEach((el) => {
      const on = !!S[el.getAttribute("data-toggle")] !== el.hasAttribute("data-invert");
      el.classList.toggle("on", on); el.querySelector("i").textContent = on ? "LIGADO" : "DESLIGADO";
    });
  }
  function renderSettings() {
    const opts = (id, key, T) => { $(id).innerHTML = Object.keys(T).map((k) => optBtn(key, k, T[k].n, T[k].sub, String(S[key]) === k)).join(""); };
    opts("optQuality", "quality", QUALITY); opts("optShadows", "shadows", SHADOWS); opts("optFx", "fx", FXQ);
    opts("optFps", "fpsCap", FPSCAP); opts("optTouch", "touch", TOUCHM);
    syncRanges(); syncToggles();
  }
  function fmtTime(s) { s = Math.floor(s); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function renderScores() {
    const a = loadScores();
    $("scoreBox").innerHTML = a.length
      ? '<table class="sc"><thead><tr><th>#</th><th>Nome</th><th>Pontos</th><th>Onda</th><th>Abates</th><th>Dificuldade</th></tr></thead><tbody>' +
        a.map((r, i) => "<tr><td>" + (i + 1) + "</td><td>" + esc(r.name) + "</td><td>" + r.score + "</td><td>" + r.wave + "</td><td>" + r.kills + "</td><td>" + esc(r.diff) + "</td></tr>").join("") + "</tbody></table>"
      : "<p>Nenhuma partida registrada ainda. Sobreviva às ondas para entrar no placar.</p>";
  }
  function renderSummary() {
    $("sum").innerHTML = esc(W[S.loadout[0]].name) + " + " + esc(W[S.loadout[1]].name) + "<small>" + esc(DIFF[S.diff].name) + " · " + esc(ENVS[S.env].n) + "</small>";
  }
  function showTab(tab) {
    ui.tab = tab;
    document.querySelectorAll("#nav button").forEach((b) => b.classList.toggle("on", b.getAttribute("data-tab") === tab));
    document.querySelectorAll(".panel").forEach((p) => { p.hidden = p.getAttribute("data-panel") !== tab; });
    if (tab === "arsenal") renderArsenal(); else if (tab === "scores") renderScores(); else if (tab === "store") renderStore();
    $("menu").querySelector(".m-main").scrollTop = 0;
  }
  function renderAll() { renderMission(); renderCustom(); renderSettings(); renderScores(); renderSummary(); applyCrosshair(); renderStore(); }

  function chooseWeapon(id) {
    const slot = ui.slot, other = 1 - slot, prev = S.loadout[slot];
    if (id === prev) return;
    if (!ownsWeapon(id)) { showTab("store"); return; }
    if (S.loadout[other] === id) S.loadout[other] = prev;
    S.loadout[slot] = id;
  }
  $("menu").addEventListener("click", (e) => {
    const t = e.target.closest("[data-tab],[data-set],[data-slot],[data-weapon],[data-att],[data-toggle]");
    if (!t) return;
    if (t.hasAttribute("data-tab")) { showTab(t.getAttribute("data-tab")); return; }
    if (t.hasAttribute("data-slot")) { ui.slot = Number(t.getAttribute("data-slot")); renderArsenal(); return; }
    if (t.hasAttribute("data-weapon")) { chooseWeapon(t.getAttribute("data-weapon")); renderArsenal(); }
    else if (t.hasAttribute("data-att")) { const id = S.loadout[ui.slot], k = t.getAttribute("data-att"); attOf(id)[k] = !attOf(id)[k]; renderArsenal(); }
    else if (t.hasAttribute("data-toggle")) { const k = t.getAttribute("data-toggle"); S[k] = !S[k]; syncToggles(); applySetting(k); }
    else if (t.hasAttribute("data-set")) {
      const k = t.getAttribute("data-set"), v = t.getAttribute("data-val");
      S[k] = v;
      applySetting(k);
      if (k === "env" || k === "diff") renderMission();
      else if (k === "camo" || k === "crossStyle" || k === "crossColor") renderCustom();
      else renderSettings();
    }
    saveSettings(); renderSummary();
  });
  $("menu").addEventListener("input", (e) => {
    const el = e.target;
    if (el.id === "pname") { S.name = el.value.slice(0, 14); saveSettings(); return; }
    if (!el.hasAttribute("data-range")) return;
    const k = el.getAttribute("data-range");
    S[k] = Number(el.value); $(RANGE_OUT[k]).textContent = RANGE_FMT[k](S[k]);
    applySetting(k);
    saveSettings();
  });
  $("btnReset").addEventListener("click", () => {
    const keep = S.name;
    Object.assign(S, JSON.parse(JSON.stringify(DEFAULTS))); S.name = keep;
    if (IS_TOUCH) Object.assign(S, { quality: "low", shadows: "off", res: 100, fx: "low", fov: 80 });
    saveSettings(); applyQuality(); applyEnv(); applySound(); applyTouchUI(); vmKey = ""; renderAll(); if (ui.tab === "arsenal") renderArsenal();
  });
