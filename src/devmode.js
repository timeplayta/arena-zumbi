  // ======================================================================
  //  ZUMBI DEVELOPER: laboratório para desenvolvedores (só no APK "Zumbi Developer", window.AZ_DEV)
  //  Mapa livre, sem ondas. Lupa (canto superior direito): lista de zumbis para invocar, com busca embaixo.
  //  Chat (canto superior esquerdo): comandos em português, ex.: "corra zumbi soldado 1", "corram todos os zumbis",
  //  "tire o braço esquerdo do soldado 1", "anime o lenhador 1 rugir", "vida infinita", "ver zumbi noiva 1".
  // ======================================================================
  const DevMode = (function () {
    const ON = !!(typeof window !== "undefined" && window.AZ_DEV);
    // catálogo da lupa: tipo de zumbi + aparência
    const CAT = [
      ["operario", "Operário", "walker", "operario"], ["executivo", "Executivo", "walker", "executivo"], ["policial", "Policial", "walker", "policial"],
      ["enfermeira", "Enfermeira", "walker", "enfermeira"], ["medico", "Médico", "walker", "medico"], ["adolescente", "Adolescente", "walker", "adolescente"],
      ["mulher", "Mulher", "walker", "mulher"], ["idosa", "Idosa", "walker", "idosa"], ["mendigo", "Mendigo", "walker", "mendigo"],
      ["soldado", "Soldado (militar)", "walker", "soldado"], ["bombeiro", "Bombeiro", "walker", "bombeiro"], ["presidiario", "Presidiário", "walker", "presidiario"],
      ["turista", "Turista", "walker", "turista"], ["noiva", "Noiva", "walker", "noiva"],
      ["corredora", "Corredora (rápida)", "runner", "corredora"], ["paciente", "Paciente (rápido)", "runner", "paciente"], ["atleta", "Atleta (rápido)", "runner", "atleta"],
      ["acougueiro", "Açougueiro (brutamontes)", "brute", "acougueiro"], ["motoqueiro", "Motoqueiro (brutamontes)", "brute", "motoqueiro"],
      ["gigante", "Gigante", "giant", "acougueiro"], ["colosso", "Colosso Blindado", "tank", null], ["samurai", "Mestre da Katana", "samurai", null],
      ["espectro", "O Espectro", "wraith", null], ["lenhador", "O Lenhador", "lumber", null],
    ].map(([id, name, kind, arch]) => ({ id, name, kind, arch }));
    const KIND_SUB = { walker: "Comum", runner: "Corredor", brute: "Brutamontes", giant: "Gigante", tank: "Chefe", samurai: "Chefe", wraith: "Chefe", lumber: "Chefe" };
    const ANIMS = { andar: "walk", ande: "walk", correr: "run", corra: "run", atacar: "attack", ataque: "attack", rastejar: "crawl", rasteje: "crawl", rugir: "roar", ruja: "roar", grite: "roar", gritar: "roar",
      dancar: "dance", danca: "dance", dance: "dance", apanhar: "hit", tiro: "hit", parado: "idle", respirar: "idle", morrer: "die", morra: "die" };
    const PARTS = [["antebraco esquerdo", "foreL"], ["antebraco direito", "foreR"], ["braco esquerdo", "armL"], ["braco direito", "armR"], ["bracos", "arms"], ["perna esquerda", "legL"], ["perna direita", "legR"], ["pernas", "legs"], ["cabeca", "head"]];
    let ui = null, panel = null, inspect = null, labelsOn = true, slow = 1, sel = null, counter = {}, log = [];
    const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
    const g = () => game;
    const live = () => (g() ? g().zombies.filter((z) => z.devName) : []);

    // ---------- lógica: o que cada zumbi faz quando recebe um comando ----------
    const GP = Logic.Game.prototype;
    GP.devAI = function (z, dt, base) {
      const D = z.dev; if (!D) return false;
      const dx = this.px - z.x, dy = this.py - z.y, dist = Math.hypot(dx, dy) || 1e-6;
      const noLegs = z.cut && (z.cut.legL || z.cut.legR);
      const move = (tx, ty, spd, stop) => {
        const ex = tx - z.x, ey = ty - z.y, d = Math.hypot(ex, ey) || 1e-6;
        this.turnToward(z, tx, ty, 7, dt);
        if (d > (stop || 0.3)) this.stepZ(z, ex / d, ey / d, noLegs ? Math.min(spd, 0.6) : spd, dt);
        z.phase += dt * ((noLegs ? 0.6 : spd) * 2.4 + 1); return d;
      };
      z.runner = D.cmd === "run" || (D.cmd === "anim" && D.anim === "run") ? true : !!z.runner0;
      z.state = "walk";
      switch (D.cmd) {
        case "attack": return false;                                       // ataca de verdade (a IA normal do tipo)
        case "idle": z.phase += dt * 0.25; return true;
        case "walk": move(this.px, this.py, 1.25, 1.6); return true;
        case "run": move(this.px, this.py, 4.2, 1.8); return true;
        case "follow": if (dist > 2.6) move(this.px, this.py, dist > 7 ? 4 : 1.4, 2.4); else { this.turnToward(z, this.px, this.py, 5, dt); z.phase += dt * 0.25; } return true;
        case "flee": move(z.x - dx / dist * 5, z.y - dy / dist * 5, 3.2, 0.1); return true;
        case "anim": {
          const a = D.anim;
          if (a === "walk") z.phase += dt * 4; else if (a === "run") z.phase += dt * 10;
          else if (a === "attack") { z.state = "attack"; z.attackT += dt; }
          else z.phase += dt * (a === "dance" ? 5 : a === "crawl" ? 2.2 : 0.4);
          if (a === "hit" && z.hitT <= 0.02) { z.hitT = 0.25; z.stagger = 0.3; }
          return true;
        }
      }
      return false;
    };

    // ---------- comandos ----------
    function say(t, who) { log.push({ t, who: who || "dev" }); if (log.length > 80) log.shift(); renderLog(); }
    function findTargets(n) {
      const all = live().filter((z) => z.state !== "dead" || /levant|reviv|ressusc|apag|delet|exclu|remov|vida/.test(n));
      if (/\btodos\b|\btodas\b|\bcorram\b|\bandem\b|\bparem\b|\bsigam\b|\bataquem\b|\bfujam\b|\bmorram\b|\bdancem\b|\brugam\b|\bvenham\b/.test(n)) return all;
      let best = null;
      for (const z of all) { const k = norm(z.devName); if ((" " + n + " ").includes(" " + k + " ") || n.includes(k.replace(" ", ""))) if (!best || k.length > norm(best.devName).length) best = z; }
      if (!best) for (const z of all) { const k = norm(z.devName).split(" ")[0]; if (new RegExp("\\b" + k + "\\b").test(n)) { best = z; break; } }   // "o soldado" = o primeiro soldado
      if (best) { sel = best.id; return [best]; }
      const s = all.find((z) => z.id === sel); return s ? [s] : [];
    }
    function setCmd(list, cmd, anim) {
      for (const z of list) { if (z.runner0 === undefined) z.runner0 = !!z.runner; if (cmd === "normal") { delete z.dev; z.runner = z.runner0; } else z.dev = { cmd, anim }; if (z.wraith) { z.vis = 1; z.untouch = false; } }
    }
    function spawnFrom(c, n) {
      const G = g(); if (!G) return [];
      const out = [];
      for (let i = 0; i < n; i++) {
        const a = G.yaw + (i - (n - 1) / 2) * 0.35, d = c.kind === "giant" || c.kind === "lumber" ? 9 : 6;
        let x = G.px - Math.sin(a) * d, y = G.py + Math.cos(a) * d;
        [x, y] = Logic.pushOut(x, y, 0.6);
        let z;
        if (["tank", "samurai", "wraith", "lumber"].includes(c.kind)) { G.spawnElite(c.kind, x, y); z = G.zombies[G.zombies.length - 1]; z.x = x; z.y = y; G.bannerT = 0; }
        else {
          const hp = { walker: 100, runner: 60, brute: 350, giant: 1100 }[c.kind] * (G.diff.hp || 1), sp = c.kind === "runner" ? 3.6 : c.kind === "brute" ? 1.2 : c.kind === "giant" ? 1.3 : 1.5;
          z = new Logic.Zombie(x, y, hp, sp, c.kind, G.randint(3), G, c.kind === "giant" ? 3 : c.kind === "brute" ? 2.2 : 1);
          G.zombies.push(z);
        }
        z.arch = c.arch; counter[c.id] = (counter[c.id] || 0) + 1; z.devName = c.id + " " + counter[c.id];
        z.yaw = Math.atan2(-(G.px - z.x), G.py - z.y); z.runner0 = !!z.runner; z.dev = { cmd: "idle" }; z.cut = {};
        if (z.wraith) { z.vis = 1; z.untouch = false; }
        sel = z.id; out.push(z);
      }
      return out;
    }
    function cutParts(list, n) {
      const found = []; let t = n;
      for (const [k, id] of PARTS) if (t.includes(k)) { found.push(id); t = t.replace(k, ""); }
      if (/\bbraco\b/.test(t) && !found.some((f) => f.startsWith("arm") || f === "arms" || f.startsWith("fore"))) found.push("armL");
      if (/\bperna\b/.test(t) && !found.some((f) => f.startsWith("leg"))) found.push("legL");
      const ids = []; for (const f of found) ids.push(...(f === "arms" ? ["armL", "armR"] : f === "legs" ? ["legL", "legR"] : [f]));
      if (!ids.length) return say("Qual parte? braço esquerdo/direito, antebraço, perna esquerda/direita, pernas, cabeça.");
      const G = g();
      for (const z of list) {
        z.cut = z.cut || {};
        for (const p of ids) z.cut[p] = true;
        if (z.cut.head && z.state !== "dead") { z.headGone = true; z.hp = 0; z.state = "dead"; z.deadT = 0; z.fall = 0; G.events.push(["dev_cut", z.id, "head"]); }
        else G.events.push(["dev_cut", z.id, ids[0]]);
      }
      say("Cortei " + ids.map((p) => ({ armL: "braço esquerdo", armR: "braço direito", foreL: "antebraço esquerdo", foreR: "antebraço direito", legL: "perna esquerda", legR: "perna direita", head: "cabeça" })[p]).join(", ") + " de " + list.map((z) => z.devName).join(", ") + ".");
    }
    const HELP = [
      "COMANDOS (escreva como quiser, sem acento serve):",
      "• invoque soldado 3 · crie lenhador · chame gigante (ou use a lupa 🔍)",
      "• corra zumbi soldado 1 · corram todos os zumbis · ande · siga eu · fuja · pare · ataque",
      "• anime noiva 1 rastejar · rugir · dançar · andar · correr · atacar · apanhar · parado",
      "• tire o braço esquerdo do soldado 1 · arranque a cabeça · corte as pernas · antebraço direito",
      "• restaure o soldado 1 (devolve as partes) · morra · levante · apague o soldado 1 · apague todos",
      "• ver zumbi lenhador 1 (câmera gira em volta; arraste para girar) · sair da visão",
      "• vida infinita · munição infinita (escreva 'desligar' para tirar) · câmera lenta · velocidade normal · congelar tudo",
      "• nomes (mostra/esconde os nomes) · volte ao normal (o zumbi age sozinho) · limpar chat · ajuda",
    ];
    function run(text) {
      const raw = String(text || "").trim(); if (!raw) return;
      say(raw, "me");
      const n = norm(raw), G = g();
      if (!G || G.gm !== "dev") return say("Entre no laboratório primeiro.");
      const off = /\b(desligar|desliga|desative|sem|tirar|tire a|nao)\b/.test(n);
      if (/^(ajuda|comandos|help|\?)/.test(n)) return HELP.forEach((h) => say(h));
      if (/limpar chat|limpe o chat|limpa chat/.test(n)) { log = []; return renderLog(); }
      if (/vida infinita|imortal|modo deus|\bdeus\b/.test(n)) { G.god = !off; return say("Vida infinita " + (G.god ? "LIGADA." : "desligada.")); }
      if (/municao infinita|bala infinita|balas infinitas/.test(n)) { G.devAmmo = !off; return say("Munição infinita " + (G.devAmmo ? "LIGADA." : "desligada.")); }
      if (/camera lenta|camara lenta|devagar|lento/.test(n)) { slow = /muito/.test(n) ? 0.1 : 0.3; return say("Câmera lenta (" + slow + "x)."); }
      if (/velocidade normal|tempo normal|descongel/.test(n)) { slow = 1; return say("Velocidade normal."); }
      if (/congel(ar|e) tudo|pausar tudo|parar o tempo/.test(n)) { slow = 0; return say("Tempo congelado. Escreva 'velocidade normal' para voltar."); }
      if (/^nomes?\b|mostrar nomes|esconder nomes/.test(n)) { labelsOn = /esconder/.test(n) ? false : /mostrar/.test(n) ? true : !labelsOn; return say("Nomes " + (labelsOn ? "visíveis." : "escondidos.")); }
      if (/sair da visao|sair da camera|parar de ver|voltar a camera|volte a camera|minha camera/.test(n)) { inspect = null; return say("Câmera de volta com você."); }
      // invocar
      if (/\b(invoc|invoque|invocar|crie|criar|cria|chame|chamar|spawn|summon|coloque|colocar|traga|trazer|gere|gerar|sumone|sumonar)/.test(n)) {
        const c = CAT.find((q) => n.includes(norm(q.id))) || CAT.find((q) => norm(q.name).split(" ").some((w) => w.length > 3 && n.includes(w)))
          || (/\bcorredor/.test(n) ? CAT[14] : /\bbrut/.test(n) ? CAT[17] : /\bmilitar\b/.test(n) ? CAT[9] : /\bkatana\b/.test(n) ? CAT[21] : /\bzumbi\b/.test(n) ? CAT[0] : null);
        if (!c) return say("Não achei esse zumbi. Abra a lupa 🔍 para ver a lista.");
        const m = n.match(/\b(\d+)\b/), q = Math.max(1, Math.min(12, m ? +m[1] : /\bdois\b/.test(n) ? 2 : /\btres\b/.test(n) ? 3 : 1));
        const zs = spawnFrom(c, q); return say("Invoquei " + zs.map((z) => z.devName).join(", ") + ".");
      }
      const list = findTargets(n);
      if (/\b(ver|veja|olhe|olhar|inspecion|focar|foque|camera no|mostre)\b/.test(n) && !/nomes/.test(n)) {
        if (!list.length) return say("Qual zumbi? Ex.: ver zumbi soldado 1.");
        inspect = list[0].id; return say("Olhando " + list[0].devName + ". Arraste para girar. Escreva 'sair da visão' para voltar.");
      }
      if (/\b(apag|apague|apaguem|delet|exclu|exclua|remova|remover|sumir|suma|sumam)\b/.test(n) && !PARTS.some(([k]) => n.includes(k)) && !/\b(braco|perna)\b/.test(n)) {
        const L2 = /\btodos\b/.test(n) ? live() : list; if (!L2.length) return say("Qual zumbi?");
        const ids = new Set(L2.map((z) => z.id)); G.zombies = G.zombies.filter((z) => !ids.has(z.id)); if (ids.has(inspect)) inspect = null;
        return say("Apaguei " + L2.length + " zumbi(s).");
      }
      if (!list.length) return say(live().length ? "Não entendi para qual zumbi. Use o nome (ex.: soldado 1) ou 'todos'." : "Não há zumbis. Invoque um: 'invoque soldado' ou use a lupa 🔍.");
      const who = list.length > 1 ? "todos (" + list.length + ")" : list[0].devName;
      if (/\b(tir|tire|tirar|arranc|arranque|arrancar|cort|corte|cortar|remov|remova|decep|decepe|quebre)/.test(n) && (PARTS.some(([k]) => n.includes(k)) || /\b(braco|perna)\b/.test(n))) return cutParts(list, n);
      if (/\b(restaur|restaure|consert|conserte|recoloq|recoloque|cure|curar)/.test(n)) { for (const z of list) { z.cut = {}; z.headGone = false; } return say("Partes de volta: " + who + "."); }
      if (/\b(levant|levante|levantem|reviv|reviva|revivam|ressusc)/.test(n)) { for (const z of list) { if (z.state === "dead") { z.state = "walk"; z.deadT = 0; z.fall = 0; z.hp = z.maxHp; z.headGone = false; if (z.cut) z.cut.head = false; } } setCmd(list, "idle"); return say("De pé: " + who + "."); }
      if (/\b(morr|morra|morram|mate|matar|mata)\b/.test(n)) { for (const z of list) if (z.state !== "dead") { z.hp = 0; z.state = "dead"; z.deadT = 0; z.fall = 0; } return say("Morreu: " + who + ". Escreva 'levante' para trazer de volta."); }
      if (/\b(anim|animacao|animar|faca a animacao|faca)\b/.test(n) || Object.keys(ANIMS).some((k) => new RegExp("\\b" + k + "\\b").test(n) && /\b(rastej|rug|ruja|danc|apanh|grit)/.test(k))) {
        const k = Object.keys(ANIMS).find((q) => new RegExp("\\b" + q + "\\b").test(n));
        if (!k) return say("Qual animação? andar, correr, atacar, rastejar, rugir, dançar, apanhar, parado, morrer.");
        if (ANIMS[k] === "die") { for (const z of list) if (z.state !== "dead") { z.hp = 0; z.state = "dead"; z.deadT = 0; z.fall = 0; } return say("Animação de morte: " + who + "."); }
        setCmd(list, "anim", ANIMS[k]); return say("Animação '" + k + "' em " + who + ".");
      }
      if (/\b(corr|corra|corram|correr|corre)\b/.test(n)) { setCmd(list, "run"); return say("Correndo até você: " + who + "."); }
      if (/\b(and|ande|andem|andar|caminh|caminhe|caminhem|venha|venham|vem)\b/.test(n)) { setCmd(list, "walk"); return say("Andando até você: " + who + "."); }
      if (/\b(sig|siga|sigam|seguir|segue)\b/.test(n)) { setCmd(list, "follow"); return say("Seguindo você: " + who + "."); }
      if (/\b(fuj|fuja|fujam|fugir|corra de mim)\b/.test(n)) { setCmd(list, "flee"); return say("Fugindo: " + who + "."); }
      if (/\b(atac|ataque|ataquem|atacar|morda|mordam|lute|lutem)\b/.test(n)) { setCmd(list, "attack"); return say("Atacando você: " + who + "."); }
      if (/\b(normal|sozinho|livre|ia)\b/.test(n)) { setCmd(list, "normal"); return say("Agindo sozinho (IA normal): " + who + "."); }
      if (/\b(par|pare|parem|parar|fique|fiquem|espere|esperem|stop)\b/.test(n)) { setCmd(list, "idle"); return say("Parado: " + who + "."); }
      say("Não entendi. Escreva 'ajuda' para ver os comandos.");
    }

    // ---------- tela: chat (esquerda), lupa (direita), nomes e câmera de inspeção ----------
    function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
    function build() {
      if (ui) return ui;
      const css = el("style"); css.textContent = `
#devUi { position: fixed; inset: 0; pointer-events: none; z-index: 60; font-family: "Barlow Condensed", "Arial Narrow", sans-serif; color: #e8ecf2; }
#devUi .dv-btn { position: absolute; top: 10px; width: 52px; height: 52px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.28); background: rgba(10,14,20,0.72); color: #fff; font-size: 24px; pointer-events: auto; display: grid; place-items: center; cursor: pointer; }
#devUi .dv-btn.on { border-color: #ffb24a; box-shadow: 0 0 0 2px rgba(255,178,74,0.35); }
#devUi .dv-chatb { left: 10px; } #devUi .dv-findb { right: 10px; }
#devUi .dv-tag { position: absolute; top: 16px; left: 72px; font-size: 15px; letter-spacing: 0.08em; color: #ffb24a; text-shadow: 0 1px 2px #000; }
#devUi .dv-panel { position: absolute; top: 70px; width: min(420px, 46vw); max-height: calc(100vh - 90px); display: flex; flex-direction: column; background: rgba(8,11,16,0.9); border: 1px solid rgba(255,255,255,0.18); border-radius: 12px; pointer-events: auto; overflow: hidden; }
#devUi .dv-chat { left: 10px; } #devUi .dv-find { right: 10px; }
#devUi .dv-log { flex: 1; overflow-y: auto; padding: 10px 12px; font-size: 16px; line-height: 1.3; min-height: 120px; max-height: 46vh; -webkit-overflow-scrolling: touch; }
#devUi .dv-log p { margin: 0 0 6px; } #devUi .dv-log .me { color: #9fd0ff; } #devUi .dv-log .me::before { content: "› "; }
#devUi .dv-row { display: flex; gap: 6px; padding: 8px; border-top: 1px solid rgba(255,255,255,0.12); }
#devUi input { flex: 1; min-width: 0; font: 600 17px/1.2 "Barlow Condensed", sans-serif; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.25); background: #0b0f15; color: #fff; }
#devUi .dv-send { padding: 0 14px; border-radius: 8px; border: 0; background: #ffb24a; color: #1a1006; font: 700 16px "Barlow Condensed", sans-serif; }
#devUi .dv-list { flex: 1; overflow-y: auto; max-height: calc(100vh - 170px); -webkit-overflow-scrolling: touch; }
#devUi .dv-h { padding: 8px 12px 4px; font-size: 13px; letter-spacing: 0.1em; color: #ffb24a; }
#devUi .dv-it { display: flex; justify-content: space-between; align-items: center; width: 100%; text-align: left; padding: 11px 12px; border: 0; border-bottom: 1px solid rgba(255,255,255,0.07); background: transparent; color: #e8ecf2; font: 600 18px "Barlow Condensed", sans-serif; cursor: pointer; }
#devUi .dv-it span { font-size: 13px; color: #9aa3ad; font-weight: 500; } #devUi .dv-it:active, #devUi .dv-it:hover { background: rgba(255,178,74,0.12); }
#devUi .dv-it.sel { background: rgba(255,178,74,0.18); }
#devUi .dv-acts { display: flex; flex-wrap: wrap; gap: 6px; padding: 6px 10px 10px; }
#devUi .dv-acts button { padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.22); background: rgba(255,255,255,0.06); color: #e8ecf2; font: 600 14px "Barlow Condensed", sans-serif; }
#devLabels { position: fixed; inset: 0; pointer-events: none; z-index: 55; }
#devLabels b { position: absolute; transform: translate(-50%, -100%); font: 700 14px "Barlow Condensed", sans-serif; color: #fff; background: rgba(0,0,0,0.55); padding: 1px 6px; border-radius: 4px; white-space: nowrap; letter-spacing: 0.04em; }
#devLabels b.sel { color: #1a1006; background: #ffb24a; }
#hud.dev .stats, #hud.dev .radar-box, #hud.dev #boss { display: none !important; }
`;
      document.head.appendChild(css);
      ui = el("div"); ui.id = "devUi"; ui.hidden = true; ui.setAttribute("translate", "no");
      ui.innerHTML = `<button type="button" class="dv-btn dv-chatb" aria-label="Chat de comandos">💬</button><div class="dv-tag">ZUMBI DEVELOPER</div><button type="button" class="dv-btn dv-findb" aria-label="Procurar zumbis">🔍</button>
<div class="dv-panel dv-chat" hidden><div class="dv-log"></div><form class="dv-row"><input type="text" placeholder="corra zumbi soldado 1" autocomplete="off" autocapitalize="off" enterkeyhint="send"><button class="dv-send" type="submit">ENVIAR</button></form></div>
<div class="dv-panel dv-find" hidden><div class="dv-list"></div><div class="dv-row"><input type="search" placeholder="Pesquisar zumbi…" autocomplete="off" autocapitalize="off"></div></div>`;
      document.body.appendChild(ui);
      const lab = el("div"); lab.id = "devLabels"; lab.hidden = true; document.body.appendChild(lab);
      const stop = (e) => e.stopPropagation();
      ["pointerdown", "touchstart", "mousedown", "wheel"].forEach((t) => ui.addEventListener(t, stop, { passive: true }));
      ui.querySelector(".dv-chatb").onclick = () => toggle("chat");
      ui.querySelector(".dv-findb").onclick = () => toggle("find");
      const form = ui.querySelector(".dv-chat form"), inp = form.querySelector("input");
      form.onsubmit = (e) => { e.preventDefault(); const t = inp.value; inp.value = ""; run(t); renderList(); };
      ui.querySelector(".dv-find input").oninput = () => renderList();
      ui.querySelector(".dv-list").onclick = (e) => {
        const b = e.target.closest("button"); if (!b) return;
        if (b.dataset.cat) { const c = CAT.find((q) => q.id === b.dataset.cat); const zs = spawnFrom(c, 1); say("Invoquei " + zs.map((z) => z.devName).join(", ") + "."); renderList(); }
        else if (b.dataset.z) { sel = +b.dataset.z; renderList(); }
        else if (b.dataset.do) { const z = live().find((q) => q.id === sel); if (z) { run(b.dataset.do + " " + z.devName); renderList(); } }
      };
      HELP.slice(0, 3).forEach((h) => log.push({ t: h, who: "dev" }));
      return ui;
    }
    function toggle(p) {
      panel = panel === p ? null : p; build();
      ui.querySelector(".dv-chat").hidden = panel !== "chat"; ui.querySelector(".dv-find").hidden = panel !== "find";
      ui.querySelector(".dv-chatb").classList.toggle("on", panel === "chat"); ui.querySelector(".dv-findb").classList.toggle("on", panel === "find");
      if (panel) { try { document.exitPointerLock(); } catch (e) {} }
      if (panel === "chat") { renderLog(); if (!("ontouchstart" in window)) setTimeout(() => ui.querySelector(".dv-chat input").focus(), 30); }
      if (panel === "find") renderList();
    }
    function renderLog() {
      if (!ui || panel !== "chat") return;
      const box = ui.querySelector(".dv-log"); box.innerHTML = "";
      for (const m of log) { const p = el("p", m.who === "me" ? "me" : ""); p.textContent = m.t; box.appendChild(p); }
      box.scrollTop = box.scrollHeight;
    }
    function renderList() {
      if (!ui || panel !== "find") return;
      const q = norm(ui.querySelector(".dv-find input").value), box = ui.querySelector(".dv-list");
      const zs = live().filter((z) => !q || norm(z.devName).includes(q)), cs = CAT.filter((c) => !q || norm(c.name + " " + c.id + " " + KIND_SUB[c.kind]).includes(q));
      let h = "";
      if (zs.length) {
        h += '<div class="dv-h">NO MAPA (toque para escolher)</div>' + zs.map((z) => '<button type="button" class="dv-it' + (z.id === sel ? " sel" : "") + '" data-z="' + z.id + '">' + z.devName + "<span>" + (z.state === "dead" ? "morto" : z.dev ? ({ idle: "parado", walk: "andando", run: "correndo", follow: "seguindo", flee: "fugindo", attack: "atacando", anim: "animação: " + z.dev.anim })[z.dev.cmd] : "IA normal") + "</span></button>").join("");
        const s = zs.find((z) => z.id === sel);
        if (s) h += '<div class="dv-acts">' + [["corra", "Correr"], ["ande", "Andar"], ["siga", "Seguir"], ["pare", "Parar"], ["ataque", "Atacar"], ["anime rastejar", "Rastejar"], ["anime rugir", "Rugir"], ["anime dancar", "Dançar"], ["tire o braco esquerdo", "− Braço E"], ["tire o braco direito", "− Braço D"], ["tire a perna esquerda", "− Perna E"], ["tire a cabeca", "− Cabeça"], ["restaure", "Restaurar"], ["morra", "Morrer"], ["levante", "Levantar"], ["ver", "Ver de perto"], ["apague", "Apagar"]].map(([c, t]) => '<button type="button" data-do="' + c + '">' + t + "</button>").join("") + "</div>";
      }
      h += '<div class="dv-h">INVOCAR (toque para criar na sua frente)</div>' + cs.map((c) => '<button type="button" class="dv-it" data-cat="' + c.id + '">' + c.name + "<span>" + KIND_SUB[c.kind] + "</span></button>").join("");
      if (!zs.length && !cs.length) h = '<div class="dv-h">Nada com "' + q + '"</div>';
      box.innerHTML = h;
    }
    // ---------- poses extras (rastejar, rugir, dançar) e partes cortadas, depois da animação normal ----------
    const stumpMat = new THREE.MeshLambertMaterial({ color: 0x6a0808, emissive: 0x200000 }), stumpGeo = new THREE.SphereGeometry(1, 10, 8);
    function stump(v, node, r) {
      v.stumps = v.stumps || {}; const k = node.uuid; if (v.stumps[k]) return v.stumps[k];
      const s = new THREE.Mesh(stumpGeo, stumpMat); s.scale.setScalar(r); s.position.copy(node.position); node.parent.add(s); v.stumps[k] = s; return s;
    }
    function pose(v, z) {
      if (!v || !v.sL || !z.devName) return;
      const c = z.cut || {}, t = performance.now() / 1000 + z.id;
      const legless = c.legL || c.legR, anim = z.dev && z.dev.cmd === "anim" ? z.dev.anim : null;
      if (z.state !== "dead") {
        if (anim === "crawl" || legless) {                                    // rastejando: corpo deitado, braços puxando
          const r = v.root, ph = z.phase;
          r.rotation.x = 1.32; r.position.y = 0.2 * (z.s || 1);
          v.spine.rotation.set(-0.25, 0, Math.sin(ph) * 0.08);
          v.sL.rotation.set(2.5 + Math.sin(ph) * 0.6, 0, -0.25); v.sR.rotation.set(2.5 - Math.sin(ph) * 0.6, 0, 0.25);
          v.eL.rotation.x = 0.5 + Math.max(0, Math.cos(ph)) * 0.7; v.eR.rotation.x = 0.5 + Math.max(0, -Math.cos(ph)) * 0.7;
          v.hL.rotation.x = 0.1 + Math.sin(ph) * 0.1; v.hR.rotation.x = 0.1 - Math.sin(ph) * 0.1; v.kL.rotation.x = v.kR.rotation.x = -0.2;
          v.head.rotation.set(-0.9, Math.sin(ph * 0.5) * 0.2, 0);
        } else if (anim === "roar") {
          const k = 0.5 + 0.5 * Math.sin(t * 2.2);
          v.spine.rotation.set(0.35 * k, 0, 0); v.head.rotation.set(-0.6 * k, 0, 0); if (v.setJaw) v.setJaw(0.25 + 0.7 * k);
          v.sL.rotation.set(0.6, 0, -1.1 * k - 0.2); v.sR.rotation.set(0.6, 0, 1.1 * k + 0.2); v.eL.rotation.x = v.eR.rotation.x = 0.6;
        } else if (anim === "dance") {
          const ph = t * 4;
          v.root.rotation.z = Math.sin(ph) * 0.12; v.spine.rotation.set(0, Math.sin(ph * 0.5) * 0.4, Math.sin(ph) * 0.15);
          v.sL.rotation.set(2.6 + Math.sin(ph) * 0.4, 0, -0.4); v.sR.rotation.set(2.6 - Math.sin(ph) * 0.4, 0, 0.4); v.eL.rotation.x = v.eR.rotation.x = 0.9 + Math.sin(ph * 2) * 0.3;
          v.hL.rotation.x = Math.max(0, Math.sin(ph)) * 0.5; v.hR.rotation.x = Math.max(0, -Math.sin(ph)) * 0.5; v.kL.rotation.x = -Math.max(0, Math.sin(ph)) * 0.8; v.kR.rotation.x = -Math.max(0, -Math.sin(ph)) * 0.8;
          v.head.rotation.set(0.1, 0, Math.sin(ph) * 0.25);
        } else if (anim === "hit") { v.spine.rotation.x += 0.35 * Math.max(0, Math.sin(t * 6)); v.head.rotation.x += 0.4 * Math.max(0, Math.sin(t * 6)); }
      }
      // partes cortadas: some o osso e aparece o toco
      const P = [["armL", v.sL, 0.075], ["armR", v.sR, 0.075], ["foreL", v.eL, 0.06], ["foreR", v.eR, 0.06], ["legL", v.hL, 0.09], ["legR", v.hR, 0.09], ["head", v.head, 0.09]];
      for (const [k, node, r] of P) {
        if (!node) continue;
        const off = !!c[k] || (k === "head" && z.headGone);
        if (off || node.visible === false || (v.stumps && v.stumps[node.uuid])) { node.visible = !off; stump(v, node, r).visible = off; }
      }
    }
    // ---------- por quadro ----------
    let labEls = new Map();
    function frame(dt) {
      if (!ON || !game || game.gm !== "dev") return;
      const G = game;
      if (G.devAmmo && G.slots) for (const s of G.slots) if (s && s.cfg) { s.mag = s.cfg.magMax; s.reserve = s.cfg.maxRes; }
      // câmera de inspeção: gira em volta do zumbi escolhido (o olhar do jogador vira o ângulo)
      const z = inspect !== null ? G.zombies.find((q) => q.id === inspect) : null;
      if (inspect !== null && !z) inspect = null;
      if (z) {
        const d = 2.6 * (z.s || 1) + 1, a = G.yaw, hy = (z.state === "dead" ? 0.4 : 1.1) * (z.s || 1);
        camera.position.set(z.x + Math.sin(a) * d, Math.max(0.3, hy + 0.3 - G.pitch * 3), -(z.y - Math.cos(a) * d));
        camera.lookAt(z.x, hy, -z.y);
        gunRoot.visible = false;
      }
      // nomes em cima dos zumbis
      const lab = document.getElementById("devLabels"); if (!lab) return;
      lab.hidden = !labelsOn || state !== "run";
      if (lab.hidden) return;
      const seen = new Set(), W = innerWidth, H = innerHeight, v3 = new THREE.Vector3();
      for (const q of live()) {
        v3.set(q.x, (q.state === "dead" ? 0.6 : 2.0 * (q.s || 1)) + 0.15, -q.y).project(camera);
        if (v3.z > 1 || v3.z < -1) continue;
        let e = labEls.get(q.id); if (!e) { e = document.createElement("b"); lab.appendChild(e); labEls.set(q.id, e); }
        e.textContent = q.devName; e.classList.toggle("sel", q.id === sel);
        e.style.left = ((v3.x + 1) / 2 * W).toFixed(0) + "px"; e.style.top = ((1 - v3.y) / 2 * H).toFixed(0) + "px"; seen.add(q.id);
      }
      for (const [id, e] of labEls) if (!seen.has(id)) { e.remove(); labEls.delete(id); }
    }
    // começa o laboratório: mapa da arena, sem ondas, vida infinita
    function start() {
      if (!ON || !game) return;
      const G = game; G.gm = "dev"; G.zombies = []; G.toSpawn = 0; G.queue = []; G.giantsLeft = 0; G.between = false; G.god = true; G.devAmmo = true; G.bannerT = 0;
      counter = {}; sel = null; inspect = null; slow = 1;
      build(); ui.hidden = false; $("hud").classList.add("dev");
      say("Laboratório pronto. Toque na lupa 🔍 para invocar zumbis ou escreva 'ajuda'.");
    }
    function stopUi() { if (ui) { ui.hidden = true; panel = null; ui.querySelectorAll(".dv-panel").forEach((p) => (p.hidden = true)); } const lab = document.getElementById("devLabels"); if (lab) lab.hidden = true; $("hud").classList.remove("dev"); }
    if (ON) {                                                                // nome do app na tela inicial
      document.querySelectorAll(".brand h1, #gateTitle").forEach((h) => { h.innerHTML = h.id ? "Zumbi Developer" : "Zumbi <br>Developer"; });
      const k = document.querySelector(".brand .kicker"); if (k) k.textContent = "Laboratório dos desenvolvedores";
      const p = document.getElementById("btnPlay"); if (p) p.textContent = "Entrar no laboratório";
    }
    return { ON, start, stopUi, frame, pose, run, ts: () => slow, open: () => !!panel, inspecting: () => inspect !== null, CAT };
  })();
