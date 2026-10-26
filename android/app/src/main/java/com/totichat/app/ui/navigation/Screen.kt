package com.totichat.app.ui.navigation

sealed class Screen(val route: String) {
    object Home : Screen("home")
    object Messages : Screen("messages")
    object Profile : Screen("profile")
    object VoiceRoom : Screen("voice_room/{roomId}") {
        fun createRoute(roomId: String) = "voice_room/$roomId"
    }
}
