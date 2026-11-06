import { stagingBackend } from './stagingBackend';

/**
 * Register an FCM token only after native Android Firebase initialization and
 * notification permission have succeeded. Never call with an invented token.
 */
export async function registerAndroidPushToken(token: string): Promise<void> {
  const client = stagingBackend;
  if (!client) throw new Error('Staging backend unavailable');
  const normalized = token.trim();
  if (!normalized || normalized.length > 4096) throw new Error('Invalid FCM token');
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) throw new Error('Login required for push registration');
  const { error } = await client.from('push_device_tokens').upsert(
    { user_id: user.id, token: normalized, platform: 'android', updated_at: new Date().toISOString() },
    { onConflict: 'token' },
  );
  if (error) throw error;
}

/** Remove this user's token when signing out of the same device. */
export async function unregisterAndroidPushToken(token: string): Promise<void> {
  const client = stagingBackend;
  if (!client || !token.trim()) return;
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return;
  const { error } = await client.from('push_device_tokens')
    .delete().eq('user_id', user.id).eq('token', token.trim());
  if (error) throw error;
}
