package com.totichat.app

import android.os.Bundle
import android.content.Intent
import androidx.compose.runtime.mutableStateOf
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.totichat.app.ui.theme.TotiChatTheme

class MainActivity : ComponentActivity() {
    private val openMessagesRequest = mutableStateOf(false)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        openMessagesRequest.value = intent?.action == ACTION_OPEN_MESSAGES
        setContent {
            TotiChatTheme {
                TotiChatApp(openMessagesRequested = openMessagesRequest.value, onMessagesOpened = { openMessagesRequest.value = false })
            }
        }
    }
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        if (intent.action == ACTION_OPEN_MESSAGES) openMessagesRequest.value = true
    }

    companion object {
        const val ACTION_OPEN_MESSAGES = "com.totichat.app.OPEN_MESSAGES"
    }
}
