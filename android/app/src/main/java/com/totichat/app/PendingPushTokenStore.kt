package com.totichat.app

import android.content.Context

/**
 * App-private, temporary FCM token storage until the app has a verified
 * authenticated session. Never expose this token in logs or UI.
 *
 * Tokens are not user credentials, but must never be registered against a
 * guessed or stale user ID. Clear the saved token on account sign-out.
 */
internal object PendingPushTokenStore {
    private const val PREFS = "totichat_push_device"
    private const val TOKEN = "pending_fcm_token"

    fun save(context: Context, token: String) {
        if (token.isBlank()) return
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putString(TOKEN, token).apply()
    }

    fun get(context: Context): String? =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(TOKEN, null)?.takeIf { it.isNotBlank() }

    fun clear(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().remove(TOKEN).apply()
    }
}
