import React, { useState } from 'react';
import {
  Crown,
  Heart,
  Sparkles,
  Settings,
  Copy,
  Check,
  Radio,
  Users,
  Share2,
  ChevronLeft,
  Volume2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';
import { VipName } from './VipName';

export const RoyalRoomsView: React.FC = () => {
  const {
    currentUser,
    rooms,
    enterRoom,
    createVoiceRoom,
    followedRoomHosts,
    toggleFollowHost,
    setOpenCreateRoomModal,
    setHomeSubTab,
  } = useApp();

  const [copiedId, setCopiedId] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // 1. My Room (غرفتي)
  const myRoom = rooms.find((r) => r.hostId === currentUser.id);

  const handleEnterMyRoom = () => {
    sounds.playClick();
    if (myRoom) {
      enterRoom(myRoom.id);
    } else {
      createVoiceRoom(`دولة العراق 🇮🇶 (غرفتي)`, 'غرفتي الخاصة 👑');
    }
  };

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    const idToCopy = myRoom?.hostId || currentUser.id || '313';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(idToCopy);
    }
    setCopiedId(true);
    showToast('تم نسخ معرف الغرفة بنجاح ✓');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleShareRoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    showToast('تم نسخ رابط مشاركة غرفتك 🔗');
  };

  // 2. Followed Rooms (الغرف الذي اتابعها)
  const followedRooms = rooms.filter(
    (r) => r.hostId !== currentUser.id && (followedRoomHosts.has(r.hostId) || followedRoomHosts.has(r.id))
  );

  return (
    <div
      className="pb-28 px-4 pt-2 font-['Cairo',sans-serif] bg-gradient-to-b from-[#FDFBF7] via-[#FAF6ED] to-[#F5EFE0] min-h-screen text-slate-800 select-none"
      dir="rtl"
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 right-1/2 translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900/90 text-amber-300 text-xs font-bold shadow-2xl backdrop-blur-md border border-amber-400/30 animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* =========================================================================
          SECTION 1: غرفتي (My Room)
          ========================================================================= */}
      <section className="mt-2">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
              <Crown className="w-4.5 h-4.5 text-slate-950 fill-amber-100" />
            </div>
            <div className="flex flex-col text-right leading-tight">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black text-slate-900 tracking-wide">غرفتي</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  الروم الملكي 👑
                </span>
              </div>
              <span className="text-[11px] text-slate-500">مساحتك الصوتية الخاصة للبث والترحيب بالأصدقاء</span>
            </div>
          </div>

          {/* Quick Edit Room Button */}
          <button
            onClick={() => {
              sounds.playClick();
              setOpenCreateRoomModal(true);
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100/90 hover:bg-amber-200 border border-amber-300/80 px-3 py-1.5 rounded-full transition active:scale-95 cursor-pointer shadow-xs"
            title="تعديل أو إعدادات الغرفة"
          >
            <Settings className="w-3.5 h-3.5 text-amber-800" />
            <span>تعديل</span>
          </button>
        </div>

        {/* My Room Grand Royal Card */}
        <div
          onClick={handleEnterMyRoom}
          className="relative rounded-3xl p-4 bg-gradient-to-br from-[#1d1630] via-[#150f24] to-[#0d0917] border border-amber-400/40 shadow-xl cursor-pointer hover:border-amber-400/70 transition-all duration-300 group overflow-hidden active:scale-[0.99]"
        >
          {/* Decorative Background Lighting */}
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />

          {/* Top Row: Room Avatar + Info */}
          <div className="flex items-start gap-3.5 relative z-10">
            {/* Room Cover / Avatar with Golden Crown */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl p-[2px] bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-600 shadow-md">
                <img
                  src={myRoom?.coverImage || currentUser.avatar || '/src/assets/images/iraq_flag_cover_1790177322445.jpg'}
                  alt="غرفتي"
                  className="w-full h-full rounded-2xl object-cover group-hover:scale-105 transition duration-300"
                />
              </div>

              {/* Pulsing Live / Online Badge */}
              <div className="absolute -bottom-1 -left-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center gap-1 shadow-sm border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>مباشر</span>
              </div>
            </div>

            {/* Room Titles and Metadata */}
            <div className="flex-1 text-right min-w-0">
              <div className="flex items-center gap-2 justify-start">
                <h3 className="text-[15px] font-black text-white truncate drop-shadow-sm group-hover:text-amber-300 transition">
                  {myRoom?.title || `غرفة ${currentUser.nickname || currentUser.name || 'دولة العراق'}`}
                </h3>
                <span className="text-base shrink-0 leading-none">
                  {currentUser.countryFlag || '🇮🇶'}
                </span>
              </div>

              {/* Host Tag and VIP Name */}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] text-slate-400 font-medium">المضيف:</span>
                <VipName
                  name={currentUser.nickname || currentUser.name || 'دولة العراق'}
                  vipLevel={currentUser.vipLevel}
                  fallbackColor="text-amber-200"
                  className="text-[12px] font-bold"
                />
              </div>

              {/* Room ID and Capacity Pills */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <button
                  onClick={handleCopyId}
                  className="flex items-center gap-1 text-[10px] text-amber-200/90 hover:text-amber-100 bg-white/10 hover:bg-white/15 px-2 py-0.5 rounded-full font-mono border border-amber-300/20 transition active:scale-95"
                  title="نسخ معرف الغرفة"
                >
                  <span>ID: {myRoom?.hostId || currentUser.id || '313'}</span>
                  {copiedId ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-amber-300" />
                  )}
                </button>

                <span className="text-[10px] text-slate-300 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
                  <Users className="w-3 h-3 text-purple-300" />
                  <span>10 مقاعد صوتية</span>
                </span>
              </div>
            </div>
          </div>

          {/* Announcement banner inside card */}
          <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300 relative z-10">
            <span className="truncate max-w-[210px] text-slate-400">
              🎙️ {myRoom?.announcement || 'أهلاً وسهلاً بالجميع في غرفتي الرسمية على توتي شات'}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleShareRoom}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 transition active:scale-90"
                title="مشاركة الغرفة"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-200" />
              </button>
            </div>
          </div>

          {/* Bottom Call-To-Action Button */}
          <div className="mt-3 relative z-10">
            <div className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 group-hover:brightness-105 active:scale-98 transition">
              <Radio className="w-4 h-4 text-slate-950 animate-pulse" />
              <span>دخول غرفتي الآن 🎙️</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: الغرف الذي اتابعها (Followed Rooms)
          ========================================================================= */}
      <section className="mt-7">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Heart className="w-4.5 h-4.5 text-white fill-white" />
            </div>
            <div className="flex flex-col text-right leading-tight">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black text-slate-900 tracking-wide">
                  الغرف الذي اتابعها
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  {followedRooms.length} غرف
                </span>
              </div>
              <span className="text-[11px] text-slate-500">قائمة الغرف والمضيفين المفضلين لديك</span>
            </div>
          </div>

          {/* Explore shortcut if user wants more */}
          <button
            onClick={() => {
              sounds.playClick();
              setHomeSubTab('party');
            }}
            className="text-[11px] font-bold text-slate-600 hover:text-emerald-700 transition flex items-center gap-0.5 active:scale-95 cursor-pointer"
          >
            <span>استكشاف المزيد</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Followed Rooms Grid */}
        {followedRooms.length > 0 ? (
          <div className="grid grid-cols-2 gap-3.5">
            {followedRooms.map((room) => {
              return (
                <div
                  key={room.id}
                  onClick={() => {
                    sounds.playClick();
                    enterRoom(room.id);
                  }}
                  className="group flex flex-col bg-white rounded-2xl p-2 border border-amber-200/80 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer active:scale-98 select-none relative"
                >
                  {/* Cover Image Container */}
                  <div className="relative aspect-[1/1] w-full rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={room.coverImage}
                      alt={room.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Dark gradient vignette */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/70 pointer-events-none" />

                    {/* Followed Heart Badge (Top Left in RTL) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFollowHost(room.hostId);
                        showToast(`تم تحديث متابعة ${room.hostName}`);
                      }}
                      className="absolute top-1.5 left-1.5 z-10 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-rose-400 hover:text-rose-300 backdrop-blur-xs transition active:scale-90"
                      title="إلغاء أو تعديل المتابعة"
                    >
                      <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    </button>

                    {/* Listeners Count (Bottom Left) */}
                    <div className="absolute bottom-1.5 left-1.5 z-10 flex items-center gap-1 text-white text-[11px] font-bold drop-shadow-md">
                      <span className="text-white text-xs">ılı</span>
                      <span className="font-sans">{room.listenersCount ?? 120}</span>
                    </div>

                    {/* Host Avatar (Bottom Right) */}
                    <div className="absolute bottom-1.5 right-1.5 z-10 w-5 h-5 rounded-full overflow-hidden border border-white shadow-xs">
                      <img
                        src={room.hostAvatar || room.coverImage}
                        alt={room.hostName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Room Details below image */}
                  <div className="mt-2 flex flex-col text-right px-0.5">
                    <div className="flex items-center gap-1 justify-start">
                      <span className="text-xs font-black text-slate-800 truncate group-hover:text-emerald-700 transition">
                        {room.title}
                      </span>
                      {room.countryFlag && (
                        <span className="text-xs shrink-0 leading-none">{room.countryFlag}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                      <span className="truncate max-w-[90px]">{room.hostName}</span>
                      <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200/60">
                        مباشر 🎙️
                      </span>
                    </div>

                    {/* Enter room button */}
                    <div className="mt-2 w-full py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs group-hover:brightness-105 transition">
                      <Volume2 className="w-3 h-3" />
                      <span>دخول الغرفة</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State when no rooms are followed */
          <div className="rounded-3xl p-6 bg-white/80 border border-dashed border-amber-300/80 text-center flex flex-col items-center justify-center shadow-xs">
            <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-2xl mb-3 shadow-xs">
              ❤️
            </div>
            <h3 className="text-sm font-black text-slate-800 mb-1">
              لا توجد غرف في قائمة المتابعة حالياً
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mb-4 leading-relaxed">
              تابع مضيفيك وغرفك المفضلة بالنقر على أيقونة المتابعة لتظهر غرفهم في هذه القائمة تلقائياً!
            </p>
            <button
              onClick={() => {
                sounds.playClick();
                setHomeSubTab('party');
              }}
              className="px-5 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
            >
              استكشف الغرف الشائعة 🔥
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
