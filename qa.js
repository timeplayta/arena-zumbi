// QA do jogo no navegador: percorre menus, modos, armas e telas; junta erros do console e prints
// node qa.js <html> <saida> <perfil: desktop|mobile>
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');
const [HTML, OUT, PROFILE] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const errors = [], log = (...a) => { const s = a.join(' '); console.log(s); fs.appendFileSync(path.join(OUT, 'log.txt'), s + '\n'); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const ctxOpt = PROFILE === 'mobile' ? { ...devices['Pixel 7'], viewport: { width: 915, height: 412 }, isMobile: true, hasTouch: true } : PROFILE === 'small' ? { ...devices['Pixel 7'], viewport: { width: 740, height: 360 }, isMobile: true, hasTouch: true } : PROFILE === 'portrait' ? { ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 720 } };
  const ctx = await b.newContext(ctxOpt);
  await ctx.route(/workers\.dev|zpaysolution|supabase/, (r) => r.abort());      // nada de servidor de verdade
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { errors.push('PAGEERROR ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')); log('PAGEERROR', e.message); });
  page.on('console', (m) => { if (m.type() === 'error') { const t = m.text(); if (!/net::ERR|Failed to load resource|ERR_FAILED|blocked/i.test(t)) { errors.push('CONSOLE ' + t.slice(0, 300)); log('CONSOLE', t.slice(0, 300)); } } });
  await page.addInitScript((touch) => { try { localStorage.setItem('arena-zumbi-v2', JSON.stringify({ lang: 'pt', touch: touch ? 'on' : 'auto' })); } catch (e) {} }, PROFILE !== 'desktop');
  await page.goto('file://' + path.resolve(HTML), { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => window.__AZ, null, { timeout: 120000 });
  let shot = 0;
  const snap = async (name) => { await sleep(400); const lay = await page.evaluate(() => { const out = []; const W = innerWidth, H = innerHeight; if (document.documentElement.scrollWidth > W + 2) out.push('hscroll ' + document.documentElement.scrollWidth); for (const b of document.querySelectorAll('button, .who, #hp, .ammo')) { if (!b.offsetParent) continue; const r = b.getBoundingClientRect(); if (r.width && (r.right > W + 1 || r.bottom > H + 1 || r.left < -1 || r.top < -1)) { const sc = b.closest('.overlay, .m-main, .panel, nav'); if (sc && sc.scrollHeight > sc.clientHeight + 2 && r.bottom > H) continue; out.push((b.id || b.className || b.tagName) + ' ' + [r.left, r.top, r.right, r.bottom].map(Math.round)); } } return out; }).catch(() => []); if (lay.length) { log('LAYOUT', name, JSON.stringify(lay.slice(0, 6))); errors.push('LAYOUT ' + name + ' ' + JSON.stringify(lay.slice(0, 4))); } await page.screenshot({ path: path.join(OUT, String(++shot).padStart(2, '0') + '_' + name + '.jpg'), type: 'jpeg', quality: 70, timeout: 120000 }); };
  const ev = (fn, arg) => page.evaluate(fn, arg).catch((e) => { errors.push('EVAL ' + e.message.slice(0, 200)); log('EVAL', e.message.slice(0, 200)); });
  const key = async (code, ms) => { await ev((c) => window.dispatchEvent(new KeyboardEvent('keydown', { code: c, key: c, bubbles: true })), code); await sleep(ms || 80); await ev((c) => window.dispatchEvent(new KeyboardEvent('keyup', { code: c, key: c, bubbles: true })), code); };
  const state = () => page.evaluate(() => { const A = window.__AZ, g = A.game; return { st: A.state, wave: g && g.wave, hp: g && Math.round(g.hp), alive: g && g.alive, w: g && g.w && g.w().cfg.id, mag: g && g.w && g.w().mag, z: g && g.zombies && g.zombies.length }; }).catch(() => ({}));
  await ev(() => { document.getElementById('gate').hidden = true; document.getElementById('menu').inert = false; });
  await snap('menu');

  // 1) abas do menu e todos os botões de opção
  const tabs = await page.$$eval('[data-tab]', (els) => els.map((e) => e.getAttribute('data-tab')));
  for (const t of tabs) {
    await ev((t) => document.querySelector('[data-tab="' + t + '"]').click(), t); await sleep(250);
    await snap('tab_' + t);
    if (t === 'settings' || t === 'mission' || t === 'custom' || t === 'arsenal') {
      const n = await page.$$eval('.panel:not([hidden]) .opts button, .panel:not([hidden]) button[data-v]', (els) => els.length).catch(() => 0);
      for (let i = 0; i < n; i++) await ev((i) => { const els = document.querySelectorAll('.panel:not([hidden]) .opts button, .panel:not([hidden]) button[data-v]'); const e = els[i]; if (e && !/btnLogout|data-lang/.test(e.outerHTML)) e.click(); }, i);
      const ranges = await page.$$eval('.panel:not([hidden]) input[type=range]', (els) => els.length).catch(() => 0);
      for (let i = 0; i < ranges; i++) await ev((i) => { const e = document.querySelectorAll('.panel:not([hidden]) input[type=range]')[i]; e.value = e.max; e.dispatchEvent(new Event('input', { bubbles: true })); e.value = e.min; e.dispatchEvent(new Event('input', { bubbles: true })); e.value = (+e.min + +e.max) / 2; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, i);
      log('tab', t, 'opts', n, 'ranges', ranges);
      await snap('tab_' + t + '_after');
    }
  }
  // idiomas
  for (const l of ['en', 'es', 'pt']) { await ev((l) => window.I18N && I18N.set(l), l); await sleep(300); if (l !== 'pt') await snap('lang_' + l); }
  await ev(() => document.querySelector('[data-tab="mission"]').click());

  // 2) partidas: mapa/ambiente/dificuldade/armas
  const runs = [
    ['ax4', 'p45', 'night', 'normal'], ['brutus', 'smg', 'storm', 'hard'], ['titan', 'revolver', 'fog', 'extremo'], ['falcao', 'smg', 'dusk', 'apocalipse'],
  ];
  for (const [w1, w2, env, diff] of runs) {
    await ev(([w1, w2, env, diff]) => { const A = window.__AZ; for (const o of ['brutus', 'falcao', 'revolver', 'titan', 'smg']) A.wallet.own['w_' + o] = true; A.S.loadout = [w1, w2]; A.S.env = env; A.S.diff = diff; A.startGame(); }, [w1, w2, env, diff]);
    await sleep(1500);
    await ev(() => { const g = window.__AZ.game; g.pauseT = 0; });
    const tag = w1 + '_' + env + '_' + diff;
    // tiros, mira, correr, agachar, recarregar, trocar, faca, modo de tiro, poções
    await ev(() => window.__AZ.setMouse(true)); await key('KeyW', 1200); await ev(() => window.__AZ.setMouse(false));
    await ev(() => window.__AZ.setAds(true)); await ev(() => window.__AZ.setMouse(true)); await sleep(800); await ev(() => { window.__AZ.setMouse(false); window.__AZ.setAds(false); });
    await snap(tag + '_fire');
    await key('ShiftLeft', 50); await ev(() => { window.__AZ.keys.add('KeyW'); window.__AZ.keys.add('ShiftLeft'); window.__AZ.setMouse(true); }); await sleep(1000); await ev(() => { window.__AZ.keys.delete('KeyW'); window.__AZ.keys.delete('ShiftLeft'); window.__AZ.setMouse(false); });
    await key('KeyC', 600); await key('KeyR', 100); await sleep(1500); await key('Digit2', 100); await sleep(700); await ev(() => window.__AZ.setMouse(true)); await sleep(500); await ev(() => window.__AZ.setMouse(false));
    await key('KeyQ', 100); await sleep(400); await key('Digit3', 100); await sleep(500); await ev(() => window.__AZ.setMouse(true)); await sleep(200); await ev(() => window.__AZ.setMouse(false)); await key('Digit3', 100); await sleep(500); await key('KeyF', 100); await sleep(500); await key('KeyB', 100); await sleep(300); await key('Digit1', 100); await sleep(500);
    await key('KeyG', 100); await sleep(1200); await ev(() => window.__AZ.setMouse(true)); await sleep(150); await ev(() => window.__AZ.setMouse(false)); await sleep(1500);
    await key('KeyH', 100); await sleep(1200); await key('Digit4', 100); await sleep(300);
    await snap(tag + '_pots');
    log('run', tag, JSON.stringify(await state()));
    // pausa, volta
    await key('Escape', 100); await sleep(500); await snap(tag + '_pause'); await ev(() => document.getElementById('btnResume').click()); await sleep(800);
    // morte → tela de morte → jogar de novo → menu
    await ev(() => { const g = window.__AZ.game; g.revives = 0; g.invulnT = 0; g.hurt(99999, null, { pierce: true }); }); await sleep(3500);
    await snap(tag + '_dead');
    log('dead', tag, JSON.stringify(await state()), 'deadVisible', await page.evaluate(() => !document.getElementById('dead').hidden));
    await ev(() => document.getElementById('btnRestart').click()); await sleep(1500);
    log('restart', tag, JSON.stringify(await state()));
    await key('Escape', 100); await sleep(400); await ev(() => document.getElementById('btnToMenu1').click()); await sleep(800);
    log('menu', tag, JSON.stringify(await state()));
  }
  // 3) Itália + infecção offline com bots
  await ev(() => { document.querySelector('[data-tab="online"]').click(); }); await sleep(300);
  await ev(() => { document.querySelector('[data-gm=infect]').click(); document.getElementById('btnCoopOffline').click(); }); await sleep(3000);
  await ev(() => { const g = window.__AZ.game; if (g.inf) g.inf.t = 0.05; }); await sleep(4000);
  await ev(() => window.__AZ.setMouse(true)); await sleep(2000); await ev(() => window.__AZ.setMouse(false));
  await snap('infect');
  log('infect', JSON.stringify(await state()), await page.evaluate(() => { const g = window.__AZ.game; return JSON.stringify({ ph: g.inf && g.inf.ph, team: g.team, hu: g.inf && g.inf.hu }); }));
  // vira zumbi: ataca, golpe pesado
  await ev(() => { const g = window.__AZ.game; g.becomeZombie(g.coop ? g.coop.id : 'p1'); }); await sleep(1500);
  await ev(() => window.__AZ.setMouse(true)); await sleep(600); await ev(() => window.__AZ.setMouse(false)); await ev(() => window.__AZ.setAds(true)); await sleep(600); await ev(() => window.__AZ.setAds(false));
  await snap('infect_zombie');
  log('infect-z', JSON.stringify(await state()), await page.evaluate(() => window.__AZ.game.team));
  await key('Escape', 100); await sleep(400); await ev(() => document.getElementById('btnToMenu1').click()); await sleep(800);
  // 4) Itália em ondas (mapa) + co-op ondas offline
  await ev(() => { document.querySelector('[data-gm]:not([data-gm=infect])') && document.querySelector('[data-gm]:not([data-gm=infect])').click(); document.getElementById('btnCoopOffline').click(); }); await sleep(3000);
  await ev(() => { const g = window.__AZ.game; g.pauseT = 0; window.__AZ.setMouse(true); }); await sleep(2500); await ev(() => window.__AZ.setMouse(false));
  await snap('coop_offline');
  log('coop-offline', JSON.stringify(await state()));
  await key('Escape', 100); await sleep(400); await ev(() => document.getElementById('btnToMenu1').click()); await sleep(800);
  await snap('end_menu');
  fs.writeFileSync(path.join(OUT, 'errors.txt'), errors.join('\n') + '\n');
  log('ERRORS', errors.length);
  await b.close();
})().catch((e) => { log('FATAL', e.stack); fs.writeFileSync(path.join(OUT, 'errors.txt'), errors.join('\n') + '\nFATAL ' + e.message + '\n'); process.exit(0); });
