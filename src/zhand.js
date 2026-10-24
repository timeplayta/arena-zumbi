  // ======================================================================
  //  MÃOS E BRAÇOS EM PRIMEIRA PESSOA (com esqueleto para animar)
  //  Luva tática: dedos de 3 falanges articuladas (cada junta é um grupo que pode girar),
  //  protetores nos nós dos dedos, polegar de 3 segmentos com membrana, indicador no gatilho,
  //  punho com tira de velcro e fivela, faixa de pele e manga arregaçada.
  //  Só usa esferas e cilindros (r128). Os dedos se mexem com rig.set(curl): curl > 0 fecha o
  //  dedo, curl < 0 abre.
  // ======================================================================
  const HK = (function () {
    const UP = new THREE.Vector3(0, 1, 0), tmpV = new THREE.Vector3();
    const SPH = new THREE.SphereGeometry(1, 16, 12);
    function ball(p, m, x, y, z, rx, ry, rz) {
      const o = new THREE.Mesh(SPH, m);
      o.position.set(x, y, z); o.scale.set(rx, ry === undefined ? rx : ry, rz === undefined ? rx : rz);
      p.add(o); return o;
    }
    // osso: cilindro entre dois pontos (raio r0 em a, r1 em b), sem tampas — as juntas esféricas cobrem as pontas
    function bone(p, m, a, b, r0, r1) {
      tmpV.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const len = tmpV.length();
      if (len < 1e-5) return null;
      const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 12, 1, true), m);
      o.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
      o.quaternion.setFromUnitVectors(UP, tmpV.multiplyScalar(1 / len));
      p.add(o); return o;
    }

    // ---------- dedo articulado ----------
    // pts: pontos das juntas no espaço do pai, rad: raio em cada junta, hint: eixo de dobra se o dedo for reto.
    // Devolve { set(c) }: c em radianos (positivo fecha). A dobra é distribuída pelas juntas.
    const _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3();
    const WEIGHTS = [0.45, 0.9, 0.7];
    function finger(parent, m, pts, rad, hint, weights) {
      const n = pts.length, P = pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), D = [], L = [];
      for (let i = 0; i < n - 1; i++) { D[i] = P[i + 1].clone().sub(P[i]); L[i] = D[i].length(); D[i].multiplyScalar(1 / L[i]); }
      const N = new THREE.Vector3();
      for (let i = 1; i < n - 1; i++) N.add(new THREE.Vector3().crossVectors(D[i - 1], D[i]));
      if (N.length() < 1e-4) N.copy(hint || new THREE.Vector3(1, 0, 0));
      N.normalize();
      const q0 = new THREE.Quaternion().setFromUnitVectors(UP, D[0]);
      const aL = N.clone().applyQuaternion(q0.clone().invert());            // eixo de dobra no espaço local das juntas 1..n-2
      const th = [0];
      for (let i = 1; i < n - 1; i++) {
        const cr = new THREE.Vector3().crossVectors(D[i - 1], D[i]);
        th[i] = Math.atan2(cr.dot(N), D[i - 1].dot(D[i]));
      }
      const g = [];
      for (let i = 0; i < n; i++) {
        const j = new THREE.Group();
        if (i === 0) { j.position.copy(P[0]); j.quaternion.copy(q0); parent.add(j); }
        else { j.position.set(0, L[i - 1], 0); g[i - 1].add(j); if (i < n - 1) j.quaternion.setFromAxisAngle(aL, th[i]); }
        g.push(j);
        ball(j, m, 0, 0, 0, rad[i]);
        if (i < n - 1) { const c = new THREE.Mesh(new THREE.CylinderGeometry(rad[i + 1], rad[i], L[i], 12, 1, true), m); c.position.y = L[i] / 2; j.add(c); }
      }
      const w = weights || WEIGHTS;
      const f = {
        joints: g, last: 0,
        set(c) {
          f.last = c;
          g[0].quaternion.setFromAxisAngle(N, c * w[0]).multiply(q0);
          for (let i = 1; i < n - 1; i++) g[i].quaternion.setFromAxisAngle(aL, th[i] + c * (w[i] === undefined ? w[w.length - 1] : w[i]));
        },
      };
      return f;
    }
    // materiais padrão (usados quando quem chama não tem os seus)
    function mats(mk) {
      return {
        glove: mk({ color: 0x15171a, roughness: 0.84, metalness: 0 }),
        pad: mk({ color: 0x26282c, roughness: 0.5, metalness: 0.15 }),
        strap: mk({ color: 0x33363a, roughness: 0.8, metalness: 0 }),
        skin: mk({ color: 0xb58163, roughness: 0.72, metalness: 0 }),
        sleeve: mk({ color: 0x2a3023, roughness: 0.95, metalness: 0 }),
      };
    }
    // antebraço: eixo +z do grupo `arm`. punho de luva, tira com fivela, faixa de pele, dobra da manga e manga
    function forearm(M, arm, big) {
      const k = big || 1;
      bone(arm, M.glove, [0, 0, -0.006], [0, 0, 0.05], 0.0265 * k, 0.0285 * k);
      bone(arm, M.strap, [0, 0, 0.032], [0, 0, 0.046], 0.0298 * k, 0.0298 * k);                 // tira de velcro
      ball(arm, M.pad, 0, 0.0305 * k, 0.039, 0.0085, 0.0035, 0.0085);                           // fivela
      ball(arm, M.strap, 0.006 * k, 0.0302 * k, 0.047, 0.012, 0.0028, 0.005);                  // ponta da tira
      bone(arm, M.glove, [0, 0, 0.044], [0, 0, 0.056], 0.0295 * k, 0.0275 * k);                // borda do punho
      bone(arm, M.skin, [0, 0, 0.054], [0, 0, 0.084], 0.0245 * k, 0.0262 * k);
      bone(arm, M.sleeve, [0, 0, 0.08], [0, 0, 0.104], 0.0388 * k, 0.0388 * k);                // dobra da manga
      ball(arm, M.sleeve, 0, 0, 0.104, 0.0388 * k, 0.0388 * k, 0.0045);
      bone(arm, M.sleeve, [0, 0, 0.1], [0, 0, 0.36], 0.0345 * k, 0.048 * k);
    }

    // mão fechada em volta de uma empunhadura (eixo y do grupo ao longo da empunhadura, frente = -z)
    //  o: wd largura, gd meia profundidade, trig [x,y,z] do dedo no gatilho, fw meia largura do ferrolho/armação
    //  devolve o esqueleto: { grip: [dedos que seguram], trigger, thumb, arm, armRest }
    function fist(M, h, s, o) {
      const wd = o.wd || 0.034, a = wd / 2 + 0.002, gd = o.gd || 0.019, r = 0.0105, fw = o.fw || 0.012;
      // dorso da mão (o que o jogador vê): corpo largo nos nós dos dedos que afina até o pulso, com tendões rasos
      ball(h, M.glove, s * 0.002, -0.004, gd + 0.015, a + 0.005, 0.04, 0.0165);
      ball(h, M.glove, s * 0.0, -0.04, gd + 0.017, a - 0.006, 0.022, 0.0155);
      for (let k = -1; k <= 1; k++) ball(h, M.glove, s * (k * 0.0105 + 0.002), 0.002, gd + 0.0292, 0.0026, 0.021, 0.0027);
      ball(h, M.glove, -s * (a + 0.004), 0.016, gd + 0.01, 0.012, 0.021, 0.014);        // base do polegar
      ball(h, M.glove, s * (a + 0.002), -0.028, gd + 0.008, 0.011, 0.022, 0.013);       // lado do dedo mínimo
      ball(h, M.glove, s * 0.0, 0.031, gd + 0.012, a + 0.002, 0.0125, 0.0125);          // membrana entre polegar e indicador
      const grip = [];
      // três dedos enrolados na frente da empunhadura: ao longo do lado, cruzam a frente, a ponta volta
      const wrap = (y, rk) => {
        const f = finger(h, M.glove, [
          [s * (a + rk), y, gd * 0.9],
          [s * (a + rk * 0.6), y, -(gd + rk * 0.6)],
          [s * a * 0.2, y, -(gd + rk)],
          [-s * a * 0.6, y, -(gd + rk * 0.8)],
        ], [rk * 1.08, rk, rk * 0.95, rk * 0.88], new THREE.Vector3(0, 1, 0), [0.35, 0.8, 0.6]);
        ball(h, M.pad, s * (a + rk * 1.45), y, gd * 0.9 - 0.003, 0.0045, rk * 0.9, 0.011);     // protetor do nó do dedo
        grip.push(f);
        return f;
      };
      wrap(0.0, r); wrap(-0.0215, r * 0.98); wrap(-0.043, r * 0.88);
      // indicador: no gatilho (se há) ou enrolado como os outros
      let trigger = null;
      if (o.trig) {
        const t = o.trig, i0 = [s * (a + r * 1.05), 0.0245, gd * 0.9], tip = [t[0], t[1], t[2] + r * 0.8];
        const i1 = [s * (fw + r * 0.9), t[1] + 0.006, (i0[2] + tip[2]) * 0.5 + 0.004], i2 = [s * fw * 0.35, t[1] + 0.003, tip[2] + 0.012];
        trigger = finger(h, M.glove, [i0, i1, i2, tip], [r * 1.06, r * 1.0, r * 0.95, r * 0.86], new THREE.Vector3(0, 1, 0), [0.3, 0.9, 0.8]);
        ball(h, M.pad, s * (a + r * 1.45), 0.0245, gd * 0.9 - 0.003, 0.0045, r * 0.9, 0.011);
      } else grip.push(wrap(0.0245, r * 1.02));
      // polegar: do monte da palma para a frente, deitado no lado esquerdo da armação
      const ty = o.thumbY === undefined ? 0.036 : o.thumbY;
      const thumb = finger(h, M.glove, [
        [-s * (a + r * 1.0), ty - 0.012, gd + 0.008],
        [-s * (a + r * 0.95), ty - 0.002, 0.004],
        [-s * (a + r * 0.8), ty + 0.002, -0.024],
        [-s * (a + r * 0.6), ty + 0.0035, -0.044],
      ], [r * 1.22, r * 1.12, r * 1.02, r * 0.93], new THREE.Vector3(0, 0, 1), [0.25, 0.5, 0.5]);
      // antebraço
      const arm = new THREE.Group();
      const rest = [o.armX || 1.2, s * (o.armY || 0.25), 0];
      arm.position.set(s * 0.004, -0.036, gd + 0.022); arm.rotation.set(rest[0], rest[1], rest[2]); h.add(arm);
      forearm(M, arm, 1);
      return { grip, trigger, thumb, arm, armRest: rest, side: s };
    }

    // mão de apoio por baixo do guarda-mão (eixo z do grupo = cano, r = raio do guarda-mão).
    // Palma embaixo, dedos sobem pelo lado direito, polegar no lado esquerdo apontando para a frente.
    function support(M, h, r, o) {
      const rf = 0.0095, grip = [];
      ball(h, M.glove, -0.012, -(r + 0.013), 0.0, 0.046, 0.0145, 0.042);                    // palma
      ball(h, M.glove, -(r + 0.012), -r * 0.62, 0.036, 0.015, 0.02, 0.022);                  // base do polegar
      for (let k = 0; k < 4; k++) {
        const z = -0.032 + k * 0.0215, rk = rf * (k === 3 ? 0.88 : k === 0 ? 1.02 : 1);
        grip.push(finger(h, M.glove, [
          [r * 0.5, -(r + rk + 0.002), z],
          [r + rk * 0.7, -r * 0.42, z],
          [r + rk * 0.2, r * 0.22, z],
          [r * 0.86, r * 0.68, z],
        ], [rk * 1.1, rk, rk * 0.94, rk * 0.86], new THREE.Vector3(0, 0, 1), [0.35, 0.8, 0.6]));
        ball(h, M.pad, r * 0.5, -(r + rk * 2.2), z, rk * 1.05, 0.0045, rk * 0.95);          // protetor do nó
      }
      const zf = r < 0.025 ? 0.72 : 1;                                                       // polegar mais curto nas pistolas
      const thumb = finger(h, M.glove, [
        [-(r + 0.012), -r * 0.55, 0.036 * zf],
        [-(r + 0.01), -r * 0.12, 0.008 * zf],
        [-(r + 0.008), r * 0.14, -0.02 * zf],
        [-(r + 0.006), r * 0.2, -0.038 * zf],
      ], [rf * 1.25, rf * 1.14, rf * 1.04, rf * 0.96], new THREE.Vector3(1, 0, 0), [0.25, 0.5, 0.5]);
      const arm = new THREE.Group();
      const rest = [o.armX || 0.8, -0.6, 0];
      arm.position.set(-0.034, -(r + 0.016), 0.02); arm.rotation.set(rest[0], rest[1], rest[2]); h.add(arm);
      forearm(M, arm, 1);
      return { grip, trigger: null, thumb, arm, armRest: rest, side: -1 };
    }

    // mão da arma branca: dedos dão a volta no cabo (eixo z), lâmina para -z, antebraço vindo de trás
    function melee(M, h) {
      const hx = 0.016, hy = 0.02, rf = 0.0102, grip = [];
      ball(h, M.glove, hx + 0.014, -0.002, 0.054, 0.017, 0.036, 0.046);                       // palma/dorso (lado direito do cabo)
      ball(h, M.glove, hx + 0.004, -0.026, 0.05, 0.016, 0.014, 0.04);                          // lado do dedo mínimo
      for (let k = 0; k < 4; k++) {
        const z = 0.017 + k * 0.0205, rk = rf * (k === 3 ? 0.88 : 1);
        grip.push(finger(h, M.glove, [
          [hx + rk * 0.7, hy * 0.5, z],
          [hx * 0.45, hy + rk * 0.6, z],
          [-hx * 0.7, hy + rk * 0.45, z],
          [-hx - rk * 0.55, hy * 0.25, z],
        ], [rk * 1.08, rk, rk * 0.95, rk * 0.88], new THREE.Vector3(0, 0, 1), [0.35, 0.8, 0.6]));
        ball(h, M.pad, hx + rk * 1.2, hy * 0.55, z, 0.0045, rk * 0.9, rk * 0.95);              // protetor do nó
      }
      // polegar por baixo, cruzando para o lado esquerdo
      const thumb = finger(h, M.glove, [
        [hx + 0.006, -0.012, 0.086],
        [hx * 0.2, -hy - 0.006, 0.07],
        [-hx - 0.004, -hy * 0.7, 0.05],
        [-hx - 0.008, -hy * 0.1, 0.034],
      ], [rf * 1.2, rf * 1.1, rf * 1.0, rf * 0.92], new THREE.Vector3(0, 0, 1), [0.25, 0.5, 0.5]);
      const arm = new THREE.Group();
      const rest = [0.28, 0.16, 0];
      arm.position.set(hx + 0.016, -0.02, 0.1); arm.rotation.set(rest[0], rest[1], rest[2]); h.add(arm);
      forearm(M, arm, 1.05);
      return { grip, trigger: null, thumb, arm, armRest: rest, side: 1 };
    }

    // pose: curl dos dedos que seguram, do gatilho e do polegar; e giro extra do antebraço (rx, ry, rz)
    function pose(rig, o) {
      if (!rig) return;
      const g = o.grip || 0, t = o.trig === undefined ? 0 : o.trig, th = o.thumb || 0;
      for (let i = 0; i < rig.grip.length; i++) rig.grip[i].set(g + (o.spread ? o.spread[i % o.spread.length] : 0));
      if (rig.trigger) rig.trigger.set(t);
      rig.thumb.set(th);
      const r = rig.armRest;
      rig.arm.rotation.set(r[0] + (o.rx || 0), r[1] + (o.ry || 0), r[2] + (o.rz || 0));
    }

    return { ball, bone, finger, mats, fist, support, melee, forearm, pose };
  })();
