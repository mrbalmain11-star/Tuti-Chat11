import React from 'react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, t, isRtl } = useApp();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto font-['Cairo',sans-serif] bg-white border-t border-slate-200/70 select-none shadow-[0_-2px_10px_rgba(0,0,0,0.03)]"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="pt-2 pb-1 px-8 flex items-center justify-between">
        {/* 1. الصفحة الرئيسية */}
        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('home');
          }}
          className="flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer group w-20"
          title={t.navHome}
        >
          <div className="w-9 h-8 flex items-center justify-center relative">
            <svg
              viewBox="0 0 32 32"
              className={`w-7 h-7 transition-colors ${
                activeTab === 'home' ? 'text-[#26c096]' : 'text-[#b6bec9]'
              }`}
              fill="currentColor"
            >
              {/* Rounded Cottage with 3 vertical rounded window pillar cutouts */}
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M14.4 4.5a2.5 2.5 0 0 1 3.2 0l9.6 7.7c.8.6 1.3 1.6 1.3 2.6v9.7a3.5 3.5 0 0 1-3.5 3.5H7A3.5 3.5 0 0 1 3.5 24.5v-9.7c0-1 .5-2 1.3-2.6l9.6-7.7zM11 16.2a1.4 1.4 0 0 1 1.4 1.4v4.8a1.4 1.4 0 0 1-2.8 0v-4.8a1.4 1.4 0 0 1 1.4-1.4zm5-1.5a1.4 1.4 0 0 1 1.4 1.4v6.3a1.4 1.4 0 0 1-2.8 0v-6.3a1.4 1.4 0 0 1 1.4-1.4zm5 1.5a1.4 1.4 0 0 1 1.4 1.4v4.8a1.4 1.4 0 0 1-2.8 0v-4.8a1.4 1.4 0 0 1 1.4-1.4z"
              />
            </svg>
          </div>
          <span
            className={`text-[11px] font-bold tracking-tight mt-0.5 transition-colors ${
              activeTab === 'home'
                ? 'text-[#26c096] font-black'
                : 'text-[#9ca3af]'
            }`}
          >
            {t.navHome}
          </span>
        </button>

        {/* 2. الرسائل */}
        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('messages');
          }}
          className="relative flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer group w-20"
          title={t.navMessages}
        >
          <div className="w-9 h-8 flex items-center justify-center relative">
            {/* Mint Green Glow behind bubble */}
            <div className="absolute inset-0 bg-[#26c096]/20 rounded-full blur-sm pointer-events-none scale-90" />

            {/* Mint Speech Bubble with two yellow dots */}
            <svg
              viewBox="0 0 32 32"
              className="w-7 h-7 relative z-10 drop-shadow-[0_2px_4px_rgba(38,192,150,0.3)]"
            >
              <defs>
                <linearGradient id="mintBubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4ee2ad" />
                  <stop offset="100%" stopColor="#25bf95" />
                </linearGradient>
              </defs>
              {/* Rounded Speech Bubble */}
              <path
                d="M16 4.5C9.6 4.5 4.5 9.3 4.5 15.2c0 3.2 1.5 6 3.9 7.9-.2 1.7-.8 3.5-2.2 4.7 2.3.1 4.7-.6 6.5-1.9 1.1.4 2.2.5 3.3.5 6.4 0 11.5-4.8 11.5-10.7S22.4 4.5 16 4.5z"
                fill={activeTab === 'messages' ? 'url(#mintBubbleGrad)' : '#34d399'}
              />
              {/* Two yellow dots inside bubble */}
              <circle cx="12.5" cy="15" r="1.8" fill="#fef08a" />
              <circle cx="19.5" cy="15" r="1.8" fill="#fef08a" />
            </svg>

            {/* Red Notification Badge with number 1 */}
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#ea3838] text-white text-[10px] font-black rounded-full flex items-center justify-center font-sans shadow-sm z-20">
              1
            </span>
          </div>
          <span
            className={`text-[11px] font-bold tracking-tight mt-0.5 transition-colors ${
              activeTab === 'messages'
                ? 'text-[#26c096] font-black'
                : 'text-[#9ca3af]'
            }`}
          >
            {t.navMessages}
          </span>
        </button>

        {/* 3. أنا */}
        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('profile');
          }}
          className="flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer group w-20"
          title={t.navProfile}
        >
          <div className="w-9 h-8 flex items-center justify-center relative">
            <svg
              viewBox="0 0 32 32"
              className={`w-7 h-7 transition-colors ${
                activeTab === 'profile' ? 'text-[#26c096]' : 'text-[#b6bec9]'
              }`}
              fill="currentColor"
            >
              {/* Cute Mascot Head with two small ears and two cutout circular eyes */}
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.8 7.8c-1.5 0-2.8 1.2-2.8 2.8 0 1.1.6 2 1.5 2.5-.4 1.3-.7 2.7-.7 4.1 0 6.6 5 11.8 11.2 11.8s11.2-5.2 11.2-11.8c0-1.4-.3-2.8-.7-4.1.9-.5 1.5-1.4 1.5-2.5 0-1.6-1.3-2.8-2.8-2.8-.8 0-1.5.3-2 1-1.8-1.1-4-1.8-6.2-1.8s-4.4.7-6.2 1.8c-.5-.7-1.2-1-2-1zM11.5 15.2a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6zm9 0a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6z"
              />
            </svg>
          </div>
          <span
            className={`text-[11px] font-bold tracking-tight mt-0.5 transition-colors ${
              activeTab === 'profile'
                ? 'text-[#26c096] font-black'
                : 'text-[#9ca3af]'
            }`}
          >
            {t.navProfile}
          </span>
        </button>
      </div>

      {/* Bottom gesture line indicator */}
      <div className="w-full flex justify-center pb-1 pt-0.5">
        <div className="w-32 h-1 bg-[#334155] rounded-full" />
      </div>
    </nav>
  );
};
