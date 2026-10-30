import { stagingBackend } from '../services/stagingBackend';
import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
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
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MicSeat, UserProfile } from '../types';
import { sounds } from '../utils/audio';
import { VipName } from './VipName';
import { VipBadge } from './VipBadge';


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
  const isModerator = Boolean(
    activeRoom && ((activeRoom.moderatorIds || []).includes(currentUser.id) || currentUser.isSuperAdmin)
  );
  const isVisitor = !isOwner && !isModerator;

  // Local interactive states
  const [showChatInput, setShowChatInput] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Screen clearance mode (مسح الشاشة للمشاهدة النقية)
  const [clearScreen, setClearScreen] = useState(false);

  // Owner & Management Modals
  const [showRoomInfoModal, setShowRoomInfoModal] = useState(false);
  const [showExitOptions, setShowExitOptions] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAgencyInfoModal, setShowAgencyInfoModal] = useState(false);
  const [showHostCenterModal, setShowHostCenterModal] = useState(false);
  const [showRoomStatsModal, setShowRoomStatsModal] = useState(false);
  const [showDecorationsModal, setShowDecorationsModal] = useState<'mic' | 'frame' | 'title' | null>(null);

  // Mic Seat Profile Popup (Image 1 for own account, Image 2 for other users)
  const [roomPublicId, setRoomPublicId] = useState<string>('—');
  useEffect(() => {
    let active = true;
    setRoomPublicId('—');
    if (!activeRoom?.id || !stagingBackend) return;
    void Promise.resolve(stagingBackend.rpc('staging_room_public_id', { p_room_id: activeRoom.id }))
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
    void Promise.resolve(stagingBackend.from('profiles').select('public_id').eq('id', target).maybeSingle())
      .then(({ data, error }) => {
        if (error) throw error;
        if (active && data?.public_id != null) setSelectedMicPublicId(String(data.public_id));
      }).catch(error => console.error('Seat profile ID lookup failed:', error));
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

  useEffect(() => {
    if (activeRoom) {
      if (activeRoom.backgroundUrl) {
        setSelectedBgPreview(activeRoom.backgroundUrl);
      }
      setEditTitleInput(activeRoom.title || '');
      setEditAnnouncementInput(activeRoom.announcement || '');
      setEditTagInput(activeRoom.tag || '');
    }
  }, [activeRoom?.id, activeRoom?.backgroundUrl]);

  const [showRoomModeModal, setShowRoomModeModal] = useState(false);

  // Tools Drawer Sub-Modals
  const [showMusicPlayerModal, setShowMusicPlayerModal] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [tasksClaimed, setTasksClaimed] = useState<Record<string, boolean>>({});

  // Audio / Sound states
  const roomSoundMuted = false;
  const [audioModeHQ, setAudioModeHQ] = useState(true);

  // Floating animated emojis
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; char: string; left: number }[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !activeRoom) return;
    sendRoomMessage(activeRoom.id, chatMessage.trim());
    setChatMessage('');
    setShowChatInput(false);
    sounds.playClick();
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

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setBgUploadError('صيغة غير مدعومة. يرجى اختيار صورة JPG أو PNG أو WEBP.');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setBgUploadError('حجم الصورة كبير جداً. الحد الأقصى المسموح به هو 5 ميجابايت.');
      return;
    }

    setBgUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setSelectedBgPreview(dataUrl);
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
    try {
      await changeRoomBackground(activeRoom.id, selectedBgPreview);
      sounds.playLevelUp();
      showToast('تم حفظ الخلفية على الخادم بنجاح.');
      setShowChangeBgModal(false);
    } catch (error) {
      console.error('Room background save failed:', error);
      showToast(error instanceof Error ? error.message : 'فشل حفظ الخلفية على الخادم.');
    }
  };

  const handleSaveRoomInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoom) return;
    if (!isOwner && !currentUser.isSuperAdmin) {
      sounds.playError();
      showToast('🔒 لا يمكنك تعديل معلومات الغرفة، الصلاحية لمالك الغرفة فقط');
      return;
    }
    updateRoom(activeRoom.id, {
      title: editTitleInput.trim() || activeRoom.title,
      announcement: editAnnouncementInput.trim() || activeRoom.announcement,
      tag: editTagInput.trim() || activeRoom.tag,
    });
    setShowRoomInfoModal(false);
  };

  const handleToggleModerator = async (userId: string, userName: string) => {
    if (!activeRoom || !isOwner || !stagingBackend) {
      showToast('تعيين المشرفين يتطلب ملكية الغرفة والاتصال بالخادم.');
      return;
    }
    const roomId = activeRoom.id;
    const isMod = (activeRoom.moderatorIds || []).includes(userId);
    try {
      const { data, error } = await stagingBackend.rpc('phase2_room_moderate', {
        p_room_id: roomId, p_target: userId,
        p_action: isMod ? 'revoke_moderator' : 'grant_moderator',
        p_request_id: crypto.randomUUID(),
      });
      if (error || !data?.success) throw error ?? new Error('Server did not confirm role change');
      showToast(isMod ? `تم سحب إشراف ${userName}` : `تم منح ${userName} صلاحية المشرف`);
      // Preserve the active voice session; do not reload the entire app.
    } catch (error) {
      console.error('Moderator update failed:', error);
      showToast('رفض الخادم تغيير الصلاحية. تحقق من عضوية المستخدم وصلاحية المالك.');
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

  const handleVoiceModeration = async (userId: string, action: 'kick' | 'mute' | 'release_seat') => {
    if (!activeRoom || !stagingBackend || (!isOwner && !isModerator)) {
      showToast('هذا الأمر متاح لمالك الغرفة والمشرف فقط.');
      return;
    }
    if (userId === currentUser.id || userId === activeRoom.hostId) {
      showToast('لا يمكن تطبيق هذا الأمر على المالك أو نفسك.');
      return;
    }
    const requestId = crypto.randomUUID();
    try {
      const { data, error } = await stagingBackend.functions.invoke('phase2-voice-moderate', {
        body: { roomId: activeRoom.id, targetId: userId, action, requestId },
      });
      if (error || data?.success !== true || data?.sfuDisconnected !== true) {
        console.error('Voice moderation not confirmed:', error, data);
        showToast(data?.databaseCommitted
          ? 'تم تحديث الخادم لكن فصل الصوت غير مؤكد. تحقق من حالة العضو.'
          : 'تعذر تنفيذ الأمر. تحقق من الصلاحيات واتصال الصوت.');
        return;
      }
      showToast(action === 'kick' ? 'تم طرد العضو من الغرفة' : action === 'mute'
        ? 'تم كتم مايك العضو من الخادم' : 'تم إنزال العضو من المقعد');
    } catch (error) {
      console.error('Voice moderation failed:', error);
      showToast('فشل أمر الإدارة، لم يتم تأكيد النتيجة.');
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
    const timer = window.setTimeout(() => setVipEntrance(false), 4500);
    return () => window.clearTimeout(timer);
  }, [activeRoom?.id, isRoomMinimized, currentUser.vipLevel]);

  // Get current messages
  const currentMessages = activeRoom ? roomMessages[activeRoom.id] || [] : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length, showChatInput]);

  if (!activeRoom) return null;

  // Floating Minimized Bubble
  if (isRoomMinimized) {
    return (
      <div
        onClick={() => setIsRoomMinimized(false)}
        className="fixed bottom-20 left-4 z-50 flex items-center gap-2 bg-[#1b0d3a]/95 border border-purple-400/50 rounded-full py-1.5 px-3 shadow-[0_4px_20px_rgba(147,51,234,0.6)] cursor-pointer backdrop-blur-md animate-bounce select-none"
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
          <span className="text-[11px] font-black text-white">{activeRoom.title || 'العراق الع...'}</span>
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
        <div className="absolute top-20 inset-x-3 z-[90] pointer-events-none flex justify-center animate-in slide-in-from-right-12 fade-in duration-500">
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border-2 border-amber-300/90 bg-gradient-to-r from-[#260b34] via-[#7b174f] to-[#301047] px-4 py-3 shadow-[0_0_28px_rgba(251,191,36,0.65)]">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-300/15 via-transparent to-fuchsia-400/20" />
            <div className="relative flex items-center justify-center gap-3 text-amber-100" dir="rtl">
              <Crown className="w-9 h-9 shrink-0 fill-amber-400 text-yellow-100 drop-shadow-[0_0_8px_#fbbf24]" />
              <div className="min-w-0 text-center">
                <div className="text-[10px] font-black tracking-wide text-amber-300">✦ دخول ملكي ✦ VIP {currentUser.vipLevel}</div>
                <div className="text-sm font-black truncate">{currentUser.nickname || currentUser.name || 'عضو VIP'} انضم إلى الغرفة</div>
              </div>
              <Sparkles className="w-7 h-7 shrink-0 text-fuchsia-200" />
            </div>
          </div>
        </div>
      )}

      {showExitOptions && (
        <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/70 px-6" onClick={() => setShowExitOptions(false)}>
          <div className="w-full max-w-xs rounded-3xl border border-amber-400/50 bg-[#17112b] p-5 shadow-2xl" onClick={event => event.stopPropagation()} dir="rtl">
            <h3 className="text-center text-lg font-black text-amber-200 mb-4">خيارات الغرفة</h3>
            <div className="flex flex-col gap-3">
              <button onClick={() => { setShowExitOptions(false); setIsRoomMinimized(true); }} className="w-full rounded-xl border border-amber-400/40 bg-amber-400/10 py-3 font-bold text-amber-100 flex items-center justify-center gap-2"><Maximize2 className="w-5 h-5" /> تصغير الغرفة</button>
              <button onClick={() => { setShowExitOptions(false); leaveRoom(); }} className="w-full rounded-xl border border-red-400/40 bg-red-500/10 py-3 font-bold text-red-100 flex items-center justify-center gap-2"><LogOut className="w-5 h-5" /> مغادرة الغرفة</button>
            </div>
            <button onClick={() => setShowExitOptions(false)} className="w-full mt-3 py-2 text-sm text-slate-300">إلغاء</button>
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
      <div className="relative w-full max-w-md h-full flex flex-col justify-between overflow-hidden shadow-2xl bg-[#0d0426]">
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
            - Directly under Capsule: 254K 🏆 (كأس الروم)
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
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(window.location.href);
                    }
                    showToast('تم نسخ رابط الغرفة للمشاركة بنجاح 🔗');
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
                  showToast('المرتبة الأولى في الروم 👑');
                }}
                className="flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition pt-1"
                title="المرتبة 1 في الروم"
              >
                <div className="relative w-8 h-8 rounded-full border-2 border-amber-300/80 bg-purple-950/60 flex items-center justify-center shadow-md">
                  <span className="text-[13px]">👑</span>
                </div>
                <span className="text-xs font-mono font-bold text-white/90">1</span>
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
                  showToast(`كأس ونقاط الروم: 254K 🏆 (المرتبة الأولى في الترتيب اليومي)`);
                }}
                className="flex items-center gap-1.5 bg-[#1a0e33]/80 border border-purple-400/20 rounded-full px-2.5 py-0.5 shadow-md cursor-pointer hover:bg-[#251449] transition active:scale-95"
                title="كأس ونقاط دعم الغرفة"
              >
                <span className="text-xs font-mono font-bold text-white/90">254K</span>
                <span className="text-xs">🏆</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. VOICE SEATS SECTION: EXACT 15 SEATS (3 Rows of 5 Seats)
            Row 1: NO 01, NO 02, NO 03, NO 04, NO 05
            Row 2: NO 06, NO 07, NO 08, NO 09, NO 10
            Row 3: NO 11, NO 12, NO 13, NO 14, NO 15
            - Under circular avatar: User Profile Name + VIP Color (e.g. حمدان 👑)
            - Under empty mic: NO xx
            - Heart counter: 0 💚
            ========================================================================= */}
        <div className="relative z-10 px-3 pt-2 pb-1 flex flex-col gap-3">
          {/* Row 1: Seats 1 to 5 */}
          <div className="grid grid-cols-5 gap-2 items-center justify-items-center">
            {row1Numbers.map((seatNum) => {
              const seat = getSeat(seatNum);
              const isOccupied = !!seat.user;

              return (
                <div
                  key={seatNum}
                  onClick={() => handleSeatClick(seatNum)}
                  className="flex flex-col items-center cursor-pointer group active:scale-95 transition"
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
                        <img
                          src={seat.user.avatar}
                          alt={seat.user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                        {seat.isMuted && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <MicOff className="w-4 h-4 text-rose-400" />
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
                        vipLevel={seat.user.vipLevel}
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

          {/* Row 2: Seats 6 to 10 */}
          <div className="grid grid-cols-5 gap-2 items-center justify-items-center">
            {row2Numbers.map((seatNum) => {
              const seat = getSeat(seatNum);
              const isOccupied = !!seat.user;

              return (
                <div
                  key={seatNum}
                  onClick={() => handleSeatClick(seatNum)}
                  className="flex flex-col items-center cursor-pointer group active:scale-95 transition"
                >
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
                        <img
                          src={seat.user.avatar}
                          alt={seat.user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                        {seat.isMuted && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <MicOff className="w-4 h-4 text-rose-400" />
                          </div>
                        )}
                        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 z-10 px-1.5 py-0 rounded-full bg-emerald-600/95 border border-emerald-300/40 text-white text-[9px] font-bold font-mono leading-none shadow-xs">
                          {seat.user.hearts ?? 0}
                        </div>
                      </div>
                    ) : seat.isLocked ? (
                      <Lock className="w-5 h-5 text-amber-400/90 stroke-[2.2]" />
                    ) : (
                      <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-white/90 stroke-[2.5]" />
                    )}
                  </div>

                  {isOccupied && seat.user ? (
                    <div className="mt-1 flex items-center justify-center gap-0.5 max-w-[76px] px-0.5">
                      <VipName
                        name={seat.user.nickname || seat.user.name}
                        vipLevel={seat.user.vipLevel}
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

          {/* Row 3: Seats 11 to 15 */}
          <div className="grid grid-cols-5 gap-2 items-center justify-items-center">
            {row3Numbers.map((seatNum) => {
              const seat = getSeat(seatNum);
              const isOccupied = !!seat.user;

              return (
                <div
                  key={seatNum}
                  onClick={() => handleSeatClick(seatNum)}
                  className="flex flex-col items-center cursor-pointer group active:scale-95 transition"
                >
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
                        <img
                          src={seat.user.avatar}
                          alt={seat.user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                        {seat.isMuted && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <MicOff className="w-4 h-4 text-rose-400" />
                          </div>
                        )}
                        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 z-10 px-1.5 py-0 rounded-full bg-emerald-600/95 border border-emerald-300/40 text-white text-[9px] font-bold font-mono leading-none shadow-xs">
                          {seat.user.hearts ?? 0}
                        </div>
                      </div>
                    ) : seat.isLocked ? (
                      <Lock className="w-5 h-5 text-amber-400/90 stroke-[2.2]" />
                    ) : (
                      <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-white/90 stroke-[2.5]" />
                    )}
                  </div>

                  {isOccupied && seat.user ? (
                    <div className="mt-1 flex items-center justify-center gap-0.5 max-w-[76px] px-0.5">
                      <VipName
                        name={seat.user.nickname || seat.user.name}
                        vipLevel={seat.user.vipLevel}
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
                    <Gamepad2 className="w-5 h-5 text-emerald-400 stroke-[2]" />
                  </div>

                  {/* Double dot */}
                  <div className="flex items-center gap-1 opacity-70">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                </div>

                {/* Chat Messages Column */}
                <div className="flex-1 space-y-2 overflow-y-auto max-h-56 no-scrollbar pr-1">
                  {/* 1. Official System Notice */}
                  <div className="bg-[#180f33]/85 backdrop-blur-md rounded-2xl p-3 border border-purple-500/20 text-xs text-slate-200 leading-relaxed shadow-lg">
                    مرحباً بك في Huwaa. يرجى احترام الآخرين في المحادثات. سيتم حظر الحسابات التي تنشر محتوى مبتذلاً أو احتيالياً أو غير قانوني.
                  </div>

                  {/* 2. Room Host Welcome Message (LEO 🇨🇳) */}
                  <div className="flex items-start gap-2 justify-end">
                    <div className="flex flex-col items-end">
                      {/* Name and Level Badges Header */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-600 text-white font-mono">2</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-pink-600 text-white font-mono">2</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-blue-600 text-white font-mono">2</span>
                        <span className="text-xs font-black text-white">LEO 🇨🇳</span>
                      </div>

                      {/* Message Bubble */}
                      <div className="bg-[#160d33]/90 backdrop-blur-md rounded-2xl p-2.5 border border-purple-500/30 text-xs text-slate-100 shadow-md text-right leading-relaxed">
                        <span className="text-[#26d0b2] font-bold ml-1" dir="ltr">@Mr. Balmain</span>
                        <span>مرحباً يا صديقي، أهلاً بك في غرفتي. أتمنى لك وقتاً ممتعاً هنا!</span>
                      </div>
                    </div>

                    {/* Host Avatar on Right */}
                    <div
                      onClick={() => {
                        sounds.playClick();
                        showToast('المضيف: LEO 🇨🇳');
                      }}
                      className="w-10 h-10 rounded-full overflow-hidden border border-amber-300/80 bg-[#e2a87a] shrink-0 shadow-md cursor-pointer"
                      title="مضيف الغرفة"
                    >
                      <img
                        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&fit=crop&q=80"
                        alt="LEO"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* 3. Real-time User Sent Messages */}
                  {currentMessages.map((msg) => (
                    <div key={msg.id} className="flex justify-end">
                      <div className="bg-[#1c123d]/90 backdrop-blur-md rounded-2xl py-2 px-3 border border-purple-400/20 text-xs text-white shadow-md">
                        <span className="text-amber-300 font-bold ml-1">{msg.senderName}:</span>
                        <span>{msg.text}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
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
            <button
              type="submit"
              className="p-2 rounded-xl bg-[#26d0b2] hover:bg-[#20b89d] text-slate-950 font-bold transition active:scale-95 cursor-pointer"
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
                <span className="text-xl">🎁</span>
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
            7. ANDROID SYSTEM NAVIGATION BAR (Bottom Bar in Image)
            - Triangle (Back) [◀]
            - Circle (Home) [⚪]
            - Square (Recents) [▢]
            ========================================================================= */}
        <div className="relative z-20 w-full py-1.5 bg-black/95 flex items-center justify-around text-white/70 select-none">
          <button
            onClick={() => {
              sounds.playClick();
              setIsRoomMinimized(true);
            }}
            className="w-12 h-6 flex items-center justify-center text-sm hover:text-white transition active:scale-90 cursor-pointer"
            title="رجوع / تصغير"
          >
            ◀
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setIsRoomMinimized(true);
            }}
            className="w-12 h-6 flex items-center justify-center text-sm hover:text-white transition active:scale-90 cursor-pointer"
            title="الرئيسية"
          >
            ⚪
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              showToast('Toti Chat Royal Voice Rooms');
            }}
            className="w-12 h-6 flex items-center justify-center text-sm hover:text-white transition active:scale-90 cursor-pointer"
            title="التطبيقات الحديثة"
          >
            ▢
          </button>
        </div>

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

        {/* =========================================================================
            MUSIC PLAYER MODAL (الموسيقى 🎵)
            ========================================================================= */}
        {showMusicPlayerModal && (
          <div
            onClick={() => setShowMusicPlayerModal(false)}
            className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs bg-[#191136] border border-purple-400/40 rounded-3xl p-5 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-purple-400" />
                  <h3 className="font-bold text-sm">مشغل موسيقى الغرفة</h3>
                </div>
                <button
                  onClick={() => setShowMusicPlayerModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p role="status" className="text-xs text-slate-300">تشغيل موسيقى الغرفة غير متاح حالياً حتى اكتمال ربط الخدمة.</p>
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
              className="w-full max-w-sm bg-[#160e33] border border-purple-400/40 rounded-3xl p-5 shadow-2xl text-white space-y-4 max-h-[80vh] flex flex-col"
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
              className="w-full max-w-md bg-[#101924]/95 border-t border-slate-700/70 rounded-t-3xl backdrop-blur-xl shadow-2xl p-5 pt-3 pb-6 text-white relative animate-in slide-in-from-bottom"
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
              <div className="relative -mt-9 mx-auto w-20 h-20 sm:w-22 sm:h-22 rounded-full border-2 border-white/90 overflow-hidden shadow-2xl bg-slate-900">
                <img
                  src={selectedMicUser.user.avatar}
                  alt={selectedMicUser.user.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* User Name in large, bold, clear white text */}
              <h3 className="text-xl sm:text-2xl font-black text-white text-center mt-2.5 tracking-wide flex items-center justify-center gap-1">
                <span>{selectedMicUser.user.nickname || selectedMicUser.user.name}</span>
                <span className="text-rose-500 font-black">❗</span>
              </h3>

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

              {/* Bottom Action Bar: نزل من المايك & حظر مايك */}
              <div className="border-t border-slate-800/90 pt-3 flex items-center justify-around">
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
              </div>
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
                        showToast(`انتقلت إلى المايك رقم ${selectedEmptySeat} 🎙️`);
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
                        showToast('غادرت المايكرفون بنجاح 💺');
                      }}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-500 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30 active:scale-98 transition cursor-pointer"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>مغادرة المايكرفون</span>
                    </button>

                    {/* قفل المايكرفون */}
                    <button
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
                    </button>
                  </>
                ) : (
                  /* User is not on a mic */
                  <>
                    {/* اصعد بنفسي */}
                    <button
                      onClick={() => {
                        takeSeat(selectedEmptySeat);
                        setSelectedEmptySeat(null);
                        showToast(`صعدت إلى المايك رقم ${selectedEmptySeat} 🎙️`);
                      }}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 active:scale-98 transition cursor-pointer"
                    >
                      <Mic className="w-5 h-5" />
                      <span>اصعد بنفسي</span>
                    </button>

                    {/* قفل المايكرفون */}
                    <button
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
                    </button>
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
        {showRoomInfoModal && (
          <div
            onClick={() => setShowRoomInfoModal(false)}
            className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-gradient-to-b from-[#1a0e3a] to-[#0c051f] border border-purple-400/40 rounded-3xl p-5 shadow-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">معلومات الغرفة وإدارتها 👑</h3>
                    <p className="text-[10px] text-purple-200">
                      {isOwner ? 'تحكم ببيانات الغرفة والإعلان الرسمي' : 'تفاصيل الغرفة الحالية'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRoomInfoModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveRoomInfo} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">اسم الغرفة:</label>
                  <input
                    type="text"
                    value={editTitleInput}
                    onChange={(e) => setEditTitleInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs focus:outline-none focus:border-amber-400"
                    placeholder="أدخل اسم الغرفة..."
                    disabled={!isOwner && !currentUser.isSuperAdmin}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">إعلان الغرفة (رسالة الترحيب):</label>
                  <textarea
                    rows={3}
                    value={editAnnouncementInput}
                    onChange={(e) => setEditAnnouncementInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs focus:outline-none focus:border-amber-400 resize-none"
                    placeholder="أدخل إعلان الغرفة..."
                    disabled={!isOwner && !currentUser.isSuperAdmin}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">وسم وتصنيف الغرفة:</label>
                  <input
                    type="text"
                    value={editTagInput}
                    onChange={(e) => setEditTagInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs focus:outline-none focus:border-amber-400"
                    placeholder="مثال: حفلة، مميز، ترحيبي"
                    disabled={!isOwner && !currentUser.isSuperAdmin}
                  />
                </div>

                {/* Room ID and Host Card */}
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">معرّف الغرفة (Room ID):</span>
                    <span className="text-xs font-mono font-bold text-amber-300">{activeRoom.publicId ?? '—'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => activeRoom.publicId && handleCopyId(String(activeRoom.publicId))}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1 active:scale-95 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ</span>
                  </button>
                </div>

                {isOwner || currentUser.isSuperAdmin ? (
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg active:scale-95 transition cursor-pointer"
                    >
                      حفظ التعديلات 👑
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRoomInfoModal(false)}
                      className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-400/30 rounded-xl text-center">
                    <p className="text-[11px] text-amber-300 font-bold">
                      🔒 أنت تتصفح الغرفة كزائر، تعديل بيانات الغرفة متاح لمالكها فقط
                    </p>
                  </div>
                )}
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

                        {isOwner && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleModerator(user.id, user.name)}
                              className={`p-1.5 rounded-lg text-[10px] font-bold transition active:scale-95 ${
                                isMod
                                  ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                                  : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                              }`}
                              title={isMod ? 'إلغاء الإشراف' : 'ترقية إلى مشرف'}
                            >
                              {isMod ? <UserMinus className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleKickMember(user.id, user.name)}
                              className="p-1.5 rounded-lg bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 text-[10px] font-bold transition active:scale-95"
                              title="طرد من الغرفة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-purple-950/40 rounded-2xl border border-purple-400/30 text-center">
                  <span className="text-[10px] text-slate-400 block mb-1">كأس الغرفة والترتيب:</span>
                  <span className="text-base font-black text-amber-300 font-mono">254K 🏆</span>
                  <span className="text-[9px] text-amber-200 block">المرتبة الأولى</span>
                </div>
                <div className="p-3 bg-purple-950/40 rounded-2xl border border-purple-400/30 text-center">
                  <span className="text-[10px] text-slate-400 block mb-1">المساهمات اليومية:</span>
                  <span className="text-base font-black text-cyan-300 font-mono">254,000 🪙</span>
                  <span className="text-[9px] text-cyan-200 block">اليوم</span>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400 block mb-1">المساهمات الأسبوعية:</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">1,450,000 🪙</span>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400 block mb-1">المساهمات الشهرية:</span>
                  <span className="text-sm font-black text-purple-300 font-mono">5,600,000 🪙</span>
                </div>
              </div>

              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>أعلى ذروة حضور:</span>
                </div>
                <span className="font-mono font-bold text-white">1,540 مستمع</span>
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
