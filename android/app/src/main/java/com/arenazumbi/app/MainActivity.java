package com.arenazumbi.app;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.TextView;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

// Arena Zumbi: o jogo roda numa WebView. Ao abrir, procura versão nova no Cloudflare;
// se houver, baixa o jogo offline (index-offline.html) e já abre a versão nova.
public class MainActivity extends Activity {
    private static final String BASE = "https://arena-zumbi.playes.workers.dev/";
    private WebView web;
    private TextView splash;

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON | WindowManager.LayoutParams.FLAG_FULLSCREEN);
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(true);
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient());
        web.setBackgroundColor(0xFF07090D);
        splash = new TextView(this);
        splash.setText("ARENA ZUMBI\n\nProcurando atualização...");
        splash.setTextColor(Color.rgb(255, 178, 74));
        splash.setTextSize(22);
        splash.setGravity(Gravity.CENTER);
        splash.setBackgroundColor(0xFF07090D);
        setContentView(splash);
        hideBars();
        if (saved != null) { setContentView(web); web.restoreState(saved); return; }
        new Thread(this::chooseGame).start();
    }

    private static String get(String url, int timeoutMs) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url + "?t=" + System.currentTimeMillis()).openConnection();
        c.setConnectTimeout(timeoutMs); c.setReadTimeout(timeoutMs); c.setUseCaches(false);
        if (c.getResponseCode() != 200) throw new Exception("http " + c.getResponseCode());
        InputStream in = c.getInputStream(); ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] b = new byte[16384]; int n; while ((n = in.read(b)) > 0) out.write(b, 0, n);
        in.close(); return out.toString("UTF-8");
    }
    private static long ver(String json) { try { return new JSONObject(json).getLong("v"); } catch (Exception e) { return 0; } }
    private String readAsset(String name) { try { InputStream in = getAssets().open(name); ByteArrayOutputStream out = new ByteArrayOutputStream(); byte[] b = new byte[8192]; int n; while ((n = in.read(b)) > 0) out.write(b, 0, n); in.close(); return out.toString("UTF-8"); } catch (Exception e) { return ""; } }
    private String readFile(File f) { try { InputStream in = new java.io.FileInputStream(f); ByteArrayOutputStream out = new ByteArrayOutputStream(); byte[] b = new byte[8192]; int n; while ((n = in.read(b)) > 0) out.write(b, 0, n); in.close(); return out.toString("UTF-8"); } catch (Exception e) { return ""; } }
    private static void write(File f, String s) throws Exception { FileOutputStream o = new FileOutputStream(f); o.write(s.getBytes("UTF-8")); o.close(); }

    private void chooseGame() {
        File dir = new File(getFilesDir(), "jogo"), html = new File(dir, "index.html"), vf = new File(dir, "version.json");
        long bundled = ver(readAsset("version.json")), cached = html.exists() ? ver(readFile(vf)) : 0;
        String url = "file:///android_asset/index.html"; long cur = bundled;
        if (cached > bundled) { url = "file://" + html.getAbsolutePath(); cur = cached; }
        try {
            String rv = get(BASE + "version.json", 5000);
            if (ver(rv) > cur) {
                runOnUiThread(() -> splash.setText("ARENA ZUMBI\n\nBaixando atualização..."));
                String h = get(BASE + "index-offline.html", 60000);
                if (h.length() > 200000 && h.contains("GAME_VERSION")) {
                    dir.mkdirs(); File tmp = new File(dir, "index.tmp"); write(tmp, h);
                    if (html.exists()) html.delete();
                    tmp.renameTo(html); write(vf, rv);
                    url = "file://" + html.getAbsolutePath();
                }
            }
        } catch (Exception e) { /* sem internet: abre a versão local */ }
        final String go = url;
        runOnUiThread(() -> { setContentView(web); hideBars(); web.loadUrl(go); });
    }

    private void hideBars() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
    }

    @Override public void onWindowFocusChanged(boolean f) { super.onWindowFocusChanged(f); if (f) hideBars(); }
    @Override protected void onPause() { super.onPause(); web.onPause(); }
    @Override protected void onResume() { super.onResume(); web.onResume(); hideBars(); }
    @Override protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }

    // botão voltar do Android = pausar o jogo (Esc)
    @Override
    public void onBackPressed() {
        web.evaluateJavascript("document.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape',bubbles:true}))", null);
    }
}
