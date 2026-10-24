  // ======================================================================
  //  ROSTO, CABELO E FERIMENTOS DOS ZUMBIS
  //  - cabeça esculpida (testa, arcada, órbitas fundas, maçãs, nariz, lábios, queixo)
  //  - pele pintada na hora: palidez, manchas roxas, veias, barba, sangue, feridas
  //  - cabelo de mechas (cartões com textura de fios) em vários penteados
  //  - tudo sorteado quando o zumbi nasce: cada um pode ou não ter partes faltando
  // ======================================================================
  const ZH = (function () {
    const TAU = Math.PI * 2;
    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const sstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
    const gs = (x, s) => Math.exp(-(x * x) / (2 * s * s));
    const lerp = (a, b, t) => a + (b - a) * t;
    const HEAD = { rx: 0.079, ry: 0.109, rz: 0.097 };
    const HZ = 0.118;                       // altura do centro da cabeça sobre a articulação do pescoço
    const mkCanvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
    const rgba = (c, a) => "rgba(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + "," + a + ")";
    const colArr = (c) => [c.r * 255, c.g * 255, c.b * 255];
    const mulC = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
    const mixC = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

    // linha do cabelo: ângulo polar (0 = topo) onde o couro cabeludo acaba, conforme o lado (0 nuca ... PI testa)
    const hairline = (az, recede) => 2.1 - 1.15 * sstep(0.3, 2.7, Math.abs(az)) + (recede || 0) * sstep(1.6, 3.0, Math.abs(az));

    // ---------------------------------------------------------------- cabeça esculpida
    const headCache = {};
    function headGeo(shape) {
      const key = shape.id;
      if (headCache[key]) return headCache[key];
      const WS = 64, HS = 60;
      const g = new THREE.SphereGeometry(1, WS, HS);
      const pos = g.attributes.position, n = pos.count;
      const S = shape;
      for (let i = 0; i < n; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const ny = y, ring = Math.sqrt(Math.max(1e-6, 1 - ny * ny));
        const lon = Math.asin(clamp01((x / ring + 1) / 2) * 2 - 1), a = Math.abs(lon);
        const fw = sstep(0.1, 0.55, -z);
        let d = 0;
        d += 0.005 * gs(ny - 0.5, 0.3) * gs(lon, 0.9);                                       // testa
        d += S.brow * gs(ny - 0.2, 0.07) * gs(a - 0.34, 0.32);                               // arcada
        d -= S.sink * gs(ny - 0.06, 0.11) * gs(a - 0.42, 0.16);                              // órbitas
        d += 0.0065 * gs(ny + 0.1, 0.14) * gs(a - 0.68, 0.22);                               // maçã do rosto
        d -= S.hollow * gs(ny + 0.38, 0.18) * gs(a - 0.62, 0.26);                            // bochecha oca
        d -= 0.004 * gs(a - 1.15, 0.22) * gs(ny - 0.2, 0.22);                                // têmporas
        d += S.nose * (0.5 * gs(lon, 0.11) * sstep(0.2, -0.2, ny) * sstep(-0.45, -0.3, ny)  // nariz: dorso
          + 1.15 * gs(lon, 0.12) * gs(ny + 0.28, 0.075)                                       //         ponta
          + 0.4 * gs(a - 0.2, 0.07) * gs(ny + 0.31, 0.065));                                 //         asas
        d -= 0.0045 * gs(a - 0.09, 0.05) * gs(ny + 0.345, 0.035);                            // narinas
        d += S.lip * gs(lon, 0.3) * gs(ny + 0.44, 0.05);                                     // lábio superior
        d += S.lip * 1.15 * gs(lon, 0.27) * gs(ny + 0.575, 0.055);                           // lábio inferior
        d -= 0.0055 * gs(lon, 0.34) * gs(ny + 0.505, 0.032);                                 // fenda da boca
        d += S.chin * gs(lon, 0.22) * gs(ny + 0.86, 0.12);                                   // queixo
        let px = x * HEAD.rx * S.w, py = y * HEAD.ry * S.h, pz = z * HEAD.rz * S.d;
        const taper = sstep(-0.05, -0.95, ny) * S.jaw;
        px *= 1 - 0.36 * taper;
        if (z > 0) pz *= 1 + 0.04 * sstep(0.4, 1, z) * sstep(-0.2, 0.7, ny);                  // nuca/crânio um pouco mais cheios
        pz -= d * fw;
        pos.setXYZ(i, px, py, pz);
      }
      g.computeVertexNormals();
      // costura (atrás) e polos: iguala as normais dos vértices repetidos
      const nor = g.attributes.normal;
      for (let iy = 0; iy <= HS; iy++) {
        const a0 = iy * (WS + 1), a1 = a0 + WS;
        const nx = nor.getX(a0) + nor.getX(a1), ny2 = nor.getY(a0) + nor.getY(a1), nz = nor.getZ(a0) + nor.getZ(a1), l = Math.hypot(nx, ny2, nz) || 1;
        nor.setXYZ(a0, nx / l, ny2 / l, nz / l); nor.setXYZ(a1, nx / l, ny2 / l, nz / l);
      }
      for (const iy of [0, HS]) for (let ix = 0; ix <= WS; ix++) nor.setXYZ(iy * (WS + 1) + ix, 0, iy ? -1 : 1, 0);
      // separa crânio (linhas 0..40) e mandíbula (40..60); a mandíbula ganha pesos para abrir a boca
      const idx = g.index.array, uv = g.attributes.uv;
      const rowOf = (i) => Math.floor(i / (WS + 1));
      const split = (pred) => {
        const map = new Map(), P = [], N = [], U = [], W = [], I = [];
        for (let t = 0; t < idx.length; t += 3) {
          const a = idx[t], b = idx[t + 1], c = idx[t + 2];
          if (!pred(rowOf(a), rowOf(b), rowOf(c))) continue;
          for (const v of [a, b, c]) {
            if (!map.has(v)) {
              map.set(v, P.length / 3);
              P.push(pos.getX(v), pos.getY(v), pos.getZ(v)); N.push(nor.getX(v), nor.getY(v), nor.getZ(v)); U.push(uv.getX(v), uv.getY(v));
              const row = rowOf(v), ux = v % (WS + 1), phi = (ux / WS) * TAU, uz = Math.sin(phi);                // z da esfera unitária
              W.push(row >= 40 ? sstep(0.55, -0.15, uz) : 0);
            }
            I.push(map.get(v));
          }
        }
        const gg = new THREE.BufferGeometry();
        gg.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); gg.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3));
        gg.setAttribute("uv", new THREE.Float32BufferAttribute(U, 2)); gg.setAttribute("jawW", new THREE.Float32BufferAttribute(W, 1)); gg.setIndex(I);
        return gg;
      };
      const out = { skull: split((a, b, c) => Math.max(a, b, c) <= 40), jaw: split((a, b, c) => Math.min(a, b, c) >= 40) };
      g.dispose();
      headCache[key] = out;
      return out;
    }
    // formas de rosto: mulheres e homens, vários tipos
    function faceShape(r, fem, dead) {
      const v = () => r() - 0.5;
      return {
        id: (fem ? "f" : "m") + Math.floor(r() * 5) + (dead > 0.5 ? "d" : "l"),
        w: 1 + v() * 0.1, h: 1 + v() * 0.08, d: 1 + v() * 0.08, jaw: fem ? 0.55 + r() * 0.2 : 0.75 + r() * 0.3,
        brow: fem ? 0.0035 : 0.0075, sink: 0.007 + dead * 0.006, hollow: 0.004 + dead * 0.01, nose: fem ? 0.0135 + r() * 0.004 : 0.017 + r() * 0.004,
        lip: fem ? 0.0055 : 0.0038, chin: fem ? 0.008 : 0.012,
      };
    }
    // a seed do desenho do rosto depende só da id => cache funciona; mas "dead" varia por zumbi, então guardamos o id dentro
    function headFor(r, fem, dead) {
      // formas fixas por id para o cache funcionar: usa um gerador próprio com a id
      const id = (fem ? "f" : "m") + Math.floor(r() * 5) + (dead > 0.5 ? "d" : "l");
      const rr = mulberry(hashStr(id));
      const sh = faceShape(rr, fem, dead > 0.5 ? 1 : 0.2);
      sh.id = id;
      return { shape: sh, geo: headGeo(sh) };
    }
    function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
    function mulberry(seed) {
      let a = seed >>> 0;
      return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    }

    // ---------------------------------------------------------------- pintura do rosto (textura 512x256 em volta da cabeça)
    const FW = 512, FH = 256;
    const fx = (lon) => (0.75 - lon / TAU) * FW;
    const fy = (ny) => (Math.acos(clamp01((ny + 1) / 2) * 2 - 1) / Math.PI) * FH;
    function paintFace(r, o) {
      const cv = mkCanvas(FW, FH), c = cv.getContext("2d");
      const skin = o.skin, hair = o.hairRGB;
      c.fillStyle = rgba(skin, 1); c.fillRect(0, 0, FW, FH);
      // manchas de pele morta
      const blot = (lon, ny, rl, rn, col, al) => {
        const sy = Math.max(0.35, Math.sin(Math.acos(clamp01((ny + 1) / 2) * 2 - 1)));
        const X = fx(lon), Y = fy(ny), rx = (rl / TAU) * FW, ry = (rn * (FH / Math.PI)) / sy;
        c.save(); c.translate(X, Y); c.scale(1, ry / rx);
        const gr = c.createRadialGradient(0, 0, 0, 0, 0, rx);
        gr.addColorStop(0, rgba(col, al)); gr.addColorStop(1, rgba(col, 0));
        c.fillStyle = gr; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
      };
      const dead = o.dead;
      for (let i = 0; i < 26; i++) {
        const col = r() < 0.4 ? [92, 66, 110] : r() < 0.5 ? [118, 128, 70] : r() < 0.5 ? [150, 80, 82] : [70, 80, 96];
        blot((r() * 2 - 1) * 1.6, (r() * 2 - 1) * 0.95, 0.25 + r() * 0.5, 0.12 + r() * 0.35, col, 0.05 + r() * 0.13 * dead);
      }
      blot(0, 0.55, 1.6, 0.35, mulC(skin, 1.15), 0.2);                       // testa mais clara
      for (const s of [-1, 1]) { blot(s * 1.45, -0.1, 0.5, 0.9, [30, 22, 34], 0.35); blot(s * 0.6, -0.25, 0.3, 0.3, [90, 50, 60], 0.12); }  // laterais escuras
      blot(0, -0.8, 0.7, 0.3, [60, 44, 54], 0.14 * dead);                    // sob o queixo
      // pele pontilhada (poros / textura)
      for (let i = 0; i < 2600; i++) { const x = r() * FW, y = r() * FH; c.fillStyle = r() < 0.5 ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.035)"; c.fillRect(x, y, 1 + (r() < 0.2), 1); }
      // olheiras e órbitas
      for (const s of [-1, 1]) {
        blot(s * 0.42, 0.04, 0.3, 0.2, [38, 20, 44], 0.55 * (0.6 + 0.4 * dead));
        blot(s * 0.42, -0.08, 0.24, 0.1, [96, 60, 120], 0.3 * dead);
        blot(s * 0.42, 0.07, 0.16, 0.09, [14, 8, 14], 0.65);
      }
      // sobrancelhas
      if (!o.noBrows) {
        c.lineCap = "round";
        for (const s of [-1, 1]) {
          const thick = o.fem ? 1.2 : 2.6;
          for (let k = 0; k < 26; k++) {
            const t = r(), lon0 = s * (0.2 + t * 0.44), ny0 = 0.21 + 0.06 * Math.sin(t * 2.4) - 0.03 * t * t + (r() - 0.5) * 0.03;
            c.strokeStyle = rgba(mixC(hair, [30, 22, 20], 0.4), 0.55 + 0.4 * r()); c.lineWidth = thick * (1 - t * 0.5) * (0.6 + r() * 0.6);
            c.beginPath(); c.moveTo(fx(lon0), fy(ny0)); c.lineTo(fx(lon0 + s * 0.05), fy(ny0 + 0.012 * (0.5 - t) )); c.stroke();
          }
        }
      }
      // pálpebras (traço escuro em volta do olho)
      c.strokeStyle = "rgba(20,8,16,0.65)"; c.lineWidth = 2;
      for (const s of [-1, 1]) {
        c.beginPath(); c.ellipse(fx(s * 0.42), fy(0.055), 15, 8, 0, 0, TAU); c.stroke();
        c.strokeStyle = "rgba(90,40,50,0.4)"; c.beginPath(); c.ellipse(fx(s * 0.42), fy(0.055), 18, 11, 0, 0, TAU); c.stroke(); c.strokeStyle = "rgba(20,8,16,0.65)";
      }
      // nariz: sombra e narinas
      blot(0, -0.31, 0.12, 0.07, [20, 8, 10], 0.9);
      for (const s of [-1, 1]) blot(s * 0.09, -0.335, 0.045, 0.035, [14, 4, 6], 0.95);
      blot(0, -0.38, 0.22, 0.05, [40, 20, 30], 0.3);
      // boca: lábios arroxeados/secos
      const lipC = mixC(skin, [128, 70, 86], 0.55);
      c.fillStyle = rgba(mulC(lipC, 0.85), 0.9);
      c.beginPath(); c.ellipse(fx(0), fy(-0.45), 22, 5.5, 0, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(fx(0), fy(-0.575), 20, 6, 0, 0, TAU); c.fill();
      c.strokeStyle = "rgba(14,2,4,0.95)"; c.lineWidth = 2.4; c.beginPath(); c.moveTo(fx(-0.31), fy(-0.505)); c.quadraticCurveTo(fx(0), fy(-0.515), fx(0.31), fy(-0.505)); c.stroke();
      c.strokeStyle = "rgba(60,20,30,0.7)"; c.lineWidth = 1;
      for (let i = 0; i < 12; i++) { const lon0 = (r() - 0.5) * 0.5; c.beginPath(); c.moveTo(fx(lon0), fy(-0.47)); c.lineTo(fx(lon0 + (r() - 0.5) * 0.02), fy(-0.54)); c.stroke(); }
      // barba por fazer / barba
      if (o.stubble > 0) {
        for (let i = 0; i < 2600 * o.stubble; i++) {
          const lon = (r() * 2 - 1) * 1.05, ny = -0.12 - r() * 0.8;
          if (Math.abs(lon) < 0.35 && ny > -0.4) continue;               // não no nariz/entre o nariz e a boca (bigode é separado)
          c.fillStyle = rgba(mixC(hair, [20, 16, 14], 0.3), 0.35 + 0.4 * r());
          c.fillRect(fx(lon), fy(ny), 1.4, 1.4);
        }
      }
      // couro cabeludo: cabelo curto/raspado pintado + pele nua em calvos
      if (o.scalp !== "none") {
        for (let ix = 0; ix < FW; ix += 2) {
          const phi = (ix / FW), az = (phi - 0.75) * TAU;                 // 0 = frente
          const azz = Math.PI - Math.abs(wrapPi(az));                     // 0 = nuca, PI = testa
          let th = hairline(azz, o.recede || 0);
          let yStart = 0;
          if (o.scalp === "sides") { th = th * sstep(0.9, 2.0, Math.abs(wrapPi(az))); yStart = (1.1 / Math.PI) * FH; }       // calvície: só laterais/nuca
          if (o.scalp === "mohawk") th = Math.abs(wrapPi(az)) > 2.65 || Math.abs(wrapPi(az)) < 0.45 ? th : 0.0;
          if (th <= 0.02) continue;
          const yEnd = (th / Math.PI) * FH;
          if (yEnd <= yStart + 1) continue;
          const grd = c.createLinearGradient(0, yStart, 0, yEnd);
          const hc = mixC(hair, [10, 8, 8], o.scalp === "buzz" ? 0.35 : 0.1);
          grd.addColorStop(0, rgba(hc, 0.98)); grd.addColorStop(0.85, rgba(hc, o.scalp === "buzz" ? 0.55 : 0.9)); grd.addColorStop(1, rgba(hc, 0));
          c.fillStyle = grd; c.fillRect(ix, yStart, 2, yEnd - yStart);
        }
        // fios do cabelo curto
        c.lineWidth = 1;
        for (let i = 0; i < 900; i++) {
          const ix = r() * FW, y0 = r() * FH * 0.4;
          c.strokeStyle = rgba(mulC(hair, 0.6 + r() * 0.8), 0.25);
          c.beginPath(); c.moveTo(ix, y0); c.lineTo(ix + (r() - 0.5) * 3, y0 + 6 + r() * 10); c.stroke();
        }
      }
      // veias
      c.lineCap = "round";
      const vein = (lon, ny, ang, len, w) => {
        let X = fx(lon), Y = fy(ny);
        for (let i = 0; i < len; i++) {
          const nx = X + Math.cos(ang) * 4, nyy = Y + Math.sin(ang) * 4;
          c.strokeStyle = "rgba(60,80,92," + (0.32 * (1 - i / len)) + ")"; c.lineWidth = w * (1 - i / len) + 0.4;
          c.beginPath(); c.moveTo(X, Y); c.lineTo(nx, nyy); c.stroke();
          X = nx; Y = nyy; ang += (r() - 0.5) * 0.9;
        }
      };
      for (let k = 0; k < 6 * dead + 1; k++) { const s = r() < 0.5 ? -1 : 1; vein(s * (0.55 + r() * 0.5), 0.3 + r() * 0.3, s > 0 ? Math.PI * 0.9 : 0.1, 10 + Math.floor(r() * 12), 1.6); }
      for (let k = 0; k < 4 * dead; k++) { const s = r() < 0.5 ? -1 : 1; vein(s * (0.2 + r() * 0.2), 0.06, s > 0 ? Math.PI * 0.2 : Math.PI * 0.8, 8 + Math.floor(r() * 8), 1.4); }
      // hematomas
      for (let k = 0; k < Math.floor(r() * 3.2 * dead); k++) blot((r() * 2 - 1) * 0.8, -0.4 + r() * 0.8, 0.12 + r() * 0.16, 0.1 + r() * 0.12, r() < 0.5 ? [86, 40, 98] : [96, 110, 40], 0.4);
      // ----------------- ferimentos no rosto (lista sorteada na criação) -----------------
      const BLD = [112, 6, 8], DRY = [64, 8, 10], FLESH = [150, 40, 46], BONE = [214, 204, 180];
      const clot = (lon, ny, rl, rn, n) => { for (let i = 0; i < n; i++) blot(lon + (r() - 0.5) * rl, ny + (r() - 0.5) * rn, rl * (0.15 + r() * 0.3), rn * (0.15 + r() * 0.3), r() < 0.5 ? BLD : DRY, 0.7 + r() * 0.3); };
      const gash = (lon, ny, lenPx, ang, w) => {
        c.save(); c.translate(fx(lon), fy(ny)); c.rotate(ang);
        c.fillStyle = rgba(DRY, 0.85); c.beginPath(); c.moveTo(-lenPx, 0);
        for (let i = 0; i <= 10; i++) c.lineTo(-lenPx + (i / 10) * 2 * lenPx, -w * Math.sin(i / 10 * Math.PI) * (0.6 + r() * 0.5));
        for (let i = 10; i >= 0; i--) c.lineTo(-lenPx + (i / 10) * 2 * lenPx, w * Math.sin(i / 10 * Math.PI) * (0.6 + r() * 0.5));
        c.closePath(); c.fill();
        c.fillStyle = rgba(FLESH, 0.9); c.beginPath(); c.ellipse(0, 0, lenPx * 0.8, w * 0.55, 0, 0, TAU); c.fill();
        c.fillStyle = rgba([40, 2, 4], 0.95); c.beginPath(); c.ellipse(0, 0, lenPx * 0.62, w * 0.3, 0, 0, TAU); c.fill();
        c.restore();
      };
      const W = o.wounds || {};
      if (W.cheekHole) {                                              // buraco na bochecha: mostra dentes e osso
        const s = W.cheekHole, X = fx(s * 0.6), Y = fy(-0.4);
        c.fillStyle = rgba(FLESH, 0.95); c.beginPath(); c.ellipse(X, Y, 20, 14, 0.3 * s, 0, TAU); c.fill();
        c.fillStyle = "rgba(30,0,2,0.98)"; c.beginPath(); c.ellipse(X, Y, 15, 9.5, 0.3 * s, 0, TAU); c.fill();
        c.fillStyle = rgba(BONE, 0.95); for (let i = -3; i <= 3; i++) c.fillRect(X + i * 4 - 1.5, Y + 1 + Math.abs(i) * 0.4, 3, 5);
        for (let i = 0; i < 18; i++) { c.strokeStyle = rgba(FLESH, 0.8); c.lineWidth = 1.4; c.beginPath(); const a = r() * TAU; c.moveTo(X + Math.cos(a) * 14, Y + Math.sin(a) * 9); c.lineTo(X + Math.cos(a) * 21, Y + Math.sin(a) * 15); c.stroke(); }
        clot(s * 0.6, -0.4, 0.34, 0.2, 5);
      }
      if (W.gash) for (const g of W.gash) { gash(g.lon, g.ny, g.len, g.ang, g.w); clot(g.lon, g.ny, 0.2, 0.14, 3); }
      if (W.claws) for (const cl of W.claws) {
        for (let i = -1; i <= 1; i++) { c.strokeStyle = rgba(FLESH, 0.95); c.lineWidth = 2.2; c.beginPath(); c.moveTo(fx(cl.lon + i * 0.08), fy(cl.ny + 0.18)); c.lineTo(fx(cl.lon + i * 0.08 + cl.s * 0.1), fy(cl.ny - 0.18)); c.stroke(); c.strokeStyle = rgba(DRY, 0.95); c.lineWidth = 1; c.stroke(); }
      }
      if (W.bite) for (const b of W.bite) {
        const X = fx(b.lon), Y = fy(b.ny);
        c.fillStyle = rgba(FLESH, 0.88); c.beginPath(); c.ellipse(X, Y, 15, 10, 0, 0, TAU); c.fill();
        c.fillStyle = rgba([40, 2, 6], 0.95); c.beginPath(); c.ellipse(X, Y, 10, 6, 0, 0, TAU); c.fill();
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.fillStyle = rgba(DRY, 0.95); c.beginPath(); c.arc(X + Math.cos(a) * 15.5, Y + Math.sin(a) * 10.5, 1.8, 0, TAU); c.fill(); }
      }
      if (W.burn) { for (let k = 0; k < 7; k++) blot(W.burn + (r() - 0.5) * 0.7, -0.1 + (r() - 0.5) * 0.8, 0.22, 0.2, r() < 0.4 ? [26, 18, 16] : [96, 36, 24], 0.7); }
      if (W.bullet) for (const b of W.bullet) { blot(b.lon, b.ny, 0.05, 0.035, [14, 2, 4], 1); blot(b.lon, b.ny, 0.09, 0.07, DRY, 0.7); const sy = b.ny; c.strokeStyle = rgba(BLD, 0.8); c.lineWidth = 2.2; c.beginPath(); c.moveTo(fx(b.lon), fy(sy)); c.lineTo(fx(b.lon + (r() - 0.5) * 0.03), fy(sy - 0.25 - r() * 0.3)); c.stroke(); }
      if (W.skullBone) {                                               // couro cabeludo arrancado: osso à mostra
        const lon = W.skullBone.lon, ny = W.skullBone.ny, rl = W.skullBone.r;
        blot(lon, ny, rl * 1.3, rl * 0.8, FLESH, 0.95); blot(lon, ny, rl * 1.05, rl * 0.66, BONE, 1); blot(lon, ny, rl * 0.7, rl * 0.45, [170, 160, 140], 0.9);
        c.strokeStyle = "rgba(80,50,40,0.8)"; c.lineWidth = 1; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(fx(lon), fy(ny)); c.lineTo(fx(lon + (r() - 0.5) * rl * 2), fy(ny + (r() - 0.5) * rl)); c.stroke(); }
        clot(lon, ny, rl * 2, rl * 1.3, 8);
      }
      if (W.noEye) for (const s of W.noEye) {
        blot(s * 0.42, 0.06, 0.2, 0.13, FLESH, 0.95); blot(s * 0.42, 0.06, 0.15, 0.1, [26, 2, 4], 1); blot(s * 0.42, 0.06, 0.07, 0.05, [6, 0, 0], 1);
        const X = fx(s * 0.42), Y = fy(0.0), len = 50 + r() * 70;
        const gr = c.createLinearGradient(0, Y, 0, Y + len); gr.addColorStop(0, rgba([120, 6, 10], 0.95)); gr.addColorStop(1, rgba(DRY, 0));
        c.fillStyle = gr; c.fillRect(X - 3, Y, 6, len); clot(s * 0.42, 0.06, 0.34, 0.24, 6);
      }
      if (W.noEar) for (const s of W.noEar) { blot(s * 1.52, -0.12, 0.2, 0.22, FLESH, 0.95); blot(s * 1.52, -0.12, 0.12, 0.14, [30, 2, 4], 0.95); clot(s * 1.52, -0.12, 0.3, 0.35, 6); }
      // sangue: da boca, do nariz, dos olhos
      if (W.mouthBlood) {
        const lo = W.mouthBlood;
        for (let k = 0; k < 4 + lo * 5; k++) {
          const lon0 = (r() - 0.5) * 0.4, len = (0.18 + r() * 0.5) * (0.5 + lo);
          const X = fx(lon0), Y = fy(-0.55);
          const gr = c.createLinearGradient(0, Y, 0, Y + len * (FH / Math.PI) * 1.6);
          gr.addColorStop(0, rgba(r() < 0.5 ? BLD : [90, 4, 8], 0.92)); gr.addColorStop(1, rgba(DRY, 0));
          c.fillStyle = gr; c.fillRect(X - 2 - r() * 3, Y, 3 + r() * 5, len * (FH / Math.PI) * 1.6);
        }
        blot(0, -0.6, 0.4, 0.14, BLD, 0.9);
      }
      if (W.noseBlood) { for (const s of [-1, 1]) { const X = fx(s * 0.09), Y = fy(-0.35); const gr = c.createLinearGradient(0, Y, 0, Y + 40); gr.addColorStop(0, rgba(BLD, 0.95)); gr.addColorStop(1, rgba(DRY, 0)); c.fillStyle = gr; c.fillRect(X - 2, Y, 4, 40); } }
      if (W.tears) for (const s of [-1, 1]) {
        if (r() < 0.2) continue;
        const X = fx(s * 0.45), Y = fy(0.0), len = 30 + r() * 60;
        const gr = c.createLinearGradient(0, Y, 0, Y + len); gr.addColorStop(0, rgba([98, 4, 10], 0.9)); gr.addColorStop(1, rgba(DRY, 0));
        c.fillStyle = gr; c.fillRect(X - 1.5, Y, 3 + r() * 2, len);
      }
      for (let k = 0; k < (W.splat || 0); k++) {                       // respingos
        const lon = (r() * 2 - 1) * 1.1, ny = (r() * 2 - 1) * 0.8;
        for (let i = 0; i < 6; i++) blot(lon + (r() - 0.5) * 0.25, ny + (r() - 0.5) * 0.2, 0.02 + r() * 0.05, 0.015 + r() * 0.04, r() < 0.5 ? BLD : DRY, 0.85);
      }
      const tex = new THREE.CanvasTexture(cv);
      tex.anisotropy = 4;
      return tex;
    }
    function wrapPi(a) { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; }

    // ---------------------------------------------------------------- olhos
    function eyeTex(r, o) {
      const cv = mkCanvas(128, 64), c = cv.getContext("2d");
      c.fillStyle = rgba(o.sclera, 1); c.fillRect(0, 0, 128, 64);
      // veias vermelhas
      for (let i = 0; i < 30; i++) { c.strokeStyle = "rgba(150,20,24," + (0.2 + r() * 0.3) + ")"; c.lineWidth = 0.8; const a = r() * TAU, x0 = 96 + Math.cos(a) * 20, y0 = 32 + Math.sin(a) * 14; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + Math.cos(a) * (20 + r() * 12), y0 + Math.sin(a) * (16 + r() * 8)); c.stroke(); }
      const X = 96, Y = 32;                                          // frente da esfera (u=0.75)
      const ir = c.createRadialGradient(X, Y, 1, X, Y, 12);
      ir.addColorStop(0, rgba(mulC(o.iris, 0.5), 1)); ir.addColorStop(0.55, rgba(o.iris, 1)); ir.addColorStop(1, rgba(mulC(o.iris, 0.45), 1));
      c.fillStyle = ir; c.beginPath(); c.ellipse(X, Y, 12, 12, 0, 0, TAU); c.fill();
      if (o.cloud) { c.fillStyle = "rgba(220,224,226," + o.cloud + ")"; c.beginPath(); c.ellipse(X, Y, 12, 12, 0, 0, TAU); c.fill(); }
      c.fillStyle = o.pupil || "rgba(8,6,6,0.95)"; c.beginPath(); c.ellipse(X, Y, o.cloud > 0.6 ? 2 : 4.4, o.cloud > 0.6 ? 2 : 4.4, 0, 0, TAU); c.fill();
      c.fillStyle = "rgba(255,255,255,0.7)"; c.beginPath(); c.ellipse(X - 4, Y - 4, 2, 2, 0, 0, TAU); c.fill();
      const t = new THREE.CanvasTexture(cv);
      return t;
    }

    // ---------------------------------------------------------------- mandíbula que abre (shader) ----
    const JAW_HINGE = new THREE.Vector3(0, -0.018, 0.012);
    function jawMaterial(map, color) {
      const m = new THREE.MeshPhongMaterial({ map, color, specular: 0x222222, shininess: 14 });
      const u = { value: 0 };
      m.userData.jaw = u;
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uJaw = u; sh.uniforms.uHinge = { value: JAW_HINGE };
        sh.vertexShader = sh.vertexShader
          .replace("#include <common>", "#include <common>\nattribute float jawW;\nuniform float uJaw;\nuniform vec3 uHinge;")
          .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\n{ float ja = uJaw * jawW; float cs = cos(ja), sn = sin(ja); objectNormal = vec3(objectNormal.x, objectNormal.y * cs + objectNormal.z * sn, -objectNormal.y * sn + objectNormal.z * cs); }")
          .replace("#include <begin_vertex>", "#include <begin_vertex>\n{ float ja = uJaw * jawW; float cs = cos(ja), sn = sin(ja); vec3 p = transformed - uHinge; transformed = uHinge + vec3(p.x, p.y * cs + p.z * sn, -p.y * sn + p.z * cs); }");
      };
      m.customProgramCacheKey = () => "zjaw";
      return m;
    }

    return {
      TAU, clamp01, sstep, gs, lerp, HEAD, HZ, mkCanvas, rgba, colArr, mulC, mixC, hairline, headFor, headGeo, paintFace, eyeTex, jawMaterial, JAW_HINGE,
      mulberry, hashStr, wrapPi, fx, fy,
    };
  })();
