import React, { useRef, useState } from 'react';
import { Camera, CheckCircle2, Crown, ShieldCheck, UserRound } from 'lucide-react';
import { stagingBackend, uploadMyAvatar } from '../services/stagingBackend';

const countries = ['العراق','الأردن','السعودية','الكويت','الإمارات','قطر','البحرين','عُمان','سوريا','لبنان','فلسطين','مصر','اليمن','المغرب','الجزائر','تونس','ليبيا','السودان','تركيا','ألمانيا','الولايات المتحدة','أخرى'];
const disallowed = /(totichat|tutichat|توتيشات|توتيجات|tiktok|instagram|facebook|snapchat|telegram|whatsapp|youtube|discord|تيكتوك|انستغرام|فيسبوك|سناب|تلغرام|واتساب|يوتيوب|ديسكورد|porn|xxx|sex|سكس|اباح|إباح)/i;
const cleanName = (name: string) => name.toLowerCase().replace(/[\s_.-]+/g, '');

export const CompleteAccountScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const picker = useRef<HTMLInputElement>(null);

  // Read and convert immediately while Android's gallery file grant is active.
  // The profile storage service accepts only WebP, not JPEG data URLs.
  const choosePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setPhoto(null);
    setBusy(true);
    try {
      if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
        throw new Error('اختر صورة بحجم أقل من 10MB');
      }
      const bytes = await file.arrayBuffer();
      if (!bytes.byteLength) throw new Error('ملف الصورة فارغ، اختر صورة أخرى');
      const original = new Blob([bytes], { type: file.type });
      const objectUrl = URL.createObjectURL(original);
      try {
        const image = new Image();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error('تعذر فتح الصورة، اختر JPG أو PNG'));
          image.src = objectUrl;
        });
        const maxSide = 500;
        const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('تعذر تجهيز الصورة على الهاتف');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const webp = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(blob => blob && blob.type === 'image/webp'
            ? resolve(blob) : reject(new Error('تعذر تحويل الصورة إلى WebP')), 'image/webp', 0.82));
        if (webp.size > 2 * 1024 * 1024) throw new Error('حجم الصورة بعد المعالجة كبير جداً');
        setPhoto(webp);
        setPreview(previous => {
          if (previous) URL.revokeObjectURL(previous);
          return URL.createObjectURL(webp);
        });
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر قراءة ملف الصورة');
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const nickname = name.trim();
    if (nickname.length < 2 || nickname.length > 20) { setError('الاسم يجب أن يكون من 2 إلى 20 حرفاً'); return; }
    if (disallowed.test(cleanName(nickname))) { setError('هذا الاسم غير مسموح، اختر اسماً آخر'); return; }
    const selectedAge = Number(age);
    if (!Number.isInteger(selectedAge) || selectedAge < 1 || selectedAge > 120 || !gender || !country) {
      setError('أكمل العمر والجنس والدولة'); return;
    }
    if (!stagingBackend) { setError('تعذر الاتصال بخدمة الحساب'); return; }
    setBusy(true); setError('');
    try {
      const { data: { user }, error: authError } = await stagingBackend.auth.getUser();
      if (authError || !user) throw authError ?? new Error('يرجى تسجيل الدخول مجدداً');
      // Persist the optional avatar through the existing authenticated storage path.
      if (photo) {
        await uploadMyAvatar(photo);
      }
      const { data, error: saveError } = await stagingBackend.from('profiles')
        .update({ display_name: nickname, age: selectedAge, gender, country, bio: bio.trim(), onboarding_completed: true })
        .eq('id', user.id).select('id,onboarding_completed').single();
      if (saveError) throw saveError;
      if (!data?.onboarding_completed) throw new Error('تعذر تأكيد حفظ الحساب');
      window.dispatchEvent(new Event('totichat:profile-changed'));
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ الحساب، حاول مرة أخرى');
    } finally { setBusy(false); }
  };

  return <div dir="rtl" className="fixed inset-0 z-[1001] overflow-y-auto bg-[#001b15] text-white font-['Cairo',sans-serif]">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(15,118,79,.48),transparent_65%)]" />
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-9 pt-[calc(28px+env(safe-area-inset-top,0px))]">
      <div className="text-center text-amber-300">
        <div className="text-5xl">🦅</div>
        <div className="text-3xl font-black tracking-wide">TotiChat</div>
      </div>
      <div className="mt-5 flex items-center justify-center gap-3 text-xs">
        <span className="text-emerald-300"><ShieldCheck className="inline h-4 w-4" /> التحقق ✓</span>
        <span className="h-px w-7 bg-amber-400" />
        <span className="font-bold text-amber-300">② معلومات الحساب</span>
        <span className="h-px w-7 bg-amber-400/40" />
        <span className="text-emerald-100/60">③ بدء الاستخدام</span>
      </div>
      <h1 className="mt-7 text-center text-3xl font-black text-amber-300">أكمل معلومات حسابك</h1>
      <p className="mt-2 text-center text-sm text-emerald-50/80">لإعداد حسابك في TotiChat، يرجى تعبئة المعلومات التالية</p>
      <form onSubmit={save} className="mt-5 space-y-4">
        <div className="flex justify-center">
          <button type="button" onClick={() => picker.current?.click()} className="relative flex h-32 w-32 items-center justify-center rounded-full border-[3px] border-amber-400 bg-gradient-to-br from-emerald-900 to-black shadow-[0_0_25px_rgba(251,191,36,.35)]">
            {preview ? <img src={preview} alt="الصورة الشخصية" className="h-full w-full rounded-full object-cover" /> : <UserRound className="h-16 w-16 text-amber-200/60" />}
            <Crown className="absolute -top-5 h-9 w-9 text-amber-300" />
            <span className="absolute -bottom-1 -left-1 rounded-full border border-amber-300 bg-emerald-800 p-2"><Camera className="h-5 w-5 text-amber-300" /></span>
          </button>
          <input ref={picker} type="file" accept="image/*" className="hidden" onChange={choosePhoto} />
        </div>
        <label className="block rounded-2xl border border-amber-500/70 bg-emerald-950/70 px-4 py-3">
          <span className="text-sm font-bold text-amber-200">الاسم المستعار *</span>
          <input value={name} onChange={e => setName(e.target.value.slice(0,20))} maxLength={20} required placeholder="أدخل اسمك في التطبيق" className="mt-1 w-full bg-transparent text-white outline-none placeholder:text-emerald-100/40" />
          <span className="block text-left text-xs text-emerald-100/50">{name.length}/20</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="rounded-2xl border border-amber-500/70 bg-emerald-950/70 p-3">
            <span className="text-sm font-bold text-amber-200">الجنس *</span>
            <select value={gender} onChange={e=>setGender(e.target.value)} required className="mt-2 w-full bg-[#00392b] text-sm text-white outline-none"><option value="">اختر الجنس</option><option value="ذكر">ذكر</option><option value="أنثى">أنثى</option></select>
          </label>
          <label className="rounded-2xl border border-amber-500/70 bg-emerald-950/70 p-3">
            <span className="text-sm font-bold text-amber-200">العمر *</span>
            <select value={age} onChange={e=>setAge(e.target.value)} required className="mt-2 w-full bg-[#00392b] text-sm text-white outline-none"><option value="">اختر العمر</option>{Array.from({length:120},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select>
          </label>
        </div>
        <label className="block rounded-2xl border border-amber-500/70 bg-emerald-950/70 px-4 py-3">
          <span className="text-sm font-bold text-amber-200">الدولة *</span>
          <select value={country} onChange={e=>setCountry(e.target.value)} required className="mt-2 w-full bg-[#00392b] text-white outline-none"><option value="">اختر دولتك</option>{countries.map(item=><option key={item} value={item}>{item}</option>)}</select>
        </label>
        <label className="block rounded-2xl border border-amber-500/70 bg-emerald-950/70 px-4 py-3">
          <span className="text-sm font-bold text-amber-200">الرسالة / الحالة (اختياري)</span>
          <textarea value={bio} onChange={e=>setBio(e.target.value.slice(0,100))} maxLength={100} rows={3} placeholder="اكتب رسالة قصيرة تظهر في ملفك الشخصي" className="mt-2 w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-emerald-100/40" />
          <span className="block text-left text-xs text-emerald-100/50">{bio.length}/100</span>
        </label>
        {error && <p role="alert" className="rounded-xl bg-red-950/60 p-3 text-center text-sm text-red-200">{error}</p>}
        <button type="submit" disabled={busy} className="flex h-16 w-full items-center justify-center gap-3 rounded-full border-2 border-amber-400 bg-gradient-to-r from-emerald-900 via-emerald-700 to-emerald-900 text-xl font-black text-amber-200 shadow-[0_0_24px_rgba(251,191,36,.25)] disabled:opacity-50">
          {busy ? 'جارٍ حفظ الحساب...' : <><CheckCircle2 className="h-7 w-7" /> إنشاء الحساب</>}
        </button>
      </form>
    </div>
  </div>;
};
