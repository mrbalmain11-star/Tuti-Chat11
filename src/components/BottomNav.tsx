import React from 'react';
import { House, MessageCircleMore, UserRound } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, t, isRtl } = useApp();
  const tabs = [
    { id: 'home' as const, label: t.navHome, Icon: House },
    { id: 'messages' as const, label: t.navMessages, Icon: MessageCircleMore },
    { id: 'profile' as const, label: t.navProfile, Icon: UserRound },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 w-full max-w-md mx-auto bg-white/95 border-t border-amber-200/70 select-none shadow-[0_-5px_22px_rgba(120,83,28,0.09)]" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="pt-2 pb-2 px-3 sm:px-8 flex items-center justify-between gap-2">
        {tabs.map(({ id, label, Icon }) => {
          const selected = activeTab === id;
          return (
            <button key={id} type="button" onClick={() => { sounds.playClick(); setActiveTab(id); }}
              className="flex flex-col items-center justify-center min-w-0 flex-1 gap-1 active:scale-95 transition-transform"
              title={label} aria-current={selected ? 'page' : undefined}>
              <span className={`w-11 h-10 flex items-center justify-center rounded-2xl border transition-colors ${selected ? 'bg-gradient-to-br from-amber-100 via-yellow-50 to-emerald-50 border-amber-300 text-emerald-700 shadow-[0_2px_8px_rgba(183,139,55,0.16)]' : 'bg-transparent border-transparent text-slate-500'}`}>
                <Icon size={23} strokeWidth={selected ? 2.2 : 1.9} aria-hidden="true" />
              </span>
              <span className={`text-[11px] font-bold leading-4 ${selected ? 'text-emerald-800' : 'text-slate-500'}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
