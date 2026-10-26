import React, { useState } from 'react';
import { X, Plus, ChevronDown, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { GiftItem } from '../types';
import { sounds } from '../utils/audio';

const giftCounts = [1, 10, 66, 99, 520, 1314];

export const GiftStoreModal: React.FC = () => {
  const {
    openGiftStore,
    setOpenGiftStore,
    gifts,
    currentUser,
    activeRoom,
    sendGift,
    setOpenRechargeModal,
    selectedGiftReceiver,
    setSelectedGiftReceiver,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('الأمة');
  const [selectedGift, setSelectedGift] = useState<GiftItem>(gifts[0]);
  const [selectedCount, setSelectedCount] = useState<number>(1);
  const [selectedReceiverIndex, setSelectedReceiverIndex] = useState<number>(0);
  const [showCountDropdown, setShowCountDropdown] = useState<boolean>(false);

  if (!openGiftStore) return null;

  // Self support receiver option (allowed only from inside room)
  const selfReceiver = {
    id: currentUser.id,
    name: `${currentUser.nickname || currentUser.name} (دعم حسابي 🌟)`,
    avatar: currentUser.avatar,
    isSelf: true,
  };

  // Receivers list: If inside active room, include room seats/users + self support inside room
  const roomUserReceivers = activeRoom
    ? activeRoom.seats
        .filter((s) => s.user && s.user.id !== currentUser.id)
        .map((s) => ({
          id: s.user!.id,
          name: s.user!.nickname || s.user!.name,
          avatar: s.user!.avatar,
          isSelf: false,
        }))
    : [];

  // When inside active room, include other users plus self-support option
  // Outside room, default to the room host or targeted user without self-support option
  const baseReceivers = activeRoom
    ? [
        ...roomUserReceivers,
        selfReceiver, // available inside room only
      ]
    : [
        {
          id: 'host-1',
          name: 'إبن سوريا (الداعم الملكي)',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          isSelf: false,
        },
      ];

  const receivers = selectedGiftReceiver
    ? [
        {
          ...selectedGiftReceiver,
          isSelf: selectedGiftReceiver.id === currentUser.id,
        },
        ...baseReceivers.filter((r) => r.id !== selectedGiftReceiver.id),
      ]
    : baseReceivers;

  const currentReceiver = receivers[selectedReceiverIndex] || receivers[0] || selfReceiver;
  const isSupportingSelf = Boolean(activeRoom && currentReceiver.id === currentUser.id);

  const filteredGifts = gifts.filter((g) => {
    if (activeCategory === 'الكل') return true;
    return g.category === activeCategory;
  });

  const handleSend = () => {
    sounds.playClick();
    const success = sendGift(selectedGift, currentReceiver, selectedCount);
    if (success) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#ec4899', '#6366f1'],
      });
      setOpenGiftStore(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs font-['Cairo',sans-serif] animate-in fade-in">
      <div className="w-full max-w-md bg-slate-950/95 border-t border-amber-500/30 text-white rounded-t-3xl p-4 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Top Header & Categories (Exact Screenshot 18) */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          {/* Categories Tab */}
          <div className="flex items-center gap-4 text-xs font-bold">
            {['هدية', 'الأمة', 'مخصص', 'حظ', 'CP'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  sounds.playClick();
                  setActiveCategory(cat);
                }}
                className={`relative pb-1.5 transition ${
                  activeCategory === cat
                    ? 'text-amber-400 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
                {activeCategory === cat && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Close */}
          <button
            onClick={() => {
              sounds.playClick();
              setOpenGiftStore(false);
            }}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receiver Select Bar with Self Support Quick Toggle, 1 Coin = 1 EXP & Diamonds Guarantee */}
        {receivers.length > 0 && (
          <div className="py-2 flex flex-col gap-1.5 border-b border-slate-900">
            <div className="flex items-center justify-between text-xs gap-2">
              <span className="text-slate-400 font-medium shrink-0">إرسال الدعم إلى:</span>
              
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {/* Direct Quick Button to Support Self - Inside Room Only */}
                {activeRoom && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      const selfIdx = receivers.findIndex((r) => r.id === currentUser.id);
                      if (selfIdx !== -1) {
                        setSelectedReceiverIndex(selfIdx);
                      }
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                      isSupportingSelf
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'bg-amber-950/50 text-amber-300 border border-amber-500/40 hover:bg-amber-900/60'
                    }`}
                    title="دعم حسابي الشخصي من داخل الروم ورفع المستوى واستلام الألماس"
                  >
                    <span>🌟</span>
                    <span>دعم نفسي</span>
                  </button>
                )}

                {/* Receiver Dropdown */}
                <select
                  value={selectedReceiverIndex}
                  onChange={(e) => setSelectedReceiverIndex(Number(e.target.value))}
                  className="bg-slate-900 border border-amber-500/30 text-amber-300 rounded-lg px-2 py-1 text-xs focus:outline-none max-w-[150px] truncate font-bold"
                >
                  {receivers.map((r, idx) => (
                    <option key={r.id} value={idx}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* EXP and Diamonds Guarantee Notice with Self-Support Highlight */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-sky-950/60 border border-amber-500/30 text-[10px]">
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <span>⭐</span>
                <span>كل 1 كوينز = 1 خبرة صعود مستوى</span>
              </span>
              <span className="text-sky-300 font-bold flex items-center gap-1">
                <span>💎</span>
                <span>
                  {isSupportingSelf
                    ? `تستلم لحسابك ${Math.floor((selectedGift.price * selectedCount) * 0.7).toLocaleString('en-US')} ألماسة`
                    : `المستلم يحصل على ${Math.floor((selectedGift.price * selectedCount) * 0.7).toLocaleString('en-US')} ألماسة`}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Gifts Grid (matching Screenshot 18) */}
        <div className="py-3 flex-1 overflow-y-auto no-scrollbar grid grid-cols-4 gap-2.5">
          {filteredGifts.map((gift) => {
            const isSelected = selectedGift.id === gift.id;

            return (
              <div
                key={gift.id}
                onClick={() => {
                  sounds.playClick();
                  setSelectedGift(gift);
                }}
                className={`relative rounded-2xl p-2 flex flex-col items-center justify-between cursor-pointer border transition-all ${
                  isSelected
                    ? 'border-amber-400 bg-gradient-to-b from-amber-500/20 to-slate-900 shadow-lg scale-102'
                    : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                {/* Selected Checkmark */}
                {isSelected && (
                  <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}

                {/* Gift Large Animated Icon */}
                <div className="w-12 h-12 flex items-center justify-center text-3xl my-1 drop-shadow-md">
                  {gift.icon}
                </div>

                {/* Name */}
                <span className="text-[11px] font-bold text-slate-200 text-center truncate w-full">
                  {gift.name}
                </span>

                {/* Price in Coins */}
                <div className="flex items-center gap-1 text-[11px] font-black text-amber-400 mt-1">
                  <span>🪙</span>
                  <span>{gift.price.toLocaleString('ar-EG')}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Bar: Coins Balance + Recharging + Count Selector + Send Button */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
          {/* User Balance & Recharge Button */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-full"
              title={currentUser.coins.toLocaleString('en-US')}
            >
              <span>🪙</span>
              <span>
                {currentUser.coins >= 1000000000
                  ? `${(currentUser.coins / 1000000000).toFixed(0)}B`
                  : currentUser.coins.toLocaleString('en-US')}
              </span>
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                setOpenRechargeModal(true);
              }}
              className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-0.5 bg-amber-500/20 px-2 py-1 rounded-full border border-amber-400/40"
            >
              <Plus className="w-3 h-3" />
              <span>شحن</span>
            </button>
          </div>

          {/* Right Controls: Count Selector & Royal Send Button */}
          <div className="flex items-center gap-2 relative">
            {/* Multiplier / Count button */}
            <div className="relative">
              <button
                onClick={() => setShowCountDropdown(!showCountDropdown)}
                className="flex items-center gap-1 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-full text-xs font-bold text-white hover:border-amber-400"
              >
                <span>x{selectedCount}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showCountDropdown && (
                <div className="absolute bottom-10 left-0 bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-xl z-20 flex flex-col gap-1 w-20">
                  {giftCounts.map((count) => (
                    <button
                      key={count}
                      onClick={() => {
                        sounds.playClick();
                        setSelectedCount(count);
                        setShowCountDropdown(false);
                      }}
                      className="px-2 py-1 text-xs text-center font-bold hover:bg-amber-500/20 hover:text-amber-400 rounded"
                    >
                      x{count}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Royal Send Button */}
            <button
              onClick={handleSend}
              className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 font-black text-xs px-5 py-2 rounded-full shadow-lg active:scale-95 hover:brightness-110 transition flex items-center gap-1"
            >
              <span>{isSupportingSelf ? 'دعم حسابي 🌟' : 'إرسال'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
