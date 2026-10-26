package com.totichat.app.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.totichat.app.data.repository.TotiRepository
import com.totichat.app.ui.components.LevelBadge
import com.totichat.app.ui.theme.*

@Composable
fun ProfileScreen() {
    val context = LocalContext.current
    val currentUser by TotiRepository.currentUser.collectAsState()

    var showEditNameDialog by remember { mutableStateOf(false) }
    var tempName by remember { mutableStateOf(currentUser.name) }

    var showEditBioDialog by remember { mutableStateOf(false) }
    var tempBio by remember { mutableStateOf(currentUser.bio) }

    var showRechargeDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark)
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Top Profile Actions
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "الملف الشخصي",
                color = TextWhite,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
            Icon(
                imageVector = Icons.Default.Settings,
                contentDescription = "Settings",
                tint = TextWhite,
                modifier = Modifier.size(24.dp)
            )
        }

        // Cover Banner
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(120.dp)
        ) {
            AsyncImage(
                model = currentUser.cover,
                contentDescription = "Cover",
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxSize()
                    .clip(RoundedCornerShape(bottomStart = 20.dp, bottomEnd = 20.dp))
            )
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            listOf(Color.Transparent, Color(0xFF070216).copy(alpha = 0.85f))
                        )
                    )
            )
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Avatar + Crown
        Box(contentAlignment = Alignment.TopCenter) {
            AsyncImage(
                model = currentUser.avatar,
                contentDescription = currentUser.name,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .size(90.dp)
                    .clip(CircleShape)
                    .border(3.dp, GoldPrimary, CircleShape)
            )
            Text(
                text = "👑",
                fontSize = 22.sp,
                modifier = Modifier.offset(y = (-14).dp)
            )
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Name & Edit Icon
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = currentUser.name,
                color = TextWhite,
                fontSize = 18.sp,
                fontWeight = FontWeight.Black
            )
            Icon(
                imageVector = Icons.Default.Edit,
                contentDescription = "Edit Name",
                tint = GoldPrimary,
                modifier = Modifier
                    .size(16.dp)
                    .clickable {
                        tempName = currentUser.name
                        showEditNameDialog = true
                    }
            )
            Text(currentUser.countryFlag, fontSize = 16.sp)
        }

        // ID + Copy
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            modifier = Modifier
                .padding(top = 4.dp)
                .clickable {
                    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                    clipboard.setPrimaryClip(ClipData.newPlainText("ID", currentUser.id))
                    Toast.makeText(context, "تم نسخ المعرّف: ${currentUser.id}", Toast.LENGTH_SHORT).show()
                }
        ) {
            Text(
                text = "ID: ${currentUser.id}",
                color = TextGray,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium
            )
            Icon(
                imageVector = Icons.Default.ContentCopy,
                contentDescription = "Copy ID",
                tint = GoldPrimary,
                modifier = Modifier.size(14.dp)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Follow stats (0 followers, 0 following, 0 visitors, 0 friends)
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(16.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                StatColumn(count = "${currentUser.followingCount}", label = "متابعة")
                StatColumn(count = "${currentUser.followersCount}", label = "المعجبون")
                StatColumn(count = "${currentUser.visitorsCount}", label = "الزوار")
                StatColumn(count = "${currentUser.friendsCount}", label = "الأصدقاء")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Level Badges & Experience Bars (Wealth & Charm)
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = CardDark),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text(
                    text = "المستويات والأوسمة الملكية",
                    color = TextWhite,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )

                // Wealth Level (مستوى الثروة)
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            LevelBadge(type = "wealth", level = currentUser.wealthLevel)
                            Text("مستوى الثروة", color = TextWhite, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                        Text("${currentUser.wealthExp} EXP", color = GoldPrimary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                    LinearProgressIndicator(
                        progress = { 0.65f },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp)
                            .clip(CircleShape),
                        color = GoldPrimary,
                        trackColor = Color.White.copy(alpha = 0.1f)
                    )
                }

                // Charm Level (مستوى الخبرة والسحر)
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            LevelBadge(type = "charm", level = currentUser.charmLevel)
                            Text("مستوى الخبرة / السحر", color = TextWhite, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                        Text("${currentUser.charmExp} EXP", color = RoseCharm, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                    LinearProgressIndicator(
                        progress = { 0.40f },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp)
                            .clip(CircleShape),
                        color = RoseCharm,
                        trackColor = Color.White.copy(alpha = 0.1f)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Wallet & Coins Box
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(16.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(Brush.radialGradient(listOf(GoldLight, GoldDark))),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("🪙", fontSize = 22.sp)
                    }
                    Column {
                        Text("العملات الملكية", color = TextGray, fontSize = 11.sp)
                        Text("${currentUser.coins}", color = TextWhite, fontSize = 16.sp, fontWeight = FontWeight.Black)
                    }
                }

                Button(
                    onClick = { showRechargeDialog = true },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("شحن", color = TextWhite, fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Bio Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("السيرة الذاتية (Bio)", color = TextGray, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Icon(
                        imageVector = Icons.Default.Edit,
                        contentDescription = "Edit Bio",
                        tint = EmeraldPrimary,
                        modifier = Modifier
                            .size(16.dp)
                            .clickable {
                                tempBio = currentUser.bio
                                showEditBioDialog = true
                            }
                    )
                }
                Text(
                    text = currentUser.bio,
                    color = TextWhite,
                    fontSize = 13.sp,
                    lineHeight = 18.sp
                )
            }
        }
    }

    // Edit Name Dialog
    if (showEditNameDialog) {
        AlertDialog(
            onDismissRequest = { showEditNameDialog = false },
            title = { Text("تعديل الاسم", color = TextWhite) },
            text = {
                OutlinedTextField(
                    value = tempName,
                    onValueChange = { tempName = it },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = TextWhite,
                        unfocusedTextColor = TextWhite,
                        focusedBorderColor = EmeraldPrimary
                    )
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (tempName.isNotBlank()) {
                            TotiRepository.updateName(tempName.trim())
                            showEditNameDialog = false
                            Toast.makeText(context, "تم حفظ الاسم بنجاح! ✏️", Toast.LENGTH_SHORT).show()
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                ) {
                    Text("حفظ")
                }
            },
            dismissButton = {
                TextButton(onClick = { showEditNameDialog = false }) {
                    Text("إلغاء", color = TextGray)
                }
            },
            containerColor = SurfaceDark
        )
    }

    // Edit Bio Dialog
    if (showEditBioDialog) {
        AlertDialog(
            onDismissRequest = { showEditBioDialog = false },
            title = { Text("تعديل السيرة الذاتية", color = TextWhite) },
            text = {
                OutlinedTextField(
                    value = tempBio,
                    onValueChange = { tempBio = it },
                    maxLines = 3,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = TextWhite,
                        unfocusedTextColor = TextWhite,
                        focusedBorderColor = EmeraldPrimary
                    )
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        TotiRepository.updateBio(tempBio.trim())
                        showEditBioDialog = false
                        Toast.makeText(context, "تم حفظ السيرة الذاتية! 📝", Toast.LENGTH_SHORT).show()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                ) {
                    Text("حفظ")
                }
            },
            dismissButton = {
                TextButton(onClick = { showEditBioDialog = false }) {
                    Text("إلغاء", color = TextGray)
                }
            },
            containerColor = SurfaceDark
        )
    }

    // Recharge Coins Dialog
    if (showRechargeDialog) {
        AlertDialog(
            onDismissRequest = { showRechargeDialog = false },
            title = { Text("شحن العملات الملكية 🪙", color = TextWhite) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("اختر باقة الشحن لرفع مستوى الثروة فوراً:", color = TextGray, fontSize = 12.sp)
                    listOf(10000L, 50000L, 100000L, 500000L).forEach { amount ->
                        Button(
                            onClick = {
                                TotiRepository.rechargeCoins(amount)
                                showRechargeDialog = false
                                Toast.makeText(context, "تم شحن $amount عملة بنجاح! 👑", Toast.LENGTH_SHORT).show()
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = CardDark),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("$amount عملة ملكية", color = GoldPrimary, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showRechargeDialog = false }) {
                    Text("إغلاق", color = TextGray)
                }
            },
            containerColor = SurfaceDark
        )
    }
}

@Composable
fun StatColumn(count: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = count, color = TextWhite, fontSize = 16.sp, fontWeight = FontWeight.Bold)
        Text(text = label, color = TextGray, fontSize = 11.sp)
    }
}
