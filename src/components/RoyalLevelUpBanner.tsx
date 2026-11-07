import React, { useId } from 'react';

/** Display-only level milestone banner. Parent must supply verified level change. */
export const RoyalLevelUpBanner: React.FC<{
  level: number;
  category: 'wealth' | 'charm' | 'games' | 'room';
  name?: string;
  preview?: boolean;
}> = ({ level, category, name, preview = false }) => {
  const uid = useId().replace(/:/g, '');
  const metal = `level-metal-${uid}`;
  const title = category === 'wealth' ? 'مستوى الثروة' : category === 'charm' ? 'مستوى الجاذبية' : category === 'room' ? 'مستوى الغرفة' : 'مستوى الألعاب';
  return (
    <div dir="rtl" role={preview ? undefined : 'status'} aria-live={preview ? undefined : 'polite'} className="relative isolate w-full max-w-sm overflow-hidden rounded-2xl border border-amber-300/80 bg-gradient-to-l from-[#04382d] via-[#0a6d50] to-[#032d25] px-3 py-3 text-amber-50 shadow-[0_8px_30px_rgba(0,0,0,.3)]">
      <div className="absolute -left-7 -top-7 h-20 w-20 rounded-full border-4 border-amber-300/20" aria-hidden="true" />
      <div className="relative flex items-center gap-3">
        <svg aria-hidden="true" viewBox="0 0 64 64" className="h-14 w-14 shrink-0">
          <defs><linearGradient id={metal} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fffbd1"/><stop offset=".52" stopColor="#e9ba53"/><stop offset="1" stopColor="#8b581a"/></linearGradient></defs>
          <path d="M32 3 L39 11 L51 9 L53 21 L61 32 L53 43 L51 55 L39 53 L32 61 L25 53 L13 55 L11 43 L3 32 L11 21 L13 9 L25 11 Z" fill={`url(#${metal})`} stroke="#fff0a6" strokeWidth="2"/>
          <circle cx="32" cy="32" r="19" fill="#086c50" stroke="#fff2a9" strokeWidth="1.5"/>
          <text x="32" y="38" textAnchor="middle" fontSize={level >= 100 ? 17 : 22} fontWeight="900" fill="#fff5c1">{level}</text>
        </svg>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-black text-amber-200">{preview ? 'معاينة شارة الترقية' : 'تهانينا بالترقية!'}</div>
          <div className="mt-1 truncate text-sm font-black">{name ? name + ' · ' : ''}{title}</div>
          <div className="mt-0.5 text-xs text-amber-100">وصل إلى المستوى {level}</div>
        </div>
        <span aria-hidden="true" className="text-xl text-amber-200">✦</span>
      </div>
    </div>
  );
};
