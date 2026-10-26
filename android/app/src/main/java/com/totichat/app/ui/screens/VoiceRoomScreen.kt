package com.totichat.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.totichat.app.data.model.ChatMessage
import com.totichat.app.data.repository.TotiRepository
import com.totichat.app.ui.components.MicSeatView
import com.totichat.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VoiceRoomScreen(
    roomId: String,
    onLeaveRoom: () -> Unit
) {
    val room = remember(roomId) { TotiRepository.getRoom(roomId) }
    val currentUser by TotiRepository.currentUser.collectAsState()

    var isMicMuted by remember { mutableStateOf(false) }
    var showGiftSheet by remember { mutableStateOf(false) }
    var messageText by remember { mutableStateOf("") }

    val messages = remember {
        mutableStateListOf(
            ChatMessage(
                id = "m-1",
                senderId = "sys",
                senderName = "النظام",
                text = "مرحباً بكم في غرفة توتي شات الملكية! يرجى الالتزام بالاحترام المتبادل 🌹",
                timestamp = "18:00",
                isSystem = true
            ),
            ChatMessage(
                id = "m-2",
                senderId = "u-1",
                senderName = "أبو فهد العراقي",
                text = "نورتوا الغرفة حياكم الله جميعاً 👑",
                timestamp = "18:02",
                vipLevel = 2
            )
        )
    }

    if (room == null) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(BackgroundDark),
            contentAlignment = Alignment.Center
        ) {
            Text("الغرفة غير موجودة", color = TextWhite)
        }
        return
    }

    Scaffold(
        containerColor = BackgroundDark,
        topBar = {
            // Room Top Bar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            listOf(SurfaceHighlight, SurfaceDark)
                        )
                    )
                    .statusBarsPadding()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        AsyncImage(
                            model = room.hostAvatar,
                            contentDescription = room.hostName,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                        )
                        Column {
                            Text(
                                text = room.title,
                                color = TextWhite,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1
                            )
                            Text(
                                text = "معرف: ${room.id} • ${room.userCount} متواجد",
                                color = TextGray,
                                fontSize = 11.sp
                            )
                        }
                    }

                    IconButton(
                        onClick = { onLeaveRoom() },
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.1f))
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Leave Room",
                            tint = TextWhite,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        },
        bottomBar = {
            // Bottom Voice & Chat controls
            Surface(
                color = SurfaceDark,
                tonalElevation = 8.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Mic Mute / Unmute Button
                    IconButton(
                        onClick = { isMicMuted = !isMicMuted },
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(if (isMicMuted) Color(0xFFEF4444) else EmeraldPrimary)
                    ) {
                        Icon(
                            imageVector = if (isMicMuted) Icons.Default.MicOff else Icons.Default.Mic,
                            contentDescription = "Toggle Mic",
                            tint = TextWhite
                        )
                    }

                    // Message input field
                    OutlinedTextField(
                        value = messageText,
                        onValueChange = { messageText = it },
                        placeholder = { Text("دردش مع الجميع...", fontSize = 12.sp, color = TextGray) },
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp),
                        shape = RoundedCornerShape(24.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = CardDark,
                            unfocusedContainerColor = CardDark,
                            focusedBorderColor = EmeraldPrimary,
                            unfocusedBorderColor = Color.Transparent,
                            focusedTextColor = TextWhite,
                            unfocusedTextColor = TextWhite
                        ),
                        singleLine = true,
                        trailingIcon = {
                            if (messageText.isNotBlank()) {
                                IconButton(onClick = {
                                    messages.add(
                                        ChatMessage(
                                            id = "msg-${System.currentTimeMillis()}",
                                            senderId = currentUser.id,
                                            senderName = currentUser.nickname.ifBlank { currentUser.name },
                                            senderAvatar = currentUser.avatar,
                                            text = messageText,
                                            timestamp = "الآن",
                                            vipLevel = currentUser.vipLevel
                                        )
                                    )
                                    messageText = ""
                                }) {
                                    Icon(Icons.Default.Send, contentDescription = "Send", tint = EmeraldPrimary)
                                }
                            }
                        }
                    )

                    // Gift Button
                    IconButton(
                        onClick = { showGiftSheet = true },
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(
                                Brush.radialGradient(
                                    listOf(GoldLight, GoldPrimary)
                                )
                            )
                    ) {
                        Text("🎁", fontSize = 20.sp)
                    }
                }
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            // 8-Seat Voice Grid
            LazyVerticalGrid(
                columns = GridCells.Fixed(4),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                items(room.seats) { seat ->
                    MicSeatView(
                        seat = seat,
                        onSeatClick = {
                            // Take seat action
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Chat Message Stream
            Text(
                text = "الدردشة المباشرة",
                color = TextGray,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 6.dp)
            )

            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(6.dp),
                reverseLayout = true
            ) {
                items(messages.reversed()) { msg ->
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.White.copy(alpha = 0.05f))
                            .padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        if (msg.vipLevel > 0) {
                            Text(
                                text = "VIP${msg.vipLevel}",
                                color = GoldPrimary,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Black
                            )
                        }
                        Text(
                            text = "${msg.senderName}:",
                            color = if (msg.isSystem) EmeraldPrimary else GoldLight,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = msg.text,
                            color = TextWhite,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }

        // Gift Bottom Sheet
        if (showGiftSheet) {
            ModalBottomSheet(
                onDismissRequest = { showGiftSheet = false },
                containerColor = SurfaceDark
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "متجر الهدايا الفاخرة 🎁",
                            color = TextWhite,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text("🪙", fontSize = 14.sp)
                            Text(
                                text = "${currentUser.coins}",
                                color = GoldPrimary,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    LazyVerticalGrid(
                        columns = GridCells.Fixed(4),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(260.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(TotiRepository.gifts) { gift ->
                            Card(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .clickable {
                                        if (TotiRepository.sendGift(gift)) {
                                            messages.add(
                                                ChatMessage(
                                                    id = "gift-${System.currentTimeMillis()}",
                                                    senderId = currentUser.id,
                                                    senderName = currentUser.nickname.ifBlank { currentUser.name },
                                                    text = "أرسل ${gift.name} ${gift.iconEmoji} بقيمة ${gift.price} عملة! 👑",
                                                    timestamp = "الآن",
                                                    vipLevel = currentUser.vipLevel
                                                )
                                            )
                                            showGiftSheet = false
                                        }
                                    },
                                colors = CardDefaults.cardColors(containerColor = CardDark)
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(8.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text(gift.iconEmoji, fontSize = 28.sp)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = gift.name,
                                        color = TextWhite,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        maxLines = 1
                                    )
                                    Text(
                                        text = "${gift.price} 🪙",
                                        color = GoldPrimary,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
