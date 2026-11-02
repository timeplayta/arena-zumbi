
  // ======================================================================
  //  ENTRADA (nome e idade), MOEDAS E LOJA
  //  Tudo fica salvo só neste aparelho (localStorage).
  // ======================================================================
  const WALLET_KEY = "arena-zumbi-wallet", PROFILE_KEY = "arena-zumbi-profile";

  // ---------------- catálogo ----------------
  const UPG = [
    { k: "hp", n: "Vida máxima", d: "+10 de vida máxima por nível.", p: [150, 300, 450, 650, 900] },
    { k: "armor", n: "Armadura base", d: "+25 de armadura por nível. A armadura absorve 60% do dano que você leva.", p: [250, 500, 800, 1200] },
    { k: "dmg", n: "Munição reforçada", d: "+5% de dano em todas as armas de fogo, por nível.", p: [200, 400, 650, 900, 1300] },
    { k: "reload", n: "Recarga rápida", d: "Recarrega 7% mais rápido, por nível.", p: [150, 300, 500, 700, 1000] },
    { k: "ammo", n: "Mochila de munição", d: "+10% de munição de reserva no começo, por nível.", p: [150, 300, 450, 650, 900] },
    { k: "magnet", n: "Ímã de itens", d: "+25% de alcance para puxar vida e munição, por nível.", p: [150, 350, 650] },
    { k: "stam", n: "Fôlego", d: "O fôlego gasta 10% mais devagar, por nível.", p: [150, 300, 500, 750] },
    { k: "pots", n: "Bolsa de poções", d: "Modo Infecção: toda partida começa com 2 molotovs e 2 poções de cura. Cada nível dá +1 de cada (até 5).", p: [500, 600, 700] },
  ];
  const CONS = [
    { k: "vest", n: "Colete de kevlar", d: "Começa a próxima partida com +50 de armadura.", p: 120 },
    { k: "ammoPack", n: "Mochila dupla", d: "Dobra a munição de reserva (e o limite) durante a partida.", p: 150 },
    { k: "revive", n: "Segunda chance", d: "Se você morrer, volta com a vida CHEIA, 4 s invencível e joga os zumbis longe. Só gasta se você realmente morrer.", p: 400 },
  ];
  const GUN_PRICE = { revolver: 1200, titan: 2200 };
  const MELEE = {
    knife: { n: "Faca de combate", d: "A de sempre. Rápida e discreta.", price: 0, stats: { dmg: 55, range: 1.9, cd: 0.75, knock: 6 } },
    machete: { n: "Facão", d: "Mais dano e golpe rápido.", price: 300, stats: { dmg: 75, range: 1.95, cd: 0.6, knock: 6 } },
    katana: { n: "Katana", d: "Alcance maior, corte veloz e muito afiada.", price: 800, stats: { dmg: 100, range: 2.3, cd: 0.55, knock: 4 } },
    axe: { n: "Machado de bombeiro", d: "Lento, mas parte qualquer zumbi comum ao meio.", price: 650, stats: { dmg: 160, range: 1.9, cd: 1.0, knock: 10 } },
  };
  const CONS_MAX = 5;

  // ---------------- carteira ----------------
  const newWallet = () => ({ coins: 0, perks: { hp: 0, armor: 0, dmg: 0, reload: 0, ammo: 0, magnet: 0, stam: 0, pots: 0 }, own: {}, stock: { vest: 0, ammoPack: 0, revive: 0 }, use: { vest: true, ammoPack: true, revive: true }, melee: "knife", total: 0, runs: 0 });
  const wallet = newWallet();
  const int = (v, lo, hi) => { v = Math.floor(Number(v)); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo; };
  function loadWallet() {
    try {
      const o = JSON.parse(localStorage.getItem(WALLET_KEY) || "null");
      if (!o || typeof o !== "object") return;
      wallet.coins = int(o.coins, 0, 9999999); wallet.total = int(o.total, 0, 99999999); wallet.runs = int(o.runs, 0, 999999);
      for (const u of UPG) wallet.perks[u.k] = int(o.perks && o.perks[u.k], 0, u.p.length);
      for (const c of CONS) { wallet.stock[c.k] = int(o.stock && o.stock[c.k], 0, CONS_MAX); wallet.use[c.k] = !(o.use && o.use[c.k] === false); }
      if (o.own && typeof o.own === "object") for (const k in o.own) if (o.own[k] === true) wallet.own[k] = true;
      if (MELEE[o.melee]) wallet.melee = o.melee;
    } catch (e) {}
  }
  function saveWallet() { try { localStorage.setItem(WALLET_KEY, JSON.stringify(wallet)); } catch (e) {} }
  const ownsWeapon = (id) => !W[id].shop || !!wallet.own["w_" + id];
  const ownsCamo = (k) => !CAMOS[k].prem || !!wallet.own["c_" + k];
  const ownsMelee = (k) => k === "knife" || !!wallet.own["m_" + k];
  // volta a escolhas válidas caso algo comprado não esteja disponível
  function sanitizeOwned() {
    const free = WEAPON_ORDER.filter(ownsWeapon);
    for (let i = 0; i < 2; i++) {
      if (!ownsWeapon(S.loadout[i]) || (i === 1 && S.loadout[1] === S.loadout[0])) S.loadout[i] = free.find((id) => id !== S.loadout[1 - i]) || "p45";
    }
    if (!ownsCamo(S.camo)) S.camo = "black";
    if (!ownsMelee(wallet.melee)) wallet.melee = "knife";
  }
  loadWallet();
  sanitizeOwned();

  // ---------------- perfil ----------------
  const profile = { name: "", age: 0 };
  try {
    const o = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
    if (o && typeof o.name === "string") { profile.name = o.name.slice(0, 14); profile.age = int(o.age, 0, 99); }
  } catch (e) {}
  if (profile.name) giftJuan100k();                                        // já logado como Juan: recebe na hora
  function updateWho() {
    const w = $("who");
    if (!profile.name) { w.hidden = true; return; }
    w.hidden = false;
    w.innerHTML = "<b>" + esc(profile.name) + "</b><span>" + profile.age + " anos</span><span class=\"coin\">" + wallet.coins + "</span>";
    $("storeCoins").textContent = String(wallet.coins);
  }
  // ---------------- tela de entrada ----------------
  const gate = $("gate"), gateForm = $("gateForm"), gErr = $("gErr");
  let gateLocked = true;
  const menuEl = $("menu");
  function setGate(on) {
    gateLocked = on; gate.hidden = !on;
    if (on) { menuEl.setAttribute("inert", ""); menuEl.inert = true; } else { menuEl.removeAttribute("inert"); menuEl.inert = false; }
  }
  setGate(true);
  $("gName").value = profile.name; $("gAge").value = profile.age ? String(profile.age) : "";
  setTimeout(() => { try { ($("gName").value ? $("gAge") : $("gName")).focus(); } catch (e) {} }, 60);
  function gateError(msg) { gErr.textContent = msg; gErr.hidden = false; }
  // presente único de 100.000 moedas para o perfil "Juan" (vale ao entrar ou se já estiver logado)
  function giftJuan100k() {
    if (String(profile.name || "").trim().toLowerCase() !== "juan" || wallet.own.g_juan100k) return false;
    wallet.own.g_juan100k = true; wallet.coins = Math.min(9999999, wallet.coins + 100000); saveWallet(); updateWho();
    setTimeout(() => { try { feedLine("+100.000 MOEDAS DE PRESENTE", true); } catch (e) {} }, 1500);
    return true;
  }
  gateForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("gName").value.replace(/\s+/g, " ").trim(), ageRaw = $("gAge").value.trim(), age = Number(ageRaw);
    if (name.length < 2) { gateError("Digite seu nome (pelo menos 2 letras)."); $("gName").focus(); return; }
    if (!/^\d{1,2}$/.test(ageRaw) || age < 5 || age > 99) { gateError("Digite uma idade válida (de 5 a 99)."); $("gAge").focus(); return; }
    profile.name = name; profile.age = age; S.name = name;
    // presente único de 50.000 moedas para o perfil "Juan", 98 anos
    if (name.toLowerCase() === "juan" && age === 98 && !wallet.own.g_juan50k) {
      wallet.own.g_juan50k = true; wallet.coins = Math.min(9999999, wallet.coins + 50000); saveWallet();
    }
    giftJuan100k();
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (err) {}
    saveSettings();
    gErr.hidden = true;
    setGate(false); updateWho(); renderMission(); renderSummary();
    try { $("btnPlay").focus(); } catch (err) {}
  });

  // ---------------- compras ----------------
  const coin = (n) => '<span class="coin">' + n + "</span>";
  function spend(price) {
    if (wallet.coins < price) { Snd.init(); Snd.play("deny", 0.7); return false; }
    wallet.coins -= price; saveWallet(); Snd.init(); Snd.play("buy", 0.8); return true;
  }
  function renderStore() {
    const c = wallet.coins;
    $("shopUp").innerHTML = UPG.map((u) => {
      const lv = wallet.perks[u.k], max = u.p.length, price = lv < max ? u.p[lv] : 0;
      let pips = ""; for (let i = 0; i < max; i++) pips += "<i" + (i < lv ? ' class="on"' : "") + "></i>";
      return '<div class="si' + (lv >= max ? " own" : "") + '"><b>' + esc(u.n) + '</b><span class="d">' + esc(u.d) + '</span><div class="pips">' + pips + '</div><div class="meta">' +
        (lv >= max ? "<span>NÍVEL MÁXIMO</span>" : coin(price) + '<button type="button" class="buy" data-buy="up:' + u.k + '"' + (c < price ? " disabled" : "") + ">Nível " + (lv + 1) + "</button>") + "</div></div>";
    }).join("");
    $("shopCons").innerHTML = CONS.map((u) => {
      const n = wallet.stock[u.k], on = wallet.use[u.k];
      return '<div class="si' + (n > 0 ? " own" : "") + '"><b>' + esc(u.n) + '</b><span class="d">' + esc(u.d) + '</span><div class="meta"><span class="stk">EM ESTOQUE: ' + n + "</span>" +
        (n > 0 ? '<button type="button" class="buy alt" data-buy="use:' + u.k + '">' + (on ? "Usar: sim" : "Usar: não") + "</button>" : "") + '</div><div class="meta">' + coin(u.p) +
        '<button type="button" class="buy" data-buy="cons:' + u.k + '"' + (c < u.p || n >= CONS_MAX ? " disabled" : "") + ">Comprar</button></div></div>";
    }).join("");
    $("shopGuns").innerHTML = WEAPON_ORDER.filter((id) => W[id].shop).map((id) => {
      const w = W[id], own = ownsWeapon(id), price = GUN_PRICE[id];
      return '<div class="si' + (own ? " own" : "") + '"><b>' + esc(w.name) + '</b><span class="d">' + esc(w.cls) + ". " + esc(w.desc) + '</span><div class="meta">' +
        (own ? '<span class="stk">COMPRADA</span><button type="button" class="buy alt" data-buy="arsenal">Ver no Arsenal</button>' : coin(price) + '<button type="button" class="buy" data-buy="gun:' + id + '"' + (c < price ? " disabled" : "") + ">Comprar</button>") + "</div></div>";
    }).join("");
    $("shopMelee").innerHTML = Object.keys(MELEE).map((k) => {
      const m = MELEE[k], own = ownsMelee(k), eq = wallet.melee === k;
      return '<div class="si' + (eq ? " eq" : own ? " own" : "") + '"><b>' + esc(m.n) + '</b><span class="d">' + esc(m.d) + " Dano " + m.stats.dmg + " · alcance " + m.stats.range.toFixed(1) + " m · " + (1 / m.stats.cd).toFixed(1) + " golpes/s.</span><div class=\"meta\">" +
        (eq ? '<span class="stk">EQUIPADA</span>' : own ? '<button type="button" class="buy" data-buy="eqm:' + k + '">Equipar</button>' : coin(m.price) + '<button type="button" class="buy" data-buy="melee:' + k + '"' + (c < m.price ? " disabled" : "") + ">Comprar</button>") + "</div></div>";
    }).join("");
    $("shopSkins").innerHTML = Object.keys(CAMOS).filter((k) => CAMOS[k].prem).map((k) => {
      const m = CAMOS[k], own = ownsCamo(k), eq = S.camo === k;
      return '<div class="si' + (eq ? " eq" : own ? " own" : "") + '"><b>' + esc(m.n) + '</b><div class="sw3" style="background:linear-gradient(90deg,' + hexCss(m.c) + ',' + hexCss(m.c) + 'cc 55%,#0008)"></div><div class="meta">' +
        (eq ? '<span class="stk">EM USO</span>' : own ? '<button type="button" class="buy" data-buy="eqc:' + k + '">Usar</button>' : coin(m.price) + '<button type="button" class="buy" data-buy="camo:' + k + '"' + (c < m.price ? " disabled" : "") + ">Comprar</button>") + "</div></div>";
    }).join("");
    updateWho();
  }
  menuEl.addEventListener("click", (e) => {
    const t = e.target.closest("[data-buy]");
    if (!t || t.disabled) return;
    const [kind, key] = t.getAttribute("data-buy").split(":");
    if (kind === "arsenal") { showTab("arsenal"); return; }
    if (kind === "up") {
      const u = UPG.find((x) => x.k === key), lv = wallet.perks[key];
      if (u && lv < u.p.length && spend(u.p[lv])) wallet.perks[key] = lv + 1;
    } else if (kind === "cons") {
      const u = CONS.find((x) => x.k === key);
      if (u && wallet.stock[key] < CONS_MAX && spend(u.p)) wallet.stock[key]++;
    } else if (kind === "use") wallet.use[key] = !wallet.use[key];
    else if (kind === "gun") { if (GUN_PRICE[key] && !ownsWeapon(key) && spend(GUN_PRICE[key])) wallet.own["w_" + key] = true; }
    else if (kind === "melee") { if (MELEE[key] && !ownsMelee(key) && spend(MELEE[key].price)) { wallet.own["m_" + key] = true; wallet.melee = key; } }
    else if (kind === "eqm") { if (ownsMelee(key)) wallet.melee = key; }
    else if (kind === "camo") { if (CAMOS[key] && !ownsCamo(key) && spend(CAMOS[key].price)) { wallet.own["c_" + key] = true; S.camo = key; vmKey = ""; saveSettings(); } }
    else if (kind === "eqc") { if (ownsCamo(key)) { S.camo = key; vmKey = ""; saveSettings(); } }
    saveWallet(); renderStore(); renderCustom();
  });

  // código secreto do dono do jogo: digite "moedas50k" fora das partidas para ganhar 50.000 moedas
  let secretBuf = "";
  window.addEventListener("keydown", (e) => {
    if (gateLocked || !e.key || e.key.length !== 1) return;
    secretBuf = (secretBuf + e.key.toLowerCase()).slice(-9);
    if (secretBuf === "moedas50k") {
      secretBuf = "";
      wallet.coins = Math.min(9999999, wallet.coins + 50000); saveWallet(); updateWho(); renderStore(); renderCustom();
      Snd.init(); Snd.play("buy", 0.8);
    }
  });

  // ---------------- opções de cada partida ----------------
  function runOpts() {
    const p = wallet.perks, pk = { hp: p.hp, armor: p.armor, dmg: p.dmg, reload: p.reload, ammo: p.ammo, magnet: p.magnet, stam: p.stam, vest: 0, ammoPack: 0, revive: 0 }, used = [];
    for (const k of ["vest", "ammoPack", "revive"]) if (wallet.stock[k] > 0 && wallet.use[k]) { pk[k] = 1; wallet.stock[k]--; used.push(k); }
    if (used.length) saveWallet();
    return { perks: pk, melee: Object.assign({}, MELEE[wallet.melee].stats), used };
  }
  // paga as moedas da partida (uma vez só)
  function payRun(g, used) {
    if (!g || g.paid || g.time < 1) return 0;
    g.paid = true;
    const n = g.coins();
    wallet.coins += n; wallet.total += n; wallet.runs += 1;
    if (used && used.indexOf("revive") >= 0 && g.revives > 0) wallet.stock.revive = Math.min(CONS_MAX, wallet.stock.revive + 1);   // segunda chance não usada volta pro estoque
    saveWallet(); updateWho();
    return n;
  }
  updateWho();
