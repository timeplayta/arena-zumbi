  // ======================================================================
  //  CABELO E BARBA: mechas (cartões) com textura de fios; geometria guardada em cache por penteado
  // ======================================================================
  const ZHair = (function () {
    const { TAU, sstep, lerp, HEAD, hairline, mulberry, mkCanvas } = ZH;
    const cache = {};
    let strand = null;
    function strandTex() {
      if (strand) return strand;
      const cv = mkCanvas(64, 256), c = cv.getContext("2d");
      const r = mulberry(77);
      c.clearRect(0, 0, 64, 256);
      const gr = c.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, "rgba(150,150,150,1)"); gr.addColorStop(0.3, "rgba(150,150,150,0.95)"); gr.addColorStop(0.7, "rgba(150,150,150,0.0)");
      c.fillStyle = gr; c.fillRect(6, 0, 52, 256);                                     // raiz densa
      for (let i = 0; i < 150; i++) {
        const x = 2 + r() * 60, y1 = 90 + r() * 166, g = 110 + r() * 145, w = 0.8 + r() * 1.8;
        c.strokeStyle = "rgba(" + g + "," + g + "," + g + ",1)"; c.lineWidth = w; c.lineCap = "round";
        c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + (r() - 0.5) * 6, y1 * 0.5, x + (r() - 0.5) * 8, y1); c.stroke();
      }
      strand = new THREE.CanvasTexture(cv);
      strand.anisotropy = 2;
      return strand;
    }
    const mat = () => new THREE.MeshLambertMaterial({ map: strandTex(), alphaTest: 0.42, side: THREE.DoubleSide, vertexColors: true });

    // ------------- construtor de cartões -------------
    class Builder {
      constructor() { this.P = []; this.N = []; this.U = []; this.C = []; this.I = []; this.cnt = 0; }
      add(pts, w0, tint, blood, taper) {
        const n = pts.length;
        if (n < 2) return;
        const base = this.cnt;
        for (let i = 0; i < n; i++) {
          const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
          let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2];
          const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
          let ox = p[0], oy = p[1] * 0.8, oz = p[2];                    // "para fora" a partir do centro da cabeça
          const ol = Math.hypot(ox, oy, oz) || 1; ox /= ol; oy /= ol; oz /= ol;
          let sx = ty * oz - tz * oy, sy = tz * ox - tx * oz, sz = tx * oy - ty * ox;
          let sl = Math.hypot(sx, sy, sz);
          if (sl < 1e-4) { sx = 1; sy = 0; sz = 0; sl = 1; }
          sx /= sl; sy /= sl; sz /= sl;
          const t = i / (n - 1), w = w0 * (1 - (taper === undefined ? 0.65 : taper) * t * t) * 0.5;
          this.P.push(p[0] - sx * w, p[1] - sy * w, p[2] - sz * w, p[0] + sx * w, p[1] + sy * w, p[2] + sz * w);
          const nx = ox * 0.8 + 0, ny = oy * 0.8 - 0.1, nz = oz * 0.8;
          this.N.push(nx, ny, nz, nx, ny, nz);
          this.U.push(0, t, 1, t);
          const k = tint * (1 - 0.25 * t);
          const rr = k * (1 - blood * 0.15) + blood * 0.9, gg = k * (1 - blood * 0.9), bb = k * (1 - blood * 0.9);
          this.C.push(rr, gg, bb, rr, gg, bb);
          this.cnt += 2;
        }
        for (let i = 0; i < n - 1; i++) {
          const a = base + i * 2;
          this.I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }
      geometry() {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(this.P, 3));
        g.setAttribute("normal", new THREE.Float32BufferAttribute(this.N, 3));
        g.setAttribute("uv", new THREE.Float32BufferAttribute(this.U, 2));
        g.setAttribute("color", new THREE.Float32BufferAttribute(this.C, 3));
        g.setIndex(this.I);
        return g;
      }
    }
    const R = HEAD;
    // ponto sobre o couro cabeludo: th = ângulo desde o topo, az = 0 nuca ... PI testa (sinal = lado)
    function surf(th, az, off) {
      const s = Math.sin(th), x = R.rx * s * Math.sin(az), y = R.ry * Math.cos(th), z = R.rz * s * Math.cos(az);
      const nx = x / (R.rx * R.rx), ny = y / (R.ry * R.ry), nz = z / (R.rz * R.rz), l = Math.hypot(nx, ny, nz) || 1;
      return [x + (nx / l) * off, y + (ny / l) * off, z + (nz / l) * off];
    }
    const norm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
    // cabelo que cai: evita atravessar ombros/costas (fica atrás do pescoço)
    function avoid(p) {
      if (p[1] < -0.13) {
        const k = sstep(-0.13, -0.2, p[1]);
        const zmin = 0.07 + k * 0.06;
        if (Math.abs(p[0]) < 0.19 && p[2] < zmin) p[2] = zmin + (zmin - p[2]) * 0.0;
      }
      return p;
    }
    function hangFrom(start, dir, len, steps, o) {
      const pts = [start.slice()];
      let d = norm3(dir), p = start.slice();
      const ds = len / steps, r = o.r;
      for (let i = 0; i < steps; i++) {
        d = norm3([d[0] * 0.55 + (o.out ? p[0] * 2 : 0) * 0.1 + (r() - 0.5) * (o.jit || 0.15) + (o.wave ? Math.sin(i * o.wave + o.ph) * 0.3 : 0), d[1] * 0.55 - (o.g === undefined ? 0.5 : o.g), d[2] * 0.55 + (o.back || 0.06) + (r() - 0.5) * (o.jit || 0.15)]);
        p = [p[0] + d[0] * ds, p[1] + d[1] * ds, p[2] + d[2] * ds];
        avoid(p);
        pts.push(p.slice());
      }
      return pts;
    }
    function surfacePath(th0, az0, thEnd, o) {
      const pts = [], n = o.steps || 5;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        let az = az0 + (o.sweep || 0) * t * (o.sweepDir || 1) + (o.swirl ? Math.sin(t * 3 + o.ph) * o.swirl : 0);
        const th = lerp(th0, thEnd, t);
        pts.push(surf(th, az, (o.lift || 0.004) * (0.3 + 0.7 * Math.sin(Math.PI * Math.min(1, t * 0.8 + 0.2))) + (o.rise || 0) * t));
      }
      return pts;
    }
    function build(style, seed, opt) {
      opt = opt || {};
      const key = style + "|" + seed + "|" + (opt.hat ? 1 : 0) + "|" + (opt.hole ? opt.hole.join(",") : "") + "|" + (opt.blood || 0);
      if (cache[key]) return cache[key];
      const r = mulberry(seed * 977 + style.length * 31), B = new Builder();
      const hl = (az) => hairline(az, opt.recede || 0);
      const sgn = () => (r() < 0.5 ? -1 : 1);
      const rootTh = (az, topCut) => {
        const lim = hl(az);
        const th0 = (topCut || 0.05) + (lim * 0.96 - (topCut || 0.05)) * Math.pow(r(), 0.75);
        return th0;
      };
      const tintf = () => 0.7 + r() * 0.6;
      const hole = opt.hole ? { c: surf(opt.hole[1], Math.PI - opt.hole[0], 0), rad: opt.hole[2] } : null;
      const inHole = (th, az) => { if (!hole) return false; const p = surf(th, az, 0); return Math.hypot(p[0] - hole.c[0], p[1] - hole.c[1], p[2] - hole.c[2]) < hole.rad; };
      const surfaceStyle = (n, o) => {
        for (let i = 0; i < n; i++) {
          const az = (r() * 2 - 1) * Math.PI, aaz = Math.abs(az) > 3.1 ? 3.1 : az;
          let th0 = rootTh(Math.abs(aaz), o.topCut);
          if (opt.hat && th0 < 0.95) continue;
          if (inHole(th0, aaz)) continue;
          const front = sstep(2.0, 3.0, Math.abs(aaz));
          const po = { steps: o.steps || 5, lift: o.lift || (0.004 + r() * 0.012), sweep: (o.sweep || 0) * (0.4 + r() * 0.6), sweepDir: o.center ? (aaz > 0 ? -1 : 1) : o.partSide ? (aaz > o.partSide ? 1 : -1) : 1, swirl: o.swirl, ph: r() * 6, rise: o.rise ? o.rise * r() : 0 };
          if (o.partSide || o.center) po.sweep *= front * 0.9 + 0.1;
          const thEnd = hl(Math.abs(aaz)) + (o.extra || 0) * (0.4 + r() * 0.6) + (o.frontExtra || 0) * front;
          let pts = surfacePath(th0, aaz, thEnd, po);
          if (o.hang) {
            const last = pts[pts.length - 1], prev = pts[pts.length - 2];
            const dir = [last[0] - prev[0], last[1] - prev[1] - 0.001, last[2] - prev[2]];
            const L = o.hang[0] + (o.hang[1] - o.hang[0]) * r();
            const lenScale = o.hangShort ? 1 - (1 - o.hangShort) * front : 1;
            pts = pts.concat(hangFrom(last, dir, L * lenScale, o.hangSteps || 8, { r, out: 1, wave: o.wave, ph: r() * 6, back: o.back, jit: o.jit, g: o.g }).slice(1));
          }
          B.add(pts, o.w[0] + (o.w[1] - o.w[0]) * r(), tintf(), r() < (opt.blood || 0) ? 0.8 : 0, o.taper);
        }
      };
      const S = {
        short: () => surfaceStyle(150, { w: [0.022, 0.032], extra: 0.04, sweep: 0.18, lift: 0.008 }),
        side: () => surfaceStyle(160, { w: [0.022, 0.032], extra: 0.05, frontExtra: 0.22, sweep: 0.7, partSide: 2.6, lift: 0.009 }),
        messy: () => surfaceStyle(190, { w: [0.02, 0.03], extra: 0.07, sweep: 0.6, swirl: 0.5, lift: 0.014, rise: 0.03 }),
        curly: () => surfaceStyle(240, { w: [0.02, 0.028], extra: 0.04, swirl: 0.16, lift: 0.012, rise: 0.012, steps: 6 }),
        long: () => surfaceStyle(190, { w: [0.026, 0.04], extra: 0, sweep: 0.5, center: 1, lift: 0.007, hang: [0.2, 0.34], hangSteps: 9, back: 0.07 }),
        wavy: () => surfaceStyle(200, { w: [0.026, 0.04], extra: 0, sweep: 0.5, center: 1, lift: 0.008, hang: [0.2, 0.33], hangSteps: 10, wave: 1.6, back: 0.07, jit: 0.22 }),
        bob: () => surfaceStyle(170, { w: [0.026, 0.038], extra: 0.02, sweep: 0.4, center: 1, lift: 0.01, hang: [0.05, 0.1], hangSteps: 5, back: 0.02, hangShort: 0.7 }),
        afro: () => surfaceStyle(340, { w: [0.026, 0.04], extra: 0, lift: 0.03, rise: 0.06, swirl: 0.25, steps: 5, topCut: 0.05, taper: 0.4 }),
      };
      if (S[style]) S[style]();
      else if (style === "balding") {
        for (let i = 0; i < 100; i++) {                                // só laterais e nuca
          const az = (r() * 2 - 1) * Math.PI, a = Math.abs(az);
          if (a < 0.9 && r() < 0.8) continue;
          const th0 = 1.1 + r() * (hl(a) * 0.96 - 1.1);
          if (th0 > hl(a)) continue;
          B.add(surfacePath(th0, az, hl(a) + 0.03, { steps: 4, lift: 0.006 + r() * 0.006 }), 0.024 + r() * 0.01, tintf(), 0, 0.6);
        }
        for (let i = 0; i < 7; i++) {                                  // fios penteados por cima da careca
          const s = sgn(), a0 = [surf(1.2, s * 1.55, 0.006), surf(0.5, s * 0.9, 0.012), surf(0.6, -s * 0.9, 0.012), surf(1.2, -s * 1.5, 0.006)];
          const pts = a0.map((p) => p.slice());
          B.add(pts, 0.006 + r() * 0.004, tintf() * 1.1, 0, 0.8);
        }
      } else if (style === "tail" || style === "bun") {
        const G = style === "tail" ? [0, 0.045, 0.108] : [0, 0.105, 0.052];
        for (let i = 0; i < 130; i++) {
          const az = (r() * 2 - 1) * Math.PI, th0 = rootTh(Math.abs(az), 0.05);
          if (opt.hat && th0 < 0.95) continue;
          const a = surf(th0, az, 0.005 + r() * 0.01), dg = norm3([G[0], G[1] * 0.9, G[2]]), da = norm3([a[0], a[1] * 0.9, a[2]]);
          const pts = [];
          for (let k = 0; k <= 5; k++) {
            const t = k / 5, d = norm3([lerp(da[0], dg[0], t), lerp(da[1], dg[1], t), lerp(da[2], dg[2], t)]);
            const ra = Math.hypot(a[0], a[1], a[2]), rg = Math.hypot(G[0], G[1], G[2]);
            const rr = lerp(ra, rg, t) + 0.006 * Math.sin(Math.PI * t);
            pts.push([d[0] * rr, d[1] * rr * 1.0, d[2] * rr]);
          }
          B.add(pts, 0.024 + r() * 0.012, tintf(), 0, 0.5);
        }
        if (style === "tail") {
          for (let i = 0; i < 26; i++) {
            const off = [(r() - 0.5) * 0.03, (r() - 0.5) * 0.02, (r() - 0.5) * 0.02];
            const st = [G[0] + off[0], G[1] + off[1], G[2] + off[2] + 0.008];
            B.add(hangFrom(st, [off[0] * 3, -0.35, 0.95], 0.18 + r() * 0.1, 8, { r, back: 0.05, jit: 0.1, g: 0.6, wave: 1.2, ph: r() * 6 }), 0.022 + r() * 0.012, tintf(), 0, 0.35);
          }
        } else {
          for (let i = 0; i < 26; i++) {                               // coque: bola de mechas enroladas
            const a = r() * TAU, b = (r() - 0.5) * Math.PI, rad = 0.036;
            const dir = [Math.cos(a) * Math.cos(b), Math.sin(b), Math.sin(a) * Math.cos(b)];
            const pts = [];
            for (let k = 0; k <= 4; k++) {
              const t = k / 4, ang = a + t * 1.7;
              const d2 = [Math.cos(ang) * Math.cos(b), Math.sin(b) * (1 - t * 0.4), Math.sin(ang) * Math.cos(b)];
              pts.push([G[0] + d2[0] * rad * (0.4 + 0.6 * Math.sin(Math.PI * (0.15 + 0.85 * t))), G[1] + d2[1] * rad, G[2] + d2[2] * rad]);
            }
            B.add(pts, 0.02 + r() * 0.01, tintf(), 0, 0.3);
          }
        }
      } else if (style === "mohawk") {
        for (let i = 0; i < 70; i++) {
          const t = i / 69, th = lerp(0.85, 2.0, t), az = t < 0.5 ? Math.PI : 0, thh = t < 0.5 ? lerp(0.85, 0.05, t * 2) : lerp(0.05, 2.0, (t - 0.5) * 2);
          const root = surf(thh, az, 0.005 + r() * 0.004);
          root[0] += (r() - 0.5) * 0.014;
          const nrm = norm3([root[0] * 0.1, root[1] / (R.ry * R.ry), root[2] / (R.rz * R.rz)]), L = 0.05 + r() * 0.045;
          const pts = [];
          for (let k = 0; k <= 4; k++) { const u = k / 4; pts.push([root[0] + (r() - 0.5) * 0.004, root[1] + nrm[1] * L * u, root[2] + nrm[2] * L * u + (t > 0.5 ? 0.012 * u : -0.006 * u)]); }
          B.add(pts, 0.016 + r() * 0.008, tintf(), 0, 0.7);
        }
      } else if (style === "none") { /* nada */ }
      const g = B.geometry();
      cache[key] = g;
      return g;
    }

    // ----------- barba e bigode (cartões que seguem o maxilar) -----------
    function beard(kind, seed) {
      const key = "beard|" + kind + "|" + seed;
      if (cache[key]) return cache[key];
      const r = mulberry(seed * 311 + 5), B = new Builder();
      const N = kind === "full" ? 130 : kind === "goatee" ? 50 : kind === "short" ? 90 : 0;
      for (let i = 0; i < N; i++) {
        let lon = (r() * 2 - 1) * (kind === "goatee" ? 0.35 : 1.05), ny = -(kind === "goatee" ? 0.62 : 0.26) - r() * (kind === "goatee" ? 0.28 : 0.6);
        if (kind !== "goatee" && Math.abs(lon) < 0.36 && ny > -0.64) continue;       // deixa a boca livre
        const th = Math.acos(ny), az = Math.PI - lon * 1.1;
        const p0 = surf(th, az, 0.003 + r() * 0.005);
        const L = kind === "full" ? 0.05 + r() * 0.07 : kind === "short" ? 0.02 + r() * 0.025 : 0.03 + r() * 0.04;
        const pts = hangFrom(p0, [p0[0] * 1.5, -0.5, -0.5 + p0[2] * 4], L, 4, { r, g: 0.55, jit: 0.2, back: -0.02 });
        pts.forEach((p) => { if (p[2] > 0.0 && p[1] < -0.06) p[2] = Math.min(p[2], 0.02); });
        B.add(pts, 0.014 + r() * 0.01, 0.7 + r() * 0.5, 0, 0.6);
      }
      if (kind === "full" || kind === "short" || kind === "mustache") {         // bigode
        for (let i = 0; i < 34; i++) {
          const s = r() < 0.5 ? -1 : 1, lon = s * (0.03 + r() * 0.3), ny = -0.4 - r() * 0.035;
          const p0 = surf(Math.acos(ny), Math.PI - lon * 1.1, 0.004);
          B.add(hangFrom(p0, [s * 0.5, -0.5, -0.5], 0.02 + r() * 0.02, 3, { r, g: 0.5, jit: 0.1, back: -0.04 }), 0.012 + r() * 0.006, 0.8 + r() * 0.4, 0, 0.5);
        }
      }
      const g = B.geometry();
      cache[key] = g;
      return g;
    }
    return { build, beard, mat, strandTex, surf };
  })();
