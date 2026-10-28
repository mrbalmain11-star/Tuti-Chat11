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
import { sounds } from '../utils/audio';
import { stagingBackend, fetchRealRooms, fetchMyProfile, fetchMyWallet, fetchRoomMembers, initializeNativeAuthLinks, getMyAvatarUrl } from '../services/stagingBackend';
import { mapRoomToUi } from '../services/mapRoomToUi';
import { saveProfileChanges } from '../services/profileWrites';
import { fetchMyLedger } from '../services/ledgerReads';
import { fetchRealRoomMessages } from '../services/roomMessageReads';
import { fetchRoomVisualMembers } from '../services/roomVisualMembers';
import { reserveSeat, joinRoomMembership, leaveRoomMembership, sendRealRoomMessage, setMyRoomMute, releaseMySeat } from '../services/roomMembershipRpc';
import { Language, Translations, translations } from '../i18n/translations';
import { StorageItem, BagItem } from '../data/storageItems';
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
  sendGift: (gift: GiftItem, receiver: { id: string; name: string; avatar?: string }, count?: number) => Promise<boolean>;
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

  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;
    void initializeNativeAuthLinks().then(cleanup => {
      if (cancelled) cleanup();
      else dispose = cleanup;
    }).catch(error => console.error('Native auth callback listener failed:', error));
    return () => { cancelled = true; dispose?.(); };
  }, []);

  // Load only authenticated profile fields from the staging backend.
  useEffect(() => {
    if (!isLoggedIn) return;
    let active = true;
    void (async () => {
      const profile = await fetchMyProfile();
      if (!active || !profile) return;
      const avatar = profile.avatar_url ? await getMyAvatarUrl(profile.avatar_url) : '';
      if (!active) return;
      setCurrentUser(prev => ({
        ...prev,
        id: profile.id,
        name: profile.display_name,
        nickname: profile.display_name,
        bio: profile.bio ?? '',
        avatar,
      }));
    })().catch(error => console.error('Failed to load staging profile:', error));
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
    let refreshInFlight = false;
    let refreshPending = false;
    const refreshRooms = async () => {
      if (refreshInFlight) { refreshPending = true; return; }
      refreshInFlight = true;
      try {
        do {
          refreshPending = false;
          const rows = await fetchRealRooms();
          if (active) setRooms(rows.map(mapRoomToUi));
        } while (active && refreshPending);
      } catch (error) {
        console.error('Failed to refresh real staging rooms:', error);
      } finally {
        refreshInFlight = false;
      }
    };
    void refreshRooms();
    const client = stagingBackend;
    const channel = client?.channel('staging-public-rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        void refreshRooms();
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') void refreshRooms();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Rooms realtime subscription:', status);
        }
      });
    return () => {
      active = false;
      if (channel && client) void client.removeChannel(channel);
    };
  }, [isLoggedIn]);
  const [activeRoom, setActiveRoom] = useState<VoiceRoom | null>(null);
  const [isRoomMinimized, setIsRoomMinimized] = useState(false);
  const [myMicMuted, setMyMicMuted] = useState(false);
  useEffect(() => {
    if (isLoggedIn) return;
    setActiveRoom(null);
    setIsRoomMinimized(false);
    setMyMicMuted(false);
  }, [isLoggedIn]);
  const [selectedCountry, setSelectedCountry] = useState<string>('شائع 🔥');
  const [realGifts, setRealGifts] = useState<GiftItem[]>([]);
  useEffect(() => {
    if (!isLoggedIn || !stagingBackend) {
      setRealGifts([]);
      return;
    }
    let active = true;
    void (async () => {
      const { data, error } = await stagingBackend.from('gift_catalog')
        .select('id,name,price,icon,category_id,animation_type,rarity')
        .eq('is_active', true).order('price', { ascending: true });
      if (error) throw error;
      const allowedAnimation = new Set<GiftItem['animationType']>([
        'lion', 'mosque', 'sword', 'samurai', 'crown', 'car', 'diamond', 'rose',
      ]);
      const gifts = (data ?? []).map(g => ({
        id: String(g.id), name: String(g.name), price: Number(g.price),
        icon: String(g.icon),
        category: (g.category_id === 'luck' ? 'حظ' : g.category_id === 'cp' ? 'CP' : 'هدية') as GiftItem['category'],
        animationType: (allowedAnimation.has(g.animation_type as GiftItem['animationType'])
          ? g.animation_type : 'rose') as GiftItem['animationType'],
        rarity: (['legendary','epic','rare','common'].includes(g.rarity ?? '')
          ? g.rarity : 'common') as GiftItem['rarity'],
      }));
      if (active) setRealGifts(gifts);
    })().catch(error => {
      console.error('Gift catalog load failed:', error);
      if (active) setRealGifts([]);
    });
    return () => { active = false; };
  }, [isLoggedIn]);

  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [openChatThread, setOpenChatThread] = useState<DirectConversation | null>(null);
  useEffect(() => {
    if (!isLoggedIn || !stagingBackend || !currentUser.id) {
      setConversations([]);
      return;
    }
    const client = stagingBackend;
    let active = true;
    const loadDirectMessages = async () => {
      const { data: auth, error: authError } = await client.auth.getUser();
      if (authError || auth.user?.id !== currentUser.id) return;
      const { data, error } = await client.from('direct_messages')
        .select('id,sender_id,recipient_id,body,created_at,read_at')
        .or(`sender_id.eq.${auth.user.id},recipient_id.eq.${auth.user.id}`)
        .order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      const messages = data ?? [];
      const ids = [...new Set(messages.map(m => m.sender_id === auth.user!.id ? m.recipient_id : m.sender_id))];
      const { data: profiles, error: profilesError } = ids.length
        ? await client.from('profiles').select('id,display_name,avatar_url').in('id', ids)
        : { data: [], error: null };
      if (profilesError) throw profilesError;
      const names = new Map((profiles ?? []).map(p => [p.id, p]));
      const threads = new Map<string, DirectConversation>();
      for (const m of messages) {
        const peerId = m.sender_id === auth.user.id ? m.recipient_id : m.sender_id;
        const peer = names.get(peerId);
        if (!threads.has(peerId)) threads.set(peerId, {
          id: peerId, userId: peerId, userName: peer?.display_name ?? 'مستخدم',
          userAvatar: '', isOnline: false, lastMessage: m.body,
          lastTime: m.created_at, unreadCount: 0, messages: [],
        });
        const thread = threads.get(peerId)!;
        thread.messages.unshift({
          id: String(m.id), text: m.body,
          sender: m.sender_id === auth.user.id ? 'me' : 'them',
          timestamp: m.created_at,
        });
        if (m.recipient_id === auth.user.id && !m.read_at) thread.unreadCount++;
      }
      if (active) {
        const refreshed = [...threads.values()];
        setConversations(refreshed);
        setOpenChatThread(previous => {
          if (!previous) return null;
          return refreshed.find(thread => thread.userId === previous.userId) ?? previous;
        });
      }
    };
    void loadDirectMessages().catch(error => console.error('DM history load failed:', error));
    const channel = client.channel('staging-my-direct-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, () => {
        void loadDirectMessages().catch(error => console.error('DM refresh failed:', error));
      }).subscribe();
    return () => { active = false; void client.removeChannel(channel); };
  }, [isLoggedIn, currentUser.id]);

  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [followedRoomHosts, setFollowedRoomHosts] = useState<Set<string>>(new Set());
  useEffect(() => {
    safeStorage.removeItem('toti_followed_room_hosts_v2');
    if (!isLoggedIn || !stagingBackend) {
      setFollowedRoomHosts(new Set());
      return;
    }
    let active = true;
    void Promise.resolve(stagingBackend.rpc('staging_my_followed_ids')).then(({ data, error }) => {
      if (error) throw error;
      if (active) setFollowedRoomHosts(new Set((data ?? []) as string[]));
    }).catch(error => {
      console.error('Failed to load follows:', error);
    });
    return () => { active = false; };
  }, [isLoggedIn]);
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
        return [];
      }
    }
    return [];
  });
  const [equippedFrame, setEquippedFrame] = useState<string>('');
  const [equippedBubble, setEquippedBubble] = useState<string>('');
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
  useEffect(() => {
    if (!isLoggedIn || !activeRoom) {
      setRoomMessages({});
      return;
    }
    const roomId = activeRoom.id;
    let active = true;
    void fetchRealRoomMessages(roomId).then(messages => {
      if (active) setRoomMessages({ [roomId]: messages });
    }).catch(error => {
      console.error('Failed to read room messages:', error);
      if (active) setRoomMessages({});
    });
    return () => { active = false; };
  }, [isLoggedIn, activeRoom?.id]);

  useEffect(() => {
    if (!isLoggedIn || !activeRoom || !stagingBackend) return;
    const roomId = activeRoom.id;
    let active = true;
    let refreshing = false;
    let refreshAgain = false;
    const refresh = async () => {
      if (refreshing) {
        refreshAgain = true;
        return;
      }
      refreshing = true;
      try {
        do {
          refreshAgain = false;
          const messages = await fetchRealRoomMessages(roomId);
          if (active) setRoomMessages(prev => ({ ...prev, [roomId]: messages }));
        } while (active && refreshAgain);
      } catch (error) {
        console.error('Room message refresh failed:', error);
      } finally {
        refreshing = false;
      }
    };
    const client = stagingBackend;
    const channel = client.channel('room-messages-' + roomId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'room_messages',
        filter: 'room_id=eq.' + roomId,
      }, () => { void refresh(); })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') void refresh();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Room message realtime subscription:', status);
        }
      });
    return () => {
      active = false;
      void client.removeChannel(channel);
    };
  }, [isLoggedIn, activeRoom?.id]);

  useEffect(() => {
    if (!isLoggedIn || !activeRoom || !stagingBackend) return;
    const roomId = activeRoom.id;
    let alive = true;
    let loading = false;
    let pending = false;
    const refreshRoster = async () => {
      if (loading) { pending = true; return; }
      loading = true;
      try {
        do {
          pending = false;
          const members = await fetchRoomVisualMembers(roomId);
          if (!alive) return;
          const mine = members.find(m => m.user_id === currentUser.id);
          if (mine) setMyMicMuted(mine.is_muted);
          setActiveRoom(prev => {
            if (!prev || prev.id !== roomId) return prev;
            return {
              ...prev,
              listenersCount: members.length,
              activeMicCount: members.filter(m => m.seat_no != null).length,
              seats: prev.seats.map(seat => {
                const member = members.find(m => m.seat_no === seat.seatNumber);
                return {
                  ...seat,
                  user: member ? {
                    ...(member.user_id === currentUser.id ? currentUser : makeEmptyUser()),
                    id: member.user_id,
                    name: member.display_name,
                    nickname: member.display_name,
                    avatar: member.avatar_url ?? '',
                  } : null,
                  isMuted: member?.is_muted ?? true,
                  isSpeaking: false,
                };
              }),
            };
          });
        } while (alive && pending);
      } catch (error) {
        console.error('Room roster realtime refresh failed:', error);
      } finally { loading = false; }
    };
    const client = stagingBackend;
    const channel = client.channel('room-roster-' + roomId)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'room_members',
        filter: 'room_id=eq.' + roomId,
      }, () => { void refreshRoster(); })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') void refreshRoster();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')
          console.error('Room roster realtime subscription:', status);
      });
    return () => {
      alive = false;
      void client.removeChannel(channel);
    };
  }, [isLoggedIn, activeRoom?.id, currentUser.id]);

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
    // Avatar URLs are temporary signed display URLs, never persistent storage paths.
    // Upload handlers already saved the canonical path via uploadMyAvatar().
    // Applying a signed URL to the profile row breaks the image on reload.
    if (updates.avatar !== undefined) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
      return;
    }
    const fields: { display_name?: string; bio?: string; avatar_url?: string | null } = {};
    if (updates.name !== undefined || updates.nickname !== undefined) {
      fields.display_name = updates.name ?? updates.nickname;
    }
    if (updates.bio !== undefined) fields.bio = updates.bio;
    if (updates.avatar !== undefined) fields.avatar_url = updates.avatar || null;
    void saveProfileChanges(fields).then(async profile => {
      const { data, error } = await stagingBackend!.auth.getUser();
      if (error || data.user?.id !== profile.id) return;
      const avatar = profile.avatar_url ? await getMyAvatarUrl(profile.avatar_url) : '';
      setCurrentUser(prev => {
        if (prev.id && prev.id !== profile.id) return prev;
        return {
          ...prev,
          id: profile.id,
          name: profile.display_name,
          nickname: profile.display_name,
          bio: profile.bio,
          avatar,
        };
      });
    }).catch(error => {
      console.error('Profile update rejected:', error);
      alert('تعذر حفظ الملف الشخصي. تحقق من البيانات والاتصال.');
    });
  };

  const enterRoom = (roomId: string): void => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    void joinRoomMembership(roomId).then(async () => {
      setActiveRoom(room);
      setIsRoomMinimized(false);
      setMyMicMuted(true);
      const members = await fetchRoomVisualMembers(roomId);
      const mine = members.find(m => m.user_id === currentUser.id);
      if (mine) setMyMicMuted(mine.is_muted);
      setActiveRoom(prev => {
        if (prev?.id !== roomId) return prev;
        return {
          ...prev,
          listenersCount: members.length,
          activeMicCount: members.filter(m => m.seat_no !== null).length,
          seats: prev.seats.map(seat => {
            const member = members.find(m => m.seat_no === seat.seatNumber);
            return {
              ...seat,
              user: member ? {
                ...(member.user_id === currentUser.id ? currentUser : makeEmptyUser()),
                id: member.user_id,
                name: member.display_name,
                nickname: member.display_name,
                avatar: member.avatar_url ?? '',
                coins: 0,
                diamonds: 0,
                isSuperAdmin: false,
                isRechargeAgent: false,
                permissions: [],
              } : null,
              isMuted: member?.is_muted ?? true,
              isSpeaking: false,
            };
          }),
        };
      });
    }).catch(error => {
      console.error('Room join or membership fetch failed:', error);
      alert('تعذر تأكيد دخول الغرفة من الخادم.');
    });
  };

  const leaveRoom = (): void => {
    if (!activeRoom) return;
    const roomId = activeRoom.id;
    void leaveRoomMembership(roomId).then(() => {
      setActiveRoom(prev => prev?.id === roomId ? null : prev);
      setIsRoomMinimized(false);
      setMyMicMuted(false);
    }).catch(error => {
      console.error('Room leave failed:', error);
      alert('تعذر تأكيد مغادرة الغرفة.');
    });
  };

  // Seat reservations and moderation require authenticated server operations.
  const takeSeat = (seatNumber: number): void => {
    if (!activeRoom) return;
    const roomId = activeRoom.id;
    void reserveSeat(roomId, seatNumber).then(() => {
      setActiveRoom(prev => {
        if (prev?.id !== roomId) return prev;
        return {
          ...prev,
          seats: prev.seats.map(seat => ({
            ...seat,
            user: seat.seatNumber === seatNumber ? currentUser :
              seat.user?.id === currentUser.id ? null : seat.user,
            isSpeaking: false,
          })),
        };
      });
    }).catch(error => {
      console.error('Seat reservation failed:', error);
      alert('تعذر حجز المقعد من الخادم.');
    });
  };

  const leaveSeat = (_seatNumber: number): void => {
    if (!activeRoom) return;
    const roomId = activeRoom.id;
    void releaseMySeat(roomId).then(() => {
      setActiveRoom(prev => prev?.id === roomId ? {
        ...prev,
        seats: prev.seats.map(seat => seat.user?.id === currentUser.id
          ? { ...seat, user: null, isSpeaking: false } : seat),
      } : prev);
      setMyMicMuted(true);
    }).catch(error => {
      console.error('Seat release failed:', error);
      alert('تعذر مغادرة المقعد. حاول مجدداً.');
    });
  };

  const toggleLockSeat = (seatNumber: number): void => {
    if (!activeRoom || !stagingBackend || !Number.isInteger(seatNumber)) return;
    const roomId = activeRoom.id;
    void Promise.resolve(stagingBackend.rpc('phase2_room_toggle_seat_lock', {
      p_room_id: roomId, p_seat: seatNumber,
    })).then(({ data, error }) => {
      if (error || typeof data !== 'boolean') throw error ?? new Error('Lock not confirmed');
      setActiveRoom(prev => prev?.id !== roomId ? prev : ({
        ...prev,
        seats: prev.seats.map(seat => seat.seatNumber === seatNumber
          ? { ...seat, isLocked: data } : seat),
      }));
    }).catch(error => {
      console.error('Seat lock failed:', error);
      alert('تعذر تغيير قفل المقعد. تحقق من صلاحية المالك أو المشرف.');
    });
  };

  const toggleMuteSeat = (_seatNumber: number): void => {
    alert('كتم أعضاء الغرفة يتطلب صلاحيات المشرف والتحقق من الخادم.');
  };

  const toggleMyMic = (): void => {
    if (!activeRoom) return;
    const roomId = activeRoom.id;
    const nextMuted = !myMicMuted;
    void setMyRoomMute(roomId, nextMuted).then(confirmed => {
      setMyMicMuted(confirmed);
      setActiveRoom(prev => prev?.id !== roomId ? prev : ({
        ...prev,
        seats: prev.seats.map(seat => seat.user?.id === currentUser.id
          ? { ...seat, isMuted: confirmed, isSpeaking: false } : seat),
      }));
    }).catch(error => {
      console.error('Server mic mute update failed:', error);
      alert('تعذر تغيير حالة المايك من الخادم.');
    });
  };

  const sendRoomMessage = (roomId: string, text: string): void => {
    if (!text.trim() || !activeRoom || activeRoom.id !== roomId) return;
    void sendRealRoomMessage(roomId, text).then(async () => {
      try {
        const messages = await fetchRealRoomMessages(roomId);
        setRoomMessages(prev => prev[roomId] === undefined ? prev : ({ ...prev, [roomId]: messages }));
      } catch (error) {
        console.error('Message sent but refresh failed:', error);
        alert('تم قبول الرسالة من الخادم لكن تعذر تحديث عرض المحادثة.');
      }
    }).catch(error => {
      console.error('Room message rejected:', error);
      alert('تعذر إرسال الرسالة من الخادم.');
    });
  };

  const sendDirectMessage = (convId: string, text: string): void => {
    const body = text.trim();
    if (!body || body.length > 2000 || !stagingBackend) {
      alert('تعذر إرسال الرسالة: تحقق من النص والاتصال.');
      return;
    }
    const peer = conversations.find(c => c.id === convId || c.userId === convId);
    const recipientId = peer?.userId ?? (openChatThread?.id === convId ? openChatThread.userId : null);
    if (!recipientId || recipientId === currentUser.id) {
      alert('المستلم غير صالح.');
      return;
    }
    const requestId = crypto.randomUUID();
    void Promise.resolve(stagingBackend.rpc('staging_send_dm', {
      p_to: recipientId, p_text: body, p_nonce: requestId,
    })).then(async ({ data, error }) => {
      if (error || !data) throw error ?? new Error('Message not confirmed');
      const sentAt = new Date().toISOString();
      setConversations(prev => {
        const existing = prev.find(c => c.userId === recipientId);
        if (!existing) {
          const name = openChatThread?.userId === recipientId ? openChatThread.userName : 'مستخدم';
          return [{
            id: recipientId, userId: recipientId, userName: name,
            userAvatar: '', isOnline: false, lastMessage: body,
            lastTime: sentAt, unreadCount: 0,
            messages: [{ id: String(data), text: body, sender: 'me' as const, timestamp: sentAt }],
          }, ...prev];
        }
        return prev.map(c => c.userId === recipientId ? {
          ...c, lastMessage: body, lastTime: sentAt,
          messages: c.messages.some(m => m.id === String(data))
            ? c.messages : [...c.messages, {
              id: String(data), text: body, sender: 'me' as const, timestamp: sentAt,
            }],
        } : c);
      });
    }).catch(error => {
      console.error('Direct message send failed:', error);
      alert('تعذر إرسال الرسالة من الخادم.');
    });
  };

  // The server performs atomic balance deduction and idempotent gift delivery.
  const sendGift = async (
    gift: GiftItem,
    receiver: { id: string; name: string; avatar?: string },
    count: number = 1
  ): Promise<boolean> => {
    if (!stagingBackend || !activeRoom || !gift || !receiver?.id ||
        ![1, 7, 17, 77, 777].includes(count) || !Number.isSafeInteger(gift.price) || gift.price < 0) {
      alert('الهدية أو المستلم أو الغرفة غير صالح.');
      return false;
    }
    try {
      const { data, error } = await stagingBackend.rpc('phase3_send_gift', {
        p_room_id: activeRoom.id,
        p_recipient_id: receiver.id,
        p_gift_id: gift.id,
        p_quantity: count,
        p_request_id: crypto.randomUUID(),
        p_expected_price: gift.price,
      });
      if (error) throw error;
      if (!data?.id) throw new Error('Gift event not confirmed');
      setActiveGiftAnimation({ gift, sender: currentUser.name, receiver: receiver.name, count });
      const wallet = await fetchMyWallet().catch(() => null);
      if (wallet) setCurrentUser(prev => ({ ...prev, coins: wallet.coins, diamonds: wallet.diamonds }));
      return true;
    } catch (error) {
      console.error('Gift delivery failed:', error);
      alert('فشل إرسال الهدية أو رفض الخادم العملية. لم يتم تأكيد الخصم.');
      return false;
    }
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

  const toggleFollowHost = (hostId: string): void => {
    if (!stagingBackend || !hostId || hostId === currentUser.id) return;
    void Promise.resolve(stagingBackend.rpc('staging_toggle_follow', { p_followed_id: hostId }))
      .then(({ data, error }) => {
        if (error || typeof data !== 'boolean') throw error ?? new Error('Follow not confirmed');
        setFollowedRoomHosts(prev => {
          const next = new Set(prev);
          if (data) next.add(hostId);
          else next.delete(hostId);
          return next;
        });
        sounds.playClick();
      }).catch(error => {
        console.error('Follow update rejected:', error);
        alert('تعذر تحديث المتابعة من الخادم.');
      });
  };

  const joinAgency = (_agencyId: string): void => {
    alert('الانضمام للوكالات غير متاح حتى التحقق من العضوية في الخادم.');
  };

  const createAgency = (_name: string, _description: string): void => {
    alert('إنشاء الوكالات غير متاح حتى ربطه بصلاحيات الخادم.');
  };

  const createVoiceRoom = (title: string, _tag: string): void => {
    const trimmed = title.trim();
    if (trimmed.length < 2 || trimmed.length > 60) {
      alert('اسم الغرفة يجب أن يكون بين حرفين و60 حرفاً.');
      return;
    }
    if (!stagingBackend || !currentUser.id) {
      alert('يجب تسجيل الدخول قبل إنشاء غرفة.');
      return;
    }
    // Client-side UX guard; the server must enforce a unique owner constraint
    // to prevent duplicate rooms from simultaneous devices or requests.
    if (rooms.some(room => room.hostId === currentUser.id)) {
      alert('لديك غرفة بالفعل. لا يمكن إنشاء غرفتين بنفس الحساب.');
      return;
    }
    void Promise.resolve(stagingBackend.rpc('staging_create_my_room', { p_title: trimmed })).then(async ({ data, error }) => {
      if (error || typeof data !== 'string') throw error ?? new Error('Room creation not confirmed');
      const rows = await fetchRealRooms();
      setRooms(rows.map(mapRoomToUi));
    }).catch(error => {
      console.error('Failed to create staging room:', error);
      alert('تعذر إنشاء الغرفة أو تحميلها من الخادم.');
    });
  };

  const updateRoom = (roomId: string, updates: Partial<VoiceRoom>): void => {
    if (!stagingBackend) {
      alert('الاتصال بالخادم غير مهيأ.');
      return;
    }
    const existing = rooms.find(room => room.id === roomId);
    if (!existing || existing.hostId !== currentUser.id) {
      alert('لا تملك صلاحية تعديل هذه الغرفة.');
      return;
    }
    const title = updates.title ?? existing.title;
    const welcome = updates.announcement ?? existing.announcement ?? '';
    void Promise.resolve(stagingBackend.rpc('staging_update_my_room', {
      p_room_id: roomId, p_title: title, p_welcome_message: welcome,
    })).then(async ({ data, error }) => {
      if (error || data !== true) throw error ?? new Error('Update not confirmed');
      const rows = await fetchRealRooms();
      setRooms(rows.map(mapRoomToUi));
      setActiveRoom(prev => prev?.id === roomId ? { ...prev, title, announcement: welcome } : prev);
    }).catch(error => {
      console.error('Room update failed:', error);
      alert('تعذر تعديل الغرفة من الخادم.');
    });
  };

  const changeRoomBackground = (_roomId: string, _backgroundUrl: string): boolean => {
    alert('تغيير خلفية الغرفة غير متاح حتى ربطه بصلاحيات الخادم.');
    return false;
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
        gifts: realGifts,
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
