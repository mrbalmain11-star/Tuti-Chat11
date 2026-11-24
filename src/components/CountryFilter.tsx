import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { roomCountries } from '../data/roomCountries';
import { sounds } from '../utils/audio';

export function CountryFilter() {
  const { selectedCountry, setSelectedCountry, isRtl } = useApp();
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const listId = useId();
  const popular = { code: 'all', name: 'شائع', english: 'Popular', flag: '🔥' };
  const quick = [popular, ...roomCountries.filter(country => ['IQ', 'SA', selectedCountry].includes(country.code))];

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !wrapper.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    document.getElementById(listId)?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open, listId]);

  useEffect(() => {
    const viewport = scroll.current;
    const selected = viewport?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
    if (!viewport || !selected) return;
    const outer = viewport.getBoundingClientRect();
    const inner = selected.getBoundingClientRect();
    if (inner.left < outer.left) viewport.scrollLeft += inner.left - outer.left;
    else if (inner.right > outer.right) viewport.scrollLeft += inner.right - outer.right;
  }, [selectedCountry]);

  const select = (code: string) => {
    sounds.playClick();
    setSelectedCountry(code);
    if (open) toggle.current?.focus();
    setOpen(false);
  };

  return <div ref={wrapper} className="relative z-10 flex min-w-0 items-center gap-2 px-4 py-2" dir="ltr">
    <div ref={scroll} className="min-w-0 flex-1 overflow-x-auto no-scrollbar" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex w-max min-w-full items-center gap-2 py-1">
        {quick.map(country => {
          const selected = selectedCountry === country.code;
          return <button type="button" key={country.code} onClick={() => select(country.code)} aria-pressed={selected}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition active:scale-95 ${selected
              ? 'border-[#059669] bg-[#10b981] text-white shadow-[0_2px_8px_rgba(16,185,129,0.4)]'
              : 'border-slate-200/90 bg-white text-slate-700 shadow-xs'}`}>
            <span>{isRtl ? country.name : country.english}</span>
            <span aria-hidden="true" className="text-sm leading-none">{country.flag}</span>
          </button>;
        })}
      </div>
    </div>
    <button ref={toggle} type="button" aria-label={isRtl ? 'عرض قائمة الدول' : 'Show countries'} aria-expanded={open}
      aria-controls={open ? listId : undefined} onClick={() => { sounds.playClick(); setOpen(value => !value); }}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-xs transition active:scale-90">
      <ChevronDown aria-hidden="true" className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div id={listId} dir={isRtl ? 'rtl' : 'ltr'} role="group" aria-label={isRtl ? 'الدول' : 'Countries'}
      className="absolute right-4 top-full z-20 max-h-[min(19rem,45dvh)] w-[min(15rem,calc(100%-2rem))] overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
      {[popular, ...roomCountries].map(country => <button type="button" key={country.code} aria-pressed={selectedCountry === country.code}
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm ${selectedCountry === country.code ? 'bg-emerald-100 font-bold text-emerald-900' : 'text-slate-700 hover:bg-slate-50'}`}
        onClick={() => select(country.code)}>
        <span aria-hidden="true">{country.flag}</span>{isRtl ? country.name : country.english}
      </button>)}
    </div>}
  </div>;
}
