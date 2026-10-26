import React from 'react';
import { X, Trophy, Award, Crown, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const HonorModal: React.FC = () => {
  const { openHonorModal, setOpenHonorModal } = useApp();

  if (!openHonorModal) return null;

  const medals = [
    { title: 'وسام المؤسس الملكي', desc: 'الانضمام في أول موسم لتوتي شات', icon: '🎖️', unlocked: true },
    { title: 'سيف الفارس الذهبي', desc: 'إهداء هدايا بقيمة تفوق 100,000 كوينز', icon: '⚔️', unlocked: true },
    { title: 'عرش الحفلات', desc: 'البقاء على المايك لأكثر من 10 ساعات', icon: '👑', unlocked: true },
    { title: 'صقر الوكالات', desc: 'قيادة وكالة ضمن أفضل 3 مراكز', icon: '🦅', unlocked: false },
  ];

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
          {medals.map((m, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl border flex items-center justify-between ${
                m.unlocked
                  ? 'bg-slate-900 border-amber-500/30'
                  : 'bg-slate-950/40 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">{m.icon}</div>
                <div className="text-right">
                  <h4 className="text-xs font-black text-white">{m.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{m.desc}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.unlocked ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
                {m.unlocked ? 'مكتسب' : 'قيد الفتح'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
