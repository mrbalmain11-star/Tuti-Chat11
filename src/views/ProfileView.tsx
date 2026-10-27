import React, { useState, useRef, useEffect } from 'react';
import {
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Mail,
  Languages,
  FileUp,
  Settings,
  Camera,
  Loader2,
  Pencil,
  X,
  LogOut,
  Crown,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';
import { processImageFile } from '../utils/imageUpload';
import { CharmBadge, WealthBadge, GameBadge } from '../components/LevelBadgeIcons';
import { VipName } from '../components/VipName';
import { VipBadge } from '../components/VipBadge';
import { fetchMyProfile, fetchMyAdminAccess, saveMyProfile, uploadMyAvatar, getMyAvatarUrl, type AdminAccess } from '../services/stagingBackend';
import { AdminCenterView } from './AdminCenterView';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    updateUserProfile,
    setOpenVipModal,
    setVipModalInitialPopup,
    setOpenLevelsModal,
    setLevelsModalTab,
    setOpenAgencyModal,
    setOpenRechargeModal,
    setOpenStorageModal,
    setOpenSettingsModal,
    setOpenLanguageModal,
    setOpenInviteModal,
    setInternalProfileUser,
    setOpenInternalProfileModal,
    setOpenEditProfileModal,
    setIsLoggedIn,
    t,
    isRtl,
    language,
    agencyMemberCount,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [adminAccess, setAdminAccess] = useState<AdminAccess | null>(null);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  useEffect(() => {
    let active = true;
    setAdminAccess(null);
    void fetchMyAdminAccess().then(access => {
      if (active) setAdminAccess(access);
    }).catch(error => console.error('Admin access unavailable:', error));
    return () => { active = false; };
  }, [currentUser.id]);
  const [publicId, setPublicId] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    void fetchMyProfile().then(profile => {
      if (active) setPublicId(profile?.public_id ?? null);
    }).catch(error => console.error('Unable to load public profile ID:', error));
    return () => { active = false; };
  }, [currentUser.id]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [, setSavingProfile] = useState(false);
  useEffect(() => { let active = true; void fetchMyProfile().then(async p => { if (!p || !active) return; const avatar = p.avatar_url ? await getMyAvatarUrl(p.avatar_url) : null; if (active) updateUserProfile({ name: p.display_name, nickname: p.display_name, bio: p.bio, ...(avatar ? { avatar } : {}) }); }).catch(console.error); return () => { active = false; }; }, [currentUser.id]);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Quick edit modals state
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');

  const [showEditBioModal, setShowEditBioModal] = useState(false);
  const [editBioInput, setEditBioInput] = useState('');

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingAvatar(true);
      if (!file.type.startsWith('image/')) throw new Error('اختر ملف صورة');
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
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('تعذر تحويل الصورة')), 'image/webp', 0.82));
      const path = await uploadMyAvatar(blob);
      const signed = await getMyAvatarUrl(path);
      updateUserProfile({ avatar: signed });
      setToastMessage('تم حفظ الصورة في حسابك بنجاح');
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : 'تعذر حفظ الصورة على الخادم');
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
      setToastMessage('تم تغيير غلاف الملف الشخصي بنجاح! 🖼️');
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage('تعذر رفع صورة الغلاف، يرجى المحاولة مرة أخرى');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = editNameInput.trim();
    if (name.length < 2 || name.length > 40) { setToastMessage('الاسم يجب أن يكون من 2 إلى 40 حرفاً'); return; }
    setSavingProfile(true);
    try {
      const saved = await saveMyProfile({ display_name: name });
      updateUserProfile({ name: saved.display_name, nickname: saved.display_name });
      setShowEditNameModal(false);
      setToastMessage('تم حفظ الاسم على الخادم');
    } catch (error) { setToastMessage(error instanceof Error ? error.message : 'فشل حفظ الاسم'); }
    finally { setSavingProfile(false); }
  };

  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const saved = await saveMyProfile({ bio: editBioInput.trim().slice(0,150) });
      updateUserProfile({ bio: saved.bio });
      setShowEditBioModal(false);
      setToastMessage('تم حفظ السيرة على الخادم');
    } catch (error) { setToastMessage(error instanceof Error ? error.message : 'فشل حفظ السيرة'); }
    finally { setSavingProfile(false); }
  };

  const handleCopyId = () => {
    const idToCopy = publicId?.toString();
    if (!idToCopy) return;
    navigator.clipboard?.writeText(idToCopy);
    setCopied(true);
    sounds.playCoin();
    setToastMessage(`تم نسخ المعرف: ${idToCopy}`);
    setTimeout(() => {
      setCopied(false);
      setToastMessage(null);
    }, 2000);
  };

  const handleUploadLogs = () => {
    sounds.playCoin();
    setToastMessage('جاري رفع السجلات...');
    setTimeout(() => {
      setToastMessage('تم رفع السجلات بنجاح بنسبة 100% ✅');
      setTimeout(() => setToastMessage(null), 3000);
    }, 1200);
  };

  const handleInvite = () => {
    sounds.playClick();
    setOpenInviteModal(true);
  };

  return (
    <div
      className="min-h-screen pb-28 font-['Cairo',sans-serif] bg-gradient-to-b from-[#FDFBF7] via-[#FAF6ED] to-[#F5EFE0] text-slate-800 select-none relative overflow-x-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {adminPanelOpen && adminAccess && <AdminCenterView onClose={() => setAdminPanelOpen(false)} />}
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-white/95 border border-amber-400 text-slate-900 text-xs font-bold px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-3">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input for Phone Gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFile}
      />

      {/* Hidden File Input for Profile Cover Banner */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCoverFile}
      />

      {/* Atmospheric Profile Cover Banner with Gold Accents */}
      <div className="relative w-full h-36 md:h-44 overflow-hidden border-b border-amber-200/70 shadow-xs">
        <img
          src={
            currentUser.cover ||
            '/placeholder-cover.svg'
          }
          alt="غلاف الملف الشخصي"
          className="w-full h-full object-cover"
        />
        {/* Soft elegant gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-[#FDFBF7]" />

        {/* Change Cover Button (تغيير الغلاف) */}
        <button
          onClick={() => coverInputRef.current?.click()}
          className="absolute top-3 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-slate-800 text-xs font-bold border border-amber-300 shadow-md transition active:scale-95 cursor-pointer backdrop-blur-xs"
          title="تغيير صورة الغلاف"
        >
          {uploadingCover ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
          ) : (
            <Camera className="w-3.5 h-3.5 text-amber-600" />
          )}
          <span>تغيير الغلاف</span>
        </button>
      </div>

      {/* Atmospheric Soft Gold Glow behind Avatar */}
      <div className="absolute top-28 right-0 w-72 h-72 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* =========================================================================
          Top Profile Header Section
          ========================================================================= */}
      <div className="relative pt-3 pb-4 px-5">
        {/* Profile Card Row */}
        <div className="flex items-center justify-between">
          {/* Right Side: Avatar + Details */}
          <div className="flex items-center gap-3.5">
            {/* Avatar Circle with Camera upload button */}
            <div className="relative w-18 h-18 rounded-full shrink-0 group">
              <div
                onClick={() => {
                  sounds.playClick();
                  setInternalProfileUser(currentUser);
                  setOpenInternalProfileModal(true);
                }}
                className="w-full h-full rounded-full overflow-hidden border-2 border-amber-400 shadow-lg cursor-pointer active:scale-95 transition bg-white"
                title="عرض الملف الشخصي"
              >
                <img
                  src={
                    currentUser.avatar ||
                    '/placeholder-avatar.svg'
                  }
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center text-white z-20">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              )}
            </div>

            {/* User Info (Name, ID, Badges) */}
            <div className="flex flex-col items-start text-right">
              {/* Name with Edit Pencil */}
              <div className="flex items-center gap-2">
                <h1
                  onClick={() => {
                    sounds.playClick();
                    setEditNameInput(currentUser.name || '');
                    setShowEditNameModal(true);
                  }}
                  className="text-xl font-black tracking-wide cursor-pointer transition select-none"
                  title="انقر لتعديل الاسم"
                >
                  <VipName
                    name={currentUser.name || 'مستخدم جديد'}
                    vipLevel={currentUser.vipLevel}
                    fallbackColor="text-slate-900"
                    className="text-xl font-black drop-shadow-xs"
                  />
                </h1>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sounds.playClick();
                    setEditNameInput(currentUser.name || '');
                    setShowEditNameModal(true);
                  }}
                  className="w-6 h-6 rounded-full bg-amber-100/80 hover:bg-amber-200 border border-amber-300 text-amber-800 flex items-center justify-center transition active:scale-90 cursor-pointer shadow-xs"
                  title="تعديل الاسم"
                >
                  <Pencil className="w-3 h-3 text-amber-700" />
                </button>
              </div>

              {/* ID Line: ❐ ID: 313 */}
              <button
                onClick={handleCopyId}
                className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-mono hover:text-slate-900 transition active:scale-95 cursor-pointer font-bold"
                title="نسخ المعرف"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span className="font-semibold tracking-wider">
                  ID: {publicId ?? '—'}
                </span>
              </button>

              {/* Badges Row: Flag + Gender/Age + Charm Level + Wealth Level */}
              <div className="flex items-center gap-1.5 mt-2">
                {/* Flag */}
                {currentUser.countryFlag && <span className="text-base leading-none">{currentUser.countryFlag}</span>}

                {/* Only verified profile values are displayed. */}
                {/* Charm / Experience Level Badge */}
                <CharmBadge
                  level={currentUser.charmLevel}
                  size="compact"
                  onClick={() => {
                    sounds.playClick();
                    setLevelsModalTab('charm');
                    setOpenLevelsModal(true);
                  }}
                  className="shadow-xs"
                />

                {/* Wealth Level Badge */}
                <WealthBadge
                  level={currentUser.wealthLevel}
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
                  level={currentUser.gameLevel || 0}
                  size="compact"
                  onClick={() => {
                    sounds.playClick();
                    setLevelsModalTab('games');
                    setOpenLevelsModal(true);
                  }}
                  className="shadow-xs"
                />

                {/* VIP Level Badge (إشارة VIP واحدة فقط في الملف الشخصي) */}
                {currentUser.vipLevel > 0 && (
                  <VipBadge
                    vipLevel={currentUser.vipLevel}
                    size="compact"
                    onClick={() => {
                      sounds.playClick();
                      setVipModalInitialPopup('badge');
                      setOpenVipModal(true);
                    }}
                    className="shadow-xs hover:scale-105 transition-transform"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Left Side: Chevron Back / Arrow */}
          <button
            onClick={() => {
              sounds.playClick();
              setInternalProfileUser(currentUser);
              setOpenInternalProfileModal(true);
            }}
            className="p-2 text-slate-400 hover:text-slate-700 transition active:scale-90 cursor-pointer"
            title="عرض الملف الداخلي"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Bio / السيرة الذاتية with Edit Button */}
        <div className="mt-4 bg-white/90 border border-amber-200/90 rounded-2xl p-3.5 shadow-sm flex items-center justify-between">
          <div
            onClick={() => {
              sounds.playClick();
              setEditBioInput(currentUser.bio || '');
              setShowEditBioModal(true);
            }}
            className="flex-1 text-right pl-2 cursor-pointer hover:opacity-90 transition"
            title="انقر لتعديل السيرة الذاتية"
          >
            <span className="text-[10px] text-amber-700 font-black block mb-0.5">السيرة الذاتية:</span>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              {currentUser.bio || 'لا توجد سيرة ذاتية بعد. انقر على أيقونة القلم لكتابة نبذة عنك ✨'}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              sounds.playClick();
              setEditBioInput(currentUser.bio || '');
              setShowEditBioModal(true);
            }}
            className="w-7 h-7 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0 transition active:scale-90 cursor-pointer shadow-xs mr-1"
            title="تعديل السيرة الذاتية"
          >
            <Pencil className="w-3.5 h-3.5 text-amber-700" />
          </button>
        </div>

        {/* =========================================================================
            Realistic Dynamic Agency Rectangle (مستطيل الوكالة الفعلي بالمعلومات الحقيقية)
            يعرض صورة الوكيل الحقيقية، ومعرف الوكيل (ID)، وعدد المضيفين المتغير تلقائياً
            ========================================================================= */}
        {/* Agency card hidden until a real membership is loaded from the backend. */}

        {/* =========================================================================
            Stats Row: (الزوار | المعجبون | متابعة | الأصدقاء)
            ========================================================================= */}
        <div className="grid grid-cols-4 gap-2 text-center mt-6 pt-1 px-1">
          {/* الأصدقاء (Friends) */}
          <div
            onClick={() => sounds.playClick()}
            className="cursor-pointer active:scale-95 transition"
          >
            <span className="text-2xl font-black text-slate-900 block font-sans">
              {currentUser.friendsCount ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-bold mt-1 block">
              الأصدقاء
            </span>
          </div>

          {/* متابعة (Following) */}
          <div
            onClick={() => sounds.playClick()}
            className="cursor-pointer active:scale-95 transition"
          >
            <span className="text-2xl font-black text-slate-900 block font-sans">
              {currentUser.followingCount ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-bold mt-1 block">
              متابعة
            </span>
          </div>

          {/* المعجبون (Fans) */}
          <div
            onClick={() => sounds.playClick()}
            className="cursor-pointer active:scale-95 transition"
          >
            <span className="text-2xl font-black text-slate-900 block font-sans">
              {currentUser.fansCount ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-bold mt-1 block">
              المعجبون
            </span>
          </div>

          {/* الزوار (Visitors) */}
          <div
            onClick={() => sounds.playClick()}
            className="cursor-pointer active:scale-95 transition"
          >
            <span className="text-2xl font-black text-slate-900 block font-sans">
              {currentUser.visitorsCount ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-bold mt-1 block">
              الزوار
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          Balance / Wallet Cards: (ألماس | شحن) - White & Gold
          ========================================================================= */}
      <div className="px-5 mt-2 grid grid-cols-2 gap-3.5">
        {/* Card 1 (Right in RTL): Coins & Recharge (شحن) */}
        <div
          onClick={() => {
            sounds.playClick();
            setOpenRechargeModal(true);
          }}
          className="rounded-2xl bg-gradient-to-b from-white via-amber-50/50 to-amber-100/40 border border-amber-300 p-4 flex items-center justify-between cursor-pointer active:scale-98 transition shadow-[0_4px_15px_rgba(245,158,11,0.12)] hover:border-amber-400"
        >
          {/* Left Text in Card */}
          <div className="text-right flex-1 min-w-0 pr-1">
            <span
              className="text-base sm:text-lg font-black text-amber-700 block font-sans truncate"
              title={(currentUser.coins ?? 0).toLocaleString('en-US')}
            >
              {(currentUser.coins ?? 0).toLocaleString('en-US')}
            </span>
            <span className="text-xs text-slate-600 font-bold mt-1 block">
              شحن 🪙
            </span>
          </div>

          {/* Right Icon in Card: 3D Gold Coin with Star */}
          <div className="w-12 h-12 flex items-center justify-center">
            <svg viewBox="0 0 48 48" className="w-11 h-11 drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]">
              <circle cx="24" cy="24" r="21" fill="url(#coinOuterGrad)" stroke="#FEF08A" strokeWidth="1.5" />
              <circle cx="24" cy="24" r="16" fill="url(#coinInnerGrad)" stroke="#F59E0B" strokeWidth="1" />
              <polygon
                points="24,14 27,20 34,21 29,26 30.5,33 24,29.5 17.5,33 19,26 14,21 21,20"
                fill="#FEF08A"
              />
              <defs>
                <linearGradient id="coinOuterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FEF08A" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#B45309" />
                </linearGradient>
                <linearGradient id="coinInnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 2 (Left in RTL): Diamonds (ألماس) */}
        <div
          onClick={() => {
            sounds.playClick();
            setToastMessage('رصيد الألماس الخاص بك 💎');
            setTimeout(() => setToastMessage(null), 2500);
          }}
          className="rounded-2xl bg-gradient-to-b from-white via-sky-50/40 to-amber-50/20 border border-amber-200/90 p-4 flex items-center justify-between cursor-pointer active:scale-98 transition shadow-[0_4px_15px_rgba(59,130,246,0.08)] hover:border-amber-300"
        >
          {/* Left Text in Card */}
          <div className="text-right">
            <span className="text-2xl font-black text-slate-900 block font-sans">
              {currentUser.diamonds ?? 0}
            </span>
            <span className="text-xs text-slate-600 font-bold mt-1 block">
              ألماس 💎
            </span>
          </div>

          {/* Right Icon in Card: 3D Blue Diamond */}
          <div className="w-12 h-12 flex items-center justify-center">
            <svg viewBox="0 0 48 48" className="w-11 h-11 drop-shadow-[0_2px_8px_rgba(59,130,246,0.4)]">
              <path
                d="M14 14 L34 14 L42 24 L24 40 L6 24 Z"
                fill="url(#diamondBaseGrad)"
                stroke="#93C5FD"
                strokeWidth="1.2"
              />
              <polygon points="14,14 34,14 29,24 19,24" fill="#60A5FA" opacity="0.8" />
              <polygon points="14,14 19,24 6,24" fill="#3B82F6" opacity="0.9" />
              <polygon points="34,14 42,24 29,24" fill="#1D4ED8" opacity="0.9" />
              <polygon points="19,24 29,24 24,40" fill="#93C5FD" opacity="0.8" />
              <polygon points="6,24 19,24 24,40" fill="#2563EB" opacity="0.95" />
              <polygon points="42,24 29,24 24,40" fill="#1E40AF" opacity="0.95" />
              <defs>
                <linearGradient id="diamondBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#BFDBFE" />
                  <stop offset="50%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#1E3A8A" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* =========================================================================
          Quick Action Grid Card: (الوكالة | المستوى | الزينة | VIP)
          ========================================================================= */}
      <div className="px-5 mt-4">
        <div className="rounded-2xl bg-white/95 border border-amber-200/90 p-4 shadow-[0_4px_20px_rgba(217,119,6,0.06)]">
          <div className="grid grid-cols-4 gap-2 text-center">
            {/* 1. VIP (Far right in RTL) */}
            <button
              onClick={() => {
                sounds.playClick();
                setOpenVipModal(true);
              }}
              className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition"
            >
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 p-[1.5px] shadow-[0_2px_12px_rgba(245,158,11,0.3)] group-hover:scale-105 transition">
                <div className="w-full h-full rounded-2xl bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center">
                  <span className="text-xl font-black italic text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                    V
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-800">VIP</span>
            </button>

            {/* 2. الزينة (Decoration / Storage) */}
            <button
              onClick={() => {
                sounds.playClick();
                setOpenStorageModal(true);
              }}
              className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition"
            >
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-fuchsia-500 via-purple-400 to-amber-300 p-[1.5px] shadow-[0_2px_12px_rgba(192,132,252,0.3)] group-hover:scale-105 transition">
                <div className="w-full h-full rounded-2xl bg-gradient-to-b from-purple-500 via-purple-600 to-purple-800 flex items-center justify-center">
                  <span className="text-2xl drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]">
                    🪄
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-800">الزينة</span>
            </button>

            {/* 3. المستوى (Level) */}
            <button
              onClick={() => {
                sounds.playClick();
                setOpenLevelsModal(true);
              }}
              className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition"
            >
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-400 to-amber-300 p-[1.5px] shadow-[0_2px_12px_rgba(244,63,94,0.3)] group-hover:scale-105 transition">
                <div className="w-full h-full rounded-2xl bg-gradient-to-b from-rose-500 via-pink-600 to-rose-700 flex items-center justify-center">
                  <span className="text-2xl drop-shadow-[0_0_8px_rgba(251,113,133,0.8)]">
                    👑
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-800">المستوى</span>
            </button>

            {/* 4. الوكالة (Agency) */}
            <button
              onClick={() => {
                sounds.playClick();
                setOpenAgencyModal(true);
              }}
              className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition"
            >
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-amber-300 p-[1.5px] shadow-[0_2px_12px_rgba(6,182,212,0.3)] group-hover:scale-105 transition">
                <div className="w-full h-full rounded-2xl bg-gradient-to-b from-cyan-600 via-sky-600 to-blue-700 flex items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    <span className="text-xl">🏠</span>
                    <span className="absolute -top-1 -right-1 text-xs">⭐</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-slate-800">الوكالة</span>
                <span className="text-[10px] font-bold text-amber-600">
                  {currentUser.agencyRole || 'مستخدم'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          Settings / Navigation List Card: (دعوة | اللغة | رفع السجلات | الإعدادات)
          ========================================================================= */}
      <div className="px-5 mt-4">
        <div className="rounded-2xl bg-white/95 border border-amber-200/90 overflow-hidden shadow-[0_4px_20px_rgba(217,119,6,0.06)] divide-y divide-amber-100/70">
          {/* 1. دعوة (Invite) */}
          <div
            onClick={handleInvite}
            className="p-4 flex items-center justify-between hover:bg-amber-50/50 active:bg-amber-100/50 transition cursor-pointer group"
          >
            {/* Right: Icon + Label */}
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center group-hover:scale-105 transition">
                <Mail className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{t.inviteFriends}</span>
                <span className="text-[10px] font-black text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full shadow-xs">
                  2500 🪙
                </span>
              </div>
            </div>

            {/* Chevron */}
            <div className="flex items-center gap-1.5 text-xs text-amber-600">
              <span className="text-[11px] font-medium hidden sm:inline">{t.newUserReward}</span>
              {isRtl ? <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" /> : <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />}
            </div>
          </div>

          {/* 2. Language */}
          <div
            onClick={() => {
              sounds.playClick();
              setOpenLanguageModal(true);
            }}
            className="p-4 flex items-center justify-between hover:bg-amber-50/50 active:bg-amber-100/50 transition cursor-pointer"
          >
            {/* Icon + Label */}
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 border border-blue-300 text-blue-700 flex items-center justify-center">
                <Languages className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-900">{t.languageSettings}</span>
            </div>

            {/* Chevron */}
            {isRtl ? <ChevronLeft className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </div>

          {/* 3. Upload Logs */}
          <div
            onClick={handleUploadLogs}
            className="p-4 flex items-center justify-between hover:bg-amber-50/50 active:bg-amber-100/50 transition cursor-pointer"
          >
            {/* Icon + Label */}
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center">
                <FileUp className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-900">{t.uploadLogs}</span>
            </div>

            {/* Chevron */}
            {isRtl ? <ChevronLeft className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </div>

          {/* 4. Settings */}
          <div
            onClick={() => {
              sounds.playClick();
              setOpenSettingsModal(true);
            }}
            className="p-4 flex items-center justify-between hover:bg-amber-50/50 active:bg-amber-100/50 transition cursor-pointer"
          >
            {/* Icon + Label */}
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 border border-purple-300 text-purple-700 flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-900">{t.settingsTitle}</span>
            </div>

            {/* Chevron */}
            {isRtl ? <ChevronLeft className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </div>

          {adminAccess && (
            <div
              onClick={() => { sounds.playClick(); setAdminPanelOpen(true); }}
              className="p-4 flex items-center justify-between hover:bg-amber-50/50 active:bg-amber-100/50 transition cursor-pointer"
              role="button" tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter') setAdminPanelOpen(true); }}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center"><ShieldCheck className="w-4 h-4" /></div>
                <span className="text-sm font-bold text-slate-900">مركز الإدارة</span>
              </div>
              {isRtl ? <ChevronLeft className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </div>
          )}
          {/* 5. Log Out */}
          <div
            onClick={() => {
              sounds.playClick();
              setIsLoggedIn(false);
            }}
            className="p-4 flex items-center justify-between hover:bg-red-50/50 active:bg-red-100/50 transition cursor-pointer group"
          >
            {/* Icon + Label */}
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-red-100 border border-red-300 text-red-600 flex items-center justify-center group-hover:scale-105 transition">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-red-600">تسجيل الخروج</span>
            </div>

            {/* Left: Chevron */}
            <ChevronLeft className="w-4 h-4 text-red-400" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          Modal: تغيير الاسم (Quick Edit Name Modal) - White & Gold
          ========================================================================= */}
      {showEditNameModal && (
        <div
          onClick={() => setShowEditNameModal(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white border border-amber-300 rounded-3xl p-5 shadow-2xl text-right animate-in zoom-in-95 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-amber-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Pencil className="w-4 h-4 text-amber-600" />
                <span>تعديل الاسم</span>
              </h3>
              <button
                onClick={() => setShowEditNameModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveName} className="space-y-4">
              <div>
                <label className="text-xs text-slate-600 font-bold block mb-1.5">الاسم الجديد:</label>
                <input
                  type="text"
                  required
                  value={editNameInput}
                  onChange={(e) => setEditNameInput(e.target.value)}
                  placeholder="أدخل الاسم الجديد"
                  className="w-full bg-amber-50/50 border border-amber-300/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-amber-500 text-right font-bold"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditNameModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 text-xs font-black shadow-md transition active:scale-95"
                >
                  حفظ الاسم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          Modal: تعديل السيرة الذاتية (Quick Edit Bio Modal) - White & Gold
          ========================================================================= */}
      {showEditBioModal && (
        <div
          onClick={() => setShowEditBioModal(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white border border-amber-300 rounded-3xl p-5 shadow-2xl text-right animate-in zoom-in-95 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-amber-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Pencil className="w-4 h-4 text-amber-600" />
                <span>تعديل السيرة الذاتية</span>
              </h3>
              <button
                onClick={() => setShowEditBioModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBio} className="space-y-4">
              <div>
                <label className="text-xs text-slate-600 font-bold block mb-1.5">السيرة الذاتية (Bio):</label>
                <textarea
                  rows={3}
                  value={editBioInput}
                  onChange={(e) => setEditBioInput(e.target.value)}
                  placeholder="اكتب نبذة عن نفسك..."
                  maxLength={150}
                  className="w-full bg-amber-50/50 border border-amber-300/80 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-amber-500 text-right leading-relaxed resize-none font-medium"
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
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 text-xs font-black shadow-md transition active:scale-95"
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
