package com.jameff.headlockpanel;

import android.app.Service;
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

public class OverlayService extends Service {
    private WindowManager windowManager;
    private CrosshairView crosshairView;

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            boolean action = intent.getBooleanExtra("action", false);
            int size = intent.getIntExtra("size", 34);
            String color = intent.getStringExtra("color");

            if (action) {
                drawCrosshair(size, color);
            } else {
                stopSelf();
            }
        }
        return START_NOT_STICKY;
    }

    private void drawCrosshair(int sizeDp, String colorHex) {
        if (crosshairView != null) { windowManager.removeView(crosshairView); }

        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        int sizePx = (int) (sizeDp * getResources().getDisplayMetrics().density);

        int flag = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) 
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY 
                : WindowManager.LayoutParams.TYPE_PHONE;

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                sizePx, sizePx, flag,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
                PixelFormat.TRANSLUCENT
        );
        params.gravity = Gravity.CENTER;

        crosshairView = new CrosshairView(this, colorHex);
        windowManager.addView(crosshairView, params);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (crosshairView != null && windowManager != null) {
            windowManager.removeView(crosshairView);
            crosshairView = null;
        }
    }

    // Lớp đồ họa tự vẽ hình tâm ngắm dấu cộng tròn bằng code canvas chuẩn xác
    private static class CrosshairView extends View {
        private final Paint paint = new Paint();

        public CrosshairView(Service context, String colorHex) {
            super(context);
            paint.setColor(Color.parseColor(colorHex));
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(4f);
            paint.setAntiAlias(true);
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            float center = getWidth() / 2f;
            float radius = getWidth() / 2f - 6f;
            
            // Vẽ vòng tròn tâm
            canvas.drawCircle(center, center, radius, paint);
            
            // Vẽ chữ thập giữa tâm
            canvas.drawLine(center, center - 12f, center, center + 12f, paint);
            canvas.drawLine(center - 12f, center, center + 12f, center, paint);
        }
    }
}
