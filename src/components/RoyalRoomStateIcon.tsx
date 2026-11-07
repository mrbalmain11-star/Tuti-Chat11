import React, { useId } from 'react';

/** Decorative state badge; status must come from the room record. */
export const RoyalRoomStateIcon: React.FC<{ state: 'active' | 'closed' | 'unknown'; className?: string }> = ({ state, className = 'h-5 w-5' }) => {
  const uid = useId().replace(/:/g, '');
  const fill = `room-state-${uid}`;
  return <svg viewBox="0 0 48 48" className={className} fill="none" role="img" aria-label={state === 'active' ? 'غرفة نشطة' : state === 'closed' ? 'غرفة مغلقة' : 'حالة الغرفة غير معروفة'}>
    <defs><linearGradient id={fill} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff2ad"/><stop offset=".5" stopColor="#e7b652"/><stop offset="1" stopColor="#98601f"/></linearGradient></defs>
    <circle cx="24" cy="24" r="21" fill={state === 'closed' ? '#3d4742' : state === 'active' ? '#087e5b' : '#315d50'} stroke={`url(#${fill})`} strokeWidth="2.5"/>
    {state === 'active' ? <><path d="M17 17 V31 M24 12 V36 M31 17 V31" stroke="#fff2b4" strokeWidth="3.5" strokeLinecap="round"/><circle cx="24" cy="24" r="16" stroke="#9cecc7" strokeWidth="1" strokeDasharray="2 4"/></> : state === 'closed' ? <><rect x="15" y="22" width="18" height="14" rx="3" fill={`url(#${fill})`}/><path d="M19 22 V18 A5 5 0 0 1 29 18 V22" stroke="#ffe6a1" strokeWidth="3"/><circle cx="24" cy="29" r="2" fill="#45554a"/></> : <><circle cx="24" cy="24" r="11" stroke="#ffe7a0" strokeWidth="2"/><path d="M24 17 V25" stroke="#ffe7a0" strokeWidth="3" strokeLinecap="round"/><circle cx="24" cy="31" r="2" fill="#ffe7a0"/></>}
  </svg>;
};
