import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

export const BannerSlider: React.FC = () => {
  const [activeDot, setActiveDot] = useState(1);
  const { setOpenAgencyModal } = useApp();

  return (
    <div className="px-4 pt-2 pb-2">
      {/* Hero Banner: DANA نشاط فتاح الوكالات (Matches Screenshot 1:1) */}
      <div
        onClick={() => {
          sounds.playClick();
          setOpenAgencyModal(true);
        }}
        className="relative overflow-hidden rounded-2xl h-40 border border-amber-400/40 shadow-xl cursor-pointer group select-none"
        dir="rtl"
      >
        {/* Banner Graphic Image */}
        <img
          src="/src/assets/images/soulmate_banner_1790537675151.jpg"
          alt="رفقاء الروح الأسبوعية"
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
        />

        {/* Subtle vignette gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

        {/* Carousel Pagination Dots at Bottom-Left (Matches Screenshot 1:1) */}
        <div className="absolute bottom-2.5 left-4 z-10 flex items-center gap-1 bg-black/30 backdrop-blur-xs px-2 py-1 rounded-full">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((idx) => (
            <span
              key={idx}
              className={`rounded-full transition-all ${
                idx === activeDot
                  ? 'w-3 h-1.5 bg-white'
                  : 'w-1.5 h-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
