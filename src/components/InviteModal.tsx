import React, { useEffect, useState } from 'react';
import { X, Copy, Check, Share2, MessageCircle, Send, Link2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';
import { fetchMyProfile } from '../services/stagingBackend';

export const InviteModal: React.FC = () => {
  const { openInviteModal, setOpenInviteModal, currentUser } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [publicId, setPublicId] = useState<number | null>(null);

  useEffect(() => {
    if (!openInviteModal) { setPublicId(null); return; }
    let active = true;
    void fetchMyProfile().then(profile => {
      const id = Number(profile?.public_id);
      if (active) setPublicId(Number.isInteger(id) && id >= 100000 && id <= 999999 ? id : null);
    }).catch(error => {
      console.error('Unable to load invite account ID:', error);
      if (active) setPublicId(null);
    });
    return () => { active = false; };
  }, [openInviteModal, currentUser.id]);

  if (!openInviteModal) return null;

  const accountId = publicId ? String(publicId) : '';
  const inviteUrl = accountId ? `https://tuliling.app/invite?u=${encodeURIComponent(accountId)}` : '';
  const inviteCode = accountId;

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyValue = async (value: string, onCopied: (copied: boolean) => void, successMessage: string) => {
    sounds.playClick();
    if (!value) {
      showToast('معرّف الحساب غير متاح حالياً.');
      return;
    }
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(value);
      onCopied(true);
      showToast(successMessage);
      setTimeout(() => onCopied(false), 2200);
    } catch {
      showToast('تعذر النسخ على هذا الجهاز.');
    }
  };

  const shareText = 'انضم إلى TotiChat وتواصل مع أصدقائك.';
  const handleShareWhatsApp = () => {
    sounds.playClick();
    if (!inviteUrl) return showToast('معرّف الحساب غير متاح حالياً.');
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${inviteUrl}`)}`, '_blank', 'noopener,noreferrer');
  };
  const handleShareTelegram = () => {
    sounds.playClick();
    if (!inviteUrl) return showToast('معرّف الحساب غير متاح حالياً.');
    window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  };
  const handleNativeShare = async () => {
    sounds.playClick();
    if (!inviteUrl) return showToast('معرّف الحساب غير متاح حالياً.');
    if (!navigator.share) return void copyValue(inviteUrl, setCopiedLink, 'تم نسخ رابط الدعوة.');
    try {
      await navigator.share({ title: 'دعوة إلى TotiChat', text: shareText, url: inviteUrl });
    } catch {
      // The user may cancel the native share sheet.
    }
  };

  return (
    <div onClick={() => setOpenInviteModal(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <section onClick={(event) => event.stopPropagation()} className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-y-auto rounded-3xl border border-emerald-200 bg-gradient-to-b from-white via-emerald-50 to-amber-50 p-5 text-right shadow-[0_15px_50px_rgba(16,100,61,.2)]">
        {toastMessage && <div role="status" className="fixed left-1/2 top-5 z-[60] -translate-x-1/2 rounded-full border border-emerald-200 bg-emerald-900 px-4 py-2 text-xs font-bold text-white shadow-xl">{toastMessage}</div>}

        <header className="flex items-center justify-between border-b border-emerald-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-500 text-white shadow-md"><Link2 className="h-5 w-5" /></div>
            <div><h2 className="text-base font-black text-slate-900">دعوة الأصدقاء</h2><p className="text-[11px] text-slate-500">شارك رابط حسابك في TotiChat</p></div>
          </div>
          <button type="button" onClick={() => { sounds.playClick(); setOpenInviteModal(false); }} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200" aria-label="إغلاق"><X className="h-4 w-4" /></button>
        </header>

        <div className="mt-4 rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
          <p className="text-sm font-bold leading-6 text-slate-700">انسخ الرابط أو شاركه لدعوة أصدقائك. لا تتوفر حالياً معلومات موثقة عن مكافآت الدعوة.</p>
          <div className="mt-4 space-y-2">
            <label htmlFor="invite-link" className="block text-xs font-bold text-slate-700">رابط الدعوة</label>
            <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-2">
              <input id="invite-link" type="text" readOnly value={inviteUrl || 'رابط الدعوة غير متاح'} className="min-w-0 flex-1 bg-transparent px-1 text-left text-xs font-mono font-bold text-slate-800 outline-none" dir="ltr" />
              <button type="button" disabled={!inviteUrl} onClick={() => void copyValue(inviteUrl, setCopiedLink, 'تم نسخ رابط الدعوة.')} className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-600 px-3 text-xs font-black text-white disabled:opacity-50">
                {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copiedLink ? 'تم النسخ' : 'نسخ الرابط'}
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs">
            <span className="font-bold text-slate-600">معرّف الحساب</span>
            <span className="flex items-center gap-2">
              <b className="font-mono text-slate-900" dir="ltr">{accountId || 'غير متاح'}</b>
              <button type="button" disabled={!accountId} onClick={() => void copyValue(inviteCode, setCopiedCode, 'تم نسخ معرّف الحساب.')} className="rounded-lg p-2 text-emerald-800 hover:bg-emerald-100 disabled:opacity-50" aria-label="نسخ معرّف الحساب">{copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button>
            </span>
          </div>
        </div>

        <div className="mt-4 border-t border-emerald-100 pt-3">
          <span className="mb-2 block text-xs font-bold text-slate-700">مشاركة الرابط</span>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" disabled={!inviteUrl} onClick={handleShareWhatsApp} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-900 disabled:opacity-50"><MessageCircle className="h-4 w-4" />واتساب</button>
            <button type="button" disabled={!inviteUrl} onClick={handleShareTelegram} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 text-xs font-bold text-sky-900 disabled:opacity-50"><Send className="h-4 w-4" />تيليجرام</button>
            <button type="button" disabled={!inviteUrl} onClick={() => void handleNativeShare()} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 text-xs font-bold text-amber-900 disabled:opacity-50"><Share2 className="h-4 w-4" />مشاركة</button>
          </div>
        </div>
      </section>
    </div>
  );
};
