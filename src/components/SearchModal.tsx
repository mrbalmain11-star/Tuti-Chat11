import React, { useState } from 'react';
import { X, Search, Radio, ImageIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

export const SearchModal: React.FC = () => {
  const { openSearchModal, setOpenSearchModal, rooms, enterRoom } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const normalized = searchTerm.trim().toLocaleLowerCase();

  if (!openSearchModal) return null;

  const matchedRooms = rooms.filter(
    (r) =>
      r.title.toLowerCase().includes(normalized) ||
      String(r.publicId ?? '').includes(normalized) ||
      (r.hostName || '').toLowerCase().includes(normalized)
  );


  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-xs font-['Cairo',sans-serif] p-4 pt-10 animate-in fade-in">
      <div className="w-full max-w-sm bg-[#fffdf9] rounded-3xl p-4 shadow-2xl border border-emerald-200 flex flex-col max-h-[85vh]">
        {/* Search input bar */}
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="flex-1 flex items-center gap-2 bg-emerald-50 border border-emerald-200 focus-within:ring-2 focus-within:ring-emerald-300 px-3 py-3 rounded-2xl">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن غرفة أو ID..."
              className="w-full bg-transparent text-xs text-slate-900 focus:outline-none text-right"
            />
          </div>
          <button
            onClick={() => setOpenSearchModal(false)}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="py-3 flex-1 overflow-y-auto space-y-4 no-scrollbar">
          {searchTerm.trim() === '' ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              اكتب اسم غرفة أو رقم ID للبحث
            </div>
          ) : (
            <>
              {/* Rooms Section */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-emerald-600" />
                  <span>الغرف الصوتية ({matchedRooms.length})</span>
                </h4>
                {matchedRooms.length === 0 ? (
                  <p className="text-[11px] text-slate-400 py-1">لا توجد غرف مطابقة</p>
                ) : (
                  <div className="space-y-1.5">
                    {matchedRooms.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => {
                          sounds.playClick();
                          enterRoom(r.id);
                          setOpenSearchModal(false);
                        }}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/60 flex items-center justify-between cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2">
                          {(r.coverImage || r.hostAvatar) ? <img src={r.coverImage || r.hostAvatar} alt={r.title} className="w-10 h-10 rounded-xl object-cover bg-emerald-100" /> : <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700"><ImageIcon size={19}/></div>}
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-900">{r.title}</p>
                            <span className="text-[10px] text-slate-500 font-mono">ID: {r.publicId ?? '—'}</span>
                          </div>
                        </div>
                        <span className="text-xs text-emerald-600 font-bold">دخول 🎙️</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </>
          )}
        </div>
      </div>
    </div>
  );
};
