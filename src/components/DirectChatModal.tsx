import React, { useState, useRef, useEffect } from 'react';
import { X, Send, UserRound } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

const formatTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
};

export const DirectChatModal: React.FC = () => {
  const { openChatThread, setOpenChatThread, sendDirectMessage } = useApp();
  const [inputText, setInputText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [openChatThread?.messages]);
  if (!openChatThread) return null;

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    sendDirectMessage(openChatThread.id, text);
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 font-['Cairo',sans-serif] sm:p-2">
      <div className="w-full max-w-md h-[100dvh] sm:h-[90dvh] bg-[#efeae2] sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col" dir="rtl">
        <header className="px-3 py-3 bg-[#087f68] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-11 h-11 rounded-full overflow-hidden bg-white/20 flex items-center justify-center shrink-0">
              <UserRound className="w-6 h-6 text-white/80" />
              {openChatThread.userAvatar && <img src={openChatThread.userAvatar} alt="" onError={e => { e.currentTarget.style.display = 'none'; }} className="absolute inset-0 w-full h-full object-cover" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold truncate">{openChatThread.userName}</h3>
              <p className="text-xs text-emerald-100">{openChatThread.isOnline ? 'متصل الآن' : 'غير متصل'}</p>
            </div>
          </div>
          <button type="button" aria-label="إغلاق المحادثة" onClick={() => { sounds.playClick(); setOpenChatThread(null); }} className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center"><X className="w-5 h-5" /></button>
        </header>
        <div className="flex-1 min-h-0 px-3 py-4 overflow-y-auto space-y-2 bg-[#efeae2]">
          {openChatThread.messages.map(m => {
            const mine = m.sender === 'me';
            return (
              <div key={m.id} className={`flex flex-col ${mine ? 'items-start' : 'items-end'}`}>
                <div className={`max-w-[85%] min-w-[76px] px-3 pt-2 pb-1.5 rounded-xl text-sm leading-6 break-words shadow-sm ${mine ? 'bg-[#d9fdd3] text-[#172b25] rounded-tr-sm' : 'bg-white text-[#172b25] rounded-tl-sm'}`}>
                  <p className="whitespace-pre-wrap break-words" dir="auto">{m.text}</p>
                  <div className="text-[10px] leading-4 text-slate-500 text-left mt-0.5" dir="ltr">{formatTime(m.timestamp)}</div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
        <form onSubmit={handleSend} className="px-3 py-2 bg-[#f6f4f1] flex items-center gap-2 shrink-0">
          <input type="text" value={inputText} maxLength={2000} onChange={e => setInputText(e.target.value)} placeholder="اكتب رسالة..." className="flex-1 min-w-0 bg-white rounded-full px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right" />
          <button type="submit" aria-label="إرسال" disabled={!inputText.trim()} className="w-11 h-11 rounded-full bg-[#008f72] text-white flex items-center justify-center shrink-0 disabled:opacity-50 active:scale-95 transition"><Send className="w-5 h-5 rotate-180" /></button>
        </form>
      </div>
    </div>
  );
};
