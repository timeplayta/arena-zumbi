
  // ======================================================================
  //  ENTRADA (nome e idade), MOEDAS E LOJA
  //  Tudo fica salvo só neste aparelho (localStorage).
  // ======================================================================
  const WALLET_KEY = "arena-zumbi-wallet", PROFILE_KEY = "arena-zumbi-profile";

  // ---------------- catálogo ----------------
  const UPG = [
    { k: "hp", n: "Vida máxima", d: "+10 de vida máxima por nível.", p: [1000, 1200, 1400, 1600, 1800] },
    { k: "armor", n: "Armadura base", d: "+25 de armadura por nível. A armadura absorve 60% do dano que você leva.", p: [1000, 1200, 1400, 1600] },
    { k: "dmg", n: "Munição reforçada", d: "+5% de dano em todas as armas de fogo, por nível.", p: [1000, 1200, 1400, 1600, 1800] },
    { k: "reload", n: "Recarga rápida", d: "Recarrega 7% mais rápido, por nível.", p: [1000, 1200, 1400, 1600, 1800] },
    { k: "ammo", n: "Mochila de munição", d: "+10% de munição de reserva no começo, por nível.", p: [1000, 1200, 1400, 1600, 1800] },
    { k: "magnet", n: "Ímã de itens", d: "+25% de alcance para puxar vida e munição, por nível.", p: [1000, 1200, 1400] },
    { k: "stam", n: "Fôlego", d: "O fôlego gasta 10% mais devagar, por nível.", p: [1000, 1200, 1400, 1600] },
    { k: "pots", n: "Bolsa de poções", d: "Modo Infecção: toda partida começa com 2 molotovs e 2 poções de cura. Cada nível dá +1 de cada (até 5).", p: [1000, 1200, 1400] },
  ];
  const CONS = [
    { k: "vest", n: "Colete de kevlar", d: "Começa a próxima partida com +50 de armadura.", p: 120 },
    { k: "ammoPack", n: "Mochila dupla", d: "Dobra a munição de reserva (e o limite) durante a partida.", p: 150 },
    { k: "revive", n: "Segunda chance", d: "Se você morrer, volta com a vida CHEIA, 4 s invencível e joga os zumbis longe. Só gasta se você realmente morrer.", p: 400 },
  ];
  const GUN_PRICE = { revolver: 5000, titan: 10000 };
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
  function saveWalletLocal() { try { localStorage.setItem(WALLET_KEY, JSON.stringify(wallet)); } catch (e) {} }
  function saveWallet() { saveWalletLocal(); pushWallet(); }        // aparelho + conta online
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
  // ---------------- contas online (nome + senha) ----------------
  // reset geral das contas antigas (nome/idade, moedas, compras e recordes deste aparelho): acontece uma vez
  const SESSION_KEY = "arena-zumbi-session", RESET_KEY = "arena-zumbi-reset-contas-1";
  try {
    if (!localStorage.getItem(RESET_KEY)) {
      for (const k of [WALLET_KEY, PROFILE_KEY, SESSION_KEY, "arena-zumbi-scores"]) localStorage.removeItem(k);
      localStorage.setItem(RESET_KEY, "1");
    }
  } catch (e) {}
  const API = /^(localhost|127\.)/.test(location.hostname) ? location.origin + "/api/" : "https://arena-zumbi.playes.workers.dev/api/";
  let session = null;                                                    // { name, token }
  try { const o = JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); if (o && o.token && o.name) session = { name: String(o.name).slice(0, 14), token: String(o.token), id: /^\d{6}$/.test(o.id || "") ? o.id : "" }; } catch (e) {}
  async function api(path, body) {
    const r = await fetch(API + path, { method: body ? "POST" : "GET", headers: Object.assign({ "content-type": "application/json" }, session ? { authorization: "Bearer " + session.token } : {}), body: body ? JSON.stringify(body) : undefined });
    let j = null; try { j = await r.json(); } catch (e) {}
    if (!j || r.status >= 500) { const err = new Error("offline"); throw err; }                 // servidor fora do ar: conta como sem internet
    if (!r.ok) { const err = new Error(j.error || "Erro " + r.status); err.status = r.status; throw err; }
    return j;
  }
  function applyServerWallet(str) {                                       // a conta manda: troca a carteira deste aparelho pela da conta
    const fresh = newWallet();
    for (const k in fresh) wallet[k] = fresh[k];
    try { localStorage.setItem(WALLET_KEY, str || ""); } catch (e) {}
    loadWallet(); sanitizeOwned(); saveWalletLocal();
  }
  // salva no aparelho na hora e manda para a conta logo depois (junta vários salvamentos seguidos)
  let pushT = 0, pushing = false, dirty = false;
  function pushWallet() {
    if (!session) return;
    dirty = true; clearTimeout(pushT);
    pushT = setTimeout(async () => {
      if (pushing || !session) return; pushing = true; dirty = false;
      try { const j = await api("save", { wallet: JSON.stringify(wallet) }); if (j && j.credit) gotCredit(j.credit); }
      catch (e) { dirty = true; if (e.status === 401) logout(true); else pushT = setTimeout(pushWallet, 15000); }   // sem internet: tenta de novo depois
      pushing = false;
    }, 1200);
  }
  window.addEventListener("online", () => { if (dirty) pushWallet(); });
  // moedas enviadas pelo administrador: chegam em até 1 minuto com o jogo aberto
  function gotCredit(c) {
    wallet.coins = Math.max(0, Math.min(9999999, wallet.coins + c)); if (c > 0) wallet.total += c;
    saveWalletLocal(); try { updateWho(); renderStore(); } catch (e) {}
    setTimeout(() => { try { feedLine((c > 0 ? "+" : "") + c.toLocaleString("pt-BR") + " MOEDAS NA SUA CONTA", c > 0); } catch (e) {} }, 300);
  }
  setInterval(() => {
    if (!session || pushing || (typeof navigator !== "undefined" && navigator.onLine === false)) return;
    api("sync", {}).then((j) => { if (j && j.credit) gotCredit(j.credit); }).catch((e) => { if (e.status === 401) logout(true); });
  }, 60000);
  loadWallet();
  sanitizeOwned();

  // ---------------- perfil ----------------
  const profile = { name: session ? session.name : "", id: session ? session.id : "" };
  function setId(id) {                                                  // id da conta (6 números): usado na loja de moedas
    profile.id = /^\d{6}$/.test(String(id || "")) ? String(id) : "";
    if (session) { session.id = profile.id; try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch (e) {} }
  }
  function updateWho() {
    const w = $("who");
    if (!profile.name) { w.hidden = true; return; }
    w.hidden = false;
    w.innerHTML = "<b>" + esc(profile.name) + "</b>" + (profile.id ? '<small class="accid" title="Use este id na loja de moedas">ID #' + profile.id + "</small>" : "") + '<button type="button" class="coinbtn" data-shop title="Comprar moedas"><span class="coin">' + wallet.coins + '</span><i>+ comprar</i></button><button type="button" class="linkbtn" id="btnLogout">' + (session ? "Sair da conta" : "Entrar numa conta") + "</button>";
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
  function gateError(msg) { gErr.textContent = msg; gErr.hidden = !msg; gErr.classList.remove("ok"); }
  function gateBusy(on, msg) {
    for (const b of gateForm.querySelectorAll("button")) b.disabled = on;
    if (msg) { gErr.textContent = msg; gErr.hidden = false; gErr.classList.add("ok"); }
  }
  function enter(name, offline) {
    profile.name = name; S.name = name; saveSettings();
    try { $("pname").value = name; } catch (e) {}
    gErr.hidden = true; gateBusy(false);
    setGate(false); updateWho(); renderStore(); renderCustom(); renderMission(); renderSummary();
    if (offline) setTimeout(() => { try { feedLine(session ? "SEM INTERNET · SEU PROGRESSO SERÁ SALVO DEPOIS" : "SEM CONTA · PROGRESSO SÓ NESTE APARELHO", false); } catch (e) {} }, 800);
    try { $("btnPlay").focus(); } catch (err) {}
  }
  function logout(expired) {
    if (session && !expired) api("logout", {}).catch(() => {});
    session = null; profile.name = ""; profile.id = ""; clearTimeout(pushT); dirty = false;
    try { localStorage.removeItem(SESSION_KEY); localStorage.removeItem(WALLET_KEY); } catch (e) {}
    applyServerWallet(""); updateWho(); setGate(true);
    $("gName").value = ""; $("gPass").value = "";
    gateError(expired ? "Sua sessão expirou. Entre de novo." : "");
    setTimeout(() => { try { $("gName").focus(); } catch (e) {} }, 60);
  }
  menuEl.addEventListener("click", (e) => {
    if (e.target && e.target.id === "btnLogout") logout(false);
    if (e.target && e.target.closest && e.target.closest("[data-shop]")) openShop();
  });
  // loja de moedas (site do dono do jogo): abre fora do jogo
  const SHOP_URL = "https://arenazumbi.zpaysolution.shop/";
  function openShop() {
    try { if (window.AZ && window.AZ.openUrl) { window.AZ.openUrl(SHOP_URL); return; } } catch (e) {}   // app de Android
    try { window.open(SHOP_URL, "_blank", "noopener"); } catch (e) {}                                     // navegador e .exe
  }
  // trailer do anúncio no YouTube (aba Missão): contagem até a estreia, depois abre o vídeo no idioma do jogador
  const TRAILER = {
    at: Date.UTC(2026, 10, 11, 3, 0, 0),          // 11/11/2026 00:00 (Brasília)
    until: Date.UTC(2026, 11, 11, 3, 0, 0),       // some sozinho depois de 30 dias
    url: { pt: "https://www.youtube.com/watch?v=jyKgJZaT3Ls", en: "https://www.youtube.com/watch?v=zW4c2PTEHK0", es: "https://www.youtube.com/watch?v=HG1USUQsbPw" },   // links dos vídeos
    channel: "",                                  // canal: usado se faltar o vídeo do idioma
  };
  const trailerEl = $("trailer");
  $("trailerThumb").style.backgroundImage = "url(data:image/jpeg;base64,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)";
  function trailerUrl() { const l = (window.I18N && I18N.get()) || "pt"; return TRAILER.url[l] || TRAILER.url.en || TRAILER.url.pt || TRAILER.channel || ""; }
  function openUrl(u) {
    if (!/^https:\/\//.test(u)) return;
    try { if (window.AZ && window.AZ.openUrl) { window.AZ.openUrl(u); return; } } catch (e) {}
    try { window.open(u, "_blank", "noopener"); } catch (e) {}
  }
  function trailerTick() {
    const now = Date.now(), url = trailerUrl(), pre = now < TRAILER.at;
    const show = now < TRAILER.until && (pre || !!url);
    if (trailerEl.hidden === show) trailerEl.hidden = !show;
    if (!show) return;
    trailerEl.classList.toggle("live", !!url);
    const l = (window.I18N && I18N.get()) || "pt", kick = $("trailerKick").firstChild;
    const k = pre ? "Estreia do trailer" : "Novo trailer";
    if (kick && $("trailerKick").dataset.k !== k) { $("trailerKick").dataset.k = k; kick.nodeValue = k; }
    let sub;
    if (pre) {
      const s = Math.max(0, Math.floor((TRAILER.at - now) / 1000)), d = Math.floor(s / 86400), hh = String(Math.floor((s % 86400) / 3600)).padStart(2, "0"), mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0"), ss = String(s % 60).padStart(2, "0");
      const left = (d ? d + "d " : "") + hh + ":" + mm + ":" + ss;
      let when = "";
      try { when = new Date(TRAILER.at).toLocaleString(l === "pt" ? "pt-BR" : l, { day: "2-digit", month: l === "en" ? "short" : "2-digit", hour: "2-digit", minute: "2-digit" }); } catch (e) {}
      sub = l === "en" ? "Premieres " + when + " · " + left + " left" : l === "es" ? "Estreno " + when + " · faltan " + left : "Estreia " + when + " · faltam " + left;
    } else sub = l === "en" ? "Watch on YouTube ▶" : l === "es" ? "Míralo en YouTube ▶" : "Assista no YouTube ▶";
    const subEl = $("trailerSub"); if (subEl.textContent !== sub) subEl.textContent = sub;
    trailerEl.title = url ? "YouTube" : "";
  }
  function trailerGo() { trailerTick(); const u = trailerUrl(); if (u) openUrl(u); }
  trailerEl.addEventListener("click", trailerGo);
  trailerEl.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); trailerGo(); } });
  trailerTick();
  setInterval(() => { if (menuEl.offsetParent !== null) trailerTick(); }, 1000);
  async function doAuth(kind) {
    const name = $("gName").value.replace(/\s+/g, " ").trim(), pass = $("gPass").value;
    if (name.length < 2) { gateError("Digite seu nome (pelo menos 2 letras)."); $("gName").focus(); return; }
    if (pass.length < 4) { gateError("A senha precisa ter pelo menos 4 caracteres."); $("gPass").focus(); return; }
    gateBusy(true, kind === "register" ? "Criando conta..." : "Entrando...");
    try {
      const j = await api(kind, { name, pass });
      session = { name: j.name, token: j.token, id: "" };
      setId(j.id);
      applyServerWallet(j.wallet || "");
      if (kind === "register") pushWallet();
      $("gPass").value = "";
      enter(j.name, false);
    } catch (e) {
      gateBusy(false);
      gateError(e.status ? e.message : "Sem conexão com o servidor. Tente de novo ou jogue sem internet (o progresso fica só neste aparelho).");
      $("btnOffline").hidden = !!e.status;
    }
  }
  $("btnOffline").addEventListener("click", () => {                  // sem internet: joga com o progresso deste aparelho
    const name = $("gName").value.replace(/\s+/g, " ").trim().slice(0, 14) || "Sobrevivente";
    session = null; profile.id = ""; $("btnOffline").hidden = true; enter(name, true);
  });
  gateForm.addEventListener("submit", (e) => { e.preventDefault(); doAuth("login"); });
  $("btnRegister").addEventListener("click", () => doAuth("register"));
  // já tem sessão: entra direto com o progresso da conta (sem internet, usa o que está salvo no aparelho)
  if (session) {
    $("gName").value = session.name; gateBusy(true, "Entrando como " + session.name + "...");
    api("me").then((j) => { setId(j.id); applyServerWallet(j.wallet || ""); enter(j.name, false); })
      .catch((e) => { if (e.status === 401) logout(true); else enter(session.name, true); });
  } else setTimeout(() => { try { $("gName").focus(); } catch (e) {} }, 60);

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
