import React, { useState } from 'react';
import {
  ChevronRight,
  ShoppingBag,
  Sparkles,
  Check,
  Crown,
  Volume2,
  Coins,
  ShieldCheck,
  Star,
  Zap,
  Car,
  MessageSquare,
  Compass,
  Store,
  Layers,
  Award,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';
import {
  storeFrames,
  storeMounts,
  storeBubbles,
  storeEntrances,
  StorageItem,
  BagItem,
} from '../data/storageItems';
import { StorageItemVisual } from './StorageItemVisual';

export const StorageModal: React.FC = () => {
  const {
    openStorageModal,
    setOpenStorageModal,
    storageTab,
    setStorageTab,
    bagItems,
    equippedFrame,
    equippedBubble,
    equippedEntrance,
    equippedMount,
    equipBagItem,
    unequipBagItem,
    buyStoreItem,
    currentUser,
    setOpenRechargeModal,
    setOpenVipModal,
  } = useApp();

  // Sub-tabs in "تخزين" (Store)
  const [storeCategory, setStoreCategory] = useState<'frames' | 'mounts' | 'bubbles' | 'entrances'>('frames');

  // Sub-tabs in "حقيبة" (Bag / Acquired Items) as requested: VIP, إطار, فقاعة, تأثير الدخول, المركبة
  const [bagCategory, setBagCategory] = useState<'vip' | 'frames' | 'bubbles' | 'entrances' | 'mounts'>('vip');

  // Selected item for purchase in store
  const [selectedStoreItem, setSelectedStoreItem] = useState<StorageItem | null>(null);

  // Preview item popup
  const [previewItem, setPreviewItem] = useState<StorageItem | BagItem | null>(null);

  // Purchase confirmation & toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!openStorageModal) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Get current store list
  const currentStoreList = {
    frames: storeFrames,
    mounts: storeMounts,
    bubbles: storeBubbles,
    entrances: storeEntrances,
  }[storeCategory];

  // Get current bag list
  const currentBagList = bagItems.filter((i) => i.category === bagCategory);

  // Handle Buy Action
  const handleBuy = (item: StorageItem) => {
    if (currentUser.coins < item.price) {
      sounds.playClick();
      showToast('رصيد العملات غير كافٍ! يرجى شحن الرصيد');
      return;
    }

    const success = buyStoreItem(item);
    if (success) {
      showToast(`تم شراء وتجهيز ${item.name} بنجاح!`);
      setSelectedStoreItem(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md font-['Cairo',sans-serif] select-none p-0 sm:p-3 animate-in fade-in">
      <div className="w-full max-w-md h-full sm:h-[90vh] bg-gradient-to-b from-[#081810] via-[#091C13] to-[#050F0A] text-white sm:rounded-3xl shadow-2xl border border-emerald-900/50 flex flex-col overflow-hidden relative">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="absolute top-16 left-4 right-4 z-50 py-2.5 px-4 bg-emerald-600/95 text-white text-xs font-bold rounded-2xl shadow-xl border border-emerald-400/50 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Sparkles className="w-4 h-4 text-yellow-300 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* =========================================================================
            TOP HEADER BAR (تخزين مع التبويب الداخلي: المتجر / الحقيبة)
            ========================================================================= */}
        <div className="relative z-10 px-4 pt-3.5 pb-2 flex items-center justify-between border-b border-emerald-900/30">
          {/* Top-Left: Internal Segments for (المتجر / الحقيبة) inside تخزين */}
          <div className="flex items-center bg-emerald-950/90 border border-emerald-500/40 rounded-full p-0.5 shadow-sm">
            <button
              onClick={() => {
                sounds.playClick();
                setStorageTab('store');
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                storageTab === 'store'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs'
                  : 'text-emerald-300 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>المتجر</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setStorageTab('bag');
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                storageTab === 'bag'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs'
                  : 'text-emerald-300 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>الحقيبة</span>
            </button>
          </div>

          {/* Center Title: تخزين */}
          <h2 className="text-lg font-black tracking-wide text-white drop-shadow-sm flex items-center gap-1.5">
            <span>تخزين</span>
          </h2>

          {/* Top-Right: Chevron Back Button */}
          <button
            onClick={() => {
              sounds.playClick();
              setOpenStorageModal(false);
            }}
            className="w-8 h-8 rounded-full bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-800/40 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-95"
            title="رجوع"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* =========================================================================
            CATEGORY NAVIGATION BAR
            ========================================================================= */}
        {storageTab === 'store' ? (
          /* Store Tabs: غطاء الرأس | المركبة | فقاعة | مؤثر الدخول */
          <div className="relative z-10 grid grid-cols-4 px-2 pt-2 border-b border-emerald-900/30 text-center text-xs font-bold">
            {(
              [
                { id: 'frames', label: 'غطاء الرأس' },
                { id: 'mounts', label: 'المركبة' },
                { id: 'bubbles', label: 'فقاعة' },
                { id: 'entrances', label: 'مؤثر الدخول' },
              ] as const
            ).map((tab) => {
              const active = storeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    sounds.playClick();
                    setStoreCategory(tab.id);
                    setSelectedStoreItem(null);
                  }}
                  className={`py-2 transition-all flex flex-col items-center gap-1.5 ${
                    active ? 'text-white font-black' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  {active && (
                    <div className="w-8 h-0.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* Bag Tabs as ordered by user: VIP | إطار | فقاعة | تأثير الدخول | المركبة */
          <div className="relative z-10 grid grid-cols-5 px-1 pt-2 border-b border-emerald-900/30 text-center text-[11px] sm:text-xs font-bold">
            {(
              [
                { id: 'vip', label: 'VIP' },
                { id: 'frames', label: 'إطار' },
                { id: 'bubbles', label: 'فقاعة' },
                { id: 'entrances', label: 'تأثير الدخول' },
                { id: 'mounts', label: 'المركبة' },
              ] as const
            ).map((tab) => {
              const active = bagCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    sounds.playClick();
                    setBagCategory(tab.id);
                  }}
                  className={`py-2 transition-all flex flex-col items-center gap-1.5 ${
                    active ? 'text-white font-black' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{tab.label}</span>
                  {active && (
                    <div className="w-6 h-0.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* =========================================================================
            MAIN CONTENT AREA
            ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-3 no-scrollbar space-y-3">
          {storageTab === 'store' ? (
            /* -------------------------------------------------------------
               STORE GRID (3 COLUMNS) - Exact Match to Screenshots 1, 2, 3
               ------------------------------------------------------------- */
            <div className="grid grid-cols-3 gap-2.5">
              {currentStoreList.map((item) => {
                const isSelected = selectedStoreItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedStoreItem(item);
                    }}
                    className={`rounded-2xl p-2.5 flex flex-col items-center text-center cursor-pointer transition relative group border ${
                      isSelected
                        ? 'bg-[#102C20] border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'bg-[#0E241A] border-[#163828] hover:border-emerald-500/50'
                    }`}
                  >
                    {/* Item Visual Art with Center Play Icon */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playCoin();
                        setPreviewItem(item);
                      }}
                      className="w-18 h-18 sm:w-20 sm:h-20 mb-1.5 relative cursor-pointer"
                    >
                      <StorageItemVisual iconType={item.iconType} colorScheme={item.colorScheme} />
                    </div>

                    {/* Arabic Item Title */}
                    <h4 className="text-xs font-bold text-white text-center leading-tight line-clamp-1 mb-1">
                      {item.name}
                    </h4>

                    {/* Price and Duration (e.g. 49999/7أيام 🪙) */}
                    <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-amber-300 font-bold">
                      <span className="text-[10px] text-amber-200/90">
                        {item.price.toLocaleString('en-US')}/{item.duration}
                      </span>
                      {/* Gold Coin Icon */}
                      <span className="text-xs">🪙</span>
                    </div>

                    {/* Selected Indicator Checkmark */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* -------------------------------------------------------------
               BAG CONTENT (VIP + Owned Categories)
               ------------------------------------------------------------- */
            <div>
              {bagCategory === 'vip' ? (
                /* VIP Tab Content */
                <div className="space-y-3 animate-in fade-in">
                  {/* VIP 7 Royal Gold Banner Card */}
                  <div
                    onClick={() => {
                      sounds.playClick();
                      setOpenVipModal(true);
                    }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FCE19C] via-[#FCE9B8] to-[#FCE096] border border-[#F5CF75] p-4 shadow-lg cursor-pointer active:scale-98 transition flex items-center justify-between"
                  >
                    {/* Left: Royal Ruby Phoenix Crest */}
                    <div className="w-12 h-12 flex items-center justify-center shrink-0">
                      <Crown className="w-10 h-10 text-[#9C6118] drop-shadow-xs" />
                    </div>

                    {/* Right: VIP Info */}
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-xs font-black px-2 py-0.5 rounded-full bg-[#9C6118] text-white">
                          نشط حالياً
                        </span>
                        <h3 className="text-2xl font-black text-[#9C6118] font-serif">VIP 7</h3>
                      </div>
                      <p className="text-xs text-[#865922] font-bold mt-1">
                        سوف تنتهي في {currentUser.vipExpiry || '04/01/2026'}
                      </p>
                    </div>
                  </div>

                  {/* VIP Privileges List */}
                  <div className="bg-[#0E241A] rounded-2xl border border-emerald-900/50 p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2.5">
                      <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-400" />
                        <span>امتيازات ومميزات VIP 7 المفعلة</span>
                      </h4>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-800/40">
                        7 مزايا نشطة
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-right">
                      {[
                        { title: 'شارة VIP 7 الحصرية', desc: 'شارة ذهبية متوهجة على الاسم', icon: '👑' },
                        { title: 'أولوية صعود المايك', desc: 'حجز المقاعد الأولية بالرومات', icon: '🎤' },
                        { title: 'حصانة ضد الكتم والطرد', desc: 'حماية كاملة من المشرفين', icon: '🛡️' },
                        { title: 'دخولية موكب VIP مجانية', desc: 'مؤثرات دخول ملكية مجاناً', icon: '🏎️' },
                        { title: 'فقاعة وإطار VIP الملكي', desc: 'مقتنيات حصرية لأصحاب الرتب', icon: '💬' },
                        { title: 'خصم 15% على الهدايا', desc: 'توفير عملات عند إرسال الهدايا', icon: '🎁' },
                      ].map((perk, i) => (
                        <div
                          key={i}
                          className="bg-[#091A12] border border-[#163828] rounded-xl p-2.5 flex items-start gap-2"
                        >
                          <span className="text-xl shrink-0">{perk.icon}</span>
                          <div>
                            <p className="text-xs font-bold text-white leading-tight">{perk.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{perk.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        sounds.playClick();
                        setOpenVipModal(true);
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-amber-950 font-black text-xs rounded-xl shadow-md active:scale-98 transition flex items-center justify-center gap-2"
                    >
                      <Crown className="w-4 h-4" />
                      <span>ترقية أو تمديد اشتراك VIP</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Owned Items for Selected Bag Category */
                <div className="space-y-2.5">
                  {currentBagList.length === 0 ? (
                    <div className="py-12 px-4 text-center space-y-3 bg-[#0E241A] rounded-2xl border border-emerald-900/40">
                      <div className="w-14 h-14 rounded-full bg-emerald-950/70 border border-emerald-800/40 flex items-center justify-center mx-auto text-emerald-400">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-300">
                        لا توجد عناصر في هذا القسم من حقيبتك
                      </p>
                      <p className="text-xs text-slate-400">
                        يمكنك زيارة التخزين لاقتناء أرقى الإطارات والمؤثرات
                      </p>
                      <button
                        onClick={() => {
                          sounds.playClick();
                          setStorageTab('store');
                          setStoreCategory(bagCategory as any);
                        }}
                        className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs transition"
                      >
                        تصفح التخزين الآن
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5">
                      {currentBagList.map((item) => {
                        const isEquipped = item.isEquipped;
                        return (
                          <div
                            key={item.id}
                            className={`p-3 rounded-2xl bg-[#0E241A] border flex flex-col items-center text-center transition ${
                              isEquipped
                                ? 'border-emerald-400/80 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                                : 'border-[#163828] hover:border-slate-700'
                            }`}
                          >
                            {/* Visual Artwork */}
                            <div
                              onClick={() => {
                                sounds.playCoin();
                                setPreviewItem(item);
                              }}
                              className="w-16 h-16 mb-1.5 cursor-pointer relative"
                            >
                              <StorageItemVisual iconType={item.iconType} colorScheme={item.colorScheme} />
                            </div>

                            {/* Name */}
                            <h4 className="text-xs font-bold text-white line-clamp-1">{item.name}</h4>

                            {/* Expiry Badge */}
                            <span className="text-[10px] text-amber-300 font-mono mt-0.5">
                              {item.expiry}
                            </span>

                            {/* Equip / Unequip Action Buttons */}
                            <div className="mt-2.5 w-full">
                              {isEquipped ? (
                                <div className="flex items-center gap-1.5 justify-center">
                                  <span className="flex-1 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold flex items-center justify-center gap-1">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>مستخدم</span>
                                  </span>
                                  <button
                                    onClick={() => {
                                      unequipBagItem(item);
                                      showToast(`تم إلغاء تجهيز ${item.name}`);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    equipBagItem(item);
                                    showToast(`تم تجهيز ${item.name} بنجاح!`);
                                  }}
                                  className="w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs active:scale-95 transition"
                                >
                                  تجهيز
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* =========================================================================
            BOTTOM ACTION BAR (Exact Match to Screenshot 1, 2, 3)
            ========================================================================= */}
        {storageTab === 'store' && (
          <div className="relative z-10 px-4 py-3 bg-[#06140D] border-t border-emerald-900/40 flex items-center justify-between">
            {/* Left: Green Buy Pill Button "شراء" */}
            <button
              onClick={() => {
                if (selectedStoreItem) {
                  handleBuy(selectedStoreItem);
                } else {
                  sounds.playClick();
                  showToast('الرجاء اختيار عنصر من المتجر أولاً للشراء');
                }
              }}
              className="px-8 py-2 rounded-full bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black text-sm shadow-md active:scale-95 transition"
            >
              شراء
            </button>

            {/* Right: Coins Balance Pill (e.g. < 85,400 🪙) */}
            <button
              onClick={() => {
                sounds.playClick();
                setOpenRechargeModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-800/40 hover:border-amber-400/50 active:scale-95 transition group"
            >
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-180 group-hover:text-amber-300" />
              <span className="text-xs font-mono font-black text-amber-300">
                {currentUser.coins.toLocaleString('en-US')}
              </span>
              <span className="text-sm">🪙</span>
            </button>
          </div>
        )}

        {/* =========================================================================
            ITEM PREVIEW MODAL POPUP (When Clicking Play ▶ on an item)
            ========================================================================= */}
        {previewItem && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-xs bg-gradient-to-b from-[#0B2317] to-[#07160F] border border-emerald-500/50 rounded-3xl p-5 text-center shadow-2xl relative">
              {/* Close preview */}
              <button
                onClick={() => setPreviewItem(null)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-emerald-950 border border-emerald-800/60 text-slate-300 flex items-center justify-center hover:text-white"
              >
                ✕
              </button>

              {/* Big animated visual */}
              <div className="w-28 h-28 mx-auto my-3 relative">
                <StorageItemVisual
                  iconType={previewItem.iconType}
                  colorScheme={previewItem.colorScheme}
                  className="w-28 h-28"
                />
              </div>

              <h3 className="text-base font-black text-white">{previewItem.name}</h3>

              {'description' in previewItem && (
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed px-2">
                  {previewItem.description}
                </p>
              )}

              {'price' in previewItem ? (
                <div className="mt-4 pt-3 border-t border-emerald-900/40 space-y-2.5">
                  <div className="flex items-center justify-center gap-1.5 text-sm font-black text-amber-300 font-mono">
                    <span>{previewItem.price.toLocaleString('en-US')} عملة</span>
                    <span>🪙</span>
                    <span className="text-xs text-slate-400 font-normal">/ {previewItem.duration}</span>
                  </div>

                  <button
                    onClick={() => {
                      handleBuy(previewItem as StorageItem);
                      setPreviewItem(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black text-xs shadow-md active:scale-95 transition"
                  >
                    تأكيد الشراء الفوري
                  </button>
                </div>
              ) : (
                <div className="mt-4 pt-3 border-t border-emerald-900/40">
                  <button
                    onClick={() => {
                      equipBagItem(previewItem as BagItem);
                      showToast(`تم تجهيز ${previewItem.name} بنجاح!`);
                      setPreviewItem(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black text-xs shadow-md active:scale-95 transition"
                  >
                    تجهيز هذا المظهر الآن
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
