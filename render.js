// node render.js <cena> <w> <h> <saida> [maxFrames] [cada]
const fs = require('fs'), path = require('path');
const { open } = require('./lib');
const SC = require('./scenes');
(async () => {
  const [name, w, h, out, maxF, every] = process.argv.slice(2);
  const sc = SC[name]; fs.mkdirSync(out, { recursive: true });
  const { browser, page } = await open(+w, +h);
  await page.evaluate(fs.readFileSync(path.join(__dirname, 'pilot.js'), 'utf8'));
  await page.evaluate(sc.setup);
  const t0 = await page.evaluate(() => window.__vt());
  const N = Math.min(sc.frames, +maxF || 1e9), E = +every || 1;
  const T = Date.now();
  for (let i = 0; i < N; i++) {
    await page.evaluate(() => window.__pilot.tick());
    if (i % E === 0) await page.screenshot({ path: path.join(out, 'f' + String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 92, timeout: 600000 });
    if (i % 30 === 0) console.log(name, i, '/', N, ((Date.now() - T) / 1000).toFixed(0) + 's', await page.evaluate(() => { const g = window.__AZ.game; return 'z=' + g.aliveZombies().length + ' k=' + (g.kills || 0) + ' yaw=' + g.yaw.toFixed(2); }));
  }
  const snd = await page.evaluate((t0) => window.__snd.filter((e) => e[0] >= t0).map((e) => [(e[0] - t0) / 1000].concat(e.slice(1))), t0);
  fs.writeFileSync(path.join(out, 'snd.json'), JSON.stringify(snd));
  if (!fs.existsSync(path.join(__dirname, 'sndbufs.json'))) {
    const bufs = await page.evaluate(() => { const r = window.__SNDR || {}; const o = {}; for (const k in r) o[k] = Array.from(r[k], (v) => Math.round(v * 10000) / 10000); return o; });
    if (Object.keys(bufs).length) fs.writeFileSync(path.join(out, 'sndbufs.json'), JSON.stringify(bufs));
  }
  await browser.close();
})();
