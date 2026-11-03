export const STAGING_ISSUANCE = 900_000_000_000;
// A stable business reference also prevents a new request ID from repeating this test issuance.
export const STAGING_ISSUANCE_REFERENCE = 'TOTICHAT-STAGING-OWNER-900B-2026';
export type TreasuryIntent = {
  requestId: string;
  actorId: string;
  action: 'issue' | 'allocate' | 'topup';
  coins: number;
  note: string;
  recipient?: number;
  agencyId?: string;
  label: string;
};
export function integerInput(value: string, maximum = Number.MAX_SAFE_INTEGER): number {
  if (!/^[0-9]+$/.test(value.trim())) throw new Error('أدخل عدداً صحيحاً موجباً');
  const result = Number(value.trim());
  if (!Number.isSafeInteger(result) || result < 1 || result > maximum) throw new Error('العدد خارج النطاق المسموح');
  return result;
}
export function documentedReason(value: string): string {
  const reason = value.trim();
  if (/[\u0000-\u001F\u007F]/.test(reason)) throw new Error('السبب يحتوي رموزاً غير مسموحة');
  if (reason.length < 10 || reason.length > 500) throw new Error('السبب يجب أن يكون بين 10 و500 حرف');
  return reason;
}
export function rpcForIntent(intent: TreasuryIntent) {
  if (!['issue', 'allocate', 'topup'].includes(intent.action)) {
    throw new Error('نوع العملية المالية غير معروف');
  }
  documentedReason(intent.note);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(intent.requestId)) {
    throw new Error('معرّف طلب الشحن غير صالح');
  }
  if (!Number.isSafeInteger(intent.coins) || intent.coins < 1) throw new Error('مبلغ الشحن غير صالح');
  if (!intent.actorId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(intent.actorId)) {
    throw new Error('هوية منفذ العملية غير صالحة');
  }
  if (intent.action === 'issue' && intent.coins !== STAGING_ISSUANCE) {
    throw new Error('قيمة إصدار الخزينة التجريبية غير مطابقة للقيمة المعتمدة');
  }
  if (intent.action === 'topup' && (intent.coins > 1_000_000_000 || !Number.isSafeInteger(intent.recipient) || Number(intent.recipient) < 1)) {
    throw new Error('تحقق من رقم المستلم ومبلغ الشحن');
  }
  if (intent.action === 'allocate' && (!intent.agencyId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(intent.agencyId))) {
    throw new Error('اختر وكالة شحن صالحة قبل التحويل');
  }
  if (intent.action === 'topup') return {
    name: 'phase4_owner_topup_by_id',
    args: { p_public_id: intent.recipient, p_coins: intent.coins, p_note: intent.note, p_request_id: intent.requestId },
  };
  return {
    name: 'phase4_recharge_action',
    args: {
      p_action: intent.action, p_request_id: intent.requestId,
      p_data: intent.action === 'issue'
        ? { coins: intent.coins, note: intent.note, cash_reference: STAGING_ISSUANCE_REFERENCE }
        : { coins: intent.coins, note: intent.note, agency_id: intent.agencyId },
    },
  };
}
export function completedResult(value: unknown): { id: string; coins: number } {
  if (!value || typeof value !== 'object') throw new Error('لم يؤكد الخادم نتيجة العملية');
  const row = value as Record<string, unknown>;
  if (row.status !== 'completed' || typeof row.id !== 'string' || !Number.isSafeInteger(row.coins) || Number(row.coins) < 1) {
    throw new Error('لم يؤكد الخادم اكتمال العملية ورقمها');
  }
  return { id: row.id, coins: Number(row.coins) };
}
