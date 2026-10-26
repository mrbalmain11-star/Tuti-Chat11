import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Globe,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

interface LanguageItem {
  code: 'ar' | 'en';
  nativeName: string;
  subName: string;
  flag: string;
}

export const LanguageModal: React.FC = () => {
  const { openLanguageModal, setOpenLanguageModal, language, setLanguage, t, isRtl } = useApp();
  const [selectedLang, setSelectedLang] = useState<'ar' | 'en'>(language);
  const [isAutoSystem, setIsAutoSystem] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (openLanguageModal) {
      setSelectedLang(language);
    }
  }, [openLanguageModal, language]);

  // فقط عربي و انجليزي
  const languagesList: LanguageItem[] = [
    {
      code: 'ar',
      nativeName: 'العربية',
      subName: 'Arabic',
      flag: '🇮🇶 / 🇸🇦',
    },
    {
      code: 'en',
      nativeName: 'English',
      subName: 'الإنجليزية',
      flag: '🇺🇸 / 🇬🇧',
    },
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSelect = (code: 'ar' | 'en') => {
    sounds.playClick();
    setSelectedLang(code);
    setIsAutoSystem(false);
    setLanguage(code);
    showToast(code === 'ar' ? 'تم تحويل التطبيق بالكامل إلى العربية 🇸🇦' : 'App switched to English completely 🇺🇸');
  };

  const handleToggleAuto = () => {
    sounds.playClick();
    setIsAutoSystem((prev) => {
      const next = !prev;
      if (next) {
        setSelectedLang('ar');
        setLanguage('ar');
        showToast(isRtl ? 'تم تفعيل التحديد التلقائي للغة النظام 📱' : 'Auto system language enabled 📱');
      }
      return next;
    });
  };

  const handleSave = () => {
    sounds.playClick();
    setLanguage(selectedLang);
    showToast(selectedLang === 'ar' ? 'تم حفظ اللغة: العربية ✅' : 'Language saved: English ✅');
    setTimeout(() => {
      setOpenLanguageModal(false);
    }, 350);
  };

  if (!openLanguageModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center font-['Cairo',sans-serif] p-4 animate-in fade-in select-none overflow-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-sm bg-[#f8f9fb] text-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border border-slate-200/80">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white px-4 py-3.5 flex items-center justify-between border-b border-slate-200/70 shadow-2xs">
          {/* Back Button */}
          <button
            onClick={() => {
              sounds.playClick();
              setOpenLanguageModal(false);
            }}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition active:scale-90 cursor-pointer"
            title={t.back}
          >
            {isRtl ? (
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>

          {/* Centered Title */}
          <div className="flex items-center gap-1.5">
            <Globe className="w-4.5 h-4.5 text-emerald-600" />
            <h1 className="text-base font-black text-slate-900">{t.languageSettings}</h1>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="px-3.5 py-1.5 rounded-full bg-[#2bd980] hover:bg-emerald-500 text-white text-xs font-black shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>{t.save}</span>
          </button>
        </header>

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-slate-900/90 text-white text-xs font-bold shadow-lg backdrop-blur-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 whitespace-nowrap">
            <CheckCircle2 className="w-4 h-4 text-[#2bd980]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 space-y-3.5">
          
          {/* 1. اتباع لغة النظام (Auto System Language) */}
          <div
            onClick={handleToggleAuto}
            className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
              isAutoSystem
                ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                : 'bg-white border-slate-200/80 hover:bg-slate-50/80'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 stroke-[2]" />
              </div>
              <div className={isRtl ? 'text-right' : 'text-left'}>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-slate-800">
                    {t.autoSystemLang}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                    {t.recommended}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {t.autoSystemDesc}
                </p>
              </div>
            </div>

            {/* Radio / Check indicator */}
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center transition border ${
                isAutoSystem
                  ? 'bg-[#2bd980] border-[#2bd980] text-white shadow-2xs'
                  : 'border-slate-300 bg-white'
              }`}
            >
              {isAutoSystem && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>

          {/* Section: اللغات (عربي وإنجليزي فقط) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden divide-y divide-slate-100">
            {languagesList.map((lang) => {
              const isSelected = !isAutoSystem && selectedLang === lang.code;
              return (
                <div
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`px-4 py-3.5 flex items-center justify-between cursor-pointer transition ${
                    isSelected
                      ? 'bg-emerald-50/60 text-emerald-950 font-bold'
                      : 'hover:bg-slate-50/80 text-slate-800'
                  }`}
                >
                  {/* Flag & Name */}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl filter drop-shadow-2xs select-none">
                      {lang.flag}
                    </span>
                    <div className={isRtl ? 'text-right' : 'text-left'}>
                      <span className="text-sm font-black text-slate-900 block">
                        {lang.nativeName}
                      </span>
                      <span className="text-xs text-slate-500 font-sans">
                        {lang.subName}
                      </span>
                    </div>
                  </div>

                  {/* Radio Indicator */}
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition border ${
                      isSelected
                        ? 'bg-[#2bd980] border-[#2bd980] text-white shadow-2xs'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Note */}
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 text-[11px] text-amber-900 leading-relaxed font-medium text-center">
            {t.langAppliedNotice}
          </div>
        </div>
      </div>
    </div>
  );
};
