package com.headlock.jame;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;

public class CrosshairOverlayService extends Service {

    private static CrosshairView crosshairView;

    public static int crosshairSize = 34;
    public static String crosshairColor = "#00ff88";

    private WindowManager windowManager;

    public static void refreshCrosshair() {
        if (crosshairView != null) {
            crosshairView.updateCrosshair(crosshairSize, crosshairColor);
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();

        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        crosshairView = new CrosshairView(this);

        int overlayType;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            overlayType = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            overlayType = WindowManager.LayoutParams.TYPE_PHONE;
        }

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                overlayType,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
                        | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT
        );

        params.gravity = Gravity.CENTER;

        windowManager.addView(crosshairView, params);
        refreshCrosshair();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();

        if (crosshairView != null && windowManager != null) {
            windowManager.removeView(crosshairView);
            crosshairView = null;
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    public static class CrosshairView extends View {

        private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private int size = 34;
        private int color = Color.parseColor("#00ff88");

        public CrosshairView(Context context) {
            super(context);
            paint.setStrokeCap(Paint.Cap.ROUND);
        }

        public void updateCrosshair(int newSize, String newColor) {
            size = Math.max(12, Math.min(newSize, 120));

            try {
                color = Color.parseColor(newColor);
            } catch (Exception e) {
                color = Color.parseColor("#00ff88");
            }

            invalidate();
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);

            float cx = getWidth() / 2f;
            float cy = getHeight() / 2f;

            float line = size;
            float gap = size * 0.35f;

            paint.setColor(color);
            paint.setStrokeWidth(Math.max(4f, size / 8f));

            canvas.drawLine(cx - line, cy, cx - gap, cy, paint);
            canvas.drawLine(cx + gap, cy, cx + line, cy, paint);
            canvas.drawLine(cx, cy - line, cx, cy - gap, paint);
            canvas.drawLine(cx, cy + gap, cx, cy + line, paint);

            paint.setStyle(Paint.Style.FILL);
            canvas.drawCircle(cx, cy, Math.max(3f, size / 8f), paint);
            paint.setStyle(Paint.Style.STROKE);
        }
    }
}
