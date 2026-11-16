  // ======================================================================
  //  MODO PRÉDIO: lógica (andares, lanterna com bateria, mochila, armários, barulho, zumbis por nível)
  //  Cada andar vira um mapa ("predio") montado a partir da planta de TOWER.plan(nível, andar).
  //  Só para um jogador (sem co-op). A visão 3D fica em towerview.js.
  // ======================================================================
  const TowerPlay = (function () {
    const L = Logic, G = L.Game.prototype, clamp = L.clamp, wrapAngle = L.wrapAngle;
    const WALL_T = 0.2, WALL_H = 3.0, BAG_MAX = 8;
    const ITEM = {
      bateria: { name: "Bateria", sub: "Lanterna +45%" },
      bandagem: { name: "Bandagem", sub: "+25 de vida" },
      kit: { name: "Kit médico", sub: "+60 de vida" },
      garrafa: { name: "Garrafa", sub: "Jogue para distrair" },
      sinalizador: { name: "Sinalizador", sub: "Luz e barulho por 20 s" },
    };
    // ---------- blocos de colisão do andar ----------
    function boxesFor(P) {
      const A = P.A, b = [], t = 1, edgeH = P.roof ? 1.1 : 9;
      b.push([-A - t, A + t, A, A + t, edgeH, 0], [-A - t, A + t, -A - t, -A, edgeH, 0], [A, A + t, -A, A, edgeH, 0], [-A - t, -A, -A, A, edgeH, 0]);
      const wall = (w, h) => { const x0 = Math.min(w[0], w[2]), x1 = Math.max(w[0], w[2]), y0 = Math.min(w[1], w[3]), y1 = Math.max(w[1], w[3]); b.push([x0 - WALL_T / 2, x1 + WALL_T / 2, y0 - WALL_T / 2, y1 + WALL_T / 2, h, 0]); };
      for (const w of P.walls) wall(w, P.roof ? 3.2 : WALL_H);
      for (const f of P.furn) {
        if (f.k === "monitor" || f.k === "quadro") continue;                 // monitor fica em cima da mesa; quadro é chapado na parede
        b.push([f.x - f.w / 2, f.x + f.w / 2, f.y - f.d / 2, f.y + f.d / 2, f.k === "solar" ? 0.9 : f.h, 0]);
      }
      return b;
    }
    // frente do armário (onde o jogador fica para entrar/sair)
    const FACE = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    const lockerFront = (l, k) => { const f = FACE[l.face]; return [l.x + f[0] * (k || 0.95), l.y + f[1] * (k || 0.95)]; };
    const regAt = (P, x, y) => P.regs.find((g) => x >= g.x0 && x <= g.x1 && y >= g.y0 && y <= g.y1) || null;

    // ---------- começo do modo e troca de andar ----------
    G.towerStart = function (level, floor) {
      this.gm = "predio"; this.pickups = []; this.toSpawn = 0; this.queue = []; this.giantsLeft = 0; this.between = false;
      this.tw = { level, floor: floor || 0, P: null, bat: 100, torch: true, bag: { bateria: 0, bandagem: 1, kit: 0, garrafa: 1, sinalizador: 0 }, throwK: "garrafa",
        hide: null, hideT: 0, seenT: 99, items: [], throws: [], flares: [], noise: [], prompt: "", act: null, useWas: false, won: false, busy: 0, lastShots: 0, rideT: 0, opening: [] };
      this.towerFloor(this.tw.floor, true);
    };
    G.towerFloor = function (f, first) {
      const T = this.tw, P = TOWER.plan(T.level, f);
      T.floor = f; T.P = P; T.hide = null; T.items = P.items.map((it, i) => ({ id: i, kind: it.kind, x: it.x, y: it.y, on: true }));
      T.throws = []; T.flares = []; T.noise = []; T.opening = []; T.busy = 0;
      L.setMap("predio", { boxes: boxesFor(P), A: P.A });
      this.zombies = []; this.pickups = [];
      const AI = P.ai, D = this.diff, lvK = 1 + 0.1 * T.level + 0.015 * f;
      for (const q of P.zombies) {
        const hp = 100 * D.hp * lvK, spd = this.uniform(0.9, 1.25);
        const z = new L.Zombie(q.x, q.y, hp, spd, "walker", this.randint(3), this, 1 + 0.12 * T.level);
        z.s = this.uniform(0.74, 0.84);                                           // zumbis do prédio: menores
        z.limp = AI.run ? false : z.limp; z.yaw = this.uniform(-3.1, 3.1);
        z.tw = { mode: q.hidden ? "ambush" : "wander", tx: q.x, ty: q.y, t: this.uniform(0.5, 4), look: 0, home: q.room, lx: 0, ly: 0, trackT: 0, hp, locker: -1, openT: 0, heard: 0 };
        z.flowT = this.rnd() * 0.3; z.groanT = q.hidden ? 1e9 : this.uniform(3, 12);
        this.zombies.push(z);
      }
      this.wave = f + 1;
      const a = P.arrive; this.px = a.x; this.py = a.y; this.gz = 0; this.vz = 0; this.kvx = this.kvy = 0;
      // olha para dentro do andar (longe da parede mais perto)
      const reg = regAt(P, a.x, a.y);
      this.yaw = reg ? Math.atan2(-((reg.x0 + reg.x1) / 2 - a.x), (reg.y0 + reg.y1) / 2 - a.y) : 0; this.pitch = 0;
      if (!first) this.invulnT = Math.max(this.invulnT, 1.5);
      this.banner = P.roof ? "TERRAÇO" : f === 0 ? "TÉRREO" : "ANDAR " + (f + 1);
      this.bannerSub = P.roof ? "Chegue ao helicóptero" : f === 0 ? TOWER.LEVELS[T.level].name + " · ache a escada" : "Ache a escada para subir";
      this.bannerT = 3;
      this.events.push(["tw_floor", f]);
    };

    // ---------- barulho: os zumbis escutam (raio em metros) ----------
    G.twNoise = function (x, y, r, kind) { this.tw.noise.push({ x, y, r, kind: kind || "", t: 0.25 }); };

    // ---------- por quadro ----------
    G.updateTower = function (dt) {
      const T = this.tw, P = T.P; if (!P) return;
      T.seenT += dt; T.busy = Math.max(0, T.busy - dt);
      for (const n of T.noise) n.t -= dt; T.noise = T.noise.filter((n) => n.t > 0);
      // lanterna: gasta bateria; acabou e tem bateria na mochila: troca sozinho
      if (T.torch && this.alive) T.bat = Math.max(0, T.bat - dt * 0.55);
      if (T.bat <= 0 && T.bag.bateria > 0) { T.bag.bateria--; T.bat = 45; this.events.push(["tw_battery"]); }
      // passos e tiros fazem barulho
      if (this.alive && !T.hide && this.moving) {
        const r = this.sprinting ? 14 : this.crouchT > 0.5 ? 1.8 : 6.5;
        T.stepN = (T.stepN || 0) + dt; if (T.stepN > 0.3) { T.stepN = 0; this.twNoise(this.px, this.py, r, "step"); }
      }
      if (this.shots !== T.lastShots) { T.lastShots = this.shots; this.twNoise(this.px, this.py, 32, "shot"); }
      // itens no chão: pega encostando (se couber na mochila)
      if (this.alive && !T.hide) for (const it of T.items) {
        if (!it.on || Math.hypot(it.x - this.px, it.y - this.py) > 1.1) continue;
        const tot = Object.values(T.bag).reduce((a, b) => a + b, 0);
        if (tot >= BAG_MAX) { if (!T.fullT || this.time - T.fullT > 3) { T.fullT = this.time; this.events.push(["tw_full"]); } continue; }
        it.on = false; T.bag[it.kind] = (T.bag[it.kind] || 0) + 1; this.events.push(["tw_pick", it.kind, it.id]);
      }
      // garrafas e sinalizadores voando
      for (const o of T.throws) {
        o.t += dt; const k = Math.min(1, o.t / o.dur);
        o.x = o.x0 + (o.x1 - o.x0) * k; o.y = o.y0 + (o.y1 - o.y0) * k; o.h = 1.4 + (o.peak) * Math.sin(Math.PI * k) - 1.3 * k;
        if (k >= 1 && !o.done) {
          o.done = true;
          if (o.kind === "garrafa") { this.twNoise(o.x, o.y, 22, "glass"); this.events.push(["tw_glass", o.x, o.y]); }
          else { T.flares.push({ x: o.x, y: o.y, t: 20 }); this.events.push(["tw_flare", o.x, o.y]); }
        }
      }
      T.throws = T.throws.filter((o) => !o.done);
      for (const f of T.flares) { f.t -= dt; f.pulse = (f.pulse || 0) - dt; if (f.pulse <= 0) { f.pulse = 1; this.twNoise(f.x, f.y, 12, "flare"); } }
      T.flares = T.flares.filter((f) => f.t > 0);
      // terraço: chegou no helicóptero = venceu o nível
      if (P.roof && this.alive && !T.won && Math.hypot(this.px - P.exit.x, this.py - P.exit.y) < P.exit.r - 1.2) {
        T.won = true; T.winT = 0; this.bonus += 150 * (T.level + 1); this.events.push(["tw_win"]);
        this.banner = "VOCÊ ESCAPOU!"; this.bannerSub = "O helicóptero vai decolar"; this.bannerT = 5;
      }
      if (T.won) { T.winT += dt; this.invulnT = 1; if (T.winT > 6.5 && !this.over) { this.over = true; this.events.push(["tw_end"]); } }
      // o que dá para fazer aqui (texto do botão "usar")
      T.act = null;
      if (this.alive && !T.won) {
        if (T.hide !== null) T.act = { k: "leave" };
        else {
          if (P.up && Math.hypot(this.px - P.up.x, this.py - P.up.y) < 1.6) T.act = { k: "stairs" };
          else if (P.elev && Math.hypot(this.px - P.elev.x, this.py - P.elev.y) < 1.6) T.act = { k: "elev" };
          else {
            let best = -1, bd = 1.35;
            P.lockers.forEach((l, i) => { const f = lockerFront(l); const d = Math.hypot(this.px - f[0], this.py - f[1]); if (d < bd) { bd = d; best = i; } });
            if (best >= 0) T.act = { k: "hide", i: best };
          }
        }
      }
    };
    // botão "usar" (E / toque): entra/sai do armário, sobe a escada, pega o elevador
    G.towerUse = function () {
      const T = this.tw; if (!T || !T.act || T.busy > 0 || !this.alive) return;
      const P = T.P, a = T.act;
      if (a.k === "hide") {
        const l = P.lockers[a.i]; T.hide = a.i; T.hideT = 0; T.busy = 0.5;
        this.px = l.x; this.py = l.y; this.yaw = Math.atan2(-FACE[l.face][0], FACE[l.face][1]); this.pitch = 0; this.crouchT = 0;
        if (T.seenT < 1.5) T.spotted = a.i;                                   // um zumbi viu você entrar
        else T.spotted = -1;
        this.events.push(["tw_locker", a.i, 1]);
      } else if (a.k === "leave") {
        const l = P.lockers[T.hide], f = lockerFront(l, 1.0); this.events.push(["tw_locker", T.hide, 0]);
        T.hide = null; T.busy = 0.5; this.px = f[0]; this.py = f[1];
      } else if (a.k === "stairs" || a.k === "elev") {
        this.events.push([a.k === "elev" ? "tw_elev" : "tw_stairs"]);
        T.busy = 1; this.towerFloor(T.floor + 1, false);
      }
    };
    // mochila: H cura (bandagem se faltar pouca vida, senão o kit) · G joga · 4 troca o que jogar
    G.towerHeal = function () {
      const T = this.tw; if (!T || !this.alive || this.hp >= this.maxHp) return false;
      const miss = this.maxHp - this.hp, k = T.bag.kit > 0 && (miss > 40 || T.bag.bandagem === 0) ? "kit" : T.bag.bandagem > 0 ? "bandagem" : null;
      if (!k) return false;
      T.bag[k]--; this.hp = Math.min(this.maxHp, this.hp + (k === "kit" ? 60 : 25)); this.events.push(["tw_heal", k]); return true;
    };
    G.towerCycle = function () { const T = this.tw; if (!T) return; T.throwK = T.throwK === "garrafa" ? "sinalizador" : "garrafa"; this.events.push(["tw_cycle", T.throwK]); };
    G.towerThrow = function () {
      const T = this.tw; if (!T || !this.alive || T.hide !== null) return false;
      let k = T.throwK; if (!T.bag[k]) k = k === "garrafa" ? "sinalizador" : "garrafa"; if (!T.bag[k]) return false;
      T.bag[k]--;
      const dx = -Math.sin(this.yaw), dy = Math.cos(this.yaw), far = 4 + 10 * clamp(0.6 + this.pitch, 0.25, 1);
      let d = far; for (let s = 0.5; s <= far; s += 0.25) if (L.segBlocked(this.px, this.py, this.px + dx * s, this.py + dy * s, 1.2)) { d = Math.max(0.6, s - 0.4); break; }
      T.throws.push({ kind: k, x0: this.px, y0: this.py, x1: this.px + dx * d, y1: this.py + dy * d, x: this.px, y: this.py, h: 1.4, t: 0, dur: 0.35 + d * 0.045, peak: 0.6 + d * 0.06 });
      this.events.push(["tw_throw", k]); return true;
    };

    // ---------- zumbis do prédio ----------
    G.twMove = function (z, tx, ty, spd, dt) {
      const dx = tx - z.x, dy = ty - z.y, d = Math.hypot(dx, dy) || 1e-6;
      z.flowT -= dt;
      if (z.flowT <= 0) { z.flowT = 0.25 + this.rnd() * 0.12; z.flowDir = L.Flow.steer(z.x, z.y, tx, ty, 0.3, this.time || 0); }
      let ux = dx / d, uy = dy / d;
      if (z.flowDir) { ux = z.flowDir[0]; uy = z.flowDir[1]; z.sideT = 0; }
      if (z.sideT > 0) { z.sideT -= dt; const nx = ux - uy * z.side * 1.1, ny = uy + ux * z.side * 1.1, ln = Math.hypot(nx, ny) || 1; ux = nx / ln; uy = ny / ln; }
      const want = spd * dt, got = this.stepZ(z, ux, uy, spd, dt);
      if (want > 1e-6 && got < want * 0.45 && d > 1.2) { z.blocked += dt; if (z.blocked > 0.25 && z.sideT <= 0) { z.side = this.rnd() < 0.5 ? -1 : 1; z.sideT = this.uniform(0.6, 1.3); z.blocked = 0; } }
      else z.blocked = Math.max(0, z.blocked - dt);
      this.turnToward(z, z.x + ux, z.y + uy, 6, dt);
      z.phase += dt * (spd * 2.4 + 1);
      return d;
    };
    // um ponto para vagar: centro da própria sala ou de uma sala vizinha (pontos repetidos: o campo de fluxo é reaproveitado)
    G.twWanderPoint = function (z) {
      const P = this.tw.P, here = regAt(P, z.x, z.y) || P.regs[0];
      const nb = P.doors.filter((d) => d.a === here.id || d.b === here.id).map((d) => (d.a === here.id ? d.b : d.a));
      const g = this.rnd() < 0.45 || !nb.length ? here : P.regs[nb[this.randint(nb.length)]];
      const W = g.x1 - g.x0, H = g.y1 - g.y0, gx = Math.round(this.uniform(-0.3, 0.3) * W / 2) * 2, gy = Math.round(this.uniform(-0.3, 0.3) * H / 2) * 2;
      return [clamp(g.cx + gx / 2, g.x0 + 1, g.x1 - 1), clamp(g.cy + gy / 2, g.y0 + 1, g.y1 - 1)];
    };
    G.twCanSee = function (z, AI) {
      const T = this.tw; if (T.hide !== null || !this.alive) return false;
      const dx = this.px - z.x, dy = this.py - z.y, d = Math.hypot(dx, dy);
      let range = AI.see * (T.torch && T.bat > 0 ? 1.35 : 0.75) * (this.crouchT > 0.5 ? 0.65 : 1);
      for (const f of T.flares) if (Math.hypot(f.x - this.px, f.y - this.py) < 7) range = Math.max(range, AI.see * 1.4);
      if (d > range) return false;
      if (d > 2.2) { const a = Math.abs(wrapAngle(Math.atan2(-dx, dy) - z.yaw)); if (a > (z.tw.mode === "chase" ? 1.9 : 1.15)) return false; }   // campo de visão (perseguindo: olha em volta)
      return !L.segBlocked(z.x, z.y, this.px, this.py, 1.45);
    };
    G.towerAI = function (z, dt, base) {
      const T = this.tw, P = T.P, AI = P.ai, W = z.tw;
      const dx = this.px - z.x, dy = this.py - z.y, dist = Math.hypot(dx, dy) || 1e-6;
      if (z.hp < W.hp) { W.hp = z.hp; if (T.hide === null) { W.mode = "chase"; W.trackT = Math.max(W.trackT, 3); } }   // levou tiro: vem atrás
      const sees = this.twCanSee(z, AI);
      if (sees) { T.seenT = 0; W.lx = this.px; W.ly = this.py; W.trackT = AI.track; if (W.mode !== "chase") { W.mode = "chase"; this.events.push(["tw_spot", z.id, dist]); } }
      // ataque
      const reach = L.ATTACK_RANGE * z.s;
      if (T.hide === null && dist < reach && (W.mode === "chase" || W.mode === "ambush" || dist < 0.9)) {
        W.mode = "chase"; z.state = "attack"; z.attackT += dt; z.attackCd -= dt; this.turnToward(z, this.px, this.py, 8, dt);
        if (z.attackCd <= 0) { z.attackCd = 1.1; this.hurt(base * this.diff.dmg * z.dmgMul * 0.9, z); }
        return;
      }
      z.state = "walk"; z.attackCd = Math.max(z.attackCd, 0.35);
      const slow = (z.stagger > 0 ? 0.25 : 1) * (z.slowT > 0 ? 0.55 : 1);
      // escutou algo?
      if (W.mode !== "chase" && W.mode !== "open" && AI.hear > 0) {
        let best = null, bd = 1e9;
        for (const n of T.noise) { const d = Math.hypot(n.x - z.x, n.y - z.y), r = n.r * AI.hear / 10; if (d < r && d < bd) { bd = d; best = n; } }
        if (best) {
          if (W.mode === "ambush" && best.kind === "step" && bd > 5) { /* escondido: espera chegar mais perto */ }
          else if (AI.search || W.mode === "ambush" || bd < 3) { W.mode = "listen"; W.tx = best.x; W.ty = best.y; W.t = 0; if (best.kind !== "step" || this.rnd() < 0.3) this.events.push(["tw_hear", z.id]); }
        }
      }
      switch (W.mode) {
        case "ambush": {                                                       // nível 5: parado no escuro esperando você chegar perto
          z.phase += dt * 0.3;
          if (dist < 3.2 && T.hide === null) { W.mode = "chase"; W.trackT = AI.track; this.events.push(["tw_ambush", z.id]); }
          return;
        }
        case "chase": {
          if (!sees) W.trackT -= dt;
          const tx = sees || W.trackT > 0 ? (T.hide !== null ? W.lx : this.px) : W.lx, ty = sees || W.trackT > 0 ? (T.hide !== null ? W.ly : this.py) : W.ly;
          if (sees || W.trackT > 0) { W.lx = tx; W.ly = ty; }
          const d = this.twMove(z, tx, ty, (AI.run ? AI.chase : AI.chase * 0.9) * slow, dt);
          if (!sees && d < 1.2) {                                              // chegou onde viu você por último
            if (T.hide !== null && T.spotted === T.hide && AI.search) { W.mode = "open"; W.locker = T.hide; }   // viu você entrar no armário
            else { W.mode = "search"; W.t = AI.search ? 6 + AI.track : 2.5; W.look = 0; W.locker = -1; }
          }
          return;
        }
        case "listen": {                                                       // vai até o barulho e olha em volta
          const d = this.twMove(z, W.tx, W.ty, (AI.run ? 1.7 : 1.1) * slow * z.speed, dt);
          if (d < 1.3) { W.mode = "search"; W.t = AI.search ? 4 : 2; W.look = 0; W.locker = -1; }
          return;
        }
        case "search": {                                                       // olha em volta; níveis 4 e 5 abrem armários perto
          W.t -= dt; W.look += dt; z.yaw = wrapAngle(z.yaw + Math.sin(W.look * 1.7) * dt * 1.6);
          if (T.level >= 3 && W.locker < 0 && W.look > 1) {
            let bi = -1, bd = 9;
            P.lockers.forEach((l, i) => { if (T.opening.includes(i)) return; const d = Math.hypot(l.x - z.x, l.y - z.y); if (d < bd && this.rnd() < 0.7) { bd = d; bi = i; } });
            W.locker = bi < 0 ? -2 : bi; if (bi >= 0) { W.mode = "open"; T.opening.push(bi); return; }
          }
          if (W.t <= 0) { W.mode = AI.hide && this.rnd() < 0.35 ? "ambush" : "wander"; W.t = this.uniform(1, 4); }
          return;
        }
        case "open": {                                                         // anda até o armário e abre
          const l = P.lockers[W.locker]; if (!l) { W.mode = "wander"; return; }
          const f = lockerFront(l, 1.1), d = this.twMove(z, f[0], f[1], 1.3 * slow * z.speed, dt);
          if (d < 0.5) {
            this.turnToward(z, l.x, l.y, 8, dt); W.openT += dt; z.state = "attack"; z.attackT += dt;
            if (W.openT > 1.1) {
              W.openT = 0; T.opening = T.opening.filter((i) => i !== W.locker); this.events.push(["tw_open", W.locker]);
              if (T.hide === W.locker) {                                        // achou você: puxa para fora
                const ff = lockerFront(l, 1.0); this.events.push(["tw_locker", T.hide, 0]); T.hide = null; this.px = ff[0]; this.py = ff[1];
                this.hurt(base * this.diff.dmg * 1.3, z); W.mode = "chase"; W.trackT = AI.track + 2; this.events.push(["tw_caught"]);
              } else { W.mode = "search"; W.t = 2; W.look = 0; W.locker = -2; }
            }
          }
          return;
        }
        default: {                                                             // vagando
          W.t -= dt;
          if (W.t <= 0) { const p = this.twWanderPoint(z); W.tx = p[0]; W.ty = p[1]; W.t = this.uniform(5, 11); }
          const d = Math.hypot(W.tx - z.x, W.ty - z.y);
          if (d > 0.8) this.twMove(z, W.tx, W.ty, 0.55 * z.speed * slow, dt); else z.phase += dt * 0.4;
        }
      }
    };
    return { ITEM, BAG_MAX, boxesFor, lockerFront, FACE, WALL_H };
  })();
