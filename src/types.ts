export interface UserProfile {
  id: string;
  name: string;
  nickname: string;
  avatar: string;
  cover?: string;
  country: string;
  countryCode: string;
  countryFlag: string;
  vipLevel: number;
  vipExpiry: string;
  wealthLevel: number;
  wealthExp?: number;
  charmLevel: number;
  charmExp?: number;
  gameLevel?: number;
  gameExp?: number;
  coins: number;
  diamonds: number;
  hearts: number;
  friendsCount: number;
  followersCount: number;
  followingCount?: number;
  fansCount: number;
  visitorsCount: number;
  gender: 'ذكر' | 'أنثى';
  birthdate: string;
  bio: string;
  album: string[];
  agencyName?: string;
  agencyRole?: string;
  isHost?: boolean;
  isSuperAdmin?: boolean;
  isSpecialId?: boolean;
  specialIdBadge?: string;
  hasWelcomeBanner?: boolean;
  welcomeBannerText?: string;
  isRechargeAgent?: boolean;
  rechargeCoins?: number;
  permissions?: string[];
  isBanned?: boolean;
  banDuration?: '24h' | '48h' | 'permanent' | null;
  banExpiry?: string;
  banReason?: string;
  isNameBanned?: boolean;
  isAvatarBanned?: boolean;
}

export interface MicSeat {
  seatNumber: number;
  user: UserProfile | null;
  isLocked: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
}

export interface VoiceRoom {
  id: string;
  title: string;
  hostName: string;
  hostAvatar: string;
  hostId: string;
  coverImage: string;
  rank: number;
  country: string;
  countryFlag: string;
  listenersCount: number;
  activeMicCount: number;
  tag: string;
  agencyName: string;
  agencyId?: string;
  frameType: 'gold' | 'blue' | 'purple';
  memberAvatars: string[];
  moderatorIds?: string[];
  announcement: string;
  seats: MicSeat[];
  backgroundUrl: string;
  micTheme?: string;
  roomFrameTheme?: string;
  titleColorTheme?: string;
  micsLocked?: boolean;
  roomPoints?: string;
  dailyContribution?: number;
  weeklyContribution?: number;
  monthlyContribution?: number;
  createdAt?: string;
  updatedAt?: string;
  status?: 'active' | 'closed';
}

export interface GiftItem {
  id: string;
  name: string;
  price: number;
  icon: string;
  category: 'هدية' | 'الأمة' | 'CP' | 'مخصص' | 'حظ' | 'الكل';
  animationType: 'lion' | 'mosque' | 'sword' | 'samurai' | 'crown' | 'car' | 'diamond' | 'rose';
  rarity: 'legendary' | 'epic' | 'rare' | 'common';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
  isGiftNotice?: boolean;
  vipLevel?: number;
  giftInfo?: {
    giftName: string;
    giftIcon: string;
    count: number;
    receiverName: string;
  };
}

export interface DirectConversation {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  isOnline: boolean;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  isSystem?: boolean;
  isOfficial?: boolean;
  messages: {
    id: string;
    text: string;
    sender: 'me' | 'them';
    timestamp: string;
  }[];
}

export interface Agency {
  id: string;
  agencyId?: string;
  name: string;
  logo: string;
  rank: number;
  leaderName: string;
  leaderAvatar: string;
  country: string;
  countryFlag: string;
  memberCount: number;
  totalIncome: string;
  monthlyScore: string;
  description: string;
  members: {
    id: string;
    name: string;
    avatar: string;
    role: 'مدير الوكالة' | 'مشرف' | 'عضو مميز' | 'عضو';
    score: string;
    vipLevel: number;
  }[];
}

export interface Transaction {
  id: string;
  type: 'charge' | 'gift_send' | 'gift_receive' | 'reward';
  title: string;
  amount: number;
  timestamp: string;
  status: 'نجاح' | 'قيد المعالجة';
}

export interface WealthSupporter {
  rank: number;
  user: UserProfile;
  supportAmount: number;
}
