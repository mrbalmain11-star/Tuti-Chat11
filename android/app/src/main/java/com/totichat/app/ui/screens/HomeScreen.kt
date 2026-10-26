package com.totichat.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.totichat.app.data.repository.TotiRepository
import com.totichat.app.ui.components.RoomCard
import com.totichat.app.ui.components.TopHeader
import com.totichat.app.ui.theme.*

@Composable
fun HomeScreen(
    onRoomClick: (String) -> Unit
) {
    var selectedHeaderTab by remember { mutableStateOf("party") }
    var selectedCategory by remember { mutableStateOf("شائع 🔥") }
    val categories = listOf("شائع 🔥", "العراق 🇮🇶", "الخليج 🇸🇦", "مصر 🇪🇬", "فعاليات 🎉", "ملوكي 👑")

    val rooms by TotiRepository.rooms.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark)
    ) {
        // Top Festive Header
        TopHeader(
            selectedTab = selectedHeaderTab,
            onTabSelected = { selectedHeaderTab = it },
            onSearchClick = {},
            onCreateRoomClick = {}
        )

        // Categories LazyRow
        LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(categories) { category ->
                val isSelected = selectedCategory == category
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(if (isSelected) EmeraldPrimary else SurfaceDark)
                        .clickable { selectedCategory = category }
                        .padding(horizontal = 14.dp, vertical = 8.dp)
                ) {
                    Text(
                        text = category,
                        color = if (isSelected) TextWhite else TextGray,
                        fontSize = 12.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                    )
                }
            }
        }

        // Rooms Grid
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(rooms) { room ->
                RoomCard(
                    room = room,
                    onClick = { onRoomClick(room.id) }
                )
            }
        }
    }
}
