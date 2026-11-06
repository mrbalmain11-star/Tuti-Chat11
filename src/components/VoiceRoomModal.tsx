import { stagingBackend } from '../services/stagingBackend';
import { RoomManagementPanel } from './RoomManagementPanel';
import { App as CapacitorApp } from '@capacitor/app';
import { playRoomMusic, pauseRoomMusic, resumeRoomMusic, stopRoomMusic, getRoomMusicProgress, seekRoomMusic, setRoomMusicVolume } from '../services/isolatedRoomMusic';
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { RoyalGiftIcon } from './RoyalGiftIcon';
import { RoyalGamepadIcon } from './RoyalGamepadIcon';
import {
  Mic,
  CircleUserRound,
  MicOff,
  Copy,
  Send,
  X,
  Lock,
  Unlock,
  Maximize2,
  ExternalLink,
  Power,
  Volume2,
  VolumeX,
  Smile,
  Mail,
  LayoutGrid,
  Radio,
  Sliders,
  Coins,
  Trophy,
  Flame,
  Music,
  Calendar,
  Gamepad2,
  Rocket,
  Heart,
  Check,
  Sparkles,
  Users,
  Volume1,
  MessageCircle,
  ShieldCheck,
  UserCheck,
  Palette,
  UploadCloud,
  Settings,
  Shield,
  BarChart3,
  UserPlus,
  UserMinus,
  Eye,
  EyeOff,
  Brush,
  Crown,
  QrCode,
  Download,
  Smartphone,
  Trash2,
  Plus,
  ArrowRightLeft,
  LogOut,
  Gift,
  SkipBack, SkipForward, Shuffle, Repeat, FolderOpen, Play, Pause,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MicSeat, UserProfile } from '../types';
import { sounds } from '../utils/audio';
import { VipName } from './VipName';
import { VipBadge } from './VipBadge';
import { ProfileCpCard } from './ProfileCpCard';


const PRESET_BACKGROUNDS = [
  {
    id: 'galaxy',
    name: 'المجرة الكونية (الافتراضية)',
    url: '/galaxy-room-bg.jpg',
  },
  {
    id: 'forest',
    name: 'الغابة الساحرة الخضراء',
    url: '/enchanted-forest-bg.jpg',
  },
  {
    id: 'tropical',
    name: 'النخيل الاستوائي الذهبي',
    url: '/tropical-palms-bg.jpg',
  },
  {
    id: 'lions',
    name: 'قصر الأسود الملكي',
    url: '/src/assets/images/wealth_lions_bg_1790538325613.jpg',
  },
  {
    id: 'cp_room',
    name: 'غرفة العشاق الرومانسية',
    url: '/src/assets/images/royal_cp_room_1790176778043.jpg',
  },
];

