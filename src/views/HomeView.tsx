import React from 'react';
import { BannerSlider } from '../components/BannerSlider';
import { Gift } from 'lucide-react';
import { CategoryCards } from '../components/CategoryCards';
import { CountryFilter } from '../components/CountryFilter';
import { RoomCard } from '../components/RoomCard';
import { RoyalRoomsView } from '../components/RoyalRoomsView';
import { DiscoverRoomsView } from '../components/DiscoverRoomsView';
import { filterRoomsByCountry } from '../data/roomCountries';
import { useApp } from '../context/AppContext';

export const HomeView: React.FC = () => {
  const { rooms, selectedCountry, homeSubTab, isRtl, homeRoomsStatus, refreshHomeRooms } = useApp();
  // 1. Royal Sub-Tab: ملكي (غرفتي والغرف الذي أتابعها)
  if (homeSubTab === 'royal') {
    return <RoyalRoomsView />;
  }

  // 2. Discover Sub-Tab: اكتشف
  if (homeSubTab === 'discover') {
    return <DiscoverRoomsView />;
  }

  // 3. Default Party Sub-Tab: حفلة (Filtered by country)
  const filteredRooms = filterRoomsByCountry(rooms, selectedCountry);


  return (
    <div className="pb-24 space-y-1 font-['Cairo',sans-serif] bg-gradient-to-b from-[#FDFBF7] via-[#FAF6ED] to-[#F5EFE0] min-h-screen text-slate-800 select-none" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. Hero Event Banner: DANA نشاط فتاح الوكالات (Screenshot 1:1) */}
      <BannerSlider />
      <div className="px-4 pt-2">
        <button type="button" onClick={() => window.dispatchEvent(new Event('totichat:open-rewards'))} className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-gradient-to-r from-emerald-900 to-emerald-700 px-4 py-3 text-sm font-bold text-amber-100 shadow-sm" aria-label="فتح المكافآت اليومية">
          <Gift size={19} aria-hidden="true" /> المكافآت اليومية
        </button>
      </div>

      {/* 2. Top 3 Islamic Ranking Cards: غرفة | الجاذبية | ثروة (Screenshot 1:1) */}
      <CategoryCards />

      {/* 3. Country & Category Filter Chips: شائع 🔥 | العراق 🇮🇶 | المملكة العربية السعودية 🇸🇦 | ▼ */}
      <CountryFilter />

      {/* 4. Rooms 2x2 Grid (NOOR, حكاية قدر, OMAN, داعمين العراق) */}
      <div className="px-4 pt-1 pb-6">
        {homeRoomsStatus === 'loading' ? <p role="status" className="py-5 text-center text-sm">جارٍ تحميل الغرف…</p>
          : homeRoomsStatus === 'error' ? <p role="alert" className="py-5 text-center text-sm text-red-800">
            تعذر تحميل الغرف. <button type="button" className="underline" onClick={refreshHomeRooms}>إعادة المحاولة</button>
          </p> : !filteredRooms.length ? <p className="py-5 text-center text-sm">
            {selectedCountry === 'all' ? 'لا توجد غرف متاحة حالياً' : 'لا توجد غرف متاحة في هذه الدولة حالياً'}
          </p> : <div className="grid grid-cols-2 gap-3.5">
            {filteredRooms.map(room => <RoomCard key={room.id} room={room} />)}
          </div>}
      </div>
    </div>
  );
};
