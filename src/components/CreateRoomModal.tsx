import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';
import { RoyalCreateRoomIcon } from './RoyalCreateRoomIcon';
import { fetchRealRooms } from '../services/stagingBackend';
import { mapRoomToUi } from '../services/mapRoomToUi';

export const CreateRoomModal: React.FC = () => {
  const { openCreateRoomModal, setOpenCreateRoomModal, createVoiceRoom, enterRoom, currentUser } = useApp();
  const [roomName, setRoomName] = useState('');
  const [saving, setSaving] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('اهلا وسهلا');
  const [coverImage, setCoverImage] = useState<string>('/src/assets/images/iraq_flag_cover_1790177322445.jpg');
  const [checkingExistingRoom, setCheckingExistingRoom] = useState(false);
  const [roomLookupError, setRoomLookupError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!openCreateRoomModal || !currentUser.id) return;
    let active = true;
    setCheckingExistingRoom(true);
    setRoomLookupError('');
    void fetchRealRooms().then(rows => {
      if (!active) return;
      const existing = rows.find(room => room.owner_id === currentUser.id);
      if (!existing) return;
      const room = mapRoomToUi(existing);
      setOpenCreateRoomModal(false);
      enterRoom(room.id, room);
    }).catch(error => {
      if (active) setRoomLookupError(error instanceof Error ? error.message : 'تعذر التحقق من غرفتك الحالية.');
    }).finally(() => {
      if (active) setCheckingExistingRoom(false);
    });
    return () => { active = false; };
  }, [openCreateRoomModal, currentUser.id]);

  if (!openCreateRoomModal) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
        window.alert('يرجى اختيار صورة بحجم لا يتجاوز 5 ميغابايت');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCoverImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || checkingExistingRoom) return;
    if (saving) return;
    setSaving(true);
    try {
      const createdRoom = await createVoiceRoom(roomName.trim(), welcomeMessage.trim() || 'اهلا وسهلا', coverImage.startsWith('data:image/') ? coverImage : undefined);
      sounds.playLevelUp();
      setOpenCreateRoomModal(false);
      enterRoom(createdRoom.id, createdRoom);
    } catch (error) {
      console.error('Room creation or cover upload failed:', error);
      window.alert(error instanceof Error ? error.message : 'تعذر إنشاء الغرفة.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0B0424] text-white font-['Cairo',sans-serif] flex flex-col justify-between p-6 select-none overflow-y-auto animate-in fade-in"
      dir="rtl"
    >
      {/* Top Header */}
      <div>
        {checkingExistingRoom && <p role="status" className="mb-2 rounded-xl border border-emerald-300/30 bg-emerald-950/40 px-3 py-2 text-center text-xs font-bold text-emerald-100">نتحقق من الغرفة المرتبطة بحسابك…</p>}
        {roomLookupError && <p role="alert" className="mb-2 rounded-xl border border-amber-300/40 bg-amber-950/40 px-3 py-2 text-center text-xs font-bold text-amber-100">{roomLookupError}</p>}
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
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2"><RoyalCreateRoomIcon className="w-9 h-9" />أنشئ غرفة</h2>
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
          disabled={saving || checkingExistingRoom}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#814AF6] to-[#25B4F8] text-white font-black text-base shadow-[0_4px_20px_rgba(129,74,246,0.4)] active:scale-98 transition cursor-pointer hover:opacity-95"
        >
          إنشاء غرفة
        </button>
      </div>
    </div>
  );
};
