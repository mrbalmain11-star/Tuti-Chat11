import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronRight,
  Copy,
  Check,
  Plus,
  MessageCircle,
  Gift,
  Heart,
  UserPlus,
  UserCheck,
  Camera,
  Pencil,
  Loader2,
  X,
  Mic,
  MicOff,
  AtSign,
  AlertTriangle,
  LogOut,
  Crown,
  Sparkles,
  Trophy,
  Award,
  Car,
  Shield,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';
import { UserProfile } from '../types';
import { mockAgencies } from '../mockData';
import { CharmBadge, WealthBadge, GameBadge } from './LevelBadgeIcons';
import { processImageFile } from '../utils/imageUpload';
import { fetchMyProfile, saveMyProfile, uploadMyAvatar, getMyAvatarUrl } from '../services/stagingBackend';
import { VipName } from './VipName';
import { VipBadge, VIP_BEAST_METADATA } from './VipBadge';
import { AgencyProfileCard } from './AgencyProfileCard';

export const InternalProfileModal: React.FC = () => {
  const {
    openInternalProfileModal,
    setOpenInternalProfileModal,
    internalProfileUser,
    currentUser,
    updateUserProfile,
    setOpenGiftStore,
    setOpenChatThread,
    conversations,
    setSelectedGiftReceiver,
    setOpenLevelsModal,
    setLevelsModalTab,
    setOpenStorageModal,
    activeRoom,
    leaveSeat,
    toggleMuteSeat,
    sendRoomMessage,
    followedRoomHosts,
    toggleFollowHost,
    agencies,
    setOpenAgencyModal,
    setOpenVipModal,
    agencyMemberCount,
  } = useApp();

  // The user being displayed: either targeted user or current user
  const user: UserProfile = internalProfileUser?.id === currentUser.id ? currentUser : (internalProfileUser || currentUser);
  const isSelf = user.id === currentUser.id;
  const [myPublicId, setMyPublicId] = useState<number | null>(null);
  useEffect(() => {
    if (!openInternalProfileModal || !isSelf) { setMyPublicId(null); return; }
    let active = true;
    void fetchMyProfile().then(profile => {
      if (active) setMyPublicId(profile?.public_id ?? null);
    }).catch(error => console.error('Unable to load public ID:', error));
    return () => { active = false; };
  }, [openInternalProfileModal, isSelf, currentUser.id]);

  // Active inventory tab: 'frame' (الإطار) | 'vehicle' (المركبة) | 'gifts' (لوحة الهدايا) | 'honor' (لوحة الشرف)
  const [activeTab, setActiveTab] = useState<'frame' | 'vehicle' | 'gifts' | 'honor'>('frame');

  // Follow & Toast state
  const isUserFollowed = followedRoomHosts?.has(user.id);
  const [copiedId, setCopiedId] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Seat on active room if present
  const seatOnActiveRoom = activeRoom?.seats?.find((s) => s.user?.id === user.id);

  // Edit states for self
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');
  const [showEditBioModal, setShowEditBioModal] = useState(false);
  const [editBioInput, setEditBioInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  if (!openInternalProfileModal) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      if (!isSelf) throw new Error('لا يمكن تعديل صورة حساب آخر');
      const dataUrl = await processImageFile(file);
      const image = new Image();
      image.src = dataUrl;
      await image.decode();
      const canvas = document.createElement('canvas');
      const ratio = Math.min(1, 512 / Math.max(image.width, image.height));
      canvas.width = Math.max(1, Math.round(image.width * ratio));
      canvas.height = Math.max(1, Math.round(image.height * ratio));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('تعذر تجهيز الصورة');
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
        b => b ? resolve(b) : reject(new Error('تعذر تحويل الصورة')), 'image/webp', 0.82,
      ));
      const path = await uploadMyAvatar(blob);
      const signedUrl = await getMyAvatarUrl(path);
      updateUserProfile({ avatar: signedUrl });
      sounds.playCoin();
      showToast('تم حفظ الصورة الشخصية في حسابك 📸');
    } catch (error) {
      showToast('تعذر حفظ الصورة: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      const dataUrl = await processImageFile(file);
      updateUserProfile({ cover: dataUrl });
      sounds.playCoin();
      showToast('تم تغيير غلاف الملف الشخصي بنجاح! 🖼️');
    } catch {
      showToast('تعذر رفع صورة الغلاف، يرجى المحاولة مرة أخرى');
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = editNameInput.trim();
    if (!isSelf || name.length < 2 || name.length > 40) return;
    try {
      const saved = await saveMyProfile({ display_name: name });
      updateUserProfile({ name: saved.display_name, nickname: saved.display_name });
      setShowEditNameModal(false);
      showToast('تم حفظ الاسم في حسابك ✏️');
    } catch (error) {
      showToast('تعذر حفظ الاسم: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSelf) return;
    try {
      const saved = await saveMyProfile({ bio: editBioInput.trim().slice(0, 150) });
      updateUserProfile({ bio: saved.bio });
      setShowEditBioModal(false);
      showToast('تم حفظ السيرة الذاتية في حسابك 📝');
    } catch (error) {
      showToast('تعذر حفظ السيرة: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleCopyId = () => {
    const idToCopy = isSelf ? myPublicId?.toString() : user.id;
    if (!idToCopy) return;
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(true);
    sounds.playCoin();
    showToast(`تم نسخ المعرف: ${idToCopy}`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleStartChat = () => {
    sounds.playClick();
    setOpenInternalProfileModal(false);
    const existing = conversations.find((c) => c.userId === user.id);
    if (existing) {
      setOpenChatThread(existing);
    } else {
      setOpenChatThread({
        id: `chat-${user.id}`,
        userId: user.id,
        userName: user.nickname || user.name,
        userAvatar: user.avatar,
        isOnline: true,
        lastMessage: 'مرحباً بك!',
        lastTime: 'الآن',
        unreadCount: 0,
        messages: [],
      });
    }
  };

  const handleToggleFollow = () => {
    sounds.playCoin();
    toggleFollowHost(user.id);
    showToast(!isUserFollowed ? 'تمت المتابعة بنجاح! 💖' : 'تم إلغاء المتابعة');
  };

  const handleSendGift = () => {
    sounds.playClick();
    setSelectedGiftReceiver({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
    });
    setOpenGiftStore(true);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 font-['Cairo',sans-serif] select-none p-0 overflow-hidden animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[80] bg-[#160A2E]/95 border border-purple-500/40 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-md">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Frame Container - White & Gold Luxury Palette (أبيض وذهبي واضح ومريح للنظر) */}
      <div
        className="w-full max-w-md h-full bg-gradient-to-b from-[#FFFDF8] via-[#FAF6EE] to-[#F3EAD7] text-slate-900 flex flex-col relative overflow-y-auto no-scrollbar shadow-2xl border-x border-amber-300/50"
        dir="rtl"
      >
        {/* =========================================================================
            1. Large Clear Square Cover Banner
            ========================================================================= */}
        <div className="relative w-full aspect-square max-h-[360px] sm:max-h-[390px] shrink-0 overflow-hidden bg-slate-950">
          {/* Cover Image: Large, clear and vibrant */}
          <img
            src={
              user.cover ||
              'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80'
            }
            alt="Cover"
            className="w-full h-full object-cover"
          />

          {/* Gentle Shading Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-[#FAF6EE] pointer-events-none" />

          {/* Hidden File Input for Cover Banner */}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverFile}
          />

          {/* Change Cover Button for self */}
          {isSelf && (
            <button
              onClick={() => coverInputRef.current?.click()}
              className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/85 hover:bg-white border border-amber-300 text-slate-900 text-xs font-bold backdrop-blur-md transition active:scale-95 cursor-pointer shadow-md"
              title="تغيير صورة الغلاف"
            >
              {uploadingCover ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
              ) : (
                <Camera className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span>تغيير الغلاف</span>
            </button>
          )}

          {/* Top Right Back Button (السهم في أعلى اليمين) */}
          <button
            onClick={() => {
              sounds.playClick();
              setOpenInternalProfileModal(false);
            }}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-slate-800 transition active:scale-90 cursor-pointer shadow-md border border-amber-300"
            title="رجوع"
          >
            <ChevronRight className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* =========================================================================
            Profile Floating Row: CP Bubble & Full Circular Avatar (Completely Unclipped)
            ========================================================================= */}
        <div className="relative -mt-16 px-6 flex items-end justify-between z-20 pointer-events-auto">
          {/* Search for CP (ابحث عن CP) Container */}
          <div className="flex flex-col items-center gap-1.5 mb-1">
            {/* Glass Orb with "+" icon */}
            <div
              onClick={() => {
                sounds.playClick();
                showToast('ابحث عن شريك CP المفضل لديك! 💛');
              }}
              className="w-13 h-13 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center justify-center cursor-pointer active:scale-95 transition backdrop-blur-md relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-transparent opacity-80" />
              <Plus className="w-6 h-6 text-slate-950 stroke-[2.5] group-hover:scale-110 transition" />
            </div>

            {/* Pill Button: ابحث عن CP */}
            <button
              onClick={() => {
                sounds.playClick();
                showToast('جاري البحث عن CP...');
              }}
              className="px-3 py-1 rounded-full bg-white/95 border border-amber-300 text-[11px] font-black text-amber-950 shadow-md hover:bg-amber-50 transition active:scale-95 cursor-pointer backdrop-blur-md"
            >
              ابحث عن CP
            </button>
          </div>

          {/* Complete Circular User Avatar with Glowing Ring and Zero Clipping */}
          <div className="relative w-26 h-26 rounded-full p-[3px] bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-600 shadow-[0_4px_24px_rgba(245,158,11,0.5)] ring-4 ring-[#FAF6EE]">
            {isSelf && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFile}
              />
            )}

            <div
              onClick={() => {
                if (isSelf) fileInputRef.current?.click();
              }}
              className={`w-full h-full rounded-full overflow-hidden bg-neutral-900 relative shadow-inner ${isSelf ? 'cursor-pointer' : ''}`}
            >
              <img
                src={
                  user.avatar ||
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&fit=crop&q=80'
                }
                alt={user.name}
                className="w-full h-full object-cover rounded-full"
              />

              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white z-20 rounded-full">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-300" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. User Information Section (Name, Badges, ID, Bio, Stats)
            ========================================================================= */}
        <div className="pt-3 px-6 pb-2">
          {/* User Name with VipName Shimmering & Edit Pencil for self */}
          <div className="flex items-center gap-2 justify-start">
            <h1 className="text-xl font-black tracking-wide text-right select-none">
              <VipName
                name={user.name || 'دولة العراق'}
                vipLevel={user.vipLevel}
                fallbackColor="text-slate-900"
                className="text-xl font-black drop-shadow-xs"
              />
            </h1>
            {isSelf && (
              <button
                onClick={() => {
                  sounds.playClick();
                  setEditNameInput(user.name || '');
                  setShowEditNameModal(true);
                }}
                className="w-7 h-7 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 flex items-center justify-center transition active:scale-90 cursor-pointer shadow-xs"
                title="تعديل الاسم"
              >
                <Pencil className="w-3.5 h-3.5 text-amber-900" />
              </button>
            )}
          </div>

          {/* Badges Line: Flag + Gender/Age + Charm Level + Wealth Level + VIP/VLP Level */}
          <div className="flex items-center gap-1.5 mt-2 justify-start flex-wrap">
            {/* Flag */}
            <span className="text-base leading-none">🇮🇶</span>

            {/* Gender & Age Pill (27 ♂) */}
            <div className="bg-[#2DD4BF] text-[#042F2E] text-[11px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs">
              <span>27</span>
              <span className="text-xs">♂</span>
            </div>

            {/* Charm / Magic Level Badge (مستوى السحر) */}
            <CharmBadge
              level={user.charmLevel || 1}
              size="compact"
              onClick={() => {
                sounds.playClick();
                setLevelsModalTab('charm');
                setOpenLevelsModal(true);
              }}
              className="shadow-xs"
            />

            {/* Wealth Level Badge (مستوى الثروة) */}
            <WealthBadge
              level={user.wealthLevel || 1}
              size="compact"
              onClick={() => {
                sounds.playClick();
                setLevelsModalTab('wealth');
                setOpenLevelsModal(true);
              }}
              className="shadow-xs"
            />

            {/* Games Level Badge (مستوى الألعاب) */}
            <GameBadge
              level={user.gameLevel || 1}
              size="compact"
              onClick={() => {
                sounds.playClick();
                setLevelsModalTab('games');
                setOpenLevelsModal(true);
              }}
              className="shadow-xs"
            />

            {/* Subscribed VIP/VLP Level Badge (مستوى VLP/VIP المشترك فيه) */}
            {user.vipLevel && user.vipLevel > 0 ? (
              <VipBadge
                vipLevel={user.vipLevel}
                size="compact"
                className="shadow-xs"
                onClick={() => {
                  sounds.playClick();
                  setOpenVipModal(true);
                }}
              />
            ) : isSelf ? (
              <button
                onClick={() => {
                  sounds.playClick();
                  setOpenVipModal(true);
                }}
                className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400/20 via-yellow-400/30 to-amber-500/20 border border-amber-300 text-amber-900 text-[10px] font-black flex items-center gap-1 hover:bg-amber-100 transition active:scale-95 shadow-xs cursor-pointer"
                title="تفعيل VLP"
              >
                <Crown className="w-3 h-3 text-amber-700" />
                <span>تفعيل VLP</span>
              </button>
            ) : null}
          </div>

          {/* ID Line: ❐ ID: 313 */}
          <button
            onClick={handleCopyId}
            className="flex items-center gap-1.5 mt-2 text-xs text-slate-600 font-mono hover:text-amber-800 transition active:scale-95 cursor-pointer"
            title="نسخ المعرف"
          >
            {copiedId ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className="font-semibold tracking-wider">
              ID: {isSelf ? (myPublicId ?? '—') : (user.id || '—')}
            </span>
          </button>

          {/* Bio / Status Line with Edit Pencil for self */}
          <div className="flex items-start justify-between gap-2 mt-2">
            <p className="text-sm text-slate-700 text-right font-medium flex-1">
              {user.bio || 'هذا المستخدم غامض ولم يترك أي أثر.'}
            </p>
            {isSelf && (
              <button
                onClick={() => {
                  sounds.playClick();
                  setEditBioInput(user.bio || '');
                  setShowEditBioModal(true);
                }}
                className="w-6 h-6 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 flex items-center justify-center shrink-0 transition active:scale-90 cursor-pointer shadow-xs"
                title="تعديل السيرة الذاتية"
              >
                <Pencil className="w-3 h-3 text-amber-800" />
              </button>
            )}
          </div>

          {/* Realistic Dynamic Agency Rectangle (مستطيل الوكالة الفعلي مطابق للصورة تماماً) */}
          <AgencyProfileCard
            avatar={isSelf ? currentUser.avatar : user.avatar}
            agencyName={isSelf ? (currentUser.agencyName || 'وكالة العراقين') : (user.agencyName || 'وكالة العراقين')}
            agencyId={isSelf ? currentUser.id : user.id}
            memberCount={isSelf ? agencyMemberCount : (user.followersCount ? Math.max(1, Math.floor(user.followersCount / 10)) : 1)}
            roleLabel={user.agencyRole === 'وكيل' || isSelf ? 'مالك وكالة' : 'مضيف وكالة'}
            onClick={() => setOpenAgencyModal(true)}
            className="mt-3.5"
          />

          {/* Stats Row: (الزوار | المعجبون | متابعة | الأصدقاء) */}
          <div className="grid grid-cols-4 gap-2 text-center mt-4 p-2.5 rounded-2xl bg-white/95 border border-amber-200/90 shadow-xs">
            {/* الأصدقاء */}
            <div
              onClick={() => sounds.playClick()}
              className="cursor-pointer active:scale-95 transition"
            >
              <span className="text-xl font-bold text-slate-900 block font-sans">
                {isSelf ? (currentUser.friendsCount || 0) : (user.friendsCount || 0)}
              </span>
              <span className="text-xs text-slate-500 font-bold mt-0.5 block">
                الأصدقاء
              </span>
            </div>

            {/* متابعة */}
            <div
              onClick={() => sounds.playClick()}
              className="cursor-pointer active:scale-95 transition"
            >
              <span className="text-xl font-bold text-slate-900 block font-sans">
                {isSelf ? (currentUser.followingCount || 0) : (user.followingCount || 0)}
              </span>
              <span className="text-xs text-slate-500 font-bold mt-0.5 block">
                متابعة
              </span>
            </div>

            {/* المعجبون */}
            <div
              onClick={() => sounds.playClick()}
              className="cursor-pointer active:scale-95 transition"
            >
              <span className="text-xl font-bold text-slate-900 block font-sans">
                {isSelf
                  ? (currentUser.followersCount || 0)
                  : ((user.followersCount || 0) + (isUserFollowed ? 1 : 0))}
              </span>
              <span className="text-xs text-slate-500 font-bold mt-0.5 block">
                المعجبون
              </span>
            </div>

            {/* الزوار */}
            <div
              onClick={() => sounds.playClick()}
              className="cursor-pointer active:scale-95 transition"
            >
              <span className="text-xl font-bold text-slate-900 block font-sans">
                {isSelf ? (currentUser.visitorsCount || 0) : (user.visitorsCount || 0)}
              </span>
              <span className="text-xs text-slate-500 font-bold mt-0.5 block">
                الزوار
              </span>
            </div>
          </div>

          {/* Active Voice Room Mic Control Banner if user is currently on mic in room */}
          {seatOnActiveRoom && (
            <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 border border-amber-300 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${seatOnActiveRoom.isMuted ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-700'}`}>
                  {seatOnActiveRoom.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 animate-pulse" />}
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-slate-900 block">
                    {isSelf ? `أنت على المايك رقم ${seatOnActiveRoom.seatNumber}` : `على المايك رقم ${seatOnActiveRoom.seatNumber}`}
                  </span>
                  <span className={`text-[10px] font-bold ${seatOnActiveRoom.isMuted ? 'text-amber-800' : 'text-emerald-700'}`}>
                    {seatOnActiveRoom.isMuted ? 'المايك مكتوم 🔇' : 'متصل ويتحدث 🎙️'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isSelf ? (
                  <>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        toggleMuteSeat(seatOnActiveRoom.seatNumber);
                        showToast(seatOnActiveRoom.isMuted ? 'تم تفعيل المايك 🎙️' : 'تم كتم المايك 🔇');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-slate-900 border border-amber-300 text-[11px] font-black transition active:scale-95 cursor-pointer shadow-2xs"
                    >
                      {seatOnActiveRoom.isMuted ? 'إلغاء الكتم' : 'كتم المايك'}
                    </button>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        leaveSeat(seatOnActiveRoom.seatNumber);
                        showToast(`نزلت من المايك رقم ${seatOnActiveRoom.seatNumber}`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white text-[11px] font-bold transition active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>نزول</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setOpenInternalProfileModal(false);
                        sendRoomMessage(activeRoom?.id || '', `@${user.nickname || user.name} `);
                        showToast(`تمت مناداة ${user.name} في شات الغرفة`);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/80 text-[11px] font-bold transition active:scale-95 cursor-pointer"
                    >
                      @مناداة
                    </button>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        toggleMuteSeat(seatOnActiveRoom.seatNumber);
                        showToast(seatOnActiveRoom.isMuted ? 'تم إلغاء كتم مايك المستخدم' : 'تم كتم مايك المستخدم');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 text-[11px] font-bold transition active:scale-95 cursor-pointer"
                    >
                      {seatOnActiveRoom.isMuted ? 'إلغاء كتم' : 'كتم'}
                    </button>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        leaveSeat(seatOnActiveRoom.seatNumber);
                        showToast(`تم إنزال ${user.name} من المايك`);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 hover:bg-rose-900/80 text-[11px] font-bold transition active:scale-95 cursor-pointer"
                    >
                      طرد
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            3. "مستوى الحساب" (Account Level) Cards: (مستوى السحر | مستوى الثروة)
            ========================================================================= */}
        <div className="px-6 mt-4">
          <h2 className="text-base font-black text-amber-950 text-right mb-2.5">
            مستوى الحساب
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {/* Card 1 (Right in RTL): مستوى الثروة (Wealth Level) - Distinct Gold Heraldic Theme */}
            <div
              onClick={() => {
                sounds.playClick();
                setLevelsModalTab('wealth');
                setOpenLevelsModal(true);
              }}
              className="rounded-2xl bg-gradient-to-l from-amber-500/15 via-amber-50/80 to-white border-2 border-amber-300 p-3.5 flex items-center justify-between cursor-pointer active:scale-98 transition shadow-[0_4px_14px_rgba(245,158,11,0.12)] hover:border-amber-400 hover:shadow-md"
            >
              {/* Text on Right in RTL */}
              <div className="text-right">
                <span className="text-xl font-black text-amber-950 block font-sans tracking-wide">
                  Lv. {user.wealthLevel || 1}
                </span>
                <span className="text-xs text-amber-800 font-black mt-0.5 block flex items-center gap-1">
                  <span>👑</span>
                  <span>مستوى الثروة</span>
                </span>
              </div>

              {/* 3D Gold Imperial Seal Icon */}
              <div className="w-11 h-11 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 40 40" className="w-10 h-10 drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]">
                  <circle cx="20" cy="20" r="18" fill="url(#goldSealGrad)" stroke="#FEF08A" strokeWidth="1.5" />
                  <circle cx="20" cy="20" r="14" fill="#78350F" stroke="#F59E0B" strokeWidth="1" />
                  {/* Central Crown & Diamond Motif */}
                  <polygon points="20,9 27,20 20,31 13,20" fill="#FEF08A" />
                  <polygon points="20,12 24,20 20,28 16,20" fill="#F59E0B" />
                  <circle cx="20" cy="20" r="2.5" fill="#FFF" />
                  <defs>
                    <linearGradient id="goldSealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FEF08A" />
                      <stop offset="50%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#78350F" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Card 2 (Left in RTL): مستوى السحر (Charm Level) - Distinct Purple Faceted Crystal Theme */}
            <div
              onClick={() => {
                sounds.playClick();
                setLevelsModalTab('charm');
                setOpenLevelsModal(true);
              }}
              className="rounded-2xl bg-gradient-to-l from-purple-500/15 via-fuchsia-50/80 to-white border-2 border-purple-300 p-3.5 flex items-center justify-between cursor-pointer active:scale-98 transition shadow-[0_4px_14px_rgba(168,85,247,0.12)] hover:border-purple-400 hover:shadow-md"
            >
              {/* Text on Right in RTL */}
              <div className="text-right">
                <span className="text-xl font-black text-purple-950 block font-sans tracking-wide">
                  Lv. {user.charmLevel || 1}
                </span>
                <span className="text-xs text-purple-800 font-black mt-0.5 block flex items-center gap-1">
                  <span>✨</span>
                  <span>مستوى السحر</span>
                </span>
              </div>

              {/* 3D Purple Faceted Crystal Star Amulet */}
              <div className="w-11 h-11 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 40 40" className="w-10 h-10 drop-shadow-[0_2px_8px_rgba(168,85,247,0.45)]">
                  {/* Hexagon Crystal Base */}
                  <polygon
                    points="20,3 36,11.5 36,28.5 20,37 4,28.5 4,11.5"
                    fill="url(#purpleAmuletGrad)"
                    stroke="#F0ABFC"
                    strokeWidth="1.5"
                  />
                  {/* 8-point Faceted Star Center */}
                  <path
                    d="M20 9L22.5 15.5L29 14.5L24.5 19.5L28.5 25L22 24L20 30L18 24L11.5 25L15.5 19.5L11 14.5L17.5 15.5L20 9Z"
                    fill="#FAF5FF"
                    stroke="#D946EF"
                    strokeWidth="0.8"
                  />
                  <circle cx="20" cy="19.5" r="2.5" fill="#E879F9" stroke="#FFF" strokeWidth="0.5" />
                  <defs>
                    <linearGradient id="purpleAmuletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#E879F9" />
                      <stop offset="50%" stopColor="#9333EA" />
                      <stop offset="100%" stopColor="#3B0764" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>

          {/* Subscribed VIP Level Card (مستوى VLP/VIP المشترك فيه) */}
          <div className="mt-3">
            {user.vipLevel && user.vipLevel > 0 ? (
              <div
                onClick={() => {
                  sounds.playClick();
                  setOpenVipModal(true);
                }}
                className={`rounded-2xl p-3.5 border-2 bg-gradient-to-r ${
                  VIP_BEAST_METADATA[user.vipLevel]?.innerBg || 'from-[#451a03] to-[#78350f]'
                } text-white flex items-center justify-between cursor-pointer active:scale-98 transition shadow-md border-amber-300/80 hover:border-amber-200`}
              >
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-amber-300 font-sans tracking-wide">
                      {VIP_BEAST_METADATA[user.vipLevel]?.label || `VLP ${user.vipLevel}`}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/50 text-amber-200 font-bold">
                      مشترك مفعّل
                    </span>
                  </div>
                  <span className="text-xs text-white/90 font-medium mt-1 block">
                    {VIP_BEAST_METADATA[user.vipLevel]?.name || `VIP ${user.vipLevel}`} - {VIP_BEAST_METADATA[user.vipLevel]?.beast}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <VipBadge vipLevel={user.vipLevel} size="md" />
                </div>
              </div>
            ) : isSelf ? (
              <div
                onClick={() => {
                  sounds.playClick();
                  setOpenVipModal(true);
                }}
                className="rounded-2xl p-3 border border-amber-200/90 bg-gradient-to-r from-amber-50/60 via-yellow-50/40 to-white flex items-center justify-between cursor-pointer active:scale-98 transition shadow-xs hover:border-amber-300"
              >
                <div className="text-right">
                  <span className="text-sm font-black text-amber-950 block">
                    مستوى VLP: غير مشترك
                  </span>
                  <span className="text-[11px] text-amber-700 font-medium mt-0.5 block">
                    انقر لاختيار وتفعيل العضوية الملكية من VLP 1 إلى VLP 5
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold text-xs shadow-xs">
                  <Crown className="w-3.5 h-3.5 text-yellow-200" />
                  <span>تفعيل VLP</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* =========================================================================
            4. Inventory / Equips Tabs: (الإطار | المركبة | لوحة الهدايا | لوحة الشرف)
            ========================================================================= */}
        <div className="px-6 mt-6">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-2 text-sm">
            {/* 1. الإطار (Frame) */}
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('frame');
              }}
              className={`pb-1 transition cursor-pointer font-bold ${
                activeTab === 'frame'
                  ? 'text-amber-950 font-black border-b-2 border-amber-500'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              الإطار
            </button>

            {/* 2. المركبة (Vehicle) */}
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('vehicle');
              }}
              className={`pb-1 transition cursor-pointer font-bold ${
                activeTab === 'vehicle'
                  ? 'text-amber-950 font-black border-b-2 border-amber-500'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              المركبة
            </button>

            {/* 3. لوحة الهدايا (Gift Board) */}
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('gifts');
              }}
              className={`pb-1 transition cursor-pointer font-bold ${
                activeTab === 'gifts'
                  ? 'text-amber-950 font-black border-b-2 border-amber-500'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              لوحة الهدايا
            </button>

            {/* 4. لوحة الشرف (Honor Board) */}
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('honor');
              }}
              className={`pb-1 transition cursor-pointer font-bold ${
                activeTab === 'honor'
                  ? 'text-amber-950 font-black border-b-2 border-amber-500'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              لوحة الشرف
            </button>
          </div>
        </div>

        {/* =========================================================================
            5. Tab Content Area
            ========================================================================= */}
        <div className="flex-1 flex flex-col items-center justify-center py-6 px-6">
          {/* TAB 1: الإطار (Frame) - 3D Holographic Pastel Saturn Planet */}
          {activeTab === 'frame' && (
            <div className="flex flex-col items-center justify-center animate-in fade-in duration-200">
              <div
                onClick={() => {
                  sounds.playClick();
                  setOpenStorageModal(true);
                }}
                className="relative w-52 h-52 flex items-center justify-center cursor-pointer group active:scale-95 transition"
                title="انقر لتخصيص المظهر وتجهيز العناصر"
              >
                {/* Ambient Celestial Glow */}
                <div className="absolute inset-0 bg-purple-500/15 rounded-full blur-2xl group-hover:bg-purple-500/25 transition" />

                {/* SVG 3D Pastel Lavender Planet with Orbital Ring and Craters */}
                <svg
                  viewBox="0 0 220 220"
                  className="w-full h-full drop-shadow-[0_15px_35px_rgba(168,85,247,0.35)]"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <radialGradient
                      id="planetBodyGrad"
                      cx="40%"
                      cy="35%"
                      r="65%"
                      fx="35%"
                      fy="30%"
                    >
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="25%" stopColor="#E9D5FF" />
                      <stop offset="60%" stopColor="#C084FC" />
                      <stop offset="85%" stopColor="#818CF8" />
                      <stop offset="100%" stopColor="#4338CA" />
                    </radialGradient>

                    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#EDE9FE" />
                      <stop offset="45%" stopColor="#DDD6FE" />
                      <stop offset="70%" stopColor="#A78BFA" />
                      <stop offset="100%" stopColor="#6366F1" />
                    </linearGradient>

                    <radialGradient id="craterGrad" cx="30%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#4338CA" />
                      <stop offset="80%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#818CF8" />
                    </radialGradient>

                    <radialGradient id="moonGrad" cx="35%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="50%" stopColor="#DDD6FE" />
                      <stop offset="100%" stopColor="#7C3AED" />
                    </radialGradient>
                  </defs>

                  {/* Back half of the ring */}
                  <ellipse
                    cx="110"
                    cy="110"
                    rx="98"
                    ry="36"
                    transform="rotate(-26 110 110)"
                    fill="none"
                    stroke="url(#ringGrad)"
                    strokeWidth="11"
                    strokeLinecap="round"
                    opacity="0.75"
                  />

                  {/* Planet Sphere */}
                  <circle cx="110" cy="110" r="54" fill="url(#planetBodyGrad)" />

                  {/* Craters */}
                  <ellipse cx="90" cy="85" rx="8" ry="11" fill="url(#craterGrad)" opacity="0.65" />
                  <ellipse cx="125" cy="80" rx="9" ry="12" fill="url(#craterGrad)" opacity="0.65" />
                  <ellipse cx="98" cy="135" rx="10" ry="12" fill="url(#craterGrad)" opacity="0.6" />
                  <ellipse cx="132" cy="125" rx="6" ry="8" fill="url(#craterGrad)" opacity="0.55" />

                  {/* Front half of the ring */}
                  <path
                    d="M 24 148 C 45 185, 140 185, 196 115"
                    fill="none"
                    stroke="url(#ringGrad)"
                    strokeWidth="11"
                    strokeLinecap="round"
                  />

                  {/* Orbiting Moon */}
                  <circle cx="152" cy="172" r="7" fill="url(#moonGrad)" />
                </svg>
              </div>

              <div
                onClick={() => {
                  sounds.playClick();
                  setOpenStorageModal(true);
                }}
                className="mt-2 text-center cursor-pointer hover:opacity-80 transition"
              >
                <span className="text-xs font-bold text-amber-900 bg-amber-100/70 border border-amber-300/60 px-3 py-1 rounded-full shadow-2xs">
                  ✨ انقر لمعاينة وتجهيز إطارات الصورة الرمزية
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: المركبة (Vehicle) - 3D Luxury Supercar / Royal Mount Showcase */}
          {activeTab === 'vehicle' && (
            <div className="w-full flex flex-col items-center justify-center animate-in fade-in duration-200">
              <div
                onClick={() => {
                  sounds.playClick();
                  setOpenStorageModal(true);
                }}
                className="relative w-64 h-44 flex flex-col items-center justify-center cursor-pointer group active:scale-95 transition rounded-3xl bg-gradient-to-b from-amber-500/10 via-amber-200/20 to-yellow-500/5 border border-amber-300/60 p-4 shadow-sm"
              >
                {/* Ambient Golden Underglow */}
                <div className="absolute inset-0 bg-amber-400/15 rounded-3xl blur-xl group-hover:bg-amber-400/25 transition" />

                {/* 3D Supercar / Cyber Mount Illustration */}
                <div className="relative z-10 w-44 h-24 flex items-center justify-center">
                  <svg
                    viewBox="0 0 200 100"
                    className="w-full h-full drop-shadow-[0_12px_24px_rgba(245,158,11,0.35)]"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="goldCarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="35%" stopColor="#FCD34D" />
                        <stop offset="70%" stopColor="#D97706" />
                        <stop offset="100%" stopColor="#78350F" />
                      </linearGradient>
                      <linearGradient id="cockpitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0F172A" />
                        <stop offset="100%" stopColor="#38BDF8" />
                      </linearGradient>
                      <radialGradient id="wheelGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FDE047" />
                        <stop offset="60%" stopColor="#B45309" />
                        <stop offset="100%" stopColor="#1E293B" />
                      </radialGradient>
                    </defs>

                    {/* Speed Trails */}
                    <path d="M5 45 L40 45" stroke="#FDE68A" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />
                    <path d="M12 55 L35 55" stroke="#FDE68A" strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />
                    <path d="M2 65 L45 65" stroke="#F59E0B" strokeWidth="2" strokeDasharray="2 3" opacity="0.7" />

                    {/* Car Silhouette / Sleek Body */}
                    <path
                      d="M30 65 L45 52 L75 42 L130 42 L158 52 L185 60 L188 68 L170 70 L30 70 Z"
                      fill="url(#goldCarGrad)"
                      stroke="#FDE68A"
                      strokeWidth="1.5"
                    />

                    {/* Cockpit / Windshield */}
                    <path
                      d="M72 43 L88 30 L124 30 L136 43 Z"
                      fill="url(#cockpitGrad)"
                      stroke="#93C5FD"
                      strokeWidth="1"
                      opacity="0.9"
                    />

                    {/* Rear Spoiler */}
                    <path d="M25 46 L38 52 L36 56 L23 50 Z" fill="#D97706" stroke="#FDE68A" strokeWidth="0.8" />

                    {/* Wheels with Golden Rims */}
                    <circle cx="58" cy="70" r="14" fill="#0F172A" stroke="#F59E0B" strokeWidth="2.5" />
                    <circle cx="58" cy="70" r="8" fill="url(#wheelGlow)" />
                    <circle cx="58" cy="70" r="3" fill="#FFF" />

                    <circle cx="152" cy="70" r="14" fill="#0F172A" stroke="#F59E0B" strokeWidth="2.5" />
                    <circle cx="152" cy="70" r="8" fill="url(#wheelGlow)" />
                    <circle cx="152" cy="70" r="3" fill="#FFF" />

                    {/* Headlight Neon Beam */}
                    <polygon points="186,63 198,60 198,68 186,66" fill="#67E8F9" opacity="0.9" />
                  </svg>
                </div>

                <div className="relative z-10 text-center mt-1">
                  <span className="text-xs font-black text-amber-950 flex items-center justify-center gap-1">
                    <Car className="w-3.5 h-3.5 text-amber-600" />
                    لامبورغيني أفينتادور الذهب
                  </span>
                  <span className="text-[11px] text-amber-700/90 font-medium block mt-0.5">
                    تمنحك موكباً استعراضياً فاخراً ومؤثر صوتي عند دخول الغرف
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  sounds.playClick();
                  setOpenStorageModal(true);
                }}
                className="mt-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold text-xs shadow-xs active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>معاينة وتجهيز المركبات في التخزين</span>
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>
          )}

          {/* TAB 3: لوحة الهدايا (Gift Board) - Luxury Gift Showcase Wall */}
          {activeTab === 'gifts' && (
            <div className="w-full flex flex-col items-center animate-in fade-in duration-200">
              <div className="w-full flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-black text-amber-950 flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5 text-rose-500" />
                  لوحة الهدايا المستلمة
                </span>
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                  128 هدية مستلمة 🎁
                </span>
              </div>

              {/* 6 Grid of Showcase Gifts */}
              <div className="w-full grid grid-cols-3 gap-2">
                {[
                  { name: 'تاج الملوك', icon: '👑', count: 14, color: 'from-amber-500/10 to-yellow-500/20', border: 'border-amber-300' },
                  { name: 'قصر الأحلام', icon: '🏰', count: 5, color: 'from-purple-500/10 to-indigo-500/20', border: 'border-purple-300' },
                  { name: 'فيراري الذهبية', icon: '🏎️', count: 9, color: 'from-amber-500/10 to-orange-500/20', border: 'border-amber-300' },
                  { name: 'باقة الورد', icon: '🌹', count: 48, color: 'from-rose-500/10 to-red-500/20', border: 'border-rose-300' },
                  { name: 'ألماسة النور', icon: '💎', count: 36, color: 'from-cyan-500/10 to-blue-500/20', border: 'border-cyan-300' },
                  { name: 'صاروخ الفضاء', icon: '🚀', count: 16, color: 'from-indigo-500/10 to-violet-500/20', border: 'border-indigo-300' },
                ].map((gift, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      sounds.playCoin();
                    }}
                    className={`relative p-2.5 rounded-2xl bg-gradient-to-b ${gift.color} border ${gift.border} flex flex-col items-center justify-center cursor-pointer active:scale-95 transition shadow-2xs hover:shadow-xs group`}
                  >
                    <span className="text-2xl group-hover:scale-110 transition drop-shadow-sm">
                      {gift.icon}
                    </span>
                    <span className="text-[11px] font-bold text-slate-800 mt-1 line-clamp-1">
                      {gift.name}
                    </span>
                    <span className="text-[10px] font-black text-rose-600 bg-white/80 px-1.5 py-0.2 rounded-full mt-0.5 border border-rose-200">
                      x{gift.count}
                    </span>
                  </div>
                ))}
              </div>

              {!isSelf ? (
                <button
                  onClick={() => {
                    sounds.playClick();
                    setSelectedGiftReceiver(user);
                    setOpenGiftStore(true);
                  }}
                  className="mt-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs shadow-xs active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>إرسال هدية جديدة لملء اللوحة</span>
                </button>
              ) : (
                <div className="mt-2.5 text-center">
                  <span className="text-[11px] text-slate-500 font-medium">
                    يتم تحديث لوحة الهدايا تلقائياً فور استلام الهدايا من الأصدقاء في الغرف
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: لوحة الشرف (Honor Board) - Top Supporters Podium & Honorary Badges */}
          {activeTab === 'honor' && (
            <div className="w-full flex flex-col items-center animate-in fade-in duration-200">
              <div className="w-full flex items-center justify-between mb-2.5 px-1">
                <span className="text-xs font-black text-amber-950 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  كبار الداعمين في لوحة الشرف
                </span>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100/70 border border-amber-300 px-2 py-0.5 rounded-full">
                  الرتب الشرفية 👑
                </span>
              </div>

              {/* Top 3 Supporters Podium */}
              <div className="w-full grid grid-cols-3 gap-2 mb-3">
                {/* 2nd Place */}
                <div
                  onClick={() => sounds.playCoin()}
                  className="p-2.5 rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200 border border-slate-300 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition shadow-2xs"
                >
                  <div className="relative">
                    <span className="text-xl">🥈</span>
                    <span className="absolute -bottom-1 -right-1 text-[9px] bg-slate-400 text-white font-black px-1 rounded-full">2</span>
                  </div>
                  <span className="text-[11px] font-black text-slate-900 mt-1 line-clamp-1">أميرة الشرق</span>
                  <span className="text-[10px] text-slate-600 font-medium">890K</span>
                  <span className="text-[9px] text-slate-500 mt-0.5">داعم ماسي</span>
                </div>

                {/* 1st Place (Center - Elevated) */}
                <div
                  onClick={() => sounds.playCoin()}
                  className="p-3 -mt-2 rounded-2xl bg-gradient-to-b from-amber-100 via-yellow-100 to-amber-200 border-2 border-amber-400 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition shadow-sm relative"
                >
                  <div className="relative">
                    <span className="text-2xl">🥇</span>
                    <Crown className="w-3.5 h-3.5 text-amber-600 absolute -top-1 -right-2 rotate-12" />
                  </div>
                  <span className="text-xs font-black text-amber-950 mt-1 line-clamp-1">ابن العراق الملكي</span>
                  <span className="text-[11px] font-black text-amber-700">1,500,000</span>
                  <span className="text-[9px] font-bold text-amber-800 bg-amber-200/80 px-1.5 py-0.2 rounded-full mt-0.5">
                    الداعم الأسطوري
                  </span>
                </div>

                {/* 3rd Place */}
                <div
                  onClick={() => sounds.playCoin()}
                  className="p-2.5 rounded-2xl bg-gradient-to-b from-amber-50 to-orange-100 border border-orange-200 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition shadow-2xs"
                >
                  <div className="relative">
                    <span className="text-xl">🥉</span>
                    <span className="absolute -bottom-1 -right-1 text-[9px] bg-amber-700 text-white font-black px-1 rounded-full">3</span>
                  </div>
                  <span className="text-[11px] font-black text-amber-950 mt-1 line-clamp-1">فارس الليل</span>
                  <span className="text-[10px] text-amber-800 font-medium">480K</span>
                  <span className="text-[9px] text-amber-700 mt-0.5">داعم بلاتيني</span>
                </div>
              </div>

              {/* Honorary Badges Row */}
              <div className="w-full flex items-center justify-between gap-1.5 pt-2 border-t border-amber-200/80">
                <div className="flex-1 p-1.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-center">
                  <Award className="w-3.5 h-3.5 text-amber-600 mx-auto" />
                  <span className="text-[10px] font-bold text-amber-900 block mt-0.5">وسام العطاء</span>
                </div>
                <div className="flex-1 p-1.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-center">
                  <Shield className="w-3.5 h-3.5 text-indigo-600 mx-auto" />
                  <span className="text-[10px] font-bold text-amber-900 block mt-0.5">درع الوفاء</span>
                </div>
                <div className="flex-1 p-1.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-center">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 mx-auto" />
                  <span className="text-[10px] font-bold text-amber-900 block mt-0.5">نجمة التميز</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            6. Bottom Action Bar (when viewing another user's profile)
            ========================================================================= */}
        {!isSelf && (
          <div className="sticky bottom-0 left-0 right-0 z-20 px-6 py-3 bg-white/95 border-t border-amber-300/60 flex items-center justify-between gap-3 backdrop-blur-md shadow-lg">
            {/* Follow Button */}
            <button
              onClick={handleToggleFollow}
              className={`flex-1 py-2.5 rounded-full font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs ${
                isUserFollowed
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-md shadow-amber-400/30'
              }`}
            >
              {isUserFollowed ? <UserCheck className="w-4 h-4 text-emerald-600" /> : <UserPlus className="w-4 h-4 text-slate-950" />}
              <span>{isUserFollowed ? 'متابع ✓' : 'متابعة'}</span>
            </button>

            {/* Chat Button */}
            <button
              onClick={handleStartChat}
              className="flex-1 py-2.5 rounded-full font-black text-xs flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 transition active:scale-95 cursor-pointer shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>دردشة</span>
            </button>

            {/* Send Gift Button */}
            <button
              onClick={handleSendGift}
              className="py-2.5 px-4 rounded-full font-black text-xs flex items-center justify-center gap-1 bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md transition active:scale-95 cursor-pointer"
            >
              <Gift className="w-4 h-4" />
              <span>إرسال هدية</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal: تعديل الاسم من داخل الملف */}
      {showEditNameModal && (
        <div
          onClick={() => setShowEditNameModal(false)}
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#150a28] border border-purple-500/40 rounded-3xl p-5 shadow-2xl text-right animate-in zoom-in-95 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <Pencil className="w-4 h-4 text-purple-400" />
                <span>تعديل الاسم</span>
              </h3>
              <button
                onClick={() => setShowEditNameModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveName} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5">الاسم الجديد:</label>
                <input
                  type="text"
                  required
                  value={editNameInput}
                  onChange={(e) => setEditNameInput(e.target.value)}
                  placeholder="أدخل الاسم الجديد"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400 text-right"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditNameModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold transition active:scale-95"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg transition active:scale-95"
                >
                  حفظ الاسم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: تعديل السيرة الذاتية من داخل الملف */}
      {showEditBioModal && (
        <div
          onClick={() => setShowEditBioModal(false)}
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#150a28] border border-purple-500/40 rounded-3xl p-5 shadow-2xl text-right animate-in zoom-in-95 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <Pencil className="w-4 h-4 text-purple-400" />
                <span>تعديل السيرة الذاتية</span>
              </h3>
              <button
                onClick={() => setShowEditBioModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBio} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5">السيرة الذاتية (Bio):</label>
                <textarea
                  rows={3}
                  value={editBioInput}
                  onChange={(e) => setEditBioInput(e.target.value)}
                  placeholder="اكتب نبذة عن نفسك..."
                  maxLength={150}
                  className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-400 text-right leading-relaxed resize-none"
                  autoFocus
                />
                <div className="text-[10px] text-slate-400 text-left mt-1 font-mono">
                  {editBioInput.length} / 150
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditBioModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold transition active:scale-95"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg transition active:scale-95"
                >
                  حفظ السيرة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
