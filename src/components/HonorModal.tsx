import React from 'react';
import { X, Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const HonorModal: React.FC = () => {
  const { openHonorModal, setOpenHonorModal } = useApp();

  if (!openHonorModal) return null;



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs font-['Cairo',sans-serif] p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-slate-950 text-white rounded-3xl p-5 border border-rose-500/30 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black text-white">قاعة الشرف والأوسمة</h3>
          </div>
          <button
            onClick={() => setOpenHonorModal(false)}
            className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-2.5 overflow-y-auto no-scrollbar">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-8 text-center" role="status">
            <Trophy className="mx-auto mb-3 h-9 w-9 text-amber-400/70" />
            <p className="text-sm font-bold text-white">لا توجد أوسمة مؤكدة للعرض حالياً</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">ستظهر الأوسمة المكتسبة بعد ربطها بسجلات الإنجازات الحقيقية. لن نعرض أوسمة وهمية على حسابك.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
