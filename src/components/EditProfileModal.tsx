import React, { useState, useRef } from 'react';
import { X, Check, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';
import { processImageFile } from '../utils/imageUpload';

export const EditProfileModal: React.FC = () => {
  const { openEditProfileModal, setOpenEditProfileModal, currentUser, updateUserProfile } = useApp();

  const [name, setName] = useState(currentUser.name);
  const [nickname, setNickname] = useState(currentUser.nickname);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [country, setCountry] = useState(currentUser.country);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [cover, setCover] = useState(currentUser.cover || 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80');
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (openEditProfileModal) {
      setName(currentUser.name || '');
      setNickname(currentUser.nickname || '');
      setBio(currentUser.bio || '');
      setCountry(currentUser.country || 'العراق');
      setAvatar(currentUser.avatar || '');
      setCover(currentUser.cover || 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80');
    }
  }, [openEditProfileModal, currentUser]);

  if (!openEditProfileModal) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const dataUrl = await processImageFile(file);
      setAvatar(dataUrl);
      sounds.playCoin();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      // reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      const dataUrl = await processImageFile(file);
      setCover(dataUrl);
      sounds.playCoin();
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    // The authenticated profile API supports display name and biography.
    // Never submit an editable auth ID or unsupported profile fields.
    updateUserProfile({ name: name.trim(), bio });
    setOpenEditProfileModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs font-['Cairo',sans-serif] p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-white text-slate-900 rounded-3xl p-5 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-black text-slate-900">تعديل الملف الشخصي</h3>
          <button
            onClick={() => setOpenEditProfileModal(false)}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="py-3 space-y-3">
          {/* Profile Cover Banner selector */}
          <div className="flex flex-col">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />

            <label className="text-xs font-bold text-slate-700 block mb-1 text-right">
              غلاف الملف الشخصي:
            </label>
            <div
              onClick={() => coverInputRef.current?.click()}
              className="relative w-full h-24 rounded-2xl border-2 border-dashed border-purple-300 hover:border-purple-500 overflow-hidden shadow-xs cursor-pointer group bg-slate-900 active:scale-98 transition flex items-center justify-center"
              title="اضغط لتغيير الغلاف من المعرض"
            >
              <img src={cover} alt="Cover" className="w-full h-full object-cover" />
              {uploadingCover && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white z-10">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition gap-2">
                <Camera className="w-4 h-4 text-purple-300" />
                <span className="text-xs font-bold">تغيير صورة الغلاف</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="mt-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 self-center flex items-center gap-1.5 transition active:scale-95 py-1"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>اختيار غلاف جديد من المعرض</span>
            </button>
          </div>

          {/* Avatar selector from Phone Gallery */}
          <div className="flex flex-col items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-22 h-22 rounded-full border-2 border-emerald-500 overflow-hidden shadow-md cursor-pointer group bg-slate-100 active:scale-95 transition"
              title="اضغط لتغيير الصورة من المعرض"
            >
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition">
                <Camera className="w-5 h-5 drop-shadow" />
                <span className="text-[9px] font-bold mt-0.5">تغيير</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition active:scale-95"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>اختيار صورة من معرض الهاتف</span>
            </button>
          </div>

          <div className="text-right">
            <label className="text-xs font-bold text-slate-600 block mb-1">الاسم الأساسي:</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 text-right focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="text-right">
            <label className="text-xs font-bold text-slate-600 block mb-1">اللقب المستعار (النيكنيم):</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 text-right focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="text-right">
            <label className="text-xs font-bold text-slate-600 block mb-1">الدولة:</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 text-right focus:outline-none focus:border-emerald-500"
            >
              <option value="العراق">العراق 🇮🇶</option>
              <option value="المملكة العربية السعودية">المملكة العربية السعودية 🇸🇦</option>
              <option value="مصر">مصر 🇪🇬</option>
              <option value="سوريا">سوريا 🇸🇾</option>
            </select>
          </div>

          <div className="text-right">
            <label className="text-xs font-bold text-slate-600 block mb-1">النبذة الشخصية (Bio):</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 text-right focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition active:scale-95"
          >
            حفظ التغييرات
          </button>
        </form>
      </div>
    </div>
  );
};
