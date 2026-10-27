import React, { useState } from 'react';
import { stagingBackend } from '../services/stagingBackend';

const choices = [
  { key: 'catalog.manage', title: 'إدارة المتجر' },
  { key: 'reports.read', title: 'قراءة التقارير' },
  { key: 'users.manage', title: 'إدارة المستخدمين' },
  { key: 'host_agency.open', title: 'فتح وكالات المضيفين' },
];
export const AdminStaffPanel: React.FC = () => {
  const [target, setTarget] = useState('');
  const [role, setRole] = useState<'admin'|'db'>('admin');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const save = async () => {
    setError(''); setSuccess('');
    if (!stagingBackend) { setError('الخادم غير متصل'); return; }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target.trim())) { setError('أدخل UUID حساب الموظف الصحيح'); return; }
    if (!window.confirm('تأكيد تعيين صلاحيات هذا الموظف؟ سيستبدل هذا الإعداد صلاحياته السابقة.')) return;
    setBusy(true);
    try {
      const { error: rpcError } = await stagingBackend.rpc('owner_assign_staff', { p_user_id: target.trim(), p_role: role, p_permissions: permissions });
      if (rpcError) throw rpcError;
      setSuccess('تم تحديث دور الموظف وصلاحياته وتسجيل القرار');
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  return <section className="bg-white border border-amber-200 rounded-2xl p-4 mb-5">
    <h2 className="font-black text-lg mb-2">إدارة صلاحيات الموظفين</h2>
    <p className="text-xs text-slate-500 mb-3">للمالك فقط. لا يمكن منح صلاحية Owner أو تعيين شريك رئيسي من هذه الشاشة.</p>
    <label className="block text-sm mb-1">معرّف الموظف UUID</label>
    <input dir="ltr" className="w-full border rounded-xl p-3 mb-3" value={target} onChange={e => setTarget(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
    <label className="block text-sm mb-1">الدور</label>
    <select className="w-full border rounded-xl p-3 mb-3" value={role} onChange={e => setRole(e.target.value as 'admin'|'db')}><option value="admin">مدير</option><option value="db">موظف قواعد البيانات</option></select>
    <p className="font-bold mb-2">الصلاحيات المسموحة</p>
    {choices.map(item => <label key={item.key} className="flex items-center gap-2 py-2 text-sm"><input type="checkbox" checked={permissions.includes(item.key)} onChange={e => setPermissions(old => e.target.checked ? [...old,item.key] : old.filter(k => k !== item.key))} />{item.title}</label>)}
    <button type="button" disabled={busy} className="bg-amber-700 text-white rounded-xl px-4 py-3 disabled:opacity-40 mt-2" onClick={() => void save()}>{busy ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}</button>
    {error && <p role="alert" className="text-red-700 mt-2">{error}</p>}
    {success && <p role="status" className="text-green-700 mt-2">{success}</p>}
  </section>;
};
