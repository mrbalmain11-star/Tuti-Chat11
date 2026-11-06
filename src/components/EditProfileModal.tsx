import React, { useState, useRef } from 'react';
import { X, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';
import { processImageFile } from '../utils/imageUpload';
import { uploadMyAvatar, uploadMyCover } from '../services/stagingBackend';
import { saveProfileChanges } from '../services/profileWrites';

/** Convert gallery preview to the WebP format required by authenticated storage. */
async function toWebpBlob(dataUrl: string): Promise<Blob> {
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('تعذر معالجة الصورة'));
    image.src = dataUrl;
  });
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('تعذر تجهيز الصورة');
  context.drawImage(image, 0, 0);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
    result => result && result.type === 'image/webp' ? resolve(result) : reject(new Error('صيغة WebP غير مدعومة')),
    'image/webp', 0.82,
  ));
  if (blob.size > 2 * 1024 * 1024) throw new Error('حجم الصورة يتجاوز 2MB');
  return blob;
}

export const EditProfileModal: React.FC = () => {
  const { openEditProfileModal, setOpenEditProfileModal, currentUser } = useApp();

  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [cover, setCover] = useState(currentUser.cover || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [coverBlob, setCoverBlob] = useState<Blob | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (openEditProfileModal) {
      setSaveError('');
      setAvatarBlob(null);
      setCoverBlob(null);
      setName(currentUser.name || '');
      setBio(currentUser.bio || '');
      setAvatar(currentUser.avatar || '');
      setCover(currentUser.cover || 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80');
    }
  }, [openEditProfileModal]);

  if (!openEditProfileModal) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const dataUrl = await processImageFile(file);
      const blob = await toWebpBlob(dataUrl);
      setAvatarBlob(blob);
      setAvatar(dataUrl);
      sounds.playCoin();
    } catch (err) {
      console.error(err);
      setSaveError(err instanceof Error ? err.message : 'تعذر تجهيز الصورة');
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
      const blob = await toWebpBlob(dataUrl);
      setCoverBlob(blob);
      setCover(dataUrl);
      sounds.playCoin();
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || uploading || uploadingCover) return;
    setSaving(true);
    setSaveError('');
    try {
      const updatedName = name.trim();
      if (updatedName.length < 2 || updatedName.length > 40) throw new Error('الاسم يجب أن يكون من 2 إلى 40 حرفاً');
      await saveProfileChanges({ display_name: updatedName, bio: bio.trim() });
      if (avatarBlob) await uploadMyAvatar(avatarBlob);
      if (coverBlob) await uploadMyCover(coverBlob);
      window.dispatchEvent(new Event('totichat:profile-changed'));
      sounds.playClick();
      setOpenEditProfileModal(false);
    } catch (error) {
      console.error('Profile update failed:', error);
      setSaveError(error instanceof Error ? error.message : 'تعذر حفظ التغييرات، حاول مجدداً');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#001b15]/90 backdrop-blur-md font-['Cairo',sans-serif] p-4 animate-in fade-in">
      <div className="w-full max-w-sm max-h-[92dvh] overflow-y-auto bg-gradient-to-b from-[#084e39] via-[#063b2e] to-[#001d19] text-white rounded-3xl p-5 shadow-2xl border border-amber-400/60 flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-amber-400/30">
          <h3 className="text-base font-black text-amber-200">تعديل الملف الشخصي</h3>
          <button
            disabled={saving}
            onClick={() => setOpenEditProfileModal(false)}
            className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-amber-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="py-3 space-y-3" dir="rtl">
          {/* Profile Cover Banner selector */}
          <div className="flex flex-col">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />

            <label className="text-xs font-bold text-amber-200 block mb-1 text-right">
              غلاف الملف الشخصي:
            </label>
            <div
              onClick={() => coverInputRef.current?.click()}
              className="relative w-full h-24 rounded-2xl border-2 border-dashed border-amber-300 hover:border-amber-400 overflow-hidden shadow-xs cursor-pointer group bg-slate-900 active:scale-98 transition flex items-center justify-center"
              title="اضغط لتغيير الغلاف من المعرض"
            >
              {cover ? <img src={cover} alt="غلاف الملف الشخصي" className="w-full h-full object-cover" /> : <span className="text-sm text-amber-200/80">اختر غلافاً من معرض الهاتف</span>}
              {uploadingCover && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white z-10">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition gap-2">
                <Camera className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-bold">تغيير صورة الغلاف</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="mt-1 text-[11px] font-bold text-amber-200 hover:text-amber-100 self-center flex items-center gap-1.5 transition active:scale-95 py-1"
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
              {avatar ? <img src={avatar} alt="الصورة الشخصية" className="w-full h-full object-cover" /> : <Camera className="m-auto mt-7 h-8 w-8 text-emerald-800" />}
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
            <label className="text-xs font-bold text-amber-200 block mb-1">الاسم الأساسي:</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-amber-400/50 bg-emerald-950/80 text-xs text-white text-right focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="text-right">
            <label className="text-xs font-bold text-amber-200 block mb-1">النبذة الشخصية (Bio):</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              className="w-full p-2.5 rounded-xl border border-amber-400/50 bg-emerald-950/80 text-xs text-white text-right focus:outline-none focus:border-amber-400"
            />
          </div>

          {saveError && <p role="alert" className="rounded-xl border border-rose-300/50 bg-rose-950/50 p-3 text-xs text-rose-100">{saveError}</p>}
          <button
            type="submit"
            disabled={saving || uploading || uploadingCover}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700 border border-amber-300/70 text-white font-black text-sm shadow-md transition active:scale-95"
          >
            {saving ? "جارٍ حفظ التغييرات..." : "حفظ التغييرات"}
          </button>
        </form>
      </div>
    </div>
  );
};
