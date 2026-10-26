package com.totichat.app.data.model

data class UserProfile(
    val id: String = "2358824361",
    val name: String = "الماركه الردادي",
    val nickname: String = "الملك الردادي 👑",
    val avatar: String = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    val cover: String = "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80",
    val country: String = "العراق",
    val countryFlag: String = "🇮🇶",
    val vipLevel: Int = 1,
    val wealthLevel: Int = 200,
    val wealthExp: Long = 358000000L,
    val charmLevel: Int = 150,
    val charmExp: Long = 157000000L,
    val coins: Long = 100000,
    val diamonds: Long = 50000,
    val bio: String = "حين تسقط لا تسأل من دفعك بل من ابتسم وهو يراك تهوي 🕊️",
    val followingCount: Int = 0,
    val followersCount: Int = 0,
    val visitorsCount: Int = 0,
    val friendsCount: Int = 0,
    val agencyName: String = "وكالة توتي شات الملكية"
)

data class VoiceRoom(
    val id: String,
    val title: String,
    val tag: String,
    val hostName: String,
    val hostAvatar: String,
    val countryFlag: String,
    val userCount: Int,
    val coverUrl: String,
    val isLive: Boolean = true,
    val seats: List<MicSeat> = emptyList()
)

data class MicSeat(
    val seatNumber: Int,
    val user: UserProfile? = null,
    val isLocked: Boolean = false,
    val isMuted: Boolean = false,
    val isSpeaking: Boolean = false
)

data class GiftItem(
    val id: String,
    val name: String,
    val price: Long,
    val iconEmoji: String,
    val category: String = "luxury"
)

data class ChatMessage(
    val id: String,
    val senderId: String,
    val senderName: String,
    val senderAvatar: String = "",
    val text: String,
    val timestamp: String,
    val vipLevel: Int = 0,
    val isSystem: Boolean = false
)

data class DirectConversation(
    val id: String,
    val peerName: String,
    val peerAvatar: String,
    val lastMessage: String,
    val timestamp: String,
    val unreadCount: Int = 0
)
