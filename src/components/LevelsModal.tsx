import React, { useEffect, useState } from 'react';
import { fetchMyVerifiedRoyalXp, type VerifiedRoyalXp } from '../services/royalXp';
import { RoyalRankings } from './RoyalRankings';
import { royalProgress, ROYAL_CURVE_VERSION } from '../utils/royalLevels';
import { ArrowRight, Crown, Sparkles, Gamepad2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

const levelTabs = [
  { id: 'wealth', label: 'الثروة', Icon: Crown },
  { id: 'charm', label: 'السحر', Icon: Sparkles },
  { id: 'games', label: 'الألعاب', Icon: Gamepad2 },
] as const;

export const LevelsModal: React.FC = () => {
  const { openLevelsModal, setOpenLevelsModal, levelsModalTab, setLevelsModalTab, currentUser } = useApp();
  const [verifiedXp, setVerifiedXp] = useState<VerifiedRoyalXp | null>(null);
  const [xpError, setXpError] = useState<string | null>(null);
  useEffect(() => {
    if (!openLevelsModal) return;
    let active = true;
    setVerifiedXp(null);
    setXpError(null);
    void fetchMyVerifiedRoyalXp().then(data => {
      if (active) setVerifiedXp(data);
    }).catch(() => {
      if (active) setXpError('تعذر تحميل الخبرة الموثقة من الخادم');
    });
    return () => { active = false; };
  }, [openLevelsModal, currentUser.id]);
  if (!openLevelsModal) return null;

  const isWealth = levelsModalTab === 'wealth';
  const isCharm = levelsModalTab === 'charm';
  const experience = isWealth ? verifiedXp?.wealth_lifetime_xp : isCharm ? verifiedXp?.charm_lifetime_xp : null;
  const verifiedProgress = experience !== null && experience !== undefined ? royalProgress(BigInt(experience)) : null;
  const activeTab = levelTabs.find(tab => tab.id === levelsModalTab) ?? levelTabs[0];
  const ActiveIcon = activeTab.Icon;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm" dir="rtl">
      <section className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-b from-[#0b1f17] via-[#102b20] to-[#08140f] text-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2"><ActiveIcon className="h-5 w-5 text-amber-300" /><h2 className="text-base font-black">المستويات</h2></div>
          <button type="button" onClick={() => { sounds.playClick(); setOpenLevelsModal(false); }} className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10" aria-label="رجوع"><ArrowRight className="h-5 w-5" /></button>
        </header>

        <nav className="grid grid-cols-3 gap-2 border-b border-white/10 p-3" aria-label="أنواع المستويات">
          {levelTabs.map(({ id, label, Icon }) => (
            <button key={id} type="button" aria-pressed={levelsModalTab === id} onClick={() => { sounds.playClick(); setLevelsModalTab(id); }} className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-bold transition ${levelsModalTab === id ? 'border-amber-300 bg-amber-300/15 text-amber-100' : 'border-white/10 bg-white/5 text-slate-300'}`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </nav>

        <div className="overflow-y-auto p-4">
          <div className="rounded-2xl border border-emerald-300/20 bg-white/[0.04] p-5 text-center">
            <ActiveIcon className="mx-auto h-10 w-10 text-amber-300" aria-hidden="true" />
            <h3 className="mt-3 text-sm font-black">خبرة الهدايا الموثقة من الخادم</h3>
            <p className="mt-2 text-xs leading-6 text-slate-300">المستوى محسوب من خبرة الهدايا المكتملة وفق جدول الـ200 مستوى. الشارات والإطارات ستظهر بعد تفعيل سجل المكافآت الموثق.</p>
            {verifiedProgress && (
              <div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3" aria-label="تقدم المستوى الموثق">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>المستوى {verifiedProgress.level} / 200</span>
                  <span>{verifiedProgress.progressPercent.toFixed(1)}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/40" role="progressbar" aria-valuenow={verifiedProgress.progressPercent} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full bg-gradient-to-l from-amber-300 to-emerald-400" style={{ width: `${verifiedProgress.progressPercent}%` }} />
                </div>
                <p className="mt-2 text-xs text-amber-100">
                  {verifiedProgress.xpToNextLevel === null ? 'وصلت للحد الأعلى — الخبرة مستمرة للتصنيفات' : `المتبقي للمستوى التالي: ${verifiedProgress.xpToNextLevel.toLocaleString('en-US')} XP`}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">جدول {ROYAL_CURVE_VERSION} · الخبرة من الهدايا المكتملة فقط</p>
              </div>
            )}
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
              <span className="text-slate-300">{isWealth ? 'نقاط خبرة الثروة' : isCharm ? 'نقاط خبرة السحر' : 'خبرة الألعاب'}</span>
              <strong className="mt-1 block font-mono text-lg text-amber-200" dir="ltr">{xpError ?? (experience === null || experience === undefined ? 'جارٍ التحميل / غير متاحة' : BigInt(experience).toLocaleString('en-US'))}</strong>
            </div>
          </div>
          <RoyalRankings />
        </div>
      </section>
    </div>
  );
};
