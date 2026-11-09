// cenas do anúncio: setup roda na página antes da captura; frames = duração × 30
const S30 = (s) => Math.round(s * 30);
const common = `
  const A = window.__AZ, P = window.__pilot;
  const warm = (n) => { for (let i = 0; i < n; i++) window.__step(1000 / 30); };
  const hide = () => { for (const id of ['hint', 'tzone', 'feed']) { const e = document.getElementById(id); if (e) e.style.visibility = 'hidden'; } };
`;
module.exports = {
  ondas: {
    frames: S30(10),
    setup: common + `
      A.S.loadout = ['ax4', 'p45']; A.S.env = 'night'; A.S.diff = 'hard';
      warm(2); A.startGame(); warm(3); hide();
      const g = A.game; g.wave = 4; g.pauseT = 0; warm(2); g.bannerT = 0; g.banner = '';
      g.toSpawn = 40;
      const arc = [[11, 0.05], [14, -0.35], [16, 0.4], [19, -0.1], [22, 0.25], [13, 0.75], [17, -0.7], [24, -0.4], [26, 0.6]];
      for (const [d, a] of arc) { g.spawnZombie(); P.place(g.zombies[g.zombies.length - 1], d, a); g.toSpawn--; }
      Object.assign(P.cfg, { range: 34, keepMag: 0, pulse: false });
      warm(4);
    `,
  },
  armas: {
    frames: S30(8),
    setup: common + `
      A.S.loadout = ['brutus', 'ax4']; A.S.env = 'dusk'; A.S.diff = 'hard';
      warm(2); A.startGame(); warm(3); hide();
      const g = A.game; g.wave = 6; g.pauseT = 0; warm(2); g.bannerT = 0; g.banner = '';
      g.toSpawn = 40;
      const arc = [[6, 0.1], [8, -0.4], [9, 0.45], [11, -0.05], [12, 0.6], [13, -0.65], [15, 0.2], [16, -0.3]];
      for (const [d, a] of arc) { g.spawnZombie(); P.place(g.zombies[g.zombies.length - 1], d, a); g.toSpawn--; }
      Object.assign(P.cfg, { range: 16, keepMag: 2, pulse: true, chest: true, maxTurn: 0.13 });
      warm(4);
    `,
  },
  chefes: {
    frames: S30(16),
    setup: common + `
      A.S.loadout = ['titan', 'brutus']; A.S.env = 'storm'; A.S.diff = 'extremo';
      warm(2); A.startGame(); warm(3); hide();
      const g = A.game; g.wave = 9; g.pauseT = 0; warm(2); g.bannerT = 0; g.banner = '';
      g.toSpawn = 0; g.queue = []; g.giantsLeft = 0;
      // gigante logo de cara
      g.giantsLeft = 1; g.toSpawn = 1; g.queue = []; g.spawnZombie(); g.toSpawn = 0;
      const gi = g.zombies[g.zombies.length - 1]; P.place(gi, 15, 0.08);
      for (const [d, a] of [[10, -0.5], [12, 0.55]]) { g.toSpawn = 1; g.giantsLeft = 0; g.spawnZombie(); P.place(g.zombies[g.zombies.length - 1], d, a); g.toSpawn = 0; }
      P.cfg.range = 40; P.cfg.keepMag = 20; P.cfg.chest = false;
      P.sched.push([150, (g) => { gi.hp = Math.min(gi.hp, 60); }]);
      P.sched.push([165, (g) => { const [x, y] = P.front(16, -0.25); g.spawnElite('tank', x, y); }]);
      P.sched.push([300, (g) => { for (const z of g.zombies) if (z.kind === 'tank') z.hp = Math.min(z.hp, 40); }]);
      P.sched.push([315, (g) => { const [x, y] = P.front(14, 0.3); g.spawnElite('samurai', x, y); }]);
      warm(4);
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
      const g = A.game; g.inf.t = 0.05; warm(3);
      const bots = g.others.filter((q) => (q.team || 'h') !== 'z');
      for (let i = 0; i < 4 && i < bots.length; i++) g.becomeZombie(bots[i].id);
      const zs = g.others.filter((q) => q.team === 'z');
      const spots = [[15, 0.05], [18, -0.3], [17, 0.35], [21, 0.1], [23, -0.15]];
      zs.forEach((q, i) => { const sp = spots[i % spots.length]; const [x, y] = P.front(sp[0], sp[1]); q.x = x; q.y = y; if (q.bot) { q.bot.lastX = x; q.bot.lastY = y; q.bot.wp = null; } const z = g.pz(q.id); if (z) { z.x = x; z.y = y; } });
      g.bannerT = 0;
      Object.assign(P.cfg, { range: 30, keepMag: 0, pulse: false });
      // molotov aos 4 s: G, mira no grupo, clique
      P.sched.push([110, () => { P.cfg.aim = false; P.cfg.noFire = true; P.key('KeyG', true); P.key('KeyG', false); }]);
      P.sched.push([112, (g) => { g.look(0, 0.12); }]);
      P.sched.push([128, () => { P.cfg.noFire = false; P.cfg.holdFire = true; }]);
      P.sched.push([131, () => { P.cfg.holdFire = false; }]);
      P.sched.push([150, () => { delete P.cfg.holdFire; P.cfg.noFire = false; P.cfg.aim = true; }]);
      warm(4);
    `,
  },
};
