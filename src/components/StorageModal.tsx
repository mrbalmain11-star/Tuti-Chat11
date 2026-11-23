import React, { useEffect, useState } from 'react';
import { stagingBackend } from '../services/stagingBackend';
import {
  ChevronRight,
  ShoppingBag,
  Sparkles,
  Check,
  Crown,
  Store,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';
import {
  getStorageAsset,
  getStorageCategory,
  storageCategories,
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
    equipBagItem,
    unequipBagItem,
    currentUser,
    setOpenRechargeModal,
    setOpenVipModal,
  } = useApp();

  // Sub-tabs in "تخزين" (Store)
  const [storeCategory, setStoreCategory] = useState<'frames' | 'mounts' | 'bubbles' | 'entrances'>('frames');

  // Sub-tabs in "حقيبة" (Bag / Acquired Items) as requested: VIP, إطار, فقاعة, تأثير الدخول, المركبة
  const [bagCategory, setBagCategory] = useState<'vip' | 'frames' | 'bubbles' | 'entrances' | 'mounts'>('vip');

  // Preview item popup
  const [previewItem, setPreviewItem] = useState<StorageItem | BagItem | null>(null);

  // Purchase confirmation & toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [purchaseBusy, setPurchaseBusy] = useState(false);

  const [storeItems, setStoreItems] = useState<StorageItem[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [catalogRetry, setCatalogRetry] = useState(0);

  useEffect(() => {
    if (!openStorageModal) return;
    let active = true;
    setCatalogStatus('loading');
    setStoreItems([]);
    setPreviewItem(null);

    async function loadCatalog() {
      if (!stagingBackend) {
        setCatalogStatus('error');
        return;
      }
      const { data, error } = await stagingBackend.from('store_catalog')
        .select('id,name,category,price,duration_days,description,preview_url')
        .eq('is_active', true)
        .eq('is_reward', false)
        .eq('currency', 'gold')
        .in('category', ['frames', 'cars', 'mounts', 'bubbles', 'entrances'])
        .order('id');
      if (!active) return;
      if (error) {
        setCatalogStatus('error');
        return;
      }
      setStoreItems((data ?? []).flatMap(row => {
        const category = getStorageCategory(row.category);
        const assetUrl = getStorageAsset(row.id, row.preview_url);
        const price = Number(row.price);
        if (!category || !assetUrl || !Number.isSafeInteger(price) || price <= 0) return [];
        return [{
          id: row.id, name: row.name, category, assetUrl, price,
          durationDays: row.duration_days, description: row.description,
        }];
      }));
      setCatalogStatus('ready');
    }

    void loadCatalog();
    return () => { active = false; };
  }, [openStorageModal, currentUser.id, catalogRetry]);

  if (!openStorageModal) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const currentStoreList = storeItems.filter(item => item.category === storeCategory);

  // Get current bag list
  const currentBagList = bagItems.filter((i) => i.category === bagCategory);

  // Handle Buy Action
  const handleBuy = async (item: StorageItem) => {
    if (purchaseBusy) return;
    if (!stagingBackend) { showToast('الخادم غير متصل، لم يتم الخصم'); return; }
    setPurchaseBusy(true);
    try {
      // Only catalog-backed items may be sold. Prices are verified server-side.
      const { data: catalog, error: catalogError } = await stagingBackend
        .from('store_catalog')
        .select('id,price,currency,is_reward,preview_url,duration_days')
        .eq('id', item.id)
        .eq('is_active', true)
        .maybeSingle();
      if (catalogError) throw catalogError;
      if (!catalog || catalog.is_reward || !getStorageAsset(item.id, catalog.preview_url)) {
        showToast('هذا العنصر غير متاح للشراء على الخادم حالياً');
        return;
      }
      if (catalog.currency !== 'gold') {
        showToast('عملة هذا العنصر غير مدعومة في واجهة الشراء الحالية');
        return;
      }
      if (Number(catalog.price) !== item.price || catalog.duration_days !== item.durationDays) {
        showToast('تغيّرت تفاصيل العنصر. حدّثنا المتجر، اختر العنصر من جديد');
        setCatalogRetry(retry => retry + 1);
        return;
      }
      if (currentUser.coins < Number(catalog.price)) {
        showToast('رصيد العملات غير كافٍ');
        return;
      }
      const { data, error } = await stagingBackend.rpc('phase3_purchase_store', {
        p_item_id: item.id,
        p_request_id: crypto.randomUUID(),
        p_expected_price: Number(catalog.price),
        p_expected_currency: catalog.currency,
      });
      if (error) throw error;
      if (!data || data.status !== 'completed' || data.item_id !== item.id) throw new Error('Purchase not confirmed by server');
      window.dispatchEvent(new Event('totichat:wallet-changed'));
      window.dispatchEvent(new Event('totichat:inventory-changed'));
      sounds.playSuccess();
      showToast('تم الشراء بنجاح وحفظ العنصر في حسابك');
      } catch (error) {
      console.error('Store purchase failed', error);
      showToast('فشل الشراء أو لم يتم تأكيده، راجع رصيدك قبل المحاولة مجدداً');
    } finally {
      setPurchaseBusy(false);
    }
  };

  return (
    <div dir="rtl" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md font-['Cairo',sans-serif] select-none p-0 sm:p-3 animate-in fade-in">
      <div className="w-full max-w-md h-full sm:h-[90vh] bg-gradient-to-b from-[#081810] via-[#091C13] to-[#050F0A] text-white sm:rounded-3xl shadow-2xl border border-emerald-900/50 flex flex-col overflow-hidden relative">
        {toastMessage && (
          <div className="absolute top-16 left-4 right-4 z-50 py-2.5 px-4 bg-emerald-600/95 text-white text-xs font-bold rounded-2xl shadow-xl border border-emerald-400/50 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Sparkles className="w-4 h-4 text-yellow-300 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="relative z-10 px-4 pt-3.5 pb-2 flex items-center justify-between border-b border-emerald-900/30">
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

          <h2 className="text-lg font-black tracking-wide text-white drop-shadow-sm flex items-center gap-1.5">
            <span>الزينة</span>
          </h2>

          <button
            onClick={() => {
              sounds.playClick();
              setOpenStorageModal(false);
            }}
            className="w-8 h-8 rounded-full bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-800/40 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-95"
            title="رجوع"
            aria-label="رجوع"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {storageTab === 'store' ? (
          <div className="relative z-10 grid grid-cols-4 px-2 pt-2 border-b border-emerald-900/30 text-center text-xs font-bold">
            {storageCategories.map((tab) => {
              const active = storeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    sounds.playClick();
                    setStoreCategory(tab.id);
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
          <div className="relative z-10 grid grid-cols-5 px-1 pt-2 border-b border-emerald-900/30 text-center text-[11px] sm:text-xs font-bold">
            {(
              [
                { id: 'vip', label: 'VIP' },
                { id: 'frames', label: 'الإطارات' },
                { id: 'bubbles', label: 'فقاعة' },
                { id: 'entrances', label: 'تأثير الدخول' },
                { id: 'mounts', label: 'المركبات' },
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

        <div className="flex-1 overflow-y-auto p-3 no-scrollbar space-y-3">
          {storageTab === 'store' ? (
            catalogStatus !== 'ready' || currentStoreList.length === 0 ? (
              <div className="rounded-2xl border border-emerald-900/40 bg-[#0E241A] px-4 py-12 text-center">
                <p role="status" className="text-sm font-bold text-slate-300">
                  {catalogStatus === 'loading' ? 'جاري تحميل المتجر…'
                    : catalogStatus === 'error' ? 'تعذر تحميل المتجر'
                    : 'لا توجد عناصر متاحة في هذا القسم حالياً'}
                </p>
                {catalogStatus === 'error' && (
                  <button type="button" onClick={() => setCatalogRetry(retry => retry + 1)}
                    className="mt-3 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-bold text-emerald-950">
                    إعادة المحاولة
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {currentStoreList.map(item => (
                  <button key={item.id} type="button" onClick={() => {
                    sounds.playClick();
                    setPreviewItem(item);
                  }} className="flex min-w-0 flex-col items-center gap-2 rounded-2xl border border-emerald-900 bg-[#0E241A] p-3 text-center hover:border-emerald-400">
                    <div className="aspect-square w-full max-w-28">
                      <StorageItemVisual key={item.assetUrl} url={item.assetUrl} name={item.name} />
                    </div>
                    <span className="text-sm font-bold">{item.name}</span>
                    <span className="text-xs font-bold text-amber-300">
                      {item.price.toLocaleString('ar-IQ')} عملة · {item.durationDays === null ? 'دائم' : item.durationDays + ' يوم'}
                    </span>
                  </button>
                ))}
              </div>
            )
          ) : (
            <div>
              {bagCategory === 'vip' ? (
                <div className="space-y-3 animate-in fade-in">
                  <div className="relative overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-r from-[#FCE19C] via-[#FCE9B8] to-[#FCE096] p-4 shadow-lg">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                        <Crown className="h-10 w-10 text-[#9C6118] drop-shadow-xs" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1 text-right">
                        {currentUser.vipLevel > 0 ? (
                          <>
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              <span className="rounded-full bg-[#9C6118] px-2 py-0.5 text-xs font-black text-white">نشط</span>
                              <h3 className="font-serif text-2xl font-black text-[#9C6118]">VIP {currentUser.vipLevel}</h3>
                            </div>
                            <p className="mt-1 break-words text-xs font-bold text-[#865922]">
                              {currentUser.vipExpiry ? `ينتهي في ${currentUser.vipExpiry}` : 'تاريخ الانتهاء غير متاح'}
                            </p>
                          </>
                        ) : (
                          <>
                            <h3 className="text-lg font-black text-[#9C6118]">لا يوجد اشتراك VIP نشط</h3>
                            <p className="mt-1 text-xs font-bold text-[#865922]">ستظهر تفاصيل الاشتراك بعد تأكيده على الحساب.</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-emerald-900/50 bg-[#0E241A] p-3.5">
                    <div className="flex items-start gap-2 rounded-xl border border-emerald-800/50 bg-[#091A12] p-3 text-right">
                      <Crown className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                      <p className="text-xs leading-5 text-slate-300">مزايا VIP التفصيلية غير معروضة حتى تتوفر قائمة موثقة مرتبطة بمستوى اشتراكك.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { sounds.playClick(); setOpenVipModal(true); }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 py-2.5 text-xs font-black text-amber-950 shadow-md transition active:scale-98 hover:from-amber-400 hover:to-yellow-300"
                    >
                      <Crown className="h-4 w-4" aria-hidden="true" />
                      <span>{currentUser.vipLevel > 0 ? 'عرض خيارات تمديد VIP' : 'عرض اشتراكات VIP'}</span>
                    </button>
                  </div>
                </div>
              ) : (
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
                        تقدر تشوف العناصر المتاحة في المتجر
                      </p>
                      <button
                        onClick={() => {
                          sounds.playClick();
                          setStorageTab('store');
                          setStoreCategory(bagCategory);
                        }}
                        className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs transition"
                      >
                        تصفح المتجر
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
                            {item.assetUrl && (
                              <button type="button" onClick={() => setPreviewItem(item)}
                                aria-label={`معاينة ${item.name}`} className="mb-1.5 h-20 w-20">
                                <StorageItemVisual key={item.assetUrl} url={item.assetUrl} name={item.name} />
                              </button>
                            )}

                            <h4 className="text-xs font-bold text-white line-clamp-1">{item.name}</h4>

                            <span className="text-[10px] text-amber-300 font-mono mt-0.5">
                              {item.expiry}
                            </span>

                            <div className="mt-2.5 w-full">
                              {isEquipped ? (
                                <div className="flex items-center gap-1.5 justify-center">
                                  <span className="flex-1 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold flex items-center justify-center gap-1">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>مستخدم</span>
                                  </span>
                                  <button
                                    onClick={async () => {
                                      const ok = await unequipBagItem(item);
                                      showToast(ok ? `تم إلغاء تجهيز ${item.name}` : 'تعذر إلغاء التجهيز');
                                    }}
                                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={async () => {
                                    const ok = await equipBagItem(item);
                                    showToast(ok ? `تم تجهيز ${item.name}` : 'تعذر تجهيز العنصر');
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

        {storageTab === 'store' && (
          <div className="relative z-10 px-4 py-3 bg-[#06140D] border-t border-emerald-900/40 flex items-center justify-end">
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

        {previewItem && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-xs bg-gradient-to-b from-[#0B2317] to-[#07160F] border border-emerald-500/50 rounded-3xl p-5 text-center shadow-2xl relative">
              <button
                aria-label="إغلاق المعاينة"
                onClick={() => setPreviewItem(null)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-emerald-950 border border-emerald-800/60 text-slate-300 flex items-center justify-center hover:text-white"
              >
                ✕
              </button>

              {previewItem.assetUrl && (
                <div className="mx-auto my-3 h-44 w-full">
                  <StorageItemVisual key={previewItem.assetUrl} url={previewItem.assetUrl} name={previewItem.name} play />
                </div>
              )}

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
                    <span className="text-xs text-slate-400 font-normal">/ {previewItem.durationDays === null ? 'دائم' : previewItem.durationDays + ' يوم'}</span>
                  </div>

                  <button
                    disabled={purchaseBusy}
                    onClick={() => {
                      void handleBuy(previewItem);
                      setPreviewItem(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black text-xs shadow-md active:scale-95 transition"
                  >
                    تأكيد الشراء
                  </button>
                </div>
              ) : !previewItem.isEquipped && (
                <div className="mt-4 pt-3 border-t border-emerald-900/40">
                  <button
                    onClick={async () => {
                      const ok = await equipBagItem(previewItem);
                      showToast(ok ? `تم تجهيز ${previewItem.name}` : 'تعذر تجهيز العنصر');
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
