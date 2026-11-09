// piloto automático do anúncio (roda dentro da página de captura)
(() => {
  const A = window.__AZ, DT = 1000 / 30;
  const HEAD_Z = 1.67;
  const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const P = window.__pilot = {
    f: 0, tgt: null, cfg: { range: 30, maxTurn: 0.11, gain: 0.32, fireTol: 0.05, keepMag: 0, strafe: true, god: true, hold: true, pulse: false, pitchBias: 0 },
    sched: [],                      // [frame, fn]
    g() { return A.game; },
    key(code, down) { window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key: code, bubbles: true })); },
    front(dist, ang) {              // ponto à frente do jogador (ang: radianos, + = esquerda)
      const g = A.game, a = g.yaw + (ang || 0);
      return [g.px - Math.sin(a) * dist, g.py + Math.cos(a) * dist];
    },
    place(z, dist, ang) { const [x, y] = P.front(dist, ang); z.x = x; z.y = y; if (z.tx !== undefined) { z.tx = x; z.ty = y; } return z; },
    pick() {
      const g = A.game; let best = null, bs = 1e9;
      for (const z of g.zombies) {
        if (z.state === 'dead' || z.untouch || z.hidden) continue;
        const dx = z.x - g.px, dy = z.y - g.py, d = Math.hypot(dx, dy);
        if (d > P.cfg.range || d < 0.3) continue;
        const da = Math.abs(wrap(Math.atan2(-dx, dy) - g.yaw));
        if (da > (P.cfg.maxAng || 1.3)) continue;
        const eh = g.eyeH(), hz = (z.gz || 0) + HEAD_Z * z.s * 0.9, c = g.cast(g.px, g.py, eh, dx / d, dy / d, (hz - eh) / d, null, d + 2);
        if (c.kind === 'world' && c.t < d - 0.5) continue;           // atrás de parede: ignora
        const sc = d * 0.6 + da * 14 + (z === P.tgt ? -4 : 0);
        if (sc < bs) { bs = sc; best = z; }
      }
      return best;
    },
    tick() {
      const g = A.game, f = P.f;
      for (const s of P.sched) if (s[0] === f) { try { s[1](g); } catch (e) { console.log('ERR sched ' + e.message); } }
      if (P.cfg.god && g.team !== 'z') { g.hp = g.maxHp; g.alive = true; g.invulnT = 0.5; }
      if (P.cfg.hold && g.gm !== 'infect') { g.toSpawn = Math.max(g.toSpawn, 30); if (P.cfg.hold === 'freeze') g.spawnT = 1e9; }
      const s = g.w && g.w();
      if (s && P.cfg.keepMag && s.mag < P.cfg.keepMag) s.mag = P.cfg.keepMag;
      let fire = false;
      if (P.cfg.aim !== false) {
        const z = P.tgt = P.pick();
        if (z) {
          const dx = z.x - g.px, dy = z.y - g.py, d = Math.hypot(dx, dy);
          const ty = Math.atan2(-dx, dy), tp = Math.atan2((z.gz || 0) + HEAD_Z * z.s * (P.cfg.chest ? 0.78 : 0.97) - g.eyeH(), d) + P.cfg.pitchBias;
          const ey = wrap(ty - g.yaw), ep = tp - g.pitch - (g.recoil || 0) * 0;
          const cl = (v) => Math.max(-P.cfg.maxTurn, Math.min(P.cfg.maxTurn, v));
          g.look(cl(ey * P.cfg.gain), cl(ep * P.cfg.gain));
          fire = Math.abs(ey) < P.cfg.fireTol + 0.4 / Math.max(d, 1) * 0.2 && Math.abs(ep) < P.cfg.fireTol * 1.5;
        } else if (P.cfg.idleTurn) g.look(P.cfg.idleTurn, 0);
      }
      if (P.cfg.holdFire !== undefined) fire = P.cfg.holdFire;
      if (P.cfg.noFire) fire = false;
      if (P.cfg.pulse && fire) fire = f % 3 !== 2;
      A.setMouse(!!fire);
      if (P.cfg.strafe) {
        const ph = Math.floor(f / 22) % 4;
        A.keys.delete('KeyA'); A.keys.delete('KeyD');
        if (ph === 1) A.keys.add('KeyA'); else if (ph === 3) A.keys.add('KeyD');
      }
      window.__step(DT);
      P.f++;
    },
  };
})();