export const VoiceRoomModal: React.FC = () => {
  const {
    activeRoom,
    leaveRoom,
    isRoomMinimized,
    setIsRoomMinimized,
    takeSeat,
    leaveSeat,
    toggleLockSeat,
    toggleMuteSeat,
    myMicMuted,
    toggleMyMic,
    currentUser,
    followedRoomHosts,
    toggleFollowHost,
    setOpenGiftStore,
    setSelectedGiftReceiver,
    roomMessages,
    sendRoomMessage,
    setOpenStorageModal,
    setOpenRechargeModal,
    setOpenAgencyModal,
    setOpenChatThread,
    conversations,
    setInternalProfileUser,
    setOpenInternalProfileModal,
    changeRoomBackground,
    updateRoom,
    isRtl,
    setOpenVipModal,
    setLevelsModalTab,
    setOpenLevelsModal,
  } = useApp();

  // Role detection: Owner vs Moderator vs Visitor
  const isOwner = Boolean(activeRoom && activeRoom.hostId === currentUser.id);
  // Room moderation is authorized by room ownership or room_moderators on the server.
  // Global super-admin status alone does not grant the room-moderation RPC permission.
  const isModerator = Boolean(activeRoom && (activeRoom.moderatorIds || []).includes(currentUser.id));
  const isVisitor = !isOwner && !isModerator;

  // Local interactive states
  const [showChatInput, setShowChatInput] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [unreadRoomMessages, setUnreadRoomMessages] = useState(0);
  const [copiedId, setCopiedId] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [bubblePosition, setBubblePosition] = useState<{ x: number; y: number }>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('totichat_room_bubble_position') || 'null');
      if (stored && Number.isFinite(stored.x) && Number.isFinite(stored.y)) return stored;
    } catch { /* use default */ }
    return { x: 16, y: 110 };
  });
  const bubbleDragRef = useRef<{ pointerId: number; startX: number; startY: number; x: number; y: number; moved: boolean } | null>(null);
  const [bubbleDragging, setBubbleDragging] = useState(false);
  const onBubblePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    bubbleDragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: bubblePosition.x, y: bubblePosition.y, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onBubblePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = bubbleDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 7) drag.moved = true;
    if (!drag.moved) return;
    setBubbleDragging(true);
    setBubblePosition({
      x: Math.max(0, Math.min(window.innerWidth - 150, drag.x + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 72, drag.y - dy)),
    });
  };
  const onBubblePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = bubbleDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    bubbleDragRef.current = null;
    if (drag.moved) {
      setBubblePosition(position => {
        const clamped = { x: Math.max(0, Math.min(window.innerWidth - 150, position.x)), y: Math.max(0, Math.min(window.innerHeight - 72, position.y)) };
        localStorage.setItem('totichat_room_bubble_position', JSON.stringify(clamped));
        return clamped;
      });
      window.setTimeout(() => setBubbleDragging(false), 100);
    } else {
      setIsRoomMinimized(false);
    }
  };
  // Screen clearance mode (مسح الشاشة للمشاهدة النقية)
  const [clearScreen, setClearScreen] = useState(false);

  // Owner & Management Modals
  const [showRoomInfoModal, setShowRoomInfoModal] = useState(false);
  const [showSeatLayouts, setShowSeatLayouts] = useState(false);
  const [roomManagementSection,setRoomManagementSection]=useState<'rules'|'auto_message'|'announcement'|'history'|null>(null);
  const [seatLayout, setSeatLayout] = useState<'grid'|'classic'|'circle'|'stage'>('grid');
  const [layoutSaving, setLayoutSaving] = useState(false);
  const [showExitOptions, setShowExitOptions] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [serverRoomMembers, setServerRoomMembers] = useState<Array<{user_id:string;display_name:string;avatar_url:string|null;seat_no:number|null}>>([]);
  const [serverMembersStatus, setServerMembersStatus] = useState<'loading'|'ready'|'error'>('loading');
  useEffect(() => {
    if (!activeRoom?.id || !stagingBackend) return;
    let mounted = true;
    let pending = false;
    const roomId = activeRoom.id;
    setServerRoomMembers([]);
    setServerMembersStatus('loading');
    const refreshMembers = async () => {
      if (pending) return;
      pending = true;
      try {
        const { data, error } = await stagingBackend!.rpc('phase2_room_members_visual_v2', { p_room_id: roomId });
        if (!mounted) return;
        if (error || !Array.isArray(data) || data.some(member =>
          !member || typeof member.user_id !== 'string' || !member.user_id ||
          typeof member.display_name !== 'string' ||
          (member.avatar_url !== null && typeof member.avatar_url !== 'string') ||
          (member.seat_no !== null && (!Number.isInteger(member.seat_no) || member.seat_no < 0))
        )) {
          setServerRoomMembers([]);
          setServerMembersStatus('error');
          return;
        }
        setServerRoomMembers(data);
        setServerMembersStatus('ready');
      } catch {
        if (mounted) {
          setServerRoomMembers([]);
          setServerMembersStatus('error');
        }
      } finally {
        pending = false;
      }
    };
    void refreshMembers();
    const refreshOnReturn = () => { if (!document.hidden) void refreshMembers(); };
    const interval = window.setInterval(refreshOnReturn, 30000);
    window.addEventListener('focus', refreshOnReturn);
    document.addEventListener('visibilitychange', refreshOnReturn);
    return () => {
      mounted = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshOnReturn);
      document.removeEventListener('visibilitychange', refreshOnReturn);
    };
  }, [activeRoom?.id]);

  const [showBansModal, setShowBansModal] = useState(false);
  const [roomBans, setRoomBans] = useState<Array<{ userId: string; name?: string; publicId?: number; avatar?: string; reason?: string; bannedByOwner?: boolean }>>([]);
  const [personalBlocks, setPersonalBlocks] = useState<Array<{ userId: string; name?: string; publicId?: number; avatar?: string }>>([]);
  const [banListError, setBanListError] = useState('');
  const [banActionBusy, setBanActionBusy] = useState(false);
  const moderationPendingRef = useRef(new Set<string>());
  const [moderationBusy, setModerationBusy] = useState(false);
  const refreshBanLists = async () => {
    if (!activeRoom || !stagingBackend) return;
    setBanListError('');
    const { data, error } = await stagingBackend.rpc('totichat_blocked_profiles', {
      p_room_id: isOwner || isModerator ? activeRoom.id : null,
    });
    if (error) throw error;
    setPersonalBlocks(data?.personal ?? []);
    setRoomBans(data?.room ?? []);
  };
  useEffect(() => {
    if (!showBansModal) return;
    void refreshBanLists().catch(error => setBanListError(error instanceof Error ? error.message : 'تعذر تحميل قائمة المحظورين'));
  }, [showBansModal, activeRoom?.id]);
  const setPersonalBlock = async (targetId: string, block: boolean) => {
    if (!stagingBackend || targetId === currentUser.id || banActionBusy) return;
    setBanActionBusy(true);
    try {
      const { data, error } = await stagingBackend.rpc('phase2_dm_block', { p_other_user: targetId, p_block: block });
      if (error || data !== true) throw error ?? new Error('لم يؤكد الخادم الحظر');
      await refreshBanLists();
      showToast(block ? 'تم الحظر الشخصي' : 'تم فك الحظر الشخصي');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'تعذر تغيير الحظر الشخصي');
    } finally { setBanActionBusy(false); }
  };
  const unbanRoomUser = async (targetId: string) => {
    if ((!isOwner && !isModerator) || !activeRoom || !stagingBackend || banActionBusy) return;
    setBanActionBusy(true);
    try {
      const { data, error } = await stagingBackend.rpc('phase2_room_moderate', {
        p_room_id: activeRoom.id, p_target: targetId, p_action: 'unban', p_request_id: crypto.randomUUID(),
      });
      if (error || data?.success !== true) throw error ?? new Error('لم يؤكد الخادم فك الحظر');
      await refreshBanLists();
      showToast('تم فك حظر الغرفة؛ يستطيع المستخدم الدخول مجدداً');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'تعذر فك حظر الغرفة');
    } finally { setBanActionBusy(false); }
  };

  const [showAgencyInfoModal, setShowAgencyInfoModal] = useState(false);
  const [showHostCenterModal, setShowHostCenterModal] = useState(false);
  const [showRoomStatsModal, setShowRoomStatsModal] = useState(false);
  const [roomGiftStats, setRoomGiftStats] = useState<{ today: number; week: number; month: number } | null>(null);
  const [roomGiftStatsError, setRoomGiftStatsError] = useState('');
  const [roomGiftRank, setRoomGiftRank] = useState<{ rank: number; roomCount: number } | null>(null);
  useEffect(() => {
    if (!activeRoom?.id || !stagingBackend) return;
    let active = true;
    const statsRoomId = activeRoom.id;
    setRoomGiftStats(null);
    setRoomGiftRank(null);
    setRoomGiftStatsError('');
    let pending = false;
    let refreshAgain = false;
    const refreshGiftTotals = async () => {
      if (!active || document.hidden) return;
      if (pending) {
        refreshAgain = true;
        return;
      }
      pending = true;
      try {
        do {
          refreshAgain = false;
          try {
            const { data, error } = await stagingBackend!.rpc('totichat_room_gift_totals', { p_room_id: statsRoomId });
            if (error) throw error;
            if (!active) return;
            if (!data || ['today', 'week', 'month'].some(key =>
              data[key] === null || data[key] === undefined || data[key] === '' ||
              !Number.isFinite(Number(data[key])) || Number(data[key]) < 0
            )) {
              throw new Error('استجابة إحصائيات الغرفة غير صالحة');
            }
            const totals = { today: Number(data.today), week: Number(data.week), month: Number(data.month) };
            setRoomGiftStats(totals);
            setRoomGiftStatsError('');
            const { data: rankData, error: rankError } = await stagingBackend!.rpc('totichat_room_gift_rank', { p_room_id: statsRoomId });
            if (!active) return;
            if (!rankError && rankData && Number.isSafeInteger(Number(rankData.rank)) && Number(rankData.rank) >= 1 &&
                Number.isSafeInteger(Number(rankData.room_count)) && Number(rankData.room_count) >= Number(rankData.rank)) {
              setRoomGiftRank({ rank: Number(rankData.rank), roomCount: Number(rankData.room_count) });
            } else {
              setRoomGiftRank(null);
            }
          } catch (error) {
            if (active) {
              setRoomGiftStats(null);
              setRoomGiftRank(null);
              setRoomGiftStatsError(error instanceof Error ? error.message : 'تعذر جلب إحصائيات الهدايا');
            }
          }
        } while (active && refreshAgain && !document.hidden);
      } finally {
        pending = false;
      }
    };
    void refreshGiftTotals();
    const refreshOnReturn = () => { if (!document.hidden) void refreshGiftTotals(); };
    const refreshAfterGift = (event: Event) => {
      if ((event as CustomEvent<string>).detail === statsRoomId) void refreshGiftTotals();
    };
    const refreshInterval = window.setInterval(refreshOnReturn, 30000);
    window.addEventListener('totichat:room-gift-confirmed', refreshAfterGift);
    window.addEventListener('focus', refreshOnReturn);
    document.addEventListener('visibilitychange', refreshOnReturn);
    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      window.removeEventListener('totichat:room-gift-confirmed', refreshAfterGift);
      window.removeEventListener('focus', refreshOnReturn);
      document.removeEventListener('visibilitychange', refreshOnReturn);
    };
  }, [activeRoom?.id]);

  const [showDecorationsModal, setShowDecorationsModal] = useState<'mic' | 'frame' | 'title' | null>(null);

  // Mic Seat Profile Popup (Image 1 for own account, Image 2 for other users)
  const [roomPublicId, setRoomPublicId] = useState<string>('—');
  useEffect(() => {
    let active = true;
    setRoomPublicId('—');
    if (!activeRoom?.id || !stagingBackend) return;
    void Promise.resolve(stagingBackend.rpc('totichat_room_owner_official_id', { p_room_id: activeRoom.id }))
      .then(({ data, error }) => {
        if (error) throw error;
        if (active && data != null) setRoomPublicId(String(data));
      }).catch(error => console.error('Room ID lookup failed:', error));
    return () => { active = false; };
  }, [activeRoom?.id]);

  const [selectedMicPublicId, setSelectedMicPublicId] = useState<string>('—');
  const [selectedMicUser, setSelectedMicUser] = useState<{ seatNumber: number; user: UserProfile } | null>(null);
  useEffect(() => {
    let active = true;
    setSelectedMicPublicId('—');
    const target = selectedMicUser?.user.id;
    if (!target || !stagingBackend) return;
    // The seat card must use the same effective ID as the profile page:
    // assigned special ID first, otherwise the six-digit public ID.
    void (async () => {
      const { data: special, error: specialError } = await stagingBackend.rpc('phase5_special_id_status', { p_target: target });
      if (specialError) console.warn('Seat special ID lookup failed:', specialError);
      const status = special as { assigned?: boolean; publicId?: string } | null;
      if (!active) return;
      if (!specialError && status?.assigned && status.publicId) {
        setSelectedMicPublicId(String(status.publicId));
        return;
      }
      const { data, error } = await stagingBackend.from('profiles').select('public_id').eq('id', target).maybeSingle();
      if (error) throw error;
      if (active && data?.public_id != null) setSelectedMicPublicId(String(data.public_id));
    })().catch(error => console.error('Seat profile ID lookup failed:', error));
    return () => { active = false; };
  }, [selectedMicUser?.user.id]);

  const [selectedMicAgencyName, setSelectedMicAgencyName] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setSelectedMicAgencyName(null);
    const userId = selectedMicUser?.user.id;
    if (!userId || !stagingBackend) return;
    void Promise.resolve(stagingBackend.rpc('staging_profile_agency', { p_user_id: userId }))
      .then(({ data, error }) => {
        if (error) throw error;
        if (active && data && typeof data.name === 'string') setSelectedMicAgencyName(data.name);
      })
      .catch(error => console.warn('Room user agency lookup failed:', error));
    return () => { active = false; };
  }, [selectedMicUser?.user.id]);

  const [selectedEmptySeat, setSelectedEmptySeat] = useState<number | null>(null);
  const [followedUsers, setFollowedUsers] = useState<Record<string, boolean>>({});
  const [mutedUsersLocally, setMutedUsersLocally] = useState<Record<string, boolean>>({});

  // Edit room form states
  const [editTitleInput, setEditTitleInput] = useState('');
  const [editAnnouncementInput, setEditAnnouncementInput] = useState('');
  const [editTagInput, setEditTagInput] = useState('');

  // Tabs: الكل | الدردشة | أخرى
  const [activeChatTab, setActiveChatTab] = useState<'all' | 'chat' | 'other'>('all');

  // Bottom Sheets & Popups
  const [showToolsDrawer, setShowToolsDrawer] = useState(false);
  const [showMessagesSheet, setShowMessagesSheet] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Room Background Changer States
  const [showChangeBgModal, setShowChangeBgModal] = useState(false);
  const [selectedBgPreview, setSelectedBgPreview] = useState<string>(activeRoom?.backgroundUrl || '/galaxy-room-bg.jpg');
  const [bgUploadError, setBgUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgReadGeneration = useRef(0);
  const bgSavePending = useRef(false);

  useEffect(() => {
    if (activeRoom) {
      bgReadGeneration.current += 1;
      // Reset room-specific draft state even when the next room has no background.
      setSelectedBgPreview(activeRoom.backgroundUrl || '/galaxy-room-bg.jpg');
      setBgUploadError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setEditTitleInput(activeRoom.title || '');
      setEditAnnouncementInput(activeRoom.announcement || '');
      setEditTagInput(activeRoom.tag || '');
    }
  }, [activeRoom?.id, activeRoom?.backgroundUrl]);

  const [showRoomModeModal, setShowRoomModeModal] = useState(false);

  // Tools Drawer Sub-Modals
  const [showMusicPlayerModal, setShowMusicPlayerModal] = useState(false);
  const [musicStatus, setMusicStatus] = useState<'stopped'|'playing'|'paused'>('stopped');
  const [musicFileName, setMusicFileName] = useState('');
  const [musicBusy, setMusicBusy] = useState(false);
  const [musicQueue, setMusicQueue] = useState<File[]>([]);
  const [musicSelectionOpen, setMusicSelectionOpen] = useState(false);
  const [musicSelection, setMusicSelection] = useState<File[]>([]);
  const [musicSelectionKeys, setMusicSelectionKeys] = useState<string[]>([]);
  const musicPickerRef = useRef<HTMLInputElement>(null);
  const musicPickerPendingRef = useRef(false);
  const musicPickerReturnAtRef = useRef(0);
  const openMusicPicker = () => {
    // Preserve the player while Android's document picker takes focus.
    setShowMusicPlayerModal(true);
    musicPickerPendingRef.current = true;
    // The native file input is activated by its label's real user gesture.
    // Avoid synthetic .click() on a display:none input in Android WebView.
  };
  const musicFileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;
  const cancelMusicSelection = () => { setMusicSelectionOpen(false); setMusicSelection([]); setMusicSelectionKeys([]); showToast('تم إلغاء إضافة الأغاني'); };
  const confirmMusicSelection = () => {
    const selected = musicSelection.filter(file => musicSelectionKeys.includes(musicFileKey(file)));
    if (!selected.length) { showToast('حدد أغنية واحدة على الأقل'); return; }
    setMusicQueue(previous => {
      const existing = new Set(previous.map(musicFileKey));
      return [...previous, ...selected.filter(file => !existing.has(musicFileKey(file)))];
    });
    setMusicSelectionOpen(false);
    setMusicSelection([]);
    setMusicSelectionKeys([]);
    showToast(`تمت إضافة ${selected.length} أغنية إلى قائمة التشغيل`);
  };
  const [musicIndex, setMusicIndex] = useState(-1);
  const [musicShuffle, setMusicShuffle] = useState(false);
  const [musicRepeat, setMusicRepeat] = useState(false);
  const [musicVolume, setMusicVolume] = useState(75);
  const [musicProgress, setMusicProgress] = useState({ position: 0, duration: 0 });
  useEffect(() => {
    if (!showMusicPlayerModal || musicStatus === 'stopped') return;
    const timer = window.setInterval(() => setMusicProgress(getRoomMusicProgress()), 500);
    return () => window.clearInterval(timer);
  }, [showMusicPlayerModal, musicStatus]);
  const playQueuedMusic = async (file: File, index: number) => {
    if (!activeRoom || musicBusy) return;
    setMusicBusy(true);
    try {
      await playRoomMusic(activeRoom.id, file);
      setRoomMusicVolume(musicVolume / 100);
      musicRoomRef.current = activeRoom.id;
      setMusicIndex(index);
      setMusicFileName(file.name);
      setMusicStatus('playing');
    } catch (error) {
      setMusicStatus('stopped');
      console.error('Room music failed', error);
      showToast('تعذر بث الموسيقى: ' + (error instanceof Error ? error.message : 'خطأ'));
    } finally { setMusicBusy(false); }
  };
  const switchQueuedMusic = (direction: number) => {
    if (!musicQueue.length || musicBusy) return;
    const next = musicShuffle ? Math.floor(Math.random() * musicQueue.length) : (musicIndex + direction + musicQueue.length) % musicQueue.length;
    void playQueuedMusic(musicQueue[next], next);
  };
  const musicRoomRef = useRef<string | null>(null);
  const musicMutedRef = useRef(myMicMuted);
  useEffect(() => {
    if (musicRoomRef.current && (musicRoomRef.current !== activeRoom?.id || (!musicMutedRef.current && myMicMuted))) {
      void stopRoomMusic();
      setMusicStatus('stopped');
      setMusicFileName('');
      musicRoomRef.current = null;
    }
    musicMutedRef.current = myMicMuted;
  }, [activeRoom?.id, myMicMuted]);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [tasksClaimed, setTasksClaimed] = useState<Record<string, boolean>>({});

  // Audio / Sound states
  const roomSoundMuted = false;
  const [audioModeHQ, setAudioModeHQ] = useState(true);

  // Floating animated emojis
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; char: string; left: number }[]>([]);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatNearBottomRef = useRef(true);
  const chatScrollPositionRef = useRef(0);
  const chatAnchorRef = useRef<{ id: string; offset: number } | null>(null);
  const chatProgrammaticScrollRef = useRef<number | null>(null);
  const seenRoomMessagesRef = useRef<{ roomId: string; ids: string[] } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenUserProfile = (targetUser: UserProfile) => {
    sounds.playClick();
    setInternalProfileUser(targetUser);
    setOpenInternalProfileModal(true);
  };

  const handleCopyId = (idStr: string) => {
    sounds.playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(idStr);
    }
    setCopiedId(true);
    showToast(`تم نسخ معرف الحساب: ${idStr} 📋`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const chatSubmitLockedRef = useRef(false);
  useEffect(() => {
    // Room chat drafts are session-local; never carry text into another room.
    setChatMessage('');
    setShowChatInput(false);
    chatSubmitLockedRef.current = false;
  }, [activeRoom?.id]);

  useEffect(() => {
    const recoverRejectedDraft = (event: Event) => {
      const detail = (event as CustomEvent<{ roomId: string; text: string }>).detail;
      if (!detail || detail.roomId !== activeRoom?.id) return;
      setChatMessage(previous => previous.trim() ? previous : detail.text);
      setShowChatInput(true);
    };
    window.addEventListener('totichat:room-message-failed', recoverRejectedDraft);
    return () => window.removeEventListener('totichat:room-message-failed', recoverRejectedDraft);
  }, [activeRoom?.id]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatSubmitLockedRef.current || !chatMessage.trim() || !activeRoom) return;
    if (chatMessage.trim().length > 1000) {
      showToast('الرسالة طويلة جداً. الحد الأقصى 1000 حرف.');
      return;
    }
    chatSubmitLockedRef.current = true;
    sendRoomMessage(activeRoom.id, chatMessage.trim());
    setChatMessage('');
    setShowChatInput(false);
    sounds.playClick();
    // Prevent duplicate submissions in the same event burst without blocking later messages.
    window.setTimeout(() => { chatSubmitLockedRef.current = false; }, 500);
  };

  const triggerFloatingEmoji = (emoji: string) => {
    sounds.playClick();
    const id = Date.now();
    const left = Math.random() * 60 + 20;
    setFloatingEmojis((prev) => [...prev, { id, char: emoji, left }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 2500);
  };

  useEffect(() => {
    if (!showChangeBgModal) bgReadGeneration.current += 1;
  }, [showChangeBgModal]);

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const readGeneration = ++bgReadGeneration.current;
    // Prevent an earlier valid preview from being saved after a failed new selection.
    setSelectedBgPreview('');
    setBgUploadError(null);

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setBgUploadError('صيغة غير مدعومة. يرجى اختيار صورة JPG أو PNG أو WEBP.');
      e.target.value = '';
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setBgUploadError('حجم الصورة كبير جداً. الحد الأقصى المسموح به هو 5 ميجابايت.');
      e.target.value = '';
      return;
    }

    setBgUploadError(null);
    const reader = new FileReader();
    reader.onerror = () => {
      if (readGeneration !== bgReadGeneration.current) return;
      setSelectedBgPreview('');
      setBgUploadError('تعذر قراءة الصورة. يرجى اختيار صورة أخرى.');
    };
    reader.onload = (event) => {
      if (readGeneration !== bgReadGeneration.current) return;
      const dataUrl = event.target?.result as string;
      if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')) {
        setSelectedBgPreview(dataUrl);
      } else {
        setBgUploadError('تعذر تحميل معاينة الصورة. اختر صورة أخرى.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBackground = async () => {
    if (!activeRoom) return;
    if (activeRoom.hostId !== currentUser.id) {
      showToast('تغيير خلفية الغرفة متاح للمالك فقط.');
      return;
    }
    if (bgUploadError) {
      showToast('يرجى معالجة خطأ الصورة قبل حفظ الخلفية.');
      return;
    }
    if (!selectedBgPreview) {
      showToast('يرجى اختيار خلفية صالحة.');
      return;
    }
    if (bgSavePending.current) return;
    bgSavePending.current = true;
    try {
      await changeRoomBackground(activeRoom.id, selectedBgPreview);
      sounds.playLevelUp();
      showToast('تم حفظ الخلفية على الخادم بنجاح.');
      setShowChangeBgModal(false);
    } catch (error) {
      console.error('Room background save failed:', error);
      showToast(error instanceof Error ? error.message : 'فشل حفظ الخلفية على الخادم.');
    } finally {
      bgSavePending.current = false;
    }
  };

  const [coverSaving,setCoverSaving]=useState(false);
  const [coverPreview,setCoverPreview]=useState<string|null>(null);
  const handleRoomCoverFile=async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];e.target.value='';
    if(!file||!activeRoom||!stagingBackend)return;
    if(!isOwner){showToast('تغيير صورة الغرفة للمالك فقط');return;}
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024){showToast('اختر PNG أو JPG أو WEBP بحجم أقل من 5MB');return;}
    setCoverSaving(true);
    try{
      const bitmap=await createImageBitmap(file);
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
      const ctx=canvas.getContext('2d');if(!ctx)throw new Error('تعذر تجهيز الصورة');
      const side=Math.min(bitmap.width,bitmap.height);
      ctx.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,512,512);
      bitmap.close();
      const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('تعذر معالجة الصورة')),'image/webp',0.85));
      const path=activeRoom.id+'/cover-'+Date.now()+'.webp';
      const {error:uploadError}=await stagingBackend.storage.from('totichat-room-images').upload(path,blob,{contentType:'image/webp',upsert:false});
      if(uploadError)throw uploadError;
      const {data,error}=await stagingBackend.rpc('phase2_room_customize',{p_room_id:activeRoom.id,p_cover_path:path});
      if(error||data!==true)throw error||new Error('الخادم لم يؤكد حفظ الصورة');
      const {data:signed,error:signError}=await stagingBackend.storage.from('totichat-room-images').createSignedUrl(path,3600);
      if(signError||!signed?.signedUrl)throw signError||new Error('تعذر معاينة الصورة المحفوظة');
      setCoverPreview(signed.signedUrl);showToast('تم تغيير صورة الغرفة بنجاح');
    }catch(error){showToast(error instanceof Error?error.message:'فشل تغيير صورة الغرفة');}
    finally{setCoverSaving(false);}
  };
  const [roomInfoSaving, setRoomInfoSaving] = useState(false);
  const handleSaveRoomInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoom || roomInfoSaving) return;
    if (!isOwner) {
      showToast('تعديل معلومات الغرفة متاح لمالكها فقط.');
      return;
    }
    const title = editTitleInput.trim();
    const welcome = editAnnouncementInput.trim();
    if (title.length < 2 || title.length > 60 || welcome.length > 500) {
      showToast('اسم الغرفة من حرفين إلى 60 حرفاً ورسالة الترحيب حتى 500 حرف.');
      return;
    }
    setRoomInfoSaving(true);
    try {
      await updateRoom(activeRoom.id, { title, announcement: welcome });
      showToast('تم حفظ اسم الغرفة ورسالة الترحيب على الخادم.');
      setShowRoomInfoModal(false);
    } catch (error) {
      console.error('Room info save failed:', error);
      showToast(error instanceof Error ? error.message : 'تعذر حفظ معلومات الغرفة.');
    } finally {
      setRoomInfoSaving(false);
    }
  };

  const handleToggleModerator = async (userId: string, userName: string) => {
    if (!activeRoom || !isOwner || !stagingBackend) {
      showToast('تعيين المشرفين يتطلب ملكية الغرفة والاتصال بالخادم.');
      return;
    }
    const roomId = activeRoom.id;
    if (userId === currentUser.id || userId === activeRoom.hostId || moderationPendingRef.current.has(userId)) return;
    moderationPendingRef.current.add(userId);
    setModerationBusy(true);
    const isMod = (activeRoom.moderatorIds || []).includes(userId);
    try {
      const { data, error } = await stagingBackend.rpc('phase2_room_moderate', {
        p_room_id: roomId, p_target: userId,
        p_action: isMod ? 'revoke_moderator' : 'grant_moderator',
        p_request_id: crypto.randomUUID(),
      });
      if (error || !data?.success) throw error ?? new Error('Server did not confirm role change');
      showToast(isMod ? `تم سحب إشراف ${userName}` : `تم منح ${userName} صلاحية المشرف`);
      window.dispatchEvent(new CustomEvent('totichat:room-moderators-changed', { detail: roomId }));
      // Preserve the active voice session; do not reload the entire app.
    } catch (error) {
      console.error('Moderator update failed:', error);
      showToast('رفض الخادم تغيير الصلاحية. تحقق من عضوية المستخدم وصلاحية المالك.');
    } finally {
      moderationPendingRef.current.delete(userId);
      setModerationBusy(moderationPendingRef.current.size > 0);
    }
  };

  const handleAllowMic = async (userId: string) => {
    if (!activeRoom || (!isOwner && !isModerator) || !stagingBackend) return;
    try {
      const { data, error } = await stagingBackend.rpc('phase2_room_moderate', {
        p_room_id: activeRoom.id, p_target: userId,
        p_action: 'allow_mic', p_request_id: crypto.randomUUID(),
      });
      if (error || !data?.success) throw error ?? new Error('Permission not confirmed');
      showToast('تم رفع حظر المايك من الخادم. العضو يفتح مايكه بنفسه.');
    } catch (error) {
      console.error('Allow microphone failed:', error);
      showToast('الخادم رفض رفع حظر المايك.');
    }
  };

  const handleVoiceModeration = async (userId: string, action: 'kick' | 'ban' | 'mute' | 'release_seat') => {
    if (!activeRoom || !stagingBackend || (!isOwner && !isModerator)) {
      showToast('هذا الأمر متاح لمالك الغرفة والمشرف فقط.');
      return;
    }
    if (userId === currentUser.id || userId === activeRoom.hostId) {
      showToast('لا يمكن تطبيق هذا الأمر على المالك أو نفسك.');
      return;
    }
    const reason = action === 'ban' ? window.prompt('سبب الحظر (5 أحرف على الأقل):', 'مخالفة قواعد الغرفة') : null;
    if (action === 'ban' && (!reason || reason.trim().length < 5 || reason.length > 300)) return;
    if (moderationPendingRef.current.has(userId)) return;
    moderationPendingRef.current.add(userId);
    setModerationBusy(true);
    const requestId = crypto.randomUUID();
    try {
      const { data, error } = await stagingBackend.functions.invoke('phase2-voice-moderate', {
        body: { roomId: activeRoom.id, targetId: userId, action, requestId, ...(reason ? { reason: reason.trim() } : {}) },
      });
      if (error || data?.success !== true || data?.sfuDisconnected !== true) {
        console.error('Voice moderation not confirmed:', error, data);
        showToast(data?.databaseCommitted
          ? 'تم تحديث الخادم لكن فصل الصوت غير مؤكد. تحقق من حالة العضو.'
          : 'تعذر تنفيذ الأمر. تحقق من الصلاحيات واتصال الصوت.');
        return;
      }
      showToast(action === 'ban' ? 'تم حظر العضو وطرده؛ لن يستطيع العودة إلا بعد فك الحظر' : action === 'kick' ? 'تم طرد العضو من الغرفة' : action === 'mute'
        ? 'تم كتم مايك العضو من الخادم' : 'تم إنزال العضو من المقعد');
    } catch (error) {
      console.error('Voice moderation failed:', error);
      showToast('فشل أمر الإدارة، لم يتم تأكيد النتيجة.');
    } finally {
      moderationPendingRef.current.delete(userId);
      setModerationBusy(moderationPendingRef.current.size > 0);
    }
  };

  const handleKickMember = (userId: string, _userName: string) => {
    void handleVoiceModeration(userId, 'kick');
  };

  const handleApplyDecoration = (type: 'mic' | 'frame' | 'title', value: string) => {
    if (!activeRoom) return;
    if (!isOwner && !currentUser.isSuperAdmin) {
      sounds.playError();
      showToast('🔒 تخصيص زينة الغرفة متاح فقط لمالك الغرفة');
      return;
    }
    if (type === 'mic') {
      updateRoom(activeRoom.id, { micTheme: value });
      showToast(`تم تطبيق مظهر الميكروفون الجديد 🎙️✨`);
    } else if (type === 'frame') {
      updateRoom(activeRoom.id, { roomFrameTheme: value });
      showToast(`تم تطبيق إطار المقاعد الجديد 👑✨`);
    } else if (type === 'title') {
      updateRoom(activeRoom.id, { titleColorTheme: value });
      showToast(`تم تطبيق لون اللقب الملوّن 🎨✨`);
    }
    sounds.playLevelUp();
  };

  const getMicColor = () => {
    if (activeRoom?.micTheme === 'gold') return 'text-amber-400';
    if (activeRoom?.micTheme === 'cyan') return 'text-cyan-300';
    if (activeRoom?.micTheme === 'ruby') return 'text-rose-400';
    return 'text-[#26d0b2]';
  };

  const getSeatBorder = (isOccupied: boolean, vipLevel?: number) => {
    if (isOccupied && vipLevel && vipLevel > 0) {
      return 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)]';
    }
    if (activeRoom?.roomFrameTheme === 'gold') {
      return 'border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.3)]';
    }
    if (activeRoom?.roomFrameTheme === 'cyan') {
      return 'border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]';
    }
    if (activeRoom?.roomFrameTheme === 'ruby') {
      return 'border-rose-400/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]';
    }
    return 'border-purple-400/35 shadow-[0_0_12px_rgba(168,85,247,0.25)]';
  };

  const getTitleColor = () => {
    if (activeRoom?.titleColorTheme === 'gold') return 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]';
    if (activeRoom?.titleColorTheme === 'cyan') return 'text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]';
    if (activeRoom?.titleColorTheme === 'pink') return 'text-pink-300 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]';
    return 'text-white';
  };

  // VIP entrance is shown once on a fresh room entry, never on every render.
  const [vipEntrance, setVipEntrance] = useState(false);
  const lastEnteredRoom = useRef<string | null>(null);
  useEffect(() => {
    if (!activeRoom || isRoomMinimized) {
      if (!activeRoom) lastEnteredRoom.current = null;
      setVipEntrance(false);
      return;
    }
    if (lastEnteredRoom.current === activeRoom.id) return;
    lastEnteredRoom.current = activeRoom.id;
    if (currentUser.vipLevel < 1) return;
    setVipEntrance(true);
    const timer = window.setTimeout(() => setVipEntrance(false), 9000);
    return () => window.clearTimeout(timer);
  }, [activeRoom?.id, isRoomMinimized, currentUser.vipLevel]);

  // Android system back must never leave an active voice session abruptly.
  useEffect(() => {
    if (!activeRoom) return;
    let disposed = false;
    let listener: { remove: () => Promise<void> } | undefined;
    void CapacitorApp.addListener('backButton', () => {
      // Android's native document picker emits back while handing the file to WebView.
      // Ignore it until the file input has received its change event.
      if (musicPickerPendingRef.current || Date.now() - musicPickerReturnAtRef.current < 2000) return;
      if (isRoomMinimized) {
        setIsRoomMinimized(false);
      } else if (showExitOptions) {
        setShowExitOptions(false);
      } else if (showChatInput) {
        setShowChatInput(false);
        setShowEmojiPicker(false);
      } else if (showEmojiPicker) {
        setShowEmojiPicker(false);
      } else if (musicSelectionOpen) {
        setMusicSelectionOpen(false);
      } else if (showMusicPlayerModal) {
        setShowMusicPlayerModal(false);
      } else if (showTasksModal) {
        setShowTasksModal(false);
      } else if (showChangeBgModal) {
        setShowChangeBgModal(false);
      } else if (showDecorationsModal !== null) {
        setShowDecorationsModal(null);
      } else if (showRoomStatsModal) {
        setShowRoomStatsModal(false);
      } else if (showHostCenterModal) {
        setShowHostCenterModal(false);
      } else if (showAgencyInfoModal) {
        setShowAgencyInfoModal(false);
      } else if (showMembersModal) {
        setShowMembersModal(false);
      } else if (showMessagesSheet) {
        setShowMessagesSheet(false);
      } else if (showToolsDrawer) {
        setShowToolsDrawer(false);
      } else if (showRoomModeModal) {
        setShowRoomModeModal(false);
      } else if (showRoomInfoModal) {
        setShowRoomInfoModal(false);
      } else if (selectedMicUser) {
        setSelectedMicUser(null);
      } else if (selectedEmptySeat !== null) {
        setSelectedEmptySeat(null);
      } else {
        setShowExitOptions(true);
      }
    }).then(handle => { if (disposed) void handle.remove(); else listener = handle; });
    return () => { disposed = true; if (listener) void listener.remove(); };
  }, [activeRoom?.id, isRoomMinimized, showExitOptions, showChatInput, showEmojiPicker, showMusicPlayerModal, showTasksModal, showChangeBgModal, showDecorationsModal, showRoomStatsModal, showHostCenterModal, showAgencyInfoModal, showMembersModal, showMessagesSheet, showToolsDrawer, showRoomModeModal, showRoomInfoModal, selectedMicUser, selectedEmptySeat, setIsRoomMinimized]);

  // Reconcile messages missed while the room was minimized before showing the chat again.
  useEffect(() => {
    if (!activeRoom?.id || isRoomMinimized) return;
    window.dispatchEvent(new CustomEvent('totichat:room-message-refresh', { detail: activeRoom.id }));
  }, [activeRoom?.id, isRoomMinimized]);

  // Get current messages
  const currentMessages = activeRoom ? roomMessages[activeRoom.id] || [] : [];
  useEffect(() => {
    if (!activeRoom?.id) {
      seenRoomMessagesRef.current = null;
      return;
    }
    const nextIds = currentMessages.map(message => message.id);
    const previous = seenRoomMessagesRef.current;
    if (previous?.roomId === activeRoom.id && previous.ids.length && !chatNearBottomRef.current && !isRoomMinimized) {
      // Only messages after the previously newest message count as unread.
      // Backfilled history and a fully rotated 100-message window are ambiguous:
      // do not label old messages as new in either case.
      const previousLatestId = previous.ids[previous.ids.length - 1];
      const previousLatestIndex = nextIds.indexOf(previousLatestId);
      if (previousLatestIndex >= 0) {
        const previousIds = new Set(previous.ids);
        const newCount = nextIds.slice(previousLatestIndex + 1).filter(id => !previousIds.has(id)).length;
        if (newCount) setUnreadRoomMessages(count => Math.min(99, count + newCount));
      }
    }
    seenRoomMessagesRef.current = { roomId: activeRoom.id, ids: nextIds };
  }, [activeRoom?.id, currentMessages, isRoomMinimized]);

  useEffect(() => {
    if (!isRoomMinimized && chatNearBottomRef.current) setUnreadRoomMessages(0);
  }, [isRoomMinimized]);

  useEffect(() => {
    chatNearBottomRef.current = true;
    chatScrollPositionRef.current = 0;
    chatAnchorRef.current = null;
    chatProgrammaticScrollRef.current = null;
    setUnreadRoomMessages(0);
  }, [activeRoom?.id]);

  useLayoutEffect(() => {
    const container = chatScrollRef.current;
    if (!container) return;
    if (chatNearBottomRef.current) {
      container.scrollTop = container.scrollHeight;
    } else {
      const anchor = chatAnchorRef.current;
      const anchorElement = anchor
        ? Array.from(container.querySelectorAll<HTMLElement>('[data-room-message-id]'))
            .find(element => element.dataset.roomMessageId === anchor.id)
        : null;
      if (anchorElement && anchor) {
        container.scrollTop = anchorElement.offsetTop - container.offsetTop - anchor.offset;
      } else {
        container.scrollTop = chatScrollPositionRef.current;
      }
    }
    chatProgrammaticScrollRef.current = container.scrollTop;
  }, [activeRoom?.id, isRoomMinimized, currentMessages, showChatInput]);

  useEffect(()=>{const backend=stagingBackend;if(!activeRoom||!backend)return;let alive=true;const load=async()=>{const {data,error}=await backend.rpc('totichat_room_seat_layout',{p_room_id:activeRoom.id});if(alive&&!error&&['grid','classic','circle','stage'].includes(data))setSeatLayout(data);};void load();const timer=window.setInterval(()=>void load(),15000);return()=>{alive=false;window.clearInterval(timer);};},[activeRoom?.id]);

  if (!activeRoom) return null;

  // Floating Minimized Bubble
  if (isRoomMinimized) {
    return (
      <div
        onPointerDown={onBubblePointerDown}
        onPointerMove={onBubblePointerMove}
        onPointerUp={onBubblePointerUp}
        onPointerCancel={() => { bubbleDragRef.current = null; setBubbleDragging(false); }}
        style={{ left: bubblePosition.x, bottom: bubblePosition.y, touchAction: 'none', maxWidth: 'calc(100vw - 12px)' }}
        className={`fixed z-50 flex items-center gap-2 bg-[#1b0d3a]/95 border border-purple-400/50 rounded-full py-1.5 px-3 shadow-[0_4px_20px_rgba(147,51,234,0.6)] cursor-grab active:cursor-grabbing backdrop-blur-md select-none ${bubbleDragging ? 'scale-105' : ''}`}
        dir="rtl"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden border border-purple-300">
          <img
            src="/galaxy-room-bg.jpg"
            alt="Room"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[11px] font-black text-white">{activeRoom.title || 'غرفة صوتية'}</span>
          <span className="text-[9px] text-purple-200">انقر للعودة 🎙️</span>
        </div>
        <Maximize2 className="w-4 h-4 text-purple-300 mr-1" />
      </div>
    );
  }

  // Seats map from activeRoom (seats 1 to 15)
  const roomSeats = activeRoom.seats || [];
  const getSeat = (num: number): MicSeat => {
    return (
      roomSeats.find((s) => s.seatNumber === num) || {
        seatNumber: num,
        user: null,
        isLocked: false,
        isMuted: false,
        isSpeaking: false,
      }
    );
  };

  const getSeatPosition = (n:number):React.CSSProperties => {
    if(seatLayout==='circle'){const angle=(n-1)*2*Math.PI/15;return {position:'absolute',left:'calc(50% + '+(Math.sin(angle)*40)+'% - 28px)',top:'calc(50% - '+(Math.cos(angle)*39)+'% - 28px)'};}
    if(seatLayout==='classic')return {gridColumn:n<=3?n+1:((n-4)%4)+1,gridRow:n<=3?1:Math.floor((n-4)/4)+2};
    if(seatLayout==='stage')return {gridColumn:n<=3?n+1:((n-4)%5)+1,gridRow:n<=3?1:Math.floor((n-4)/5)+2};
    return {};
  };
  const saveSeatLayout=async(layout:'grid'|'classic'|'circle'|'stage')=>{if(!activeRoom||!stagingBackend||layoutSaving||(!isOwner&&!currentUser.isSuperAdmin))return;setLayoutSaving(true);try{const {data,error}=await stagingBackend.rpc('totichat_room_seat_layout',{p_room_id:activeRoom.id,p_layout:layout});if(error||data!==layout)throw error||new Error('لم يؤكد الخادم الحفظ');setSeatLayout(layout);setShowSeatLayouts(false);showToast('تم حفظ ترتيب المقاعد لجميع الأعضاء');}catch(e){showToast(e instanceof Error?e.message:'تعذر حفظ ترتيب المقاعد');}finally{setLayoutSaving(false);}};
  // 15 Seats Layout: 3 Rows of 5 Seats
  // Row 1: NO 01, NO 02, NO 03, NO 04, NO 05
  const row1Numbers = [1, 2, 3, 4, 5];
  // Row 2: NO 06, NO 07, NO 08, NO 09, NO 10
  const row2Numbers = [6, 7, 8, 9, 10];
  // Row 3: NO 11, NO 12, NO 13, NO 14, NO 15
  const row3Numbers = [11, 12, 13, 14, 15];

  const myCurrentSeat = roomSeats.find((s) => s.user?.id === currentUser.id);
  const isUserOnAnySeat = !!myCurrentSeat;

  // Handle clicking on any mic seat:
  // - If occupied: opens the exact user profile popup matching the uploaded screenshot!
  // - If empty: opens the action popup ("اصعد بنفسي" & "قفل المايكرفون", or if already on mic: "انتقل" & "مغادرة المايكرفون")
  const handleSeatClick = (seatNum: number) => {
    sounds.playClick();
    const seat = getSeat(seatNum);
    const isOccupied = !!seat.user;

    // 1. If seat is occupied (clicking on circular avatar)
    if (isOccupied && seat.user) {
      setSelectedMicUser({ seatNumber: seatNum, user: seat.user });
      return;
    }

    // 2. If seat is empty: open the action popup for this seat!
    setSelectedEmptySeat(seatNum);
  };

  const hostAccountId = roomPublicId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black select-none overflow-hidden font-['Cairo',sans-serif]"
      dir="rtl"
    >
      {vipEntrance && (
        <div className="toti-vip-entry-track absolute top-20 inset-x-0 z-[90] pointer-events-none overflow-hidden" dir="ltr">
          <div className={`toti-vip-entry-banner relative flex items-center gap-2 w-max max-w-[82vw] min-h-9 rounded-full border px-3 py-1.5 shadow-lg ${currentUser.vipLevel >= 7 ? 'border-amber-300 bg-gradient-to-r from-[#2b123f] via-[#71325d] to-[#3a1845] text-amber-100 shadow-amber-500/30' : currentUser.vipLevel >= 4 ? 'border-fuchsia-300 bg-gradient-to-r from-[#241238] to-[#542464] text-fuchsia-100' : 'border-emerald-300 bg-gradient-to-r from-[#112e32] to-[#244d47] text-emerald-100'}`} dir="rtl">
            <Crown className="w-4 h-4 shrink-0 text-amber-300" aria-hidden="true" />
            <span className="text-[10px] font-black whitespace-nowrap">VIP {currentUser.vipLevel}</span>
            <span className="text-[11px] font-bold truncate max-w-[42vw]">{currentUser.nickname || currentUser.name || 'عضو VIP'} دخل الغرفة</span>
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-200" aria-hidden="true" />
          </div>
        </div>
      )}

      {showExitOptions && (
        <div
          className="absolute inset-0 z-[120] flex items-center justify-center bg-slate-950/55 backdrop-blur-lg px-6"
          onClick={() => setShowExitOptions(false)}
        >
          <div
            className="w-full max-w-xs overflow-hidden rounded-[28px] border border-white/25 bg-gradient-to-br from-slate-900/90 via-[#152c32]/90 to-[#071b1b]/95 p-5 shadow-[0_22px_65px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
            onClick={event => event.stopPropagation()}
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-label="خيارات الغرفة"
          >
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-white/25" />
            <h3 className="mb-5 text-center text-lg font-black text-[#f8df9a]">خيارات الغرفة</h3>
            <div className="flex flex-col gap-3">
              <button type="button" onClick={() => setShowExitOptions(false)} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 py-3.5 font-bold text-white transition active:scale-[0.98]">
                <Maximize2 className="h-5 w-5 text-emerald-200" /> للأمام — العودة إلى الغرفة
              </button>
              <button type="button" onClick={() => { setShowExitOptions(false); setIsRoomMinimized(true); }} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-300/35 bg-amber-300/10 py-3.5 font-bold text-amber-100 transition active:scale-[0.98]">
                <Maximize2 className="h-5 w-5" /> تصغير الغرفة
              </button>
              <button type="button" onClick={() => { setShowExitOptions(false); leaveRoom(); }} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-300/35 bg-rose-500/15 py-3.5 font-bold text-rose-100 transition active:scale-[0.98]">
                <LogOut className="h-5 w-5" /> الخروج من الغرفة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-14 z-50 px-4 py-2 rounded-full bg-black/90 border border-purple-500/60 text-white text-xs font-bold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 max-w-[90%] text-center">
          {toastMessage}
        </div>
      )}

      {/* Main Room Viewport Container (Matching Mobile Aspect Ratio) */}
      <div className="relative w-full max-w-md h-full flex flex-col justify-between overflow-x-hidden overflow-y-auto overscroll-y-contain shadow-2xl bg-[#0d0426] box-border" style={{ paddingTop: "max(10px, env(safe-area-inset-top, 0px))", paddingBottom: "max(10px, env(safe-area-inset-bottom, 0px))" }}>
        {/* =========================================================================
            1. ROOM BACKGROUND: Deep cosmic galaxy with starry dust & nebula
            ========================================================================= */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src={activeRoom.backgroundUrl || '/galaxy-room-bg.jpg'}
            alt="خلفية الغرفة الكونية"
            className="w-full h-full object-cover object-center"
          />
          {/* Subtle starry dark vignette overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a031e]/50 via-transparent to-[#0a031e]/85" />

          {/* Twinkling ambient star particles */}
          <div className="absolute top-1/4 left-8 text-cyan-200 text-xs animate-ping pointer-events-none opacity-70">
            ✦
          </div>
          <div className="absolute top-1/3 right-12 text-purple-200 text-xs animate-pulse pointer-events-none opacity-80">
            ★
          </div>
          <div className="absolute top-2/3 left-14 text-teal-200 text-[10px] animate-pulse pointer-events-none opacity-60">
            ✦
          </div>
        </div>

        {/* Floating animated emojis */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {floatingEmojis.map((item) => (
            <span
              key={item.id}
              style={{ right: `${item.left}%` }}
              className="absolute bottom-24 text-3xl animate-float-fade"
            >
              {item.char}
            </span>
          ))}
        </div>

        {/* =========================================================================
            2. TOP HEADER SECTION (Matching Screenshot 1 & 2)
            - Left: Power button (⏻), Share button (↗), Seat 1 Badge (👑 ○ 1)
            - Right: Capsule Card: Heart in teal circle, "العراق الع...", ID:5716905 (يحمل معرف الحساب)
            - Directly under Capsule: {roomGiftStats ? roomGiftStats.month.toLocaleString('en-US') + ' 🪙' : '—'} (كأس الروم)
            ========================================================================= */}
        <div className="relative z-20 pt-2 pb-1 px-3.5 flex flex-col gap-1.5">
          {/* Main Action Header Row */}
          <div className="flex items-start justify-between mt-1">
            {/* Left side: Power button, Share button, Crown Seat 1 */}
            <div className="flex flex-col items-start gap-2">
              <div className="flex items-center gap-2">
                {/* Power button (Leave room) */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    setShowExitOptions(true);
                  }}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white/90 flex items-center justify-center transition active:scale-95 cursor-pointer"
                  title="خيارات الغرفة"
                >
                  <Power className="w-5 h-5 text-white stroke-[2.2]" />
                </button>

                {/* Share / External button */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    const roomReference = roomPublicId !== '—' ? roomPublicId : activeRoom.id;
                    const shareText = `انضم إلى غرفتي في TotiChat 🎙️\nالغرفة: ${activeRoom.title}\nرقم الغرفة: ${roomReference}`;
                    void (async () => {
                      try {
                        if (navigator.share) {
                          await navigator.share({ title: activeRoom.title, text: shareText });
                          return;
                        }
                        if (!navigator.clipboard) throw new Error('Clipboard unavailable');
                        await navigator.clipboard.writeText(shareText);
                        showToast('تم نسخ معلومات الغرفة للمشاركة');
                      } catch (error) {
                        if (error instanceof Error && error.name === 'AbortError') return;
                        showToast('تعذرت المشاركة. حاول مرة أخرى.');
                      }
                    })();
                  }}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white/90 flex items-center justify-center transition active:scale-95 cursor-pointer"
                  title="مشاركة الغرفة"
                >
                  <ExternalLink className="w-5 h-5 text-white stroke-[2.2]" />
                </button>


                {/* Owner quick settings gear */}
                {isOwner && (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setShowRoomInfoModal(true);
                    }}
                    className="w-8 h-8 rounded-full bg-amber-400/20 hover:bg-amber-400/35 border border-amber-400/50 text-amber-300 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-sm"
                    title="إدارة غرفتي الشخصية 👑"
                  >
                    <Settings className="w-4 h-4 text-amber-300 stroke-[2.2]" />
                  </button>
                )}
              </div>

              {/* Seat 1 Crown Ring / Ranking Badge */}
              <div
                onClick={() => {
                  sounds.playClick();
                  setShowMembersModal(true);
                }}
                className="flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition pt-1"
                title="عرض أعضاء الغرفة"
              >
                <div className="relative w-8 h-8 rounded-full border-2 border-amber-300/80 bg-purple-950/60 flex items-center justify-center shadow-md">
                  <Users className="w-4 h-4 text-amber-200" />
                </div>
                <span className="text-xs font-mono font-bold text-white/90">{(serverMembersStatus === 'ready' ? serverRoomMembers.length : serverMembersStatus === 'error' ? '—' : activeRoom.listenersCount)}</span>
                <div className="flex items-center -space-x-2 space-x-reverse" aria-label="صور أعضاء الغرفة">
                  {(serverMembersStatus === 'ready' ? serverRoomMembers.map(member => member.avatar_url).filter((avatar): avatar is string => typeof avatar === 'string' && /^https?:\/\//i.test(avatar)).slice(0, 3) : serverMembersStatus === 'error' ? [] : activeRoom.memberAvatars.slice(0, 3)).map((avatar, index) => (
                    <img key={`${avatar}-${index}`} src={avatar} alt="عضو في الغرفة" className="h-6 w-6 rounded-full border-2 border-[#1b0d3a] object-cover bg-slate-800" />
                  ))}
                </div>
              </div>
            </div>

            {/* Right side: Room Capsule Card carrying host account ID & 254K Trophy */}
            <div className="flex flex-col items-end gap-1">
              {/* Capsule Card: يحمل معرف الحساب نفسه على اليمين */}
              <div
                onClick={() => {
                  sounds.playClick();
                  if (isOwner) {
                    setShowRoomInfoModal(true);
                  } else {
                    if (hostAccountId !== '—') handleCopyId(hostAccountId);
                  }
                }}
                className={`flex items-center gap-2 bg-[#211540]/85 backdrop-blur-md border rounded-full py-1 px-3 shadow-lg cursor-pointer transition active:scale-98 ${
                  isOwner ? 'border-amber-400/40 hover:border-amber-300' : 'border-purple-400/25 hover:border-purple-300/40'
                }`}
                title={isOwner ? 'إدارة معلومات وإعدادات غرفتي 👑' : 'معلومات الغرفة ورقم الغرفة (انقر للنسخ)'}
              >
                {/* Heart outline in teal circle badge (or crown if owner) */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs ${
                    isOwner ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs' : 'bg-[#1da594]'
                  }`}
                >
                  {isOwner ? '👑' : <Heart className="w-3.5 h-3.5 text-white fill-none stroke-[2.4]" />}
                </div>

                {/* Room Info: Name & Host Account ID */}
                <div className="flex flex-col text-right leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black text-white tracking-wide max-w-[120px] truncate">
                      {activeRoom.title || 'العراق الع...'}
                    </span>
                    {isOwner && <span className="text-[9px] text-amber-300 font-bold">مالك</span>}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-slate-300 font-mono">
                    <span>ID:{hostAccountId}</span>
                    {copiedId && <span className="text-emerald-400 font-bold">✓</span>}
                  </div>
                </div>
              </div>

              {/* 254K Trophy Pill directly below Capsule Card (كأس الروم) */}
              <div
                onClick={() => {
                  sounds.playClick();
                  setShowRoomStatsModal(true);
                }}
                className="flex items-center gap-1.5 bg-[#1a0e33]/80 border border-purple-400/20 rounded-full px-2.5 py-0.5 shadow-md cursor-pointer hover:bg-[#251449] transition active:scale-95"
                title="كأس ونقاط دعم الغرفة"
              >
                <span className="text-xs font-mono font-bold text-white/90">{activeRoom.roomPoints ?? '—'}</span>
                <span className="text-xs">🏆</span>
              </div>
            </div>
          </div>
        </div>

        {/* Seat positions only; seat visuals and seat numbers remain unchanged. */}
        <div className={seatLayout === "circle" ? "relative z-10 mx-auto h-[365px] w-full max-w-[370px]" : "relative z-10 px-2 pt-2 pb-1"}>
          <div className={seatLayout === "circle" ? "relative h-full w-full" : "grid grid-cols-5 gap-x-1 gap-y-3 items-center justify-items-center"}>
{Array.from({length:15},(_,i)=>i+1).map((seatNum) => {
              const seat = getSeat(seatNum);
              const isOccupied = !!seat.user;

              return (
                <div
                  key={seatNum}
                  onClick={() => handleSeatClick(seatNum)}
                  className="flex flex-col items-center cursor-pointer group active:scale-95 transition"
                  style={getSeatPosition(seatNum)}
                >
                  {/* Seat Translucent Circle: Medium size w-14 h-14 sm:w-16 sm:h-16 */}
                  <div
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all ${
                      isOccupied && seat.user
                        ? 'p-0.5'
                        : 'bg-[#15202e]/60 hover:bg-[#1f2e42]/75 border border-slate-500/40 shadow-[0_2px_8px_rgba(0,0,0,0.5)] backdrop-blur-xs'
                    }`}
                  >
                    {isOccupied && seat.user ? (
                      <div
                        className={`relative w-full h-full rounded-full overflow-visible border-2 shadow-md ${
                          Number(seat.user.id === currentUser.id ? currentUser.vipLevel : seat.user.vipLevel || 0) > 0
                            ? 'border-amber-300 ring-[3px] ring-fuchsia-500/80 shadow-[0_0_16px_4px_rgba(236,72,153,0.65)]'
                            : 'border-white/80'
                        }`}
                      >
                        {Number(seat.user.id === currentUser.id ? currentUser.vipLevel : seat.user.vipLevel || 0) >= 1 && (
                          <Crown className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 w-5 h-5 text-amber-200 fill-amber-500 drop-shadow-[0_0_5px_#facc15] pointer-events-none" />
                        )}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-700 to-teal-950 flex items-center justify-center text-white text-lg font-black">{(seat.user.name || '؟').slice(0,1)}</div>
                        {seat.user.avatar ? <img
                          src={seat.user.avatar}
                          alt={seat.user.name}
                          className="absolute inset-0 z-10 block w-full h-full rounded-full object-cover object-center"
                          loading="eager"
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        /> : null}
                        {seat.isMuted && (
                          <div className="absolute bottom-1 right-1 z-20 w-5 h-5 rounded-full bg-rose-700/90 border border-white/60 flex items-center justify-center shadow-md pointer-events-none">
                            <MicOff className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {/* Green Count Pill at Bottom of Avatar matching Screenshot 2 */}
                        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 z-10 px-1.5 py-0 rounded-full bg-emerald-600/95 border border-emerald-300/40 text-white text-[9px] font-bold font-mono leading-none shadow-xs">
                          {seat.user.hearts ?? 0}
                        </div>
                      </div>
                    ) : seat.isLocked ? (
                      /* Locked mic */
                      <Lock className="w-5 h-5 text-amber-400/90 stroke-[2.2]" />
                    ) : (
                      /* White plus icon matching Screenshots */
                      <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-white/90 stroke-[2.5]" />
                    )}
                  </div>

                  {/* Under Avatar: User name large & clear / Under empty mic: clean number */}
                  {isOccupied && seat.user ? (
                    <div className="mt-1 flex items-center justify-center gap-0.5 max-w-[76px] px-0.5">
                      <VipName
                        name={seat.user.nickname || seat.user.name}
                        vipLevel={seat.user.id === currentUser.id ? currentUser.vipLevel : seat.user.vipLevel}
                        className="text-xs sm:text-sm font-black truncate text-center block"
                        fallbackColor="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
                      />
                      <span className="text-[10px] text-cyan-300 shrink-0">👤</span>
                    </div>
                  ) : (
                    <span className="text-xs sm:text-sm font-bold text-slate-300 font-mono mt-1 tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                      {seatNum}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            4 & 5. TABS ROW & CHAT STREAM (With Clear Screen Mode Support)
            ========================================================================= */}
        {clearScreen ? (
          <div className="relative z-10 flex-1 pointer-events-none">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setClearScreen(false);
              }}
              className="absolute bottom-3 right-4 pointer-events-auto w-10 h-10 rounded-full bg-black/50 border border-purple-400/40 text-white flex items-center justify-center"
              aria-label="إعادة إظهار الدردشة"
              title="إعادة إظهار الدردشة"
            >
              <Eye className="w-5 h-5 text-[#26d0b2]" />
            </button>
          </div>
        ) : (
          <>
            {/* 4. TABS ROW: الكل (with teal underline) | الدردشة | أخرى */}
            <div className="relative z-10 px-6 mt-1 flex items-center justify-end gap-6 text-sm">
              {/* أخرى */}
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveChatTab('other');
                }}
                className={`font-bold transition cursor-pointer ${
                  activeChatTab === 'other' ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                أخرى
              </button>

              {/* الدردشة */}
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveChatTab('chat');
                }}
                className={`font-bold transition cursor-pointer ${
                  activeChatTab === 'chat' ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                الدردشة
              </button>

              {/* الكل (Active with teal underline) */}
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveChatTab('all');
                }}
                className="flex flex-col items-center cursor-pointer"
              >
                <span
                  className={`font-black transition ${
                    activeChatTab === 'all' ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  الكل
                </span>
                {activeChatTab === 'all' && (
                  <span className="w-5 h-0.5 rounded-full bg-[#26d0b2] mt-0.5 shadow-[0_0_8px_rgba(38,208,178,0.8)]" />
                )}
              </button>
            </div>

            {/* 5. CHAT STREAM & WELCOME NOTICES */}
            <div className="relative z-10 px-4 flex-1 flex flex-col justify-end pb-2 overflow-hidden">
              <div className="w-full flex items-end justify-between gap-3">
                {/* Left side floating badges: 🚀, 🎮, •• */}
                <div className="flex flex-col items-center gap-2 pb-1 shrink-0">
                  {/* Rocket Badge */}
                  <div
                    onClick={() => {
                      sounds.playLevelUp();
                      showToast('صاروخ السرعة والدخول الملكي 🚀');
                    }}
                    className="w-10 h-10 rounded-2xl bg-[#1b1038]/80 border border-purple-400/30 flex items-center justify-center shadow-lg text-cyan-300 cursor-pointer active:scale-95 transition"
                    title="صاروخ السرعة"
                  >
                    <Rocket className="w-5 h-5 text-cyan-300 animate-pulse stroke-[2]" />
                  </div>

                  {/* Gamepad Badge */}
                  <div
                    onClick={() => {
                      sounds.playClick();
                      setShowToolsDrawer(true);
                    }}
                    className="w-10 h-10 rounded-2xl bg-[#1b1038]/80 border border-purple-400/30 flex items-center justify-center shadow-lg text-emerald-400 cursor-pointer active:scale-95 transition"
                    title="الألعاب والمسابقات"
                  >
                    <RoyalGamepadIcon className="w-7 h-7 drop-shadow-[0_2px_5px_rgba(16,185,129,0.45)]" />
                  </div>

                  {/* Double dot */}
                  <div className="flex items-center gap-1 opacity-70">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                </div>

                {/* Chat Messages Column */}
                <div
                  ref={chatScrollRef}
                  onScroll={(event) => {
                    const element = event.currentTarget;
                    const programmed = chatProgrammaticScrollRef.current;
                    chatProgrammaticScrollRef.current = null;
                    if (programmed !== null && Math.abs(element.scrollTop - programmed) < 2) return;
                    chatNearBottomRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 48;
                    if (chatNearBottomRef.current) setUnreadRoomMessages(0);
                    chatScrollPositionRef.current = element.scrollTop;
                    const firstVisible = Array.from(element.querySelectorAll<HTMLElement>('[data-room-message-id]'))
                      .find(message => message.offsetTop + message.offsetHeight > element.scrollTop + element.offsetTop);
                    chatAnchorRef.current = firstVisible?.dataset.roomMessageId
                      ? { id: firstVisible.dataset.roomMessageId, offset: firstVisible.offsetTop - element.offsetTop - element.scrollTop }
                      : null;
                  }}
                  className="flex-1 space-y-1.5 overflow-y-auto max-h-48 no-scrollbar pr-1"
                >
                  {/* Room rules and real host welcome, never demo accounts or stock avatars. */}
                  <div className="bg-[#180f33]/85 backdrop-blur-md rounded-2xl p-3 border border-purple-500/20 text-xs text-slate-200 leading-relaxed shadow-lg">
                    أهلاً بك في TotiChat. يرجى احترام الآخرين والالتزام بقواعد الغرفة.
                  </div>
                  {activeRoom.announcement?.trim() && (
                    <div className="flex items-start gap-2 justify-end">
                      <div className="flex flex-col items-end min-w-0">
                        <div className="text-xs font-black text-white mb-1">{activeRoom.hostName || (activeRoom.hostId === currentUser.id ? currentUser.name : 'صاحب الغرفة')}</div>
                        <div className="bg-[#160d33]/90 backdrop-blur-md rounded-2xl p-2.5 border border-purple-500/30 text-xs text-slate-100 shadow-md text-right leading-relaxed">
                          {activeRoom.announcement}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-300/80 bg-[#1b1038] shrink-0 flex items-center justify-center">
                        {(activeRoom.hostAvatar || (activeRoom.hostId === currentUser.id ? currentUser.avatar : '')) ? (
                          <img src={activeRoom.hostAvatar || currentUser.avatar} alt="صاحب الغرفة" className="w-full h-full object-cover" />
                        ) : <span className="text-white font-bold">{(activeRoom.hostName || currentUser.name || 'غ').charAt(0)}</span>}
                      </div>
                    </div>
                  )}
                  {/* 3. Real-time User Sent Messages */}
                  {currentMessages.map((msg) => (
                    <div key={msg.id} data-room-message-id={msg.id} className="flex justify-end">
                      <div className={`toti-chat-bubble rounded-2xl rounded-tr-sm py-1.5 px-2.5 border text-[11px] text-white shadow-sm max-w-[85%] break-words ${(msg.senderId === currentUser.id ? currentUser.vipLevel : (msg.vipLevel ?? 0)) >= 1 ? ["","bg-emerald-950/90 border-emerald-400/70","bg-sky-950/90 border-sky-400/70","bg-indigo-950/90 border-indigo-400/70","bg-violet-950/90 border-violet-400/70","bg-amber-950/90 border-amber-400/70","bg-teal-950/90 border-teal-300/70","bg-blue-950/90 border-blue-300/70","bg-yellow-950/90 border-yellow-300/70"][Math.min(8, Math.floor((msg.senderId === currentUser.id ? currentUser.vipLevel : (msg.vipLevel ?? 0))))] : 'bg-[#1c123d]/88 border-amber-300/25'}`}>
                        <span className="text-amber-300 font-bold ml-1">{msg.senderName}:</span>
                        {(msg.senderId === currentUser.id ? currentUser.vipLevel : (msg.vipLevel ?? 0)) >= 1 && (
                          <span className="inline-flex align-middle rounded-full border border-amber-200/50 bg-black/25 px-1.5 py-0.5 text-[9px] font-black text-amber-100 ml-1" aria-label={`مستوى VIP ${(msg.senderId === currentUser.id ? currentUser.vipLevel : (msg.vipLevel ?? 0))}`}>
                            VIP {(msg.senderId === currentUser.id ? currentUser.vipLevel : (msg.vipLevel ?? 0))}
                          </span>
                        )}
                        <span>{msg.text}</span>
                      </div>
                    </div>
                  ))}

                </div>
                {unreadRoomMessages > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const container = chatScrollRef.current;
                      if (container) {
                        container.scrollTop = container.scrollHeight;
                        chatScrollPositionRef.current = container.scrollTop;
                      }
                      chatNearBottomRef.current = true;
                      chatAnchorRef.current = null;
                      setUnreadRoomMessages(0);
                    }}
                    className="self-center rounded-full border border-emerald-300/50 bg-emerald-950/90 px-3 py-1 text-[11px] font-bold text-emerald-100"
                    aria-label="الانتقال إلى الرسائل الجديدة"
                  >
                    رسائل جديدة ({unreadRoomMessages}) ↓
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Chat input text drawer */}
        {showChatInput && (
          <form
            onSubmit={handleSendChat}
            className="relative z-30 p-2.5 bg-[#140b2e]/95 border-t border-purple-500/20 flex items-center gap-2 animate-in slide-in-from-bottom"
          >
            <input
              type="text"
              placeholder="اكتب رسالة في الروم..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              aria-invalid={chatMessage.trim().length > 1000}
              aria-describedby="room-chat-length"
              className="flex-1 p-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs focus:outline-none focus:border-cyan-400"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 rounded-xl bg-white/10 text-white hover:text-amber-300 cursor-pointer"
            >
              <Smile className="w-4 h-4" />
            </button>
            <span id="room-chat-length" className={`text-[10px] tabular-nums ${chatMessage.trim().length > 1000 ? 'text-red-300' : 'text-slate-300'}`} aria-live="polite">
              {chatMessage.trim().length}/1000
            </span>
            <button
              type="submit"
              disabled={!chatMessage.trim() || chatMessage.trim().length > 1000}
              className="p-2 rounded-xl bg-[#26d0b2] hover:bg-[#20b89d] text-slate-950 font-bold transition active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowChatInput(false)}
              className="p-2 rounded-xl bg-white/10 text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Emoji picker popup */}
        {showEmojiPicker && (
          <div className="relative z-30 p-2 bg-[#120926]/95 border-t border-purple-500/20 flex items-center justify-around text-2xl animate-in slide-in-from-bottom">
            {['❤️', '🌹', '👑', '🔥', '👏', '😍', '🎉', '✨', '💎'].map((em) => (
              <button
                key={em}
                onClick={() => {
                  triggerFloatingEmoji(em);
                  setShowEmojiPicker(false);
                }}
                className="hover:scale-125 transition active:scale-95 p-1 cursor-pointer"
              >
                {em}
              </button>
            ))}
          </div>
        )}

        {/* =========================================================================
            6. BOTTOM ACTION BAR: EXACT ICONS (Screenshot 1)
            - Far Left: 🎁 Gift box button with colorful 3D ribbon
            - ⊞ 4-squares grid button (opens Tools Drawer from Screenshot 2)
            - ✉ Envelope button (direct messages)
            - 😊 Smiley face button (emoji reactions)
            - 🔊 Speaker button (mute/unmute room audio)
            - Far Right: 💬 Chat bubble button (opens text input)
            ========================================================================= */}
        <footer className="relative z-20 px-4 py-2 bg-transparent flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* 1. Gift Button: 3D colorful gift box */}
            <button
              onClick={() => {
                sounds.playGiftFanfare();
                setSelectedGiftReceiver({
                  id: currentUser.id,
                  name: currentUser.name,
                  avatar: currentUser.avatar,
                });
                setOpenGiftStore(true);
              }}
              className="relative w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 p-[1.5px] flex items-center justify-center transition active:scale-90 hover:scale-105 cursor-pointer shadow-[0_0_15px_rgba(236,72,153,0.5)]"
              title="إرسال هدية 🎁"
            >
              <div className="w-full h-full rounded-full bg-[#1e103f] flex items-center justify-center">
                <RoyalGiftIcon className="w-8 h-8 drop-shadow-[0_2px_5px_rgba(245,105,220,0.6)]" />
              </div>
            </button>

            {/* 2. 4-Squares Grid Button (⊞): Opens Screenshot 2 Drawer */}
            <button
              onClick={() => {
                sounds.playClick();
                setShowToolsDrawer(true);
              }}
              className="w-10 h-10 rounded-full bg-[#241747]/90 hover:bg-[#342263] border border-purple-400/25 text-white flex items-center justify-center transition active:scale-95 shadow-md cursor-pointer"
              title="أدوات ووظائف الغرفة"
            >
              <LayoutGrid className="w-5 h-5 text-white stroke-[2.2]" />
            </button>

            {/* 3. Envelope Button (✉): Direct messages */}
            <button
              onClick={() => {
                sounds.playClick();
                setShowMessagesSheet(true);
              }}
              className="w-10 h-10 rounded-full bg-[#241747]/90 hover:bg-[#342263] border border-purple-400/25 text-white flex items-center justify-center transition active:scale-95 shadow-md cursor-pointer"
              title="الرسائل المباشرة"
            >
              <Mail className="w-5 h-5 text-white stroke-[2]" />
            </button>

            {/* 4. Smiley Emoji Button (😊): Reactions */}
            <button
              onClick={() => {
                sounds.playClick();
                setShowEmojiPicker(!showEmojiPicker);
              }}
              className="w-10 h-10 rounded-full bg-[#241747]/90 hover:bg-[#342263] border border-purple-400/25 text-white flex items-center justify-center transition active:scale-95 shadow-md cursor-pointer"
              title="التعبيرات والرموز التفاعلية"
            >
              <Smile className="w-5 h-5 text-white stroke-[2]" />
            </button>

            {/* 5. Speaker Button (🔊): Toggle room volume */}
            <button
              disabled
              className={`w-10 h-10 rounded-full border transition active:scale-95 shadow-md cursor-pointer flex items-center justify-center ${
                !roomSoundMuted
                  ? 'bg-[#241747]/90 hover:bg-[#342263] border-purple-400/25 text-white'
                  : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
              }`}
              title="التحكم بصوت الغرفة غير متاح حالياً"
            >
              {roomSoundMuted ? (
                <VolumeX className="w-5 h-5 text-rose-300 stroke-[2]" />
              ) : (
                <Volume2 className="w-5 h-5 text-white stroke-[2]" />
              )}
            </button>
          </div>

          {/* 6. Far Right: Chat Speech Bubble Button */}
          <button
            onClick={() => {
              sounds.playClick();
              setShowChatInput(!showChatInput);
            }}
            className="w-11 h-11 rounded-full bg-[#241747]/90 hover:bg-[#342263] border border-purple-400/25 text-white flex items-center justify-center transition active:scale-95 shadow-md cursor-pointer"
            title="كتابة رسالة"
          >
            <MessageCircle className="w-5 h-5 text-white stroke-[2.2]" />
          </button>
        </footer>

        {/* =========================================================================
            8. BOTTOM SHEET DRAWER (EXACT REPLICA OF SCREENSHOT 2)
            Opens when tapping the 4-Squares Grid button (⊞)
            Header 1: اللعب 🔥
            - وضع الغرفة (يتحكم بإذن وصلاحيات المايكات)
            - ظرف أحمر
            - الموسيقى
            - المهام
            Header 2: الأدوات 🧰
            Row 1:
            - الصوت
            - استبدال العملات
            - الرسوم
            - وضع الصوت
            Row 2:
            - Host Center
            - Agency Center
            ========================================================================= */}
        {showToolsDrawer && (
          <div
            onClick={() => setShowToolsDrawer(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end justify-center animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-gradient-to-b from-[#180e36] to-[#0d061f] border-t border-purple-500/30 rounded-t-3xl p-5 shadow-2xl animate-in slide-in-from-bottom flex flex-col space-y-5"
            >
              {/* Handle */}
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto -mt-1 mb-1" />

              {/* ---------------- SECTION 1: اللعب 🔥 ---------------- */}
              <div className="space-y-3">
                <div className="flex items-center justify-start gap-1.5 text-white font-black text-sm">
                  <span>اللعب</span>
                  <span className="text-base">🔥</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  {/* 1. وضع الغرفة: يفتح إدارة وصلاحيات الصعود للمايك */}
                  <div
                    onClick={() => {
                      sounds.playClick();
                      setShowToolsDrawer(false);
                      setShowRoomModeModal(true);
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#281a4b] border border-white/10 flex items-center justify-center shadow-md group-hover:border-purple-400/50">
                      <LayoutGrid className="w-7 h-7 text-white stroke-[2]" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">وضع الغرفة</span>
                  </div>

                  {/* 2. ظرف أحمر */}
                  <div
                    onClick={() => {
                      sounds.playClick();
                      setShowToolsDrawer(false);
                      showToast('الظرف الأحمر غير متاح حتى ربط المكافآت بالخادم.');
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 border border-rose-300/30 flex items-center justify-center shadow-lg group-hover:scale-105">
                      <span className="text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">🧧</span>
                    </div>
                    <span className="text-xs font-bold text-slate-200">ظرف أحمر</span>
                  </div>

                  {/* 3. الموسيقى */}
                  <div
                    onClick={() => {
                      sounds.playClick();
                      setShowToolsDrawer(false);
                      setShowMusicPlayerModal(true);
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 border border-purple-300/30 flex items-center justify-center shadow-lg group-hover:scale-105">
                      <Music className="w-7 h-7 text-white stroke-[2.2]" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">الموسيقى</span>
                  </div>

                  {/* 4. المهام */}
                  <div
                    onClick={() => {
                      sounds.playClick();
                      setShowToolsDrawer(false);
                      setShowTasksModal(true);
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-500 border border-blue-300/30 flex items-center justify-center shadow-lg group-hover:scale-105">
                      <Calendar className="w-7 h-7 text-white stroke-[2.2]" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">المهام</span>
                  </div>
                </div>
              </div>

              {/* ---------------- SECTION 2: الأدوات والتفاعل 🧰 ---------------- */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-start gap-1.5 text-white font-black text-sm">
                  <span>الأدوات</span>
                  <span className="text-base">🧰</span>
                </div>

                {/* 6 Grid Icons: وضع الصوت | الرسوم | استبدال العملات | الصوت | مسح الشاشة | تحميل التطبيق */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  {/* وضع الصوت */}
                  <div
                    onClick={() => {
                      sounds.playClick();
                      setAudioModeHQ(!audioModeHQ);
                      showToast(audioModeHQ ? 'وضع الصوت: عالي الدقة HD 🎵' : 'وضع الصوت: قياسي منخفض البث 🎙️');
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition"
                  >
                    <div className="w-13 h-13 rounded-2xl bg-[#281a4b] border border-white/10 flex items-center justify-center shadow-md group-hover:border-purple-400/50">
                      <Radio className="w-6 h-6 text-white stroke-[2]" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">وضع الصوت</span>
                  </div>

                  {/* الرسوم */}
                  <div
                    onClick={() => {
                      sounds.playClick();
                      setShowToolsDrawer(false);
                      setOpenStorageModal(true);
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition"
                  >
                    <div className="w-13 h-13 rounded-2xl bg-[#281a4b] border border-white/10 flex items-center justify-center shadow-md group-hover:border-purple-400/50">
                      <Sliders className="w-6 h-6 text-white stroke-[2]" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">الرسوم</span>
                  </div>

                  {/* استبدال العملات */}
                  <div
                    onClick={() => {
                      sounds.playClick();
                      setShowToolsDrawer(false);
                      setOpenRechargeModal(true);
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition"
                  >
                    <div className="w-13 h-13 rounded-2xl bg-[#281a4b] border border-white/10 flex items-center justify-center shadow-md group-hover:border-purple-400/50">
                      <Coins className="w-6 h-6 text-white stroke-[2]" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">استبدال العملات</span>
                  </div>

                  {/* الصوت */}
                  <div
                    aria-disabled="true"
                    title="التحكم بصوت الغرفة غير متاح حالياً"
                    className="flex flex-col items-center gap-1.5 opacity-60"
                  >
                    <div className="w-13 h-13 rounded-2xl bg-[#281a4b] border border-white/10 flex items-center justify-center shadow-md group-hover:border-purple-400/50">
                      {roomSoundMuted ? (
                        <VolumeX className="w-6 h-6 text-rose-400 stroke-[2]" />
                      ) : (
                        <Volume2 className="w-6 h-6 text-white stroke-[2]" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-200">الصوت</span>
                  </div>

                  {/* مسح الشاشة */}
                  <div
                    onClick={() => {
                      sounds.playClick();
                      setShowToolsDrawer(false);
                      setClearScreen(!clearScreen);
                      showToast(!clearScreen ? 'تم تفعيل مسح الشاشة لمشاهدة الغرفة بنقاء 👁️' : 'تم إلغاء مسح الشاشة');
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition"
                  >
                    <div className={`w-13 h-13 rounded-2xl border flex items-center justify-center shadow-md ${
                      clearScreen ? 'bg-purple-600/40 border-[#26d0b2]' : 'bg-[#281a4b] border-white/10'
                    }`}>
                      {clearScreen ? <EyeOff className="w-6 h-6 text-[#26d0b2]" /> : <Eye className="w-6 h-6 text-white stroke-[2]" />}
                    </div>
                    <span className="text-xs font-bold text-slate-200">مسح الشاشة</span>
                  </div>


                  {/* أعضاء الغرفة (متاح للجميع للاطلاع على الحضور) */}
                  <div
                    onClick={() => {
                      sounds.playClick();
                      setShowToolsDrawer(false);
                      setShowMembersModal(true);
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition"
                  >
                    <div className="w-13 h-13 rounded-2xl bg-[#281a4b] border border-white/10 flex items-center justify-center shadow-md group-hover:border-purple-400/50">
                      <Users className="w-6 h-6 text-white stroke-[2]" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">أعضاء الغرفة</span>
                  </div>

                  {/* الحظر داخل أدوات الغرفة، دون زر عائم يحجب المحادثة */}
                  <button type="button" onClick={() => { setShowBansModal(true); setShowToolsDrawer(false); }} className="flex flex-col items-center gap-1.5 active:scale-95">
                    <span className="flex h-13 w-13 items-center justify-center rounded-2xl border border-white/10 bg-[#281a4b]"><Shield className="h-6 w-6 text-rose-300" /></span>
                    <span className="text-xs font-bold text-slate-200">المحظورون</span>
                  </button>

                  {/* مشاركة الغرفة */}
                  <div
                    onClick={() => {
                      sounds.playClick();
                      setShowToolsDrawer(false);
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                      }
                      showToast('تم نسخ رابط الغرفة للمشاركة بنجاح 🔗');
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition"
                  >
                    <div className="w-13 h-13 rounded-2xl bg-[#281a4b] border border-white/10 flex items-center justify-center shadow-md group-hover:border-purple-400/50">
                      <ExternalLink className="w-6 h-6 text-white stroke-[2]" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">مشاركة</span>
                  </div>
                </div>
              </div>

              {/* ---------------- SECTION 3: إدارة الغرفة والمالك 👑 (تظهر فقط لمالك الغرفة والمشرفين) ---------------- */}
              {(isOwner || isModerator) && (
                <div className="space-y-3 pt-2 border-t border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-300 font-black text-sm">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>إدارة الغرفة والمالك</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full">
                      {isOwner ? 'صلاحيات المالك 👑' : 'صلاحيات المشرف 🛡️'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    {/* معلومات الغرفة */}
                    <div
                      onClick={() => {
                        sounds.playClick();
                        setShowToolsDrawer(false);
                        setShowRoomInfoModal(true);
                      }}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition"
                    >
                      <div className="w-13 h-13 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center shadow-md group-hover:border-amber-400">
                        <Settings className="w-6 h-6 text-amber-300 stroke-[2]" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-200">معلومات الغرفة</span>
                    </div>

                    {/* إدارة الأعضاء والمشرفين */}
                    <div
                      onClick={() => {
                        sounds.playClick();
                        setShowToolsDrawer(false);
                        setShowMembersModal(true);
                      }}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition"
                    >
                      <div className="w-13 h-13 rounded-2xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center shadow-md group-hover:border-purple-400">
                        <Shield className="w-6 h-6 text-purple-300 stroke-[2]" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-200">المشرفون</span>
                    </div>

                    {/* إدارة الوكالة (Agency Center - تظهر للمالك ووكالته فقط) */}
                    <div
                      onClick={() => {
                        sounds.playClick();
                        setShowToolsDrawer(false);
                        setShowAgencyInfoModal(true);
                      }}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition"
                    >
                      <div className="w-13 h-13 rounded-2xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center shadow-md group-hover:border-indigo-400">
                        <Users className="w-6 h-6 text-indigo-300 stroke-[2]" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-200">إدارة الوكالة</span>
                    </div>

                    {/* مركز المضيفين (Host Center) */}
                    <div
                      onClick={() => {
                        sounds.playClick();
                        setShowToolsDrawer(false);
                        setShowHostCenterModal(true);
                      }}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition"
                    >
                      <div className="w-13 h-13 rounded-2xl bg-teal-500/15 border border-teal-400/30 flex items-center justify-center shadow-md group-hover:border-teal-400">
                        <Radio className="w-6 h-6 text-teal-300 stroke-[2]" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-200">Host Center</span>
                    </div>

                    {/* زينة وتخصيص الغرفة */}
                    <div
                      onClick={() => {
                        sounds.playClick();
                        setShowToolsDrawer(false);
                        setShowDecorationsModal('mic');
                      }}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition"
                    >
                      <div className="w-13 h-13 rounded-2xl bg-pink-500/15 border border-pink-400/30 flex items-center justify-center shadow-md group-hover:border-pink-400">
                        <Brush className="w-6 h-6 text-pink-300 stroke-[2]" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-200">زينة الغرفة</span>
                    </div>

                    {/* خلفية الغرفة */}
                    <div
                      onClick={() => {
                        sounds.playClick();
                        setShowToolsDrawer(false);
                        setShowChangeBgModal(true);
                      }}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition"
                    >
                      <div className="w-13 h-13 rounded-2xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center shadow-md group-hover:border-purple-400">
                        <Palette className="w-6 h-6 text-purple-300 stroke-[2]" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-200">خلفية الغرفة</span>
                    </div>

                    {/* إحصائيات الغرفة */}
                    <div
                      onClick={() => {
                        sounds.playClick();
                        setShowToolsDrawer(false);
                        setShowRoomStatsModal(true);
                      }}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition"
                    >
                      <div className="w-13 h-13 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center shadow-md group-hover:border-cyan-400">
                        <BarChart3 className="w-6 h-6 text-cyan-300 stroke-[2]" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-200">الإحصائيات</span>
                    </div>

                    {/* وضع الغرفة والصلاحيات */}
                    <div
                      onClick={() => {
                        sounds.playClick();
                        setShowToolsDrawer(false);
                        setShowRoomModeModal(true);
                      }}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition"
                    >
                      <div className="w-13 h-13 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center shadow-md group-hover:border-amber-400">
                        <Lock className="w-6 h-6 text-amber-300 stroke-[2]" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-200">أذونات المايك</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            ROOM MODE & MIC PERMISSIONS MODAL (وضع الغرفة وصلاحيات الصعود)
            Allows setting:
            1. صعود تلقائي ومفتوح للجميع
            2. بإذن المالك فقط (عضوية أو إشراف)
            ========================================================================= */}
        {showRoomModeModal && (
          <div
            onClick={() => setShowRoomModeModal(false)}
            className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#160e33] border border-purple-400/40 rounded-3xl p-5 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-purple-400" />
                  <h3 className="font-bold text-sm">وضع الغرفة وصلاحيات المايك</h3>
                </div>
                <button
                  onClick={() => setShowRoomModeModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <p role="status" className="p-3.5 rounded-2xl border border-white/10 bg-white/5 text-xs text-slate-300">
                  تغيير صلاحيات الصعود للمايك غير متاح حالياً حتى ربطه بالخادم.
                </p>

                {/* Mode 3: تغيير خلفية الغرفة (متاح لصاحب الغرفة والمشرفين) */}
                <div
                  onClick={() => {
                    sounds.playClick();
                    const isOwner = activeRoom.hostId === currentUser.id;
                    if (!isOwner && !currentUser.isSuperAdmin) {
                      sounds.playError();
                      showToast('🔒 ميزة تغيير خلفية الغرفة مخصصة فقط لصاحب الغرفة أو المشرفين المخولين');
                      return;
                    }
                    setShowRoomModeModal(false);
                    setShowChangeBgModal(true);
                  }}
                  className="p-3.5 rounded-2xl border border-purple-400/40 bg-purple-900/30 hover:bg-purple-900/50 cursor-pointer transition active:scale-98 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-md">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">تغيير خلفية الغرفة 🎨</h4>
                      <p className="text-[10px] text-purple-200">
                        {activeRoom.hostId === currentUser.id
                          ? 'تخصيص خلفية الغرفة وحفظها لجميع الزوار'
                          : 'صلاحية صاحب الغرفة والمشرفين فقط'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-purple-300 font-bold">تعديل ←</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Royal room music player: separate from voice participant */}
        {showMusicPlayerModal && (
          <div onClick={() => { if (!musicPickerPendingRef.current && Date.now() - musicPickerReturnAtRef.current >= 2000) setShowMusicPlayerModal(false); }} className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-3">
            <div onClick={e => e.stopPropagation()} dir="rtl" className="w-full max-w-sm max-h-[92vh] overflow-y-auto rounded-[30px] border border-[#bd8d38]/60 bg-gradient-to-b from-[#302316] via-[#18130f] to-[#080808] p-5 text-white shadow-2xl shadow-amber-700/20 space-y-5">
              <div className="flex justify-between items-center">
                <button aria-label="إغلاق" onClick={() => setShowMusicPlayerModal(false)} className="p-2 rounded-full bg-white/10"><X size={20}/></button>
                <span className="text-[#e9c776] font-bold tracking-wider text-sm">TOTICHAT MUSIC</span>
                <Music size={22} className="text-[#e9c776]"/>
              </div>
              <div className="aspect-square max-h-[240px] mx-auto rounded-3xl border border-amber-500/40 bg-gradient-to-br from-[#594022] via-[#17120e] to-black flex flex-col items-center justify-center shadow-inner shadow-amber-600/20">
                <Music size={76} className="text-[#e6bb61] drop-shadow-lg"/>
                <span className="mt-4 text-amber-100/70 text-xs">موسيقى الغرفة الملكية</span>
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-bold text-lg text-amber-50 truncate">{musicFileName || 'اختر أغنية من هاتفك'}</h3>
                <p className="text-xs text-amber-200/70">{musicStatus === 'playing' ? 'قيد التشغيل' : musicStatus === 'paused' ? 'متوقف مؤقتاً' : 'جاهز للتشغيل'}</p>
              </div>
              {(isOwner || isModerator) ? (
                <>
                  <div dir="ltr" className="space-y-1">
                    <input aria-label="تقدم الأغنية" type="range" min={0} max={musicProgress.duration || 1} step={0.1} value={Math.min(musicProgress.position, musicProgress.duration || 1)} disabled={musicStatus === 'stopped'} onChange={e => { const position=Number(e.target.value); seekRoomMusic(position); setMusicProgress(p=>({...p,position})); }} className="w-full accent-[#d8aa52]"/>
                    <div className="flex justify-between text-xs text-white/60"><span>{Math.floor(musicProgress.position/60)}:{String(Math.floor(musicProgress.position%60)).padStart(2,'0')}</span><span>{Math.floor(musicProgress.duration/60)}:{String(Math.floor(musicProgress.duration%60)).padStart(2,'0')}</span></div>
                  </div>
                  <div dir="ltr" className="flex items-center justify-between gap-2">
                    <button aria-label="تشغيل عشوائي" onClick={() => setMusicShuffle(v=>!v)} className={musicShuffle ? 'text-amber-400' : 'text-white/60'}><Shuffle size={22}/></button>
                    <button aria-label="السابق" disabled={!musicQueue.length || musicBusy} onClick={() => switchQueuedMusic(-1)}><SkipBack size={28}/></button>
                    <button aria-label={musicStatus === 'playing' ? 'إيقاف مؤقت' : 'تشغيل'} disabled={musicBusy || (musicStatus === 'stopped' && !musicQueue.length)} className="rounded-full bg-gradient-to-br from-[#f5d48a] to-[#bc852d] p-5 text-black disabled:opacity-40" onClick={async () => { try { if (musicStatus === 'stopped') { await playQueuedMusic(musicQueue[musicIndex >= 0 && musicIndex < musicQueue.length ? musicIndex : 0], musicIndex >= 0 && musicIndex < musicQueue.length ? musicIndex : 0); } else if (musicStatus === 'paused') { await resumeRoomMusic(); setMusicStatus('playing'); } else { pauseRoomMusic(); setMusicStatus('paused'); } } catch(error) { console.error(error); showToast('تعذر التحكم بالموسيقى'); } }}>{musicStatus === 'playing' ? <Pause size={30} fill="currentColor"/> : <Play size={30} fill="currentColor"/>}</button>
                    <button aria-label="التالي" disabled={!musicQueue.length || musicBusy} onClick={() => switchQueuedMusic(1)}><SkipForward size={28}/></button>
                    <button aria-label="تكرار" onClick={() => setMusicRepeat(v=>!v)} className={musicRepeat ? 'text-amber-400' : 'text-white/60'}><Repeat size={22}/></button>
                  </div>
                  <div dir="ltr" className="flex items-center gap-3"><Volume1 size={18} className="text-amber-300"/><input aria-label="صوت الموسيقى" type="range" min={0} max={100} value={musicVolume} onChange={e => {const v=Number(e.target.value); setMusicVolume(v); setRoomMusicVolume(v/100);}} className="flex-1 accent-[#d8aa52]"/><Volume2 size={18} className="text-amber-300"/></div>
                  <label htmlFor="totichat-room-music-file" onClick={openMusicPicker} className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-[#b7812e] to-[#f1d18a] text-black font-bold py-3 cursor-pointer">
                    <FolderOpen size={20}/> اختيار موسيقى من الهاتف
                  </label>

                  {musicQueue.length > 0 && <div className="rounded-xl border border-amber-500/20 bg-black/30 p-3 max-h-36 overflow-y-auto space-y-1"><p className="text-xs text-amber-300 mb-2">قائمة الأغاني ({musicQueue.length})</p>{musicQueue.map((file,index)=><button key={index} disabled={musicBusy} onClick={()=>void playQueuedMusic(file,index)} className={'w-full text-right text-xs truncate rounded-lg px-2 py-2 '+(musicIndex===index?'bg-amber-500/20 text-amber-200':'text-white/70')}>{index+1}. {file.name}</button>)}</div>}
                  <button onClick={() => {void stopRoomMusic().then(()=>{setMusicStatus('stopped');setMusicFileName('');setMusicProgress({position:0,duration:0});musicRoomRef.current=null;}).catch(error=>{console.error(error);showToast('تعذر إيقاف الموسيقى');});}} className="w-full border border-amber-500/40 rounded-xl py-2 text-amber-100 text-sm">إيقاف نهائي</button>
                </>
              ) : <p className="text-center text-sm text-amber-100/70">التحكم ببث الموسيقى متاح لإدارة الغرفة فقط.</p>}
            </div>
          </div>
        )}

                  <input id="totichat-room-music-file" ref={musicPickerRef} type="file" multiple accept="audio/*" className="absolute w-px h-px opacity-0 pointer-events-none" onChange={e => {
                    musicPickerReturnAtRef.current = Date.now();
                    musicPickerPendingRef.current = false;
                    setShowMusicPlayerModal(true);
                    const files = Array.from(e.target.files || []).filter(file => file.type.startsWith('audio/') || /\.(mp3|m4a|aac|wav|ogg|flac)$/i.test(file.name));
                    e.target.value = '';
                    if (!files.length) {
                      showToast('لم يصل ملف صوتي من منتقي ملفات Android');
                      return;
                    }
                    const unique = Array.from(new Map(files.map(file => [musicFileKey(file), file])).values());
                    // Android file pickers may return only one file even with multiple enabled.
                    // Accumulate selections until the user confirms; never replace earlier picks.
                    setMusicSelection(previous => {
                      const known = new Set(previous.map(musicFileKey));
                      return [...previous, ...unique.filter(file => !known.has(musicFileKey(file)))];
                    });
                    setMusicSelectionKeys(previous => Array.from(new Set([...previous, ...unique.map(musicFileKey)])));
                    setMusicSelectionOpen(true);
                  }}/> 

        {musicSelectionOpen && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4" dir="rtl">
            <div className="w-full max-w-sm max-h-[85vh] overflow-hidden rounded-3xl border border-amber-500/50 bg-gradient-to-b from-[#2d2113] to-[#0b0a09] text-amber-50 flex flex-col shadow-2xl">
              <div className="p-5 border-b border-amber-500/20">
                <h3 className="font-bold text-lg flex items-center gap-2"><FolderOpen size={22} className="text-amber-400"/> إضافة أغاني إلى القائمة</h3>
                <p className="text-sm text-amber-100/70 mt-2">حدد الأغاني التي تريد إضافتها، ثم اضغط إضافة أو إلغاء.</p>
                <p className="text-xs text-amber-300 mt-2">المحدد: {musicSelectionKeys.length} من {musicSelection.length}</p>
                <p className="text-xs text-amber-100/70 mt-2">من ملفات الهاتف تگدر تحدد عدة أغاني بضغطة مطوّلة ثم تحديد الباقي. وإذا جهازك يختار أغنية واحدة فقط، اضغط «اختيار المزيد» وراح نجمعهن كلهن قبل الإضافة.</p>
                <label htmlFor="totichat-room-music-file" onClick={openMusicPicker} className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-amber-400/60 bg-amber-400/10 py-3 font-bold text-amber-200 cursor-pointer"><Plus size={18}/> اختيار المزيد من الأغاني</label>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {musicSelection.map(file => (
                  <label key={musicFileKey(file)} className="flex items-center gap-3 rounded-xl bg-white/5 p-3 cursor-pointer">
                    <input type="checkbox" checked={musicSelectionKeys.includes(musicFileKey(file))} onChange={e => setMusicSelectionKeys(prev => e.target.checked ? [...prev, musicFileKey(file)] : prev.filter(key => key !== musicFileKey(file)))} className="accent-amber-500 w-5 h-5"/>
                    <span className="text-sm truncate flex-1">{file.name}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 p-4 border-t border-amber-500/20">
                <button type="button" onClick={confirmMusicSelection} disabled={!musicSelectionKeys.length} className="flex-1 rounded-xl bg-gradient-to-r from-[#b7812e] to-[#f1d18a] text-black font-bold py-3 disabled:opacity-40">إضافة ({musicSelectionKeys.length})</button>
                <button type="button" onClick={cancelMusicSelection} className="flex-1 rounded-xl border border-amber-500/50 py-3 font-bold">إلغاء</button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            DAILY TASKS MODAL (المهام 📅)
            ========================================================================= */}
        {showTasksModal && (
          <div
            onClick={() => setShowTasksModal(false)}
            className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-gradient-to-b from-[#241a09] to-[#090909] border border-amber-400/60 rounded-3xl p-5 shadow-2xl shadow-amber-500/10 text-white space-y-4 max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-sm">المهام اليومية والمكافآت</h3>
                </div>
                <button
                  onClick={() => setShowTasksModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5">
                {[
                  { id: 't1', title: 'دخول الغرفة الصوتية', reward: '50 🪙', done: true },
                  { id: 't2', title: 'التحدث على المايك لمدة 5 دقائق', reward: '100 🪙', done: true },
                  { id: 't3', title: 'إرسال هدية إلى المضيف', reward: '200 🪙', done: false },
                  { id: 't4', title: 'مشاركة رابط الغرفة مع صديق', reward: '75 🪙', done: false },
                ].map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-100">{task.title}</div>
                      <div className="text-[10px] text-amber-300 font-bold mt-0.5">المكافأة: {task.reward}</div>
                    </div>
                    {tasksClaimed[task.id] ? (
                      <span className="text-[10px] text-emerald-400 font-bold px-2 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30">
                        تم الاستلام ✓
                      </span>
                    ) : task.done ? (
                      <button
                        onClick={() => {
                          sounds.playLevelUp();
                          setTasksClaimed((prev) => ({ ...prev, [task.id]: true }));
                          showToast(`تم استلام مكافأة ${task.reward} بنجاح! 🎉`);
                        }}
                        className="text-[10px] text-slate-950 font-black px-3 py-1 rounded-full bg-amber-400 hover:bg-amber-300 active:scale-95 transition"
                      >
                        استلام
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 px-2 py-1 rounded-full bg-white/5">
                        غير مكتمل
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MIC USER PROFILE BOTTOM SHEET (مطابق تماماً للقطات الشاشة المرفقة)
            - خلفية كحلية أنيقة داكنة مع بروز الصورة الدائرية في الأعلى
            - شارة الرول [R المصمم I 🦁] وزر الإغلاق
            - الاسم بخط عريض وواضح (حمدان ❗ / محمد علي)
            - شريط الأوسمة: المستوى 101، شارة VIP، الجنس والعمر، العلم العراقي، أيقونة المستخدم
            - سطر المعرف 816357955 ID مع إمكانية النسخ بالنقر
            - وشاح موثق الوردي الفاخر 🎙️
            - عداد الماسات 👁️ ماسة: 0
            - زر الهدية المركزي الكبير 🎁 ارسل الهدايا
            - شريط التحكم السفلي: "نزل من المايك 💺" و "حظر مايك 🔇"
            ========================================================================= */}
        {selectedMicUser && (
          <div
            onClick={() => setSelectedMicUser(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center animate-in fade-in"
            dir="rtl"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md max-h-[min(88dvh,780px)] overflow-y-auto overscroll-contain bg-[#101924]/95 border-t border-slate-700/70 rounded-t-3xl backdrop-blur-xl shadow-2xl p-5 pt-3 text-white relative animate-in slide-in-from-bottom [padding-bottom:calc(1.5rem+env(safe-area-inset-bottom,0px))]"
            >
              {/* Top Header Row: Close button on left, Role badge on right */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedMicUser(null)}
                  className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center active:scale-95 transition cursor-pointer"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Golden Role Badge e.g. [R المصمم I 🦁] matching screenshot */}
                <div className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-700/80 via-yellow-600/90 to-amber-700/80 border border-amber-400 text-amber-100 font-black text-xs flex items-center gap-1.5 shadow-sm">
                  <span>🦁</span>
                  <span>
                    {selectedMicUser.user.id === activeRoom.hostId
                      ? 'مالك الغرفة'
                      : (selectedMicUser.user.agencyRole || 'عضو')}
                  </span>
                  <span className="font-serif">R</span>
                </div>
              </div>

              {/* Circular Avatar popping up out of the top edge */}
              <button type="button" onClick={() => { const target = selectedMicUser.user; setSelectedMicUser(null); handleOpenUserProfile(target); }} aria-label="فتح الملف الشخصي الكامل" className="relative -mt-9 mx-auto block w-20 h-20 sm:w-22 sm:h-22 rounded-full border-2 border-white/90 overflow-hidden shadow-2xl bg-slate-900">
                <img
                  src={selectedMicUser.user.avatar}
                  alt={selectedMicUser.user.name}
                  className="w-full h-full object-cover"
                />
              </button>

              {/* User Name in large, bold, clear white text */}
              <h3 className="text-xl sm:text-2xl font-black text-white text-center mt-2.5 tracking-wide flex items-center justify-center gap-1">
                <span>{selectedMicUser.user.nickname || selectedMicUser.user.name}</span>
              </h3>

              {selectedMicAgencyName && <p className="mt-1 text-center text-[11px] font-bold text-red-400">{selectedMicAgencyName}</p>}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
                <span className="rounded-full bg-amber-500/15 border border-amber-400/40 px-3 py-1 text-amber-200">الثروة Lv.{selectedMicUser.user.wealthLevel}</span>
                <span className="rounded-full bg-fuchsia-500/15 border border-fuchsia-400/40 px-3 py-1 text-fuchsia-200">السحر Lv.{selectedMicUser.user.charmLevel}</span>
                {Number(selectedMicUser.user.vipLevel || 0) > 0 && <span className="rounded-full border border-yellow-400/50 bg-yellow-500/15 px-3 py-1 text-yellow-200">VIP {selectedMicUser.user.vipLevel}</span>}
              </div>
              <ProfileCpCard key={selectedMicUser.user.id} userId={selectedMicUser.user.id} userName={selectedMicUser.user.nickname || selectedMicUser.user.name} userAvatar={selectedMicUser.user.avatar} onPartnerClick={partnerId => { if (!stagingBackend) return; void (async () => {
                const { data, error } = await stagingBackend.from('profiles').select('id,display_name,avatar_url').eq('id', partnerId).maybeSingle();
                if (error || !data) { showToast('تعذر فتح ملف الشريك'); return; }
                const avatar = data.avatar_url ? (/^(https?:\/\/|data:image\/)/i.test(data.avatar_url) ? data.avatar_url : stagingBackend.storage.from('profile-avatars').getPublicUrl(data.avatar_url).data.publicUrl) : '';
                setSelectedMicUser(null);
                handleOpenUserProfile({ ...currentUser, id: data.id, name: data.display_name || 'مستخدم', nickname: data.display_name || 'مستخدم', avatar, country: '', countryCode: '', countryFlag: '', birthdate: '', age: null, friendsCount: 0, followersCount: 0, followingCount: 0, fansCount: 0, visitorsCount: 0, hearts: 0, gameLevel: 0, gameExp: 0, cover: '', bio: '', album: [], vipExpiry: '', specialIdBadge: undefined, isBanned: false, banReason: undefined, isNameBanned: false, isAvatarBanned: false, wealthExp: 0, charmExp: 0, wealthLevel: 0, charmLevel: 0, coins: 0, diamonds: 0, vipLevel: 0, isSuperAdmin: false, isRechargeAgent: false, isHost: false, isSpecialId: false, permissions: [], agencyRole: undefined, agencyName: undefined, rechargeCoins: 0, hasWelcomeBanner: false });
              })().catch(() => showToast('تعذر فتح ملف الشريك')); }} compact />
              <button type="button" onClick={() => { const target = selectedMicUser.user; setSelectedMicUser(null); handleOpenUserProfile(target); }} className="mx-auto mt-4 flex min-h-12 w-[min(100%,340px)] items-center justify-center gap-2 rounded-full bg-gradient-to-l from-emerald-400 via-green-400 to-teal-500 px-5 py-3 text-base font-black text-emerald-950 shadow-[0_8px_22px_rgba(16,185,129,.28)] transition active:scale-[.98]">
                <CircleUserRound className="h-5 w-5" /> المزيد
              </button>

              {selectedMicUser.user.id !== currentUser.id && <button type="button" onClick={() => void setPersonalBlock(selectedMicUser.user.id, !personalBlocks.some(item => item.userId === selectedMicUser.user.id))} className="mx-auto mt-2 block rounded-xl bg-slate-700 px-4 py-2 text-xs text-white">{personalBlocks.some(item => item.userId === selectedMicUser.user.id) ? 'فك الحظر الشخصي' : 'حظر شخصي'}</button>}
              {(isOwner || isModerator) && selectedMicUser.user.id !== currentUser.id && <button type="button" onClick={() => void handleVoiceModeration(selectedMicUser.user.id, 'ban')} className="mx-auto mt-2 block rounded-xl bg-red-900/60 px-4 py-2 text-xs text-white">حظر وطرد من الغرفة</button>}
              {/* ID Row with Copy */}
              <div
                onClick={() => {
                  sounds.playClick();
                  const copyId = selectedMicPublicId !== '—' ? selectedMicPublicId : undefined;
                  if (!copyId) return;
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(copyId);
                  }
                  showToast(`تم نسخ المعرف: ${copyId} بنجاح 📋`);
                }}
                className="flex items-center justify-center gap-1.5 text-slate-300 text-xs mt-2 cursor-pointer hover:text-white transition active:scale-95"
                title="انقر لنسخ المعرف"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono font-bold tracking-wider">{selectedMicPublicId}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-cyan-600 text-white font-mono text-[10px] font-bold">
                  ID
                </span>
              </div>

              {selectedMicUser.user.id !== currentUser.id && (
                <div className="flex justify-center mt-3">
                  <button type="button"
                    onClick={() => toggleFollowHost(selectedMicUser.user.id)}
                    className="min-h-10 px-5 rounded-full bg-emerald-600/20 border border-emerald-400/60 text-emerald-100 text-sm font-bold flex items-center gap-2"
                    aria-label={followedRoomHosts.has(selectedMicUser.user.id) ? 'إلغاء المتابعة' : 'متابعة المستخدم'}
                  >
                    {followedRoomHosts.has(selectedMicUser.user.id) ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {followedRoomHosts.has(selectedMicUser.user.id) ? 'إلغاء المتابعة' : 'متابعة'}
                  </button>
                </div>
              )}

              {/* Central Large Gift Button (ارسل الهدايا 🎁) */}
              <div className="flex flex-col items-center justify-center my-4">
                <button
                  onClick={() => {
                    sounds.playGiftFanfare();
                    setSelectedGiftReceiver(selectedMicUser.user);
                    setOpenGiftStore(true);
                    setSelectedMicUser(null);
                  }}
                  className="flex flex-col items-center group active:scale-95 transition cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-teal-400/25 to-blue-500/20 border border-cyan-400/40 flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(6,182,212,0.3)] group-hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition">
                    🎁
                  </div>
                  <span className="text-sm font-bold text-slate-200 mt-1.5">ارسل الهدايا</span>
                </button>
              </div>

              {/* Only the seat owner or authorized moderators may see mic controls. */}
              {(selectedMicUser.user.id === currentUser.id || ((isOwner || isModerator) && selectedMicUser.user.id !== activeRoom.hostId)) && <div className="border-t border-slate-800/90 pt-3 flex items-center justify-around">
                {/* Action 1: نزل من المايك */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    if (selectedMicUser.user.id === currentUser.id) {
                      leaveSeat(selectedMicUser.seatNumber);
                    } else {
                      void handleVoiceModeration(selectedMicUser.user.id, 'release_seat');
                    }
                    setSelectedMicUser(null);
                  }}
                  className="flex flex-col items-center gap-1 text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800/90 flex items-center justify-center border border-slate-700 shadow-sm">
                    <ArrowRightLeft className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-xs font-bold">نزل من المايك</span>
                </button>

                {/* Action 2: حظر مايك */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    if (selectedMicUser.user.id === currentUser.id) {
                      toggleMyMic();
                    } else {
                      // A participant can self-mute without being moderator-muted.
                      // Do not infer moderation state from the microphone state.
                      void handleVoiceModeration(selectedMicUser.user.id, 'mute');
                    }
                    setSelectedMicUser(null);
                  }}
                  className="flex flex-col items-center gap-1 text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800/90 flex items-center justify-center border border-slate-700 shadow-sm">
                    <MicOff className="w-5 h-5 text-rose-400" />
                  </div>
                  <span className="text-xs font-bold">{selectedMicUser.user.id === currentUser.id ? (myMicMuted ? 'فتح المايك' : 'كتم المايك') : 'حظر مايك'}</span>
                </button>
                {selectedMicUser.user.id !== currentUser.id && selectedMicUser.user.id !== activeRoom.hostId && (isOwner || isModerator) && (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      void handleAllowMic(selectedMicUser.user.id);
                      setSelectedMicUser(null);
                    }}
                    className="flex flex-col items-center gap-1 text-emerald-300 active:scale-95 transition"
                    title="إزالة حظر المايك الإداري، دون تشغيل مايك العضو تلقائياً"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-950/70 border border-emerald-600/60 flex items-center justify-center">
                      <Mic className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold">فك حظر المايك</span>
                  </button>
                )}
              </div>}
            </div>
          </div>
        )}

        {/* =========================================================================
            EMPTY MIC ACTIONS BOTTOM SHEET (اصعد بنفسي، قفل المايكرفون، انتقل، مغادرة)
            ========================================================================= */}
        {selectedEmptySeat !== null && (
          <div
            onClick={() => setSelectedEmptySeat(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center animate-in fade-in"
            dir="rtl"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#101924]/95 border-t border-slate-700/70 rounded-t-3xl backdrop-blur-xl shadow-2xl p-5 pb-6 text-white animate-in slide-in-from-bottom"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-sm">
                    {selectedEmptySeat}
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">مايك رقم {selectedEmptySeat}</h3>
                    <p className="text-[11px] text-slate-400">
                      {isUserOnAnySeat
                        ? `أنت جالس حالياً على المايك رقم ${myCurrentSeat?.seatNumber}`
                        : 'المقعد فارغ ومتاح للصعود الصوتي'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmptySeat(null)}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                {isUserOnAnySeat ? (
                  /* User is already on a mic */
                  <>
                    {/* انتقل إلى هذا المايك */}
                    <button
                      onClick={() => {
                        takeSeat(selectedEmptySeat);
                        setSelectedEmptySeat(null);
                      }}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30 active:scale-98 transition cursor-pointer"
                    >
                      <ArrowRightLeft className="w-5 h-5" />
                      <span>انتقل إلى هذا المايك</span>
                    </button>

                    {/* مغادرة المايكرفون */}
                    <button
                      onClick={() => {
                        if (myCurrentSeat) leaveSeat(myCurrentSeat.seatNumber);
                        setSelectedEmptySeat(null);
                      }}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-500 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30 active:scale-98 transition cursor-pointer"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>مغادرة المايكرفون</span>
                    </button>

                    {/* قفل المايكرفون: owner/moderator only */}
                    {(isOwner || isModerator) && <button
                      onClick={() => {
                        toggleLockSeat(selectedEmptySeat);
                        setSelectedEmptySeat(null);
                      }}
                      className="w-full py-3 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>
                        {getSeat(selectedEmptySeat).isLocked ? 'فتح المايكرفون' : 'قفل المايكرفون'}
                      </span>
                    </button>}
                  </>
                ) : (
                  /* User is not on a mic */
                  <>
                    {/* اصعد بنفسي */}
                    <button
                      onClick={() => {
                        takeSeat(selectedEmptySeat);
                        setSelectedEmptySeat(null);
                      }}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 active:scale-98 transition cursor-pointer"
                    >
                      <Mic className="w-5 h-5" />
                      <span>اصعد بنفسي</span>
                    </button>

                    {/* قفل المايكرفون: owner/moderator only */}
                    {(isOwner || isModerator) && <button
                      onClick={() => {
                        toggleLockSeat(selectedEmptySeat);
                        setSelectedEmptySeat(null);
                      }}
                      className="w-full py-3 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>
                        {getSeat(selectedEmptySeat).isLocked ? 'فتح المايكرفون' : 'قفل المايكرفون'}
                      </span>
                    </button>}
                  </>
                )}

                {/* Cancel button */}
                <button
                  onClick={() => setSelectedEmptySeat(null)}
                  className="w-full py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            DIRECT MESSAGES SHEET (✉️)
            ========================================================================= */}
        {showMessagesSheet && (
          <div
            onClick={() => setShowMessagesSheet(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end justify-center animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#160d33] border-t border-purple-500/30 rounded-t-3xl p-5 shadow-2xl animate-in slide-in-from-bottom max-h-[70vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <span className="font-black text-white text-sm">الرسائل المباشرة</span>
                <button
                  onClick={() => setShowMessagesSheet(false)}
                  className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => {
                      sounds.playClick();
                      setShowMessagesSheet(false);
                      setOpenChatThread(conv);
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 cursor-pointer transition active:scale-98"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shrink-0">
                      <img src={conv.userAvatar} alt={conv.userName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 text-right">
                      <h4 className="text-xs font-black text-white">{conv.userName}</h4>
                      <p className="text-[11px] text-slate-300 truncate">{conv.lastMessage}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ROOM BACKGROUND CHANGER MODAL (تغيير خلفية الغرفة وحفظها)
            ========================================================================= */}
        {showChangeBgModal && (
          <div
            onClick={() => setShowChangeBgModal(false)}
            className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-gradient-to-b from-[#1c0e3a] to-[#0c051f] rounded-3xl p-5 shadow-2xl border border-purple-400/30 text-white flex flex-col max-h-[90vh] overflow-y-auto animate-in zoom-in-95"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">تغيير خلفية الغرفة 🎨</h3>
                    <p className="text-[10px] text-purple-200">اختر من القوالب أو ارفع صورة مخصصة</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChangeBgModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Live Preview Box */}
              <div className="space-y-1 mb-4">
                <span className="text-[11px] font-bold text-purple-200 block">معاينة مباشرة للخلفية:</span>
                <div className="relative w-full h-32 rounded-2xl overflow-hidden border-2 border-purple-400/40 shadow-inner">
                  <img
                    src={selectedBgPreview}
                    alt="معاينة الخلفية"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 flex items-center justify-center">
                    <div className="bg-black/60 backdrop-blur-xs px-3 py-1 rounded-full border border-white/20 text-[10px] font-bold text-white flex items-center gap-1">
                      <span>{activeRoom.title}</span>
                      <span className="text-[#26d0b2]">🎙️ معاينة</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ready Presets */}
              <div className="space-y-2 mb-4">
                <span className="text-[11px] font-bold text-purple-200 block">الخلفيات الجاهزة:</span>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_BACKGROUNDS.map((bg) => (
                    <div
                      key={bg.id}
                      onClick={() => {
                        sounds.playClick();
                        setSelectedBgPreview(bg.url);
                        setBgUploadError(null);
                      }}
                      className={`relative p-1.5 rounded-xl border cursor-pointer transition active:scale-95 overflow-hidden flex flex-col items-center gap-1 ${
                        selectedBgPreview === bg.url
                          ? 'border-[#26d0b2] bg-purple-900/50 shadow-[0_0_12px_rgba(38,208,178,0.4)]'
                          : 'border-white/10 bg-white/5 hover:border-purple-300/40'
                      }`}
                    >
                      <div className="w-full h-14 rounded-lg overflow-hidden">
                        <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-200 text-center truncate w-full">
                        {bg.name}
                      </span>
                      {selectedBgPreview === bg.url && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#26d0b2] text-slate-950 flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Image Upload */}
              <div className="space-y-2 mb-4">
                <span className="text-[11px] font-bold text-purple-200 block">أو ارفع خلفية مخصصة من جهازك:</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleCustomBgUpload}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-purple-400/50 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
                >
                  <UploadCloud className="w-4 h-4 text-purple-300" />
                  <span className="text-xs font-bold text-purple-200">اختر صورة (JPG, PNG, WEBP حتى 5MB)</span>
                </button>
                {bgUploadError && (
                  <p className="text-[10px] text-rose-400 font-bold px-1">{bgUploadError}</p>
                )}
              </div>

              {/* Action Buttons: Save and Cancel */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={handleSaveBackground}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-lg hover:brightness-110 active:scale-95 transition cursor-pointer"
                >
                  حفظ وتطبيق على الجميع ✨
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setSelectedBgPreview(activeRoom.backgroundUrl || '/galaxy-room-bg.jpg');
                    setShowChangeBgModal(false);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition active:scale-95 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}



        {/* =========================================================================
            ROOM INFO & MANAGEMENT MODAL (معلومات الغرفة وإدارتها 👑)
            ========================================================================= */}
        {roomManagementSection && <RoomManagementPanel roomId={activeRoom.id} section={roomManagementSection} canManage={Boolean(isOwner||currentUser.isSuperAdmin)} onClose={()=>setRoomManagementSection(null)}/>}
        {showSeatLayouts && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" dir="rtl" onClick={()=>setShowSeatLayouts(false)}>
          <div className="w-full max-w-sm rounded-3xl border-2 border-amber-400 bg-emerald-950 p-5 text-white" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="font-black text-lg text-amber-300">🛋️ أشكال ترتيب المقاعد</h3><button onClick={()=>setShowSeatLayouts(false)} aria-label="إغلاق"><X/></button></div>
            <p className="mt-2 text-xs text-emerald-100">نغيّر أماكن المقاعد فقط، بدون تغيير شكل المايك أو نقل المستخدمين</p>
            <div className="mt-4 grid grid-cols-2 gap-3">{([['classic','الكلاسيكي'],['circle','الدائري'],['stage','المسرحي (المنصة)'],['grid','الشبكي المتوازن']] as const).map(([id,label])=><button key={id} type="button" disabled={layoutSaving||(!isOwner&&!currentUser.isSuperAdmin)} onClick={()=>void saveSeatLayout(id)} className={seatLayout===id?'rounded-2xl border border-emerald-400 bg-emerald-900 p-4 text-sm font-bold':'rounded-2xl border border-amber-400/60 bg-emerald-950 p-4 text-sm font-bold'}>{seatLayout===id?'✓ ':''}{label}<span className="mt-2 block text-xs text-amber-200">15 مقعداً</span></button>)}</div>
          </div>
        </div>}
        {showRoomInfoModal && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm" onClick={() => setShowRoomInfoModal(false)} dir="rtl">
            <div onClick={e => e.stopPropagation()} className="w-full max-w-md max-h-[94dvh] overflow-y-auto rounded-[30px] border-2 border-amber-400/75 bg-[#fffefa] p-4 text-slate-900 shadow-[0_20px_70px_rgba(0,0,0,.55)] font-['Cairo',sans-serif]">
              <header className="mb-4 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-900 p-2 text-xl text-amber-300">⚙</span>
                  <div><h3 className="text-base font-black">👑 معلومات الغرفة وإدارتها</h3><p className="text-[11px] text-slate-600">بيانات الغرفة الحقيقية والإدارة والصلاحيات</p></div>
                </div>
                <button type="button" onClick={()=>setShowRoomInfoModal(false)} className="rounded-full border border-slate-200 bg-white p-2 text-xl leading-none shadow-sm" aria-label="إغلاق">×</button>
              </header>
              <div className="mx-auto mb-4 aspect-square w-[min(65%,240px)] overflow-hidden rounded-3xl border-2 border-amber-400 bg-emerald-950 shadow-lg">
                {(coverPreview||activeRoom.coverImage) ? <img src={coverPreview||activeRoom.coverImage} alt="صورة الغرفة" className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-5xl text-amber-300">👑</div>}
              </div>
              {isOwner&&<label className="mb-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-bold text-emerald-900">{coverSaving?'جاري رفع الصورة...':'📷 تغيير صورة الغرفة (مربعة)'}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={coverSaving} className="hidden" onChange={e=>void handleRoomCoverFile(e)}/></label>}
              <form onSubmit={handleSaveRoomInfo} className="space-y-3">
                <label className="block text-xs font-black">اسم الغرفة:
                  <input value={editTitleInput} onChange={e=>setEditTitleInput(e.target.value)} disabled={!isOwner||roomInfoSaving} minLength={2} maxLength={60} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold shadow-sm disabled:opacity-70"/>
                </label>
                <label className="block text-xs font-black text-emerald-900">رسالة الترحيب عند الدخول:
                  <textarea value={editAnnouncementInput} onChange={e=>setEditAnnouncementInput(e.target.value)} disabled={!isOwner||roomInfoSaving} maxLength={500} rows={3} className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm disabled:opacity-70"/>
                </label>
                <label className="block text-xs font-black">وسم وتصنيف الغرفة:
                  <input value={editTagInput} readOnly title="وسم الغرفة للعرض فقط إلى حين تفعيل حفظ الوسوم على الخادم" maxLength={80} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold shadow-sm disabled:opacity-70"/>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-amber-200 bg-white p-3"><p className="text-[11px] font-bold">نوع الغرفة</p><p className="mt-1 text-sm font-black text-emerald-800">{activeRoom.micsLocked ? 'المقاعد مقفلة 🔒' : 'عامة 🔓'}</p></div>
                  <div className="rounded-xl border border-amber-200 bg-white p-3"><p className="text-[11px] font-bold">التصنيف الحالي</p><p className="mt-1 truncate text-sm font-black text-emerald-800">{activeRoom.tag || 'غير محدد'}</p></div>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
                  <div><p className="text-[11px] text-slate-600">معرّف الغرفة (Room ID)</p><strong className="text-lg text-emerald-900">{activeRoom.publicId ?? 'غير متوفر'}</strong></div>
                  <button type="button" disabled={!activeRoom.publicId} onClick={()=>handleCopyId(String(activeRoom.publicId))} className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-900 disabled:opacity-40">📋 نسخ</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {title:'ترتيب المقاعد',value:`${activeRoom.seats.length} مقعداً`,action:()=>{setShowRoomInfoModal(false);setShowSeatLayouts(true);}},
                    {title:'المحظورون',value:'عرض القائمة',action:()=>{setShowRoomInfoModal(false);setShowBansModal(true);}},
                    {title:'المشرفون',value:`${activeRoom.moderatorIds?.length ?? 0} مشرف`,action:()=>{setShowRoomInfoModal(false);setShowMembersModal(true);}},
                    {title:'أعضاء الغرفة',value:`${(serverMembersStatus === 'ready' ? serverRoomMembers.length : serverMembersStatus === 'error' ? '—' : activeRoom.listenersCount)} عضو`,action:()=>{setShowRoomInfoModal(false);setShowMembersModal(true);}},
                    {title:'قواعد الغرفة',value:'عرض وتعديل',action:()=>{setShowRoomInfoModal(false);setRoomManagementSection('rules');}},
                    {title:'إعدادات متقدمة',value:'صلاحيات الإدارة',action:()=>{setShowRoomInfoModal(false);setShowMembersModal(true);}},
                    {title:'الرسائل التلقائية',value:'إدارة النص',action:()=>{setShowRoomInfoModal(false);setRoomManagementSection('auto_message');}},
                    {title:'إعلانات الغرفة',value:'إدارة الإعلان',action:()=>{setShowRoomInfoModal(false);setRoomManagementSection('announcement');}},
                    {title:'سجل الإدارة',value:'آخر الإجراءات',action:()=>{setShowRoomInfoModal(false);setRoomManagementSection('history');}},
                  ].map(item=><button key={item.title} type="button" onClick={item.action} className="min-h-20 rounded-xl border border-amber-200 bg-white p-2 text-center shadow-sm"><p className="text-[12px] font-black">{item.title}</p><p className="mt-1 text-[10px] text-emerald-800">{item.value}</p><span className="text-amber-600">‹</span></button>)}
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-black">رسالة الترحيب الحالية</p><p className="mt-1 whitespace-pre-wrap text-xs text-slate-700">{activeRoom.announcement || 'لم يضف مالك الغرفة رسالة بعد'}</p></div>
                <div className="flex gap-2 pt-1">
                  {isOwner&&<button type="submit" disabled={roomInfoSaving} className="flex-1 rounded-xl bg-emerald-900 p-3 text-sm font-black text-white shadow-md">{roomInfoSaving ? 'جاري الحفظ...' : '👑 حفظ التعديلات'}</button>}
                  <button type="button" onClick={()=>setShowRoomInfoModal(false)} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black">إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MEMBERS & MODERATORS MODAL (أعضاء ومشرفو الغرفة 👥)
            ========================================================================= */}
        {showMembersModal && (
          <div
            onClick={() => setShowMembersModal(false)}
            className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-gradient-to-b from-[#180d36] to-[#0d061f] border border-purple-400/40 rounded-3xl p-5 shadow-2xl text-white space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">أعضاء ومشرفو الغرفة 👥</h3>
                    <p className="text-[10px] text-purple-200">
                      {isOwner ? 'إدارة الصلاحيات والمشرفين' : 'قائمة المتواجدين في الغرفة'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                {serverMembersStatus === 'loading' && <p className="text-xs text-slate-300">جارٍ جلب الأعضاء...</p>}
                {serverMembersStatus === 'error' && <p className="text-xs text-rose-300">تعذر تحميل القائمة المباشرة من الخادم</p>}
                {serverMembersStatus === 'ready' && <p className="text-xs text-emerald-300">الأعضاء المسجلون بالغرفة: {serverRoomMembers.length}</p>}
                {serverMembersStatus === 'ready' && serverRoomMembers.filter(member => member.seat_no == null && member.user_id !== activeRoom.hostId && !activeRoom.seats.some(seat => seat.user?.id === member.user_id)).map(member => (
                  <button type="button" key={member.user_id} onClick={() => {
                    setInternalProfileUser({
                      ...currentUser,
                      id: member.user_id,
                      name: member.display_name || 'مستخدم',
                      nickname: member.display_name || 'مستخدم',
                      avatar: member.avatar_url || '',
                      wealthExp: 0,
                      charmExp: 0,
                      coins: 0,
                      diamonds: 0,
                      vipLevel: 0,
                    });
                    setOpenInternalProfileModal(true);
                    setShowMembersModal(false);
                  }} className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-right hover:bg-white/10" aria-label={`فتح ملف ${member.display_name || 'مستخدم'}`}>
                    <div className="flex min-w-0 items-center gap-2.5">
                      {member.avatar_url && /^https?:\/\//i.test(member.avatar_url) ? (
                        <img src={member.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-full border border-emerald-300/40 object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-900/40"><Users className="h-4 w-4 text-emerald-200" /></div>
                      )}
                      <span className="truncate text-xs font-bold text-white">{member.display_name || 'مستخدم'}</span>
                    </div>
                    <span className="shrink-0 text-[10px] text-slate-300">عرض الملف</span>
                  </button>
                ))}
                {/* Host User */}
                <div className="p-2.5 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400">
                      <img src={activeRoom.hostAvatar} alt={activeRoom.hostName} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white">{activeRoom.hostName}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-slate-950">مالك 👑</span>
                      </div>
                      <span className="text-[10px] text-slate-300 font-mono">ID:{hostAccountId}</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-amber-300 font-bold">صاحب الغرفة</span>
                </div>

                {/* Other Users on seats */}
                {activeRoom.seats
                  .filter((s) => s.user && s.user.id !== activeRoom.hostId)
                  .map((seat) => {
                    if (!seat.user) return null;
                    const user = seat.user;
                    const isMod = (activeRoom.moderatorIds || []).includes(user.id);

                    return (
                      <div key={user.id} className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <div
                          onClick={() => handleOpenUserProfile(user)}
                          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition"
                        >
                          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-purple-300">
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white">{user.name}</span>
                              {isMod && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-cyan-600 text-white">مشرف 🛡️</span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">المايك NO {seat.seatNumber}</span>
                          </div>
                        </div>

                        {(isOwner || isModerator) && user.id !== currentUser.id && user.id !== activeRoom.hostId && (
                          <div className="flex items-center gap-1.5">
                            {isOwner && <button
                              disabled={moderationBusy}
                              onClick={() => handleToggleModerator(user.id, user.name)}
                              className={`p-1.5 rounded-lg text-[10px] font-bold transition active:scale-95 ${
                                isMod
                                  ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                                  : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                              }`}
                              title={isMod ? 'إلغاء الإشراف' : 'ترقية إلى مشرف'}
                            >
                              {isMod ? <UserMinus className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                            </button>}
                            <button
                              disabled={moderationBusy}
                              onClick={() => handleKickMember(user.id, user.name)}
                              className="p-1.5 rounded-lg bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 text-[10px] font-bold transition active:scale-95"
                              title="طرد من الغرفة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {(isOwner || isModerator) && <button type="button" disabled={moderationBusy} onClick={() => void handleVoiceModeration(user.id, 'ban')} className="rounded-lg bg-red-800/50 px-2 py-1.5 text-[10px] font-bold text-red-200" title="حظر وطرد دائم من الغرفة">حظر الغرفة</button>}
                            <button type="button" onClick={() => void setPersonalBlock(user.id, !personalBlocks.some(item => item.userId === user.id))} className="rounded-lg bg-slate-700 px-2 py-1.5 text-[10px] text-white">{personalBlocks.some(item => item.userId === user.id) ? 'فك الحظر الشخصي' : 'حظر شخصي'}</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            AGENCY INFO MODAL (إدارة وبطاقة الوكالة 🏢👑)
            ========================================================================= */}
        {showAgencyInfoModal && (
          <div
            onClick={() => setShowAgencyInfoModal(false)}
            className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-gradient-to-b from-[#1a0e3a] to-[#0c051f] border border-purple-400/40 rounded-3xl p-5 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">بطاقة وإدارة الوكالة 🏢👑</h3>
                    <p className="text-[10px] text-purple-200">بيانات وكالتك وصلاحيات مالك الوكالة</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAgencyInfoModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-tr from-purple-900/50 via-indigo-900/40 to-purple-800/50 border border-purple-400/40 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👑</span>
                    <div>
                      <h4 className="text-sm font-black text-amber-300">{activeRoom.agencyName || 'وكالة توتي شات الملكية'}</h4>
                      <span className="text-[10px] text-purple-200">الوكالة الرسمية المعتمدة</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    مالك الوكالة 👑
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center pt-2">
                  <div className="p-2 bg-black/30 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">معرّف الوكالة (Agency ID):</span>
                    <span className="text-xs font-mono font-bold text-white">{activeRoom.agencyId || '88902'}</span>
                  </div>
                  <div className="p-2 bg-black/30 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">عدد الأعضاء:</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">58 عضو نشط</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setShowAgencyInfoModal(false);
                    setOpenAgencyModal(true);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>فتح مركز الوكالة الكامل (Agency Center)</span>
                </button>
                <button
                  onClick={() => setShowAgencyInfoModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            HOST CENTER MODAL (مركز المضيفين 🎙️)
            ========================================================================= */}
        {showHostCenterModal && (
          <div
            onClick={() => setShowHostCenterModal(false)}
            className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-gradient-to-b from-[#180d36] to-[#0c051f] border border-purple-400/40 rounded-3xl p-5 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">مركز المضيفين (Host Center) 🎙️</h3>
                    <p className="text-[10px] text-purple-200">إحصائيات البث ومكافآت الاستضافة</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHostCenterModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400 block mb-1">ساعات البث الشهري:</span>
                  <span className="text-base font-black text-cyan-300 font-mono">42.5 ساعة</span>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400 block mb-1">الأرباح من الهدايا:</span>
                  <span className="text-base font-black text-amber-300 font-mono">45,200 💎</span>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400 block mb-1">الرتبة المضيفة:</span>
                  <span className="text-xs font-black text-emerald-400">مضيف بلاتيني 🌟</span>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400 block mb-1">جودة البث:</span>
                  <span className="text-xs font-black text-purple-300">1080p Ultra HD</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/30 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">حالة الهدف الشهري:</span>
                  <span className="text-[10px] text-slate-300">حققت 85% من أهداف البث الماسي</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-black">نشط ✓</span>
              </div>

              <button
                onClick={() => setShowHostCenterModal(false)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            DECORATIONS & CUSTOMIZATION MODAL (زينة وتخصيص الغرفة 🎨👑)
            ========================================================================= */}
        {showDecorationsModal && (
          <div
            onClick={() => setShowDecorationsModal(null)}
            className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-gradient-to-b from-[#1a0e3a] to-[#0c051f] border border-purple-400/40 rounded-3xl p-5 shadow-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-300 flex items-center justify-center">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">زينة وتخصيص الغرفة 🎨👑</h3>
                    <p className="text-[10px] text-purple-200">تخصيص المظهر، المقاعد واللقب</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDecorationsModal(null)}
                  className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs: mic | frame | title */}
              <div className="flex items-center justify-around bg-black/30 p-1 rounded-2xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setShowDecorationsModal('mic')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    showDecorationsModal === 'mic' ? 'bg-purple-600 text-white' : 'text-slate-400'
                  }`}
                >
                  مظهر المايك 🎙️
                </button>
                <button
                  type="button"
                  onClick={() => setShowDecorationsModal('frame')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    showDecorationsModal === 'frame' ? 'bg-purple-600 text-white' : 'text-slate-400'
                  }`}
                >
                  إطار المقاعد 👑
                </button>
                <button
                  type="button"
                  onClick={() => setShowDecorationsModal('title')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    showDecorationsModal === 'title' ? 'bg-purple-600 text-white' : 'text-slate-400'
                  }`}
                >
                  اللقب الملوّن ✨
                </button>
              </div>

              {showDecorationsModal === 'mic' && (
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'mint', name: 'فيروزي نيون (افتراضي)', color: 'text-[#26d0b2]' },
                    { id: 'gold', name: 'ذهبي إمبراطوري', color: 'text-amber-400' },
                    { id: 'cyan', name: 'سماوي فضائي', color: 'text-cyan-300' },
                    { id: 'ruby', name: 'ياقوتي ملكي', color: 'text-rose-400' },
                  ].map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleApplyDecoration('mic', item.id)}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-400/50 flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition"
                    >
                      <Mic className={`w-6 h-6 ${item.color} stroke-[2.2]`} />
                      <span className="text-[11px] font-bold text-white">{item.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {showDecorationsModal === 'frame' && (
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'purple', name: 'إطار المجرة البنفسجي' },
                    { id: 'gold', name: 'الإطار الملكي الذهبي' },
                    { id: 'cyan', name: 'درع السايبر السماوي' },
                    { id: 'ruby', name: 'قلب الياقوت المتوهج' },
                  ].map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleApplyDecoration('frame', item.id)}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-400/50 flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition"
                    >
                      <span className="text-2xl">👑</span>
                      <span className="text-[11px] font-bold text-white">{item.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {showDecorationsModal === 'title' && (
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'white', name: 'أبيض كريستالي', preview: 'text-white' },
                    { id: 'gold', name: 'ذهبي ناصع', preview: 'text-amber-300' },
                    { id: 'cyan', name: 'سماوي نيون', preview: 'text-cyan-300' },
                    { id: 'pink', name: 'وردي رومانسي', preview: 'text-pink-300' },
                  ].map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleApplyDecoration('title', item.id)}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-400/50 flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition"
                    >
                      <span className={`text-sm font-black ${item.preview}`}>توتي شات</span>
                      <span className="text-[11px] font-bold text-slate-300">{item.name}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowDecorationsModal(null)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}

        

        {/* =========================================================================
            ROOM STATS MODAL (إحصائيات ونشاط الغرفة 📊)
            ========================================================================= */}
        {showBansModal && (
          <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/80 p-4" dir="rtl" onClick={() => setShowBansModal(false)}>
            <div onClick={event => event.stopPropagation()} className="max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-3xl border border-white/20 bg-[#141126] p-5 text-white">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold">قوائم المحظورين</h3>
                <button type="button" onClick={() => setShowBansModal(false)} aria-label="إغلاق"><X className="h-5 w-5" /></button>
              </div>
              {banListError && <p className="mb-3 text-xs text-rose-300">{banListError}</p>}
              <button type="button" onClick={() => void refreshBanLists().catch(error => setBanListError(String(error)))} className="mb-4 rounded-lg bg-white/10 px-3 py-2 text-xs">تحديث القوائم</button>
              {(isOwner || isModerator) && <section className="mb-5">
                <h4 className="mb-2 text-sm font-bold text-amber-300">المحظورون من الغرفة ({roomBans.length})</h4>
                {roomBans.length === 0 && <p className="text-xs text-slate-400">لا يوجد محظورون من الغرفة</p>}
                {roomBans.map(item => <div key={item.userId} className="mb-2 rounded-xl bg-white/5 p-3 text-xs">
                  <div className="flex items-center gap-2">{item.avatar ? <img src={item.avatar} alt="" className="h-9 w-9 rounded-full object-cover" /> : <CircleUserRound className="h-9 w-9 text-slate-400" />}<div className="min-w-0"><p className="truncate font-bold">{item.name || 'مستخدم'}</p><p className="text-slate-400">ID: {item.publicId ?? '—'}</p></div></div>
                  {item.reason && <p className="mt-1 text-slate-400">السبب: {item.reason}</p>}
                  <button disabled={banActionBusy || (!isOwner && item.bannedByOwner)} onClick={() => void unbanRoomUser(item.userId)} className="mt-2 rounded-lg bg-emerald-700 px-3 py-2 disabled:opacity-50">{!isOwner && item.bannedByOwner ? "حظر المالك" : "فك حظر الغرفة"}</button>
                </div>)}
              </section>}
              <section>
                <h4 className="mb-2 text-sm font-bold text-cyan-300">الحظر الشخصي ({personalBlocks.length})</h4>
                {personalBlocks.length === 0 && <p className="text-xs text-slate-400">لا يوجد أشخاص محظورون</p>}
                {personalBlocks.map(item => <div key={item.userId} className="mb-2 flex items-center justify-between gap-2 rounded-xl bg-white/5 p-3 text-xs">
                  <div className="flex min-w-0 items-center gap-2">{item.avatar ? <img src={item.avatar} alt="" className="h-8 w-8 rounded-full object-cover" /> : <CircleUserRound className="h-8 w-8 text-slate-400" />}<div><p className="font-bold">{item.name || 'مستخدم'}</p><p className="text-slate-400">ID: {item.publicId ?? '—'}</p></div></div>
                  <button disabled={banActionBusy} onClick={() => void setPersonalBlock(item.userId, false)} className="shrink-0 rounded-lg bg-emerald-700 px-3 py-2 disabled:opacity-50">فك الحظر</button>
                </div>)}
              </section>
            </div>
          </div>
        )}
        {showRoomStatsModal && (
          <div
            onClick={() => setShowRoomStatsModal(false)}
            className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-gradient-to-b from-[#180d36] to-[#0c051f] border border-purple-400/40 rounded-3xl p-5 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">إحصائيات ونشاط الغرفة 📊</h3>
                    <p className="text-[10px] text-purple-200">الترتيب والمساهمات اليومية والشهرية</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRoomStatsModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {roomGiftStatsError && <p className="text-xs text-rose-300">تعذر عرض الإحصائيات: {roomGiftStatsError}</p>}
              <p className="text-[10px] text-slate-400">الثروة = الهدايا المرسلة، والسحر = الهدايا المستلمة داخل الغرفة. إجمالي القيمتين متساوٍ لأن كل هدية مسجلة لها مرسل ومستلم.</p>
              <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                <span className="text-amber-300 font-bold">الكأس</span>
                <span className="text-slate-200">يومياً</span>
                <span className="text-slate-200">أسبوعياً</span>
                <span className="text-slate-200">شهرياً</span>
                {(['الثروة', 'السحر'] as const).map(label => (
                  <React.Fragment key={label}>
                    <span className="rounded-lg bg-amber-500/10 py-2 font-bold text-amber-300">{label}</span>
                    {(['today', 'week', 'month'] as const).map(period => <span key={period} className="rounded-lg bg-white/5 py-2 text-slate-300" title={label === 'الثروة' ? 'قيمة الهدايا المرسلة داخل الغرفة' : 'قيمة الهدايا المستلمة داخل الغرفة'}>{roomGiftStats ? roomGiftStats[period].toLocaleString('en-US') : '—'}</span>)}
                  </React.Fragment>
                ))}
              </div>
              <p className="text-[10px] text-slate-400">إجمالي قيمة الهدايا المسجلة بالغرفة حسب الفترة:</p>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-purple-950/40 rounded-2xl border border-purple-400/30 text-center">
                  <span className="text-[10px] text-slate-400 block mb-1">كأس الغرفة والترتيب:</span>
                  <span className="text-base font-black text-amber-300 font-mono">{roomGiftRank ? `#${roomGiftRank.rank}` : '—'}</span>
                  <span className="text-[9px] text-amber-200 block">{roomGiftRank ? `من أصل ${roomGiftRank.roomCount} غرفة · الترتيب الشهري` : 'الترتيب غير متاح حالياً'}</span>
                </div>
                <div className="p-3 bg-purple-950/40 rounded-2xl border border-purple-400/30 text-center">
                  <span className="text-[10px] text-slate-400 block mb-1">المساهمات اليومية:</span>
                  <span className="text-base font-black text-cyan-300 font-mono">{roomGiftStats ? roomGiftStats.today.toLocaleString('en-US') + ' 🪙' : '—'}</span>
                  <span className="text-[9px] text-cyan-200 block">اليوم</span>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400 block mb-1">المساهمات الأسبوعية:</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">{roomGiftStats ? roomGiftStats.week.toLocaleString('en-US') + ' 🪙' : '—'}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400 block mb-1">المساهمات الشهرية:</span>
                  <span className="text-sm font-black text-purple-300 font-mono">{roomGiftStats ? roomGiftStats.month.toLocaleString('en-US') + ' 🪙' : '—'}</span>
                </div>
              </div>

              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>عدد الحضور المعروض حالياً:</span>
                </div>
                <span className="font-mono font-bold text-white">{(serverMembersStatus === 'ready' ? serverRoomMembers.length : serverMembersStatus === 'error' ? '—' : activeRoom.listenersCount)} عضو حالياً</span>
              </div>

              <button
                onClick={() => setShowRoomStatsModal(false)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
