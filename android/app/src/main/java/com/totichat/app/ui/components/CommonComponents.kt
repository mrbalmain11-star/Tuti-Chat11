package com.totichat.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.totichat.app.data.model.MicSeat
import com.totichat.app.data.model.VoiceRoom
import com.totichat.app.ui.theme.*

@Composable
fun TopHeader(
    selectedTab: String,
    onTabSelected: (String) -> Unit,
    onSearchClick: () -> Unit,
    onCreateRoomClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                Brush.verticalGradient(
                    colors = listOf(EmeraldHeader, EmeraldDark)
                )
            )
            .statusBarsPadding()
            .padding(horizontal = 16.dp, vertical = 12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Tabs: حفلة | تم المتابعة
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.clickable { onTabSelected("party") }
                ) {
                    Text(
                        text = "حفلة",
                        color = if (selectedTab == "party") TextWhite else TextWhite.copy(alpha = 0.7f),
                        fontSize = 20.sp,
                        fontWeight = if (selectedTab == "party") FontWeight.Black else FontWeight.Bold
                    )
                    if (selectedTab == "party") {
                        Box(
                            modifier = Modifier
                                .padding(top = 4.dp)
                                .width(20.dp)
                                .height(3.dp)
                                .clip(CircleShape)
                                .background(TextWhite)
                        )
                    }
                }

                Text(
                    text = "تم المتابعة",
                    color = if (selectedTab == "followed") TextWhite else TextWhite.copy(alpha = 0.7f),
                    fontSize = 16.sp,
                    fontWeight = if (selectedTab == "followed") FontWeight.Black else FontWeight.Bold,
                    modifier = Modifier.clickable { onTabSelected("followed") }
                )
            }

            // Actions: Create Room + Search
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Create room button
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(Color.White.copy(alpha = 0.15f))
                        .clickable { onCreateRoomClick() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = "Create Room",
                        tint = GoldPrimary,
                        modifier = Modifier.size(22.dp)
                    )
                }

                // Search button
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.15f))
                        .clickable { onSearchClick() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "Search",
                        tint = GoldPrimary,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun RoomCard(
    room: VoiceRoom,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = CardDark),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(130.dp)
            ) {
                AsyncImage(
                    model = room.coverUrl,
                    contentDescription = room.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )

                // Live & User count badge
                Row(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(8.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color.Black.copy(alpha = 0.6f))
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(EmeraldPrimary)
                    )
                    Text(
                        text = "${room.userCount}",
                        color = TextWhite,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                // Flag
                Text(
                    text = room.countryFlag,
                    fontSize = 18.sp,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(8.dp)
                )
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp)
            ) {
                Text(
                    text = room.title,
                    color = TextWhite,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = room.hostName,
                        color = TextGray,
                        fontSize = 12.sp,
                        maxLines = 1
                    )
                    Text(
                        text = "#${room.tag}",
                        color = EmeraldPrimary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }
    }
}

@Composable
fun LevelBadge(
    type: String, // "wealth" or "charm"
    level: Int
) {
    val gradient = when {
        level >= 240 -> listOf(Color(0xFFFF007A), Color(0xFF7928CA), Color(0xFF00DFD8))
        level >= 220 -> listOf(Color(0xFF1E1B4B), Color(0xFF0F172A), Color(0xFF312E81))
        level >= 200 -> listOf(Color(0xFFFFD700), Color(0xFFF59E0B), Color(0xFFDC2626))
        level >= 180 -> listOf(Color(0xFFFDE047), Color(0xFFEAB308), Color(0xFFCA8A04))
        level >= 160 -> listOf(Color(0xFFEF4444), Color(0xFFDC2626), Color(0xFF991B1B))
        level >= 140 -> listOf(Color(0xFF818CF8), Color(0xFF6366F1), Color(0xFF4338CA))
        level >= 120 -> listOf(Color(0xFFF43F5E), Color(0xFFE11D48), Color(0xFF9F1239))
        level >= 100 -> listOf(Color(0xFFF59E0B), Color(0xFFD97706), Color(0xFFB45309))
        level >= 80  -> listOf(Color(0xFFFB923C), Color(0xFFF97316), Color(0xFFEAB308))
        level >= 60  -> listOf(Color(0xFFC084FC), Color(0xFFA855F7), Color(0xFF7C3AED))
        level >= 40  -> listOf(Color(0xFF60A5FA), Color(0xFF3B82F6), Color(0xFF1D4ED8))
        level >= 20  -> listOf(Color(0xFF4ADE80), Color(0xFF22C55E), Color(0xFF15803D))
        else         -> listOf(Color(0xFF22D3EE), Color(0xFF06B6D4), Color(0xFF0D9488))
    }

    val iconText = if (type == "wealth") {
        if (level >= 180) "👑" else "🏆"
    } else {
        if (level >= 120) "💎" else "✨"
    }

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(Brush.horizontalGradient(gradient))
            .border(
                1.dp,
                if (level >= 180) Color(0xFFFEF08A) else Color.White.copy(alpha = 0.4f),
                RoundedCornerShape(12.dp)
            )
            .padding(horizontal = 8.dp, vertical = 2.5.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(text = iconText, fontSize = 11.sp)
            Text(
                text = "$level",
                color = TextWhite,
                fontSize = 11.sp,
                fontWeight = FontWeight.Black
            )
        }
    }
}

