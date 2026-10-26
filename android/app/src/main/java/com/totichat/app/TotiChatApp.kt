package com.totichat.app

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.totichat.app.ui.components.BottomNavBar
import com.totichat.app.ui.navigation.Screen
import com.totichat.app.ui.screens.HomeScreen
import com.totichat.app.ui.screens.MessagesScreen
import com.totichat.app.ui.screens.ProfileScreen
import com.totichat.app.ui.screens.VoiceRoomScreen
import com.totichat.app.ui.theme.BackgroundDark

@Composable
fun TotiChatApp() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val showBottomNav = currentRoute in listOf(
        Screen.Home.route,
        Screen.Messages.route,
        Screen.Profile.route
    )

    Scaffold(
        containerColor = BackgroundDark,
        bottomBar = {
            if (showBottomNav && currentRoute != null) {
                BottomNavBar(
                    currentRoute = currentRoute,
                    onNavigate = { route ->
                        if (route != currentRoute) {
                            navController.navigate(route) {
                                popUpTo(Screen.Home.route) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    }
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(BackgroundDark)
                .padding(innerPadding)
        ) {
            NavHost(
                navController = navController,
                startDestination = Screen.Home.route
            ) {
                composable(Screen.Home.route) {
                    HomeScreen(
                        onRoomClick = { roomId ->
                            navController.navigate(Screen.VoiceRoom.createRoute(roomId))
                        }
                    )
                }

                composable(Screen.Messages.route) {
                    MessagesScreen()
                }

                composable(Screen.Profile.route) {
                    ProfileScreen()
                }

                composable(
                    route = Screen.VoiceRoom.route,
                    arguments = listOf(navArgument("roomId") { type = NavType.StringType })
                ) { backStackEntry ->
                    val roomId = backStackEntry.arguments?.getString("roomId") ?: "room-1"
                    VoiceRoomScreen(
                        roomId = roomId,
                        onLeaveRoom = {
                            navController.popBackStack()
                        }
                    )
                }
            }
        }
    }
}
