  // ======================================================================
  //  O LENHADOR: zumbi enorme de barba, camisa xadrez e machado de duas mãos.
  //  A lógica (logic.js: updateLumber) manda z.act / z.seqT / z.combo (1 = machado na mão) / z.ax,z.ay.
  //  Aqui: modelo do machado, poses (braços por cinemática inversa até o cabo) e o machado solto no mundo
  //  (preso no chão, voando, caído).
  // ======================================================================
  function makeAxe() {
    const g = new THREE.Group(); g.rotation.order = "YXZ";
    const wood = new THREE.MeshPhongMaterial({ color: 0x3a2413, specular: 0x1a120a, shininess: 8 });
    const steel = new THREE.MeshPhongMaterial({ color: 0x7f868e, specular: 0xaab2bc, shininess: 60 });
    const dark = new THREE.MeshPhongMaterial({ color: 0x2c3036, specular: 0x555a60, shininess: 30 });
    const gore = new THREE.MeshLambertMaterial({ color: 0x4a0606 });
    const mats = [wood, steel, dark, gore]; for (const m of mats) m.userData.own = true;
    const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
    // cabo (de -0,45 a 0,8), levemente curvo na ponta
    add(new THREE.CylinderGeometry(0.02, 0.026, 1.25, 10), wood, 0, 0.175, 0);
    add(new THREE.CylinderGeometry(0.03, 0.024, 0.07, 10), wood, 0, -0.44, 0);
    for (let i = 0; i < 4; i++) add(new THREE.CylinderGeometry(0.0275, 0.0275, 0.018, 10), dark, 0, -0.34 + i * 0.075, 0);   // fita do punho
    // cabeça do machado: olhal + lâmina larga (fio para -Z) + martelo atrás
    add(new THREE.BoxGeometry(0.06, 0.15, 0.13), dark, 0, 0.72, -0.01);
    const sh = new THREE.Shape();
    sh.moveTo(0.05, 0.075); sh.lineTo(0.3, 0.2); sh.quadraticCurveTo(0.385, 0, 0.3, -0.2); sh.lineTo(0.05, -0.075); sh.closePath();
    const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.014, bevelSegments: 2 });
    bg.translate(0, 0, -0.006); bg.rotateY(Math.PI / 2);
    add(bg, steel, 0, 0.72, 0);
    add(new THREE.BoxGeometry(0.07, 0.09, 0.07), dark, 0, 0.72, 0.085);
    // sangue seco no fio
    const sb = new THREE.Shape(); sb.moveTo(0.24, 0.17); sb.lineTo(0.3, 0.2); sb.quadraticCurveTo(0.385, 0, 0.3, -0.2); sb.lineTo(0.22, -0.14); sb.quadraticCurveTo(0.3, 0, 0.24, 0.17);
    const sg = new THREE.ExtrudeGeometry(sb, { depth: 0.04, bevelEnabled: false }); sg.translate(0, 0, -0.02); sg.rotateY(Math.PI / 2);
    add(sg, gore, 0, 0.72, 0).castShadow = false;
    g.userData = { mats, hL: new THREE.Vector3(0, -0.36, 0), hR: new THREE.Vector3(0, -0.1, 0), head: new THREE.Vector3(0, 0.72, -0.3) };
    return g;
  }

  class LumberView extends EliteView {
    constructor(z) {
      super(z);
      const R = ZE, hz = ZH.HZ;
      // barbão (por cima da barba do rosto) e suspensórios
      const hairM = R.mkPhong({ specular: 0x0a0806, shininess: 3 });
      this.gm.push(hairM);
      const b = new R.GB(), BR = 0x3a2516, BR2 = 0x2c1b10;
      b.add(R.GEO.sph, [0, hz - 0.125, -0.082], [0.25, 0, 0], [0.078, 0.105, 0.05], BR, 0.5);
      b.add(R.GEO.sph, [0, hz - 0.2, -0.07], [0.3, 0, 0], [0.058, 0.075, 0.04], BR2, 0.5);
      for (const sx of [-1, 1]) { b.add(R.GEO.sph, [sx * 0.07, hz - 0.075, -0.045], null, [0.035, 0.07, 0.05], BR, 0.5); b.add(R.GEO.sph, [sx * 0.035, hz - 0.045, -0.105], [0, 0, sx * 0.5], [0.04, 0.016, 0.02], BR2, 0.4); }
      this.head.add(b.mesh(hairM));
      const ax = (this.ax = makeAxe());
      this.gm.push(...ax.userData.mats);
      this.spine.add(ax);
      this.axMode = "hand"; this.fly = null; this.wasAct = ""; this.t0 = 0;
      this.shL = this.sL.position.clone(); this.shR = this.sR.position.clone();
      this._v = new THREE.Vector3(); this._w = new THREE.Vector3(); this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion();
      this.poleL = new THREE.Vector3(-0.5, -0.6, 0.5); this.poleR = new THREE.Vector3(0.5, -0.6, 0.5);
    }
    // machado solto no mundo, cravado com a cabeça em (hx,hy,hz) (coordenadas do three) e o cabo apontando de volta ao longo de -f, subindo "elev"
    plant(hx, hy, hz, fx, fz, elev, s) {
      const ax = this.ax, c = Math.cos(elev), sn = Math.sin(elev);
      const Y = new THREE.Vector3(fx * c, -sn, fz * c), Z = new THREE.Vector3(fx * sn, c, fz * sn), X = new THREE.Vector3().crossVectors(Y, Z);
      this._m.makeBasis(X, Y, Z);
      if (ax.parent !== scene) { ax.parent.remove(ax); scene.add(ax); }
      ax.quaternion.setFromRotationMatrix(this._m); ax.scale.setScalar(s);
      this._v.copy(ax.userData.head).multiplyScalar(s).applyQuaternion(ax.quaternion);
      ax.position.set(hx - this._v.x, hy - this._v.y, hz - this._v.z);
      this.axMode = "world";
    }
    toHand() {
      const ax = this.ax;
      if (ax.parent !== this.spine) this.spine.attach(ax);                               // mantém a posição no mundo e volta suave para as mãos
      ax.scale.setScalar(1); this.axMode = "hand";
      const o = this.sp; o.apx = ax.position.x; o.apy = ax.position.y; o.apz = ax.position.z; o.arx = ax.rotation.x; o.ary = ax.rotation.y; o.arz = ax.rotation.z;
    }
    update(z) {
      const dt = this.dtNow(), R = ZE, sm = R.sm, mix = R.mix, PI = Math.PI, s = z.s;
      this.hotFlash(z);
      const ax = this.ax, act = z.act, t = z.seqT, fwx = -Math.sin(z.yaw), fwz = -Math.cos(z.yaw);     // frente no mundo (x, z do three)
      if (z.state === "dead") {
        if (this.axMode === "hand") { ax.updateWorldMatrix(true, false); const p = new THREE.Vector3(); ax.localToWorld(p.copy(ax.userData.head)); this.plant(p.x + fwx * 0.6, 0.05, p.z + fwz * 0.6, fwx, fwz, 0.12, s); }
        this.flyTick(dt, z); super.update(z); return;
      }
      const hot = z.hitT > 0;
      if (hot !== this.hot) { this.hot = hot; for (const m of this.mats) if (m.emissive && !m.userData.glow) m.emissive.setHex(hot ? 0x661100 : (m.userData.base || 0)); }
      const entered = act !== this.wasAct; if (entered) { this.prevAct = this.wasAct; this.wasAct = act; }
      const ph = z.phase, sw = Math.sin(ph), cw = Math.cos(ph);
      // ---------- pose ----------
      let lean = 0.14, crouch = 0, twist = -sw * 0.1, headX = 0.12, jaw = 0.1 + 0.12 * Math.max(0, Math.sin(ph * 0.5)), legAmp = 0.5, legSw = 1, bob = Math.abs(sw) * 0.05, rate = 10;
      let lay = 0, roll = 0, kick = 0, shake = 0, yawAdd = 0;
      let ap = [0.05, 0.16 + Math.abs(sw) * 0.015, -0.2], ar = [-0.35, 0, -0.75];          // machado atravessado no peito (cabeça sobre o ombro direito)
      let free = null;                                                                    // braços soltos: [ombroE, cotoveloE, ombroD, cotoveloD, abreE, abreD]
      const armed = z.combo === 1;
      if (act === "chop" || (act === "fin" && z.atk === "split")) {
        const fin = act === "fin";
        legSw = 0; legAmp = 0; twist = 0; bob = 0;
        if (!fin && t < 0.95) {                                                           // ergue o machado acima da cabeça
          const u = sm(t / 0.7), hold = Math.sin(t * 26) * 0.01 * u;
          ap = [0, mix(0.16, 0.86, u), mix(-0.2, 0.06, u) + hold]; ar = [mix(-0.35, 0.75, u), 0, mix(-0.75, 0, u)];
          lean = mix(0.14, -0.3, u); crouch = 0.15 * u; headX = -0.2 * u; jaw = 0.75 * u; rate = 11; shake = 0.01 * u;
        } else if (!fin) {                                                                // desce
          ap = [0, 0.0, -0.42]; ar = [-1.9, 0, 0]; lean = 0.95; crouch = 0.55; headX = 0.4; jaw = 0.85; rate = 34;
        } else {                                                                          // finalização: machado cravado no meio do corpo; depois arranca e ruge
          if (t < 2.5) { lean = 0.62; crouch = 0.35; headX = 0.35; jaw = 0.5 + 0.2 * Math.sin(t * 9); rate = 30; shake = t < 0.25 ? 0.03 : 0; }
          else if (t < 3.1) { const u = sm((t - 2.5) / 0.6); ap = [0.05, mix(0.1, 0.3, u), -0.25]; ar = [mix(-1.6, -0.2, u), 0, mix(0, -0.75, u)]; lean = mix(0.62, 0.0, u); crouch = 0.35 * (1 - u); rate = 12; }
          else if (t < 5.4) { const u = sm((t - 3.1) / 0.5); ap = [0.02, mix(0.3, 0.92, u), 0.02]; ar = [0.25, 0, -0.25]; lean = -0.28 * u; headX = -0.45 * u; jaw = 0.95 * u; shake = 0.012 * u; rate = 8; }
        }
      } else if (act === "stuck") {
        const T = z.dodgeDir || 6;
        legSw = 0; legAmp = 0; twist = 0; bob = 0;
        let pull = 0, last = 0;
        for (let i = 0; i < 3; i++) { const c = T * (0.22 + 0.3 * i), u = (t - c + 0.35) / 0.9; if (u > 0 && u < 1) { const k = Math.sin(u * PI); if (k > pull) pull = k; if (i === 2) last = sm(u * 1.4); } }
        lean = 0.9 - 0.45 * pull; crouch = 0.5 + 0.25 * pull; headX = 0.45 - 0.5 * pull; jaw = 0.3 + 0.6 * pull; shake = 0.022 * pull; rate = 14;
        if (last > 0 && t > T * 0.82) { lean = mix(0.45, -0.42, last); crouch = 0.3 * (1 - last); headX = -0.3 * last; }
        this.pullK = pull;
      } else if (act === "spin" || (act === "fin" && z.atk === "slash")) {
        const fin = act === "fin";
        legAmp = 0; legSw = 0; bob = 0;
        if (!fin && t < 0.85) { const u = sm(t / 0.7); ap = [mix(0.05, 0.5, u), mix(0.16, 0.24, u), mix(-0.2, -0.12, u)]; ar = [0, 0, mix(-0.75, -PI / 2, u)]; twist = -0.95 * u; lean = 0.1; crouch = 0.3 * u; jaw = 0.6 * u; headX = 0.2; rate = 12; }
        else if (!fin) { ap = [0.52, 0.2, -0.3]; ar = [0, 0, -PI / 2]; twist = 0.45; lean = 0.2; crouch = 0.3; jaw = 0.9; headX = 0.1; rate = 24; }
        else if (t < 3.6) { const u = sm(t / 0.5); ap = [mix(0.52, -0.3, u), mix(0.2, 0.02, u), -0.28]; ar = [-0.3 * u, 0, mix(-PI / 2, -2.5, u)]; twist = mix(0.45, 0.75, u) - 0.3 * sm((t - 1) / 1.5); lean = 0.15; crouch = 0.2 * (1 - u); jaw = 0.25 + 0.1 * Math.sin(t * 5); headX = 0.25; rate = 10; }
        else if (t < 6) { const u = sm((t - 3.6) / 0.6); ap = [0.02, mix(0.1, 0.92, u), 0.02]; ar = [0.25, 0, -0.25]; lean = -0.28 * u; headX = -0.45 * u; jaw = 0.95 * u; shake = 0.012 * u; rate = 8; }
      } else if (act === "down") {                                                        // perdeu o machado no giro e caiu de costas
        const u = sm(t / 0.5); lay = u; legSw = 0; legAmp = 0; twist = 0; bob = 0; jaw = 0.5 + 0.3 * Math.sin(t * 6); headX = -0.2;
        free = [1.9 + 0.3 * Math.sin(t * 5), 0.5, 2.2 + 0.3 * Math.sin(t * 5 + 1), 0.4, -0.7, 0.7]; kick = 0.25 * Math.sin(t * 4);
        shake = t > 0.4 && t < 0.7 ? 0.03 : 0;
      } else if (act === "rise") {                                                        // rola, apoia as mãos e levanta
        const u = sm(t / 3), a = sm(t / 1.2), b2 = sm((t - 1.2) / 1.8);
        lay = 1 - b2; roll = 0.5 * a * (1 - b2); legSw = 0; legAmp = 0; twist = 0; bob = 0; crouch = 0.9 * b2 * (1 - sm((t - 2.3) / 0.7)); lean = 0.5 * b2 * (1 - u * u);
        free = [mix(1.9, 0.5, a), 0.7, mix(2.2, 0.4, a), 0.9, -0.5, 0.5]; jaw = 0.5; headX = 0.2; rate = 7;
      } else if (act === "grab") {                                                        // abaixa e pega o machado do chão
        const u = Math.sin(Math.min(1, t / 0.9) * PI); legSw = 0; legAmp = 0; twist = 0; bob = 0; lean = 0.2 + 0.7 * u; crouch = 0.75 * u; headX = 0.4 * u;
        free = [0.6 + 0.9 * u, 0.3, 0.6 + 0.9 * u, 0.3, -0.05, 0.05];
      } else if (act === "punch") {
        const w = sm(t / 0.34), hit = t >= 0.42 ? 1 - sm((t - 0.55) / 0.4) : 0, k = t >= 0.36 ? sm((t - 0.36) / 0.07) : 0;
        legSw = 0.15; legAmp = 0.2; bob = 0; twist = mix(-0.7 * w, 0.75, k) * (t < 0.42 ? 1 : 0.4 + 0.6 * hit); lean = 0.1 + 0.45 * k * (0.3 + 0.7 * hit); jaw = 0.8; headX = 0.2;
        free = [0.9, 1.2, mix(mix(0.5, -0.5, w), 1.65, k), mix(mix(0.6, 1.9, w), 0.12, k), -0.15, 0.1]; rate = k > 0 ? 30 : 12;
      } else if (act === "kick") {
        const w = sm(t / 0.4), k = t >= 0.42 ? sm((t - 0.42) / 0.08) : 0, back = sm((t - 0.65) / 0.4);
        legSw = 0; legAmp = 0; bob = 0; twist = 0.15 * k; lean = mix(0.15 * w, -0.35, k) * (1 - back); jaw = 0.8; headX = 0.25;
        kick = mix(-0.55 * w, 1.5, k) * (1 - back); free = [0.5 - 0.7 * k, 0.6, 0.9, 1.0, -0.4, 0.3]; rate = k > 0 ? 30 : 12;
      } else if (act === "recover") {
        const u = 1 - sm(t / 0.9); lean = 0.14 + 0.3 * u; crouch = 0.25 * u; legSw = 0.3; headX = 0.3 * u; jaw = 0.4;
      } else if (!armed) {                                                                // correndo de mãos vazias (ou voltando para o machado)
        legAmp = 0.8; lean = 0.32; bob = Math.abs(sw) * 0.07; jaw = 0.55; headX = 0.25;
        free = [0.5 - sw * 0.9, 1.0, 0.5 + sw * 0.9, 1.0, -0.2, 0.2];
      }
      const e = (k, v, r) => this.ease(k, v, dt, r || rate);
      lean = e("lean", lean); crouch = e("crouch", crouch, Math.max(9, rate * 0.8)); twist = e("twist", twist, Math.max(12, rate)); headX = e("headX", headX, 9); jaw = e("jaw", jaw, 14);
      lay = e("lay", lay, 9); roll = e("roll", roll, 6); kick = e("kick", kick, Math.max(14, rate)); const lS = e("lS", legSw, 8);
      // finalização: vira de frente para a vítima
      if (act === "fin" && this.finYaw !== undefined) { const d = Math.atan2(Math.sin(this.finYaw - z.yaw), Math.cos(this.finYaw - z.yaw)); yawAdd = e("yawAdd", d, 7); } else { this.finYaw = undefined; yawAdd = e("yawAdd", 0, 7); }
      const jx = shake ? (Math.random() - 0.5) * shake * s : 0, jy = shake ? (Math.random() - 0.5) * shake * s : 0;
      const root = this.root;
      put(this.shadow, z.x, z.y, 0.02);
      put(root, z.x + jx, z.y + jy, (bob - 0.3 * crouch * 0.6) * s * (1 - lay) + lay * 0.2 * s);
      root.rotation.set(-lean * 0.3 * (1 - lay) + lay * 1.5, z.yaw + yawAdd, roll);
      this.spine.rotation.set(-lean * 0.7 * (1 - lay), twist, 0);
      const A = legAmp * (0.4 + 0.6 * lS);
      this.hL.rotation.x = sw * A * lS + 0.7 * crouch + lay * 0.25; this.hR.rotation.x = -sw * A * lS + 0.7 * crouch + kick + lay * 0.1;
      this.kL.rotation.x = -(0.1 + Math.max(0, cw) * 0.8 * A * lS + 1.15 * crouch + lay * 0.5); this.kR.rotation.x = -(0.1 + Math.max(0, -cw) * 0.8 * A * lS + 1.15 * crouch + (kick < 0 ? -kick * 1.4 : 0) + lay * 0.2);
      this.head.rotation.set(headX, Math.sin(ph * 0.4) * 0.07, 0);
      this.setJaw(jaw);
      // ---------- machado ----------
      const wantWorld = (act === "stuck" && t < (z.dodgeDir || 6) * 0.82 + 0.12) || (act === "fin" && z.atk === "split" && t < 2.5) || !armed;
      if (entered && act === "stuck") { this.plant(z.x + fwx * 1.05 * s, 0.02 * s, -z.y + fwz * 1.05 * s, fwx, fwz, 0.62, s); this.baseQ = ax.quaternion.clone(); this.baseP = ax.position.clone(); }
      if (entered && act === "fin" && z.atk === "split") { const v = this.victim || [z.x + fwx * 1.05 * s, -z.y + fwz * 1.05 * s]; let dx = v[0] - z.x, dz = v[1] + z.y; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d; this.plant(v[0], 0.98, v[1], dx, dz, 0.2, s); }
      if (entered && act === "down" && this.axMode === "hand") {                          // o machado escapa e voa até (ax, ay)
        ax.updateWorldMatrix(true, false); const p = new THREE.Vector3(), q = new THREE.Quaternion(); ax.getWorldPosition(p); ax.getWorldQuaternion(q);
        ax.parent.remove(ax); scene.add(ax); ax.position.copy(p); ax.quaternion.copy(q); ax.scale.setScalar(s); this.axMode = "world";
        this.fly = { t: 0, T: 0.8, from: p.clone(), to: new THREE.Vector3(z.ax, 0, -z.ay), q0: q.clone() };
      }
      if (!armed && !this.fly && this.axMode === "hand") this.plant(z.ax, 0.04 * s, -z.ay, fwx, fwz, 0.5, s);      // (entrou no meio: machado já está no chão)
      if (this.axMode === "world" && !wantWorld && !this.fly) { root.updateMatrixWorld(true); this.toHand(); }
      this.flyTick(dt, z);
      if (this.axMode === "world" && act === "stuck" && this.baseQ) {                      // puxões: o cabo balança, na terceira sai
        const k = this.pullK || 0; this._q.setFromAxisAngle(this._v.set(-fwz, 0, fwx), -0.16 * k + (k > 0.05 ? (Math.random() - 0.5) * 0.02 : 0));
        ax.quaternion.copy(this._q).multiply(this.baseQ); ax.position.copy(this.baseP); ax.position.y += 0.05 * s * k;
      }
      const U = ax.userData;
      if (this.axMode === "hand") {
        ax.position.set(e("apx", ap[0]), e("apy", ap[1]), e("apz", ap[2])); ax.rotation.set(e("arx", ar[0]), e("ary", ar[1]), e("arz", ar[2])); ax.updateMatrix();
        this._v.copy(U.hL).applyMatrix4(ax.matrix); R.ik(this.sL, this.eL, this._v, this.poleL, 0.29, 0.258);
        this._w.copy(U.hR).applyMatrix4(ax.matrix); R.ik(this.sR, this.eR, this._w, this.poleR, 0.29, 0.258);
        this.wL.rotation.set(0.1, 0, 0); this.wR.rotation.set(0.1, 0, 0);
      } else if (wantWorld && armed) {                                                    // mãos no cabo do machado cravado
        root.updateMatrixWorld(true); ax.updateMatrixWorld(true);
        this.spine.worldToLocal(ax.localToWorld(this._v.copy(U.hL))); R.ik(this.sL, this.eL, this._v, this.poleL, 0.29, 0.258);
        this.spine.worldToLocal(ax.localToWorld(this._w.copy(U.hR))); R.ik(this.sR, this.eR, this._w, this.poleR, 0.29, 0.258);
      } else {
        const f = free || [0.2 - sw * 0.3, 0.3, 0.2 + sw * 0.3, 0.3, -0.1, 0.1];
        this.sL.rotation.set(e("fl", f[0], 14), 0, e("flz", f[4], 10)); this.eL.rotation.set(e("fle", f[1], 14), 0, 0);
        this.sR.rotation.set(e("fr", f[2], Math.max(14, rate)), 0, e("frz", f[5], 10)); this.eR.rotation.set(e("fre", f[3], Math.max(14, rate)), 0, 0);
      }
    }
    flyTick(dt, z) {
      const f = this.fly; if (!f) return;
      const ax = this.ax, s = z.s;
      f.t += dt; const u = Math.min(1, f.t / f.T);
      ax.position.lerpVectors(f.from, f.to, u); ax.position.y = f.from.y * (1 - u) + Math.sin(u * Math.PI) * 2.6 + 0.3 * u;
      ax.rotateX(-dt * 17);
      if (u >= 1) {
        let dx = f.to.x - f.from.x, dz = f.to.z - f.from.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
        this.plant(f.to.x, 0.03 * s, f.to.z, dx, dz, 0.55, s); this.fly = null;
      }
    }
    destroy() {
      if (this.ax.parent) this.ax.parent.remove(this.ax);
      this.ax.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
      super.destroy();
    }
  }

  // ======================================================================
  //  FINALIZAÇÕES DO LENHADOR: a câmera sai da primeira pessoa e vai para trás do corpo do jogador.
  //  "split": o machado desce e parte o corpo ao meio (cada metade cai para o seu lado).
  //  "slash": corte lateral tão rápido que nada parece ter acontecido; 3 s depois o sangue jorra e o tronco cai para trás.
  // ======================================================================
  const Gore = (function () {
    let cur = null, pool = null;
    const V = THREE.Vector3;
    function dummy(shirtHex) {
      const M = (c) => new THREE.MeshLambertMaterial({ color: c });
      const mShirt = M(shirtHex), mPants = M(0x3a3f47), mBoot = M(0x17181a), mSkin = M(0xd0a07c), mVest = M(0x2d3328), mHelm = M(0x3b4636, 0.6), mPack = M(0x4a4a34);
      const meat = new THREE.MeshLambertMaterial({ color: 0x7a0a0a, emissive: 0x2a0000 }), bone = M(0xd8d0c0, 0.6), bloodM = new THREE.MeshLambertMaterial({ color: 0x6a0505, emissive: 0x220000 });
      const root = new THREE.Group(); root.rotation.order = "YXZ";
      const box = (w, h, d, m, x, y, z, p) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; p.add(o); return o; };
      const cyl = (rt, rb, h, m, x, y, z, p) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 10), m); o.position.set(x, y, z); o.castShadow = true; p.add(o); return o; };
      const sides = [], ups = [], lows = [], streaks = [];
      for (const sx of [-1, 1]) {
        const side = new THREE.Group(); side.position.set(sx * 0.1, 0, 0); root.add(side); sides.push(side);        // pivô no pé
        const low = new THREE.Group(); side.add(low); lows.push(low);
        const X = (x) => x - sx * 0.1;                                                                            // de coordenada do corpo para a do lado
        cyl(0.085, 0.07, 0.8, mPants, X(sx * 0.1), 0.5, 0, low);
        box(0.15, 0.14, 0.27, mBoot, X(sx * 0.1), 0.07, -0.04, low);
        box(0.21, 0.14, 0.25, mPants, X(sx * 0.105), 0.93, 0, low);
        box(0.21, 0.05, 0.26, M(0x1a1a1a), X(sx * 0.105), 0.985, 0, low);
        box(0.012, 0.16, 0.22, meat, X(sx * 0.004), 0.93, 0, low).castShadow = false;                              // corte vertical (bacia)
        const lowCap = box(0.19, 0.012, 0.22, meat, X(sx * 0.105), 1.008, 0, low); lowCap.castShadow = false;       // corte horizontal (cintura)
        cyl(0.02, 0.02, 0.03, bone, X(sx * 0.02), 1.02, 0.04, low);
        const up = new THREE.Group(); up.position.set(-sx * 0.1, 1.01, 0); side.add(up); ups.push(up);             // pivô na cintura, no eixo do corpo
        const U = (y) => y - 1.01;
        box(0.22, 0.4, 0.25, mShirt, sx * 0.11, U(1.21), 0, up);
        box(0.23, 0.3, 0.29, mVest, sx * 0.115, U(1.2), 0, up);
        box(0.17, 0.4, 0.14, mPack, sx * 0.085, U(1.2), 0.2, up);
        box(0.012, 0.4, 0.22, meat, sx * 0.004, U(1.21), 0, up).castShadow = false;                                // corte vertical (tronco)
        box(0.19, 0.012, 0.22, meat, sx * 0.105, U(1.012), 0, up).castShadow = false;                              // corte horizontal
        const sh = new THREE.Mesh(new THREE.SphereGeometry(0.078, 12, 8), mShirt); sh.position.set(sx * 0.265, U(1.36), 0); up.add(sh);
        cyl(0.05, 0.045, 0.3, mShirt, sx * 0.285, U(1.2), 0, up); cyl(0.042, 0.036, 0.28, mSkin, sx * 0.29, U(0.93), -0.03, up);
        // meia cabeça e meio capacete
        const hd = new THREE.Mesh(new THREE.SphereGeometry(0.115, 14, 10, sx > 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI), mSkin); hd.position.set(0, U(1.6), 0); hd.scale.set(0.95, 1.12, 1); hd.castShadow = true; up.add(hd);
        const hm = new THREE.Mesh(new THREE.SphereGeometry(0.146, 14, 10, sx > 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI, 0, Math.PI * 0.55), mHelm); hm.position.set(0, U(1.635), 0); hm.castShadow = true; up.add(hm);
        const face = new THREE.Mesh(new THREE.CircleGeometry(0.11, 14), meat); face.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2; face.position.set(sx * 0.003, U(1.6), 0); face.scale.set(1, 1.12, 1); up.add(face);
        cyl(0.03, 0.032, 0.1, mSkin, sx * 0.028, U(1.45), 0, up);
        // sangue que escorre pelas pernas (cresce para baixo)
        for (let i = 0; i < 3; i++) { const st = box(0.03 + Math.random() * 0.03, 1, 0.012, bloodM, X(sx * (0.05 + i * 0.05)), 0.99, i % 2 ? 0.128 : -0.128, low); st.scale.y = 0.001; st.castShadow = false; st.userData.len = 0.35 + Math.random() * 0.55; streaks.push(st); }
      }
      // linha fina do corte lateral
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.012, 0.3), bloodM); line.position.set(0, 1.01, 0); line.visible = false; root.add(line);
      return { root, sides, ups, lows, streaks, line, mats: [mShirt, mPants, mBoot, mSkin, mVest, mHelm, mPack, meat, bone, bloodM] };
    }
    const bleed = (x, y, z, n, spd, up, size) => { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = spd * (0.3 + Math.random() * 0.7); pool.emit(x + (Math.random() - 0.5) * 0.2, y, z + (Math.random() - 0.5) * 0.2, Math.cos(a) * v, up * (0.3 + Math.random() * 0.9), Math.sin(a) * v, 0.7 + Math.random() * 0.8, (size || 1) * (0.5 + Math.random())); } };
    // z: zumbi; type: "split" | "slash"; px,py: posição do jogador; view: LumberView
    function start(z, type, px, py, view, shirt, hooks) {
      stop();
      if (!pool) pool = new Pool(new THREE.BoxGeometry(0.075, 0.075, 0.075), M.blood, 150);
      let dx = px - z.x, dy = py - z.y; const d0 = Math.hypot(dx, dy) || 1; dx /= d0; dy /= d0;
      const s = z.s, D = Math.min(Math.max(d0, 0.9 * s), 1.2 * s);
      let vx = z.x + dx * D, vy = z.y + dy * D;
      const lim = L.C.ARENA - 0.8; vx = Math.max(-lim, Math.min(lim, vx)); vy = Math.max(-lim, Math.min(lim, vy));
      const dm = dummy(shirt || 0x4a6a8a);
      dm.root.position.set(vx, 0, -vy);                                                                    // de frente para o zumbi
      dm.root.rotation.y = Math.atan2(-(z.x - vx), -((-z.y) - (-vy)));
      scene.add(dm.root);
      if (view) { view.victim = [vx, -vy]; view.finYaw = Math.atan2(-(vx - z.x), vy - z.y); }
      // câmera atrás do jogador: ele no meio da tela, o lenhador logo à frente
      let cx = vx + dx * 2.9 + -dy * 0.5, cy = vy + dy * 2.9 + dx * 0.5;
      cx = Math.max(-lim, Math.min(lim, cx)); cy = Math.max(-lim, Math.min(lim, cy));
      const pp = L.pushOut(cx, cy, 0.5); cx = pp[0]; cy = pp[1];
      cur = { z, type, t: 0, dm, vx, vy, dx, dy, cam: new V(cx, 1.95, -cy), look: new V(vx - dx * 0.6, 1.45, -(vy - dy * 0.6)), from: null, hooks: hooks || {}, ev: 0, dur: type === "split" ? 6.2 : 7.0, pools: 0 };
      return cur;
    }
    function stop() {
      if (!cur) return;
      scene.remove(cur.dm.root); cur.dm.root.traverse((o) => { if (o.isMesh) o.geometry.dispose(); }); for (const m of cur.dm.mats) m.dispose();
      cur = null;
    }
    const once = (bit) => { if (cur.ev & bit) return false; cur.ev |= bit; return true; };
    const sm = (t) => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
    function update(dt) {
      if (pool) pool.update(dt);
      const c = cur; if (!c) return;
      c.t += dt; const t = c.t, dm = c.dm, H = c.hooks, wx = c.vx, wz = -c.vy;
      if (c.type === "split") {
        if (once(1)) { bleed(wx, 1.5, wz, 46, 3.2, 3.5, 0.95); H.hit && H.hit(c, 1.6); }
        if (t < 1.3) { const g = sm(t / 0.5) * 0.02; dm.sides[0].position.x = -0.1 - g; dm.sides[1].position.x = 0.1 + g; if (Math.random() < dt * 30) bleed(wx, 0.6 + Math.random() * 1, wz, 2, 1.2, 1, 0.9); }
        else {
          const u = Math.min(1, (t - 1.3) / 0.95), k = u * u;
          dm.sides[0].rotation.z = 1.5 * k; dm.sides[1].rotation.z = -1.5 * k; dm.sides[0].rotation.x = -0.25 * k; dm.sides[1].rotation.x = 0.3 * k;
          if (u < 1 && Math.random() < dt * 40) bleed(wx, 0.3 + Math.random() * 0.8, wz, 3, 1.6, 0.6, 1);
          if (u >= 1 && once(2)) { H.thud && H.thud(c, 0.9); bloodPool(c.vx + c.dy * 0.9, c.vy - c.dx * 0.9, true); bloodPool(c.vx - c.dy * 0.9, c.vy + c.dx * 0.9, true); bloodPool(c.vx, c.vy, true); bleed(wx, 0.2, wz, 30, 2.4, 1.6, 1.2); }
        }
      } else {
        if (once(1)) { bleed(wx, 1.05, wz, 8, 2.5, 1, 0.6); H.swish && H.swish(c); }
        if (t > 0.5 && t < 3) { dm.line.visible = true; dm.line.scale.set(1.002, 0.25 + 0.75 * sm((t - 0.5) / 2.2), 1.01); if (t > 1.6 && Math.random() < dt * 5) bleed(wx, 1.0, wz, 1, 0.3, 0, 0.6); }
        if (t >= 3) {
          if (once(2)) { bleed(wx, 1.05, wz, 60, 4.2, 2.2, 1.4); H.hit && H.hit(c, 1.2); dm.line.scale.set(1.01, 1.6, 1.03); }
          if (t < 5.6 && Math.random() < dt * 70) bleed(wx, 1.02, wz, 3, 2.6, 1.4, 1.1);
          for (const st of dm.streaks) st.scale.y = Math.max(0.001, st.userData.len * sm((t - 3) / 1.6)), st.position.y = 0.99 - st.scale.y / 2;
          const u = Math.min(1, Math.max(0, (t - 3.5) / 1.1)), k = u * u;                    // o tronco escorrega e cai para trás
          for (const up of dm.ups) { up.rotation.x = 1.52 * k; up.position.z = 0.42 * sm(u * 1.3); up.position.y = 1.01 - 0.82 * k; }
          if (u > 0.05) dm.line.visible = false;
          if (u >= 1 && once(4)) { H.thud && H.thud(c, 0.8); bloodPool(c.vx + c.dx * 0.9, c.vy + c.dy * 0.9, true); bloodPool(c.vx, c.vy, true); }
          const v = Math.min(1, Math.max(0, (t - 4.9) / 0.8)), kv = v * v;                   // as pernas desabam
          for (const lw of dm.lows) lw.rotation.x = -1.45 * kv;
          if (v >= 1 && once(8)) { H.thud && H.thud(c, 0.5); bloodPool(c.vx - c.dx * 0.6, c.vy - c.dy * 0.6, true); }
        }
      }
      if (t >= c.dur) { const h = H.end; stop(); h && h(); }
    }
    // câmera: sai dos olhos do jogador e recua para trás do corpo
    function camera(cam, dt) {
      const c = cur; if (!c) return false;
      if (!c.from) c.from = { p: cam.position.clone(), q: cam.quaternion.clone() };
      const k = sm(c.t / 0.45);
      const tq = c._q || (c._q = new THREE.Quaternion()), m = c._m || (c._m = new THREE.Matrix4());
      const tp = c.cam.clone(); tp.y += Math.sin(c.t * 0.7) * 0.05; tp.x += Math.sin(c.t * 0.45) * 0.12 * c.dy; tp.z += Math.sin(c.t * 0.45) * 0.12 * c.dx;
      m.lookAt(tp, c.look, cam.up); tq.setFromRotationMatrix(m);
      cam.position.lerpVectors(c.from.p, tp, k); cam.quaternion.slerpQuaternions(c.from.q, tq, k);
      const sh = (c.shake || 0); if (sh > 0.001) { cam.position.x += (Math.random() - 0.5) * sh * 0.12; cam.position.y += (Math.random() - 0.5) * sh * 0.12; c.shake = sh * Math.exp(-6 * dt); }
      return true;
    }
    return { start, stop, update, camera, busy: () => !!cur, cur: () => cur };
  })();
