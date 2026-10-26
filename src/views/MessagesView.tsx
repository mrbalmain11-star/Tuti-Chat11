import React from 'react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

export const MessagesView: React.FC = () => {
  const { conversations, setOpenChatThread, t, isRtl } = useApp();

  // Find system and official or default
  const systemConv = conversations.find((c) => c.isSystem || c.id === 'system-1') || conversations[0];
  const officialConv = conversations.find((c) => c.isOfficial || c.id === 'official-1') || conversations[1];
  const otherConvs = conversations.filter((c) => c.id !== systemConv?.id && c.id !== officialConv?.id);

  return (
    <div
      className="min-h-screen pb-28 pt-4 px-4 font-['Cairo',sans-serif] bg-gradient-to-b from-[#FDFBF7] via-[#FAF6ED] to-[#F5EFE0] text-slate-800 select-none"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Top Header */}
      <div className="pt-2 pb-5 px-1 flex items-center justify-start">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t.navMessages}</h1>
      </div>

      {/* Main Messages List matching screenshot 1:1 */}
      <div className="space-y-4">
        {/* 1. رسائل النظام (System Messages) */}
        <div
          onClick={() => {
            sounds.playClick();
            if (systemConv) setOpenChatThread(systemConv);
          }}
          className="flex items-center justify-between py-2 px-1 hover:bg-black/[0.02] active:bg-black/[0.04] transition rounded-2xl cursor-pointer"
        >
          {/* Right side: Avatar & Text */}
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            {/* Avatar: Golden Royal Dome Bell */}
            <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 border border-amber-300/40 shadow-sm bg-gradient-to-b from-amber-100 to-amber-200">
              <img
                src="/system-bell.jpg"
                alt="رسائل النظام"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=200&auto=format&fit=crop&q=80';
                }}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Titles */}
            <div className="flex flex-col text-right min-w-0">
              <h3 className="text-base font-black text-slate-900 leading-snug">رسائل النظام</h3>
              <p className="text-xs text-[#8aa192] font-semibold truncate max-w-[210px] sm:max-w-xs mt-0.5">
                تهانينا! لقد حصلت على حزمة مكافأة المستخدم الجديد: [...
              </p>
            </div>
          </div>

          {/* Left side: Date & Unread Badge */}
          <div className="flex flex-col items-center gap-1.5 shrink-0 pl-1">
            <span className="text-[11px] text-[#8aa192] font-semibold">الجمعة</span>
            <span className="w-5 h-5 rounded-full bg-[#f43f5e] text-white text-[10px] font-black flex items-center justify-center shadow-sm">
              1
            </span>
          </div>
        </div>

        {/* 2. رسائل رسمية (Official Messages) */}
        <div
          onClick={() => {
            sounds.playClick();
            if (officialConv) setOpenChatThread(officialConv);
          }}
          className="flex items-center justify-between py-2 px-1 hover:bg-black/[0.02] active:bg-black/[0.04] transition rounded-2xl cursor-pointer"
        >
          {/* Right side: Avatar & Text */}
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            {/* Avatar: Cute Mascot in Green Hood */}
            <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 border border-emerald-300/40 shadow-sm bg-gradient-to-b from-emerald-100 to-emerald-200">
              <img
                src="/official-mascot.jpg"
                alt="رسائل رسمية"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
                }}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Titles */}
            <div className="flex flex-col text-right min-w-0">
              <h3 className="text-base font-black text-slate-900 leading-snug">رسائل رسمية</h3>
              <p className="text-xs text-[#a0b0a6] font-medium truncate max-w-[210px] sm:max-w-xs mt-0.5">
                No message
              </p>
            </div>
          </div>

          {/* Left side: Empty as in screenshot */}
          <div className="shrink-0 pl-1" />
        </div>

        {/* Other Direct Chats if any */}
        {otherConvs.map((conv) => (
          <div
            key={conv.id}
            onClick={() => {
              sounds.playClick();
              setOpenChatThread(conv);
            }}
            className="flex items-center justify-between py-2 px-1 hover:bg-black/[0.02] active:bg-black/[0.04] transition rounded-2xl cursor-pointer"
          >
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 border border-slate-200 shadow-xs">
                <img
                  src={conv.userAvatar}
                  alt={conv.userName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col text-right min-w-0">
                <h3 className="text-base font-black text-slate-900 leading-snug">{conv.userName}</h3>
                <p className="text-xs text-[#8aa192] font-medium truncate max-w-[210px] sm:max-w-xs mt-0.5">
                  {conv.lastMessage}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1.5 shrink-0 pl-1">
              <span className="text-[11px] text-[#8aa192] font-semibold">{conv.lastTime}</span>
              {conv.unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#f43f5e] text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                  {conv.unreadCount}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
