package com.totichat.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.messaging.FirebaseMessaging

class TotiApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Initialize explicitly without altering existing Gradle packaging.
        if (FirebaseApp.getApps(this).isEmpty()) {
            val options = FirebaseOptions.Builder()
                .setApplicationId("1:628216218105:android:4caaeeff37e1d90f7b3d28")
                .setGcmSenderId("628216218105")
                .setApiKey("AIzaSyBlyAM3x9Y4kEzdCuNPXAZcMLLKC1YMzDY")
                .setProjectId("totichatpro")
                .build()
            FirebaseApp.initializeApp(this, options)
        }
        // Obtain a token on startup as well as during onNewToken refreshes.
        // Keep it local until an authenticated user can register it.
        FirebaseMessaging.getInstance().token.addOnSuccessListener { token ->
            PendingPushTokenStore.save(this, token)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(NotificationManager::class.java)
            val channel = NotificationChannel(
                "totichat_direct_messages",
                "الرسائل الخاصة",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "إشعارات الرسائل الخاصة الجديدة في TotiChat"
            }
            manager.createNotificationChannel(channel)
        }
    }
}
