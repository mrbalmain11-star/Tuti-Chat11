Warning: truncated output (original token count: 53187)
Total output lines: 3634

import { VipMessageFrame } from './VipMessageFrame';
import { stagingBackend } from '../services/stagingBackend';
import { RoomManagementPanel } from './RoomManagementPanel';
import { App as CapacitorApp } from '@capacitor/app';
import { playRoomMusic, pauseRoomMusic, resumeRoomMusic, stopRoomMusic, getRoomMusicProgress, seekRoomMusic, setRoomMusicVolume } from '../services/isolatedRoomMusic';
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { RoyalGiftIcon } from './RoyalGiftIcon';
import { RoyalSeatIcon } from './RoyalSeatIcon';
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
  const previousModeratorRoleRef = useRef<{ roomId: string; wasModerator: boolean } | null>(null);
  useEffect(() => {
    const roomId = activeRoom?.id;
    if (!roomId) {
      previousModeratorRoleRef.current = null;
      return;
    }
    const previous = previousModeratorRoleRef.current;
    if (previous?.roomId === roomId && previous.wasModerator && !isModerator && !isOwner) {
      setShowSeatLayouts(false);
      setRoomManagementSection(null);
      showToast('تم سحب صلاحية الإشراف. أُغلقت أدوات الإدارة.');
    } else if (previous?.roomId === roomId && !previous.wasModerator && isModerator && !isOwner) {
      showToast('تم منحك صلاحية الإشراف. أدوات الإدارة متاحة الآن.');
    }
    previousModeratorRoleRef.current = { roomId, wasModerator: isModerator };
  }, [activeRoom?.id, isModerator, isOwner]);

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
  const [roomBans, setRoomBans] = useState<Array<{ userId: string; name?: string; publicId?: number; avatar?: string; reason?: string; bannedByOwner?: boolean; expiresAt?: string | null }>>([]);
  const [personalBlocks, setPersonalBlocks] = useState<Array<{ userId: string; name?: string; publicId?: number; avatar?: string }>>([]);
  const [banListError, setBanListError] = useState('');
  const [banActionBusy, setBanActionBusy] = useState(false);
  const moderationPendingRef = useRef(new Set<string>());
  const [moderationBusy, setModerationBusy] = useState(false);
  useEffect(() => {
    if (!isOwner && !isModerator) setRoomBans([]);
  }, [activeRoom?.id, isOwner, isModerator]);

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
    if (!showBansModal || !activeRoom?.id || !stagingBackend) return;
    let active = true;
    let pending = false;
    const roomId = activeRoom.id;
    const banClient = stagingBackend;
    const refresh = async () => {
      if (pending || !active) return;
      pending = true;
      try {
        const { data, error } = await banClient.rpc('totichat_blocked_profiles', {
          p_room_id: isOwner || isModerator ? roomId : null,
        });
        if (error) throw error;
        if (!active) return;
        setPersonalBlocks(data?.personal ?? []);
        setRoomBans(data?.room ?? []);
        setBanListError('');
      } catch (error) {
        if (active) setBanListError(error instanceof Error ? error.message : 'تعذر تحميل قائمة المحظورين');
      } finally { pending = false; }
    };
    void refresh();
    const refreshVisible = () => { if (!document.hidden && navigator.onLine) void refresh(); };
    const timer = window.setInterval(refreshVisible, 5000);
    window.addEventListener('focus', refreshVisible);
    window.addEventListener('online', refreshVisible);
    document.addEventListener('visibilitychange', refreshVisible);
    window.addEventListener('totichat:room-moderators-changed', refreshVisible);
    window.addEventListener('totichat:room-bans-changed', refreshVisible);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshVisible);
      window.removeEventListener('online', refreshVisible);
      document.removeEventListener('visibilitychange', refreshVisible);
      window.removeEventListener('totichat:room-moderators-changed', refreshVisible);
      window.removeEventListener('totichat:room-bans-changed', refreshVisible);
    };
  }, [showBansModal, activeRoom?.id, isOwner, isModerator]);
  const setPersonalBlock = async (targetId: string, block: boolean) => {
    if (!stagingBackend || targetId === currentUser.id || banActionBusy) return;
    setBanActionBusy(true);
    try {
      const { data, error } = await stagingBackend.rpc('phase2_dm_block', { p_other_user: targetId, p_block: block });
      if (error || data !== true) throw error ?? new Error('لم يؤكد الخادم الحظر');
      await refreshBanLists();
      window.dispatchEvent(new CustomEvent('totichat:room-bans-changed', { detail: activeRoom?.id }));
      window.dispatchEvent(new Event('totichat:personal-blocks-changed'));
      showToast(block ? 'تم الحظر الشخصي' : 'تم فك الحظر الشخصي');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'تعذر تغيير الحظر الشخصي');
    } finally { setBanActionBusy(false); }
  };
  const unbanRoomUser = async (targetId: string) => {
    if ((!isOwner && !isModerator) || !activeRoom || !stagingBackend || banActionBusy) return;
    setBanActionBusy(true);
    try {
      if (!isOwner) {
        const { data: moderators, error: roleError } = await stagingBackend.rpc('totichat_room_moderator_ids', { p_room_id: activeRoom.id });
        if (roleError || !Array.isArray(moderators) || !moderators.includes(currentUser.id)) {
          window.dispatchEvent(new CustomEvent('totichat:room-moderators-changed', { detail: activeRoom.id }));
          throw new Error('تم سحب صلاحية الإشراف أو تعذر التحقق منها');
        }
      }
      const { data: latestBans, error: bansError } = await stagingBackend.rpc('totichat_blocked_profiles', { p_room_id: activeRoom.id });
      if (bansError || !Array.isArray(latestBans?.room)) throw bansError ?? new Error('تعذر التحقق من الحظر الحالي');
      const targetBan = latestBans.room.find((item: { userId: string }) => item.userId === targetId);
      if (!targetBan) {
        setRoomBans(latestBans.room);
        showToast('المستخدم غير محظور حالياً؛ تم تحديث القائمة');
        return;
      }
      if (!isOwner && targetBan.bannedByOwner) {
        setRoomBans(latestBans.room);
        throw new Error('حظر المالك لا يستطيع المشرف إزالته');
      }
      const { data, error } = await stagingBackend.rpc('phase2_room_moderate', {
        p_room_id: activeRoom.id, p_target: targetId, p_action: 'unban', p_request_id: crypto.randomUUID(),
      });
      if (error || data?.success !== true) throw error ?? new Error('لم يؤكد الخادم فك الحظر');
      window.dispatchEvent(new CustomEvent('totichat:room-bans-changed', { detail: activeRoom.id }));
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
  const [selectedMicVerifiedStatus, setSelectedMicVerifiedStatus] = useState<{ userId: string; wealthExp: number; charmExp: number; vipLevel: number; loadFailed?: boolean } | null>(null);
  useEffect(() => {
    let active = true;
    const userId = selectedMicUser?.user.id;
    setSelectedMicVerifiedStatus(null);
    if (!userId || !stagingBackend) return;
    void Promise.resolve(stagingBackend.rpc('staging_visited_profile_status', { p_user_id: userId }))
      .then(({ data, error }) => {
        if (error) throw error;
        if (!active || !data) return;
        const row = data as { wealth_exp?: unknown; charm_exp?: unknown; vip_tier?: unknown };
        const wealthExp = Number(row.wealth_exp);
        const charmExp = Number(row.charm_exp);
        const vipLevel = Number(row.vip_tier);
        setSelectedMicVerifiedStatus({
          userId,
          wealthExp: Number.isSafeInteger(wealthExp) && wealthExp >= 0 ? wealthExp : 0,
          charmExp: Number.isSafeInteger(charmExp) && charmExp >= 0 ? charmExp : 0,
          vipLevel: Number.isSafeInteger(vipLevel) && vipLevel >= 0 ? vipLevel : 0,
        });
      }).catch(error => {
        console.warn('Verified room profile levels unavailable:', error);
        if (active) setSelectedMicVerifiedStatus({ userId, wealthExp: 0, charmExp: 0, vipLevel: 0, loadFailed: true });
      });
    return () => { active = false; };
  }, [selectedMicUser?.user.id]);
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
  useEffect(() => { setCoverPreview(null); }, [activeRoom?.id]);
  useEffect(() => {
    if (!showRoomInfoModal || !activeRoom) return;
    setEditTitleInput(activeRoom.title || '');
    setEditAnnouncementInput(activeRoom.announcement || '');
    setEditTagInput(activeRoom.tag || '');
  }, [showRoomInfoModal, activeRoom?.id]);
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
      await updateRoom(activeRoom.id, { title, announcement: welcome, tag: editTagInput.trim() });
      showToast('تم حفظ اسم الغرفة ورسالة الترحيب والوسم على الخادم.');
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
    try {
      // Read the current server role before deciding whether this is a grant or revoke.
      // The local moderator list may lag behind a change made on another device.
      const { data: serverModeratorIds, error: rosterError } = await stagingBackend.rpc('totichat_room_moderator_ids', { p_room_id: roomId });
      if (rosterError || !Array.isArray(serverModeratorIds)) throw rosterError ?? new Error('Moderator roster unavailable');
      const isMod = serverModeratorIds.includes(userId);
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
    const roomId = activeRoom.id;
    if (userId === currentUser.id || userId === activeRoom.hostId) return;
    try {
      if (!isOwner) {
        const { data: latestModeratorIds, error: roleError } = await stagingBackend.rpc('totichat_room_moderator_ids', { p_room_id: roomId });
        if (roleError || !Array.isArray(latestModeratorIds) || !latestModeratorIds.includes(currentUser.id)) {
          window.dispatchEvent(new CustomEvent('totichat:room-moderators-changed', { detail: roomId }));
          showToast('تم سحب صلاحية الإشراف أو تعذر التحقق منها. تم إلغاء رفع الكتم.');
          return;
        }
      }
      const { data, error } = await stagingBackend.rpc('phase2_room_moderate', {
        p_room_id: activeRoom.id, p_target: userId,
        p_action: 'allow_mic', p_request_id: crypto.randomUUID(),
      });
      if (error || !data?.success) throw error ?? new Error('Permission not confirmed');
      window.dispatchEvent(new CustomEvent('totichat:room-moderators-changed', { detail: roomId }));
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
    let durationSeconds: number | null = null;
    if (action === 'ban') {
      const durationChoice = window.prompt(
        'مدة حظر الغرفة: دائم، 10د، 30د، 1س، 6س، 12س، 24س، 3أيام، 7أيام، 30يوماً',
        'دائم',
      );
      if (durationChoice === null) return;
      const durations: Record<string, number | null> = {
        'دائم': null, '10د': 600, '30د': 1800, '1س': 3600, '6س': 21600,
        '12س': 43200, '24س': 86400, '3أيام': 259200, '7أيام': 604800, '30يوماً': 2592000,
      };
      if (!Object.prototype.hasOwnProperty.call(durations, durationChoice.trim())) {
        showToast('اختر مدة من القائمة المحددة.');
        return;
      }
      durationSeconds = durations[durationChoice.trim()];
    }
    const reason = action === 'ban' ? window.prompt('سبب الحظر (5 أحرف على الأقل):', 'مخالفة قواعد الغرفة') : null;
    if (action === 'ban' && (!reason || reason.trim().length < 5 || reason.length > 300)) return;
    if (moderationPendingRef.current.has(userId)) return;
    moderationPendingRef.current.add(userId);
    setModerationBusy(true);
    const requestId = crypto.randomUUID();
    try {
      if (!isOwner) {
        // A moderator may have been demoted on another device while this room stayed open.
        const { data: latestModeratorIds, error: roleError } = await stagingBackend.rpc('totichat_room_moderator_ids', { p_room_id: activeRoom.id });
        if (roleError || !Array.isArray(latestModeratorIds) || !latestModeratorIds.includes(currentUser.id)) {
          window.dispatchEvent(new CustomEvent('totichat:room-moderators-changed', { detail: activeRoom.id }));
          showToast('تم سحب صلاحية الإشراف أو تعذر التحقق منها. تم إلغاء الأمر.');
          return;
        }
      }
      const { data, error } = await stagingBackend.functions.invoke('phase2-voice-moderate', {
        body: { roomId: activeRoom.id, targetId: userId, action, requestId,
          ...(reason ? { reason: reason.trim() } : {}),
          ...(action === 'ban' ? { durationSeconds } : {}) },
      });
      if (data?.databaseCommitted === true) {
        // The database has changed even if the voice disconnect acknowledgement fails.
        // Reconcile seats from the server; do not optimistically remove a member.
        window.dispatchEvent(new CustomEvent('totichat:room-moderators-changed', { detail: activeRoom.id }));
        if (action === 'release_seat') {
          window.dispatchEvent(new CustomEvent('totichat:room-seat-changed', { detail: activeRoom.id }));
        }
        if (action === 'ban') {
          window.dispatchEvent(new CustomEvent('totichat:room-bans-changed', { detail: activeRoom.id }));
        }
      }
      if (error || data?.success !== true || data?.sfuDisconnected !== true) {
        console.error('Voice moderation not confirmed:', error, data);
        showToast(data?.databaseCommitted
          ? 'تم تحديث الخادم لكن فصل الصوت غير مؤكد. تحقق من حالة العضو.'
          : 'تعذر تنفيذ الأمر. تحقق من الصلاحيات واتصال الصوت.');
        return;
      }
      if (data?.databaseCommitted !== true) {
        window.dispatchEvent(new CustomEvent('totichat:room-moderators-changed', { detail: activeRoom.id }));
        if (action === 'release_seat') {
          window.dispatchEvent(new CustomEvent('totichat:room-seat-changed', { detail: activeRoom.id }));
        }
        if (action === 'ban') {
          window.dispatchEvent(new CustomEvent('totichat:room-bans-changed', { detail: activeRoom.id }));
        }
      }
      showToast(action === 'ban' ? (durationSeconds === null ? 'تم حظر العضو من الغرفة حتى فك الحظر' : 'تم حظر العضو مؤقتاً وطرده من الغرفة') : action === 'kick' ? 'تم طرد العضو من الغرفة' : action === 'mute'
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
 …23187 tokens truncated… h-8 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-sm">
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
                      disabled={getSeat(selectedEmptySeat).isLocked}
                      onClick={() => {
                        if (getSeat(selectedEmptySeat).isLocked) return;
                        takeSeat(selectedEmptySeat);
                        setSelectedEmptySeat(null);
                      }}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30 active:scale-98 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
                      disabled={getSeat(selectedEmptySeat).isLocked}
                      onClick={() => {
                        if (getSeat(selectedEmptySeat).isLocked) return;
                        takeSeat(selectedEmptySeat);
                        setSelectedEmptySeat(null);
                      }}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 active:scale-98 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
                  <input value={editTagInput} onChange={e=>setEditTagInput(e.target.value)} disabled={!isOwner||roomInfoSaving} maxLength={80} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold shadow-sm disabled:opacity-70"/>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-amber-200 bg-white p-3"><p className="text-[11px] font-bold">حالة المقاعد</p><p className="mt-1 text-sm font-black text-emerald-800">{activeRoom.micsLocked ? 'المقاعد مقفلة 🔒' : 'المقاعد مفتوحة 🔓'}</p></div>
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
                            {(isOwner || isModerator) && <button type="button" disabled={moderationBusy} onClick={() => void handleVoiceModeration(user.id, 'ban')} className="rounded-lg bg-red-800/50 px-2 py-1.5 text-[10px] font-bold text-red-200" title="حظر مؤقت أو دائم من الغرفة">حظر الغرفة</button>}
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
                  {item.expiresAt && <p className="mt-1 text-amber-300">ينتهي: {new Date(item.expiresAt).toLocaleString('ar-IQ')}</p>}
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
