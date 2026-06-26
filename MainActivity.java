package com.headlock.jame;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.os.Bundle;
import android.provider.Settings;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private CrosshairView crosshairView;

    @SuppressLint({"SetJavaScriptEnabled", "HardwareIds"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        FrameLayout root = new FrameLayout(this);

        webView = new WebView(this);
        crosshairView = new CrosshairView(this);

        root.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        ));

        root.addView(crosshairView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        ));

        setContentView(root);

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
        public void updateCrosshair(final int size, final String color) {
            runOnUiThread(() -> {
                crosshairView.setCrosshairSize(size);
                crosshairView.setCrosshairColor(color);
            });
        }

        @JavascriptInterface
        public void setCrosshairVisibility(final boolean visible) {
            runOnUiThread(() -> {
                crosshairView.setVisibility(visible ? View.VISIBLE : View.GONE);
            });
        }
    }

    public static class CrosshairView extends View {

        private Paint paint;
        private int size = 60;
        private int color = Color.RED;

        public CrosshairView(Context context) {
            super(context);
            setWillNotDraw(false);

            paint = new Paint(Paint.ANTI_ALIAS_FLAG);
            paint.setStrokeWidth(5f);
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeCap(Paint.Cap.ROUND);

            setClickable(false);
            setFocusable(false);
        }

        public void setCrosshairSize(int size) {
            this.size = Math.max(20, Math.min(size, 200));
            invalidate();
        }

        public void setCrosshairColor(String colorString) {
            try {
                this.color = Color.parseColor(colorString);
            } catch (Exception e) {
                this.color = Color.RED;
            }
            invalidate();
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);

            int width = getWidth();
            int height = getHeight();

            float centerX = width / 2f;
            float centerY = height / 2f;

            float gap = size * 0.18f;
            float line = size * 0.5f;

            paint.setColor(color);

            canvas.drawLine(centerX - line, centerY, centerX - gap, centerY, paint);
            canvas.drawLine(centerX + gap, centerY, centerX + line, centerY, paint);

            canvas.drawLine(centerX, centerY - line, centerX, centerY - gap, paint);
            canvas.drawLine(centerX, centerY + gap, centerX, centerY + line, paint);

            canvas.drawCircle(centerX, centerY, 4f, paint);
        }
    }
}
