import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  VoiceRoom,
  GiftItem,
  DirectConversation,
  Agency,
  Transaction,
  MicSeat,
  ChatMessage,
} from '../types';
import {
  initialCurrentUser,
  mockRooms,
  mockGifts,
  mockConversations,
  mockAgencies,
  initialTransactions,
} from '../mockData';
import { sounds } from '../utils/audio';
import { stagingBackend, fetchRealRooms, fetchMyProfile, fetchMyWallet, fetchRoomMembers } from '../services/stagingBackend';
import { mapRoomToUi } from '../services/mapRoomToUi';
import { saveProfileChanges } from '../services/profileWrites';
import { fetchMyLedger } from '../services/ledgerReads';
import { Language, Translations, translations } from '../i18n/translations';
import { StorageItem, BagItem, initialBagItems } from '../data/storageItems';
import { getLevelFromExp, calculateCumulativeExpForLevel } from '../utils/levelUtils';

interface GiftAnimationPayload {
  gift: GiftItem;
  sender: string;
  receiver: string;
  count: number;
}

interface AppContextType {
  currentUser: UserProfile;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  activeTab: 'home' | 'messages' | 'profile';
  setActiveTab: (tab: 'home' | 'messages' | 'profile') => void;
  homeSubTab: 'party' | 'royal' | 'discover';
  setHomeSubTab: (subTab: 'party' | 'royal' | 'discover') => void;
  rooms: VoiceRoom[];
  activeRoom: VoiceRoom | null;
  enterRoom: (roomId: string) => void;
  leaveRoom: () => void;
  isRoomMinimized: boolean;
  setIsRoomMinimized: (min: boolean) => void;
  takeSeat: (seatNumber: number) => void;
  leaveSeat: (seatNumber: number) => void;
  toggleLockSeat: (seatNumber: number) => void;
  toggleMuteSeat: (seatNumber: number) => void;
  myMicMuted: boolean;
  toggleMyMic: () => void;
  roomMessages: Record<string, ChatMessage[]>;
  sendRoomMessage: (roomId: string, text: string) => void;
  selectedCountry: string;
  setSelectedCountry: (c: string) => void;
  conversations: DirectConversation[];
  sendDirectMessage: (convId: string, text: string) => void;
  openChatThread: DirectConversation | null;
  setOpenChatThread: (conv: DirectConversation | null) => void;
  unreadCount: number;
  gifts: GiftItem[];
  sendGift: (gift: GiftItem, receiver: { id: string; name: string; avatar?: string }, count?: number) => boolean;
  activeGiftAnimation: GiftAnimationPayload | null;
  clearGiftAnimation: () => void;
  agencies: Agency[];
  joinAgency: (agencyId: string) => void;
  createAgency: (name: string, description: string) => void;
  transactions: Transaction[];
  rechargeCoins: (amount: number) => void;
  convertDiamondsToCoins: (diamondsAmount: number) => boolean;
  followedRoomHosts: Set<string>;
  toggleFollowHost: (hostId: string) => void;
  createVoiceRoom: (title: string, tag: string) => void;
  updateRoom: (roomId: string, updates: Partial<VoiceRoom>) => void;
  changeRoomBackground: (roomId: string, backgroundUrl: string) => boolean;
  // Modals state
  openGiftStore: boolean;
  setOpenGiftStore: (open: boolean) => void;
  openRechargeModal: boolean;
  setOpenRechargeModal: (open: boolean) => void;
  openLevelsModal: boolean;
  setOpenLevelsModal: (open: boolean) => void;
  levelsModalTab: 'wealth' | 'charm' | 'games';
  setLevelsModalTab: (tab: 'wealth' | 'charm' | 'games') => void;
  addGameExp: (amount: number) => void;
  openVipModal: boolean;
  setOpenVipModal: (open: boolean) => void;
  vipModalInitialPopup: 'badge' | 'headframe' | 'mic' | 'nickname' | null;
  setVipModalInitialPopup: (popup: 'badge' | 'headframe' | 'mic' | 'nickname' | null) => void;
  openAgencyModal: boolean;
  setOpenAgencyModal: (open: boolean) => void;
  openEditProfileModal: boolean;
  setOpenEditProfileModal: (open: boolean) => void;
  openSearchModal: boolean;
  setOpenSearchModal: (open: boolean) => void;
  openStorageModal: boolean;
  setOpenStorageModal: (open: boolean) => void;
  storageTab: 'store' | 'bag';
  setStorageTab: (tab: 'store' | 'bag') => void;
  bagItems: BagItem[];
  equippedFrame: string;
  equippedBubble: string;
  equippedEntrance: string;
  equippedMount: string;
  equipBagItem: (item: BagItem) => void;
  unequipBagItem: (item: BagItem) => void;
  buyStoreItem: (item: StorageItem) => boolean;
  openHonorModal: boolean;
  setOpenHonorModal: (open: boolean) => void;
  openSettingsModal: boolean;
  setOpenSettingsModal: (open: boolean) => void;
  openCreateRoomModal: boolean;
  setOpenCreateRoomModal: (open: boolean) => void;
  openReportModal: boolean;
  setOpenReportModal: (open: boolean) => void;
  openLanguageModal: boolean;
  setOpenLanguageModal: (open: boolean) => void;
  openInviteModal: boolean;
  setOpenInviteModal: (open: boolean) => void;
  openInternalProfileModal: boolean;
  setOpenInternalProfileModal: (open: boolean) => void;
  openWealthLeaderboardModal: boolean;
  setOpenWealthLeaderboardModal: (open: boolean) => void;
  leaderboardTab: 'wealth' | 'charm' | 'room';
  setLeaderboardTab: (tab: 'wealth' | 'charm' | 'room') => void;
  internalProfileUser: UserProfile | null;
  setInternalProfileUser: (user: UserProfile | null) => void;
  selectedGiftReceiver: { id: string; name: string; avatar?: string } | null;
  setSelectedGiftReceiver: (receiver: { id: string; name: string; avatar?: string } | null) => void;
  openProfileForUser: (user: Partial<UserProfile> | { id: string; name: string; avatar?: string }) => void;
  deleteRoom: (roomId: string) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (logged: boolean) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isRtl: boolean;
  agencyMemberCount: number;
  setAgencyMemberCount: React.Dispatch<React.SetStateAction<number>>;
}

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // ignore
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // UI placeholder only until the verified user's profile/wallet is loaded.
  // Never hydrate privileged balances or identity from localStorage.
  const makeEmptyUser = (): UserProfile => ({
    id: '',
    name: '',
    nickname: '',
    avatar: '',
    country: '',
    countryCode: '',
    countryFlag: '',
    vipLevel: 0,
    vipExpiry: '',
    wealthLevel: 0,
    wealthExp: 0,
    charmLevel: 0,
    charmExp: 0,
    coins: 0,
    diamonds: 0,
    hearts: 0,
    friendsCount: 0,
    followersCount: 0,
    followingCount: 0,
    fansCount: 0,
    visitorsCount: 0,
    gender: 'ذكر',
    birthdate: '',
    bio: '',
    album: [],
    permissions: [],
    isSuperAdmin: false,
    isRechargeAgent: false,
    isHost: false,
    isSpecialId: false,
    hasWelcomeBanner: false,
    isBanned: false,
    isNameBanned: false,
    isAvatarBanned: false,
  });
  const [currentUser, setCurrentUser] = useState<UserProfile>(makeEmptyUser);

  // Only a verified Supabase auth session may unlock the app.
  const [isLoggedIn, setIsLoggedInState] = useState(false);
  const setIsLoggedIn = (logged: boolean) => {
    if (!logged) {
      setIsLoggedInState(false);
      void stagingBackend?.auth.signOut();
    }
    // Ignore client-side attempts to mark a user authenticated.
  };

  useEffect(() => {
    if (!stagingBackend) return;
    let active = true;
    const { data: { subscription } } = stagingBackend.auth.onAuthStateChange(
      (_event, session) => {
        if (active) setIsLoggedInState(Boolean(session?.user));
      },
    );
    void stagingBackend.auth.getSession().then(({ data, error }) => {
      if (active) setIsLoggedInState(!error && Boolean(data.session?.user));
    }).catch(() => {
      if (active) setIsLoggedInState(false);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  // Load only authenticated profile fields from the staging backend.
  useEffect(() => {
    if (!isLoggedIn) return;
    let active = true;
    fetchMyProfile().then(profile => {
      if (!active || !profile) return;
      setCurrentUser(prev => ({
        ...prev,
        id: profile.id,
        name: profile.display_name,
        nickname: profile.display_name,
        bio: profile.bio ?? '',
        avatar: profile.avatar_url ?? '',
      }));
    }).catch(error => console.error('Failed to load staging profile:', error));
    return () => { active = false; };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      setCurrentUser(makeEmptyUser());
      return;
    }
    let active = true;
    fetchMyWallet().then(wallet => {
      if (active) setCurrentUser(prev => ({
        ...prev, coins: wallet.coins, diamonds: wallet.diamonds,
      }));
    }).catch(error => {
      console.error('Failed to load authenticated staging wallet:', error);
      if (active) setCurrentUser(prev => ({ ...prev, coins: 0, diamonds: 0 }));
    });
    return () => { active = false; };
  }, [isLoggedIn]);

  const [activeTab, setActiveTab] = useState<'home' | 'messages' | 'profile'>('home');
  const [homeSubTab, setHomeSubTab] = useState<'party' | 'royal' | 'discover'>('party');
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  useEffect(() => {
    if (!isLoggedIn) { setRooms([]); return; }
    let active = true;
    fetchRealRooms().then(rows => {
      if (active) setRooms(rows.map(mapRoomToUi));
    }).catch(error => {
      console.error('Failed to load real staging rooms:', error);
      if (active) setRooms([]);
    });
    return () => { active = false; };
  }, [isLoggedIn]);
  const [activeRoom, setActiveRoom] = useState<VoiceRoom | null>(null);
  const [isRoomMinimized, setIsRoomMinimized] = useState(false);
  const [myMicMuted, setMyMicMuted] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('شائع 🔥');
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [openChatThread, setOpenChatThread] = useState<DirectConversation | null>(null);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [followedRoomHosts, setFollowedRoomHosts] = useState<Set<string>>(() => {
    const saved = safeStorage.getItem('toti_followed_room_hosts_v2');
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) return new Set(arr);
      } catch (_) {}
    }
    // Default followed rooms/hosts so "ملكي" displays followed rooms right away
    return new Set<string>();
  });
  // Financial history must originate from the server ledger, not localStorage.
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  useEffect(() => {
    safeStorage.removeItem('toti_transactions');
    safeStorage.removeItem('toti_transactions_v2');
    if (!isLoggedIn) setTransactions([]);
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    let active = true;
    void fetchMyLedger().then(entries => {
      if (active) setTransactions(entries);
    }).catch(error => {
      console.error('Failed to fetch real wallet ledger:', error);
      if (active) setTransactions([]);
    });
    return () => { active = false; };
  }, [isLoggedIn]);

  const [activeGiftAnimation, setActiveGiftAnimation] = useState<GiftAnimationPayload | null>(null);

  // Modals
  const [openGiftStore, setOpenGiftStore] = useState(false);
  const [openRechargeModal, setOpenRechargeModal] = useState(false);
  const [openLevelsModal, setOpenLevelsModal] = useState(false);
  const [levelsModalTab, setLevelsModalTab] = useState<'wealth' | 'charm' | 'games'>('wealth');
  const [openVipModal, setOpenVipModal] = useState(false);
  const [vipModalInitialPopup, setVipModalInitialPopup] = useState<'badge' | 'headframe' | 'mic' | 'nickname' | null>(null);
  const [openAgencyModal, setOpenAgencyModal] = useState(false);
  const [openEditProfileModal, setOpenEditProfileModal] = useState(false);
  const [openSearchModal, setOpenSearchModal] = useState(false);
  const [openStorageModal, setOpenStorageModal] = useState(false);
  const [storageTab, setStorageTab] = useState<'store' | 'bag'>('store');
  const [bagItems, setBagItems] = useState<BagItem[]>(() => {
    const saved = safeStorage.getItem('toti_bag_items_v2');
    if (saved) {
      try {
        const parsed: BagItem[] = JSON.parse(saved);
        return parsed.map((item) => (item.category === 'frames' ? { ...item, isEquipped: false } : item));
      } catch {
        return initialBagItems.map((item) => (item.category === 'frames' ? { ...item, isEquipped: false } : item));
      }
    }
    return initialBagItems.map((item) => (item.category === 'frames' ? { ...item, isEquipped: false } : item));
  });
  const [equippedFrame, setEquippedFrame] = useState<string>('');
  const [equippedBubble, setEquippedBubble] = useState<string>('bubble-royal-gold');
  const [equippedEntrance, setEquippedEntrance] = useState<string>('entrance-imperial-caravan');
  const [equippedMount, setEquippedMount] = useState<string>('mount-rolls-royce');

  useEffect(() => {
    safeStorage.setItem('toti_bag_items_v2', JSON.stringify(bagItems));
  }, [bagItems]);

  const equipBagItem = (item: BagItem) => {
    sounds.playLevelUp();
    setBagItems((prev) =>
      prev.map((i) => {
        if (i.category === item.category) {
          return { ...i, isEquipped: i.id === item.id };
        }
        return i;
      })
    );
    if (item.category === 'frames') setEquippedFrame(item.id);
    if (item.category === 'bubbles') setEquippedBubble(item.id);
    if (item.category === 'entrances') setEquippedEntrance(item.id);
    if (item.category === 'mounts') setEquippedMount(item.id);
  };

  const unequipBagItem = (item: BagItem) => {
    sounds.playClick();
    setBagItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isEquipped: false } : i))
    );
    if (item.category === 'frames' && equippedFrame === item.id) setEquippedFrame('');
    if (item.category === 'bubbles' && equippedBubble === item.id) setEquippedBubble('');
    if (item.category === 'entrances' && equippedEntrance === item.id) setEquippedEntrance('');
    if (item.category === 'mounts' && equippedMount === item.id) setEquippedMount('');
  };

  const buyStoreItem = (item: StorageItem): boolean => {
    if (currentUser.coins < item.price) {
      sounds.playClick();
      return false;
    }
    // Deduct coins
    setCurrentUser((prev) => ({
      ...prev,
      coins: prev.coins - item.price,
    }));
    // Add transaction
    setTransactions((prev) => [
      {
        id: `tx-${Date.now()}`,
        type: 'gift_send',
        title: `شراء ${item.name} (${item.duration})`,
        amount: -item.price,
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        status: 'نجاح',
      },
      ...prev,
    ]);
    // Add to bag
    const newBagItem: BagItem = {
      id: item.id,
      name: item.name,
      category: item.category,
      iconType: item.iconType,
      colorScheme: item.colorScheme,
      expiry: `باقي ${item.duration}`,
      isEquipped: true,
    };
    setBagItems((prev) => {
      const existing = prev.filter((i) => i.id !== item.id);
      return [newBagItem, ...existing];
    });
    // Auto equip
    if (item.category === 'frames') setEquippedFrame(item.id);
    if (item.category === 'bubbles') setEquippedBubble(item.id);
    if (item.category === 'entrances') setEquippedEntrance(item.id);
    if (item.category === 'mounts') setEquippedMount(item.id);

    sounds.playSuccess();
    return true;
  };
  const [openHonorModal, setOpenHonorModal] = useState(false);
  const [openSettingsModal, setOpenSettingsModal] = useState(false);
  const [openCreateRoomModal, setOpenCreateRoomModal] = useState(false);
  const [openReportModal, setOpenReportModal] = useState(false);
  const [openLanguageModal, setOpenLanguageModal] = useState(false);
  const [language, setLanguageState] = useState<Language>(() => {
    return (safeStorage.getItem('toti_language') as Language) || 'ar';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    safeStorage.setItem('toti_language', lang);
    if (typeof document !== 'undefined') {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
      if (document.body) {
        document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
      }
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
      if (document.body) {
        document.body.dir = language === 'ar' ? 'rtl' : 'ltr';
      }
    }
  }, [language]);

  const t = translations[language] || translations.ar;
  const isRtl = language === 'ar';

  const [agencyMemberCount, setAgencyMemberCount] = useState<number>(() => {
    const saved = safeStorage.getItem('toti_agency_member_count');
    if (saved !== null) {
      const num = parseInt(saved, 10);
      if (!isNaN(num) && num >= 0) return num;
    }
    return 4; // default initial agency members
  });

  useEffect(() => {
    safeStorage.setItem('toti_agency_member_count', String(agencyMemberCount));
  }, [agencyMemberCount]);

  const [openInviteModal, setOpenInviteModal] = useState(false);
  const [openInternalProfileModal, setOpenInternalProfileModal] = useState(false);
  const [openWealthLeaderboardModal, setOpenWealthLeaderboardModal] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState<'wealth' | 'charm' | 'room'>('wealth');
  const [internalProfileUser, setInternalProfileUser] = useState<UserProfile | null>(null);
  const [selectedGiftReceiver, setSelectedGiftReceiver] = useState<{ id: string; name: string; avatar?: string } | null>(null);

  const openProfileForUser = (user: Partial<UserProfile> | { id: string; name: string; avatar?: string }) => {
    sounds.playClick();
    if (user.id === currentUser.id || user.id === '1') {
      setInternalProfileUser(currentUser);
      setOpenInternalProfileModal(true);
      return;
    }
    const fullUser: UserProfile = {
      id: user.id || '9500',
      name: user.name || 'مستخدم توتي',
      nickname: (user as UserProfile).nickname || user.name || 'مستخدم توتي',
      avatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      country: (user as UserProfile).country || 'العراق',
      countryCode: (user as UserProfile).countryCode || 'IQ',
      countryFlag: (user as UserProfile).countryFlag || '🇮🇶',
      vipLevel: (user as UserProfile).vipLevel ?? 0,
      vipExpiry: (user as UserProfile).vipExpiry || '',
      wealthLevel: (user as UserProfile).wealthLevel ?? 1,
      wealthExp: (user as UserProfile).wealthExp ?? 0,
      charmLevel: (user as UserProfile).charmLevel ?? 1,
      charmExp: (user as UserProfile).charmExp ?? 0,
      coins: (user as UserProfile).coins ?? 0,
      diamonds: (user as UserProfile).diamonds ?? 0,
      hearts: (user as UserProfile).hearts ?? 0,
      friendsCount: (user as UserProfile).friendsCount ?? 0,
      followersCount: (user as UserProfile).followersCount ?? 0,
      followingCount: (user as UserProfile).followingCount ?? 0,
      fansCount: (user as UserProfile).fansCount ?? 0,
      visitorsCount: (user as UserProfile).visitorsCount ?? 0,
      gender: (user as UserProfile).gender || 'ذكر',
      birthdate: (user as UserProfile).birthdate || '1998-05-15',
      bio: (user as UserProfile).bio || 'مرحباً بكم في حسابي الشخصي 🕊️',
      album: (user as UserProfile).album || [
        user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      ],
      agencyName: (user as UserProfile).agencyName || '',
      agencyRole: (user as UserProfile).agencyRole || '',
    };

    setInternalProfileUser(fullUser);
    setOpenInternalProfileModal(true);
  };

  // Live room messages stream
  const [roomMessages, setRoomMessages] = useState<Record<string, ChatMessage[]>>({});

  // Never persist a mutable copy of balances, roles or identity in localStorage.
  useEffect(() => {
    safeStorage.removeItem('toti_user_v6_313');
  }, []);

  const updateUserProfile = (updates: Partial<UserProfile>): void => {
    const allowed = new Set(['name', 'nickname', 'bio', 'avatar']);
    if (Object.keys(updates).some(key => !allowed.has(key))) {
      alert('هذه البيانات لا يمكن تعديلها من التطبيق.');
      return;
    }
    const fields: { display_name?: string; bio?: string; avatar_url?: string | null } = {};
    if (updates.name !== undefined || updates.nickname !== undefined) {
      fields.display_name = updates.name ?? updates.nickname;
    }
    if (updates.bio !== undefined) fields.bio = updates.bio;
    if (updates.avatar !== undefined) fields.avatar_url = updates.avatar || null;
    void saveProfileChanges(fields).then(profile => {
      setCurrentUser(prev => ({
        ...prev,
        name: profile.display_name,
        nickname: profile.display_name,
        bio: profile.bio,
        avatar: profile.avatar_url ?? '',
      }));
    }).catch(error => {
      console.error('Profile update rejected:', error);
      alert('تعذر حفظ الملف الشخصي. تحقق من البيانات والاتصال.');
    });
  };

  const enterRoom = (roomId: string): void => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    setActiveRoom(room);
    setIsRoomMinimized(false);
    // RLS currently exposes only the signed-in member's own reservation.
    // Never interpret that subset as a complete room audience or seat map.
    void fetchRoomMembers(roomId).then(members => {
      const mine = members.find(m => m.user_id === currentUser.id);
      if (!mine?.seat_no) return;
      setActiveRoom(prev => {
        if (prev?.id !== roomId) return prev;
        return {
          ...prev,
          seats: prev.seats.map(seat => ({
            ...seat,
            user: seat.seatNumber === mine.seat_no ? currentUser : seat.user,
            isMuted: seat.seatNumber === mine.seat_no
              ? (mine.is_muted || mine.moderation_muted) : seat.isMuted,
            isSpeaking: false,
          })),
        };
      });
    }).catch(error => console.error('Failed to load own room membership:', error));
  };

  const leaveRoom = () => {
    if (activeRoom) {
      // remove current user from seats if sitting
      const updatedSeats = activeRoom.seats.map((s) => (s.user?.id === currentUser.id ? { ...s, user: null, isSpeaking: false } : s));
      const updatedRoom = { ...activeRoom, seats: updatedSeats };
      setRooms((prev) => prev.map((r) => (r.id === activeRoom.id ? updatedRoom : r)));
    }
    setActiveRoom(null);
    setIsRoomMinimized(false);
    sounds.playClick();
  };

  // Seat reservations and moderation require authenticated server operations.
  const takeSeat = (_seatNumber: number): void => {
    alert('حجز المقعد غير متاح حتى اكتمال الربط الآمن بالخادم.');
  };

  const leaveSeat = (_seatNumber: number): void => {
    alert('ترك المقعد غير متاح حتى اكتمال الربط الآمن بالخادم.');
  };

  const toggleLockSeat = (_seatNumber: number): void => {
    alert('قفل المقاعد يتطلب صلاحيات المشرف والتحقق من الخادم.');
  };

  const toggleMuteSeat = (_seatNumber: number): void => {
    alert('كتم أعضاء الغرفة يتطلب صلاحيات المشرف والتحقق من الخادم.');
  };

  const toggleMyMic = (): void => {
    // Local microphone preference only. This is not a server seat mute
    // or proof that audio transport is connected.
    setMyMicMuted(prev => !prev);
    sounds.playClick();
  };

  const sendRoomMessage = (_roomId: string, text: string): void => {
    if (!text.trim()) return;
    alert('إرسال رسائل الغرفة غير متاح حتى ربط الدردشة الحقيقية بالخادم.');
  };

  const sendDirectMessage = (_convId: string, text: string): void => {
    if (!text.trim()) return;
    alert('الرسائل الخاصة غير متاحة حتى اكتمال الربط الحقيقي بالخادم.');
  };

  // Until the server-side atomic gift RPC is wired, never debit balances locally.
  const sendGift = (
    _gift: GiftItem,
    _receiver: { id: string; name: string; avatar?: string },
    _count: number = 1
  ): boolean => {
    alert('إرسال الهدايا غير متاح حتى اكتمال الربط الآمن بالخادم.');
    return false;
  };

  const clearGiftAnimation = () => {
    setActiveGiftAnimation(null);
  };

  // Charging is performed by authorized agents through audited server operations only.
  const rechargeCoins = (_amount: number): void => {
    alert('الشحن المباشر من التطبيق غير متاح. يرجى التواصل مع وكيل شحن معتمد.');
  };

  // Conversion requires an atomic server transaction, not local wallet mutation.
  const convertDiamondsToCoins = (_diamondsAmount: number): boolean => {
    alert('تحويل الألماس غير متاح حتى اكتمال الربط الآمن بالخادم.');
    return false;
  };

  const toggleFollowHost = (hostId: string) => {
    sounds.playClick();
    setFollowedRoomHosts((prev) => {
      const next = new Set(prev);
      if (next.has(hostId)) {
        next.delete(hostId);
      } else {
        next.add(hostId);
      }
      try {
        safeStorage.setItem('toti_followed_room_hosts_v2', JSON.stringify(Array.from(next)));
      } catch (_) {}
      return next;
    });
  };

  const joinAgency = (_agencyId: string): void => {
    alert('الانضمام للوكالات غير متاح حتى التحقق من العضوية في الخادم.');
  };

  const createAgency = (_name: string, _description: string): void => {
    alert('إنشاء الوكالات غير متاح حتى ربطه بصلاحيات الخادم.');
  };

  const createVoiceRoom = (_title: string, _tag: string): void => {
    alert('إنشاء الغرف غير متاح حتى اكتمال الربط بقاعدة البيانات.');
  };

  const deleteRoom = (_roomId: string): void => {
    alert('حذف الغرف غير متاح حتى اكتمال التحقق من صلاحيات المالك بالخادم.');
  };

  const addGameExp = (_amount: number): void => {
    // Experience must be awarded and verified by the backend.
    console.warn('Local game experience mutation is disabled.');
  };

  const unreadCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        updateUserProfile,
        activeTab,
        setActiveTab,
        homeSubTab,
        setHomeSubTab,
        rooms,
        activeRoom,
        enterRoom,
        leaveRoom,
        isRoomMinimized,
        setIsRoomMinimized,
        takeSeat,
        leaveSeat,
        toggleLockSeat,
        toggleMuteSeat,
        myMicMuted,
        toggleMyMic,
        roomMessages,
        sendRoomMessage,
        selectedCountry,
        setSelectedCountry,
        conversations,
        sendDirectMessage,
        openChatThread,
        setOpenChatThread,
        unreadCount,
        gifts: mockGifts,
        sendGift,
        activeGiftAnimation,
        clearGiftAnimation,
        agencies,
        joinAgency,
        createAgency,
        transactions,
        rechargeCoins,
        convertDiamondsToCoins,
        followedRoomHosts,
        toggleFollowHost,
        createVoiceRoom,
        updateRoom,
        changeRoomBackground,
        // Modals
        openGiftStore,
        setOpenGiftStore,
        openRechargeModal,
        setOpenRechargeModal,
        openLevelsModal,
        setOpenLevelsModal,
        levelsModalTab,
        setLevelsModalTab,
        addGameExp,
        openVipModal,
        setOpenVipModal,
        vipModalInitialPopup,
        setVipModalInitialPopup,
        openAgencyModal,
        setOpenAgencyModal,
        openEditProfileModal,
        setOpenEditProfileModal,
        openSearchModal,
        setOpenSearchModal,
        openStorageModal,
        setOpenStorageModal,
        storageTab,
        setStorageTab,
        bagItems,
        equippedFrame,
        equippedBubble,
        equippedEntrance,
        equippedMount,
        equipBagItem,
        unequipBagItem,
        buyStoreItem,
        openHonorModal,
        setOpenHonorModal,
        openSettingsModal,
        setOpenSettingsModal,
        openCreateRoomModal,
        setOpenCreateRoomModal,
        openReportModal,
        setOpenReportModal,
        openLanguageModal,
        setOpenLanguageModal,
        openInviteModal,
        setOpenInviteModal,
        openInternalProfileModal,
        setOpenInternalProfileModal,
        openWealthLeaderboardModal,
        setOpenWealthLeaderboardModal,
        leaderboardTab,
        setLeaderboardTab,
        internalProfileUser,
        setInternalProfileUser,
        selectedGiftReceiver,
        setSelectedGiftReceiver,
        openProfileForUser,
        deleteRoom,
        isLoggedIn,
        setIsLoggedIn,
        language,
        setLanguage,
        t,
        isRtl,
        agencyMemberCount,
        setAgencyMemberCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
