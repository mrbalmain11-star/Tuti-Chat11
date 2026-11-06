package com.totichat.app

import android.Manifest
import android.app.PendingIntent
import android.content.Intent
import android.app.NotificationManager
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/**
 * Native receiver for server-authenticated FCM messages.
 * Never log FCM tokens or expose message contents on the lock screen.
 */
class TotiFirebaseMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Native-to-authenticated-backend token registration remains pending.
        // Do not persist or transmit tokens without a verified user session.
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        if (message.data["type"] != "direct_message") return
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) return

        val openMessages = Intent(this, MainActivity::class.java).apply {
            action = "com.totichat.app.OPEN_MESSAGES"
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, openMessages,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notification = NotificationCompat.Builder(this, "totichat_direct_messages")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("TotiChat")
            .setContentText("وصلتك رسالة خاصة جديدة")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify((System.currentTimeMillis() % Int.MAX_VALUE).toInt(), notification)
    }
}
