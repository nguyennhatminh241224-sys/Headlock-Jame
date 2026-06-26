package com.headlock.jame;

import android.app.Service;
import android.content.Intent;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.os.Build;
import android.os.IBinder;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.content.Context;
import android.graphics.PixelFormat;

public class CrosshairOverlayService extends Service {

    private WindowManager windowManager;
    private CrosshairView crosshairView;

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
    }

    @Override
    public void onDestroy() {
        super.onDestroy();

        if (crosshairView != null) {
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

        public CrosshairView(Context context) {
            super(context);

            paint.setColor(Color.RED);
            paint.setStrokeWidth(5f);
            paint.setStrokeCap(Paint.Cap.ROUND);
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);

            float cx = getWidth() / 2f;
            float cy = getHeight() / 2f;

            float line = 35f;
            float gap = 10f;

            canvas.drawLine(cx - line, cy, cx - gap, cy, paint);
            canvas.drawLine(cx + gap, cy, cx + line, cy, paint);
            canvas.drawLine(cx, cy - line, cx, cy - gap, paint);
            canvas.drawLine(cx, cy + gap, cx, cy + line, paint);
            canvas.drawCircle(cx, cy, 4f, paint);
        }
    }
}
