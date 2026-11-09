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
      Object.assign(P.cfg, { range: 30 });
      P.sched.push([140, (g) => horde([[17, 0.1], [19, -0.3], [20, 0.35], [22, -0.1], [23, 0.2]], 45)]);
      P.sched.push([220, (g) => horde([[16, -0.2], [18, 0.3], [21, 0.0]], 45)]);
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
      horde([[5.5, 0.1], [7, -0.35], [8, 0.4], [9.5, -0.05], [10.5, 0.55], [11, -0.6], [12.5, 0.2], [13.5, -0.25]], 80);
      Object.assign(P.cfg, { range: 15, keepMag: 2, pulse: true, chest: true, maxTurn: 0.14 });
      P.sched.push([120, (g) => horde([[9, 0.1], [10, -0.3], [11, 0.35], [12, -0.05]], 80)]);
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
      const gi = g.zombies[g.zombies.length - 1]; P.place(gi, 13, 0.05);
      horde([[9, -0.45], [10, 0.5]], 120); g.toSpawn = 0;
      Object.assign(P.cfg, { range: 30, keepMag: 20 });
      P.sched.push([140, () => { gi.hp = Math.min(gi.hp, 50); }]);
      P.sched.push([160, (g) => { g.toSpawn = 0; const [x, y] = P.front(14, -0.2); g.spawnElite('tank', x, y); }]);
      P.sched.push([300, (g) => { for (const z of g.zombies) if (z.kind === 'tank') z.hp = Math.min(z.hp, 40); }]);
      P.sched.push([320, (g) => { const [x, y] = P.front(12, 0.3); g.spawnElite('samurai', x, y); }]);
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
      g.banner = 'A INFECÇÃO COMEÇOU'; g.bannerSub = 'Fuja dos zumbis por 3 minutos'; g.bannerT = 3;
      const zs = g.others.filter((q) => q.team === 'z');
      const spots = [[14, 0.05], [17, -0.3], [16, 0.35], [20, 0.1]];
      zs.forEach((q, i) => { const sp = spots[i % spots.length]; const [x, y] = P.front(sp[0], sp[1]); q.x = x; q.y = y; const z = g.pz(q.id); if (z) { z.x = x; z.y = y; } });
      // humanos (bots) ao lado do jogador
      const hs = g.others.filter((q) => q.team !== 'z');
      hs.slice(0, 3).forEach((q, i) => { const [x, y] = P.front(3 + i, [1.2, -1.1, 1.6][i]); q.x = x; q.y = y; });
      Object.assign(P.cfg, { range: 26, strafe: false });
      // molotov: G, mira no grupo, clique
      P.sched.push([105, () => { P.cfg.aim = false; P.cfg.noFire = true; P.key('KeyG', true); }]);
      P.sched.push([107, () => { P.key('KeyG', false); }]);
      P.sched.push([110, (g) => { g.look(0, 0.1); }]);
      P.sched.push([126, () => { P.cfg.noFire = false; P.cfg.holdFire = true; }]);
      P.sched.push([129, () => { P.cfg.holdFire = false; }]);
      P.sched.push([150, () => { delete P.cfg.holdFire; P.cfg.aim = true; }]);
      warm(3);
    `,
  },
};
