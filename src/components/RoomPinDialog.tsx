import { useEffect, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { createPortal } from 'react-dom';
import { Crown, Delete, Lock, X } from 'lucide-react';
import { latinDigits } from '../utils/digits';
import { stagingBackend } from '../services/stagingBackend';
import './room-pin.css';

type Props = { roomId: string; locked?: boolean; onClose: () => void; onChanged?: (locked: boolean) => void;
  onEnter?: (pin: string) => void; entryBusy?: boolean; entryError?: string };

export function RoomPinDialog({ roomId, locked, onClose, onChanged, onEnter, entryBusy, entryError }: Props) {
  const [mode, setMode] = useState(locked ? 'manage' : 'set');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const acting = busy || entryBusy;
  const input = Boolean(onEnter || mode === 'set' || mode === 'change');
  useEffect(()=>{
    if (Capacitor.getPlatform()!=='android') return;
    let active = true;
    const listener = CapacitorApp.addListener('backButton',()=>{
      if (active && !acting) onClose();
    });
    void listener.catch(()=>{});
    return ()=>{active=false; void listener.then(handle=>handle.remove()).catch(()=>{});};
  },[acting,onClose]);
  function change(value: string) {
    const normalized = latinDigits(value);
    if (/^[0-9]{0,6}$/.test(normalized)) setPin(normalized);
  }
  async function save(value: string | null) {
    if (!stagingBackend || pending.current) return;
    pending.current = true;
    setError(''); setBusy(true);
    try {
      const response = await stagingBackend.rpc('totichat_room_set_pin', { p_room_id: roomId, p_pin: value });
      if (response.error || response.data !== (value !== null)) throw response.error ?? new Error('Unconfirmed');
      onChanged?.(response.data);
      onClose();
    } catch {
      setError('تعذّر حفظ إعداد القفل. جرّب مرة ثانية.');
    } finally { pending.current = false; setBusy(false); }
  }
  return createPortal(<div className="room-pin-overlay">
    <section role="dialog" aria-modal="true" aria-labelledby="room-pin-title" dir="rtl" className="room-pin-panel"
      onKeyDown={event => { if (event.key==='Escape' && !acting) { event.stopPropagation(); onClose(); } }}>
      <Crown className="room-pin-crown" aria-hidden="true"/>
      <button type="button" className="room-pin-x" aria-label="إغلاق" onClick={onClose} disabled={acting}><X size={20}/></button>
      <h2 id="room-pin-title"><Lock size={23}/> {onEnter ? 'دخول غرفة مقفلة' : 'قفل الغرفة'}</h2>
      <form onSubmit={event => { event.preventDefault(); if (pin.length!==6 || acting) return; if(onEnter) onEnter(pin); else void save(pin); }}>
        {input ? <>
          <p>{onEnter ? 'أدخل رمز الدخول المكون من 6 أرقام' : mode==='change' ? 'أدخل رمز الدخول الجديد' : 'عيّن رمز دخول من 6 أرقام'}</p>
          <label className="room-pin-fields" dir="ltr">
            <input aria-label="رمز الدخول" inputMode="none" autoComplete="off" type="password" value={pin}
              disabled={acting} onChange={event=>change(event.target.value)} />
            {Array.from({length:6},(_,i)=><span aria-hidden="true" key={i}>{i<pin.length ? '●' : ''}</span>)}
          </label>
          <div className="room-pin-keys" dir="ltr">
            {'123456789'.split('').map(digit=><button type="button" key={digit} disabled={acting || pin.length===6} onClick={()=>change(pin+digit)}>{digit}</button>)}
            <span aria-hidden="true"/>
            <button type="button" disabled={acting || pin.length===6} onClick={()=>change(pin+'0')}>0</button>
            <button type="button" disabled={acting || !pin} aria-label="حذف الرقم الأخير" onClick={()=>change(pin.slice(0,-1))}><Delete size={17}/></button>
          </div>
          {(error || entryError) && <p role="alert" className="room-pin-error">{error || entryError}</p>}
          <button type="submit" className="room-pin-primary" disabled={acting || pin.length!==6}>{onEnter?'دخول':mode==='change'?'حفظ':'تعيين الرمز'}</button>
          <button type="button" onClick={onClose} disabled={acting}>إلغاء</button>
        </> : mode==='manage' ? <>
          <p><b>الغرفة مقفلة حالياً</b></p>
          <p>رمز الدخول <bdi>******</bdi></p>
          <button type="button" onClick={()=>{setPin('');setMode('change');}}>تغيير رمز الدخول</button>
          <button type="button" onClick={()=>setMode('confirm')}>حذف الرمز وفتح الغرفة</button>
          <button type="button" onClick={onClose}>إغلاق</button>
        </> : <>
          <p>تريد تحذف الرمز وتفتح الغرفة؟</p>
          {error && <p role="alert" className="room-pin-error">{error}</p>}
          <button type="button" className="room-pin-primary" disabled={acting} onClick={()=>void save(null)}>تأكيد فتح الغرفة</button>
          <button type="button" disabled={acting} onClick={()=>{setError('');setMode('manage');}}>إلغاء</button>
        </>}
      </form>
    </section>
  </div>, document.body);
}
