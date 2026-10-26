import React, { useState } from 'react';
import { X, Search, Radio, User, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

export const SearchModal: React.FC = () => {
  const { openSearchModal, setOpenSearchModal, rooms, enterRoom, agencies, setOpenAgencyModal } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  if (!openSearchModal) return null;

  const matchedRooms = rooms.filter(
    (r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.hostId.includes(searchTerm) ||
      r.hostName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const matchedAgencies = agencies.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-xs font-['Cairo',sans-serif] p-4 pt-10 animate-in fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl p-4 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Search input bar */}
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="flex-1 flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-full">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بالاسم أو ID الغرفة..."
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
              اكتب اسم غرفة، اسم وكالة، أو رقم ID للبحث الفوري
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
                          <img src={r.hostAvatar} alt="host" className="w-8 h-8 rounded-full object-cover" />
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-900">{r.title}</p>
                            <span className="text-[10px] text-slate-500 font-mono">ID: {r.hostId}</span>
                          </div>
                        </div>
                        <span className="text-xs text-emerald-600 font-bold">دخول 🎙️</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Agencies Section */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>الوكالات الرسمية ({matchedAgencies.length})</span>
                </h4>
                {matchedAgencies.length === 0 ? (
                  <p className="text-[11px] text-slate-400 py-1">لا توجد وكالات مطابقة</p>
                ) : (
                  <div className="space-y-1.5">
                    {matchedAgencies.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => {
                          sounds.playClick();
                          setOpenSearchModal(false);
                          setOpenAgencyModal(true);
                        }}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/60 flex items-center justify-between cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2">
                          <img src={a.logo} alt="agency" className="w-8 h-8 rounded-lg object-cover" />
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-900">{a.name}</p>
                            <span className="text-[10px] text-slate-500">{a.countryFlag} • {a.memberCount} عضو</span>
                          </div>
                        </div>
                        <span className="text-xs text-blue-600 font-bold">عرض 👑</span>
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
