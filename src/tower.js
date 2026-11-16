  // ======================================================================
  //  MODO PRÉDIO: plantas dos andares (geradas por semente: todo mundo vê o mesmo prédio)
  //  Cada andar: salas e corredores (BSP), portas ligando tudo (árvore + alguns atalhos),
  //  escada para cima longe de onde você chega, às vezes um elevador (sobe 1 andar),
  //  armários grandes para se esconder, baterias e itens da mochila, zumbis.
  //  O último andar de cada nível tem um terraço a céu aberto com a saída (heliponto).
  //  Coordenadas do jogo: x para a direita, y para a frente; o andar vai de -A a A.
  // ======================================================================
  const TOWER = (function () {
    const A = 36;                                      // andar de 72 x 72 m (mesma escala do mapa grande)
    const LEVELS = [
      { floors: 7, name: "Nível 1", ai: 0, zBase: 7, zFloor: 0.5, bat: 6, items: 5, lockers: 10, loops: 0.12, elev: 0.2 },
      { floors: 9, name: "Nível 2", ai: 1, zBase: 9, zFloor: 0.6, bat: 5, items: 5, lockers: 11, loops: 0.16, elev: 0.25 },
      { floors: 13, name: "Nível 3", ai: 2, zBase: 11, zFloor: 0.6, bat: 5, items: 4, lockers: 12, loops: 0.2, elev: 0.3 },
      { floors: 18, name: "Nível 4", ai: 3, zBase: 13, zFloor: 0.55, bat: 4, items: 4, lockers: 13, loops: 0.24, elev: 0.3 },
      { floors: 20, name: "Nível 5", ai: 4, zBase: 15, zFloor: 0.55, bat: 4, items: 3, lockers: 14, loops: 0.28, elev: 0.35 },
    ];
    // comportamento dos zumbis por nível (o andar não muda isso, só o nível)
    const AI = [
      { name: "Andam à toa", see: 7, hear: 4, chase: 1.5, run: false, search: false, hide: false, track: 0 },
      { name: "Ouvem barulho e vão ver", see: 9, hear: 9, chase: 1.8, run: false, search: true, hide: false, track: 0 },
      { name: "Correm quando te veem", see: 12, hear: 12, chase: 4.0, run: true, search: true, hide: false, track: 3 },
      { name: "Patrulham e procuram nos armários", see: 14, hear: 14, chase: 4.4, run: true, search: true, hide: false, track: 6 },
      { name: "Se escondem e caçam você", see: 16, hear: 16, chase: 4.8, run: true, search: true, hide: true, track: 10 },
    ];
    function rng(seed) { let s = (seed >>> 0) || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

    // ---------- último andar: só o terraço, com a casinha da escada e o helicóptero no heliponto ----------
    function roof(level, floor, prev, r, uni) {
      const LV = LEVELS[level], ax = prev ? prev.up.x : 0, ay = prev ? prev.up.y : -A + 6;
      const arrive = { x: ax, y: ay };
      // casinha da escada em volta da chegada; a porta fica virada para o heliponto
      const hw = 7, hd = 6, hx = Math.max(-A + 1 + hw / 2, Math.min(A - 1 - hw / 2, ax)), hy = Math.max(-A + 1 + hd / 2, Math.min(A - 1 - hd / 2, ay));
      const hut = { kind: "room", type: "acesso", x0: hx - hw / 2, y0: hy - hd / 2, x1: hx + hw / 2, y1: hy + hd / 2 };
      const ter = { kind: "terrace", type: "terraco", x0: -A, y0: -A, x1: A, y1: A };
      const regs = [ter, hut]; regs.forEach((g, i) => { g.id = i; g.cx = (g.x0 + g.x1) / 2; g.cy = (g.y0 + g.y1) / 2; g.area = (g.x1 - g.x0) * (g.y1 - g.y0); });
      // heliponto: o canto oposto, longe da casinha
      const ex = hx > 0 ? -A + 13 : A - 13, ey = hy > 0 ? -A + 13 : A - 13, exit = { x: ex, y: ey, r: 6.5 };
      // porta da casinha na parede virada para o heliponto
      const dx = ex - hx, dy = ey - hy, alongX = Math.abs(dx) > Math.abs(dy);
      const door = alongX ? { x: dx > 0 ? hut.x1 : hut.x0, y: hy, axis: "x", w: 2.0 } : { x: hx, y: dy > 0 ? hut.y1 : hut.y0, axis: "y", w: 2.0 };
      door.a = 1; door.b = 0; door.open = false;
      const doors = [door], walls = [];
      const wallCut = (x0, y0, x1, y1) => {                                // parede da casinha com o vão da porta
        const ax2 = x0 === x1 ? "x" : "y", c = ax2 === "x" ? x0 : y0, lo = ax2 === "x" ? y0 : x0, hi = ax2 === "x" ? y1 : x1;
        if (door.axis === ax2 && Math.abs((ax2 === "x" ? door.x : door.y) - c) < 0.01) { const m = ax2 === "x" ? door.y : door.x; walls.push(ax2 === "x" ? [c, lo, c, m - door.w / 2] : [lo, c, m - door.w / 2, c]); walls.push(ax2 === "x" ? [c, m + door.w / 2, c, hi] : [m + door.w / 2, c, hi, c]); }
        else walls.push([x0, y0, x1, y1]);
      };
      wallCut(hut.x0, hut.y0, hut.x1, hut.y0); wallCut(hut.x0, hut.y1, hut.x1, hut.y1); wallCut(hut.x0, hut.y0, hut.x0, hut.y1); wallCut(hut.x1, hut.y0, hut.x1, hut.y1);
      const parapet = [[-A, -A, A, -A], [-A, A, A, A], [-A, -A, -A, A], [A, -A, A, A]];   // mureta de 1,1 m na borda
      // objetos do telhado
      const furn = [];
      const hit = (x, y, w, d, m) => furn.some((f) => Math.abs(f.x - x) < (f.w + w) / 2 + m && Math.abs(f.y - y) < (f.d + d) / 2 + m);
      const clearOf = (x, y, w, d) => Math.abs(x - hx) > (hw + w) / 2 + 2.2 || Math.abs(y - hy) > (hd + d) / 2 + 2.2;
      const putR = (k, x, y, w, d, h, m) => { if (Math.abs(x) + w / 2 > A - 0.4 || Math.abs(y) + d / 2 > A - 0.4) return false; if (Math.hypot(x - ex, y - ey) < exit.r + Math.max(w, d) / 2 + 2.5 || !clearOf(x, y, w, d) || hit(x, y, w, d, m)) return false; furn.push({ k, x, y, w, d, h }); return true; };
      for (let i = 0; i < 300 && furn.filter((f) => f.k === "solar").length < 24; i++) { const x = uni(-A + 4, A - 4), y = uni(-A + 4, A - 4); putR("solar", x, y, 3.2, 1.7, 0.9, 0.6); }     // placas solares
      for (let i = 0, n = 0; n < 10 && i < 200; i++) if (putR("ar", uni(-A + 3, A - 3), uni(-A + 3, A - 3), 1.6, 1.6, 1.2, 1.4)) n++;      // ar-condicionado
      for (let i = 0, n = 0; n < 3 && i < 200; i++) if (putR("caixa_dagua", uni(-A + 4, A - 4), uni(-A + 4, A - 4), 2.8, 2.8, 3.4, 2)) n++;
      for (let i = 0, n = 0; n < 4 && i < 200; i++) if (putR("claraboia", uni(-A + 4, A - 4), uni(-A + 4, A - 4), 2.4, 2.4, 0.6, 1.4)) n++;
      for (let i = 0, n = 0; n < 2 && i < 200; i++) if (putR("antena", uni(-A + 3, A - 3), uni(-A + 3, A - 3), 0.8, 0.8, 7, 2)) n++;
      for (const sd of [0, 1, 2, 3]) for (let u = -A + 3; u < A - 3; u += uni(5, 9)) { const pp = [[u, -A + 0.6], [u, A - 0.6], [-A + 0.6, u], [A - 0.6, u]][sd]; putR("jardineira", pp[0], pp[1], sd < 2 ? 2.6 : 0.8, sd < 2 ? 0.8 : 2.6, 0.7, 0.3); }
      for (let i = 0, n = 0; n < 5 && i < 200; i++) if (putR("banco", uni(-A + 3, A - 3), uni(-A + 3, A - 3), 1.8, 0.5, 0.45, 1)) n++;
      const lockers = [];
      for (let i = 0; i < 200 && lockers.length < 4; i++) { const x = uni(-A + 3, A - 3), y = uni(-A + 3, A - 3); if (putR("armario", x, y, 1.4, 0.7, 2.1, 1.2)) { furn[furn.length - 1].locker = true; lockers.push({ x, y, face: 0, room: 0 }); } }   // armário de ferramentas: dá para se esconder
      const items = [], zombies = [];
      const spot = (m) => { for (let i = 0; i < 100; i++) { const x = uni(-A + 2, A - 2), y = uni(-A + 2, A - 2); if (!hit(x, y, 0.5, 0.5, m) && clearOf(x, y, 0.5, 0.5) && Math.hypot(x - ex, y - ey) > exit.r + 1) return [x, y]; } return null; };
      for (let i = 0; i < 3; i++) { const p = spot(0.3); if (p) items.push({ kind: i ? "bateria" : "kit", x: p[0], y: p[1], room: 0 }); }
      const nz = Math.round((LV.zBase + floor * LV.zFloor) * 0.6);
      for (let i = 0; i < 200 && zombies.length < nz; i++) { const p = spot(0.3); if (p && Math.hypot(p[0] - ax, p[1] - ay) > 14) zombies.push({ x: p[0], y: p[1], room: 0, hidden: AI[LV.ai].hide && r() < 0.35 }); }
      const heli = { x: ex, y: ey, yaw: Math.atan2(hx - ex, hy - ey) };       // o nariz aponta para quem chega
      return { A, level, floor, top: true, roof: true, regs, doors, walls, parapet, arrive, up: null, elev: null, exit, heli, lockers, items, zombies, furn, dist: [0, 0], ai: AI[LV.ai], TYPES: Object.assign({}, TYPES_ALL, { acesso: "Saída da escada" }) };
    }
    const TYPES_ALL = { escritorio: "Escritório", reuniao: "Reunião", copa: "Copa", banheiro: "Banheiro", deposito: "Depósito", estar: "Sala de estar", servidores: "Servidores", arquivo: "Arquivo", corredor: "Corredor", terraco: "Terraço" };
    const memo = new Map();
    function plan(level, floor) { const k = level * 100 + floor; if (!memo.has(k)) memo.set(k, build(level, floor)); return memo.get(k); }
    // salas e corredores por divisão binária (BSP); só usa r() aqui, então dá para prever o andar de cima
    function bsp(r, regs, root) {
      const uni = (a, b) => a + r() * (b - a);
      const HALL = 3.2, MIN = 5.5, MAX = 15;
      (function split(b, depth) {
        const w = b.x1 - b.x0, h = b.y1 - b.y0;
        const big = Math.max(w, h);
        if (big <= MAX && (big < MIN * 2.2 || r() < 0.35 + depth * 0.05)) { regs.push(Object.assign({ kind: "room" }, b)); return; }
        const vert = w > h * 1.15 ? true : h > w * 1.15 ? false : r() < 0.5;
        const hall = depth < 2 && (vert ? w : h) > 22;     // corredores largos nas primeiras divisões
        const len = vert ? w : h, gap = hall ? HALL : 0;
        const at = uni(0.36, 0.64) * (len - gap);
        if (vert) {
          const c = b.x0 + at;
          split({ x0: b.x0, y0: b.y0, x1: c, y1: b.y1 }, depth + 1);
          if (hall) regs.push({ kind: "hall", x0: c, y0: b.y0, x1: c + gap, y1: b.y1 });
          split({ x0: c + gap, y0: b.y0, x1: b.x1, y1: b.y1 }, depth + 1);
        } else {
          const c = b.y0 + at;
          split({ x0: b.x0, y0: b.y0, x1: b.x1, y1: c }, depth + 1);
          if (hall) regs.push({ kind: "hall", x0: b.x0, y0: c, x1: b.x1, y1: c + gap });
          split({ x0: b.x0, y0: c + gap, x1: b.x1, y1: b.y1 }, depth + 1);
        }
      })(root, 0);
    }
    // plantas (só as salas) do andar seguinte: a escada daqui tem que cair dentro de uma sala lá em cima
    function nextRegs(level, floor) {
      const LV = LEVELS[level]; if (floor >= LV.floors - 1) return null;
      const regs = []; bsp(rng(1000003 * (level + 1) + 7919 * (floor + 1)), regs, { x0: -A, y0: -A, x1: A, y1: A }); return regs;
    }
    function build(level, floor) {
      const LV = LEVELS[level], r = rng(1000003 * (level + 1) + 7919 * (floor + 1)), top = floor === LV.floors - 1;
      const uni = (a, b) => a + r() * (b - a);
      // ---------- salas: BSP com corredores nas divisões de cima ----------
      const regs = [];                                    // { x0, y0, x1, y1, kind: "room" | "hall" | "terrace" }
      let root = { x0: -A, y0: -A, x1: A, y1: A };
      const prev = floor > 0 ? plan(level, floor - 1) : null;
      if (top) return roof(level, floor, prev, r, uni);
      bsp(r, regs, root);
      regs.forEach((g, i) => { g.id = i; g.cx = (g.x0 + g.x1) / 2; g.cy = (g.y0 + g.y1) / 2; g.area = (g.x1 - g.x0) * (g.y1 - g.y0); });
      // ---------- vizinhança (parede em comum) ----------
      const adj = [];
      const shared = (a, b) => {
        const e = 0.01;
        if (Math.abs(a.x1 - b.x0) < e || Math.abs(b.x1 - a.x0) < e) { const x = Math.abs(a.x1 - b.x0) < e ? a.x1 : a.x0, lo = Math.max(a.y0, b.y0), hi = Math.min(a.y1, b.y1); if (hi - lo > 2.4) return { axis: "x", c: x, lo, hi }; }
        if (Math.abs(a.y1 - b.y0) < e || Math.abs(b.y1 - a.y0) < e) { const y = Math.abs(a.y1 - b.y0) < e ? a.y1 : a.y0, lo = Math.max(a.x0, b.x0), hi = Math.min(a.x1, b.x1); if (hi - lo > 2.4) return { axis: "y", c: y, lo, hi }; }
        return null;
      };
      for (let i = 0; i < regs.length; i++) for (let j = i + 1; j < regs.length; j++) { const s = shared(regs[i], regs[j]); if (s) adj.push(Object.assign({ a: i, b: j, w: r() + (regs[i].kind !== "room" || regs[j].kind !== "room" ? -0.6 : 0) }, s)); }
      // ---------- portas: árvore geradora (tudo alcançável) + atalhos ----------
      const par = regs.map((_, i) => i), find = (i) => (par[i] === i ? i : (par[i] = find(par[i])));
      const doors = [], links = regs.map(() => []);
      const addDoor = (e) => {
        const w = e.a !== undefined && (regs[e.a].kind === "terrace" || regs[e.b].kind === "terrace") ? 2.4 : 1.4;
        const pos = uni(e.lo + 1.0 + w / 2, e.hi - 1.0 - w / 2);
        const d = e.axis === "x" ? { x: e.c, y: pos, axis: "x", w } : { x: pos, y: e.c, axis: "y", w };
        d.a = e.a; d.b = e.b; d.open = false; doors.push(d); links[e.a].push(e.b); links[e.b].push(e.a);
      };
      adj.sort((p, q) => p.w - q.w);
      for (const e of adj) { const fa = find(e.a), fb = find(e.b); if (fa !== fb) { par[fa] = fb; addDoor(e); } else if (r() < LV.loops) addDoor(e); }
      // ---------- paredes (com o vão das portas) ----------
      const walls = [];
      const cut = (axis, c, lo, hi) => {
        const ds = doors.filter((d) => d.axis === axis && Math.abs((axis === "x" ? d.x : d.y) - c) < 0.01).map((d) => [(axis === "x" ? d.y : d.x) - d.w / 2, (axis === "x" ? d.y : d.x) + d.w / 2]).sort((p, q) => p[0] - q[0]);
        let s = lo; for (const [a, b] of ds) { if (b <= lo || a >= hi) continue; if (a > s) walls.push(axis === "x" ? [c, s, c, a] : [s, c, a, c]); s = Math.max(s, b); }
        if (hi > s) walls.push(axis === "x" ? [c, s, c, hi] : [s, c, hi, c]);
      };
      // todas as bordas de todas as salas, juntando os trechos na mesma linha (sem buracos entre salas pequenas)
      const lines = { x: new Map(), y: new Map() }, key = (v) => Math.round(v * 100) / 100;
      const addL = (axis, c, lo, hi) => { const m = lines[axis], k = key(c); if (!m.has(k)) m.set(k, []); m.get(k).push([lo, hi]); };
      for (const g of regs) { addL("x", g.x0, g.y0, g.y1); addL("x", g.x1, g.y0, g.y1); addL("y", g.y0, g.x0, g.x1); addL("y", g.y1, g.x0, g.x1); }
      for (const axis of ["x", "y"]) for (const [c, iv] of lines[axis]) {
        iv.sort((p, q) => p[0] - q[0]); let [lo, hi] = iv[0];
        for (let i = 1; i <= iv.length; i++) { if (i < iv.length && iv[i][0] <= hi + 0.01) { hi = Math.max(hi, iv[i][1]); continue; } cut(axis, c, lo, hi); if (i < iv.length) [lo, hi] = iv[i]; }
      }
      // ---------- distâncias entre salas (BFS pelas portas) ----------
      const bfs = (src) => { const d = regs.map(() => 1e9), q = [src]; d[src] = 0; while (q.length) { const u = q.shift(); for (const v of links[u]) if (d[v] > d[u] + 1) { d[v] = d[u] + 1; q.push(v); } } return d; };
      const rooms = regs.filter((g) => g.kind === "room");
      // chegada: onde a escada do andar de baixo termina (andar 0: entrada do prédio, numa sala da borda)
      let arrive;
      if (prev) arrive = { x: prev.up.x, y: prev.up.y };
      else { const edge = rooms.filter((g) => g.y0 <= -A + 0.01); const g = edge.length ? edge[Math.floor(r() * edge.length)] : rooms[0]; arrive = { x: g.cx, y: g.y0 + 2 }; }
      const inReg = (x, y) => regs.find((g) => x >= g.x0 && x <= g.x1 && y >= g.y0 && y <= g.y1) || regs[0];
      const startReg = inReg(arrive.x, arrive.y), dist = bfs(startReg.id);
      const reach = rooms.filter((g) => dist[g.id] < 1e9 && g.id !== startReg.id && g.area >= 30);
      reach.sort((p, q) => dist[q.id] - dist[p.id] || Math.hypot(q.cx - arrive.x, q.cy - arrive.y) - Math.hypot(p.cx - arrive.x, p.cy - arrive.y));
      const used = new Set([startReg.id]);
      let up = null, elev = null, exit = null;
      const corner = (g, k) => { const m = 1.8; return [[g.x0 + m, g.y0 + m], [g.x1 - m, g.y0 + m], [g.x0 + m, g.y1 - m], [g.x1 - m, g.y1 - m]][k]; };
      if (top) {                                           // saída: heliponto no terraço
        const t = regs.find((g) => g.kind === "terrace"); exit = { x: t.cx, y: t.cy, r: 4 }; used.add(t.id);
      } else {
        const far = reach.slice(0, Math.max(1, Math.ceil(reach.length * 0.25)));
        const nx = nextRegs(level, floor + 1);
        const fits = (p) => !nx || nx.some((q) => p[0] > q.x0 + 2.2 && p[0] < q.x1 - 2.2 && p[1] > q.y0 + 1.6 && p[1] < q.y1 - 1.6);   // a escada que desce lá em cima fica dentro de uma sala
        let g = far[Math.floor(r() * far.length)], p = corner(g, Math.floor(r() * 4));
        for (let t = 0; t < 60 && !fits(p); t++) { const pool = t < 30 ? far : reach; g = pool[Math.floor(r() * pool.length)]; p = corner(g, Math.floor(r() * 4)); }
        used.add(g.id); up = { x: p[0], y: p[1], room: g.id };
        if (floor > 0 && floor < LV.floors - 2 && r() < LV.elev) {   // elevador: atalho no meio do caminho (só sobe 1 andar)
          const mid = reach.filter((q) => !used.has(q.id) && dist[q.id] >= 2 && dist[q.id] <= Math.max(2, dist[g.id] - 2));
          if (mid.length) { const e = mid[Math.floor(r() * mid.length)]; used.add(e.id); const c = corner(e, Math.floor(r() * 4)); elev = { x: c[0], y: c[1], room: e.id }; }
        }
      }
      // ---------- armários grandes (esconderijo), baterias, itens, zumbis ----------
      const taken = [];
      const free = (x, y, m) => Math.hypot(x - arrive.x, y - arrive.y) > 3 && (!up || Math.hypot(x - up.x, y - up.y) > 2.6) && (!elev || Math.hypot(x - elev.x, y - elev.y) > 2.6) && taken.every((t) => Math.hypot(t[0] - x, t[1] - y) > m);
      const lockers = [];
      for (let i = 0, n = 0; n < LV.lockers && i < 400; i++) {
        const g = rooms[Math.floor(r() * rooms.length)], side = Math.floor(r() * 4);
        const along = side < 2 ? uni(g.x0 + 1.2, g.x1 - 1.2) : uni(g.y0 + 1.2, g.y1 - 1.2);
        const p = [[along, g.y0 + 0.5, 0], [along, g.y1 - 0.5, 2], [g.x0 + 0.5, along, 1], [g.x1 - 0.5, along, 3]][side];
        if (doors.some((d) => Math.hypot(d.x - p[0], d.y - p[1]) < 2.2) || !free(p[0], p[1], 2.5)) continue;
        lockers.push({ x: p[0], y: p[1], face: p[2], room: g.id }); taken.push([p[0], p[1]]); n++;
      }
      // ---------- móveis de cada sala (tipo da sala pelo tamanho e formato) ----------
      const furn = [];                                     // { k, x, y, w, d, h } (w ao longo de x, d ao longo de y)
      const hit = (x, y, w, d, m) => furn.some((f) => Math.abs(f.x - x) < (f.w + w) / 2 + m && Math.abs(f.y - y) < (f.d + d) / 2 + m);
      for (const l of lockers) furn.push({ k: "armario", x: l.x, y: l.y, w: l.face % 2 ? 0.7 : 1.4, d: l.face % 2 ? 1.4 : 0.7, h: 2.1, locker: true });
      const keep = [[arrive.x, arrive.y, 2.6]]; if (up) keep.push([up.x, up.y, 2.8]); if (elev) keep.push([elev.x, elev.y, 2.8]); if (exit) keep.push([exit.x, exit.y, exit.r + 1.5]);
      const okAt = (g, x, y, w, d, m) => {
        if (x - w / 2 < g.x0 + 0.12 || x + w / 2 > g.x1 - 0.12 || y - d / 2 < g.y0 + 0.12 || y + d / 2 > g.y1 - 0.12) return false;
        for (const dr of doors) if ((dr.a === g.id || dr.b === g.id) && Math.abs(dr.x - x) < w / 2 + 1.7 && Math.abs(dr.y - y) < d / 2 + 1.7) return false;
        for (const k of keep) if (Math.abs(k[0] - x) < w / 2 + k[2] && Math.abs(k[1] - y) < d / 2 + k[2]) return false;
        return !hit(x, y, w, d, m === undefined ? 0.05 : m);
      };
      const put = (g, k, x, y, w, d, h, m) => { if (!okAt(g, x, y, w, d, m)) return false; furn.push({ k, x, y, w, d, h, room: g.id }); return true; };
      // fileira encostada nas paredes: peças de "len" x "dep", com espaço "gap"
      const wallRow = (g, k, len, dep, h, gap, sides) => {
        for (const sd of sides || [0, 1, 2, 3]) {
          const horiz = sd < 2, L0 = horiz ? g.x0 : g.y0, L1 = horiz ? g.x1 : g.y1;
          for (let u = L0 + 0.6 + len / 2; u < L1 - 0.6 - len / 2; u += len + gap) {
            const c = [g.y0 + dep / 2 + 0.14, g.y1 - dep / 2 - 0.14, g.x0 + dep / 2 + 0.14, g.x1 - dep / 2 - 0.14][sd];
            if (horiz) put(g, k, u, c, len, dep, h); else put(g, k, c, u, dep, len, h);
          }
        }
      };
      const corners = (g, k, sz, h) => { for (const [x, y] of [[g.x0 + sz / 2 + 0.2, g.y0 + sz / 2 + 0.2], [g.x1 - sz / 2 - 0.2, g.y0 + sz / 2 + 0.2], [g.x0 + sz / 2 + 0.2, g.y1 - sz / 2 - 0.2], [g.x1 - sz / 2 - 0.2, g.y1 - sz / 2 - 0.2]]) if (r() < 0.6) put(g, k, x, y, sz, sz, h); };
      const TYPES = { escritorio: "Escritório", reuniao: "Reunião", copa: "Copa", banheiro: "Banheiro", deposito: "Depósito", estar: "Sala de estar", servidores: "Servidores", arquivo: "Arquivo", corredor: "Corredor", terraco: "Terraço" };
      for (const g of regs) {
        const W = g.x1 - g.x0, H = g.y1 - g.y0, mn = Math.min(W, H), ar = g.area, horiz = W >= H;
        if (g.kind === "hall") {
          g.type = "corredor";
          const len = Math.max(W, H);
          for (let u = -len / 2 + 6; u < len / 2 - 4; u += uni(7, 12)) {
            const kk = r(), cx = horiz ? g.cx + u : (r() < 0.5 ? g.x0 + 0.45 : g.x1 - 0.45), cy = horiz ? (r() < 0.5 ? g.y0 + 0.45 : g.y1 - 0.45) : g.cy + u;
            if (kk < 0.4) put(g, "planta", cx, cy, 0.7, 0.7, 1.4); else if (kk < 0.65) put(g, "banco", cx, cy, horiz ? 1.8 : 0.5, horiz ? 0.5 : 1.8, 0.45); else if (kk < 0.85) put(g, "maquina", cx, cy, horiz ? 1.0 : 0.8, horiz ? 0.8 : 1.0, 1.9); else put(g, "lixeira", cx, cy, 0.5, 0.5, 0.8);
          }
          continue;
        }
        if (g.kind === "terrace") {
          g.type = "terraco";
          for (let i = 0; i < 9; i++) put(g, "ar", uni(g.x0 + 2, g.x1 - 2), uni(g.y0 + 2, g.y1 - 2), 1.6, 1.6, 1.2, 1.2);
          for (let i = 0; i < 2; i++) put(g, "caixa_dagua", uni(g.x0 + 3, g.x1 - 3), uni(g.y0 + 3, g.y1 - 3), 2.6, 2.6, 3.2, 1.5);
          wallRow(g, "jardineira", 3, 0.8, 0.7, uni(2, 4));
          for (let i = 0; i < 4; i++) put(g, "banco", uni(g.x0 + 2, g.x1 - 2), uni(g.y0 + 2, g.y1 - 2), 1.8, 0.5, 0.45, 1);
          put(g, "antena", uni(g.x0 + 2, g.x1 - 2), uni(g.y0 + 2, g.y1 - 2), 0.8, 0.8, 6, 1);
          continue;
        }
        const t = ar < 14 ? (r() < 0.6 ? "banheiro" : "arquivo") : ar < 36 ? ["copa", "deposito", "servidores", "escritorio", "arquivo"][Math.floor(r() * 5)]
          : ar < 90 ? ["escritorio", "escritorio", "reuniao", "estar", "copa", "deposito"][Math.floor(r() * 6)] : ["escritorio", "escritorio", "deposito", "estar"][Math.floor(r() * 4)];
        g.type = t;
        if (t === "escritorio") {
          // ilhas de 4 mesas (2 x 2) com cadeiras, corredores de 1,6 m
          const cw = 3.0, cd = 2.4, nx = Math.max(0, Math.floor((W - 3.4) / (cw + 1.6))), ny = Math.max(0, Math.floor((H - 3.4) / (cd + 1.8)));
          for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
            const x = g.cx + (i - (nx - 1) / 2) * (cw + 1.6), y = g.cy + (j - (ny - 1) / 2) * (cd + 1.8);
            if (!okAt(g, x, y, cw + 0.6, cd + 1.2, 0.2) || r() < 0.12) continue;
            for (const sx of [-1, 1]) for (const sy of [-1, 1]) { furn.push({ k: "mesa", x: x + sx * 0.75, y: y + sy * 0.4, w: 1.45, d: 0.75, h: 0.75, room: g.id }); furn.push({ k: "cadeira", x: x + sx * 0.75, y: y + sy * 1.15, w: 0.55, d: 0.55, h: 0.9, room: g.id }); if (r() < 0.7) furn.push({ k: "monitor", x: x + sx * 0.75, y: y + sy * 0.25, w: 0.55, d: 0.12, h: 1.2, room: g.id, deco: true }); }
          }
          wallRow(g, "gaveteiro", 0.9, 0.55, 1.3, uni(3, 7), [Math.floor(r() * 4)]);
          corners(g, "planta", 0.7, 1.5);
        } else if (t === "reuniao") {
          const L = (horiz ? W : H) - 4.2;
          if (L > 2) {
            const w = horiz ? L : 1.3, d = horiz ? 1.3 : L;
            if (put(g, "mesa_longa", g.cx, g.cy, w, d, 0.76, 0.9)) for (let u = -L / 2 + 0.5; u <= L / 2 - 0.4; u += 0.9) for (const s2 of [-1, 1]) furn.push(horiz ? { k: "cadeira", x: g.cx + u, y: g.cy + s2 * 1.0, w: 0.55, d: 0.55, h: 0.9, room: g.id } : { k: "cadeira", x: g.cx + s2 * 1.0, y: g.cy + u, w: 0.55, d: 0.55, h: 0.9, room: g.id });
          }
          wallRow(g, "quadro", 2.0, 0.12, 1.8, 3, [horiz ? 2 : 0]);
          corners(g, "planta", 0.7, 1.5);
        } else if (t === "copa") {
          const sd = Math.floor(r() * 4); wallRow(g, "balcao", 2.4, 0.65, 0.95, 0, [sd]);
          wallRow(g, "geladeira", 0.8, 0.75, 1.9, 6, [sd ^ 1]);
          for (let i = 0; i < 3; i++) { const x = uni(g.x0 + 2.2, g.x1 - 2.2), y = uni(g.y0 + 2.2, g.y1 - 2.2); if (put(g, "mesa_redonda", x, y, 1.1, 1.1, 0.75, 0.9)) for (const [a, b] of [[0.9, 0], [-0.9, 0], [0, 0.9], [0, -0.9]]) if (r() < 0.8) furn.push({ k: "cadeira", x: x + a, y: y + b, w: 0.5, d: 0.5, h: 0.9, room: g.id }); }
        } else if (t === "banheiro") {
          const sd = horiz ? 0 : 2; wallRow(g, "box", 1.0, 1.4, 2.0, 0.05, [sd]); wallRow(g, "pia", 0.9, 0.5, 0.9, 0.3, [sd ^ 1]);
        } else if (t === "deposito" || t === "arquivo" || t === "servidores") {
          const k = t === "servidores" ? "rack" : t === "arquivo" ? "arquivo" : "estante", dep = t === "servidores" ? 1.0 : 0.6, hh = t === "servidores" ? 2.1 : 2.0;
          const along = horiz ? H : W, across = horiz ? W : H, rows = Math.max(1, Math.floor((across - 2.6) / (dep + 1.5)));
          for (let i = 0; i < rows; i++) {
            const c = (horiz ? g.x0 : g.y0) + 1.6 + dep / 2 + i * (dep + 1.5), L = along - 3.6;
            if (L < 1.2) continue;
            const mid = horiz ? g.cy : g.cx;
            for (const half of [-1, 1]) { const len = L / 2 - 0.6, u = mid + half * (L / 4 + 0.3); if (len > 0.8) horiz ? put(g, k, c, u, dep, len, hh, 0.2) : put(g, k, u, c, len, dep, hh, 0.2); }   // fileira com passagem no meio
          }
          if (t === "deposito") for (let i = 0; i < 6; i++) put(g, "caixas", uni(g.x0 + 1, g.x1 - 1), uni(g.y0 + 1, g.y1 - 1), 0.8, 0.8, 0.8, 0.4);
        } else if (t === "estar") {
          wallRow(g, "sofa", 2.1, 0.9, 0.85, uni(1.2, 3));
          put(g, "mesinha", g.cx, g.cy, 1.2, 0.7, 0.45, 0.6);
          wallRow(g, "tv", 1.6, 0.25, 1.4, 4, [Math.floor(r() * 4)]);
          corners(g, "planta", 0.7, 1.5);
        }
      }
      // nada encostado nas portas nem em cima da chegada/escada (cadeiras e monitores entram direto, sem a checagem do put)
      for (let i = furn.length - 1; i >= 0; i--) {
        const f = furn[i]; if (f.locker) continue;
        const blocks = doors.some((d) => Math.abs(d.x - f.x) < f.w / 2 + (d.axis === "x" ? 1.0 : d.w / 2 + 0.5) && Math.abs(d.y - f.y) < f.d / 2 + (d.axis === "y" ? 1.0 : d.w / 2 + 0.5))
          || keep.some((k) => Math.abs(k[0] - f.x) < f.w / 2 + k[2] * 0.8 && Math.abs(k[1] - f.y) < f.d / 2 + k[2] * 0.8);
        if (blocks) furn.splice(i, 1);
      }
      const KINDS = ["bandagem", "kit", "garrafa", "sinalizador", "bateria"];
      const items = [];
      const drop = (kind) => { for (let i = 0; i < 80; i++) { const g = rooms[Math.floor(r() * rooms.length)], x = uni(g.x0 + 1, g.x1 - 1), y = uni(g.y0 + 1, g.y1 - 1); if (!free(x, y, 1.5) || hit(x, y, 0.4, 0.4, 0.15)) continue; items.push({ kind, x, y, room: g.id }); taken.push([x, y]); return; } };
      for (let i = 0; i < LV.bat; i++) drop("bateria");
      for (let i = 0; i < LV.items; i++) drop(KINDS[Math.floor(r() * 4)]);
      const nz = Math.round(LV.zBase + floor * LV.zFloor), zombies = [];
      for (let i = 0; i < 200 && zombies.length < nz; i++) {
        const g = regs[Math.floor(r() * regs.length)]; if (g.id === startReg.id) continue;
        const x = uni(g.x0 + 1, g.x1 - 1), y = uni(g.y0 + 1, g.y1 - 1);
        if (Math.hypot(x - arrive.x, y - arrive.y) < 14 || hit(x, y, 0.5, 0.5, 0.2)) continue;
        zombies.push({ x, y, room: g.id, hidden: AI[LV.ai].hide && r() < 0.35 });   // nível 5: parte deles fica escondida esperando
      }
      return { A, level, floor, top, regs, doors, walls, arrive, up, elev, exit, lockers, items, zombies, furn, dist, ai: AI[LV.ai], TYPES };
    }
    return { A, LEVELS, AI, plan };
  })();
