import React, { useState, useRef } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

export const CreateRoomModal: React.FC = () => {
  const { openCreateRoomModal, setOpenCreateRoomModal, createVoiceRoom } = useApp();
  const [roomName, setRoomName] = useState('دولة العراق');
  const [welcomeMessage, setWelcomeMessage] = useState('اهلا وسهلا');
  const [coverImage, setCoverImage] = useState<string>('/src/assets/images/iraq_flag_cover_1790177322445.jpg');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!openCreateRoomModal) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCoverImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    sounds.playLevelUp();
    createVoiceRoom(roomName, welcomeMessage || 'اهلا وسهلا');
    setOpenCreateRoomModal(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0B0424] text-white font-['Cairo',sans-serif] flex flex-col justify-between p-6 select-none overflow-y-auto animate-in fade-in"
      dir="rtl"
    >
      {/* Top Header */}
      <div>
        <div className="relative flex items-center justify-center pt-2 pb-6">
          <button
            onClick={() => {
              sounds.playClick();
              setOpenCreateRoomModal(false);
            }}
            className="absolute right-0 p-1 text-slate-300 hover:text-white transition active:scale-90"
            title="رجوع"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
          <h2 className="text-lg font-bold text-white tracking-wide">أنشئ غرفة</h2>
        </div>

        {/* Room Cover Upload Box */}
        <div className="my-6 flex justify-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
          <div
            onClick={() => {
              sounds.playClick();
              fileInputRef.current?.click();
            }}
            className="w-44 h-44 rounded-3xl bg-[#191136] border border-purple-800/40 overflow-hidden flex items-center justify-center cursor-pointer shadow-2xl relative group active:scale-95 transition"
          >
            {coverImage ? (
              <img
                src={coverImage}
                alt="Room Cover"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
            ) : (
              <Plus className="w-16 h-16 text-slate-400 group-hover:text-white transition" />
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-bold text-white backdrop-blur-[1px]">
              تغيير الصورة
            </div>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleCreate} id="create-room-form" className="space-y-6 max-w-sm mx-auto">
          {/* Room Name */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-200">اسم الغرفة</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="يرجى الإدخال"
              required
              className="w-full bg-[#191136] text-white rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-slate-500 transition shadow-inner"
            />
          </div>

          {/* Welcome Message */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-200">رسالة الترحيب</label>
            <div className="relative">
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="يرجى الإدخال"
                rows={4}
                className="w-full bg-[#191136] text-white rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-slate-500 resize-none transition shadow-inner"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Bottom Submit Button */}
      <div className="pt-6 pb-2 max-w-sm mx-auto w-full">
        <button
          type="submit"
          form="create-room-form"
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#814AF6] to-[#25B4F8] text-white font-black text-base shadow-[0_4px_20px_rgba(129,74,246,0.4)] active:scale-98 transition cursor-pointer hover:opacity-95"
        >
          إنشاء غرفة
        </button>
      </div>
    </div>
  );
};
