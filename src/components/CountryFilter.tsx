import React from 'react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

export const CountryFilter: React.FC = () => {
  const { selectedCountry, setSelectedCountry, isRtl, rooms } = useApp();

  const countryNames = Array.from(new Set(rooms.map(r => r.country).filter((country): country is string => Boolean(country))));
  const filterChips = [
    { id: 'شائع 🔥', label: isRtl ? 'شائع' : 'Popular', icon: '🔥' },
    ...countryNames.map(country => ({ id: country, label: country, flag: rooms.find(r => r.country === country)?.countryFlag || '' })),
  ];

  return (
    <div className="px-4 py-2 flex items-center justify-between gap-2 select-none overflow-x-auto no-scrollbar" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Country Chips (Matches Screenshot 1:1) */}
      <div className="flex items-center gap-2">
        {filterChips.map((chip) => {
          const isSelected = selectedCountry === chip.id;

          return (
            <button
              key={chip.id}
              onClick={() => {
                sounds.playClick();
                setSelectedCountry(chip.id);
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                isSelected
                  ? 'bg-[#10b981] text-white border border-[#059669] shadow-[0_2px_8px_rgba(16,185,129,0.4)]'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs'
              }`}
            >
              <span>{chip.label}</span>
              {chip.flag && <span className="text-sm leading-none">{chip.flag}</span>}
              {chip.icon && <span>{chip.icon}</span>}
            </button>
          );
        })}
      </div>


    </div>
  );
};
