
  // ======================================================================
  //  SOM (sintetizado na hora, sem arquivos)
  // ======================================================================
  const SR = 22050;
  const Snd = (function () {
    let actx = null, master = null, conv = null, amb = null, volume = 0.8, ambCfg = null, ambOn = false;
    const mix = { sfx: 1, voice: 1, amb: 0.7 };
    const VOICE = { groan0: 1, groan1: 1, groan2: 1, scream: 1, roar: 1, giantroar: 1, die: 1, tankroar: 1, tankgrunt: 1, kiai: 1, whisper: 1, wail: 1 }, AMB = { thunder: 1, wind: 1, rain: 1 };
    const catOf = (n) => (VOICE[n] ? "voice" : AMB[n] ? "amb" : "sfx");
    const bufs = {};
    const E = Math.exp, PI2 = Math.PI * 2, rnd = () => Math.random() * 2 - 1;
    const mk = (secs, fn) => { const n = Math.floor(secs * SR), o = new Float32Array(n); for (let i = 0; i < n; i++) o[i] = fn(i / SR, i); return o; };
    function gun(p) {
      let lp = 0, lp2 = 0;
      return mk(p.dur, (t) => {
        const nz = rnd(); lp += p.lpA * (nz - lp); lp2 += 0.08 * (nz - lp2);
        return nz * E(-t * p.crack) * 0.9 + lp * E(-t * p.body) * 0.8 + lp2 * E(-t * p.boomD) * p.boom + Math.sin(PI2 * (p.hz + 90 * E(-t * 30)) * t) * E(-t * 14) * p.thump;
      });
    }
    function quiet() { let lp = 0; return mk(0.22, (t) => { lp += 0.22 * (rnd() - lp); return lp * E(-t * 28) * 1.1 + Math.sin(PI2 * 120 * t) * E(-t * 40) * 0.3; }); }
    function groan(base, dur, drop, vib) {
      let ph = 0, lp = 0;
      return mk(dur, (t) => {
        const u = t / dur, f = base * (1 - (drop || 0) * u) * (1 + 0.07 * Math.sin(PI2 * (vib || 5.5) * t) + 0.03 * Math.sin(PI2 * 11 * t));
        ph += PI2 * f / SR;
        const v = Math.sin(ph) + 0.55 * Math.sin(2 * ph + 0.4) + 0.4 * Math.sin(3 * ph + 1.1) + 0.3 * Math.sin(4 * ph) + 0.12 * rnd();
        lp += 0.35 * (v - lp);
        return lp * Math.pow(Math.sin(Math.PI * Math.min(1, u)), 0.7) * 0.45;
      });
    }
    function clicks(secs, list) {
      const o = new Float32Array(Math.floor(secs * SR));
      for (const c of list) {
        const s = Math.floor(c[0] * SR), n = Math.floor(0.05 * SR);
        for (let i = 0; i < n && s + i < o.length; i++) { const t = i / SR; o[s + i] += (rnd() * 0.6 + Math.sin(PI2 * c[1] * t) * 0.8) * E(-t * 90) * c[2]; }
      }
      return o;
    }
    function recipes() {
      const r = {};
      r.shot_p45 = gun({ dur: 0.32, crack: 140, body: 30, boom: 1.3, boomD: 11, thump: 0.8, hz: 70, lpA: 0.55 });
      r.shot_smg = gun({ dur: 0.22, crack: 180, body: 40, boom: 0.9, boomD: 14, thump: 0.5, hz: 90, lpA: 0.6 });
      r.shot_ax4 = gun({ dur: 0.38, crack: 110, body: 26, boom: 1.6, boomD: 9, thump: 0.9, hz: 55, lpA: 0.55 });
      r.shot_brutus = gun({ dur: 0.6, crack: 70, body: 16, boom: 2.4, boomD: 5, thump: 1.4, hz: 45, lpA: 0.5 });
      r.shot_falcao = gun({ dur: 0.9, crack: 90, body: 12, boom: 2.2, boomD: 4, thump: 1.2, hz: 50, lpA: 0.5 });
      r.shot_sil = quiet();
      r.hit = (function () { let lp = 0; return mk(0.22, (t) => { lp += 0.25 * (rnd() - lp); return lp * E(-t * 28) * 1.4 + Math.sin(PI2 * (170 * E(-t * 9)) * t) * E(-t * 16) * 0.7; }); })();
      r.hurt = (function () { let lp = 0; return mk(0.35, (t) => { lp += 0.2 * (rnd() - lp); return Math.sin(PI2 * 60 * t) * E(-t * 9) * 0.9 + lp * E(-t * 18) * 1.2; }); })();
      r.rl_pistol = clicks(0.9, [[0.05, 800, 0.5], [0.5, 1100, 0.7]]);
      r.rl_mag = clicks(1.9, [[0.05, 900, 0.6], [0.7, 1300, 0.6], [1.2, 1800, 0.8], [1.6, 1000, 0.6]]);
      r.rl_bolt = clicks(2.5, [[0.1, 900, 0.6], [0.9, 1300, 0.7], [1.7, 1700, 0.8]]);
      r.shell = clicks(0.12, [[0, 1500, 0.7]]);
      r.pump = clicks(0.4, [[0.02, 600, 0.9], [0.2, 800, 0.9]]);
      r.bolt = clicks(0.5, [[0.02, 700, 0.8], [0.3, 1000, 0.9]]);
      r.empty = clicks(0.1, [[0, 1400, 0.7]]);
      r.switch = clicks(0.3, [[0.0, 500, 0.5], [0.18, 1200, 0.6]]);
      r.step = (function () { let lp = 0; return mk(0.12, (t) => { lp += 0.2 * (rnd() - lp); return lp * E(-t * 35) * 1.2 + Math.sin(PI2 * 80 * t) * E(-t * 30) * 0.6; }); })();
      r.casing = mk(0.2, (t) => (Math.sin(PI2 * 3200 * t) * E(-t * 70) + Math.sin(PI2 * 4300 * t) * E(-t * 55) * 0.6 + (t > 0.09 ? Math.sin(PI2 * 3600 * (t - 0.09)) * E(-(t - 0.09) * 90) * 0.5 : 0)) * 0.5);
      r.melee = (function () { let a = 0, b = 0; return mk(0.3, (t) => { const n = rnd(); a += 0.4 * (n - a); b += 0.06 * (n - b); return (a - b) * Math.pow(Math.sin(Math.PI * Math.min(1, t / 0.25)), 1.5) * 1.6; }); })();
      r.melee_hit = (function () { let lp = 0; return mk(0.2, (t) => { lp += 0.3 * (rnd() - lp); return lp * E(-t * 24) * 1.5 + Math.sin(PI2 * 90 * t) * E(-t * 22) * 0.9; }); })();
      r.heart = mk(0.5, (t) => (Math.sin(PI2 * 55 * t) * E(-t * 25) + 0.7 * (t > 0.18 ? Math.sin(PI2 * 48 * (t - 0.18)) * E(-(t - 0.18) * 28) : 0)) * 1.1);
      r.winded = (function () { let lp = 0; return mk(0.8, (t) => { lp += 0.12 * (rnd() - lp); return lp * Math.pow(Math.sin(Math.PI * t / 0.8), 2) * 1.6; }); })();
      r.thunder = (function () { let lp = 0; return mk(3.2, (t) => { lp += 0.03 * (rnd() - lp); return lp * E(-t * 0.9) * Math.min(1, t * 6) * (1 + 0.5 * Math.sin(t * 13)) * 9; }); })();
      r.groan0 = groan(78, 0.95); r.groan1 = groan(92, 0.8); r.groan2 = groan(66, 1.1);
      r.scream = groan(190, 0.7, 0.3, 8); r.roar = groan(46, 1.3, 0.2, 4);
      r.die = groan(100, 1.0, 0.55);
      r.giantroar = groan(30, 2.2, 0.3, 3.2);
      r.stomp = (function () { let lp = 0; return mk(0.5, (t) => { lp += 0.05 * (rnd() - lp); return Math.sin(PI2 * (48 - 22 * t) * t) * E(-t * 9) * 1.5 + lp * E(-t * 14) * 3; }); })();
      r.pickup = mk(0.22, (t) => { const f = t < 0.1 ? 660 : 880, tt = t < 0.1 ? t : t - 0.1; return Math.sin(PI2 * f * t) * E(-tt * 18) * 0.5; });
      r.horn = (function () { let ph = 0; return mk(1.4, (t) => { const u = t / 1.4, env = Math.min(1, t / 0.25) * Math.pow(Math.max(0, 1 - u), 1.2); ph += PI2 * (62 - 8 * u) / SR; return (Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.3 * Math.sin(3 * ph)) * env * 0.5; }); })();
      r.wind = (function () { let lp = 0; return mk(6, (t) => { lp += 0.02 * (rnd() - lp); return lp * (0.65 + 0.35 * Math.sin(PI2 * t / 6 * 2)) * 6; }); })();
      r.rain = (function () { let lp = 0; return mk(3, () => { const n = rnd(); lp += 0.5 * (n - lp); return (n - lp) * 0.5; }); })();
      // ---- armas da loja ----
      r.shot_revolver = gun({ dur: 0.55, crack: 80, body: 18, boom: 2.0, boomD: 6, thump: 1.3, hz: 55, lpA: 0.5 });
      r.shot_titan = gun({ dur: 0.3, crack: 120, body: 28, boom: 1.5, boomD: 10, thump: 0.9, hz: 50, lpA: 0.55 });
      r.rl_revolver = clicks(2.4, [[0.05, 600, 0.6], [0.3, 1500, 0.8], [0.34, 1800, 0.5], [0.9, 1100, 0.5], [1.1, 1150, 0.5], [1.3, 1100, 0.5], [1.5, 1200, 0.5], [1.9, 900, 0.8]]);
      r.rl_titan = clicks(5.4, [[0.1, 500, 0.7], [0.8, 900, 0.8], [1.4, 1300, 0.6], [2.4, 1100, 0.5], [3.0, 700, 0.6], [3.8, 1500, 0.8], [4.5, 900, 0.9]]);
      // ---- Colosso Blindado ----
      r.clang = mk(0.55, (t) => (Math.sin(PI2 * 820 * t) * E(-t * 9) + 0.6 * Math.sin(PI2 * 1710 * t) * E(-t * 12) + 0.4 * Math.sin(PI2 * 2680 * t) * E(-t * 16) + rnd() * E(-t * 80) * 0.8) * 0.7);
      r.armor = (function () { let lp = 0; return mk(0.3, (t) => { lp += 0.3 * (rnd() - lp); return lp * E(-t * 22) * 1.4 + Math.sin(PI2 * 310 * t) * E(-t * 24) * 0.7 + Math.sin(PI2 * 1180 * t) * E(-t * 40) * 0.25; }); })();
      r.tankroar = groan(34, 1.7, 0.25, 3); r.tankgrunt = groan(54, 0.7, 0.2, 4);
      r.tank_charge = (function () { let lp = 0; return mk(1.3, (t) => { lp += 0.05 * (rnd() - lp); const u = t / 1.3; return (lp * 5 + Math.sin(PI2 * (38 + 20 * u) * t) * 0.8) * Math.min(1, t / 0.2) * (1 - 0.4 * u) * (0.75 + 0.25 * Math.sin(PI2 * 7 * t)); }); })();
      r.tank_slam = (function () { let lp = 0; return mk(1.2, (t) => { lp += 0.06 * (rnd() - lp); return Math.sin(PI2 * (58 - 32 * t) * t) * E(-t * 4.5) * 2.2 + lp * E(-t * 7) * 4 + Math.sin(PI2 * 900 * t) * E(-t * 30) * 0.3; }); })();
      r.breath = (function () { let lp = 0; return mk(0.9, (t) => { lp += 0.1 * (rnd() - lp); return lp * Math.pow(Math.sin(Math.PI * t / 0.9), 2) * 2.2; }); })();
      // ---- Mestre da Katana ----
      r.katana_draw = (function () { let lp = 0; return mk(0.8, (t) => { const n = rnd(); lp += 0.5 * (n - lp); return ((n - lp) * 0.8 + Math.sin(PI2 * (2400 + 3200 * t) * t) * 0.25 + Math.sin(PI2 * 5200 * t) * 0.12 * E(-t * 4)) * Math.min(1, t / 0.03) * E(-t * 3.6); }); })();
      r.katana_swish = (function () { let a = 0, b = 0; return mk(0.32, (t) => { const n = rnd(); a += 0.55 * (n - a); b += 0.12 * (n - b); return (a - b) * Math.pow(Math.sin(Math.PI * Math.min(1, t / 0.3)), 1.2) * 1.6; }); })();
      r.katana_hit = (function () { let lp = 0; return mk(0.35, (t) => { lp += 0.3 * (rnd() - lp); return lp * E(-t * 22) * 1.6 + Math.sin(PI2 * 140 * t) * E(-t * 20) * 0.9 + Math.sin(PI2 * 2200 * t) * E(-t * 26) * 0.3; }); })();
      r.kiai = groan(150, 0.5, 0.5, 6); r.dodge = (function () { let lp = 0; return mk(0.35, (t) => { lp += 0.2 * (rnd() - lp); return lp * Math.pow(Math.sin(Math.PI * Math.min(1, t / 0.33)), 1.5) * 1.3; }); })();
      // ---- Espectro ----
      r.whisper = (function () { let a = 0, b = 0; return mk(2.0, (t) => { const n = rnd(); a += 0.35 * (n - a); b += 0.05 * (n - b); const am = 0.5 + 0.5 * Math.sin(PI2 * 5.5 * t + Math.sin(PI2 * 1.3 * t) * 2); return ((a - b) * 1.2 + Math.sin(PI2 * 520 * t) * 0.08 + Math.sin(PI2 * 527 * t) * 0.08) * am * Math.sin(Math.PI * t / 2.0); }); })();
      r.wail = groan(380, 2.0, 0.4, 6.5);
      r.wraith_hold = mk(2.3, (t) => { const u = t / 2.3; return (Math.sin(PI2 * (48 + 40 * u) * t) * 0.9 + Math.sin(PI2 * (96 + 80 * u) * t) * 0.4 + rnd() * 0.08) * Math.pow(u, 1.3) * (0.8 + 0.2 * Math.sin(PI2 * (5 + 8 * u) * t)); });
      r.sword_slam = (function () { let lp = 0; return mk(1.6, (t) => { lp += 0.05 * (rnd() - lp); return Math.sin(PI2 * (50 - 24 * t) * t) * E(-t * 3.2) * 2.6 + lp * E(-t * 6) * 4.5 + Math.sin(PI2 * 1300 * t) * E(-t * 14) * 0.35 + Math.sin(PI2 * 2100 * t) * E(-t * 22) * 0.25; }); })();
      r.sword_pull = (function () { let lp = 0; return mk(0.9, (t) => { lp += 0.25 * (rnd() - lp); const sw = 0.5 + 0.5 * Math.sin(PI2 * 9 * t); return (lp * 1.2 + Math.sin(PI2 * (170 + 60 * t) * t) * 0.25) * sw * Math.sin(Math.PI * t / 0.9) * 1.1; }); })();
      r.sword_thud = (function () { let lp = 0; return mk(0.6, (t) => { lp += 0.07 * (rnd() - lp); return Math.sin(PI2 * (60 - 25 * t) * t) * E(-t * 8) * 1.8 + lp * E(-t * 14) * 3 + Math.sin(PI2 * 700 * t) * E(-t * 40) * 0.25; }); })();
      r.burn = (function () { let lp = 0; return mk(0.45, (t) => { const n = rnd(); lp += 0.5 * (n - lp); return (n - lp) * E(-t * 7) * 0.9 * (0.6 + 0.4 * Math.sin(PI2 * 40 * t)); }); })();
      r.molotov_light = (() => { const b = atob(SND_MOLOTOV_LIGHT), o = new Float32Array(b.length); for (let i = 0; i < b.length; i++) o[i] = (b.charCodeAt(i) - 128) / 128; return o; })();   // isqueiro + pano pegando fogo
      r.whoosh = (function () { let a = 0, b = 0; return mk(0.35, (t) => { const n = rnd(); a += 0.4 * (n - a); b += 0.08 * (n - b); return (a - b) * Math.sin(Math.PI * t / 0.35) * 1.5; }); })();
      r.glass = mk(0.6, (t) => { let v = (rnd() * 2 - 1) * E(-t * 30) * 0.9; for (const [f, d, a] of [[3100, 9, 0.35], [4700, 13, 0.3], [6300, 11, 0.25], [2300, 7, 0.2]]) v += Math.sin(PI2 * f * t) * E(-t * d) * a * (t > 0.01 ? 1 : 0); return v; });
      r.flame = (function () { let lp = 0, lp2 = 0; return mk(1.4, (t) => { const n = rnd(); lp += 0.25 * (n - lp); lp2 += 0.04 * (n - lp2); return ((n - lp) * 0.5 + lp2 * 3) * Math.min(1, t / 0.05) * E(-t * 1.8) * 1.4; }); })();
      r.revive = mk(1.4, (t) => { const u = t / 1.4; return (Math.sin(PI2 * (220 + 440 * u) * t) * 0.5 + Math.sin(PI2 * (330 + 660 * u) * t) * 0.3 + Math.sin(PI2 * 880 * t) * 0.12) * Math.sin(Math.PI * Math.min(1, u)) * 0.7; });
      r.buy = mk(0.5, (t) => (Math.sin(PI2 * 1318 * t) * E(-t * 9) + Math.sin(PI2 * 1760 * Math.max(0, t - 0.09)) * (t > 0.09 ? 1 : 0) * E(-(t - 0.09) * 8)) * 0.5);
      r.deny = mk(0.25, (t) => Math.sin(PI2 * 120 * t) * (Math.sin(PI2 * 22 * t) > 0 ? 1 : -1) * E(-t * 12) * 0.35);
      return r;
    }
    function toBuffer(samples) {
      let peak = 1e-6;
      for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i]));
      const k = peak > 0.95 ? 0.95 / peak : 1, b = actx.createBuffer(1, samples.length, SR), d = b.getChannelData(0);
      for (let i = 0; i < samples.length; i++) d[i] = samples[i] * k;
      return b;
    }
    function loop(name) {
      const s = actx.createBufferSource(), g = actx.createGain();
      s.buffer = bufs[name]; s.loop = true; g.gain.value = 0; s.connect(g); g.connect(master); s.start();
      return g;
    }
    return {
      muted: false,
      init() {
        if (actx) { if (actx.state === "suspended") actx.resume(); return; }
        try {
          const AC = window.AudioContext || window.webkitAudioContext;
          actx = new AC();
          const comp = actx.createDynamicsCompressor();
          master = actx.createGain(); master.gain.value = volume;
          master.connect(comp); comp.connect(actx.destination);
          conv = actx.createConvolver();
          const len = Math.floor(actx.sampleRate * 1.4), ir = actx.createBuffer(2, len, actx.sampleRate);
          for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = rnd() * Math.pow(1 - i / len, 3.2); }
          conv.buffer = ir; conv.connect(master);
          const r = recipes();
          for (const k in r) bufs[k] = toBuffer(r[k]);
          amb = { wind: loop("wind"), rain: loop("rain") };
        } catch (e) { actx = null; }
      },
      setVolume(v) { volume = clamp(v, 0, 1); if (master) master.gain.value = this.muted ? 0 : volume; },
      setMuted(m) { this.muted = !!m; if (master) master.gain.value = this.muted ? 0 : volume; },
      toggleMute() { this.setMuted(!this.muted); return this.muted; },
      setMix(sfx, voice, ambv) { mix.sfx = clamp(sfx, 0, 1.5); mix.voice = clamp(voice, 0, 1.5); mix.amb = clamp(ambv, 0, 1.5); this.ambient(ambOn, ambCfg); },
      ambient(active, envCfg) {
        ambOn = active; ambCfg = envCfg;
        if (!actx || !amb) return;
        const t = actx.currentTime, k = mix.amb;
        amb.wind.gain.setTargetAtTime(active ? (envCfg && envCfg.rain ? 0.12 : 0.07) * k : 0, t, 0.5);
        amb.rain.gain.setTargetAtTime(active && envCfg && envCfg.rain ? 0.16 * k : 0, t, 0.5);
      },
      play(name, vol, pitch, pan, wet) {
        vol = (vol === undefined ? 1 : vol) * mix[catOf(name)];
        if (!actx || this.muted || !bufs[name] || vol <= 0.01) return;
        const s = actx.createBufferSource(), g = actx.createGain();
        s.buffer = bufs[name]; s.playbackRate.value = pitch || 1; g.gain.value = vol; s.connect(g);
        let node = g;
        if (pan && actx.createStereoPanner) { const p = actx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); g.connect(p); node = p; }
        node.connect(master);
        const w = wet === undefined ? 0.12 : wet;
        if (w > 0) { const wg = actx.createGain(); wg.gain.value = w; node.connect(wg); wg.connect(conv); }
        s.start();
      },
    };
  })();

  // ======================================================================
  //  PRÉVIA 3D DA ARMA (menu)
  // ======================================================================
  let pvRenderer = null, pvScene = null, pvCam = null, pvPivot = null, pvOk = true;
  function initPreview() {
    if (pvRenderer || !pvOk) return;
    try {
      pvRenderer = new THREE.WebGLRenderer({ canvas: $("pvc"), antialias: true, alpha: true });
      pvRenderer.setClearColor(0x000000, 0);
      pvScene = new THREE.Scene();
      pvCam = new THREE.PerspectiveCamera(32, 2, 0.1, 20);
      pvCam.position.set(0, 0.25, 2.3); pvCam.lookAt(0, 0, 0);
      pvScene.add(new THREE.HemisphereLight(0xaab8d8, 0x302820, 1.1));
      const key = new THREE.DirectionalLight(0xffe0b0, 1.2); key.position.set(2, 3, 3); pvScene.add(key);
      const rim = new THREE.DirectionalLight(0x6a8aff, 0.7); rim.position.set(-3, 1, -2); pvScene.add(rim);
      pvPivot = new THREE.Group(); pvScene.add(pvPivot);
    } catch (e) { pvOk = false; pvRenderer = null; }
  }
  function resizePreview() {
    if (!pvRenderer) return;
    const c = $("pvc"), w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return;
    pvRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    pvRenderer.setSize(w, h, false);
    pvCam.aspect = w / h; pvCam.updateProjectionMatrix();
  }
  function buildPreview() {
    initPreview();
    if (!pvRenderer) return;
    while (pvPivot.children.length) pvPivot.remove(pvPivot.children[0]);
    const id = S.loadout[ui.slot], m = buildGun(id, S.camo, attOf(id), false, pvRenderer), g = m.group;
    const box = new THREE.Box3().setFromObject(g), size = new THREE.Vector3(), ctr = new THREE.Vector3();
    box.getSize(size); box.getCenter(ctr);
    const k = 1.5 / Math.max(size.x, size.z, 0.3);
    g.position.set(-ctr.x, -ctr.y, -ctr.z);
    const holder = new THREE.Group(); holder.add(g); holder.scale.set(k, k, k);
    pvPivot.add(holder);
    resizePreview();
  }
