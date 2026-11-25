import { integerDigits } from '../utils/digits';
import { useState } from 'react';
import { adminSections, canAssignSection, staffRoles, type StaffRole } from '../services/adminPermissions';
import { stagingBackend } from '../services/stagingBackend';

export function AdminStaffPanel() {
  const [target, setTarget] = useState('');
  const [person, setPerson] = useState<string | null>(null);
  const [role, setRole] = useState<StaffRole>('admin');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const inputId = /^[0-9]{6}$/.test(target) ? Number(target) : null;

  const submit = async (action: 'lookup' | 'save') => {
    if (!stagingBackend || inputId === null || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const { data, error } = await stagingBackend.rpc('owner_staff_by_public_id', {
        p_public_id: inputId, p_action: action,
        ...(action === 'save' ? { p_role: role, p_permissions: permissions } : {}),
      });
      if (error) throw error;
      if (action === 'lookup') {
        setPerson(data.name);
        const nextRole = data.role === 'super_admin' || data.role === 'customer_service' ? data.role : 'admin';
        setRole(nextRole);
        setPermissions(adminSections.filter(item => canAssignSection(nextRole, item) && data.permissions.includes(item.permission)).map(item => item.permission));
      } else setMessage('تم حفظ الرتبة والصلاحيات');
    } catch (error) {
      const detail = (error as { message?: string }).message;
      setMessage(detail === 'USER_NOT_FOUND' ? 'ما لكينا حساب بهذا الـID' : 'تعذر تحميل أو حفظ صلاحيات هذا الحساب');
    } finally { setBusy(false); }
  };

  return <section className="space-y-4 rounded-2xl border border-amber-200 bg-white p-4">
    <label className="block text-sm font-bold">ID الموظف
      <input dir="ltr" inputMode="numeric" maxLength={6} value={target} disabled={busy}
        onChange={event => {
          setTarget(integerDigits(event.target.value));
          setPerson(null); setPermissions([]); setMessage('');
        }}
        placeholder="123456" className="mt-2 w-full rounded-xl border p-3" />
    </label>
    <button type="button" disabled={busy || inputId === null} onClick={() => void submit('lookup')}
      className="rounded-xl border border-amber-200 px-4 py-2 font-bold disabled:opacity-40">عرض الحساب</button>
    {person !== null && <>
      <p className="font-bold">{person} · <bdi>{target}</bdi></p>
      <label className="block text-sm font-bold">الرتبة
        <select value={role} disabled={busy} className="mt-2 w-full rounded-xl border p-3"
          onChange={event => {
            const next = event.target.value as StaffRole;
            setRole(next);
            setPermissions(old => old.filter(key => adminSections.some(item => item.permission === key && canAssignSection(next, item))));
          }}>
          {Object.entries(staffRoles).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </label>
      <fieldset disabled={busy} className="space-y-2">
        <legend className="mb-2 font-black">الصلاحيات</legend>
        {adminSections.map(item => {
          const allowed = canAssignSection(role, item);
          const checked = permissions.includes(item.permission);
          return <label key={item.id} className="flex items-center gap-3 rounded-xl border p-3 text-sm">
            <input type="checkbox" checked={checked} disabled={!allowed} className="size-5 accent-emerald-700"
              onChange={event => setPermissions(old => event.target.checked
                ? [...old, item.permission] : old.filter(key => key !== item.permission))} />
            <span>{item.label}</span>
            {checked && <span aria-hidden="true">✅</span>}
            {!allowed && <small className="mr-auto text-slate-500">{'ownerOnly' in item ? 'للمالك' : 'حسب الرتبة'}</small>}
          </label>;
        })}
      </fieldset>
      <button type="button" disabled={busy} onClick={() => void submit('save')}
        className="rounded-xl bg-amber-700 px-4 py-3 text-white disabled:opacity-40">حفظ الصلاحيات</button>
    </>}
    {message && <p role="status" className="text-sm">{message}</p>}
  </section>;
}
