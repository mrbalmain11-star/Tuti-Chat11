import React, { useState } from 'react';
import { X, Send, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

export const ReportModal: React.FC = () => {
  const { openReportModal, setOpenReportModal } = useApp();
  const [category, setCategory] = useState('محتوى غير لائق');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!openReportModal) return null;

  const categories = [
    'محتوى غير لائق ⚠️',
    'سلوك مسيء أو مضايقة 🛑',
    'مشكلة تقنية أو خطأ برمجية ⚙️',
    'احتيال أو انتحال شخصية 🛡️',
    'اقتراح لتطوير التطبيق 💡',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playCoin();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setDetails('');
      setOpenReportModal(false);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs font-['Cairo',sans-serif] p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-white text-slate-900 rounded-3xl p-5 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xs">
              💬
            </div>
            <h3 className="text-base font-black text-slate-900">إبلاغ واقتراحات</h3>
          </div>
          <button
            onClick={() => setOpenReportModal(false)}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="text-sm font-black text-slate-900">تم إرسال البلاغ بنجاح</h4>
            <p className="text-xs text-slate-500">شكراً لمساعدتك في الحفاظ على مجتمع توتي شات آمناً ونظيفاً.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="py-3 space-y-3">
            <div className="text-right">
              <label className="text-xs font-bold text-slate-700 block mb-1.5">نوع البلاغ أو الملاحظة:</label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setCategory(cat);
                    }}
                    className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border transition ${
                      category === cat
                        ? 'bg-pink-50 text-pink-700 border-pink-400 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-right">
              <label className="text-xs font-bold text-slate-700 block mb-1">تفاصيل إضافية:</label>
              <textarea
                rows={3}
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="يرجى كتابة الشرح أو الـ ID المعني بالتفصيل..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 text-right focus:outline-none focus:border-pink-500 bg-slate-50"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 rotate-180" />
              <span>إرسال البلاغ إلى الإدارة</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
