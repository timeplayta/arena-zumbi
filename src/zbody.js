  // ======================================================================
  //  CORPO DOS ZUMBIS: decalques de ferimentos/sangue (atlas), peças 3D de gore e fusão de malhas
  // ======================================================================
  const ZB = (function () {
    const { TAU, mulberry, mkCanvas } = ZH;
    const CELL = 128, COLS = 8, ROWS = 4;
    let atlasTex = null, atlasMat = null;

    // ---------------- atlas de decalques ----------------
    function paintAtlas() {
      const cv = mkCanvas(CELL * COLS, CELL * ROWS), c = cv.getContext("2d");
      const r = mulberry(4242);
      const P = (cell) => [(cell % COLS) * CELL, Math.floor(cell / COLS) * CELL];
      const blob = (x, y, rad, col, a, sq) => {
        c.save(); c.translate(x, y); c.scale(1, sq || 1);
        const gr = c.createRadialGradient(0, 0, 0, 0, 0, rad);
        gr.addColorStop(0, "rgba(" + col + "," + a + ")"); gr.addColorStop(0.7, "rgba(" + col + "," + a * 0.8 + ")"); gr.addColorStop(1, "rgba(" + col + ",0)");
        c.fillStyle = gr; c.beginPath(); c.arc(0, 0, rad, 0, TAU); c.fill(); c.restore();
      };
      const cell = (n, fn) => { const [ox, oy] = P(n); c.save(); c.beginPath(); c.rect(ox, oy, CELL, CELL); c.clip(); c.translate(ox, oy); fn(); c.restore(); };
      const BL = "128,8,10", BD = "78,6,8", BF = "168,22,26", FL = "176,52,58", DK = "34,3,6";
      const splatter = (n, seedOff) => cell(n, () => {
        const m = 64;
        blob(m, m, 22 + r() * 8, r() < 0.5 ? BL : BD, 0.95, 0.85 + r() * 0.3);
        for (let i = 0; i < 34; i++) {
          const a = r() * TAU, d = 20 + r() * 42, sz = 1 + r() * 3.6 * (1 - d / 70);
          blob(m + Math.cos(a) * d, m + Math.sin(a) * d, sz + 0.5, r() < 0.5 ? BL : BF, 0.95);
          if (r() < 0.4) { c.strokeStyle = "rgba(" + BL + ",0.8)"; c.lineWidth = sz * 0.6; c.beginPath(); c.moveTo(m + Math.cos(a) * 18, m + Math.sin(a) * 18); c.lineTo(m + Math.cos(a) * d, m + Math.sin(a) * d); c.stroke(); }
        }
      });
      splatter(0); splatter(1);
      cell(2, () => {                                                  // escorridos
        for (let i = 0; i < 9; i++) {
          const x = 10 + i * 13 + (r() - 0.5) * 6, len = 30 + r() * 90, w = 2.4 + r() * 3.4;
          const gr = c.createLinearGradient(0, 0, 0, len);
          gr.addColorStop(0, "rgba(" + BF + ",0.95)"); gr.addColorStop(0.6, "rgba(" + BL + ",0.9)"); gr.addColorStop(1, "rgba(" + BD + ",0.9)");
          c.fillStyle = gr; c.fillRect(x - w / 2, 0, w, len);
          c.fillStyle = "rgba(" + BD + ",0.95)"; c.beginPath(); c.arc(x, len, w * 0.75, 0, TAU); c.fill();
        }
        c.fillStyle = "rgba(" + BL + ",0.9)"; c.fillRect(0, 0, CELL, 8);
      });
      cell(3, () => {                                                  // rasgo
        const m = 64;
        c.fillStyle = "rgba(" + BD + ",0.9)"; c.beginPath(); c.ellipse(m, m, 58, 22, -0.25, 0, TAU); c.fill();
        c.fillStyle = "rgba(" + FL + ",1)"; c.beginPath(); c.ellipse(m, m, 50, 15, -0.25, 0, TAU); c.fill();
        c.fillStyle = "rgba(" + DK + ",1)"; c.beginPath(); c.ellipse(m, m, 42, 8.5, -0.25, 0, TAU); c.fill();
        for (let i = 0; i < 10; i++) { const a = r() * TAU; c.strokeStyle = "rgba(" + (r() < 0.5 ? FL : BF) + ",0.9)"; c.lineWidth = 2; c.beginPath(); c.moveTo(m + Math.cos(a) * 40, m + Math.sin(a) * 9); c.lineTo(m + Math.cos(a) * 54, m + Math.sin(a) * 18); c.stroke(); }
        for (let i = 0; i < 6; i++) { blob(m + (r() - 0.5) * 70, m + (r() - 0.5) * 20, 3 + r() * 4, BL, 0.9); }
        c.strokeStyle = "rgba(255,200,190,0.35)"; c.lineWidth = 1.5; c.beginPath(); c.ellipse(m, m - 3, 34, 4, -0.25, Math.PI * 1.1, Math.PI * 1.7); c.stroke();
      });
      cell(4, () => {                                                  // mordida
        const m = 64;
        blob(m, m, 56, "92,44,104", 0.35, 0.9);
        c.fillStyle = "rgba(" + FL + ",0.95)"; c.beginPath(); c.ellipse(m, m, 38, 30, 0, 0, TAU); c.fill();
        c.fillStyle = "rgba(" + DK + ",1)"; c.beginPath(); c.ellipse(m, m, 28, 20, 0, 0, TAU); c.fill();
        for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; c.fillStyle = "rgba(" + BD + ",1)"; c.beginPath(); c.ellipse(m + Math.cos(a) * 39, m + Math.sin(a) * 31, 3.4, 2.4, a, 0, TAU); c.fill(); }
        for (let i = 0; i < 8; i++) { const a = r() * TAU; blob(m + Math.cos(a) * 46, m + Math.sin(a) * 40, 4 + r() * 4, BL, 0.8); }
      });
      cell(5, () => {                                                  // tiro
        const m = 64;
        blob(m, m, 26, BD, 0.85); blob(m, m, 11, DK, 1);
        for (let i = 0; i < 20; i++) { const a = r() * TAU, d = 14 + r() * 26; blob(m + Math.cos(a) * d, m + Math.sin(a) * d, 1 + r() * 2.4, BL, 0.9); }
        c.fillStyle = "rgba(" + BL + ",0.9)"; c.fillRect(m - 2, m, 4, 50);
      });
      cell(6, () => {                                                  // barriga aberta
        const m = 64;
        c.fillStyle = "rgba(" + BD + ",0.95)"; c.beginPath(); c.ellipse(m, m, 60, 54, 0, 0, TAU); c.fill();
        for (let i = 0; i < 26; i++) { const a = (i / 26) * TAU; c.fillStyle = "rgba(" + (r() < 0.5 ? FL : BF) + ",0.95)"; c.beginPath(); c.ellipse(m + Math.cos(a) * 55, m + Math.sin(a) * 49, 7, 4, a, 0, TAU); c.fill(); }
        c.fillStyle = "rgba(" + DK + ",1)"; c.beginPath(); c.ellipse(m, m, 46, 40, 0, 0, TAU); c.fill();
        // órgãos e tripas
        const organ = (x, y, rx, ry, rot, col) => { c.save(); c.translate(x, y); c.rotate(rot); const gr = c.createRadialGradient(-rx * 0.3, -ry * 0.3, 1, 0, 0, rx); gr.addColorStop(0, "rgb(" + col[0] + "," + col[1] + "," + col[2] + ")"); gr.addColorStop(1, "rgb(" + Math.round(col[0] * 0.45) + "," + Math.round(col[1] * 0.4) + "," + Math.round(col[2] * 0.4) + ")"); c.fillStyle = gr; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.fill(); c.fillStyle = "rgba(255,230,230,0.35)"; c.beginPath(); c.ellipse(-rx * 0.25, -ry * 0.35, rx * 0.35, ry * 0.18, 0, 0, TAU); c.fill(); c.restore(); };
        organ(m - 16, m + 4, 20, 13, 0.4, [150, 60, 74]); organ(m + 18, m - 6, 18, 12, -0.5, [120, 40, 80]); organ(m, m + 18, 22, 9, 0.1, [176, 84, 96]);
        for (let i = 0; i < 7; i++) {
          c.strokeStyle = i % 2 ? "rgb(190,100,112)" : "rgb(150,60,80)"; c.lineWidth = 7; c.lineCap = "round";
          c.beginPath(); const x0 = m - 30 + r() * 20, y0 = m - 20 + r() * 40; c.moveTo(x0, y0); c.bezierCurveTo(x0 + 20, y0 - 14, x0 + 28, y0 + 14, x0 + 50, y0 + (r() - 0.5) * 14); c.stroke();
          c.strokeStyle = "rgba(255,230,230,0.3)"; c.lineWidth = 2; c.stroke();
        }
      });
      cell(7, () => {                                                  // peito aberto: costelas
        const m = 64;
        c.fillStyle = "rgba(" + BD + ",0.95)"; c.beginPath(); c.ellipse(m, m, 54, 58, 0, 0, TAU); c.fill();
        c.fillStyle = "rgba(" + FL + ",0.95)"; c.beginPath(); c.ellipse(m, m, 47, 51, 0, 0, TAU); c.fill();
        c.fillStyle = "rgba(" + DK + ",1)"; c.beginPath(); c.ellipse(m, m, 40, 44, 0, 0, TAU); c.fill();
        for (let i = 0; i < 5; i++) {
          const y = 26 + i * 18;
          c.strokeStyle = "rgb(222,212,186)"; c.lineWidth = 6; c.lineCap = "round";
          c.beginPath(); c.moveTo(m - 38, y + 6); c.quadraticCurveTo(m, y - 10, m + 38, y + 6); c.stroke();
          c.strokeStyle = "rgba(255,255,240,0.5)"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(m - 34, y + 3); c.quadraticCurveTo(m, y - 13, m + 34, y + 3); c.stroke();
        }
        c.strokeStyle = "rgb(214,204,176)"; c.lineWidth = 7; c.beginPath(); c.moveTo(m, 18); c.lineTo(m, 112); c.stroke();
        for (let i = 0; i < 9; i++) blob(m + (r() - 0.5) * 80, m + (r() - 0.5) * 90, 3 + r() * 5, BL, 0.8);
      });
      cell(8, () => { blob(64, 64, 52, "88,44,108", 0.7, 0.8); blob(60, 60, 34, "60,50,110", 0.5, 0.8); blob(70, 68, 42, "120,130,50", 0.3, 0.8); });
      cell(9, () => {                                                  // queimadura
        blob(64, 64, 54, "28,20,18", 0.9, 0.85); blob(64, 64, 40, "70,44,32", 0.8, 0.85);
        for (let i = 0; i < 16; i++) { const a = r() * TAU, d = r() * 40; c.strokeStyle = "rgba(220,90,30,0.7)"; c.lineWidth = 1.3; c.beginPath(); c.moveTo(64 + Math.cos(a) * d, 64 + Math.sin(a) * d * 0.85); c.lineTo(64 + Math.cos(a + 0.4) * (d + 12), 64 + Math.sin(a + 0.4) * (d + 12) * 0.85); c.stroke(); }
      });
      cell(10, () => {                                                 // arrasto de sangue seco
        for (let i = 0; i < 6; i++) { c.strokeStyle = "rgba(" + (r() < 0.5 ? BD : BL) + "," + (0.5 + r() * 0.4) + ")"; c.lineWidth = 6 + r() * 8; c.lineCap = "round"; c.beginPath(); c.moveTo(10 + r() * 30, 20 + i * 16); c.lineTo(80 + r() * 40, 30 + i * 14 + (r() - 0.5) * 12); c.stroke(); }
      });
      cell(11, () => {                                                 // membro dilacerado: músculo e osso
        const m = 64;
        c.fillStyle = "rgba(" + BD + ",0.95)"; c.beginPath(); c.ellipse(m, m, 56, 38, 0.2, 0, TAU); c.fill();
        c.fillStyle = "rgb(" + FL + ")"; c.beginPath(); c.ellipse(m, m, 49, 31, 0.2, 0, TAU); c.fill();
        for (let i = 0; i < 26; i++) { c.strokeStyle = i % 3 ? "rgba(120,20,26,0.8)" : "rgba(214,150,150,0.8)"; c.lineWidth = 1.6; const x = m - 44 + i * 3.5; c.beginPath(); c.moveTo(x, m - 26 + Math.abs(i - 13) * 0.6); c.lineTo(x + (r() - 0.5) * 6, m + 26 - Math.abs(i - 13) * 0.6); c.stroke(); }
        c.fillStyle = "rgb(224,214,190)"; c.beginPath(); c.ellipse(m + 4, m, 28, 9, 0.2, 0, TAU); c.fill();
        c.fillStyle = "rgba(160,150,120,0.8)"; c.beginPath(); c.ellipse(m + 8, m + 2, 18, 4, 0.2, 0, TAU); c.fill();
        for (let i = 0; i < 6; i++) blot2(m + (r() - 0.5) * 80, m + (r() - 0.5) * 50, 2 + r() * 4);
        function blot2(x, y, rr) { blob(x, y, rr, BL, 0.9); }
      });
      cell(12, () => {                                                 // podridão esverdeada com veias
        blob(64, 64, 56, "70,92,50", 0.65, 0.8); blob(64, 64, 34, "44,38,30", 0.6, 0.8);
        for (let i = 0; i < 10; i++) { let x = 64, y = 64, a = r() * TAU; c.strokeStyle = "rgba(40,60,70,0.55)"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 8; k++) { a += (r() - 0.5) * 0.9; x += Math.cos(a) * 7; y += Math.sin(a) * 6; c.lineTo(x, y); } c.stroke(); }
      });
      cell(13, () => {                                                 // arranhões
        for (let i = 0; i < 4; i++) {
          c.strokeStyle = "rgba(" + FL + ",0.95)"; c.lineWidth = 4.5; c.lineCap = "round"; c.beginPath(); c.moveTo(24 + i * 22, 10); c.quadraticCurveTo(34 + i * 22, 64, 24 + i * 22 + 8, 118); c.stroke();
          c.strokeStyle = "rgba(" + BD + ",0.95)"; c.lineWidth = 1.6; c.stroke();
        }
      });
      cell(14, () => {                                                 // mão ensanguentada
        c.fillStyle = "rgba(" + BL + ",0.9)"; c.beginPath(); c.ellipse(64, 84, 22, 26, 0, 0, TAU); c.fill();
        for (let i = 0; i < 5; i++) { const a = -2.6 + i * 0.55; c.strokeStyle = "rgba(" + BL + ",0.9)"; c.lineWidth = 8; c.lineCap = "round"; c.beginPath(); c.moveTo(64 + Math.cos(a) * 14, 70 + Math.sin(a) * 14); c.lineTo(64 + Math.cos(a) * 44, 70 + Math.sin(a) * 52); c.stroke(); }
      });
      cell(15, () => { for (let i = 0; i < 40; i++) blob(r() * 128, r() * 128, 3 + r() * 12, r() < 0.5 ? "40,32,24" : "60,50,38", 0.28); });
      const t = new THREE.CanvasTexture(cv);
      t.anisotropy = 4;
      return t;
    }
    function atlas() {
      if (!atlasTex) {
        atlasTex = paintAtlas();
        atlasMat = new THREE.MeshLambertMaterial({ map: atlasTex, transparent: true, depthWrite: false, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
        atlasMat.userData.shared = true;
      }
      return atlasMat;
    }
    const CELLS = { splat0: 0, splat1: 1, drips: 2, gash: 3, bite: 4, bullet: 5, belly: 6, chest: 7, bruise: 8, burn: 9, smear: 10, tear: 11, rot: 12, claws: 13, hand: 14, dirt: 15 };

    // ---------------- perfis (raio por altura) para moldar decalques ----------------
    const PROF = {};                                            // preenchido por zanat.js: { f(y)->[rx,rz,cz], bump(phi,y) }

    class Decals {
      constructor() { this.P = []; this.N = []; this.U = []; this.C = []; this.I = []; this.n = 0; }
      // prof: nome do perfil; y: altura; phi: ângulo (PI = frente); w,h: tamanho em metros; sx/sz: escalas da peça
      add(prof, y, phi, w, h, cell, o) {
        o = o || {};
        const Pf = PROF[prof], sx = o.sx || 1, sz = o.sz || 1, rot = o.rot || 0, tint = o.tint === undefined ? 1 : o.tint;
        const G = 6, base = this.n, cs = Math.cos(rot), sn = Math.sin(rot), eps = o.eps || 0.003, ft = o.fat || 1;
        const cx = (cell % COLS) * CELL, cy = Math.floor(cell / COLS) * CELL;
        for (let j = 0; j <= G; j++) for (let i = 0; i <= G; i++) {
          const ux = (i / G - 0.5) * w, uy = (j / G - 0.5) * h;
          const dx = ux * cs - uy * sn, dy = ux * sn + uy * cs;
          const yy = y + dy, pr = Pf.f(yy), A = pr[0] * sx * ft, B = pr[1] * sz * ft, ph = phi + dx / Math.max(0.02, A);
          const sp = Math.sin(ph), cp = Math.cos(ph);
          let nx = sp / A, nz = cp / B; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
          const d = (Pf.bump ? Pf.bump(ph, yy) : 0) + eps;
          this.P.push(A * sp + nx * d, yy, pr[2] + B * cp + nz * d);
          this.N.push(nx, 0, nz);
          this.U.push((cx + 2 + (i / G) * (CELL - 4)) / (CELL * COLS), 1 - (cy + 2 + (1 - j / G) * (CELL - 4)) / (CELL * ROWS));
          this.C.push(tint, tint, tint);
          this.n++;
        }
        for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
          const a = base + j * (G + 1) + i, b = a + 1, c = a + G + 1, d = c + 1;
          this.I.push(a, c, b, b, c, d);
        }
      }
      get empty() { return this.n === 0; }
      mesh() {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(this.P, 3));
        g.setAttribute("normal", new THREE.Float32BufferAttribute(this.N, 3));
        g.setAttribute("uv", new THREE.Float32BufferAttribute(this.U, 2));
        g.setAttribute("color", new THREE.Float32BufferAttribute(this.C, 3));
        g.setIndex(this.I);
        const m = new THREE.Mesh(g, atlas());
        m.renderOrder = 1; m.userData.ownGeo = true;
        return m;
      }
    }

    // ---------------- fusão de malhas por osso (menos chamadas de desenho) ----------------
    const tmpM = new THREE.Matrix4(), tmpN = new THREE.Matrix3(), tmpV = new THREE.Vector3();
    function sig(m) {
      const mt = m.material;
      return [mt.type, mt.side, mt.map ? mt.map.uuid : "", mt.emissive ? mt.emissive.getHex() : "", mt.transparent ? 1 : 0, mt.vertexColors ? 1 : 0, mt.alphaTest, mt.userData.shared ? "S" : "", mt.userData.keep ? m.uuid : "",
        mt.vertexColors || mt.map ? mt.color.getHex() : ""].join("|");
    }
    function consolidate(group, bodyMat) {
      const groups = new Map(), keepers = [];
      for (const ch of group.children.slice()) {
        if (!ch.isMesh || ch.userData.keep || !ch.geometry || !ch.geometry.index) continue;
        const s = sig(ch);
        if (!groups.has(s)) groups.set(s, []);
        groups.get(s).push(ch);
      }
      for (const [, list] of groups) {
        if (list.length < 2 && !(list[0].material.type === "MeshLambertMaterial" && !list[0].material.map)) { continue; }
        const first = list[0], mt = first.material;
        const bake = !mt.vertexColors && !mt.map && mt.type === "MeshLambertMaterial";
        let nv = 0, ni = 0;
        for (const m of list) { nv += m.geometry.attributes.position.count; ni += m.geometry.index.count; }
        const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), U = new Float32Array(nv * 2), Cc = new Float32Array(nv * 3);
        const I = new Uint32Array(ni);
        let vo = 0, io = 0, cast = false;
        for (const m of list) {
          m.updateMatrix(); tmpM.copy(m.matrix); tmpN.getNormalMatrix(tmpM);
          const g = m.geometry, p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv, col = g.attributes.color;
          const c0 = bake ? m.material.color : null;
          for (let i = 0; i < p.count; i++) {
            tmpV.set(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(tmpM);
            P[(vo + i) * 3] = tmpV.x; P[(vo + i) * 3 + 1] = tmpV.y; P[(vo + i) * 3 + 2] = tmpV.z;
            tmpV.set(n.getX(i), n.getY(i), n.getZ(i)).applyMatrix3(tmpN).normalize();
            N[(vo + i) * 3] = tmpV.x; N[(vo + i) * 3 + 1] = tmpV.y; N[(vo + i) * 3 + 2] = tmpV.z;
            if (u) { U[(vo + i) * 2] = u.getX(i); U[(vo + i) * 2 + 1] = u.getY(i); }
            if (col) { Cc[(vo + i) * 3] = col.getX(i); Cc[(vo + i) * 3 + 1] = col.getY(i); Cc[(vo + i) * 3 + 2] = col.getZ(i); }
            else if (c0) { Cc[(vo + i) * 3] = c0.r; Cc[(vo + i) * 3 + 1] = c0.g; Cc[(vo + i) * 3 + 2] = c0.b; }
            else { Cc[(vo + i) * 3] = Cc[(vo + i) * 3 + 1] = Cc[(vo + i) * 3 + 2] = 1; }
          }
          const ix = g.index;
          for (let i = 0; i < ix.count; i++) I[io + i] = ix.getX(i) + vo;
          vo += p.count; io += ix.count; cast = cast || m.castShadow;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(P, 3)); geo.setAttribute("normal", new THREE.BufferAttribute(N, 3));
        geo.setAttribute("uv", new THREE.BufferAttribute(U, 2)); geo.setAttribute("color", new THREE.BufferAttribute(Cc, 3));
        geo.setIndex(new THREE.BufferAttribute(I, 1));
        let mat2 = mt;
        if (bake) { mat2 = bodyMat(mt.side); }
        const mesh = new THREE.Mesh(geo, mat2);
        mesh.castShadow = cast; mesh.renderOrder = first.renderOrder;
        keepers.push(mesh);
        for (const m of list) { group.remove(m); if (m.userData.ownGeo) m.geometry.dispose(); }
      }
      for (const k of keepers) { k.userData.merged = true; group.add(k); }
    }

    // ---------------- peças 3D de gore ----------------
    const flesh = () => new THREE.MeshPhongMaterial({ color: 0xa83a44, specular: 0x886666, shininess: 60 });
    const MAT = {};
    const gm = (k, f) => MAT[k] || (MAT[k] = f());
    function intestines(r) {                                   // tripas penduradas (origem na barriga)
      const g = new THREE.Group();
      const n = 2 + Math.floor(r() * 2);
      for (let k = 0; k < n; k++) {
        const pts = [], len = 0.14 + r() * 0.2, sx0 = (r() - 0.5) * 0.12;
        for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(new THREE.Vector3(sx0 + Math.sin(t * 5 + k) * 0.03 * t + (r() - 0.5) * 0.006, -t * len, -0.008 - Math.sin(t * Math.PI) * 0.045)); }
        const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.014 + r() * 0.008, 7, false);
        const m = new THREE.Mesh(geo, gm("gut" + (k % 2), () => new THREE.MeshPhongMaterial({ color: k % 2 ? 0xb4606e : 0x9a4458, specular: 0xaa8888, shininess: 70 })));
        m.userData.keep = true; m.userData.ownGeo = true; m.castShadow = false; g.add(m);
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), gm("gutT", () => new THREE.MeshPhongMaterial({ color: 0x7a2a34, specular: 0x886666, shininess: 50 })));
        tip.position.copy(pts[pts.length - 1]); tip.userData.keep = true; tip.userData.ownGeo = true; g.add(tip);
      }
      return g;
    }
    function ribs(n) {
      const g = new THREE.Group();
      const bone = gm("bone", () => new THREE.MeshPhongMaterial({ color: 0xd8cfb4, specular: 0x666650, shininess: 25 }));
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.0062, 6, 12, Math.PI * 0.62), bone);
        m.position.set(0, i * 0.032, -0.02); m.rotation.set(0.15, 0, Math.PI * 0.69); m.userData.keep = true; m.userData.ownGeo = true; g.add(m);
      }
      return g;
    }
    // ponta cortada de um membro (pele rasgada + osso)
    function stump(rad, boneLen) {
      const g = new THREE.Group();
      const fl = gm("stumpF", () => new THREE.MeshPhongMaterial({ color: 0x9c2a32, specular: 0x886666, shininess: 50 }));
      const dk = gm("stumpD", () => new THREE.MeshLambertMaterial({ color: 0x3a0608 }));
      const bone = gm("bone", () => new THREE.MeshPhongMaterial({ color: 0xd8cfb4, specular: 0x666650, shininess: 25 }));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(rad * 0.9, rad * 0.22, 6, 12), fl); ring.rotation.x = Math.PI / 2; ring.userData.keep = true; ring.userData.ownGeo = true; g.add(ring);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(rad * 0.95, 12), dk); disc.rotation.x = Math.PI / 2; disc.position.y = -0.0006; disc.userData.keep = true; disc.userData.ownGeo = true; g.add(disc);
      const b = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.28, rad * 0.34, boneLen, 7), bone); b.position.y = -boneLen / 2; b.userData.keep = true; b.userData.ownGeo = true; g.add(b);
      const b2 = new THREE.Mesh(new THREE.SphereGeometry(rad * 0.34, 7, 5), bone); b2.position.y = -boneLen; b2.scale.y = 0.8; b2.userData.keep = true; b2.userData.ownGeo = true; g.add(b2);
      for (let i = 0; i < 5; i++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.16, rad * 0.8, 5), fl); const a = (i / 5) * TAU; sp.position.set(Math.cos(a) * rad * 0.8, -rad * 0.4, Math.sin(a) * rad * 0.8); sp.userData.keep = true; sp.userData.ownGeo = true; g.add(sp); }
      return g;
    }
    function bonePoke(len, rad) {
      const bone = gm("bone", () => new THREE.MeshPhongMaterial({ color: 0xd8cfb4, specular: 0x666650, shininess: 25 }));
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.7, rad, len, 6), bone);
      m.userData.keep = true; m.userData.ownGeo = true; return m;
    }
    return { atlas, CELLS, Decals, consolidate, intestines, ribs, stump, bonePoke, PROF, gm };
  })();
