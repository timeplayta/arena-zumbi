  // ======================================================================
  //  ANATOMIA DO CORPO: tubos elípticos esculpidos (tronco, pescoço, bacia, braços, pernas),
  //  roupas como cascas com dobras, mãos com dedos, pés/sapatos/botas, pintura de vértices e texturas.
  //  Convenção: y sobe; frente = -z (phi = PI); costas = +z (phi = 0); x = lado.
  // ======================================================================
  const ZA = (function () {
    const { TAU } = ZH;
    const PI = Math.PI;
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const lerp = (a, b, t) => a + (b - a) * t;
    const sst = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    const gs = (x, s) => Math.exp(-(x * x) / (2 * s * s));
    const wrapA = (a) => { a %= TAU; if (a > PI) a -= TAU; if (a < -PI) a += TAU; return a; };
    const dFront = (phi) => wrapA(phi - PI);         // 0 na frente
    const dBack = (phi) => wrapA(phi);               // 0 nas costas

    // ---------- ruído de valor 3D (determinístico) ----------
    function hash3(x, y, z) {
      let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1274126177)) | 0;
      h = Math.imul(h ^ (h >>> 13), 1103515245);
      return (((h ^ (h >>> 16)) >>> 0) % 65536) / 65536;
    }
    function vnoise(x, y, z) {
      const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
      let fx = x - xi, fy = y - yi, fz = z - zi;
      fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
      const a = lerp(lerp(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), fx), lerp(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), fx), fy);
      const b = lerp(lerp(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), fx), lerp(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), fx), fy);
      return lerp(a, b, fz);
    }

    // ---------- perfil: seções [y, rx, rz, cz] -> função y -> [rx, rz, cz] (Catmull-Rom) ----------
    function prof(secs) {
      secs = secs.slice().sort((a, b) => a[0] - b[0]);
      const n = secs.length, at = (i) => secs[clamp(i, 0, n - 1)];
      return (y) => {
        if (y <= secs[0][0]) return [secs[0][1], secs[0][2], secs[0][3]];
        if (y >= secs[n - 1][0]) return [secs[n - 1][1], secs[n - 1][2], secs[n - 1][3]];
        let i = 0; while (i < n - 2 && y > secs[i + 1][0]) i++;
        const a = secs[i], b = secs[i + 1], t = (y - a[0]) / (b[0] - a[0]), p = at(i - 1), q = at(i + 2), out = [0, 0, 0];
        for (let k = 1; k <= 3; k++) {
          const p0 = p[k], p1 = a[k], p2 = b[k], p3 = q[k];
          out[k - 1] = 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
        }
        if (out[0] < 0.002) out[0] = 0.002;
        if (out[1] < 0.002) out[1] = 0.002;
        return out;
      };
    }
    // recorta as seções entre yLo e yHi (criando as pontas por interpolação)
    function clip(secs, yLo, yHi) {
      const s = secs.slice().sort((a, b) => a[0] - b[0]), f = prof(s), out = [];
      yLo = Math.max(yLo, s[0][0]); yHi = Math.min(yHi, s[s.length - 1][0]);
      const lo = f(yLo), hi = f(yHi);
      out.push([yLo, lo[0], lo[1], lo[2]]);
      for (const q of s) if (q[0] > yLo + 1e-4 && q[0] < yHi - 1e-4) out.push(q.slice());
      out.push([yHi, hi[0], hi[1], hi[2]]);
      return out;
    }

    // ---------- construtor de tubo ----------
    // o: seg, sub, bump(phi,y), ao(phi,y), vc, phi0, phi1, openTop, openBot, capScale, hem(phi) (<= 0: borda irregular)
    function tube(secs, o) {
      o = o || {};
      secs = secs.slice().sort((a, b) => a[0] - b[0]);
      const f = prof(secs), NS = o.seg || 20, sub = o.sub || 3;
      const phi0 = o.phi0 === undefined ? 0 : o.phi0, phi1 = o.phi1 === undefined ? TAU : o.phi1;
      const full = Math.abs(phi1 - phi0 - TAU) < 1e-6;
      const ys = [];
      for (let i = 0; i < secs.length - 1; i++) for (let s = 0; s < sub; s++) ys.push(lerp(secs[i][0], secs[i + 1][0], s / sub));
      ys.push(secs[secs.length - 1][0]);
      const yB = ys[0], yT = ys[ys.length - 1];
      const capH = (y) => { const p = f(y); return Math.min(p[0], p[1]) * 0.9 * (o.capScale || 1); };
      const hB = o.openBot ? 0 : capH(yB), hT = o.openTop ? 0 : capH(yT);
      const rings = [];                                           // [yAmostra, yPos, escala]
      const NC = o.cap || 3;
      if (!o.openBot) for (let i = NC; i >= 1; i--) { const a = (i / NC) * PI / 2; rings.push([yB, yB - hB * Math.sin(a), Math.cos(a)]); }
      for (const y of ys) rings.push([y, y, 1]);
      if (!o.openTop) for (let i = 1; i <= NC; i++) { const a = (i / NC) * PI / 2; rings.push([yT, yT + hT * Math.sin(a), Math.cos(a)]); }
      const vb = yB - hB, vt = yT + hT, u0 = (((phi0 % TAU) + TAU) % TAU) / TAU;
      const nv = rings.length * (NS + 1), P = new Float32Array(nv * 3), U = new Float32Array(nv * 2), C = o.vc ? new Float32Array(nv * 3) : null;
      let vi = 0;
      for (let j = 0; j < rings.length; j++) {
        const ys0 = rings[j][0], sc = rings[j][2], yp = rings[j][1];
        const pr = f(ys0), rx = pr[0], rz = pr[1], cz = pr[2];
        for (let k = 0; k <= NS; k++, vi++) {
          const phi = phi0 + (phi1 - phi0) * (k / NS), sp = Math.sin(phi), cp = Math.cos(phi);
          let nx = sp / rx, nz = cp / rz; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
          let yy = yp;
          if (o.hem && o.openBot && j < 2) yy += o.hem(phi) * (j === 0 ? 1 : 0.3);
          const d = o.bump ? o.bump(phi, yy) * (sc > 0.5 ? 1 : sc) : 0;
          P[vi * 3] = rx * sc * sp + nx * d; P[vi * 3 + 1] = yy; P[vi * 3 + 2] = cz + rz * sc * cp + nz * d;
          U[vi * 2] = u0 + (phi - phi0) / TAU; U[vi * 2 + 1] = (yy - vb) / Math.max(1e-6, vt - vb);
          if (C) { const a = o.ao ? o.ao(phi, yy) : 1; C[vi * 3] = C[vi * 3 + 1] = C[vi * 3 + 2] = a; }
        }
      }
      const I = [];
      for (let j = 0; j < rings.length - 1; j++) for (let k = 0; k < NS; k++) {
        const a = j * (NS + 1) + k, b = a + 1, c = a + NS + 1, d = c + 1;
        I.push(a, b, c, b, d, c);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(P, 3));
      g.setAttribute("uv", new THREE.BufferAttribute(U, 2));
      if (C) g.setAttribute("color", new THREE.BufferAttribute(C, 3));
      g.setIndex(I);
      g.computeVertexNormals();
      if (full) {                                                 // costura: normais iguais nos vértices repetidos
        const nor = g.attributes.normal;
        for (let j = 0; j < rings.length; j++) {
          const a = j * (NS + 1), b = a + NS;
          const x = nor.getX(a) + nor.getX(b), y = nor.getY(a) + nor.getY(b), z = nor.getZ(a) + nor.getZ(b), l = Math.hypot(x, y, z) || 1;
          nor.setXYZ(a, x / l, y / l, z / l); nor.setXYZ(b, x / l, y / l, z / l);
        }
      }
      return g;
    }

    // ---------- tabelas do corpo (tronco: pivô na cintura; membros: pivô na articulação de cima) ----------
    const TORSO = {
      M: [[-0.04, 0.150, 0.100, 0.004], [0.0, 0.146, 0.094, 0.004], [0.06, 0.143, 0.092, 0.002], [0.14, 0.151, 0.098, 0], [0.22, 0.162, 0.107, -0.004],
        [0.30, 0.172, 0.113, -0.006], [0.355, 0.178, 0.106, -0.004], [0.395, 0.17, 0.094, 0], [0.422, 0.148, 0.082, 0.004], [0.446, 0.1, 0.066, 0.008], [0.468, 0.056, 0.056, 0.01]],
      F: [[-0.04, 0.140, 0.092, 0.004], [0.0, 0.128, 0.084, 0.004], [0.06, 0.120, 0.080, 0.003], [0.14, 0.130, 0.086, 0], [0.22, 0.142, 0.094, -0.003],
        [0.29, 0.150, 0.100, -0.005], [0.34, 0.153, 0.095, -0.003], [0.38, 0.148, 0.086, 0], [0.41, 0.128, 0.073, 0.004], [0.438, 0.088, 0.062, 0.008], [0.46, 0.054, 0.054, 0.009]],
      fat: [[-0.04, 0.188, 0.150, 0.004], [0.02, 0.200, 0.160, 0.002], [0.09, 0.210, 0.166, 0], [0.17, 0.212, 0.160, -0.002], [0.25, 0.206, 0.150, -0.004],
        [0.32, 0.206, 0.138, -0.004], [0.37, 0.2, 0.124, 0], [0.405, 0.17, 0.106, 0.004], [0.436, 0.118, 0.086, 0.008], [0.46, 0.074, 0.07, 0.01], [0.478, 0.05, 0.06, 0.01]],
    };
    const NECK = [[0.0, 0.074, 0.074, 0], [0.025, 0.056, 0.058, -0.001], [0.06, 0.049, 0.052, -0.002], [0.1, 0.05, 0.052, -0.002], [0.112, 0.05, 0.052, -0.002]];
    const PELVIS = [[-0.11, 0.055, 0.04, 0.004], [-0.09, 0.1, 0.07, 0.004], [-0.05, 0.138, 0.096, 0.005], [0.0, 0.152, 0.106, 0.004], [0.06, 0.145, 0.1, 0.002], [0.098, 0.138, 0.094, 0.002]];
    const UPPER = [[0.03, 0.036, 0.04, 0], [0.014, 0.054, 0.058, 0], [-0.01, 0.064, 0.064, 0], [-0.06, 0.06, 0.06, 0], [-0.14, 0.053, 0.057, 0], [-0.22, 0.046, 0.047, 0], [-0.29, 0.042, 0.044, 0], [-0.305, 0.04, 0.042, 0]];
    const FORE = [[0.03, 0.04, 0.042, 0], [0.012, 0.046, 0.049, 0], [-0.04, 0.049, 0.051, 0], [-0.1, 0.043, 0.045, 0], [-0.17, 0.033, 0.036, 0], [-0.225, 0.024, 0.03, 0], [-0.258, 0.023, 0.029, 0]];
    const THIGH = [[0.06, 0.07, 0.07, 0], [0.04, 0.088, 0.094, 0], [-0.02, 0.092, 0.096, 0.002], [-0.1, 0.088, 0.092, 0], [-0.2, 0.078, 0.082, -0.001], [-0.31, 0.066, 0.07, 0], [-0.39, 0.057, 0.061, 0.002], [-0.44, 0.053, 0.057, 0.002], [-0.455, 0.05, 0.054, 0.002]];
    const SHIN = [[0.04, 0.05, 0.054, 0], [0.025, 0.054, 0.058, 0], [-0.02, 0.055, 0.06, 0.003], [-0.08, 0.055, 0.064, 0.007], [-0.15, 0.052, 0.066, 0.009], [-0.24, 0.043, 0.055, 0.005], [-0.33, 0.036, 0.042, 0.002], [-0.4, 0.033, 0.038, 0], [-0.44, 0.034, 0.038, 0]];

    // ---------- relevos (músculos, ossos) e dobras de roupa ----------
    const torsoBump = (kind) => (phi, y) => {
      const df = dFront(phi), da = Math.abs(df), bk = dBack(phi), ba = Math.abs(bk);
      let d = 0;
      if (kind === "F") { d += 0.024 * gs(y - 0.262, 0.05) * gs(da - 0.4, 0.19); d -= 0.005 * gs(y - 0.26, 0.05) * gs(df, 0.07); }
      else { d += (kind === "fat" ? 0.016 : 0.011) * gs(y - 0.29, 0.055) * gs(da - 0.5, 0.26); d -= 0.004 * gs(df, 0.07) * sst(0.1, 0.3, y) * sst(0.4, 0.34, y); }
      if (kind === "M") d += 0.0045 * (gs(y - 0.115, 0.022) + gs(y - 0.17, 0.022) + gs(y - 0.225, 0.022)) * gs(da - 0.17, 0.1);
      if (kind === "fat") d += 0.042 * gs(y - 0.05, 0.09) * gs(df, 0.8) + 0.012 * gs(y - 0.13, 0.03) * gs(df, 0.9);
      d += 0.007 * gs(y - 0.30, 0.05) * gs(ba - 0.55, 0.22) - 0.004 * gs(bk, 0.08) * sst(0.05, 0.25, y) * sst(0.40, 0.30, y);
      d += 0.0035 * gs(y - 0.388, 0.011) * gs(da - 0.75, 0.3);
      return d;
    };
    const torsoAO = (phi, y) => {
      const da = Math.abs(dFront(phi)), side = Math.abs(Math.abs(wrapA(phi)) - PI / 2);
      let a = 1 - 0.3 * gs(y - 0.33, 0.035) * gs(side, 0.32);
      a -= 0.2 * sst(0.425, 0.47, y);
      a -= 0.16 * sst(0.02, -0.04, y);
      a -= 0.07 * gs(y - 0.21, 0.02) * gs(da - 1.0, 0.7);
      return clamp(a, 0.35, 1);
    };
    const neckBump = (phi, y) => { const da = Math.abs(dFront(phi)); return 0.004 * gs(y - 0.06, 0.016) * gs(da, 0.2) + 0.003 * gs(y - 0.05, 0.03) * gs(da - 1.0, 0.3); };
    const pelvisBump = (phi, y) => 0.016 * gs(y + 0.03, 0.05) * gs(dBack(phi), 0.75);
    const upperBump = (phi, y) => 0.006 * gs(y + 0.13, 0.05) * gs(dFront(phi), 0.9) + 0.006 * gs(y + 0.15, 0.06) * gs(dBack(phi), 0.9);
    const foreBump = (phi, y) => 0.005 * gs(y + 0.05, 0.04) * gs(wrapA(phi - PI / 2), 1.0) + 0.004 * gs(y + 0.06, 0.05) * gs(wrapA(phi + PI / 2), 1.0);
    const thighBump = (phi, y) => 0.008 * gs(y + 0.2, 0.09) * gs(dFront(phi), 0.8) + 0.005 * gs(y + 0.2, 0.09) * gs(dBack(phi), 0.8) + 0.005 * gs(y + 0.425, 0.026) * gs(dFront(phi), 0.45);
    const shinBump = (phi, y) => 0.005 * gs(y, 0.026) * gs(dFront(phi), 0.45) - 0.002 * gs(y + 0.2, 0.1) * gs(dFront(phi), 0.25);

    // dobras de tecido (somadas ao relevo, em metros)
    const ring = (y, y0, w) => gs(y - y0, w) * (0.5 + 0.5 * Math.sin(y * 150));
    const WR = {
      torso: (phi, y) => 0.0026 * Math.sin(phi * 6 + y * 11) * sst(0.4, 0.1, y) + 0.0035 * gs(y - 0.015, 0.03) + 0.004 * gs(Math.abs(Math.abs(wrapA(phi)) - PI / 2), 0.4) * gs(y - 0.32, 0.03) + 0.0018 * Math.sin(phi * 13 - y * 17),
      pelvis: (phi, y) => 0.003 * Math.sin(phi * 7 + y * 9) * sst(0.1, -0.1, y) + 0.003 * gs(y + 0.03, 0.05) * gs(dFront(phi), 0.7),
      upper: (phi, y) => 0.0028 * Math.sin(phi * 5 + y * 14) * sst(-0.05, -0.25, y) + 0.003 * ring(y, -0.29, 0.03),
      fore: (phi, y) => 0.0035 * ring(y, 0.02, 0.045) + 0.0022 * Math.sin(phi * 5 + y * 20) * sst(-0.05, -0.2, y) + 0.0025 * ring(y, -0.235, 0.025),
      thigh: (phi, y) => 0.0036 * gs(y - 0.03, 0.035) * gs(dFront(phi), 1.0) + 0.0028 * Math.sin(phi * 6 + y * 12) * sst(-0.4, -0.05, y) + 0.003 * ring(y, -0.42, 0.04),
      shin: (phi, y) => 0.0035 * ring(y, 0.02, 0.05) + 0.0035 * ring(y, -0.4, 0.05) * sst(-0.2, -0.44, y) + 0.002 * Math.sin(phi * 5 + y * 25) * sst(-0.2, -0.4, y),
    };
    const LIMB_AO = {
      upper: (p, y) => 1 - 0.28 * gs(y - 0.01, 0.03) - 0.1 * gs(y + 0.29, 0.02),
      fore: (p, y) => 1 - 0.18 * gs(y - 0.02, 0.025),
      thigh: (p, y) => 1 - 0.2 * gs(y, 0.045),
      shin: (p, y) => 1 - 0.14 * gs(y - 0.03, 0.025),
      neck: (p, y) => 1 - 0.3 * sst(0.03, 0.0, y),
      pelvis: (p, y) => 1 - 0.14 * sst(-0.08, -0.12, y),
    };
    const DEF = {
      torsoM: { secs: TORSO.M, bump: torsoBump("M"), ao: torsoAO, wr: WR.torso, seg: 22, sub: 3, openBot: true, infl: 1.045, add: 0.001 },
      torsoF: { secs: TORSO.F, bump: torsoBump("F"), ao: torsoAO, wr: WR.torso, seg: 22, sub: 3, openBot: true, infl: 1.045, add: 0.001 },
      torsoFat: { secs: TORSO.fat, bump: torsoBump("fat"), ao: torsoAO, wr: WR.torso, seg: 22, sub: 3, openBot: true, infl: 1.04, add: 0.001 },
      neck: { secs: NECK, bump: neckBump, ao: LIMB_AO.neck, seg: 12, sub: 2, openTop: true, cap: 2 },
      pelvis: { secs: PELVIS, bump: pelvisBump, ao: LIMB_AO.pelvis, wr: WR.pelvis, seg: 18, sub: 2, infl: 1.045, add: 0.001, cap: 2 },
      upper: { secs: UPPER, bump: upperBump, ao: LIMB_AO.upper, wr: WR.upper, seg: 16, sub: 2, cap: 2, infl: 1.06, add: 0.003 },
      fore: { secs: FORE, bump: foreBump, ao: LIMB_AO.fore, wr: WR.fore, seg: 16, sub: 2, cap: 2, infl: 1.06, add: 0.003 },
      thigh: { secs: THIGH, bump: thighBump, ao: LIMB_AO.thigh, wr: WR.thigh, seg: 16, sub: 2, cap: 2, infl: 1.06, add: 0.003 },
      shin: { secs: SHIN, bump: shinBump, ao: LIMB_AO.shin, wr: WR.shin, seg: 16, sub: 2, cap: 2, infl: 1.06, add: 0.003 },
    };
    // superfície de uma peça (perfil + relevo) – também usada pelos decalques e fitas
    function surf(name, o) {
      o = o || {};
      const D = DEF[name], infl = o.infl || D.infl || 1, add = o.cloth ? (o.add === undefined ? D.add || 0 : o.add) : 0, k = o.cloth ? infl : 1;
      const secs = D.secs.map((s) => [s[0], s[1] * k + add, s[2] * k + add, s[3]]);
      const bump = o.cloth ? (phi, y) => (D.bump(phi, y) * 0.55 + (D.wr ? D.wr(phi, y) : 0)) : D.bump;
      return { secs, bump, f: prof(secs) };
    }

    // ---------- peças (com cache) ----------
    // o: cloth, infl, y0 (topo), y1 (base), hem (amplitude da borda irregular), phi0, phi1
    const cache = {};
    function part(name, o) {
      o = o || {};
      const key = name + "|" + (o.cloth ? 1 : 0) + "|" + [o.infl, o.add, o.y0, o.y1, o.hem, o.phi0, o.phi1, o.seg, o.openBot].join(",");
      if (cache[key]) return cache[key];
      const D = DEF[name], S = surf(name, o);
      const bot = S.secs[0][0], top = S.secs[S.secs.length - 1][0];
      const y0 = o.y0 === undefined ? top : Math.min(top, o.y0), y1 = o.y1 === undefined ? bot : Math.max(bot, o.y1);
      const secs = (y0 < top - 1e-4 || y1 > bot + 1e-4) ? clip(S.secs, y1, y0) : S.secs;
      const openBot = o.openBot !== undefined ? o.openBot : y1 > bot + 1e-4 ? true : !!D.openBot, openTop = y0 < top - 1e-4 ? true : !!D.openTop;
      const hemAmp = o.hem || 0;
      const g = tube(secs, {
        bump: S.bump, ao: D.ao, vc: true, seg: o.seg || D.seg, sub: D.sub, cap: D.cap, openBot, openTop, phi0: o.phi0, phi1: o.phi1,
        hem: hemAmp ? (phi) => -hemAmp * (0.35 + 0.65 * Math.abs(Math.sin(phi * 3.1 + 0.7) * (0.55 + 0.45 * Math.sin(phi * 7.7 + 2.1)))) : null,
      });
      return (cache[key] = g);
    }
    // fita colada na superfície da frente (gravata, listras): x de -hw a hw, y de yBot a yTop
    function ribbon(name, o) {
      const key = "rib|" + name + "|" + [o.cloth ? 1 : 0, o.xc || 0, o.hw, o.yTop, o.yBot, o.eps, o.step].join(",");
      if (cache[key]) return cache[key];
      const S = surf(name, o), n = Math.max(2, Math.round((o.yTop - o.yBot) / (o.step || 0.018))), cols = 3, P = [], I = [];
      const eps = o.eps === undefined ? 0.003 : o.eps;
      for (let j = 0; j <= n; j++) {
        const y = lerp(o.yBot, o.yTop, j / n), pr = S.f(y);
        for (let i = 0; i <= cols; i++) {
          const x = (o.xc || 0) + (i / cols - 0.5) * 2 * o.hw, s = clamp(x / pr[0], -0.97, 0.97), phi = PI - Math.asin(s);
          const sp = Math.sin(phi), cp = Math.cos(phi);
          let nx = sp / pr[0], nz = cp / pr[1]; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
          const d = S.bump(phi, y) + eps;
          P.push(pr[0] * sp + nx * d, y, pr[2] + pr[1] * cp + nz * d);
        }
      }
      for (let j = 0; j < n; j++) for (let i = 0; i < cols; i++) { const a = j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1; I.push(a, b, c, b, d, c); }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
      g.setIndex(I); g.computeVertexNormals();
      return (cache[key] = g);
    }

    // ponto na superfície da frente (x, y) de uma peça: [x, y, z, nx, nz]
    function front(name, o, x, y, eps) {
      const S = surf(name, o), pr = S.f(y), s = clamp(x / pr[0], -0.97, 0.97), phi = PI - Math.asin(s), sp = Math.sin(phi), cp = Math.cos(phi);
      let nx = sp / pr[0], nz = cp / pr[1]; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
      const d = S.bump(phi, y) + (eps || 0);
      return [pr[0] * sp + nx * d, y, pr[2] + pr[1] * cp + nz * d, nx, nz];
    }
    function beltGeo(fat) {
      return tpl("belt" + (fat ? 1 : 0), () => tube(fat ? [[-0.03, 0.222, 0.178, 0.004], [0.012, 0.222, 0.178, 0.004]] : [[-0.02, 0.161, 0.11, 0.004], [0.018, 0.161, 0.11, 0.004]], { seg: 24, sub: 1, cap: 1, vc: true, capScale: 0.5 }));
    }

    // ---------- pintura de vértices ----------
    // base: [r,g,b] 0..1; o: { mode 'skin'|'cloth', seed, rot, dirt, hemY, fn(x,y,z,c,ctx) }
    function paint(g, base, o) {
      o = o || {};
      const pa = g.attributes.position, ca = g.attributes.color, n = pa.count, out = new Float32Array(n * 3), c = [0, 0, 0];
      let mx = 0; for (let i = 0; i < n; i++) mx = Math.max(mx, Math.abs(pa.getX(i)));
      const sd = (o.seed || 0) * 7.13, skin = o.mode === "skin", rot = o.rot || 0, dirt = o.dirt || 0, lum = (base[0] + base[1] + base[2]) / 3, lf = clamp(lum / 0.45, 0.55, 1.3);
      for (let i = 0; i < n; i++) {
        const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), ao = ca ? ca.getX(i) : 1;
        const n1 = vnoise(x * 11 + sd, y * 11 + sd * 0.7, z * 11 + 3.1), n2 = vnoise(x * 40 + sd * 1.3, y * 40, z * 40 + sd), n3 = vnoise(x * 7 - sd, y * 7 + 9.1, z * 7 + sd * 0.4);
        c[0] = base[0]; c[1] = base[1]; c[2] = base[2];
        let k = 1;
        if (skin) {
          const mb = clamp((n1 - 0.5) * 3.2, 0, 1) * (0.35 + rot * 0.9), mg = clamp((n3 - 0.52) * 3.2, 0, 1) * (0.3 + rot * 0.9), my = clamp((n1 - 0.2) * -3, 0, 1) * 0.35;
          c[0] *= 0.9; c[1] *= 0.88; c[2] *= 0.88;
          c[0] = lerp(c[0], 0.46 * lf, mb * 0.75); c[1] = lerp(c[1], 0.32 * lf, mb * 0.75); c[2] = lerp(c[2], 0.4 * lf, mb * 0.75);
          c[0] = lerp(c[0], 0.46 * lf, mg * 0.65); c[1] = lerp(c[1], 0.56 * lf, mg * 0.65); c[2] = lerp(c[2], 0.36 * lf, mg * 0.65);
          c[0] = lerp(c[0], 0.58 * lf, my * rot); c[1] = lerp(c[1], 0.46 * lf, my * rot); c[2] = lerp(c[2], 0.28 * lf, my * rot);
          k *= 0.94 + 0.12 * n2;
        } else {
          k *= 1 - dirt * 0.55 * clamp((n1 - 0.38) * 2.3, 0, 1);
          k *= 0.92 + 0.16 * n2;
          if (o.hemY !== undefined) k *= 1 - (o.hemAmt || 0.35) * sst(o.hemY, o.hemY - 0.14, y);
          if (dirt > 0.15) { const st = clamp((n3 - 0.62) * 4, 0, 1) * dirt; c[0] *= 1 - st * 0.35; c[1] *= 1 - st * 0.42; c[2] *= 1 - st * 0.6; }
        }
        if (o.fn) o.fn(x, y, z, c, { mx, n1, n2, n3, i });
        const kk = ao * k;
        out[i * 3] = c[0] * kk; out[i * 3 + 1] = c[1] * kk; out[i * 3 + 2] = c[2] * kk;
      }
      const g2 = g.clone();
      g2.setAttribute("color", new THREE.BufferAttribute(out, 3));
      g2.userData.ownGeo = true;
      return g2;
    }

    // ---------- texturas compartilhadas (detalhe em tons de cinza; a cor vem dos vértices) ----------
    const TEX = {};
    function tex(kind) {
      if (TEX[kind]) return TEX[kind];
      const W = 128, cv = ZH.mkCanvas(W, W), c = cv.getContext("2d"), rnd = ZH.mulberry(kind === "skin" ? 31 : kind === "plaid" ? 77 : 53);
      const wrapDraw = (fn) => { for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { c.save(); c.translate(dx * W, dy * W); fn(); c.restore(); } };
      if (kind === "skin") {
        c.fillStyle = "rgb(240,238,236)"; c.fillRect(0, 0, W, W);
        for (let i = 0; i < 700; i++) { const x = rnd() * W, y = rnd() * W; c.fillStyle = "rgba(90,70,60," + (0.05 + rnd() * 0.1) + ")"; c.fillRect(x, y, 1 + (rnd() < 0.2 ? 1 : 0), 1); }
        for (let i = 0; i < 9; i++) {                                             // veias
          const x0 = rnd() * W, y0 = rnd() * W, a = rnd() * TAU, L = 30 + rnd() * 40;
          wrapDraw(() => { c.strokeStyle = "rgba(90,100,140,0.12)"; c.lineWidth = 1 + rnd() * 1.2; c.beginPath(); c.moveTo(x0, y0); c.bezierCurveTo(x0 + Math.cos(a) * L * 0.3, y0 + Math.sin(a) * L * 0.3 + 6, x0 + Math.cos(a) * L * 0.7, y0 + Math.sin(a) * L * 0.7 - 6, x0 + Math.cos(a) * L, y0 + Math.sin(a) * L); c.stroke(); });
        }
        for (let i = 0; i < 14; i++) { const x = rnd() * W, y = rnd() * W, r = 6 + rnd() * 14; wrapDraw(() => { const gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(120,90,80,0.10)"); gr.addColorStop(1, "rgba(120,90,80,0)"); c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2); }); }
      } else {
        c.fillStyle = "rgb(236,236,236)"; c.fillRect(0, 0, W, W);
        if (kind === "plaid") {
          for (const dir of [0, 1]) for (const [off, wd, al] of [[10, 34, 0.22], [74, 14, 0.3], [56, 3, 0.18], [100, 4, 0.34]]) {
            c.fillStyle = "rgba(0,0,0," + al + ")";
            if (dir) c.fillRect(0, off, W, wd); else c.fillRect(off, 0, wd, W);
          }
        }
        const id = c.getImageData(0, 0, W, W), d = id.data;                          // trama
        for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4, w = (((x >> 1) + (y >> 1)) & 1) ? 7 : -7, nn = (rnd() - 0.5) * 16, thr = (x % 4 < 1 ? -5 : 0) + (y % 4 < 1 ? -4 : 0);
          d[i] = clamp(d[i] + w + nn + thr, 0, 255); d[i + 1] = clamp(d[i + 1] + w + nn + thr, 0, 255); d[i + 2] = clamp(d[i + 2] + w + nn + thr, 0, 255);
        }
        c.putImageData(id, 0, 0);
        for (let i = 0; i < 16; i++) { const x = rnd() * W, y = rnd() * W, r = 8 + rnd() * 20; wrapDraw(() => { const gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(40,30,20,0.13)"); gr.addColorStop(1, "rgba(40,30,20,0)"); c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2); }); }
        for (let i = 0; i < 10; i++) { const x = rnd() * W, y = rnd() * W, L = 8 + rnd() * 16, a = rnd() * PI; wrapDraw(() => { c.strokeStyle = "rgba(255,255,255,0.1)"; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); c.stroke(); }); }
      }
      const t = new THREE.CanvasTexture(cv);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 4;
      if (kind === "skin") t.repeat.set(2, 2); else if (kind === "plaid") t.repeat.set(3, 3); else t.repeat.set(4, 4);
      return (TEX[kind] = t);
    }

    // ---------- fusão de peças com transformação (gabaritos de mão e pé) ----------
    function merge(parts) {
      let nv = 0, ni = 0;
      for (const p of parts) { nv += p.geo.attributes.position.count; ni += p.geo.index.count; }
      const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), part = new Float32Array(nv), ao = new Float32Array(nv), idx = new Uint32Array(ni);
      const v = new THREE.Vector3(), nm = new THREE.Matrix3();
      let vo = 0, io = 0;
      for (const p of parts) {
        const g = p.geo, pa = g.attributes.position, na = g.attributes.normal, ca = g.attributes.color;
        nm.getNormalMatrix(p.mtx);
        for (let i = 0; i < pa.count; i++) {
          v.set(pa.getX(i), pa.getY(i), pa.getZ(i)).applyMatrix4(p.mtx); pos[(vo + i) * 3] = v.x; pos[(vo + i) * 3 + 1] = v.y; pos[(vo + i) * 3 + 2] = v.z;
          v.set(na.getX(i), na.getY(i), na.getZ(i)).applyMatrix3(nm).normalize(); nor[(vo + i) * 3] = v.x; nor[(vo + i) * 3 + 1] = v.y; nor[(vo + i) * 3 + 2] = v.z;
          part[vo + i] = p.part || 0; ao[vo + i] = ca ? ca.getX(i) : 1;
        }
        for (let i = 0; i < g.index.count; i++) idx[io + i] = g.index.getX(i) + vo;
        vo += pa.count; io += g.index.count;
      }
      return { n: nv, pos: new THREE.BufferAttribute(pos, 3), nor: new THREE.BufferAttribute(nor, 3), idx: new THREE.BufferAttribute(idx, 1), part, ao };
    }
    const mtxOf = (pos, quat) => new THREE.Matrix4().compose(pos, quat, new THREE.Vector3(1, 1, 1));
    const DOWN = new THREE.Vector3(0, -1, 0);
    const quatTo = (dir) => new THREE.Quaternion().setFromUnitVectors(DOWN, dir.clone().normalize());
    const tcache = {};
    const tpl = (key, make) => tcache[key] || (tcache[key] = make());

    // mão: palma achatada (fina em x, larga em z), 4 dedos de 3 falanges e polegar. ms = lado para onde os dedos fecham.
    function handTpl(ms, variant) {
      return tpl("hand" + ms + variant, () => {
        const parts = [];
        const dorsal = ms > 0 ? -PI / 2 : PI / 2, palmSide = -dorsal;
        const palm = tube([[0.012, 0.016, 0.03, 0], [-0.012, 0.0185, 0.036, 0], [-0.045, 0.0175, 0.043, 0], [-0.078, 0.0155, 0.043, 0], [-0.096, 0.0125, 0.04, 0]], {
          seg: 10, sub: 2, cap: 2, vc: true,
          bump: (phi, y) => 0.0022 * gs(wrapA(phi - dorsal), 0.8) * gs(y + 0.05, 0.04) - 0.002 * gs(wrapA(phi - palmSide), 0.8) * gs(y + 0.05, 0.025) + 0.0025 * gs(wrapA(phi - palmSide), 0.7) * gs(y + 0.025, 0.02) * gs(Math.sin(phi * 0.5 + 1), 1.5),
          ao: (phi, y) => 0.92 + 0.08 * sst(-0.09, 0.0, y),
        });
        parts.push({ geo: palm, mtx: new THREE.Matrix4(), part: 0 });
        const claw = variant === 1;
        const fz = [-0.031, -0.0105, 0.0105, 0.0295], fl = [[0.031, 0.02, 0.016], [0.035, 0.0225, 0.0165], [0.032, 0.021, 0.015], [0.026, 0.017, 0.013]];
        const cur = claw ? [[0.12, 0.7, 0.7], [0.1, 0.75, 0.8], [0.15, 0.8, 0.8], [0.18, 0.85, 0.7]] : [[0.22, 0.5, 0.4], [0.2, 0.55, 0.45], [0.26, 0.6, 0.5], [0.3, 0.62, 0.5]];
        const seg = (L, r0, r1) => tube([[0, r0, r0 * 0.9, 0], [-L, r1, r1 * 0.9, 0]], { seg: 6, sub: 1, cap: 1, vc: true, ao: (p, y) => 0.95 + 0.05 * (y / -L) });
        for (let i = 0; i < 4; i++) {
          let pos = new THREE.Vector3(0, -0.094, fz[i]), ang = 0;
          for (let s = 0; s < 3; s++) {
            ang += cur[i][s] * (0.9 + 0.2 * Math.sin(i * 2.3 + s));
            const dir = new THREE.Vector3(ms * Math.sin(ang), -Math.cos(ang), 0);
            parts.push({ geo: seg(fl[i][s], 0.0098 - s * 0.0012, 0.0087 - s * 0.0012 - (s === 2 ? 0.0006 : 0)), mtx: mtxOf(pos, quatTo(dir)), part: s === 2 ? 2 : 1 });
            pos = pos.clone().addScaledVector(dir, fl[i][s]);
          }
        }
        let tp = new THREE.Vector3(ms * 0.012, -0.03, -0.038), td = new THREE.Vector3(ms * 0.3, -0.72, -0.66);
        const tl = [0.034, 0.026];
        for (let s = 0; s < 2; s++) {
          parts.push({ geo: seg(tl[s], 0.0125 - s * 0.0015, 0.0105 - s * 0.0015), mtx: mtxOf(tp, quatTo(td)), part: s === 1 ? 2 : 1 });
          tp = tp.clone().addScaledVector(td.clone().normalize(), tl[s]);
          td = td.clone().add(new THREE.Vector3(ms * (claw ? 0.15 : 0.35), -0.1, claw ? 0.2 : 0.35));
        }
        return merge(parts);
      });
    }

    // pé / sapato / bota (frente = -z; sola em y = 0; o tornozelo fica perto da origem)
    function footTpl(kind) {
      return tpl("foot" + kind, () => {
        const bare = kind === "bare", boot = kind === "boot", H = bare ? 0.7 : 1;
        const L = [[0.0, 0.026, 0.026 * H, 0.03 * H], [0.025, 0.031, 0.036 * H, 0.037 * H], [0.07, 0.035, 0.047 * H, 0.048 * H], [0.12, 0.039, 0.042 * H, 0.044 * H], [0.17, 0.043, 0.029 * H, 0.031 * H], [0.215, 0.037, 0.023 * H, 0.025 * H], [0.248, 0.022, 0.018 * H, 0.02 * H]];
        const t = tube(L, { seg: 16, sub: 2, cap: 2, capScale: 0.7 });
        t.applyMatrix4(new THREE.Matrix4().makeRotationX(-PI / 2));          // comprimento -> -z
        t.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, 0.07));
        const pa = t.attributes.position, na = t.attributes.normal;
        for (let i = 0; i < pa.count; i++) {
          if (pa.getY(i) < 0.012) { pa.setY(i, 0); na.setY(i, na.getY(i) - 0.9); const l = Math.hypot(na.getX(i), na.getY(i), na.getZ(i)) || 1; na.setXYZ(i, na.getX(i) / l, na.getY(i) / l, na.getZ(i) / l); }
        }
        const parts = [{ geo: t, mtx: new THREE.Matrix4(), part: 0 }];
        if (boot) {
          const sh = tube([[0.012, 0.05, 0.055, 0.0], [0.05, 0.047, 0.052, 0], [0.11, 0.046, 0.051, 0], [0.15, 0.051, 0.055, 0], [0.158, 0.051, 0.055, 0]], {
            seg: 16, sub: 2, cap: 2, vc: true, openTop: true, openBot: true, bump: (p, y) => 0.004 * sst(0.135, 0.15, y), ao: (p, y) => 1 - 0.35 * sst(0.15, 0.158, y),
          });
          parts.push({ geo: sh, mtx: new THREE.Matrix4(), part: 2 });
        }
        if (bare) {
          for (let k = 0; k < 5; k++) {
            const sg = tube([[0, 0.009 - k * 0.0007, 0.009, 0], [-0.016 + k * 0.002, 0.008 - k * 0.0007, 0.008, 0]], { seg: 6, sub: 1, cap: 1, vc: true });
            parts.push({ geo: sg, mtx: mtxOf(new THREE.Vector3(-0.026 + k * 0.0125, 0.014, -0.17 - (k < 3 ? 0.012 : 0) - (k === 0 ? 0.012 : 0)), quatTo(new THREE.Vector3(0, 0.2, -1))), part: 0 });
          }
        }
        const T = merge(parts), pos = T.pos, nrm = T.nor;
        for (let i = 0; i < T.n; i++) {
          const y = pos.getY(i), z = pos.getZ(i);
          if (T.part[i] === 0 && !bare) {
            if (y < 0.017) T.part[i] = 3;                                    // sola
            else if (y < 0.026) T.part[i] = 4;                               // frisa
            else if (nrm.getY(i) > 0.55 && z < 0.02 && z > -0.14) T.ao[i] *= 0.78 + 0.22 * (0.5 + 0.5 * Math.cos(z * 150));   // cadarços
          } else if (bare && T.part[i] === 0 && z < -0.19) T.ao[i] *= 0.9 + 0.1 * Math.abs(Math.sin(pos.getX(i) * 260));
        }
        return T;
      });
    }
    // geometria colorida por zumbi a partir de um gabarito; colorOf(parte, out[3])
    function fromTpl(T, colorOf, seed) {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", T.pos); g.setAttribute("normal", T.nor); g.setIndex(T.idx);
      const c = new Float32Array(T.n * 3), tmp = [0, 0, 0], sd = (seed || 0) * 5.7;
      for (let i = 0; i < T.n; i++) {
        colorOf(T.part[i], tmp);
        const nz = vnoise(T.pos.getX(i) * 30 + sd, T.pos.getY(i) * 30, T.pos.getZ(i) * 30), k = T.ao[i] * (0.86 + 0.14 * nz);
        c[i * 3] = tmp[0] * k; c[i * 3 + 1] = tmp[1] * k; c[i * 3 + 2] = tmp[2] * k;
      }
      g.setAttribute("color", new THREE.BufferAttribute(c, 3));
      g.userData.ownGeo = true;
      return g;
    }

    // ---------- roupas soltas ----------
    function skirtGeo() {
      return tpl("skirt", () => tube([[-0.5, 0.262, 0.2, 0.0], [-0.34, 0.225, 0.17, 0.0], [-0.18, 0.185, 0.14, 0.0], [-0.02, 0.15, 0.108, 0.002], [0.03, 0.142, 0.1, 0.002]], {
        seg: 40, sub: 3, openTop: true, openBot: true, vc: true,
        bump: (p, y) => (0.007 + 0.016 * sst(0.0, -0.45, y)) * Math.sin(p * 9 + y * 3) * sst(0.0, -0.1, y) + 0.004 * Math.sin(p * 23 + y * 7) * sst(-0.05, -0.3, y),
        ao: (p, y) => 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(p * 9 + y * 3)) * 0.6 + 0.4 * sst(-0.5, -0.1, y),
        hem: (p) => -0.02 * (0.4 + 0.6 * Math.abs(Math.sin(p * 4.3 + 1.1))),
      }));
    }
    function gownGeo() {
      return tpl("gown", () => tube([[-0.34, 0.2, 0.158, 0.002], [-0.18, 0.18, 0.14, 0.002], [-0.02, 0.152, 0.11, 0.002], [0.03, 0.146, 0.104, 0.002]], {
        seg: 36, sub: 3, openTop: true, openBot: true, vc: true, bump: (p, y) => 0.008 * Math.sin(p * 7 + y * 4) * sst(0.0, -0.2, y), ao: (p, y) => 0.75 + 0.25 * sst(-0.34, -0.05, y),
        hem: (p) => -0.025 * (0.3 + 0.7 * Math.abs(Math.sin(p * 3.7 + 0.4))),
      }));
    }
    function coatGeo() {
      return tpl("coat", () => tube([[-0.62, 0.222, 0.186, 0.004], [-0.4, 0.2, 0.164, 0.004], [-0.2, 0.178, 0.14, 0.004], [-0.02, 0.158, 0.114, 0.004], [0.03, 0.15, 0.108, 0.004]], {
        seg: 28, sub: 3, openTop: true, openBot: true, vc: true, phi0: PI + 0.34, phi1: 3 * PI - 0.34,
        bump: (p, y) => 0.007 * Math.sin(p * 6 + y * 2.2) * sst(0.0, -0.3, y) + 0.003 * Math.sin(p * 17 + y * 5) * sst(-0.1, -0.5, y), ao: (p, y) => 0.72 + 0.28 * sst(-0.62, -0.05, y),
        hem: (p) => -0.03 * (0.3 + 0.7 * Math.abs(Math.sin(p * 2.9 + 0.8))),
      }));
    }
    // barra de camiseta para fora da calça
    function hemGeo(fat) {
      return tpl("hem" + fat, () => tube([[-0.12, fat ? 0.222 : 0.163, fat ? 0.176 : 0.114, 0.004], [-0.06, fat ? 0.222 : 0.162, fat ? 0.176 : 0.114, 0.004], [-0.01, fat ? 0.214 : 0.156, fat ? 0.168 : 0.106, 0.004]], {
        seg: 26, sub: 2, openTop: true, openBot: true, vc: true, bump: (p, y) => 0.004 * Math.sin(p * 8 + y * 6) * sst(0, -0.1, y),
        ao: (p, y) => 0.75 + 0.25 * sst(-0.12, 0, y), hem: (p) => -0.018 * (0.3 + 0.7 * Math.abs(Math.sin(p * 4.1 + 0.9))),
      }));
    }
    // avental (só a frente)
    function apronGeo() {
      return tpl("apron", () => tube([[-0.36, 0.165, 0.128, 0.004], [-0.2, 0.162, 0.122, 0.004], [-0.04, 0.158, 0.116, 0.004], [0.1, 0.16, 0.112, 0.002], [0.24, 0.158, 0.116, 0.0], [0.34, 0.15, 0.108, 0.0]], {
        seg: 14, sub: 3, openTop: true, openBot: true, vc: true, phi0: PI - 0.78, phi1: PI + 0.78, bump: (p, y) => 0.003 * Math.sin(p * 9 + y * 7) * sst(0.1, -0.3, y),
        ao: (p, y) => 0.85 + 0.15 * sst(-0.36, 0.1, y), hem: (p) => -0.01 * Math.abs(Math.sin(p * 5)),
      }));
    }

    // ---------- decalques: perfis para ZB.Decals ----------
    for (const k of ["torsoM", "torsoF", "torsoFat", "upper", "fore", "thigh", "shin"]) { const S = surf(k); ZB.PROF[k] = { f: S.f, bump: S.bump }; }

    return { part, ribbon, front, beltGeo, surf, paint, tex, handTpl, footTpl, fromTpl, skirtGeo, gownGeo, coatGeo, hemGeo, apronGeo, tube, prof, vnoise, clamp, lerp, sst, gs, wrapA, dFront, dBack, DEF };
  })();
