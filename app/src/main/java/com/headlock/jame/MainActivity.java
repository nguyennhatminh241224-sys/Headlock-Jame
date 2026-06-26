package com.headlock.jame;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.widget.Button;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private static final int OVERLAY_PERMISSION_CODE = 1001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Button btn = new Button(this);
        btn.setText("Bật tâm ảo");
        setContentView(btn);

        btn.setOnClickListener(v -> {
            if (!Settings.canDrawOverlays(this)) {
                Intent intent = new Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getPackageName())
                );
                startActivityForResult(intent, OVERLAY_PERMISSION_CODE);
            } else {
                startService(new Intent(this, CrosshairOverlayService.class));
            }
        });
    }

    @Override
    protected void onResume() {
        super.onResume();

        if (Settings.canDrawOverlays(this)) {
            startService(new Intent(this, CrosshairOverlayService.class));
        }
    }
}
