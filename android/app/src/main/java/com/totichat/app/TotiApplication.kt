package com.totichat.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build

class TotiApplication : Application() {
    override fun onCreate() {
        super.onCreate()
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
