// cenas do anúncio: setup roda na página antes da captura; frames = duração × 30
const S30 = (s) => Math.round(s * 30);
const common = `
  const A = window.__AZ, P = window.__pilot;
  const warm = (n) => { for (let i = 0; i < n; i++) window.__step(1000 / 30); };
  const hide = () => { for (const id of ['hint', 'tzone', 'feed', 'team']) { const e = document.getElementById(id); if (e) e.style.visibility = 'hidden'; } };
  const VERT = innerHeight > innerWidth;
  A.S.fov = VERT ? 64 : 90;
  const spot = (x, y, yaw) => { const g = A.game; g.px = x; g.py = y; g.yaw = yaw; g.pitch = 0; };
  const horde = (list, hp) => { const g = A.game; for (const [d, a] of list) { g.toSpawn = 1; g.spawnZombie(); const z = g.zombies[g.zombies.length - 1]; P.place(z, d, a); if (hp) z.hp = Math.min(z.hp, hp); } g.toSpawn = 40; };
`;
module.exports = {
  ondas: {
    frames: S30(10),
    setup: common + `
      A.S.loadout = ['ax4', 'p45']; A.S.env = 'night'; A.S.diff = 'normal';
      warm(2); A.startGame(); warm(3); hide();
      const g = A.game; g.wave = 4; g.pauseT = 0; warm(2); g.bannerT = 0; g.banner = '';
      spot(6, -19, 1.047);
      horde([[9, 0.05], [12, -0.3], [13, 0.35], [15, -0.05], [17, 0.25], [11, 0.5], [16, -0.45], [19, -0.2], [20, 0.4], [18, 0.05], [21, -0.35]], 45);
      Object.assign(P.cfg, { range: 30, baseYaw: 1.047, maxDev: 0.75, keepMag: 5, strafe: false });
      P.feedEvery = 15;
      P.feed = (g) => {   // sempre 7+ zumbis no corredor: os de fora entram pela borda da tela
        const live = g.zombies.filter((z) => z.state !== 'dead');
        let n = live.filter((z) => P.inLane(z.x, z.y)).length;
        for (const z of live) { if (n >= 8) break; if (!P.inLane(z.x, z.y)) { const sd = Math.random() < 0.5 ? -1 : 1; const [x, y] = P.front(13 + Math.random() * 7, sd * (0.66 + Math.random() * 0.06), true); z.x = x; z.y = y; n++; z.hp = Math.min(z.hp, 45); } }
      };
      warm(3);
    `,
  },
  armas: {
    frames: S30(8),
    setup: common + `
      A.S.loadout = ['brutus', 'ax4']; A.S.env = 'dusk'; A.S.diff = 'normal';
      warm(2); A.startGame(); warm(3); hide();
      const g = A.game; g.wave = 6; g.pauseT = 0; warm(2); g.bannerT = 0; g.banner = '';
      spot(6, -19, 1.047);
      horde([[5.5, 0.08], [7, -0.25], [8, 0.3], [9.5, -0.05], [10.5, 0.35], [11, -0.35], [12.5, 0.15], [13.5, -0.2]], 80);
      Object.assign(P.cfg, { range: 15, keepMag: 2, pulse: true, chest: true, maxTurn: 0.14, strafe: false, maxAng: 0.9, closeFirst: true, baseYaw: 1.047, maxDev: 0.75 });
      P.sched.push([120, (g) => horde([[9, 0.1], [10, -0.2], [11, 0.25], [12, -0.05]], 80)]);
      warm(3);
    `,
  },
  chefes: {
    frames: S30(16),
    setup: common + `
      A.S.loadout = ['titan', 'brutus']; A.S.env = 'storm'; A.S.diff = 'extremo';
      warm(2); A.startGame(); warm(3); hide();
      const g = A.game; g.wave = 9; g.pauseT = 0; warm(2); g.bannerT = 0; g.banner = '';
      g.queue = []; spot(6, -19, 1.047);
      g.giantsLeft = 1; g.toSpawn = 1; g.spawnZombie(); g.giantsLeft = 0;
      const gi = g.zombies[g.zombies.length - 1]; P.place(gi, 11, 0.05); g.banner = ''; g.bannerSub = ''; g.bannerT = 0;
      horde([[15, -0.4], [16, 0.45]], 40);
      Object.assign(P.cfg, { range: 30, keepMag: 20, hold: 'freeze', strafe: false, maxAng: 1.0 });
      P.sched.push([140, () => { gi.hp = Math.min(gi.hp, 50); }]);
      P.sched.push([160, (g) => { const [x, y] = P.front(13, -0.15); g.spawnElite('tank', x, y); }]);
      P.sched.push([300, (g) => { for (const z of g.zombies) if (z.kind === 'tank') z.hp = Math.min(z.hp, 40); }]);
      P.sched.push([320, (g) => { const [x, y] = P.front(11, 0.25); g.spawnElite('samurai', x, y); }]);
      warm(3);
    `,
  },
  infeccao: {
    frames: S30(17),
    setup: common + `
      A.S.loadout = ['ax4', 'p45']; A.S.diff = 'normal';
      warm(2);
      document.querySelector('[data-gm=infect]').click();
      document.getElementById('btnCoopOffline').click();
      warm(4); hide();
      const g = A.game; spot(0, -18, 0);
      g.inf.ph = 'play'; g.inf.t = 180;
      const bots = g.others.filter((q) => (q.team || 'h') !== 'z');
      for (let i = 0; i < 4 && i < bots.length; i++) g.becomeZombie(bots[i].id, true);
      g.banner = ''; g.bannerT = 0;
      const zs = g.others.filter((q) => q.team === 'z');
      const spots = [[14, 0.05], [17, -0.3], [16, 0.35], [20, 0.1]];
      zs.forEach((q, i) => { const sp = spots[i % spots.length]; const [x, y] = P.front(sp[0], sp[1]); q.x = x; q.y = y; const z = g.pz(q.id); if (z) { z.x = x; z.y = y; } });
      // humanos (bots) ao lado do jogador
      const hs = g.others.filter((q) => q.team !== 'z');
      hs.slice(0, 3).forEach((q, i) => { const [x, y] = P.front(2.5 + i, [1.9, -1.9, 2.4][i]); q.x = x; q.y = y; });
      Object.assign(P.cfg, { range: 26, strafe: false, maxAng: 1.0, baseYaw: 0, maxDev: 0.8, keepMag: 6, lockPos: true });
      const tp = (q, x, y) => { q.x = x; q.y = y; const z = g.pz(q.id); if (z) { z.x = x; z.y = y; } };
      P.feedEvery = 12;
      P.feed = (g) => {   // infectados fora do corredor voltam pela borda da tela
        const zq = g.others.filter((q) => q.team === 'z' && q.alive !== false);
        let n = zq.filter((q) => P.inLane(q.x, q.y)).length;
        for (const q of zq) { if (n >= 4) break; if (!P.inLane(q.x, q.y)) { const sd = Math.random() < 0.5 ? -1 : 1; const [x, y] = P.front(12 + Math.random() * 6, sd * (0.66 + Math.random() * 0.08), true); tp(q, x, y); n++; } }
      };
      // grupo junto antes do molotov
      P.sched.push([92, (g) => { g.others.filter((q) => q.team === 'z').slice(0, 3).forEach((q, i) => { const [x, y] = P.front(12 + i * 0.8, [-0.06, 0.04, 0.12][i], true); tp(q, x, y); }); }]);
      // molotov: G (mira continua no alvo), clique, depois volta a atirar
      P.sched.push([100, () => { P.cfg.noFire = true; P.key('KeyG', true); }]);
      P.sched.push([102, () => { P.key('KeyG', false); P.cfg.pitchBias = 0.07; }]);
      P.sched.push([122, () => { P.cfg.noFire = false; P.cfg.holdFire = true; }]);
      P.sched.push([125, () => { P.cfg.holdFire = false; P.cfg.noFire = true; }]);
      P.sched.push([185, () => { delete P.cfg.holdFire; P.cfg.noFire = false; P.cfg.pitchBias = 0; }]);
      warm(3);
    `,
  },
};
