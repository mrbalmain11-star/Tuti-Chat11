import React from 'react';
import { BannerSlider } from '../components/BannerSlider';
import { CategoryCards } from '../components/CategoryCards';
import { CountryFilter } from '../components/CountryFilter';
import { RoomCard } from '../components/RoomCard';
import { RoyalRoomsView } from '../components/RoyalRoomsView';
import { DiscoverRoomsView } from '../components/DiscoverRoomsView';
import { useApp } from '../context/AppContext';

export const HomeView: React.FC = () => {
  const { rooms, selectedCountry, homeSubTab, isRtl } = useApp();

  // 1. Royal Sub-Tab: ملكي (غرفتي والغرف الذي أتابعها)
  if (homeSubTab === 'royal') {
    return <RoyalRoomsView />;
  }

  // 2. Discover Sub-Tab: اكتشف
  if (homeSubTab === 'discover') {
    return <DiscoverRoomsView />;
  }

  // 3. Default Party Sub-Tab: حفلة (Filtered by country)
  const filteredRooms = rooms.filter((r) => {
    if (selectedCountry === 'الكل' || selectedCountry === 'شائع 🔥') return true;
    return r.country === selectedCountry || r.countryFlag === selectedCountry;
  });

  return (
    <div className="pb-24 space-y-1 font-['Cairo',sans-serif] bg-gradient-to-b from-[#FDFBF7] via-[#FAF6ED] to-[#F5EFE0] min-h-screen text-slate-800 select-none" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. Hero Event Banner: DANA نشاط فتاح الوكالات (Screenshot 1:1) */}
      <BannerSlider />

      {/* 2. Top 3 Islamic Ranking Cards: غرفة | الجاذبية | ثروة (Screenshot 1:1) */}
      <CategoryCards />

      {/* 3. Country & Category Filter Chips: شائع 🔥 | العراق 🇮🇶 | المملكة العربية السعودية 🇸🇦 | ▼ */}
      <CountryFilter />

      {/* 4. Rooms 2x2 Grid (NOOR, حكاية قدر, OMAN, داعمين العراق) */}
      <div className="px-4 pt-1 pb-6">
        <div className="grid grid-cols-2 gap-3.5">
          {filteredRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </div>
    </div>
  );
};
