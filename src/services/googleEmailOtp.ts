import { stagingBackend } from './stagingBackend';

/** This client never proves authorization: the server must enforce OTP for every protected operation. */
export const GOOGLE_EMAIL_OTP_RULES = {
  digits: 6,
  expiresInSeconds: 300,
  maxAttempts: 5,
  resendCooldownSeconds: 60,
} as const;

type StartResponse = { status: 'sent' | 'rate_limited' | 'not_configured'; retryAfterSeconds?: number };
type VerifyResponse = { status: 'verified' | 'invalid' | 'expired' | 'locked'; remainingAttempts?: number };

export async function requestGoogleEmailOtp(): Promise<StartResponse> {
  if (!stagingBackend) throw new Error('Staging backend unavailable');
  const { data, error } = await stagingBackend.functions.invoke<StartResponse>('google-email-otp-start', {
    method: 'POST',
    body: {},
  });
  if (error || !data) throw error ?? new Error('OTP service unavailable');
  return data;
}

export async function verifyGoogleEmailOtp(code: string): Promise<VerifyResponse> {
  if (!/^\\d{6}$/.test(code)) throw new Error('OTP must have exactly six digits');
  if (!stagingBackend) throw new Error('Staging backend unavailable');
  const { data, error } = await stagingBackend.functions.invoke<VerifyResponse>('google-email-otp-verify', {
    method: 'POST',
    body: { code },
  });
  if (error || !data) throw error ?? new Error('OTP verification unavailable');
  return data;
}
