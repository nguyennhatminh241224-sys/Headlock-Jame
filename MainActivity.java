package com.example.headlockjame; // ĐỔI TÊN PACKAGE THEO APP CỦA BẠN

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private static final int ACTION_MANAGE_OVERLAY_PERMISSION_REQUEST_CODE = 123;

    @Override
    protected void Bundle) {
        super.onCreate(savedInstanceState);
        
        // Kiểm tra và xin quyền vẽ lên ứng dụng khác
        checkOverlayPermission();
    }

    private void checkOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(this)) {
                // Chưa có quyền -> Mở cài đặt hệ thống để bật
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getPackageName()));
                startActivityForResult(intent, ACTION_MANAGE_OVERLAY_PERMISSION_REQUEST_CODE);
                Toast.makeText(this, "Hãy cấp quyền 'Hiển thị trên ứng dụng khác' để dùng tâm ảo!", Toast.LENGTH_LONG).show();
            } else {
                // Đã có quyền -> Chạy tâm ảo luôn
                startFloatingService();
            }
        } else {
            // Máy Android cũ không cần xin quyền động
            startFloatingService();
        }
    }

    private void startFloatingService() {
        Intent intent = new Intent(MainActivity.this, FloatingWindowService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent);
        } else {
            startService(intent);
        }
        // Sau khi bật tâm ảo, ẩn App chính đi hoặc đóng App để người dùng vào game
        finish(); 
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == ACTION_MANAGE_OVERLAY_PERMISSION_REQUEST_CODE) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (Settings.canDrawOverlays(this)) {
                    startFloatingService();
                } else {
                    Toast.makeText(this, "Bạn đã từ chối cấp quyền. Tâm ảo không thể hoạt động!", Toast.LENGTH_SHORT).show();
                }
            }
        }
    }
}
