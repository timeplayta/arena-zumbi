// ==LOGIC-START==
const Logic = (function () {
  const ARENA = 22, WALL_H = 3.6, EYE_H = 1.7, CROUCH_DROP = 0.55, PLAYER_R = 0.38, ZOMBIE_R = 0.36;
  const PLAYER_SPEED = 4.6, SPRINT_MULT = 1.65;
  const ATTACK_RANGE = 1.25, ZOMBIE_SEP = 0.75, RANGE = 90;
  const BODY_R = 0.34, BODY_H = 1.5, HEAD_Z = 1.67, HEAD_R = 0.21, LEG_H = 0.8;
  const MELEE_RANGE = 1.9, MELEE_CD = 0.75, MELEE_DMG = 55, SWITCH_TIME = 0.45;

  // ---------------- armas ----------------
  // range: dano total até 'full' metros; cai linearmente até 'min' (fração) em 'end'; some em 'max'.
  // rec: recuo em GRAUS por tiro — v (vertical), h (horizontal aleatório), bias (puxa p/ a direita), climb (sobe mais em rajada longa),
  //      build (quanto cada tiro "esquenta" o recuo), perm (fração que fica na mira e precisa ser puxada p/ baixo),
  //      rec (velocidade de recuperação da câmera), settle (velocidade com que o recuo acumulado esfria).
  const WEAPONS = {
    p45: { id: "p45", name: "P45 Marshal", cls: "Pistola", kind: "pistol", auto: false, modes: ["semi"],
      desc: "Pistola .45 confiável. Rápida de sacar, boa de reserva.",
      mag: 12, extMag: 18, reserve: 84, maxRes: 144, ammoPick: 24, dmg: 40, pellets: 1, delay: 0.2,
      reload: 1.3, reloadEmpty: 1.6, spread: 0.0035, move: 0.01, shot: 0.035, ads: 0.45,
      head: 3, knock: 0.12, range: { full: 10, end: 38, min: 0.45, max: 55 },
      rec: { v: 2.1, h: 0.45, bias: 0, climb: 0.55, build: 0.4, perm: 0.35, rec: 11, settle: 3.2 }, pierce: 0, fov: 70, speed: 1.0, adsSpeed: 0.8,
      attach: ["sil", "ext", "optic"], gripLabel: null, flash: 0.16, },
    smg: { id: "smg", name: "Vespa SMG-9", cls: "Submetralhadora", kind: "smg", auto: true, modes: ["auto", "semi"],
      desc: "Cadência altíssima e mobilidade. Perde força à distância.",
      mag: 32, extMag: 45, reserve: 160, maxRes: 256, ammoPick: 48, dmg: 21, pellets: 1, delay: 0.068,
      reload: 1.7, reloadEmpty: 2.0, spread: 0.006, move: 0.016, shot: 0.03, ads: 0.5,
      head: 2.5, knock: 0.04, range: { full: 8, end: 34, min: 0.38, max: 50 },
      rec: { v: 0.8, h: 0.6, bias: 0.12, climb: 1.2, build: 0.07, perm: 0.4, rec: 8.5, settle: 1.8 }, pierce: 0, fov: 72, speed: 1.05, adsSpeed: 0.8,
      attach: ["sil", "ext", "optic", "grip"], gripLabel: "Empunhadura vertical", flash: 0.15, },
    ax4: { id: "ax4", name: "Fuzil AX-4", cls: "Fuzil de assalto", kind: "rifle", auto: true, modes: ["auto", "semi", "burst"],
      desc: "Equilibrado em tudo. Boa escolha para quem está começando.",
      mag: 30, extMag: 40, reserve: 150, maxRes: 240, ammoPick: 40, dmg: 34, pellets: 1, delay: 0.095,
      reload: 2.0, reloadEmpty: 2.4, spread: 0.004, move: 0.014, shot: 0.03, ads: 0.4,
      head: 3, knock: 0.08, range: { full: 24, end: 62, min: 0.62, max: 95 },
      rec: { v: 1.15, h: 0.5, bias: 0.08, climb: 1.25, build: 0.06, perm: 0.4, rec: 7, settle: 1.6 }, pierce: 0, fov: 62, speed: 0.95, adsSpeed: 0.65,
      attach: ["sil", "ext", "optic", "grip"], gripLabel: "Empunhadura vertical", flash: 0.2, },
    brutus: { id: "brutus", name: "Brutus 12", cls: "Escopeta", kind: "shotgun", auto: false, modes: ["pump"], shell: true, pump: true,
      desc: "Nove projéteis por tiro. Devastadora de perto, recarga cartucho a cartucho.",
      mag: 6, extMag: 8, reserve: 36, maxRes: 60, ammoPick: 8, dmg: 15, pellets: 9, delay: 0.85,
      reload: 0.5, reloadStart: 0.45, reloadEmpty: 0.5, spread: 0.06, move: 0.008, shot: 0, ads: 0.75,
      head: 2, knock: 0.07, range: { full: 4, end: 17, min: 0.15, max: 32 },
      rec: { v: 6.8, h: 1.2, bias: 0, climb: 0, build: 0.5, perm: 0.25, rec: 4.5, settle: 2 }, pierce: 0, fov: 75, speed: 0.9, adsSpeed: 0.7,
      attach: ["ext", "optic", "grip"], gripLabel: "Choke (agrupa os tiros)", flash: 0.32, },
    falcao: { id: "falcao", name: "Falcão .308", cls: "Rifle de precisão", kind: "sniper", auto: false, modes: ["bolt"], bolt: true, scope: true,
      desc: "Um tiro, uma baixa. Perfura até três alvos. Segure Shift para prender a respiração.",
      mag: 5, extMag: 8, reserve: 30, maxRes: 55, ammoPick: 8, dmg: 150, pellets: 1, delay: 1.15,
      reload: 2.6, reloadEmpty: 2.9, spread: 0.025, move: 0.05, shot: 0, ads: 0.03,
      head: 2.5, knock: 0.5, range: { full: 40, end: 95, min: 0.82, max: 140 },
      rec: { v: 5.6, h: 0.5, bias: 0, climb: 0, build: 0.5, perm: 0.3, rec: 3.6, settle: 2 }, pierce: 2, fov: 14, speed: 0.85, adsSpeed: 0.55,
      attach: ["sil", "ext", "grip"], gripLabel: "Apoio ajustável", flash: 0.3, },
    // ---- armas vendidas na loja ----
    revolver: { id: "revolver", name: "Revólver Trovão .50", cls: "Revólver", kind: "pistol", auto: false, modes: ["semi"], shop: true,
      desc: "Seis tiros de pura força. Uma bala na cabeça derruba qualquer zumbi comum; o coice é brutal.",
      mag: 6, extMag: 8, reserve: 36, maxRes: 60, ammoPick: 12, dmg: 110, pellets: 1, delay: 0.5,
      reload: 2.6, reloadEmpty: 2.6, spread: 0.003, move: 0.012, shot: 0.04, ads: 0.35,
      head: 2.6, knock: 0.35, range: { full: 18, end: 55, min: 0.5, max: 80 },
      rec: { v: 4.4, h: 0.9, bias: 0, climb: 0.3, build: 0.6, perm: 0.3, rec: 6, settle: 2.5 }, pierce: 1, fov: 66, speed: 0.98, adsSpeed: 0.75,
      attach: ["ext", "optic"], gripLabel: null, flash: 0.32, },
    titan: { id: "titan", name: "Titã M-60", cls: "Metralhadora leve", kind: "lmg", auto: true, modes: ["auto"], shop: true,
      desc: "Cinto de 100 balas e fogo de supressão. Pesada e lenta para recarregar, mas ninguém passa.",
      mag: 100, extMag: 150, reserve: 300, maxRes: 500, ammoPick: 80, dmg: 30, pellets: 1, delay: 0.082,
      reload: 5.2, reloadEmpty: 5.6, spread: 0.0055, move: 0.02, shot: 0.028, ads: 0.45,
      head: 2.5, knock: 0.07, range: { full: 22, end: 65, min: 0.58, max: 100 },
      rec: { v: 1.35, h: 0.7, bias: 0.1, climb: 1.3, build: 0.05, perm: 0.45, rec: 5.5, settle: 1.4 }, pierce: 0, fov: 64, speed: 0.82, adsSpeed: 0.55,
      attach: ["sil", "ext", "optic", "grip"], gripLabel: "Bipé rebatível", flash: 0.28, },
  };
  const WEAPON_ORDER = ["p45", "smg", "ax4", "brutus", "falcao", "revolver", "titan"];

  const DIFF = {
    easy: { name: "Recruta", sub: "Zumbis mais fracos e lentos, munição de sobra.", hp: 0.75, speed: 0.9, dmg: 0.6, ammo: 1.4, count: 0.8, heal: 35, score: 0.8, coin: 0.5, drop: 1, giants: null },
    normal: { name: "Soldado", sub: "A experiência padrão da arena.", hp: 1, speed: 1, dmg: 1, ammo: 1, count: 1, heal: 25, score: 1, coin: 1, drop: 1, giants: null },
    hard: { name: "Veterano", sub: "Zumbis com 60% mais vida, rápidos, e um gigante a cada 3 ondas a partir da 6.", hp: 1.6, speed: 1.1, dmg: 1.4, ammo: 0.8, count: 1.25, heal: 15, score: 1.4, coin: 1.5, drop: 1,
      giants: { from: 6, every: 3, extra: 12, maxAlive: 1 } },
    nightmare: { name: "Pesadelo", sub: "Zumbis com 140% mais vida, hordas enormes e gigantes a cada 2 ondas a partir da 4.", hp: 2.4, speed: 1.2, dmg: 2, ammo: 0.6, count: 1.6, heal: 8, score: 2, coin: 2.2, drop: 1.1,
      giants: { from: 4, every: 2, extra: 8, maxAlive: 2 } },
    extremo: { name: "Extremo", sub: "Três vezes mais vida, hordas gigantescas, Colosso Blindado e o Mestre da Katana. Quase impossível.", hp: 3, speed: 1.25, dmg: 2.6, ammo: 0.55, count: 1.75, heal: 5, score: 3, coin: 3.5, drop: 1.7, extreme: 1,
      giants: { from: 4, every: 3, extra: 9, maxAlive: 1 },
      elite: { tank: { from: 2, every: 2, grow: 4, cap: 2, max: 1 }, samurai: { from: 1, every: 1, grow: 3, cap: 3, max: 2 } } },
    apocalipse: { name: "Apocalipse", sub: "O fim. Tudo do Extremo, em dobro, e o Espectro da Espada que ninguém consegue ver.", hp: 3.8, speed: 1.35, dmg: 3.4, ammo: 0.5, count: 2, heal: 0, score: 5, coin: 5, drop: 1.9, extreme: 2,
      giants: { from: 3, every: 2, extra: 6, maxAlive: 2 },
      elite: { tank: { from: 2, every: 1, grow: 3, cap: 2, max: 2 }, samurai: { from: 1, every: 1, grow: 2, cap: 4, max: 3 }, wraith: { from: 3, every: 2, grow: 4, cap: 2, max: 1 } } },
  };
  const DIFF_ORDER = ["easy", "normal", "hard", "nightmare", "extremo", "apocalipse"];
  // vida base dos zumbis especiais (cresce por onda; o escudo, a esquiva e a invisibilidade compensam)
  const ELITE = {
    tank: { hp: 2400, grow: 170, speed: 0.95, dmg: 1.7, pts: 1500, coins: 40, s: [1.9, 2.0] },
    samurai: { hp: 1300, grow: 110, speed: 2.5, dmg: 1.5, pts: 800, coins: 25, s: [0.97, 1.0] },
    wraith: { hp: 1500, grow: 140, speed: 9.5, dmg: 1, pts: 2000, coins: 60, s: [1.27, 1.29] },
  };

  // golpes do Mestre da Katana: preparo, golpe, recuperação (s), alcance e avanço (m), cone de acerto e multiplicador de dano
  const SAM = {
    slash: { wind: 0.38, strike: 0.2, rec: 0.45, reach: 2.7, lunge: 2.4, cone: 0.5, dmg: 1 },
    over: { wind: 0.55, strike: 0.16, rec: 0.55, reach: 2.5, lunge: 1.6, cone: 0.7, dmg: 1.35 },
    thrust: { wind: 0.45, strike: 0.14, rec: 0.65, reach: 3.9, lunge: 4.2, cone: 0.85, dmg: 1.15 },
  };

  // [cx, cy, largura_x, largura_y, altura, tipo]
  const OBSTACLES = [
    // carros abandonados
    [-9.0, -6.0, 4.4, 1.9, 1.5, "car"], [9.5, 7.5, 1.9, 4.4, 1.5, "car"],
    [13.0, -12.0, 4.4, 1.9, 1.5, "car"], [-13.5, 11.0, 1.9, 4.4, 1.5, "car"],
    // contêineres
    [-3.0, 13.5, 6.1, 2.5, 2.6, "container"], [6.0, -9.5, 6.1, 2.5, 2.6, "container"],
    [16.5, 1.5, 2.5, 6.1, 2.6, "container"], [-18.0, -8.0, 2.5, 6.1, 2.6, "container"],
    // caixotes
    [-5.2, -8.4, 1.4, 1.4, 1.2, "crate"], [10.3, 3.2, 1.4, 1.4, 1.3, "crate"],
    [-19.0, 11.0, 2.0, 2.0, 1.6, "crate"], [13.5, -7.0, 2.0, 2.0, 1.6, "crate"],
    // caçambas de lixo
    [18.5, 12.5, 1.2, 2.0, 1.4, "dumpster"], [-20.0, 3.0, 1.2, 2.0, 1.4, "dumpster"],
    // colunas de concreto quebradas
    [0.0, 6.0, 1.3, 1.3, 3.2, "pillar"], [-11.0, -14.0, 1.3, 1.3, 3.2, "pillar"],
    [12.0, 14.0, 1.3, 1.3, 3.2, "pillar"], [-15.0, 2.0, 1.3, 1.3, 3.2, "pillar"],
    // sacos de areia
    [-3.0, -0.5, 3.0, 0.9, 1.0, "sandbag"], [7.5, -2.5, 0.9, 3.0, 1.0, "sandbag"],
    [-8.0, 7.0, 3.0, 0.9, 1.0, "sandbag"],
    // barris
    [4.0, 1.5, 0.8, 0.8, 1.0, "barrel"], [-5.0, 3.0, 0.8, 0.8, 1.0, "barrel"],
    [-4.0, -12.5, 0.8, 0.8, 1.0, "barrel"], [17.0, -5.0, 0.8, 0.8, 1.0, "barrel"],
    [-19.0, 15.5, 0.8, 0.8, 1.0, "barrel"],
  ];
  const LAMPS = [
    [-16, -16, 0.3, 0.3, 4.2, "lamp"], [16, -16, 0.3, 0.3, 4.2, "lamp"],
    [-16, 16, 0.3, 0.3, 4.2, "lamp"], [16, 16, 0.3, 0.3, 4.2, "lamp"],
    [0, -17, 0.3, 0.3, 4.2, "lamp"], [0, 18, 0.3, 0.3, 4.2, "lamp"],
  ];
  const BOXES = (function () {
    const a = ARENA, t = 1.0;
    const b = [
      [-a - t, a + t, a, a + t, WALL_H], [-a - t, a + t, -a - t, -a, WALL_H],
      [a, a + t, -a, a, WALL_H], [-a - t, -a, -a, a, WALL_H],
    ];
    for (const o of OBSTACLES.concat(LAMPS)) b.push([o[0] - o[2] / 2, o[0] + o[2] / 2, o[1] - o[3] / 2, o[1] + o[3] / 2, o[4]]);
    return b;
  })();

  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  function wrapAngle(a) {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
  }

  function pushOut(x, y, r) {
    for (let pass = 0; pass < 2; pass++) {
      for (const bx of BOXES) {
        const x0 = bx[0], x1 = bx[1], y0 = bx[2], y1 = bx[3];
        const nx = x < x0 ? x0 : x > x1 ? x1 : x;
        const ny = y < y0 ? y0 : y > y1 ? y1 : y;
        const dx = x - nx, dy = y - ny, d2 = dx * dx + dy * dy;
        if (d2 < r * r) {
          if (d2 > 1e-10) { const d = Math.sqrt(d2), k = (r - d) / d; x += dx * k; y += dy * k; }
          else {
            const l = x - x0, rr = x1 - x, b = y - y0, tp = y1 - y, m = Math.min(l, rr, b, tp);
            if (m === l) x = x0 - r; else if (m === rr) x = x1 + r; else if (m === b) y = y0 - r; else y = y1 + r;
          }
        }
      }
    }
    const lim = ARENA - r;
    return [clamp(x, -lim, lim), clamp(y, -lim, lim)];
  }

  function insideAny(x, y, margin) {
    for (const b of BOXES) if (x > b[0] - margin && x < b[1] + margin && y > b[2] - margin && y < b[3] + margin) return true;
    return false;
  }

  function faceNormal(x, y, z) {
    if (z < 0.02) return [0, 0, 1];
    let best = null, bd = 0.06;
    for (const b of BOXES) {
      if (x < b[0] - 0.06 || x > b[1] + 0.06 || y < b[2] - 0.06 || y > b[3] + 0.06 || z > b[4] + 0.06) continue;
      const c = [[Math.abs(x - b[0]), -1, 0, 0], [Math.abs(x - b[1]), 1, 0, 0], [Math.abs(y - b[2]), 0, -1, 0],
        [Math.abs(y - b[3]), 0, 1, 0], [Math.abs(z - b[4]), 0, 0, 1]];
      for (const k of c) if (k[0] < bd) { bd = k[0]; best = [k[1], k[2], k[3]]; }
    }
    return best || [0, 0, 1];
  }

  function rayAabb(ox, oy, oz, dx, dy, dz, x0, x1, y0, y1, z0, z1) {
    let tmin = 0, tmax = 1e9;
    const sl = [[ox, dx, x0, x1], [oy, dy, y0, y1], [oz, dz, z0, z1]];
    for (const s of sl) {
      const o = s[0], d = s[1], lo = s[2], hi = s[3];
      if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) return null; }
      else {
        let t1 = (lo - o) / d, t2 = (hi - o) / d;
        if (t1 > t2) { const tt = t1; t1 = t2; t2 = tt; }
        tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
        if (tmin > tmax) return null;
      }
    }
    return tmin > 0 ? tmin : null;
  }
  function raySphere(ox, oy, oz, dx, dy, dz, cx, cy, cz, r) {
    const lx = ox - cx, ly = oy - cy, lz = oz - cz;
    const b = lx * dx + ly * dy + lz * dz, c = lx * lx + ly * ly + lz * lz - r * r, disc = b * b - c;
    if (disc < 0) return null;
    const s = Math.sqrt(disc); let t = -b - s;
    if (t < 0) t = -b + s;
    return t > 0 ? t : null;
  }
  function rayCyl(ox, oy, oz, dx, dy, dz, cx, cy, r, z0, z1) {
    const a = dx * dx + dy * dy;
    if (a < 1e-9) return null;
    const lx = ox - cx, ly = oy - cy, b = lx * dx + ly * dy, c = lx * lx + ly * ly - r * r, disc = b * b - a * c;
    if (disc < 0) return null;
    const s = Math.sqrt(disc);
    for (const t of [(-b - s) / a, (-b + s) / a]) if (t > 0) { const z = oz + dz * t; if (z >= z0 && z <= z1) return t; }
    return null;
  }

  const DEG = Math.PI / 180;
  // fração do dano que sobra a 'd' metros
  function rangeFactor(c, d) {
    const r = c.range;
    if (d <= r.full) return 1;
    if (d >= r.end) return r.min;
    return 1 - ((d - r.full) / (r.end - r.full)) * (1 - r.min);
  }
  // dano de UM projétil a 'd' metros (zone: head | torso | legs)
  function damageAt(c, d, zone) {
    if (d > c.range.max) return 0;
    const zm = zone === "head" ? c.head : zone === "legs" ? 0.65 : 1;
    return c.dmg * (c.dmgMul || 1) * rangeFactor(c, d) * zm;
  }
  // números reais da arma para o menu
  function weaponStats(c) {
    const R = c.rec, k = (c.recoilMul || 1);
    return {
      dmg: c.dmg * (c.dmgMul || 1), pellets: c.pellets, shot: c.dmg * (c.dmgMul || 1) * c.pellets, rof: 1 / c.delay,
      effRange: c.range.full, endRange: c.range.end, maxRange: c.range.max, minFactor: c.range.min,
      recV: R.v * k, recH: R.h * k, recRec: R.rec, climb: R.climb, perm: R.perm,
      spread: (c.spread * (c.spreadMul || 1)) / DEG, spreadAds: (c.spread * (c.spreadMul || 1) * (c.adsMul || 1)) / DEG,
      head: c.head, mag: c.magMax,
      usefulRange: c.range.min >= 0.7 ? c.range.max : c.range.full + ((1 - 0.7) / (1 - c.range.min)) * (c.range.end - c.range.full),
    };
  }
  // onde cada tiro de uma rajada contínua cai em relação ao ponto mirado (graus: [horizontal, vertical])
  function recoilPattern(c, n) {
    let a = 12345;
    const rnd = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const R = c.rec, k0 = c.recoilMul || 1;
    let perm = 0, permH = 0, tr = 0, trH = 0, sus = 0;
    const pts = [];
    for (let i = 0; i < n; i++) {
      pts.push([(permH + trH) / DEG, (perm + tr) / DEG]);
      const rk = k0 * (1 + R.climb * sus), rv = R.v * DEG * rk;
      tr += rv * (1 - R.perm); perm += rv * R.perm;
      const ry = ((rnd() * 2 - 1) * R.h + R.bias * (0.4 + sus)) * DEG * rk;
      trH += ry * (1 - R.perm); permH += ry * R.perm;
      sus = Math.min(1, sus + R.build);
      const k = Math.exp(-R.rec * c.delay);
      tr *= k; trH *= k; sus = Math.max(0, sus - R.settle * c.delay * 0.5);
    }
    return pts;
  }

  // transforma a escolha do menu em uma arma pronta (com acessórios aplicados)
  function buildSlot(sel) {
    const w = WEAPONS[sel && sel.id] || WEAPONS.ax4, at = (sel && sel.a) || {};
    const has = (k) => !!at[k] && w.attach.indexOf(k) >= 0;
    const c = Object.assign({}, w);
    c.hasSil = has("sil"); c.hasExt = has("ext"); c.hasOptic = has("optic"); c.hasGrip = has("grip");
    c.magMax = c.hasExt ? w.extMag : w.mag;
    c.dmgMul = c.hasSil ? 0.9 : 1;
    c.rangeMul = c.hasSil ? 0.9 : 1;
    c.range = { full: w.range.full * c.rangeMul, end: w.range.end * c.rangeMul, min: w.range.min, max: w.range.max * c.rangeMul };
    c.recoilMul = (c.hasSil ? 0.92 : 1) * (c.hasGrip && w.id !== "brutus" ? 0.75 : 1);
    c.reloadMul = c.hasExt ? 1.15 : 1;
    c.spreadMul = c.hasGrip && w.id === "brutus" ? 0.65 : 1;
    c.adsMul = w.ads * (c.hasOptic ? 0.75 : 1);
    c.adsFov = c.hasOptic && !w.scope ? w.fov * 0.75 : w.fov;
    return { id: w.id, cfg: c, mag: c.magMax, reserve: 0, modeIdx: 0 };
  }

  let nextZombieId = 1;
  class Zombie {
    constructor(x, y, hp, speed, kind, variant, g, dmgMul) {
      this.id = nextZombieId++;
      this.x = x; this.y = y; this.yaw = 0;
      const E = ELITE[kind];
      this.kind = kind; this.runner = kind === "runner"; this.giant = kind === "giant";
      this.tank = kind === "tank"; this.samurai = kind === "samurai"; this.wraith = kind === "wraith"; this.elite = !!E;
      this.brute = kind === "brute" || this.giant || this.tank;
      this.s = this.giant ? g.uniform(2.05, 2.25) : E ? g.uniform(E.s[0], E.s[1]) : kind === "brute" ? 1.35 : g.uniform(0.95, 1.08);
      this.stepN = 0;
      this.hp = hp; this.maxHp = hp; this.speed = speed; this.dmgMul = dmgMul;
      this.variant = kind === "runner" ? 3 : variant;
      this.tint = g.uniform(0.85, 1.15);
      this.limp = kind === "walker" && g.rnd() < 0.3;
      this.armPose = g.rnd();
      this.state = "walk"; this.phase = g.uniform(0, 6.28);
      this.attackCd = 0.35; this.attackT = 0; this.stagger = 0; this.slowT = 0; this.hitT = 0;
      this.deadT = 0; this.fall = 0; this.headGone = false;
      this.kx = 0; this.ky = 0;
      this.groanT = g.uniform(1.5, 6);
      this.side = 1; this.sideT = 0; this.blocked = 0;
      // ---- especiais (Colosso, Mestre da Katana, Espectro) ----
      this.act = "walk"; this.actT = 0; this.seqT = 0; this.ev = 0; this.cd = g.uniform(2, 4.5);
      this.shield = 1;                    // Colosso: 1 = escudo erguido, 0 = baixado (vulnerável)
      this.untouch = false;               // não pode ser atingido (espectro invisível, esquiva da katana)
      this.vis = 1;                       // 0 invisível .. 1 visível (espectro)
      this.combo = 0; this.atk = "slash"; this.hitDone = false; this.dodgeCd = 1.5; this.dodgeDir = 1; this.lx = 0; this.ly = 0; this.landed = false;
      this.orb = g.uniform(0, 6.28); this.orbDir = g.rnd() < 0.5 ? -1 : 1; this.stalkT = g.uniform(2, 3.2);
      this.ix = 0; this.iy = 0;           // ponto de impacto da espada do espectro
      this.drawn = false;
    }
  }
  // Itens que caem dos zumbis: saltam do corpo, quicam no chão e são puxados (ímã) quando você chega perto.
  const PICK_R = 1.35, MAGNET_R = 4.5, PICK_TTL = 30;
  class Pickup {
    constructor(kind, x, y, rnd) {
      const r = rnd || Math.random, a = r() * 6.2832, v = 1.4 + r() * 1.2;
      this.kind = kind; this.x = x; this.y = y; this.h = 0.9; this.vx = Math.cos(a) * v; this.vy = Math.sin(a) * v; this.vz = 3.2;
      this.landed = false; this.ttl = PICK_TTL; this.age = 0; this.pull = 0; this.fullT = 0;
    }
  }

  class Game {
    constructor(opts) {
      opts = opts || {};
      this.rnd = opts.rnd || Math.random;
      this.diffKey = DIFF[opts.diff] ? opts.diff : "normal";
      this.diff = DIFF[this.diffKey];
      const lo = opts.loadout || [{ id: "ax4", a: {} }, { id: "p45", a: {} }];
      // bônus da loja (melhorias permanentes + itens de uma partida)
      const pk = (this.perks = Object.assign({ hp: 0, armor: 0, ammo: 0, dmg: 0, reload: 0, magnet: 0, stam: 0, vest: 0, ammoPack: 0, revive: 0 }, opts.perks || {}));
      this.maxHp = 100 + pk.hp * 10;
      this.armorMax = 25 * pk.armor + 50 * pk.vest; this.armor = this.armorMax;
      this.revives = pk.revive; this.invulnT = 0; this.kvx = 0; this.kvy = 0;
      this.dmgBoost = 1 + 0.05 * pk.dmg; this.reloadK = 1 - 0.07 * pk.reload; this.magnetK = 1 + 0.25 * pk.magnet; this.stamK = 1 - 0.1 * pk.stam;
      this.mel = Object.assign({ dmg: MELEE_DMG, range: MELEE_RANGE, cd: MELEE_CD, knock: 6 }, opts.melee || {});
      this.slots = [buildSlot(lo[0]), buildSlot(lo[1] || lo[0])];
      for (const s of this.slots) s.reserve = Math.min(s.cfg.maxRes * (1 + pk.ammoPack), Math.round(s.cfg.reserve * this.diff.ammo * (1 + 0.1 * pk.ammo) * (1 + pk.ammoPack)));
      this.cur = 0; this.pending = null; this.switchT = 0;
      this.px = 0; this.py = -4; this.yaw = 0; this.pitch = 0;
      this.recoil = 0; this.recoilYaw = 0; this.sustain = 0; this.kickV = 0; this.heat = 0; this.kick = 0; this.flashT = 0;
      this.hurtT = 0; this.hitmarkT = 0; this.hitmarkHead = false;
      this.bob = 0; this.bobStep = 0; this.moving = false; this.ads = false; this.crouchT = 0; this.sprinting = false;
      this.stamina = 100; this.exhausted = false; this.breath = 4; this.breathLock = false; this.breathHeld = false;
      this.hp = this.maxHp; this.cool = 0; this.reloadT = 0; this.reloadTotal = 1; this.reloading = false;
      this.meleeT = 0; this.triggerWas = false; this.burstLeft = 0; this.sched = []; this.hbT = 0;
      this.alive = true; this.time = 0;
      this.score = 0; this.kills = 0; this.headshots = 0; this.shots = 0; this.hits = 0;
      this.zombies = []; this.pickups = []; this.cracks = []; this.crackSlow = 1; this.queue = []; this.queueTotal = 0; this.bonus = 0; this.burnT = 0; this.nextCrack = 1;
      this.wave = 0; this.toSpawn = 0; this.giantsLeft = 0; this.giantTotal = 0; this.shake = 0; this.spawnT = 0; this.between = true; this.pauseT = 3.5;
      this.banner = "PREPARE-SE"; this.bannerSub = ""; this.bannerT = 3;
      this.events = [];
    }
    uniform(a, b) { return a + (b - a) * this.rnd(); }
    randint(n) { return Math.floor(this.rnd() * n); }
    popEvents() { const e = this.events; this.events = []; return e; }
    // moedas ganhas nesta partida (a loja é paga com elas)
    coins() { return Math.round((this.kills * 3 + Math.max(0, this.wave - 1) * 25 + this.headshots * 2) * (this.diff.coin || 1)) + this.bonus; }
    w() { return this.slots[this.cur]; }
    eyeH() { return EYE_H - CROUCH_DROP * this.crouchT; }
    look(dyaw, dpitch) { this.yaw = wrapAngle(this.yaw + dyaw); this.pitch = clamp(this.pitch + dpitch, -1.5, 1.5); }
    aliveZombies() { return this.zombies.filter((z) => z.state !== "dead"); }

    spread() {
      const c = this.w().cfg;
      let s = c.spread + this.heat * c.shot + (this.moving ? c.move : 0);
      s *= c.spreadMul;
      if (this.ads) s *= c.adsMul;
      return s * (1 - 0.3 * this.crouchT);
    }
    aimSway() {
      const c = this.w().cfg;
      if (!c.scope || !this.ads) return [0, 0];
      let a = 0.0032 * (c.hasGrip ? 0.6 : 1);
      if (this.breathHeld) a *= 0.08;
      if (this.moving) a *= 2.5;
      const t = this.time;
      return [Math.sin(t * 1.7) * a + Math.sin(t * 3.1) * a * 0.4, Math.cos(t * 1.3) * a + Math.sin(t * 2.3) * a * 0.4];
    }

    // ---------- armas ----------
    startReload() {
      const s = this.w(), c = s.cfg;
      if (this.reloading || this.switchT > 0 || !this.alive || this.meleeT > 0.4) return;
      if (c.shell) {
        if (s.mag >= c.magMax || s.reserve <= 0) return;
        this.reloading = true; this.reloadTotal = this.reloadT = c.reloadStart * this.reloadK;
        this.events.push(["reload_start", c.id, false]); return;
      }
      const cap = c.magMax + (s.mag > 0 && !c.bolt ? 1 : 0);
      if (s.mag >= cap || s.reserve <= 0) return;
      this.reloading = true;
      this.reloadTotal = this.reloadT = (s.mag > 0 ? c.reload : c.reloadEmpty) * c.reloadMul * this.reloadK;
      this.events.push(["reload_start", c.id, s.mag === 0]);
    }
    cancelReload() { this.reloading = false; this.reloadT = 0; }
    mode() { const s = this.w(); return s.cfg.modes[s.modeIdx % s.cfg.modes.length]; }
    toggleFireMode() {
      const s = this.w(), n = s.cfg.modes.length;
      if (n < 2 || this.reloading || this.switchT > 0 || !this.alive) return;
      s.modeIdx = (s.modeIdx + 1) % n; this.burstLeft = 0; this.events.push(["mode"]);
    }

    switchWeapon(i) {
      if (i === this.cur || i < 0 || i > 1 || this.switchT > 0 || !this.alive) return;
      this.cancelReload(); this.burstLeft = 0; this.pending = i; this.switchT = SWITCH_TIME;
      this.events.push(["switch"]);
    }

    requestMelee() {
      if (this.meleeT > 0 || !this.alive || this.switchT > 0) return;
      this.cancelReload();
      this.meleeT = this.mel.cd; this.cool = Math.max(this.cool, 0.5);
      this.sched.push({ t: 0.16, fn: "melee" });
      this.events.push(["melee_swing"]);
    }
    doMelee() {
      let n = 0;
      const fx = -Math.sin(this.yaw), fy = Math.cos(this.yaw), M = this.mel;
      const list = this.aliveZombies().filter((z) => !z.untouch).map((z) => ({ z, d: Math.hypot(z.x - this.px, z.y - this.py) })).sort((a, b) => a.d - b.d);
      for (const e of list) {
        const z = e.z;
        if (e.d - ZOMBIE_R * z.s > M.range) continue;
        const dx = z.x - this.px, dy = z.y - this.py, d = e.d || 1e-6;
        if ((dx * fx + dy * fy) / d < 0.78) continue;
        const f = this.shotFilter(z, "torso", z.x, z.y, 1.1);
        if (f.dodged) { n++; continue; }
        if (f.blocked) { this.events.push(["block", z.x - dx / d * 0.6, z.y - dy / d * 0.6, 1.2, z.id]); n++; continue; }
        const kn = z.tank || z.giant ? 0.05 : z.wraith ? 0 : z.brute ? 0.2 : 1;
        z.kx += (dx / d) * M.knock * kn; z.ky += (dy / d) * M.knock * kn;
        this.damageZombie(z, M.dmg * f.mul, "torso", [z.x, z.y, 1.1], { knock: 0, melee: true });
        z.stagger = Math.max(z.stagger, z.brute ? 0.3 : z.samurai ? 0.2 : 0.8);
        if (++n >= 2) break;
      }
      this.events.push([n ? "melee_hit" : "melee_miss"]);
    }

    cast(ox, oy, oz, dx, dy, dz, exclude, maxT) {
      let best = maxT || RANGE, kind = null, zhit = null, zone = null;
      if (dz < -1e-6) { const t = -oz / dz; if (t > 0 && t < best) { best = t; kind = "world"; } }
      for (const b of BOXES) {
        const t = rayAabb(ox, oy, oz, dx, dy, dz, b[0], b[1], b[2], b[3], 0, b[4]);
        if (t !== null && t < best) { best = t; kind = "world"; }
      }
      for (const z of this.zombies) {
        if (z.state === "dead" || z.untouch || (exclude && exclude.has(z))) continue;
        const s = z.s;
        const th = raySphere(ox, oy, oz, dx, dy, dz, z.x, z.y, HEAD_Z * s, HEAD_R * s);
        const tb = rayCyl(ox, oy, oz, dx, dy, dz, z.x, z.y, BODY_R * s, 0, BODY_H * s);
        if (th !== null && th < best) { best = th; kind = "zombie"; zhit = z; zone = "head"; }
        if (tb !== null && tb < best) { best = tb; kind = "zombie"; zhit = z; zone = oz + dz * tb < LEG_H * s ? "legs" : "torso"; }
      }
      return { t: best, kind, z: zhit, zone };
    }

    // O que acontece quando um projétil acerta um zumbi especial?
    shotFilter(z, zone, hx, hy, hz) {
      const r = { mul: 1, blocked: false, dodged: false };
      if (z.tank) {
        const fx = -Math.sin(z.yaw), fy = Math.cos(z.yaw), sx = this.px - z.x, sy = this.py - z.y, sd = Math.hypot(sx, sy) || 1, front = (sx * fx + sy * fy) / sd;
        if (front > 0.26) {                                            // o atirador está na frente do escudo
          if (z.shield > 0.5) { if (zone === "head") r.mul = 0.3; else r.blocked = true; }   // capacete aguenta 30%; o resto o escudo para
          else r.mul = zone === "head" ? 1 : 0.8;                       // escudo baixo: só a armadura
        } else r.mul = zone === "head" ? 1.15 : 0.6;                    // lados e costas: armadura (cabeça sem capacete atrás)
      } else if (z.samurai && z.dodgeCd <= 0 && z.act !== "dodge" && z.state !== "dead" && this.rnd() < 0.5 && z.act !== "strike") {
        this.startDodge(z); r.dodged = true;
      }
      return r;
    }
    startDodge(z) {
      z.act = "dodge"; z.actT = 0; z.untouch = true; z.dodgeCd = 2.6 + this.rnd() * 1.2; z.dodgeDir = this.rnd() < 0.5 ? -1 : 1; z.hitDone = false;
      const dx = this.px - z.x, dy = this.py - z.y, d = Math.hypot(dx, dy) || 1;
      z.lx = (-dy / d) * z.dodgeDir; z.ly = (dx / d) * z.dodgeDir;       // desliza para o lado em relação ao jogador
      this.events.push(["sam_dodge", z.x, z.y, z.id]);
    }

    fireWeapon() {
      const s = this.w(), c = s.cfg;
      s.mag -= 1; this.cool = c.delay; this.shots += 1;
      this.flashT = c.hasSil ? 0 : 0.05; this.kick = 1;
      const sp = this.spread();
      const baseRec = this.recoil, sway = this.aimSway(), eyeH = this.eyeH();
      this.heat = Math.min(1, this.heat + (c.shot > 0 ? 0.12 : 0));
      const R = c.rec, rk = c.recoilMul * (this.ads ? 0.7 : 1) * (1 - 0.25 * this.crouchT) * (1 + R.climb * this.sustain);
      const rv = R.v * DEG * rk;                                  // sobe mais quanto mais tempo você segura o gatilho
      this.recoil += rv * (1 - R.perm); this.pitch = clamp(this.pitch + rv * R.perm, -1.5, 1.5);
      const ry = (this.uniform(-1, 1) * R.h + R.bias * (0.4 + this.sustain)) * DEG * rk;
      this.recoilYaw += ry * (1 - R.perm); this.yaw = wrapAngle(this.yaw + ry * R.perm);
      this.sustain = Math.min(1, this.sustain + R.build);
      this.kickV = rv;
      let first = null, anyHit = false;
      const ox = this.px, oy = this.py, oz = eyeH;
      for (let p = 0; p < c.pellets; p++) {
        const a = this.rnd() * 6.2832, r = sp * Math.sqrt(this.rnd());
        const yaw = this.yaw + this.recoilYaw * 0 + sway[0] + r * Math.cos(a);
        const pitch = this.pitch + baseRec + sway[1] + r * Math.sin(a);
        const cp = Math.cos(pitch);
        const dx = -Math.sin(yaw) * cp, dy = Math.cos(yaw) * cp, dz = Math.sin(pitch);
        const exclude = new Set();
        let left = c.pierce, mul = 1;
        for (;;) {
          const h = this.cast(ox, oy, oz, dx, dy, dz, exclude, c.range.max);
          if (h.kind === null) { const fr = Math.min(60, c.range.max); if (!first) first = [ox + dx * fr, oy + dy * fr, oz + dz * fr]; break; }
          const hx = ox + dx * h.t, hy = oy + dy * h.t, hz = oz + dz * h.t;
          if (!first) first = [hx, hy, hz];
          if (h.kind === "world") { const n = faceNormal(hx, hy, hz); this.events.push(["wall", hx, hy, hz, n[0], n[1], n[2]]); break; }
          const fz = this.shotFilter(h.z, h.zone, hx, hy, hz);          // escudo do Colosso, armadura e esquiva do Mestre da Katana
          if (fz.dodged) { exclude.add(h.z); continue; }                  // errou: o projétil passa direto
          if (fz.blocked) { this.events.push(["block", hx, hy, hz, h.z.id]); break; }
          this.damageZombie(h.z, damageAt(c, h.t, h.zone) * mul * fz.mul, h.zone, [hx, hy, hz], c);
          anyHit = true;
          if (left > 0) { exclude.add(h.z); left--; mul *= 0.7; continue; }
          break;
        }
      }
      if (anyHit) this.hits += 1;
      this.events.push(["shot", c.id, first[0], first[1], first[2], c.hasSil]);
      this.events.push(["eject", c.id]);
      if (c.pump) this.sched.push({ t: c.delay * 0.35, ev: ["pump"] });
      if (c.bolt) this.sched.push({ t: c.delay * 0.45, ev: ["bolt"] });
    }

    damageZombie(z, dmg, zone, p, c) {
      if (z.state === "dead") return;
      const head = zone === "head";
      if (!c.melee) dmg *= this.dmgBoost;
      z.hp -= dmg; z.hitT = 0.12;
      z.stagger = Math.max(z.stagger, (0.18 + (c.knock || 0) * 0.8) * (z.giant || z.tank ? 0.1 : z.samurai ? 0.5 : z.wraith ? 0 : 1));
      if (zone === "legs" && !z.wraith) z.slowT = 3;
      if (c.knock) {
        const dx = z.x - this.px, dy = z.y - this.py, d = Math.hypot(dx, dy) || 1, kn = z.giant || z.tank ? 0.02 : z.wraith ? 0 : z.samurai ? 0.4 : z.brute ? 0.2 : 1;
        z.kx += (dx / d) * c.knock * 14 * kn; z.ky += (dy / d) * c.knock * 14 * kn;
      }
      this.hitmarkT = 0.14; this.hitmarkHead = head;
      this.events.push(["hit", p[0], p[1], p[2], head, z.id]);
      if (z.hp <= 0) {
        z.state = "dead"; z.deadT = 0; z.headGone = head && z.hp < -20 && !z.wraith && !z.tank; z.untouch = false;
        const E = ELITE[z.kind], D = this.diff;
        const pts = Math.round((100 + (head ? 50 : 0) + (z.giant ? 900 : z.brute ? 150 : 0) + (E ? E.pts : 0)) * D.score);
        this.kills += 1; this.score += pts;
        if (E) this.bonus += Math.round(E.coins * D.coin);
        if (head) this.headshots += 1;
        this.events.push(["kill", z.x, z.y, head, pts, z.brute, z.headGone, z.giant, z.kind]);
        if (z.giant || E) {                                         // gigantes e especiais soltam um tesouro
          const nh = z.giant ? 2 : z.samurai ? 1 : 2, na = z.giant ? 3 : z.samurai ? 2 : 3;
          for (let i = 0; i < nh; i++) this.pickups.push(new Pickup("health", z.x, z.y, this.rnd));
          for (let i = 0; i < na; i++) this.pickups.push(new Pickup("ammo", z.x, z.y, this.rnd));
        } else {
          const r = this.rnd(), dk = D.drop || 1;
          if (r < (z.brute ? 0.5 : 0.12) * dk) this.pickups.push(new Pickup("health", z.x, z.y, this.rnd));
          else if (r < (z.brute ? 1 : 0.34 * dk)) this.pickups.push(new Pickup("ammo", z.x, z.y, this.rnd));
        }
      }
    }

    // ---------- ondas ----------
    eliteCount(cfg, w) {
      if (!cfg || w < cfg.from || (w - cfg.from) % cfg.every !== 0) return 0;
      return Math.min(cfg.cap, 1 + Math.floor((w - cfg.from) / cfg.grow));
    }
    startWave() {
      this.wave += 1; this.between = false;
      this.toSpawn = Math.round((5 + 3 * (this.wave - 1) + 2 * Math.floor(this.wave / 4)) * this.diff.count);
      this.spawnT = 0.6;
      const G = this.diff.giants;
      this.giantsLeft = G && this.wave >= G.from && (this.wave - G.from) % G.every === 0 ? 1 + Math.floor((this.wave - G.from) / G.extra) : 0;
      this.giantsLeft = Math.min(this.giantsLeft, 3);
      // zumbis especiais dos níveis extremos: entram na fila e aparecem espalhados durante a onda
      this.queue = [];
      const EL = this.diff.elite;
      if (EL) {
        for (const k of ["samurai", "tank", "wraith"]) for (let i = 0, n = this.eliteCount(EL[k], this.wave); i < n; i++) this.queue.push(k);
        for (let i = this.queue.length - 1; i > 0; i--) { const j = this.randint(i + 1); [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]]; }
      }
      this.toSpawn += this.giantsLeft + this.queue.length; this.giantTotal = this.toSpawn; this.queueTotal = this.toSpawn;
      this.banner = "ONDA " + this.wave; this.bannerSub = ""; this.bannerT = 3;
      this.events.push(["wave", this.wave]);
    }
    spawnZombie() {
      const w = this.wave, D = this.diff;
      let x = 0, y = 0;
      for (let i = 0; i < 40; i++) {
        const side = this.randint(4), u = this.uniform(-ARENA + 2, ARENA - 2), e = ARENA - this.uniform(1.4, 3);
        [x, y] = [[u, e], [u, -e], [e, u], [-e, u]][side];
        if (Math.hypot(x - this.px, y - this.py) < 14 || insideAny(x, y, 0.9)) continue;
        break;
      }
      const brutes = this.zombies.filter((z) => z.brute && !z.giant && !z.tank && z.state !== "dead").length;
      const giantsUp = this.zombies.filter((z) => z.giant && z.state !== "dead").length;
      const reserve = this.queue.length + this.giantsLeft, forced = reserve > 0 && this.toSpawn <= reserve;   // vagas guardadas para os especiais
      let kind = "walker";
      if (this.queue.length) {
        const nk = this.queue[0], cfg = D.elite[nk], up = this.zombies.filter((z) => z.kind === nk && z.state !== "dead").length;
        const due = forced || (this.toSpawn <= Math.ceil(this.queueTotal * 0.82) && this.rnd() < 0.35);
        if (due && up < cfg.max) { this.queue.shift(); return this.spawnElite(nk, x, y); }
      }
      if (this.giantsLeft > 0 && giantsUp < (D.giants ? D.giants.maxAlive : 0) && (forced || this.toSpawn <= Math.ceil(this.giantTotal * 0.7))) { kind = "giant"; this.giantsLeft -= 1; }
      else if (forced) return false;                                  // só faltam especiais e todos estão no limite: espera abrir vaga
      else if (w >= 5 && brutes < 2 && this.rnd() < Math.min(0.04 + 0.02 * w, 0.16)) kind = "brute";
      else if (w >= 3 && this.rnd() < Math.min(0.12 + 0.03 * w, 0.4)) kind = "runner";
      let hp = (100 + 12 * (w - 1)) * D.hp, speed, dm = 1;
      if (kind === "runner") { hp *= 0.6; speed = this.uniform(3.3, 4.0); dm = 0.8; }
      else if (kind === "brute") { hp *= 3.5; speed = this.uniform(1.0, 1.4); dm = 2.2; }
      else if (kind === "giant") { hp *= 11; speed = this.uniform(1.15, 1.45); dm = 3; }
      else speed = this.uniform(1.2, 2.0) + Math.min(0.07 * w, 0.7);
      this.zombies.push(new Zombie(x, y, hp, speed * D.speed, kind, this.randint(3), this, dm));
      if (kind === "giant") { this.events.push(["giant"]); this.banner = "UM GIGANTE!"; this.bannerSub = "Mire na cabeça · aguente firme"; this.bannerT = 3; }
      return true;
    }
    spawnElite(kind, x, y) {
      const E = ELITE[kind], D = this.diff, w = this.wave, hpMul = Math.pow(D.hp, 0.6);   // chefes crescem com a dificuldade, mas bem mais devagar que os zumbis comuns
      const hp = (E.hp + E.grow * (w - 1)) * hpMul, speed = E.speed * (kind === "wraith" ? 1 : 1 + 0.04 * (D.extreme || 0));
      if (kind === "wraith") { const a = this.rnd() * 6.28; x = clamp(this.px + Math.cos(a) * 16, -ARENA + 2, ARENA - 2); y = clamp(this.py + Math.sin(a) * 16, -ARENA + 2, ARENA - 2); }
      const z = new Zombie(x, y, hp, speed, kind, this.randint(3), this, E.dmg);
      this.zombies.push(z);
      if (kind === "wraith") { z.untouch = true; z.vis = 0; z.act = "stalk"; }
      if (kind === "samurai") { z.act = "approach"; z.cd = this.uniform(0.5, 1.5); }
      this.events.push(["elite", kind, z.id]);
      const T = { tank: ["COLOSSO BLINDADO", "O escudo bloqueia tiros de frente · ataque pelos lados e costas"], samurai: ["MESTRE DA KATANA", "Rápido, esquiva tiros · cuidado com a investida"], wraith: ["O ESPECTRO", "Invisível e imune · só pode ser ferido quando ataca"] }[kind];
      this.banner = T[0]; this.bannerSub = T[1]; this.bannerT = 3.6;
      return true;
    }
    updateWaves(dt) {
      const alive = this.aliveZombies().length;
      if (this.between) { this.pauseT -= dt; if (this.pauseT <= 0) this.startWave(); return; }
      if (this.toSpawn > 0) {
        this.spawnT -= dt;
        if (this.spawnT <= 0 && alive < Math.round((10 + this.wave) * this.diff.count)) {
          if (this.spawnZombie() !== false) this.toSpawn -= 1;
          this.spawnT = Math.max(0.4, 1.4 - 0.05 * this.wave);
        }
      } else if (alive === 0) {
        this.between = true; this.pauseT = 5;
        this.banner = "ONDA " + this.wave + " COMPLETA"; this.bannerSub = "+" + this.diff.heal + " vida · munição"; this.bannerT = 3.5;
        if (this.alive) {
          this.hp = Math.min(this.maxHp, this.hp + this.diff.heal);
          if (this.armorMax) this.armor = Math.min(this.armorMax, this.armor + this.armorMax * 0.3);
          for (const s of this.slots) s.reserve = Math.min(s.cfg.maxRes * (1 + this.perks.ammoPack), s.reserve + Math.round(s.cfg.ammoPick * 1.5 * this.diff.ammo));
        }
        this.events.push(["clear", this.wave]);
      }
    }

    hurt(amount, z, o) {
      if (!this.alive || this.invulnT > 0) return;
      o = o || {};
      if (this.armor > 0 && !o.pierce) {                         // o colete absorve 60% do golpe até acabar
        const ab = Math.min(this.armor, amount * 0.6);
        this.armor -= ab; amount -= ab;
        if (!o.soft) this.events.push(["armor", this.armor <= 0]);
      }
      this.hp -= amount; this.hurtT = Math.max(this.hurtT, o.soft ? 0.18 : 0.5);
      const rel = z ? wrapAngle(Math.atan2(-(z.x - this.px), z.y - this.py) - this.yaw) : (o.rel || 0);
      if (!o.soft) this.events.push(["hurt", rel]);
      if (this.hp <= 0) {
        if (this.revives > 0) {                                  // "Segunda chance" da loja
          this.revives -= 1; this.hp = this.maxHp; this.armor = Math.max(this.armor, this.armorMax * 0.5); this.invulnT = 4; this.shake = 1.4;
          for (const q of this.zombies) if (q.state !== "dead" && !q.wraith) { const dx = q.x - this.px, dy = q.y - this.py, d = Math.hypot(dx, dy) || 1; if (d < 14) { q.kx += (dx / d) * 22; q.ky += (dy / d) * 22; q.stagger = 2.5; } }
          this.events.push(["revive"]); this.banner = "SEGUNDA CHANCE"; this.bannerSub = "Vida cheia e 4 s invencível!"; this.bannerT = 3;
          return;
        }
        this.hp = 0; this.alive = false; this.events.push(["dead"]);
      }
    }
    push(vx, vy) { this.kvx += vx; this.kvy += vy; }

    // ---------- jogador ----------
    updatePlayer(dt, inp) {
      const s = this.w(), c = s.cfg;
      this.ads = !!inp.ads && this.switchT <= 0 && !(this.reloading && !c.shell) && this.meleeT < 0.4;
      const crouchTarget = inp.crouch ? 1 : 0;
      this.crouchT += (crouchTarget - this.crouchT) * Math.min(1, dt * 10);
      const fwd = inp.fwd || 0, strafe = inp.strafe || 0;
      const fx = -Math.sin(this.yaw), fy = Math.cos(this.yaw), rx = Math.cos(this.yaw), ry = Math.sin(this.yaw);
      let mx = fx * fwd + rx * strafe, my = fy * fwd + ry * strafe;
      const ln = Math.hypot(mx, my);
      this.moving = ln > 0.01;
      if (ln > 1) { mx /= ln; my /= ln; }
      // fôlego e stamina
      this.sprinting = !!inp.sprint && fwd > 0 && !this.ads && !this.exhausted && this.stamina > 0 && this.crouchT < 0.4 && this.moving;
      if (this.sprinting) { this.stamina -= 22 * this.stamK * dt; if (this.stamina <= 0) { this.stamina = 0; this.exhausted = true; this.events.push(["winded"]); } }
      else { this.stamina = Math.min(100, this.stamina + (this.moving ? 14 : 22) * dt); if (this.exhausted && this.stamina > 25) this.exhausted = false; }
      const wantHold = !!inp.hold && this.ads && c.scope;
      if (wantHold && !this.breathLock && this.breath > 0) { this.breath -= dt; this.breathHeld = true; if (this.breath <= 0) { this.breath = 0; this.breathLock = true; this.breathHeld = false; this.events.push(["winded"]); } }
      else { this.breathHeld = false; this.breath = Math.min(4, this.breath + dt * 0.8); if (this.breathLock && this.breath > 2) this.breathLock = false; }
      let speed = PLAYER_SPEED * c.speed;
      if (this.sprinting) speed *= SPRINT_MULT;
      if (this.ads) speed *= c.adsSpeed;
      speed *= 1 - 0.45 * this.crouchT;
      speed *= this.crackSlow;
      if (this.moving) {
        this.px += mx * speed * dt; this.py += my * speed * dt;
        [this.px, this.py] = pushOut(this.px, this.py, PLAYER_R);
        this.bob += dt * speed * 1.9;
        const step = Math.floor(this.bob / Math.PI);
        if (step !== this.bobStep) { this.bobStep = step; this.events.push(["step", this.sprinting ? 1 : this.crouchT > 0.5 ? 0.3 : 0.6]); }
      }
      this.cool = Math.max(0, this.cool - dt);
      this.meleeT = Math.max(0, this.meleeT - dt);
      // troca de arma
      if (this.switchT > 0) {
        this.switchT -= dt;
        if (this.pending !== null && this.switchT <= SWITCH_TIME / 2) { this.cur = this.pending; this.pending = null; this.heat = 0; this.cool = Math.max(this.cool, 0.1); }
        if (this.switchT < 0) this.switchT = 0;
      }
      // recarga
      if (this.reloading) {
        if (c.shell && inp.fire && s.mag > 0) { this.cancelReload(); }
        else {
          this.reloadT -= dt;
          if (this.reloadT <= 0) {
            if (c.shell) {
              s.mag += 1; s.reserve -= 1; this.events.push(["shell_in"]);
              if (s.mag < c.magMax && s.reserve > 0) { this.reloadT = c.reload * this.reloadK; this.reloadTotal = this.reloadT; }
              else { this.reloading = false; this.reloadT = 0; this.events.push(["reload_done", c.id]); }
            } else {
              const cap = c.magMax + (s.mag > 0 && !c.bolt ? 1 : 0), take = Math.min(cap - s.mag, s.reserve);
              s.mag += take; s.reserve -= take; this.reloading = false; this.reloadT = 0;
              this.events.push(["reload_done", c.id]);
            }
          }
        }
      }
      // disparo
      const trigger = !!inp.fire, mode = this.mode();
      let want = trigger && (mode === "auto" || !this.triggerWas);
      if (mode === "burst") { if (want && this.burstLeft <= 0) this.burstLeft = 3; want = this.burstLeft > 0; }
      else this.burstLeft = 0;
      const ready = !this.reloading && this.switchT <= 0 && this.cool <= 0 && this.meleeT < 0.4;
      if (want && ready) {
        if (s.mag > 0) {
          this.fireWeapon();
          if (mode === "burst") { this.burstLeft -= 1; if (this.burstLeft <= 0) this.cool = Math.max(this.cool, c.delay * 2.6); }
          if (s.mag === 0 && s.reserve > 0 && !c.shell) this.startReload();
        } else { this.burstLeft = 0; if (s.reserve > 0) this.startReload(); else { this.cool = 0.35; this.events.push(["empty"]); } }
      } else if (this.burstLeft > 0 && (this.reloading || s.mag === 0)) this.burstLeft = 0;
      this.triggerWas = trigger;
    }

    // ---------- zumbis ----------
    baseDmg() { return 8 + 0.6 * Math.max(0, this.wave - 1); }
    turnToward(z, tx, ty, rate, dt) {
      const d = wrapAngle(Math.atan2(-(tx - z.x), ty - z.y) - z.yaw);
      z.yaw = wrapAngle(z.yaw + clamp(d, -rate * dt, rate * dt));
      return d;
    }
    // anda em linha reta (empurrado para fora de obstáculos); o espectro atravessa tudo. Devolve quanto andou de verdade.
    stepZ(z, ux, uy, spd, dt, ghost) {
      const ox = z.x, oy = z.y, nx = ox + ux * spd * dt, ny = oy + uy * spd * dt;
      if (ghost) { const lim = ARENA - 0.6; z.x = clamp(nx, -lim, lim); z.y = clamp(ny, -lim, lim); }
      else [z.x, z.y] = pushOut(nx, ny, ZOMBIE_R * z.s);
      return Math.hypot(z.x - ox, z.y - oy);
    }
    // caminhada com desvio de obstáculos
    walkToward(z, dt, dx, dy, dist, spd) {
      let ux = dx / dist, uy = dy / dist;
      if (z.sideT > 0) {
        z.sideT -= dt;
        const nx = ux - uy * z.side * 1.1, ny = uy + ux * z.side * 1.1, ln = Math.hypot(nx, ny) || 1;
        ux = nx / ln; uy = ny / ln;
      }
      const want = spd * dt, got = this.stepZ(z, ux, uy, spd, dt);
      if (want > 1e-6 && got < want * 0.45 && dist > 1.6) {
        z.blocked += dt;
        if (z.blocked > 0.2 && z.sideT <= 0) { z.side = this.rnd() < 0.5 ? -1 : 1; z.sideT = this.uniform(0.8, 1.6); z.blocked = 0; }
      } else z.blocked = Math.max(0, z.blocked - dt);
      z.phase += dt * (spd * 2.4 + 1);
      if (z.giant || z.tank) {
        const n = Math.floor(z.phase / Math.PI);
        if (n !== z.stepN) { z.stepN = n; this.shake = Math.max(this.shake, clamp(1 - dist / 24, 0, 1) * (z.tank ? 0.3 : 0.55)); this.events.push(["stomp", dist, z.tank ? 1 : 0]); }
      }
    }

    // ---- Colosso Blindado: escudo, investida e batida no chão (sequência de 5 s) ----
    updateTank(z, dt, dist) {
      const D = this.diff, base = this.baseDmg();
      if (z.act === "seq") {
        z.seqT += dt; const t = z.seqT; z.state = "walk";
        if (t < 1.1) {                                           // 1) ergue o escudo, planta os pés e ruge
          z.shield = 1;
          this.turnToward(z, this.px, this.py, 1.5, dt);
          if (!(z.ev & 1)) { z.ev |= 1; this.events.push(["tank_wind", z.x, z.y, dist]); }
          z.lx = -Math.sin(z.yaw); z.ly = Math.cos(z.yaw);
        } else if (t < 2.2) {                                    // 2) investida em linha reta
          if (!(z.ev & 2)) { z.ev |= 2; this.events.push(["tank_charge", z.x, z.y]); }
          const spd = 8.8, want = spd * dt, got = this.stepZ(z, z.lx, z.ly, spd, dt);
          z.phase += dt * 9;
          const pd = Math.hypot(this.px - z.x, this.py - z.y), reach = ZOMBIE_R * z.s + PLAYER_R + 0.45;
          if (pd < reach) {
            if (!z.landed) { z.landed = true; this.hurt(base * D.dmg * z.dmgMul * 1.35, z); this.push(z.lx * 12, z.ly * 12); this.shake = Math.max(this.shake, 1.3); this.events.push(["tank_ram", z.x, z.y]); }
            z.seqT = 2.2;
          } else if (got < want * 0.4) z.seqT = 2.2;               // bateu em caixa ou parede
        } else if (t < 3.2) {                                    // 3) bate o escudo no chão: onda de choque
          if (!(z.ev & 4)) {
            z.ev |= 4;
            const ix = z.x - Math.sin(z.yaw) * 1.5 * z.s, iy = z.y + Math.cos(z.yaw) * 1.5 * z.s, d = Math.hypot(this.px - ix, this.py - iy);
            this.shake = Math.max(this.shake, clamp(1.6 - dist / 14, 0.5, 1.6));
            if (d < 4.4 && !z.landed) { this.hurt(base * D.dmg * z.dmgMul * 0.8 * (1 - 0.5 * d / 4.4), z); const k = d || 1; this.push(((this.px - ix) / k) * 8, ((this.py - iy) / k) * 8); }
            this.events.push(["tank_slam", ix, iy, dist]);
          }
        } else if (t < 5.0) {                                    // 4) exausto: escudo baixo, vulnerável pela frente
          z.shield = 0;
          this.turnToward(z, this.px, this.py, 0.6, dt);
          if (!(z.ev & 8)) { z.ev |= 8; this.events.push(["tank_tired", z.x, z.y]); }
        } else { z.act = "walk"; z.seqT = 0; z.ev = 0; z.shield = 1; z.cd = this.uniform(5, 8); }
        return;
      }
      const dx = this.px - z.x, dy = this.py - z.y;
      z.cd -= dt; z.shield = 1;
      const ang = this.turnToward(z, this.px, this.py, 1.7, dt);
      if (dist < ATTACK_RANGE * z.s * 1.05) {                      // golpe de escudo
        z.state = "attack"; z.attackT += dt; z.attackCd -= dt;
        if (z.attackCd <= 0) {
          z.attackCd = 1.8; this.hurt(base * D.dmg * z.dmgMul, z);
          this.push(-Math.sin(z.yaw) * 6, Math.cos(z.yaw) * 6); this.shake = Math.max(this.shake, 0.7); this.events.push(["tank_bash", z.x, z.y]);
        }
        return;
      }
      z.state = "walk"; z.attackCd = Math.max(z.attackCd, 0.6);
      if (z.cd <= 0 && dist > 3.5 && dist < 17 && Math.abs(ang) < 0.4) { z.act = "seq"; z.seqT = 0; z.ev = 0; z.landed = false; return; }
      this.walkToward(z, dt, dx, dy, dist, z.speed * (z.slowT > 0 ? 0.85 : 1));
    }

    // ---- Mestre da Katana: saca, circula, golpeia em combo e esquiva ----
    updateSamurai(z, dt, dist, dx, dy) {
      const D = this.diff, base = this.baseDmg(), comboMax = D.extreme === 2 ? 3 : 2;
      z.dodgeCd = Math.max(0, z.dodgeCd - dt); z.cd -= dt; z.actT += dt;
      const A = SAM[z.atk] || SAM.slash, fx = -Math.sin(z.yaw), fy = Math.cos(z.yaw);
      const aim = () => { z.lx = dx / dist; z.ly = dy / dist; };
      z.state = "walk";
      switch (z.act) {
        case "approach":
          this.turnToward(z, this.px, this.py, 6, dt);
          if (dist < 9) { z.act = "draw"; z.actT = 0; this.events.push(["sam_draw", z.x, z.y, dist]); break; }
          this.walkToward(z, dt, dx, dy, dist, z.speed * (z.slowT > 0 ? 0.6 : 1));
          break;
        case "draw":                                               // saca a katana
          this.turnToward(z, this.px, this.py, 6, dt);
          this.walkToward(z, dt, dx, dy, dist, z.speed * 0.35);
          if (z.actT >= 0.75) { z.drawn = true; z.act = "stalk"; z.actT = 0; z.cd = this.uniform(0.3, 0.8); }
          break;
        case "stalk": {                                            // guarda baixa, passos laterais, procurando a abertura
          this.turnToward(z, this.px, this.py, 7, dt);
          const wob = Math.sin(this.time * 2.4 + z.id) * 0.9, ux = dx / dist, uy = dy / dist;
          const mx = ux + -uy * wob * 0.7, my = uy + ux * wob * 0.7, ln = Math.hypot(mx, my) || 1;
          this.stepZ(z, mx / ln, my / ln, z.speed * (dist > 5 ? 1 : 0.7) * (z.slowT > 0 ? 0.6 : 1), dt);
          z.phase += dt * (z.speed * 2.2 + 1);
          if (z.cd <= 0 && dist < 4.6) {
            z.atk = dist > 3.3 ? "thrust" : this.rnd() < 0.5 ? "slash" : "over";
            z.act = "windup"; z.actT = 0; z.combo = 0; z.landed = false; aim();
            this.events.push(["sam_wind", z.id, z.atk, z.x, z.y]);
          } else if (dist < 1.7) { z.atk = "slash"; z.act = "windup"; z.actT = A.wind * 0.45; z.combo = 0; z.landed = false; aim(); this.events.push(["sam_wind", z.id, "slash", z.x, z.y]); }
          break;
        }
        case "windup":
          z.state = "attack";
          this.turnToward(z, this.px, this.py, 9, dt);
          if (z.actT >= A.wind * (z.combo ? 0.7 : 1)) { z.act = "strike"; z.actT = 0; z.hitDone = false; aim(); this.events.push(["sam_slash", z.id, z.atk, z.x, z.y]); }
          break;
        case "strike": {
          z.state = "attack";
          this.stepZ(z, z.lx, z.ly, A.lunge / A.strike, dt);
          if (z.actT >= A.strike * 0.45 && !z.hitDone) {
            z.hitDone = true;
            const pd = Math.hypot(this.px - z.x, this.py - z.y), fxx = -Math.sin(z.yaw), fyy = Math.cos(z.yaw);
            if (pd < A.reach && ((this.px - z.x) * fxx + (this.py - z.y) * fyy) / (pd || 1) > A.cone) {
              z.landed = true; this.hurt(base * D.dmg * z.dmgMul * A.dmg, z); this.push(fxx * 4, fyy * 4); this.events.push(["sam_hit", z.id]);
            }
          }
          if (z.actT >= A.strike) { z.act = "recover"; z.actT = 0; }
          break;
        }
        case "recover":
          z.state = "attack";
          this.turnToward(z, this.px, this.py, 4, dt);
          if (z.actT >= A.rec) {
            if (z.combo + 1 < comboMax && dist < 3.7 && this.rnd() < 0.75) {
              z.combo += 1; z.atk = z.atk === "slash" ? "over" : z.atk === "over" ? "thrust" : "slash"; z.act = "windup"; z.actT = 0; aim();
              this.events.push(["sam_wind", z.id, z.atk, z.x, z.y]);
            } else { z.act = "retreat"; z.actT = 0; }
          }
          break;
        case "retreat": {
          this.turnToward(z, this.px, this.py, 6, dt);
          this.stepZ(z, -dx / dist, -dy / dist, 4, dt);
          if (z.actT >= 0.65) { z.act = z.landed ? "flourish" : "stalk"; z.actT = 0; z.cd = this.uniform(0.8, 1.8); }
          break;
        }
        case "flourish":                                           // sacode o sangue da lâmina
          this.turnToward(z, this.px, this.py, 3, dt);
          if (z.actT >= 0.7) { z.act = "stalk"; z.actT = 0; z.cd = this.uniform(0.3, 1.0); }
          break;
        case "dodge": {
          this.stepZ(z, z.lx, z.ly, 9.5, dt);
          if (z.actT >= 0.4) {
            z.untouch = false;
            if (this.rnd() < 0.5 && dist < 5) { z.atk = "thrust"; z.act = "windup"; z.actT = A.wind * 0.3; z.combo = 0; z.landed = false; aim(); this.events.push(["sam_wind", z.id, "thrust", z.x, z.y]); }
            else { z.act = "stalk"; z.actT = 0; z.cd = this.uniform(0.2, 0.7); }
          }
          break;
        }
        default: z.act = "stalk";
      }
    }

    // ---- O Espectro: invisível e imune; só aparece (e sangra) quando bate com a espada ----
    updateWraith(z, dt, dist) {
      const base = this.baseDmg(), D = this.diff;
      if (z.act === "seq") {
        z.seqT += dt; const t = z.seqT; z.state = "attack";
        z.vis = clamp(t / 0.6, 0, 1) * (t > 5.4 ? clamp((5.9 - t) / 0.5, 0, 1) : 1);
        z.untouch = t < 0.5 || t >= 5.9;
        if (t < 2.0) this.turnToward(z, this.px, this.py, 0.9, dt);
        if (t >= 2.0 && !(z.ev & 1)) { z.ev |= 1; this.events.push(["wraith_hold", z.x, z.y, dist]); }
        if (t >= 2.8 && !(z.ev & 2)) { z.ev |= 2; this.wraithSlam(z, dist); }
        if (t >= 6.0) { z.act = "stalk"; z.seqT = 0; z.ev = 0; z.stalkT = this.uniform(2.2, 3.6); z.vis = 0; z.untouch = true; this.events.push(["wraith_vanish", z.x, z.y]); }
        return;
      }
      z.untouch = true; z.vis = Math.max(0, z.vis - dt * 3); z.state = "walk";
      z.stalkT -= dt; z.orb += z.orbDir * dt * 1.7;
      const R = z.stalkT > 0.8 ? 4.8 + 1.5 * Math.sin(z.orb * 0.7) : 3.4;
      const tx = this.px + Math.cos(z.orb) * R, ty = this.py + Math.sin(z.orb) * R, ex = tx - z.x, ey = ty - z.y, ed = Math.hypot(ex, ey) || 1e-6;
      this.stepZ(z, ex / ed, ey / ed, Math.min(z.speed, ed / dt), dt, true);
      this.turnToward(z, this.px, this.py, 9, dt);
      z.phase += dt * 11;
      z.groanT = 99;
      if (z.stalkT <= 0 && dist < 7.5) { z.act = "seq"; z.seqT = 0; z.ev = 0; z.vis = 0; this.events.push(["wraith_appear", z.x, z.y, dist]); }
      else if (z.stalkT <= 0) z.stalkT = 0;
    }
    wraithSlam(z, dist) {
      const D = this.diff, base = this.baseDmg(), R = 4.8;
      const ix = z.x - Math.sin(z.yaw) * 4.2, iy = z.y + Math.cos(z.yaw) * 4.2;
      z.ix = ix; z.iy = iy;
      this.makeCracks(ix, iy);
      const d = Math.hypot(this.px - ix, this.py - iy);
      if (d < R) {
        const f = 1 - 0.55 * (d / R);
        this.hurt((18 + base * D.dmg * 1.1) * f, null, { rel: wrapAngle(Math.atan2(-(ix - this.px), iy - this.py) - this.yaw) });
        const k = d || 1; this.push(((this.px - ix) / k) * 9, ((this.py - iy) / k) * 9);
      }
      this.shake = Math.max(this.shake, clamp(2.0 - dist / 16, 0.9, 2.0));
      this.sched.push({ t: 0.45, fn: "shake", v: 0.9 }, { t: 1.0, fn: "shake", v: 0.5 });
      this.events.push(["wraith_slam", ix, iy, Math.hypot(this.px - ix, this.py - iy)]);
    }
    // rachaduras no chão: ficam 10 s, queimam e atrasam quem pisa
    makeCracks(x, y) {
      const id = this.nextCrack++, n = 8 + this.randint(3), lines = [], lim = ARENA - 0.25;
      const walk = (x0, y0, a0, len, branch) => {
        const pts = [[x0, y0]];
        let a = a0, px = x0, py = y0, run = 0;
        while (run < len) {
          const sl = this.uniform(0.45, 0.8); a += this.uniform(-0.38, 0.38);
          px = clamp(px + Math.cos(a) * sl, -lim, lim); py = clamp(py + Math.sin(a) * sl, -lim, lim); run += sl;
          pts.push([px, py]);
          if (branch && pts.length > 2 && this.rnd() < 0.3) walk(px, py, a + (this.rnd() < 0.5 ? -1 : 1) * this.uniform(0.7, 1.1), this.uniform(1.0, 2.2), false);
        }
        lines.push(pts);
      };
      for (let i = 0; i < n; i++) walk(x, y, (i / n) * 6.2832 + this.uniform(-0.25, 0.25), this.uniform(3.2, 6.3), true);
      this.cracks.push({ id, x, y, t: 0, ttl: 10, r: 1.35, lines });
      if (this.cracks.length > 4) this.cracks.shift();
      this.events.push(["crack", id]);
    }
    updateCracks(dt) {
      let inside = false;
      for (const c of this.cracks) {
        c.t += dt;
        if (this.alive && c.t < c.ttl - 1.2 && !inside) {
          const px = this.px, py = this.py;
          if (Math.hypot(px - c.x, py - c.y) < c.r) inside = true;
          else for (const ln of c.lines) {
            for (let i = 1; i < ln.length && !inside; i++) {
              const ax = ln[i - 1][0], ay = ln[i - 1][1], bx = ln[i][0], by = ln[i][1], vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1e-9;
              const t = clamp(((px - ax) * vx + (py - ay) * vy) / l2, 0, 1), qx = ax + vx * t - px, qy = ay + vy * t - py;
              if (qx * qx + qy * qy < 0.3 * 0.3) inside = true;
            }
            if (inside) break;
          }
        }
      }
      this.cracks = this.cracks.filter((c) => c.t < c.ttl);
      this.crackSlow = inside ? 0.55 : 1;
      if (inside) {
        this.hurt((5 + this.baseDmg() * this.diff.dmg * 0.3) * dt, null, { soft: true });
        this.burnT -= dt; if (this.burnT <= 0) { this.burnT = 0.5; this.events.push(["burn"]); }
      }
    }

    updateZombies(dt) {
      const base = this.baseDmg();
      for (const z of this.zombies) {
        z.hitT = Math.max(0, z.hitT - dt);
        if ((z.kx || z.ky) && !z.wraith) {
          [z.x, z.y] = pushOut(z.x + z.kx * dt, z.y + z.ky * dt, ZOMBIE_R * z.s);
          const k = Math.exp(-9 * dt); z.kx *= k; z.ky *= k;
          if (Math.abs(z.kx) + Math.abs(z.ky) < 0.01) z.kx = z.ky = 0;
        }
        if (z.state === "dead") { z.deadT += dt; z.fall = Math.min(1, z.deadT / 0.55); continue; }
        z.stagger = Math.max(0, z.stagger - dt); z.slowT = Math.max(0, z.slowT - dt);
        const dx = this.px - z.x, dy = this.py - z.y, dist = Math.hypot(dx, dy) || 1e-6;
        z.groanT -= dt;
        if (z.groanT <= 0) {
          z.groanT = z.elite ? this.uniform(5, 10) : this.uniform(4, 9);
          const rx = Math.cos(this.yaw), ry = Math.sin(this.yaw);
          this.events.push(["groan", dist, z.kind, clamp(((z.x - this.px) * rx + (z.y - this.py) * ry) / dist, -1, 1)]);
        }
        if (z.tank) { this.updateTank(z, dt, dist); continue; }
        if (z.samurai) { this.updateSamurai(z, dt, dist, dx, dy); continue; }
        if (z.wraith) { this.updateWraith(z, dt, dist); continue; }
        const diff = wrapAngle(Math.atan2(-dx, dy) - z.yaw);
        z.yaw = wrapAngle(z.yaw + clamp(diff, -7 * dt, 7 * dt));
        if (dist < ATTACK_RANGE * z.s * (z.brute ? 1.1 : 1)) {
          z.state = "attack"; z.attackT += dt; z.attackCd -= dt;
          if (z.attackCd <= 0) { z.attackCd = z.giant ? 1.9 : z.brute ? 1.4 : 1; this.hurt(base * this.diff.dmg * z.dmgMul, z); if (z.giant) this.shake = Math.max(this.shake, 0.9); }
          continue;
        }
        z.state = "walk"; z.attackCd = Math.max(z.attackCd, 0.3);
        const spd = z.speed * (z.stagger > 0 ? 0.25 : 1) * (z.slowT > 0 ? (z.giant ? 0.85 : 0.55) : 1) * (z.limp ? 0.8 : 1);
        this.walkToward(z, dt, dx, dy, dist, spd);
      }
      const live = this.aliveZombies().filter((z) => !z.wraith);
      for (let i = 0; i < live.length; i++) {
        const a = live[i];
        for (let j = i + 1; j < live.length; j++) {
          const b = live[j], sep = ZOMBIE_SEP * Math.max(a.s, b.s);
          let dx = b.x - a.x, dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < sep * sep) {
            let d = Math.sqrt(d2);
            if (d < 1e-4) { dx = 0.01; dy = 0; d = 0.01; }
            const push = (sep - d) * 0.5;
            a.x -= (dx / d) * push; a.y -= (dy / d) * push; b.x += (dx / d) * push; b.y += (dy / d) * push;
          }
        }
      }
      for (const z of live) [z.x, z.y] = pushOut(z.x, z.y, ZOMBIE_R * z.s);
      this.zombies = this.zombies.filter((z) => !(z.state === "dead" && z.deadT > 6));
    }

    canTake(p) { return p.kind !== "health" || this.hp < this.maxHp; }
    takePickup(p) {
      if (p.kind === "health") {
        const gain = Math.min(30, this.maxHp - this.hp); this.hp = Math.min(this.maxHp, this.hp + 30);
        this.events.push(["pickup", "health", Math.round(gain)]);
      } else {
        let gain = 0;
        this.slots.forEach((s, i) => {
          const before = s.reserve;
          s.reserve = Math.min(s.cfg.maxRes * (1 + this.perks.ammoPack), s.reserve + Math.round(s.cfg.ammoPick * (i === this.cur ? 1 : 0.5)));
          if (i === this.cur) gain = s.reserve - before;
        });
        this.events.push(["pickup", "ammo", gain]);
      }
    }
    updatePickups(dt) {
      const keep = [];
      for (const p of this.pickups) {
        p.age += dt; p.ttl -= dt;
        if (p.ttl <= 0) continue;
        if (!p.landed) {                       // voo: sai do corpo e quica
          p.vz -= 9.8 * dt; p.h += p.vz * dt;
          const q = pushOut(p.x + p.vx * dt, p.y + p.vy * dt, 0.25);
          if (Math.abs(q[0] - (p.x + p.vx * dt)) > 1e-6) p.vx *= -0.4;
          if (Math.abs(q[1] - (p.y + p.vy * dt)) > 1e-6) p.vy *= -0.4;
          p.x = q[0]; p.y = q[1];
          if (p.h <= 0) {
            p.h = 0;
            if (p.vz < -2.2) { p.vz *= -0.35; p.vx *= 0.5; p.vy *= 0.5; } else { p.landed = true; p.vx = p.vy = p.vz = 0; }
          }
        }
        const d = Math.hypot(p.x - this.px, p.y - this.py);
        if (this.alive && p.age > 0.35) {
          const ok = this.canTake(p);
          if (d < PICK_R && ok) { this.takePickup(p); continue; }
          if (ok && d < MAGNET_R * this.magnetK) {              // ímã: o item desliza até você
            p.pull = Math.min(1, p.pull + dt * 2.5);
            const sp = (2.5 + 7 * p.pull) * dt, k = Math.min(1, sp / Math.max(d, 1e-3));
            p.x += (this.px - p.x) * k; p.y += (this.py - p.y) * k;
            if (p.landed) p.h = Math.min(0.25, p.h + dt);
          } else p.pull = Math.max(0, p.pull - dt * 2);
          if (!ok && d < 1.6) {
            p.fullT -= dt;
            if (p.fullT <= 0) { p.fullT = 3; this.events.push(["pickup_full"]); }
          }
        }
        keep.push(p);
      }
      this.pickups = keep;
    }

    // alvo sob a mira (usado pelo tiro automático no celular)
    aimTarget(maxDist) {
      const sway = this.aimSway(), yaw = this.yaw + sway[0], pitch = this.pitch + this.recoil + sway[1], cp = Math.cos(pitch);
      const h = this.cast(this.px, this.py, this.eyeH(), -Math.sin(yaw) * cp, Math.cos(yaw) * cp, Math.sin(pitch));
      return h.kind === "zombie" && h.t <= (maxDist || 45) ? h.z : null;
    }

    update(dt, inp) {
      this.time += dt;
      this.shake *= Math.exp(-4.5 * dt);
      this.hurtT = Math.max(0, this.hurtT - dt); this.hitmarkT = Math.max(0, this.hitmarkT - dt);
      this.bannerT = Math.max(0, this.bannerT - dt); this.flashT = Math.max(0, this.flashT - dt);
      { const R = this.w().cfg.rec, k = Math.exp(-R.rec * dt); this.recoil *= k; this.recoilYaw *= k; this.sustain = Math.max(0, this.sustain - R.settle * dt * 0.5); }
      this.kick *= Math.exp(-16 * dt); this.heat = Math.max(0, this.heat - 0.9 * dt);
      for (const e of this.sched) e.t -= dt;
      for (const e of this.sched) if (e.t <= 0) { if (e.fn === "melee") this.doMelee(); else if (e.fn === "shake") this.shake = Math.max(this.shake, e.v); else if (e.ev) this.events.push(e.ev); }
      this.sched = this.sched.filter((e) => e.t > 0);
      if (this.alive) {
        this.updatePlayer(dt, inp);
        if (this.hp < 30) { this.hbT -= dt; if (this.hbT <= 0) { this.hbT = 0.5 + this.hp / 60; this.events.push(["heart"]); } }
      } else { this.moving = false; this.ads = false; }
      this.invulnT = Math.max(0, this.invulnT - dt);
      if (this.alive && (this.kvx || this.kvy)) {                               // empurrões (investida, batida de escudo, onda de choque)
        [this.px, this.py] = pushOut(this.px + this.kvx * dt, this.py + this.kvy * dt, PLAYER_R);
        const k = Math.exp(-6 * dt); this.kvx *= k; this.kvy *= k;
        if (Math.abs(this.kvx) + Math.abs(this.kvy) < 0.05) this.kvx = this.kvy = 0;
      }
      this.updateWaves(dt); this.updateZombies(dt); this.updatePickups(dt); this.updateCracks(dt);
    }
  }

  return {
    Game, Zombie, Pickup, buildSlot, rangeFactor, damageAt, weaponStats, recoilPattern, pushOut, insideAny, clamp, wrapAngle, BOXES, OBSTACLES, LAMPS, WEAPONS, WEAPON_ORDER, DIFF, DIFF_ORDER, ELITE, SAM,
    C: { ARENA, WALL_H, EYE_H, CROUCH_DROP, PLAYER_R, RADAR_RANGE: 18, SWITCH_TIME, MELEE_CD, PICK_TTL },
  };
})();
// ==LOGIC-END==
