// ======================================================================
//  APLICAÇÃO: 3D, som, menu, HUD e entrada
// ======================================================================
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const L = Logic;
  const { Game, BOXES, OBSTACLES, LAMPS, clamp, insideAny, WEAPONS: W, WEAPON_ORDER, DIFF } = L;
  const { ARENA, EYE_H, RADAR_RANGE, SWITCH_TIME, MELEE_CD } = L.C;
  const rand = (a, b) => a + Math.random() * (b - a);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  if (typeof THREE === "undefined") {
    const e = document.createElement("p");
    e.className = "err"; e.textContent = "Não foi possível carregar a biblioteca 3D (Three.js). Verifique sua conexão e recarregue a página.";
    $("menu").querySelector(".m-main").prepend(e);
    $("btnPlay").disabled = true;
    return;
  }

  // ---------------- configurações (salvas no navegador) ----------------
  const DEFAULTS = {
    name: "Sobrevivente", diff: "normal", env: "night", quality: "med", fov: 90, sens: 12, adsSens: 70,
    invertY: false, bob: true, radar: true, hints: true, gore: true, vol: 80,
    crossColor: "#ffffff", crossStyle: "cross", crossSize: 10, camo: "black",
    loadout: ["ax4", "p45"], att: {},
    // som
    muted: false, volSfx: 100, volVoice: 100, volAmb: 70,
    // gráficos
    shadows: "torch", res: 100, fx: "med", rainFx: true, fpsCap: "0", showFps: false,
    // celular / toque
    touch: "auto", touchSens: 12, btnSize: 100, btnAlpha: 70, autoFire: true, vibrate: true, fullscreen: true,
  };
  const STORE = "arena-zumbi-v2", STORE_SC = "arena-zumbi-scores";
  const S = JSON.parse(JSON.stringify(DEFAULTS));
  const IS_TOUCH = (function () {
    try { return matchMedia("(pointer: coarse)").matches || (navigator.maxTouchPoints > 0 && !matchMedia("(pointer: fine)").matches); } catch (e) { return false; }
  })();
  let hadSaved = false;
  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORE);
      if (!raw) return;
      hadSaved = true;
      const o = JSON.parse(raw);
      for (const k in DEFAULTS) if (o[k] !== undefined && typeof o[k] === typeof DEFAULTS[k]) S[k] = o[k];
      if (!Array.isArray(S.loadout) || S.loadout.length !== 2 || !W[S.loadout[0]] || !W[S.loadout[1]] || S.loadout[0] === S.loadout[1]) S.loadout = DEFAULTS.loadout.slice();
    } catch (e) {}
  }
  function saveSettings() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {} }
  function loadScores() { try { const a = JSON.parse(localStorage.getItem(STORE_SC) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function saveScore(rec) {
    const a = loadScores(); a.push(rec); a.sort((x, y) => y.score - x.score);
    const top = a.slice(0, 10);
    try { localStorage.setItem(STORE_SC, JSON.stringify(top)); } catch (e) {}
    return top.indexOf(rec) === 0 && rec.score > 0;
  }
  loadSettings();
  if (!hadSaved && IS_TOUCH) Object.assign(S, { quality: "low", shadows: "off", res: 75, fx: "low", fov: 80 });   // celular: começa leve
  const touchOn = () => S.touch === "on" || (S.touch === "auto" && IS_TOUCH);

  const CAMOS = {
    black: { n: "Preto tático", c: 0x2a2c32 }, desert: { n: "Deserto", c: 0xa88f5c }, forest: { n: "Floresta", c: 0x46562f },
    urban: { n: "Urbano", c: 0x62666e }, crimson: { n: "Carmesim", c: 0x8a1a14 }, arctic: { n: "Ártico", c: 0xcfd5db },
    // acabamentos premium (vendidos na loja)
    gold: { n: "Ouro 24k", c: 0xd4af37, m: 0.92, r: 0.24, prem: 1, price: 700 },
    chrome: { n: "Cromado", c: 0xd6dade, m: 1, r: 0.14, prem: 1, price: 550 },
    neon: { n: "Neon ciano", c: 0x19d6ff, m: 0.3, r: 0.34, em: 0x0a5f78, prem: 1, price: 600 },
    blood: { n: "Sangue seco", c: 0x5c0b0b, m: 0.25, r: 0.55, em: 0x140000, prem: 1, price: 400 },
    ghost: { n: "Espectral", c: 0x9be8ff, m: 0.4, r: 0.3, em: 0x1f6a7c, prem: 1, price: 900 },
  };
  const ENVS = {
    night: { n: "Noite", sub: "Escuridão e lâmpadas âmbar.", fog: 0x06080d, dens: 0.03, hemi: [0x5a6aa0, 0x1c1612, 0.75], moon: [0x8fa4d8, 0.55], lamp: 1.7 },
    dusk: { n: "Crepúsculo", sub: "Céu alaranjado, visão mais longa.", fog: 0x2a1812, dens: 0.02, hemi: [0xd8935f, 0x20140e, 1.05], moon: [0xffa060, 0.8], lamp: 1.1 },
    fog: { n: "Névoa densa", sub: "Os zumbis surgem do nada.", fog: 0x2c333b, dens: 0.075, hemi: [0x7080a0, 0x181818, 0.95], moon: [0xaab8cc, 0.4], lamp: 1.9 },
    storm: { n: "Tempestade", sub: "Chuva, trovões e relâmpagos.", fog: 0x0a0e14, dens: 0.04, hemi: [0x405070, 0x101010, 0.6], moon: [0x6070a0, 0.35], lamp: 1.6, rain: true },
  };
  const ATT = {
    sil: { label: () => "Silenciador", desc: () => "Sem clarão e som abafado. Dano -10%, menos recuo." },
    ext: { label: () => "Carregador estendido", desc: (w) => w.mag + " → " + w.extMag + " balas. Recarga 15% mais lenta." },
    optic: { label: () => "Mira óptica", desc: () => "Mais zoom e mais precisão ao mirar." },
    grip: { label: (w) => w.gripLabel, desc: (w) => (w.id === "brutus" ? "Projéteis 35% mais agrupados." : w.id === "falcao" ? "Menos tremor e menos recuo." : "Recuo 25% menor.") },
  };
  const CROSS_COLORS = { "#ffffff": "Branco", "#ffb24a": "Âmbar", "#4ddc84": "Verde", "#4ac8ff": "Ciano", "#ff4a3d": "Vermelho", "#ff5ad2": "Rosa" };
  const CROSS_STYLES = { cross: "Cruz", tcross: "Cruz em T", dot: "Ponto", circle: "Círculo" };
  // predefinições: escolher uma ajusta sombras, resolução e partículas (que depois podem ser mudadas uma a uma)
  const QUALITY = {
    low: { n: "Baixa", sub: "Celulares e PCs modestos.", pr: 1, set: { shadows: "off", res: 75, fx: "low" } },
    med: { n: "Média", sub: "Equilíbrio entre beleza e desempenho.", pr: 1.5, set: { shadows: "torch", res: 100, fx: "med" } },
    high: { n: "Alta", sub: "Sombras da lua e da lanterna, tudo no máximo.", pr: 2, set: { shadows: "full", res: 100, fx: "high" } },
  };
  const SHADOWS = { off: { n: "Desligadas", sub: "Mais rápido." }, torch: { n: "Lanterna", sub: "Só a lanterna projeta sombra." }, full: { n: "Completas", sub: "Lua e lanterna. Mais pesado." } };
  const FXQ = { low: { n: "Poucas", sub: "Menos sangue, fumaça e faíscas.", k: 0.45 }, med: { n: "Normal", sub: "", k: 1 }, high: { n: "Muitas", sub: "Mais partículas.", k: 1.5 } };
  const FPSCAP = { "30": { n: "30 FPS", sub: "Economiza bateria." }, "60": { n: "60 FPS", sub: "" }, "0": { n: "Sem limite", sub: "O máximo da tela." } };
  const TOUCHM = { auto: { n: "Automático", sub: "Liga em telas de toque." }, on: { n: "Sempre", sub: "" }, off: { n: "Nunca", sub: "Só teclado e mouse." } };
  const fxK = () => (FXQ[S.fx] || FXQ.med).k;
  const attOf = (id) => (S.att[id] = S.att[id] || {});
  const loadoutSel = () => S.loadout.map((id) => ({ id, a: Object.assign({}, attOf(id)) }));

  // ---------------- renderizador e cena ----------------
  const canvas = $("view");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x06080d, 0.03);
  const camera = new THREE.PerspectiveCamera(70, 1, 0.03, 120);
  camera.rotation.order = "YXZ";
  scene.add(camera);
  let hfov = 90;
  const vfovFor = (h) => (2 * Math.atan(Math.tan((h * Math.PI) / 360) / camera.aspect) * 180) / Math.PI;
  function resize() {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = vfovFor(hfov);
    camera.updateProjectionMatrix();
    resizePreview();
  }
  window.addEventListener("resize", resize);

  const hemi = new THREE.HemisphereLight(0x5a6aa0, 0x1c1612, 0.75);
  const moon = new THREE.DirectionalLight(0x8fa4d8, 0.55);
  moon.position.set(-10, 20, 8);
  scene.add(hemi, moon);
  const gunFill = new THREE.PointLight(0xffffff, 0.35, 2.2, 2);
  gunFill.position.set(0.1, 0.1, 0.3);
  camera.add(gunFill);

  const mat = (color, extra) => new THREE.MeshLambertMaterial(Object.assign({ color }, extra || {}));
  const basic = (color) => new THREE.MeshBasicMaterial({ color });
  const M = {
    wall: mat(0x2a2c32), crate: mat(0x6b4322), crate2: mat(0x4d5436), pillar: mat(0x4a4b50), barrier: mat(0x5f5c56),
    barrel: mat(0x7d1710), pole: mat(0x15161a), lamp: basic(0xffc680), warn: basic(0xff3a2a),
    decal: mat(0x3a0505, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    skin: mat(0x6a8a55), pants: mat(0x1a1e2e), cloth: [mat(0x7a2a22), mat(0x2a4570), mat(0x5a5230), mat(0xa01510)],
    eye: basic(0xff7a1a), eyeBrute: basic(0xff2010), wound: mat(0x5a0a0a), blood: basic(0x8a0000), spark: basic(0xffd070),
    health: new THREE.MeshLambertMaterial({ color: 0x1fe060, emissive: 0x0f8030 }),
    ammo: new THREE.MeshLambertMaterial({ color: 0xffc020, emissive: 0x806010 }),
    shadow: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5, depthWrite: false }),
  };

  const castRecv = (m, cast, recv) => { m.castShadow = !!cast; m.receiveShadow = !!recv; return m; };
  // posição lógica (x, y, altura) -> three (x, altura, -y)
  const put = (o, x, y, h) => o.position.set(x, h, -y);

  const lampLights = [];   // luzes dos postes (criadas em app1b.js)

  // ---------------- lanterna ----------------
  const torch = new THREE.SpotLight(0xfff2dd, 2.2, 40, 0.5, 0.5, 1.2);
  torch.position.set(0.1, -0.05, 0);
  torch.target.position.set(0, 0, -6);
  torch.shadow.mapSize.set(1024, 1024); torch.shadow.camera.near = 0.3; torch.shadow.camera.far = 40; torch.shadow.bias = -0.0006;
  camera.add(torch, torch.target);
  let torchOn = true;

  // ---------------- clima ----------------
  let env = ENVS.night, flash = 0, lightT = 8, thunderIn = -1;
  const RAIN_N = 650, rainPos = new Float32Array(RAIN_N * 6), rainSt = [];
  for (let i = 0; i < RAIN_N; i++) rainSt.push({ x: rand(-16, 16), y: rand(0, 14), z: rand(-16, 16), v: rand(14, 20) });
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xaabbd0, transparent: true, opacity: 0.32 }));
  rain.frustumCulled = false; rain.visible = false; scene.add(rain);

  function applyEnv() {
    env = ENVS[S.env] || ENVS.night;
    scene.fog.color.setHex(env.fog); scene.fog.density = env.dens;
    renderer.setClearColor(env.fog);
    hemi.color.setHex(env.hemi[0]); hemi.groundColor.setHex(env.hemi[1]); hemi.intensity = env.hemi[2];
    moon.color.setHex(env.moon[0]); moon.intensity = env.moon[1];
    lampLights.forEach((l) => { l.intensity = env.lamp; });
    rain.visible = !!env.rain && S.rainFx;
    wdApplyEnv(env);
    Snd.ambient(state === "run" || state === "pause" || state === "dead", env);
  }
  function refreshMaterials() {
    scene.traverse((o) => {
      if (!o.material) return;
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.needsUpdate = true; });
    });
  }
  moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 70 });
  moon.shadow.bias = -0.0008;
  function applyQuality() {
    const q = QUALITY[S.quality] || QUALITY.med;
    renderer.setPixelRatio(Math.max(0.4, Math.min(window.devicePixelRatio || 1, q.pr) * clamp(S.res, 40, 100) / 100));
    const ts = S.shadows !== "off", ms = S.shadows === "full";
    if (torch.castShadow !== ts || moon.castShadow !== ms) {
      torch.castShadow = ts; moon.castShadow = ms;
      moon.shadow.camera.updateProjectionMatrix();
      refreshMaterials();
    }
    resize();
  }
  function updateWeather(dt) {
    if (rain.visible) {
      for (let i = 0; i < RAIN_N; i++) {
        const d = rainSt[i];
        d.y -= d.v * dt;
        if (d.y < 0) { d.y = 14 + rand(0, 3); d.x = rand(-16, 16); d.z = rand(-16, 16); }
        const o = i * 6;
        rainPos[o] = d.x; rainPos[o + 1] = d.y; rainPos[o + 2] = d.z;
        rainPos[o + 3] = d.x + 0.05; rainPos[o + 4] = d.y + 0.55; rainPos[o + 5] = d.z + 0.02;
      }
      rain.position.set(camera.position.x, 0, camera.position.z);
      rainGeo.attributes.position.needsUpdate = true;
    }
    if (env.rain) {
      lightT -= dt;
      if (lightT <= 0) { lightT = rand(7, 16); flash = 1; thunderIn = rand(0.4, 2.2); }
      if (thunderIn > 0) { thunderIn -= dt; if (thunderIn <= 0 && state !== "menu") Snd.play("thunder", 0.9, rand(0.85, 1.1), 0, 0.5); }
    }
    flash = Math.max(0, flash - dt * 3.5);
    const f = flash * (0.6 + 0.4 * Math.random());
    hemi.intensity = env.hemi[2] + 2.8 * f; moon.intensity = env.moon[1] + 1.5 * f;
    wdSkyFrame(f);
  }
