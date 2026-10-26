package com.totichat.app.data.repository

import com.totichat.app.data.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

object TotiRepository {

    private val _currentUser = MutableStateFlow(UserProfile())
    val currentUser: StateFlow<UserProfile> = _currentUser.asStateFlow()

    private val _rooms = MutableStateFlow(
        listOf(
            VoiceRoom(
                id = "room-1",
                title = "ملوك العراق وسوالف أهلنا 🇮🇶👑",
                tag = "سهرات وشعر",
                hostName = "أبو فهد العراقي",
                hostAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
                countryFlag = "🇮🇶",
                userCount = 1420,
                coverUrl = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop&q=80",
                seats = List(8) { index ->
                    MicSeat(
                        seatNumber = index + 1,
                        user = if (index == 0) UserProfile(name = "سيف علي", nickname = "المهندس سيف", avatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100") else null,
                        isSpeaking = index == 0
                    )
                }
            ),
            VoiceRoom(
                id = "room-2",
                title = "حياكم الله في ديوانية الخليج 🇸🇦✨",
                tag = "مسابقات وضحك",
                hostName = "الشمري الرياض",
                hostAvatar = "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80",
                countryFlag = "🇸🇦",
                userCount = 890,
                coverUrl = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80",
                seats = List(8) { index -> MicSeat(seatNumber = index + 1) }
            ),
            VoiceRoom(
                id = "room-3",
                title = "صوتك كنز - تحدي الغناء والمواهب 🎙️🎶",
                tag = "طرب وأغاني",
                hostName = "أميرة النغم",
                hostAvatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
                countryFlag = "🇪🇬",
                userCount = 2300,
                coverUrl = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80",
                seats = List(8) { index -> MicSeat(seatNumber = index + 1) }
            ),
            VoiceRoom(
                id = "room-4",
                title = "جلسة رواق وهدوء منتصف الليل 🌙",
                tag = "خواطر ودردشة",
                hostName = "عاشق الليل",
                hostAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
                countryFlag = "🇦🇪",
                userCount = 650,
                coverUrl = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
                seats = List(8) { index -> MicSeat(seatNumber = index + 1) }
            )
        )
    )
    val rooms: StateFlow<List<VoiceRoom>> = _rooms.asStateFlow()

    private val _conversations = MutableStateFlow(
        listOf(
            DirectConversation(
                id = "conv-1",
                peerName = "فريق توتي شات الرسمي 🛡️",
                peerAvatar = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100",
                lastMessage = "أهلاً بك في توتي شات الملكي! نتمنى لك أوقاتاً ممتعة.",
                timestamp = "18:45",
                unreadCount = 1
            ),
            DirectConversation(
                id = "conv-2",
                peerName = "الشيخ فهد",
                peerAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
                lastMessage = "حياك الله أخوي الغالي، ننتظرك اليوم بالروم.",
                timestamp = "أمس",
                unreadCount = 0
            )
        )
    )
    val conversations: StateFlow<List<DirectConversation>> = _conversations.asStateFlow()

    val gifts = listOf(
        GiftItem("gift-1", "وردة حمراء", 10, "🌹"),
        GiftItem("gift-2", "قلب ألماس", 100, "💎"),
        GiftItem("gift-3", "عطر فاخر", 500, "🧴"),
        GiftItem("gift-4", "صقر ملكي", 1000, "🦅"),
        GiftItem("gift-5", "تاج الذهب", 5000, "👑"),
        GiftItem("gift-6", "سيارة رولز رويس", 20000, "🏎️"),
        GiftItem("gift-7", "قصر إمبراطوري", 50000, "🏰"),
        GiftItem("gift-8", "يخت فخم", 100000, "🛥️")
    )

    fun updateName(newName: String) {
        _currentUser.update { it.copy(name = newName, nickname = newName) }
    }

    fun updateBio(newBio: String) {
        _currentUser.update { it.copy(bio = newBio) }
    }

    fun updateAvatar(newAvatarUrl: String) {
        _currentUser.update { it.copy(avatar = newAvatarUrl) }
    }

    fun rechargeCoins(amount: Long) {
        _currentUser.update {
            val updatedCoins = it.coins + amount
            val updatedExp = it.wealthExp + amount
            val newWealthLevel = (updatedExp / 10000).toInt()
            it.copy(
                coins = updatedCoins,
                wealthExp = updatedExp,
                wealthLevel = newWealthLevel
            )
        }
    }

    fun sendGift(gift: GiftItem): Boolean {
        val user = _currentUser.value
        if (user.coins < gift.price) return false

        _currentUser.update {
            val newCoins = it.coins - gift.price
            val newCharmExp = it.charmExp + gift.price
            val newCharmLevel = (newCharmExp / 5000).toInt()
            it.copy(
                coins = newCoins,
                charmExp = newCharmExp,
                charmLevel = newCharmLevel
            )
        }
        return true
    }

    fun getRoom(roomId: String): VoiceRoom? {
        return _rooms.value.find { it.id == roomId }
    }
}
