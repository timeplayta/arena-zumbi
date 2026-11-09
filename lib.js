// captura com tempo virtual: cada __step avança 1/30 s e desenha um quadro
const { chromium } = require('playwright');
const path = require('path');
const SITE = 'file://' + path.join(__dirname, 'site', 'index.html');

const INIT = `
(() => {
  let vt = 0; const q = [];
  const pn = performance.now.bind(performance);
  performance.now = () => vt;
  window.requestAnimationFrame = (cb) => { q.push(cb); return q.length; };
  window.cancelAnimationFrame = () => {};
  window.__vt = () => vt;
  window.__step = (ms) => { vt += ms; const cbs = q.splice(0); for (const cb of cbs) { try { cb(vt); } catch (e) { console.log('ERR ' + e.message + ' ' + (e.stack||'').split('\\n')[1]); } } };
  try {
    localStorage.setItem('arena-zumbi-v2', JSON.stringify({ lang: 'pt', name: 'Sobrevivente', quality: 'high', shadows: 'full', fx: 'high', hints: false, showFps: false, fov: 90 }));
  } catch (e) {}
})();`;

async function open(w, h) {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  page.on('console', (m) => { const t = m.text(); if (/ERR|error/i.test(t)) console.log('[page]', t.slice(0, 200)); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.addInitScript(INIT);
  await page.goto(SITE, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => window.__AZ && window.__step, null, { timeout: 120000 });
  await page.evaluate(() => {
    const A = window.__AZ;
    window.__snd = [];
    const orig = A.Snd.play.bind(A.Snd);
    A.Snd.play = function (n, v, p, pan, wet) { window.__snd.push([window.__vt(), n, v === undefined ? 1 : v, p || 1, pan || 0, wet === undefined ? 0.12 : wet]); };
    for (const o of A.wallet ? ['brutus', 'falcao', 'revolver', 'titan', 'smg'] : []) A.wallet.own['w_' + o] = true;
    document.getElementById('gate').hidden = true;
    document.getElementById('menu').inert = false;
  });
  return { browser, page };
}
module.exports = { open };
