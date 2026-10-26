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
import { stagingBackend, fetchRealRooms } from '../services/stagingBackend';
import { mapRoomToUi } from '../services/mapRoomToUi';
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
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => ({
    ...initialCurrentUser,
    id: '',
    name: '',
    nickname: '',
    coins: 0,
    diamonds: 0,
    vipLevel: 0,
    wealthLevel: 0,
    wealthExp: 0,
    charmLevel: 0,
    charmExp: 0,
    isSuperAdmin: false,
    isRechargeAgent: false,
    permissions: [],
  }));

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
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    safeStorage.removeItem('toti_transactions');
    const saved = safeStorage.getItem('toti_transactions_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    safeStorage.setItem('toti_transactions_v2', JSON.stringify(transactions));
  }, [transactions]);
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
  const [roomMessages, setRoomMessages] = useState<Record<string, ChatMessage[]>>({
    'room-1': [
      {
        id: 'msg-1',
        senderId: 'sys',
        senderName: 'النظام',
        senderAvatar: '',
        text: 'مرحباً بكم في الحفلة! يمنع أي نشاط أو تواصل عنيف أو إباحي أو استغلالي أو مرتبط بالقمار أو غير قانوني.',
        timestamp: '18:10',
        isSystem: true,
      },
      {
        id: 'msg-2',
        senderId: 'user-ali',
        senderName: 'محمد علي',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        text: 'حياكم الله اهلا وسهلا بالجميع 🌹',
        timestamp: '18:12',
        vipLevel: 2,
      },
      {
        id: 'msg-3',
        senderId: 'sys-join',
        senderName: 'النظام',
        senderAvatar: '',
        text: 'محمد علي انضم، أهلاً وسهلاً',
        timestamp: '18:13',
        isSystem: true,
      },
    ],
  });

  // Never persist a mutable copy of balances, roles or identity in localStorage.
  useEffect(() => {
    safeStorage.removeItem('toti_user_v6_313');
  }, []);

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...updates };

      // Also update currentUser in activeRoom seats
      if (activeRoom) {
        setActiveRoom((prevRoom) => {
          if (!prevRoom) return prevRoom;
          return {
            ...prevRoom,
            seats: prevRoom.seats.map((seat) => {
              if (seat.user?.id === updated.id) {
                return { ...seat, user: { ...seat.user, ...updates } };
              }
              return seat;
            }),
          };
        });
      }

      return updated;
    });
    sounds.playClick();
  };

  const enterRoom = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
      setActiveRoom(room);
      setIsRoomMinimized(false);
      sounds.playMicConnect();

      // add entrance notification
      setRoomMessages((prev) => ({
        ...prev,
        [roomId]: [
          ...(prev[roomId] || []),
          {
            id: 'join-' + Date.now(),
            senderId: 'sys',
            senderName: 'النظام',
            senderAvatar: '',
            text: `${currentUser.nickname || currentUser.name} انضم إلى الغرفة، مرحباً بك! ✨`,
            timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            isSystem: true,
          },
        ],
      }));
    }
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

  const takeSeat = (seatNumber: number) => {
    if (!activeRoom) return;
    const seat = activeRoom.seats?.find((s) => s.seatNumber === seatNumber);
    if (seat && seat.user && seat.user.id !== currentUser.id) return;

    sounds.playMicConnect();
    let seatExisted = false;
    const currentSeats = activeRoom.seats || [];
    const updatedSeats = currentSeats.map((s) => {
      if (s.seatNumber === seatNumber) {
        seatExisted = true;
        return { ...s, user: currentUser, isMuted: myMicMuted, isSpeaking: !myMicMuted, isLocked: false };
      }
      if (s.user?.id === currentUser.id) {
        return { ...s, user: null, isSpeaking: false };
      }
      return s;
    });

    const finalSeats = seatExisted
      ? updatedSeats
      : [...updatedSeats, { seatNumber, user: currentUser, isMuted: myMicMuted, isSpeaking: !myMicMuted, isLocked: false }];

    const updatedRoom = { ...activeRoom, seats: finalSeats };
    setActiveRoom(updatedRoom);
    setRooms((prev) => prev.map((r) => (r.id === activeRoom.id ? updatedRoom : r)));

    // Send chat announcement
    sendRoomMessage(activeRoom.id, `صعد ${currentUser.nickname || currentUser.name} إلى المايك رقم ${seatNumber} 🎙️`);
  };

  const leaveSeat = (seatNumber: number) => {
    if (!activeRoom) return;
    const updatedSeats = activeRoom.seats.map((s) => (s.seatNumber === seatNumber ? { ...s, user: null, isSpeaking: false } : s));
    const updatedRoom = { ...activeRoom, seats: updatedSeats };
    setActiveRoom(updatedRoom);
    setRooms((prev) => prev.map((r) => (r.id === activeRoom.id ? updatedRoom : r)));
    sounds.playClick();
  };

  const toggleLockSeat = (seatNumber: number) => {
    if (!activeRoom) return;
    const updatedSeats = activeRoom.seats.map((s) => (s.seatNumber === seatNumber ? { ...s, isLocked: !s.isLocked } : s));
    const updatedRoom = { ...activeRoom, seats: updatedSeats };
    setActiveRoom(updatedRoom);
    setRooms((prev) => prev.map((r) => (r.id === activeRoom.id ? updatedRoom : r)));
    sounds.playClick();
  };

  const toggleMuteSeat = (seatNumber: number) => {
    if (!activeRoom) return;
    const updatedSeats = activeRoom.seats.map((s) => (s.seatNumber === seatNumber ? { ...s, isMuted: !s.isMuted } : s));
    const updatedRoom = { ...activeRoom, seats: updatedSeats };
    setActiveRoom(updatedRoom);
    setRooms((prev) => prev.map((r) => (r.id === activeRoom.id ? updatedRoom : r)));
    sounds.playClick();
  };

  const toggleMyMic = () => {
    const nextState = !myMicMuted;
    setMyMicMuted(nextState);
    sounds.playClick();
    if (activeRoom) {
      const updatedSeats = activeRoom.seats.map((s) => {
        if (s.user?.id === currentUser.id) {
          return { ...s, isMuted: nextState, isSpeaking: !nextState };
        }
        return s;
      });
      const updatedRoom = { ...activeRoom, seats: updatedSeats };
      setActiveRoom(updatedRoom);
      setRooms((prev) => prev.map((r) => (r.id === activeRoom.id ? updatedRoom : r)));
    }
  };

  const sendRoomMessage = (roomId: string, text: string) => {
    if (!text.trim()) return;
    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      senderId: currentUser.id,
      senderName: currentUser.nickname || currentUser.name,
      senderAvatar: currentUser.avatar,
      text,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      vipLevel: currentUser.vipLevel,
    };

    setRoomMessages((prev) => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), newMsg],
    }));
  };

  const sendDirectMessage = (convId: string, text: string) => {
    if (!text.trim()) return;
    sounds.playClick();
    const newMsg = {
      id: 'm-' + Date.now(),
      text,
      sender: 'me' as const,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === convId) {
          const updated = {
            ...c,
            lastMessage: text,
            lastTime: 'الآن',
            messages: [...c.messages, newMsg],
          };
          if (openChatThread?.id === convId) {
            setOpenChatThread(updated);
          }
          return updated;
        }
        return c;
      })
    );

    // Auto-reply simulation for demo realism
    if (convId !== 'sys-msg' && convId !== 'official-msg') {
      setTimeout(() => {
        const replyMsg = {
          id: 'm-reply-' + Date.now(),
          text: 'أهلاً بك يا غالي! تسلم ويسعد قلبك دائماً 🌸',
          sender: 'them' as const,
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        };
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === convId) {
              const updated = {
                ...c,
                lastMessage: replyMsg.text,
                lastTime: 'الآن',
                messages: [...c.messages, replyMsg],
              };
              if (openChatThread?.id === convId) {
                setOpenChatThread(updated);
              }
              return updated;
            }
            return c;
          })
        );
      }, 1500);
    }
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

  const joinAgency = (agencyId: string) => {
    const ag = agencies.find((a) => a.id === agencyId);
    if (!ag) return;
    sounds.playClick();
    setCurrentUser((prev) => ({
      ...prev,
      agencyName: ag.name,
      agencyRole: 'عضو مميز',
    }));
  };

  const createAgency = (name: string, description: string) => {
    sounds.playGiftFanfare();
    const newAg: Agency = {
      id: 'ag-' + Date.now(),
      name,
      logo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
      rank: agencies.length + 1,
      leaderName: currentUser.name,
      leaderAvatar: currentUser.avatar,
      country: currentUser.country,
      countryFlag: currentUser.countryFlag,
      memberCount: 1,
      totalIncome: '0 🪙',
      monthlyScore: '1,000',
      description,
      members: [
        {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
          role: 'مدير الوكالة',
          score: '1,000',
          vipLevel: currentUser.vipLevel,
        },
      ],
    };
    setAgencies((prev) => [newAg, ...prev]);
    setCurrentUser((prev) => ({
      ...prev,
      agencyName: name,
      agencyRole: 'مدير الوكالة',
    }));
  };

  const createVoiceRoom = (title: string, tag: string) => {
    // Strict Constraint: 1 personal room per user
    const existingPersonalRoom = rooms.find((r) => r.hostId === currentUser.id);
    if (existingPersonalRoom) {
      sounds.playClick();
      enterRoom(existingPersonalRoom.id);
      return;
    }

    sounds.playGiftFanfare();
    const newRoom: VoiceRoom = {
      id: 'room-' + currentUser.id,
      title: title || `غرفة ${currentUser.name} 👑`,
      hostName: currentUser.name,
      hostAvatar: currentUser.avatar,
      hostId: currentUser.id,
      coverImage: currentUser.avatar,
      rank: rooms.length + 1,
      country: currentUser.country,
      countryFlag: currentUser.countryFlag,
      listenersCount: 1,
      activeMicCount: 1,
      tag: tag || 'حفلة جديدة 🔥',
      agencyName: currentUser.agencyName || 'بدون وكالة',
      frameType: 'gold',
      announcement: 'أهلاً وسهلاً بالجميع في غرفتي الشخصية على توتي شات!',
      backgroundUrl: '/galaxy-room-bg.jpg',
      memberAvatars: [currentUser.avatar],
      seats: Array.from({ length: 15 }, (_, i) => ({
        seatNumber: i + 1,
        user: i === 0 ? { ...currentUser, isHost: true } : null,
        isLocked: false,
        isMuted: false,
        isSpeaking: i === 0,
      })),
      createdAt: new Date().toISOString(),
    };
    setRooms((prev) => [newRoom, ...prev]);
    enterRoom(newRoom.id);
  };

  const updateRoom = (roomId: string, updates: Partial<VoiceRoom>) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r))
    );
    if (activeRoom?.id === roomId) {
      setActiveRoom((prev) => (prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null));
    }
  };

  const changeRoomBackground = (roomId: string, backgroundUrl: string): boolean => {
    updateRoom(roomId, { backgroundUrl });
    return true;
  };

  const deleteRoom = (roomId: string) => {
    sounds.playClick();
    if (activeRoom?.id === roomId) {
      leaveRoom();
    }
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
  };

  const addGameExp = (amount: number) => {
    if (amount <= 0) return;
    setCurrentUser((prev) => {
      const currentGameExp = prev.gameExp ?? calculateCumulativeExpForLevel(prev.gameLevel || 1);
      const nextGameExp = currentGameExp + amount;
      const nextGameLevel = getLevelFromExp(nextGameExp);
      if (nextGameLevel > (prev.gameLevel || 1)) {
        sounds.playLevelUp();
      }
      return {
        ...prev,
        gameExp: nextGameExp,
        gameLevel: nextGameLevel,
      };
    });
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
