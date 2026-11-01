// ==MAPA ITÁLIA== (só o protótipo do modo Infecção)
// Coordenadas lógicas: x = leste, y = norte, z = altura (m). Caixas sólidas: [x0, x1, y0, y1, topo, base, tipo, extra]
const ITALIA = (function () {
  const A = 60;                                   // mapa de 120 x 120 m
  const S = [];                                   // colisão
  const D = { houses: [], shops: [], carts: [], stalls: [], trees: [], terraces: [], stairs: [], tables: [], lamps: [], chapel: null, tower: null, fountain: null, crates: [], barrels: [], hay: [], benches: [], umbrellas: [] };
  const box = (x0, x1, y0, y1, h, z0, kind, extra) => {
    z0 = z0 || 0;
    const b = [Math.min(x0, x1), Math.max(x0, x1), Math.min(y0, y1), Math.max(y0, y1), z0 + h, z0, kind || "", extra];
    S.push(b); return b;
  };
  const rect = (cx, cy, w, d, h, z0, kind, extra) => box(cx - w / 2, cx + w / 2, cy - d / 2, cy + d / 2, h, z0, kind, extra);
  let seed = 1234567;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  // ---------------- muralha da cidade ----------------
  const WT = 1.6, WH = 7;
  box(-A - WT, A + WT, A, A + WT, WH, 0, "citywall"); box(-A - WT, A + WT, -A - WT, -A, WH, 0, "citywall");
  box(A, A + WT, -A, A, WH, 0, "citywall"); box(-A - WT, -A, -A, A, WH, 0, "citywall");

  // ---------------- praça central com chafariz ----------------
  D.fountain = { x: 0, y: 0 };
  rect(0, 0, 5, 5, 0.85, 0, "fountain");
  rect(0, 0, 0.9, 0.9, 2.6, 0, "fountaincol");

  // ---------------- lojas (blocos sem interior, só fachada) ----------------
  // face: lado da fachada ("n","s","l","o"); nomes inventados
  const shop = (cx, cy, w, d, h, face, name, kind, color) => {
    const b = rect(cx, cy, w, d, h, 0, "shop", { face, name, kind, color });
    D.shops.push({ cx, cy, w, d, h, face, name, kind, color, b });
  };
  // ao redor da praça (praça: x,y em [-14,14]; ruas de 8 m em x,y ∈ [-4,4])
  shop(-9, 18.5, 10, 9, 8, "s", "PIZZERIA BELLA NAPOLI", "pizza", 0);
  shop(9, 18.5, 10, 9, 9, "s", "GELATERIA", "gelato", 1);
  shop(-9, -18.5, 10, 9, 8.5, "n", "TRATTORIA", "trattoria", 2);
  shop(9, -18.5, 10, 9, 7.5, "n", "PANETTERIA", "pane", 3);
  shop(-18.5, 9, 9, 10, 9, "l", "CAFFÈ", "caffe", 4);
  shop(-18.5, -9, 9, 10, 8, "l", "SALUMERIA", "salumi", 5);
  shop(18.5, 9, 9, 10, 8.5, "o", "PASTICCERIA", "dolci", 6);
  shop(18.5, -9, 9, 10, 9.5, "o", "ENOTECA", "vino", 0);
  // rua leste (faixa x 26..56, y -22..22)
  shop(30, 14, 9, 12, 8, "o", "PIZZERIA AL FORNO", "pizza", 3);
  shop(30, -14, 9, 12, 7.5, "o", "OSTERIA", "trattoria", 5);
  shop(52, 0, 9, 20, 9, "o", "MERCATO COPERTO", "mercato", 1);
  // rua norte (x -22..22, y 26..56)
  shop(-14, 32, 12, 8, 8, "l", "MACELLERIA", "carne", 2);
  shop(14, 32, 12, 8, 8.5, "o", "FORMAGGI", "formaggi", 4);
  shop(-14, 52, 12, 9, 9, "l", "PIZZA AL TAGLIO", "pizza", 6);
  shop(14, 52, 12, 9, 8, "o", "PESCHERIA", "pesce", 0);
  // rua sul (x -22..22, y -56..-26)
  shop(-14, -32, 12, 8, 8, "l", "FRUTTA E VERDURA", "frutta", 3);
  shop(14, -32, 12, 8, 7.5, "o", "PASTA FRESCA", "pasta", 1);
  shop(-14, -52, 12, 9, 9, "l", "BAR SPORT", "caffe", 5);

  // ---------------- casas com interior (paredes com porta e janelas) ----------------
  const HW = 0.3, HH = 4.2;
  // parede ao longo de um eixo com aberturas: {c: centro ao longo da parede, w: largura, t: "door"|"win"}
  function wall(x0, y0, x1, y1, open, kind, z0) {
    z0 = z0 || 0;
    const horiz = Math.abs(y1 - y0) < 1e-6, a0 = horiz ? Math.min(x0, x1) : Math.min(y0, y1), a1 = horiz ? Math.max(x0, x1) : Math.max(y0, y1);
    const fixed = horiz ? y0 : x0;
    const seg = (s0, s1, h, zz) => { if (s1 - s0 < 0.02) return; if (horiz) box(s0, s1, fixed - HW / 2, fixed + HW / 2, h, zz, kind); else box(fixed - HW / 2, fixed + HW / 2, s0, s1, h, zz, kind); };
    let p = a0;
    for (const o of (open || []).slice().sort((u, v) => u.c - v.c)) {
      const s0 = a0 + o.c - o.w / 2, s1 = a0 + o.c + o.w / 2;
      seg(p, s0, HH, z0);
      if (o.t === "door") seg(s0, s1, HH - 2.35, z0 + 2.35);                         // verga da porta (passa por baixo)
      else { seg(s0, s1, 1.0, z0); seg(s0, s1, HH - 2.2, z0 + 2.2); }                // janela: peitoril + verga (dá para atirar pela janela)
      p = s1;
    }
    seg(p, a1, HH, z0);
  }
  // casa retangular; door: lado da porta ("n","s","l","o"); split: parede interna
  function house(cx, cy, w, d, door, color, furn, z0) {
    z0 = z0 || 0;
    const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - d / 2, y1 = cy + d / 2;
    const K = "hwall" + color;
    const wins = (len) => { const n = Math.max(1, Math.floor(len / 3.4)); const r = []; for (let i = 0; i < n; i++) r.push({ c: (len / n) * (i + 0.5), w: 1.2, t: "win" }); return r; };
    const withDoor = (len) => { const r = wins(len).filter((o) => Math.abs(o.c - len / 2) > 1.6); r.push({ c: len / 2, w: 1.7, t: "door" }); return r; };
    wall(x0, y1, x1, y1, door === "n" ? withDoor(w) : wins(w), K, z0);
    wall(x0, y0, x1, y0, door === "s" ? withDoor(w) : wins(w), K, z0);
    wall(x1, y0, x1, y1, door === "l" ? withDoor(d) : wins(d), K, z0);
    wall(x0, y0, x0, y1, door === "o" ? withDoor(d) : wins(d), K, z0);
    // parede interna com passagem (dois cômodos)
    // fora do eixo da porta de entrada, para não bloquear quem entra
    if (w >= d) { const px = cx + w * 0.17; wall(px, y0 + HW, px, y1 - HW, [{ c: (d - 2 * HW) * 0.5, w: 1.4, t: "door" }], "hinner", z0); }
    else { const py = cy + d * 0.17; wall(x0 + HW, py, x1 - HW, py, [{ c: (w - 2 * HW) * 0.5, w: 1.4, t: "door" }], "hinner", z0); }
    // móveis (esconderijos dentro)
    for (const f of furn || []) {
      const fx = cx + f[0] * (w / 2 - 0.9), fy = cy + f[1] * (d / 2 - 0.9);
      rect(fx, fy, f[2], f[3], f[4], z0, "furn_" + f[5]);
    }
    D.houses.push({ cx, cy, w, d, door, color, z0, h: HH });
  }
  // [fx, fy (-1..1 relativo), largura, profundidade, altura, tipo]
  const F1 = [[-0.8, 0.7, 1.8, 1.0, 0.8, "table"], [-0.8, -0.75, 1.2, 0.5, 1.9, "cabinet"], [0.75, 0.7, 2.0, 1.4, 0.6, "bed"], [0.8, -0.8, 1.6, 0.6, 1.0, "dresser"]];
  const F2 = [[-0.7, -0.7, 2.2, 0.9, 0.9, "sofa"], [-0.75, 0.75, 1.4, 0.6, 2.0, "cabinet"], [0.7, 0.6, 1.6, 1.0, 0.8, "table"], [0.85, -0.8, 1.0, 1.0, 1.2, "crate"]];
  house(-40, 42, 12, 9, "s", 0, F1);              // NO
  house(-40, 26.5, 11, 8, "n", 1, F2);           // NO, de frente para a primeira
  house(-42, -2, 9, 12, "l", 2, F1);             // oeste
  house(-42, 14, 9, 10, "l", 3, F2);             // oeste
  house(40, -42, 12, 9, "n", 4, F2);             // SE (mercado)
  house(45.5, 45, 11, 9, "s", 2, F1, 5.0);       // no alto do morro grande
  house(-46, -30.5, 10, 8, "n", 5, F1);          // pé do morro da capela

  // ---------------- morro grande com terraços (NE) e escadas ----------------
  function terrace(x0, x1, y0, y1, top, base) { box(x0, x1, y0, y1, top - (base || 0), base || 0, "terrace"); D.terraces.push({ x0, x1, y0, y1, top, base: base || 0 }); }
  // escada: sobe de 'from' até 'to' ao longo de um eixo; dir: "+x","-x","+y","-y" (sentido da subida)
  function stairs(x0, x1, y0, y1, from, to, dir) {
    const rise = 0.25, n = Math.max(1, Math.round((to - from) / rise)), along = dir[1] === "x";
    const L = along ? x1 - x0 : y1 - y0, run = L / n;
    for (let i = 0; i < n; i++) {
      const top = from + rise * (i + 1);
      let a0, a1;
      if (dir[0] === "+") { a0 = (along ? x0 : y0) + run * i; a1 = along ? x1 : y1; } else { a0 = along ? x0 : y0; a1 = (along ? x1 : y1) - run * i; }
      if (along) box(a0, a1, y0, y1, top - from, from, "step"); else box(x0, x1, a0, a1, top - from, from, "step");
    }
    D.stairs.push({ x0, x1, y0, y1, from, to, dir });
  }
  terrace(30, 58, 28, 58, 2.5);                  // nível 1
  terrace(38, 58, 38, 58, 5.0, 2.5);             // nível 2 (casa no alto)
  stairs(24, 30, 33, 36, 0, 2.5, "+x");          // da rua até o nível 1 (oeste)
  stairs(44, 47, 22, 28, 0, 2.5, "+y");          // da rua até o nível 1 (sul)
  stairs(32, 38, 47, 50, 2.5, 5.0, "+x");        // nível 1 -> 2
  stairs(52, 55, 32, 38, 2.5, 5.0, "+y");        // nível 1 -> 2 (lado leste)
  for (const t of [[34, 31], [36, 53], [55, 31], [49, 33], [33, 42]]) { rect(t[0], t[1], 0.45, 0.45, 2.2, 2.5, "trunk"); D.trees.push({ x: t[0], y: t[1], z: 2.5, k: "olive" }); }
  for (const t of [[41, 40], [56, 41], [41, 56]]) { rect(t[0], t[1], 0.4, 0.4, 2.2, 5.0, "trunk"); D.trees.push({ x: t[0], y: t[1], z: 5.0, k: "cypress" }); }

  // ---------------- morro da capela (SO) ----------------
  terrace(-58, -28, -58, -38, 3.0);
  stairs(-38, -35, -38, -31, 0, 3.0, "-y");      // vem da rua (norte) subindo para o sul
  stairs(-28, -22, -50, -47, 0, 3.0, "-x");      // vem do leste
  D.chapel = { cx: -46, cy: -48, w: 9, d: 13, z: 3.0 };
  rect(-46, -48, 9, 13, 8, 3.0, "chapel");
  D.tower = { x: -39.5, y: -54, w: 3.2, z: 3.0, h: 14 };
  rect(-39.5, -54, 3.2, 3.2, 14, 3.0, "tower");
  for (const t of [[-55, -42], [-33, -44], [-52, -55], [-30, -56]]) { rect(t[0], t[1], 0.4, 0.4, 2.2, 3.0, "trunk"); D.trees.push({ x: t[0], y: t[1], z: 3.0, k: "cypress" }); }

  // ---------------- mercado (SE): barracas, carroças, caixas ----------------
  const stall = (x, y, rot, c) => { rect(x, y, rot ? 1.2 : 3, rot ? 3 : 1.2, 1.0, 0, "stall"); D.stalls.push({ x, y, rot, c }); };
  stall(30, -30, 0, 0); stall(36, -30, 0, 1); stall(30, -36, 1, 2); stall(50, -30, 0, 3); stall(50, -52, 1, 1); stall(28, -50, 0, 0);
  const cart = (x, y, rot) => { rect(x, y, rot ? 1.7 : 3.2, rot ? 3.2 : 1.7, 1.35, 0, "cart"); D.carts.push({ x, y, rot }); };
  [[-2, 30, 0], [2.5, -34, 1], [-30, 6, 1], [34, 4, 0], [24, -44, 0], [-24, 44, 1], [-2, -48, 0], [44, -24, 1], [-50, 20, 0], [10, 44, 1], [-34, -12, 0], [52, 14, 1]].forEach((c) => cart(c[0], c[1], c[2]));
  const crate = (x, y, s, h) => { rect(x, y, s, s, h, 0, "crate"); D.crates.push({ x, y, s, h, z: 0 }); };
  for (let i = 0; i < 60; i++) {
    const x = (rnd() * 2 - 1) * (A - 4), y = (rnd() * 2 - 1) * (A - 4), s = 1.0 + rnd() * 0.6;
    if (Math.abs(x) < 6 || Math.abs(y) < 6) { if (rnd() < 0.7) continue; }            // ruas principais mais livres
    if (S.some((b) => x + s > b[0] - 1.2 && x - s < b[1] + 1.2 && y + s > b[2] - 1.2 && y - s < b[3] + 1.2)) continue;
    crate(x, y, s, s * (rnd() < 0.3 ? 1.6 : 1));
  }
  for (let i = 0; i < 40; i++) {
    const x = (rnd() * 2 - 1) * (A - 4), y = (rnd() * 2 - 1) * (A - 4);
    if (S.some((b) => x > b[0] - 1.0 && x < b[1] + 1.0 && y > b[2] - 1.0 && y < b[3] + 1.0)) continue;
    rect(x, y, 0.75, 0.75, 1.0, 0, "barrel"); D.barrels.push({ x, y, z: 0 });
  }
  // fardos de feno perto das casas do NO
  [[-30, 36], [-50, 34], [-30, 20], [-52, 8]].forEach((h) => { rect(h[0], h[1], 2.2, 1.2, 1.1, 0, "hay"); D.hay.push({ x: h[0], y: h[1] }); });
  // mesas com guarda-sol em frente às lojas (cobertura baixa)
  [[-9, 12, 0], [-5, 12, 1], [9, 12.2, 2], [-12, -12, 0], [11, -12.3, 1], [24.5, 14, 2], [24.5, 10, 0]].forEach((t) => { rect(t[0], t[1], 1.0, 1.0, 0.8, 0, "table"); D.umbrellas.push({ x: t[0], y: t[1], c: t[2] }); });
  // bancos na praça
  [[-8, 0, 1], [8, 0, 1], [0, 8, 0], [0, -8, 0]].forEach((b) => { rect(b[0], b[1], b[2] ? 0.6 : 2.2, b[2] ? 2.2 : 0.6, 0.5, 0, "bench"); D.benches.push({ x: b[0], y: b[1], rot: b[2] }); });

  // ---------------- postes de luz ----------------
  const lamps = [[-6, 6], [6, 6], [-6, -6], [6, -6], [0, 30], [0, -30], [30, 0], [-30, 0], [-35, 34], [40, -34], [-46, -38], [44, 30]];
  for (const l of lamps) { rect(l[0], l[1], 0.25, 0.25, 4.4, 0, "lamp"); D.lamps.push({ x: l[0], y: l[1] }); }

  // ---------------- boosters ----------------
  // speed: +40% de velocidade por 8 s (humanos e infectados) · health: humano +50 de vida / infectado +400
  const boosts = [
    { x: 0, y: 11, k: "speed" }, { x: -11, y: 0, k: "health" }, { x: 34.5, y: 34.5, z: 2.5, k: "speed" }, { x: 48, y: 50, z: 5.0, k: "health" },
    { x: -42, y: 42, k: "speed" }, { x: -42, y: -5, k: "health" }, { x: 37, y: -42, k: "speed" }, { x: -46, y: -40, z: 3.0, k: "health" },
    { x: 0, y: -50, k: "speed" }, { x: 0, y: 50, k: "health" }, { x: 42, y: -14, k: "speed" }, { x: -52, y: 26, k: "speed" },
  ];
  // pontos de volta do infectado (longe do centro)
  const zspawns = [[-54, 54], [0, 56], [54, -56], [-56, -20], [56, 20], [-26, -56], [24, 56], [-56, 50], [-4, -56], [56, -20]];
  // chão: maior topo alcançável (não sobe mais que 'step' de uma vez)
  return { A, boxes: S, decor: D, boosts, zspawns, lamps: D.lamps };
})();
