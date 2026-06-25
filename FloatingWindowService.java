package com.example.headlockjame; // ĐỔI TÊN PACKAGE THEO APP CỦA BẠN

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.view.Gravity;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.core.app.NotificationCompat;

public class FloatingWindowService extends Service {
    private WindowManager windowManager;
    private WebView webView;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();

        // 1. Tạo Notification để chạy Foreground Service (Bắt buộc từ Android 8.0+)
        String CHANNEL_ID = "headlock_jame_channel";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, "Headlock Jame Service",
                    NotificationManager.IMPORTANCE_LOW);
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) manager.createNotificationChannel(channel);
        }

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Headlock Jame")
                .setContentText("Tâm ảo đang hiển thị đè game...")
                .setSmallIcon(android.R.drawable.ic_menu_compass)
                .build();
        
        startForeground(1, notification);

        // 2. Khởi tạo WindowManager và WebView
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        webView = new WebView(this);

        // Cấu hình WebView trong suốt để không che màn hình game
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true); // Bật Javascript nếu tâm ảo dùng JS
        webView.setBackgroundColor(Color.TRANSPARENT); // Đặt nền WebView TRONG SUỐT
        webView.setWebViewClient(new WebViewClient());

        // ĐƯỜNG DẪN: Load file index.html nằm trong thư mục assets của APK
        webView.loadUrl("file:///android_asset/index.html");

        // 3. Thiết lập Layout hiển thị đè (Overlay)
        int LAYOUT_FLAG;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            LAYOUT_FLAG = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            LAYOUT_FLAG = WindowManager.LayoutParams.TYPE_PHONE;
        }

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT, // Toàn màn hình để căn tâm chuẩn
                WindowManager.LayoutParams.MATCH_PARENT,
                LAYOUT_FLAG,
                // FLAG_NOT_FOCUSABLE & FLAG_NOT_TOUCHABLE: Giúp bạn BẤM XUYÊN QUA tâm ảo để bắn game
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | 
                WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE | 
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT // Định dạng trong suốt
        );

        params.gravity = Gravity.CENTER;

        // Thêm WebView lên trên cùng màn hình
        windowManager.addView(webView, params);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        // Xóa WebView khỏi màn hình khi tắt ứng dụng
        if (webView != null && windowManager != null) {
            windowManager.removeView(webView);
        }
    }
}
