package com.numyar.totichat.staging;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

/**
 * Staged implementation for the generated Capacitor APK.
 * Displays only a generic private-message notification: no message body,
 * sender identity or personal data is exposed on the lock screen.
 *
 * This file is not yet included in the APK build; the native Firebase plugin,
 * manifest entry and Android dependency must be wired together first.
 */
public final class TotiPushMessagingService extends FirebaseMessagingService {
    private static final String CHANNEL_ID = "totichat_direct_messages";

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        // FCM installation tokens are not user identities. The authenticated
        // JS bridge obtains the current token and registers it with Supabase.
        // Never upload tokens from this unauthenticated background service.
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage message) {
        super.onMessageReceived(message);
        if (!"direct_message".equals(message.getData().get("type"))) return;
        if (Build.VERSION.SDK_INT >= 33 &&
                ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) return;

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null) return;
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, "الرسائل الخاصة", NotificationManager.IMPORTANCE_DEFAULT);
            channel.setDescription("إشعارات الرسائل الخاصة الجديدة في TotiChat");
            manager.createNotificationChannel(channel);
        }

        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (launch == null) return;
        launch.setAction("com.numyar.totichat.staging.OPEN_MESSAGES");
        launch.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent open = PendingIntent.getActivity(this, 0, launch,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        int icon = getApplicationInfo().icon;
        NotificationCompat.Builder notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(icon)
            .setContentTitle("TotiChat")
            .setContentText("وصلتك رسالة خاصة جديدة")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .setContentIntent(open)
            .setAutoCancel(true);
        manager.notify((int) (System.currentTimeMillis() & 0x7fffffff), notification.build());
    }
}
