package com.headlock.jame;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;

public class MainActivity extends Activity {

    private WebView webView;

    @SuppressLint({"SetJavaScriptEnabled", "HardwareIds"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");
        webView.loadUrl("file:///android_asset/index.html");
    }

    public class AndroidBridge {

        @JavascriptInterface
        public String getAndroidId() {
            return Settings.Secure.getString(
                    getContentResolver(),
                    Settings.Secure.ANDROID_ID
            );
        }

        @JavascriptInterface
        public void startCrosshair() {
            runOnUiThread(() -> {
                if (!Settings.canDrawOverlays(MainActivity.this)) {
                    Intent intent = new Intent(
                            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                            Uri.parse("package:" + getPackageName())
                    );
                    startActivity(intent);
                } else {
                    startService(new Intent(MainActivity.this, CrosshairOverlayService.class));
                }
            });
        }

        @JavascriptInterface
        public void stopCrosshair() {
            runOnUiThread(() -> {
                stopService(new Intent(MainActivity.this, CrosshairOverlayService.class));
            });
        }

        @JavascriptInterface
        public void updateCrosshair(int size, String color) {
            runOnUiThread(() -> {
                CrosshairOverlayService.crosshairSize = size;
                CrosshairOverlayService.crosshairColor = color;
                CrosshairOverlayService.refreshCrosshair();
            });
        }
    }
}
