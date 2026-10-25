package org.mdmi.devotionals;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GoogleAuth.class);
        createNotificationChannels();
        super.onCreate(savedInstanceState);
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebSettings settings = this.bridge.getWebView().getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);
            settings.setSupportMultipleWindows(true);
        }
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                // High Priority Channel for Daily Devotionals and Prayer Watches
                NotificationChannel audibleChannel = new NotificationChannel(
                    "mdmi_channel",
                    "MDMI Devotionals (Audible)",
                    NotificationManager.IMPORTANCE_HIGH
                );
                audibleChannel.setDescription("Daily devotional alerts and ministry announcements with sound and vibration");
                audibleChannel.enableLights(true);
                audibleChannel.setLightColor(0xFF5E72E4);
                audibleChannel.enableVibration(true);
                audibleChannel.setShowBadge(true);
                audibleChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                notificationManager.createNotificationChannel(audibleChannel);

                // Silent Channel
                NotificationChannel silentChannel = new NotificationChannel(
                    "mdmi_channel_silent",
                    "MDMI Devotionals (Silent)",
                    NotificationManager.IMPORTANCE_DEFAULT
                );
                silentChannel.setDescription("Quiet devotional alerts without chime or vibration");
                silentChannel.setSound(null, null);
                silentChannel.enableVibration(false);
                silentChannel.setShowBadge(true);
                silentChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                notificationManager.createNotificationChannel(silentChannel);
            }
        }
    }
}