@Composable
fun MicSeatView(
    seat: MicSeat,
    onSeatClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.clickable { onSeatClick() }
    ) {
        Box(
            modifier = Modifier
                .size(54.dp)
                .clip(CircleShape)
                .background(SurfaceDark)
                .then(
                    if (seat.isSpeaking) {
                        Modifier.border(2.dp, EmeraldPrimary, CircleShape)
                    } else {
                        Modifier.border(1.dp, Color.White.copy(alpha = 0.1f), CircleShape)
                    }
                ),
            contentAlignment = Alignment.Center
        ) {
            if (seat.user != null) {
                AsyncImage(
                    model = seat.user.avatar,
                    contentDescription = seat.user.name,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            } else if (seat.isLocked) {
                Icon(
                    imageVector = Icons.Default.Lock,
                    contentDescription = "Locked",
                    tint = TextMuted,
                    modifier = Modifier.size(20.dp)
                )
            } else {
                Icon(
                    imageVector = Icons.Default.Mic,
                    contentDescription = "Empty Seat",
                    tint = Color.White.copy(alpha = 0.4f),
                    modifier = Modifier.size(22.dp)
                )
            }

            // Seat Number Tag
            Box(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .size(16.dp)
                    .clip(CircleShape)
                    .background(Color.Black.copy(alpha = 0.7f)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "${seat.seatNumber}",
                    color = TextWhite,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = seat.user?.nickname ?: "مقعد ${seat.seatNumber}",
            color = if (seat.user != null) TextWhite else TextGray,
            fontSize = 11.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
fun BottomNavBar(
    currentRoute: String,
    onNavigate: (String) -> Unit
) {
    NavigationBar(
        containerColor = SurfaceDark,
        tonalElevation = 8.dp
    ) {
        NavigationBarItem(
            selected = currentRoute == "home",
            onClick = { onNavigate("home") },
            icon = {
                Icon(
                    imageVector = Icons.Default.Home,
                    contentDescription = "حفلة"
                )
            },
            label = { Text("حفلة", fontWeight = FontWeight.Bold) },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = EmeraldPrimary,
                selectedTextColor = EmeraldPrimary,
                unselectedIconColor = TextGray,
                unselectedTextColor = TextGray,
                indicatorColor = SurfaceHighlight
            )
        )

        NavigationBarItem(
            selected = currentRoute == "messages",
            onClick = { onNavigate("messages") },
            icon = {
                Icon(
                    imageVector = Icons.Default.Mail,
                    contentDescription = "الرسائل"
                )
            },
            label = { Text("الرسائل", fontWeight = FontWeight.Bold) },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = EmeraldPrimary,
                selectedTextColor = EmeraldPrimary,
                unselectedIconColor = TextGray,
                unselectedTextColor = TextGray,
                indicatorColor = SurfaceHighlight
            )
        )

        NavigationBarItem(
            selected = currentRoute == "profile",
            onClick = { onNavigate("profile") },
            icon = {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = "أنا"
                )
            },
            label = { Text("أنا", fontWeight = FontWeight.Bold) },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = EmeraldPrimary,
                selectedTextColor = EmeraldPrimary,
                unselectedIconColor = TextGray,
                unselectedTextColor = TextGray,
                indicatorColor = SurfaceHighlight
            )
        )
    }
}
