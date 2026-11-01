// Arena Zumbi para Windows (Electron).
// Ao abrir: procura versão nova no Cloudflare; se houver, baixa o jogo offline e já abre a versão nova.
// Sem internet: abre a última versão baixada (ou a que veio junto com o instalador).
const { app, BrowserWindow, Menu, net } = require("electron");
const fs = require("fs"), path = require("path");
const BASE = "https://arena-zumbi.playes.workers.dev/";

app.commandLine.appendSwitch("ignore-gpu-blocklist");
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

const readV = (f) => { try { return Number(JSON.parse(fs.readFileSync(f, "utf8")).v) || 0; } catch (e) { return 0; } };
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("tempo")), ms))]);
async function getText(url, ms) { const r = await withTimeout(net.fetch(url + "?t=" + Date.now(), { cache: "no-store" }), ms); if (!r.ok) throw new Error("http " + r.status); return withTimeout(r.text(), ms); }
const splash = (msg) => "data:text/html;charset=utf-8," + encodeURIComponent('<body style="margin:0;background:#07090d;color:#e9edf2;font:600 22px Arial;display:grid;place-items:center;height:100vh"><div style="text-align:center"><div style="font-size:44px;color:#ffb24a;letter-spacing:4px">ARENA ZUMBI</div><div id="m" style="margin-top:14px;opacity:.8">' + msg + "</div></div></body>");

async function bestGame(win) {
  const dir = path.join(app.getPath("userData"), "jogo"), cached = path.join(dir, "index.html"), cachedV = path.join(dir, "version.json");
  const bundled = readV(path.join(__dirname, "version.json"));
  let file = path.join(__dirname, "index.html"), v = bundled;
  const cv = readV(cachedV); if (cv > v && fs.existsSync(cached)) { file = cached; v = cv; }
  try {
    const rv = JSON.parse(await getText(BASE + "version.json", 5000));
    if (Number(rv.v) > v) {
      win.webContents.executeJavaScript("document.getElementById('m').textContent='Baixando atualização...'").catch(() => {});
      const html = await getText(BASE + "index-offline.html", 60000);
      if (html.length > 200000 && html.indexOf("GAME_VERSION") > 0) {
        fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(cached + ".tmp", html); fs.renameSync(cached + ".tmp", cached);
        fs.writeFileSync(cachedV, JSON.stringify(rv)); file = cached; v = Number(rv.v);
      }
    }
  } catch (e) { /* sem internet ou servidor fora: segue com a versão local */ }
  return file;
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 720, minWidth: 800, minHeight: 500,
    title: "Arena Zumbi", backgroundColor: "#07090d",
    autoHideMenuBar: true, fullscreen: true,
    webPreferences: { backgroundThrottling: false, contextIsolation: true, sandbox: true }
  });
  win.setMenuBarVisibility(false);
  win.webContents.on("before-input-event", (e, input) => {
    if (input.type !== "keyDown") return;
    if (input.key === "F11") { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    else if (input.control && input.key.toLowerCase() === "q") { app.quit(); e.preventDefault(); }
  });
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  await win.loadURL(splash("Procurando atualização..."));
  win.loadFile(await bestGame(win));
}

Menu.setApplicationMenu(null);
app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
