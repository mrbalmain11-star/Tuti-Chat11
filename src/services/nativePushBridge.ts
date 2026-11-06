import { Capacitor, registerPlugin } from '@capacitor/core';
import { stagingBackend } from './stagingBackend';
import { registerAndroidPushToken, unregisterAndroidPushToken } from './pushDeviceRegistration';

type PushToken = { token: string };
type PushTokenListener = { remove: () => Promise<void> };
interface NativePushPlugin {
  getToken(): Promise<PushToken>;
  addListener(eventName: 'tokenChanged', listener: (event: PushToken) => void): Promise<PushTokenListener>;
}
const NativePush = registerPlugin<NativePushPlugin>('TotiPush');

/**
 * Opt-in bridge for the regenerated Capacitor Android app.
 * This must remain inert until the matching native TotiPush plugin is bundled.
 * Never register a token using an unverified or guessed user identity.
 */
export async function startAuthenticatedPushRegistration(): Promise<() => Promise<void>> {
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('TotiPush') || !stagingBackend) {
    return async () => {};
  }
  const client = stagingBackend;
  let stopped = false;
  let registeredToken: string | null = null;
  let ownerId: string | null = null;
  let inFlight: Promise<void> = Promise.resolve();
  const enqueue = (event: PushToken): Promise<void> => {
    const next = inFlight.catch(() => {}).then(() => register(event));
    inFlight = next;
    return next;
  };
  const register = async ({ token }: PushToken) => {
    if (stopped || !token?.trim()) return;
    const { data: { user }, error } = await client.auth.getUser();
    if (stopped || error || !user) return;
    if (ownerId && ownerId !== user.id) {
      // Never attempt to delete a former user's token using the new user's JWT.
      // RLS prevents that deletion; registration must fail closed until logout
      // has explicitly removed the old association.
      console.warn('Push registration skipped: account changed without token cleanup');
      return;
    }
    if (stopped) return;
    if (stopped) return;
    await registerAndroidPushToken(token);
    if (stopped) {
      // Cleanup awaits this registration before the auth token is revoked.
      await unregisterAndroidPushToken(token);
      return;
    }
    registeredToken = token;
    ownerId = user.id;
  };
  const listener = await NativePush.addListener('tokenChanged', event => {
    void enqueue(event).catch(() => console.warn('Push token registration unavailable'));
  });
  try {
    await enqueue(await NativePush.getToken());
  } catch {
    // No token is expected when Google Play services or permission is unavailable.
  }
  return async () => {
    stopped = true;
    await listener.remove();
    // Wait for any outstanding Supabase upsert before removing this token.
    // Otherwise a slow upsert could recreate a registration after sign-out.
    await inFlight.catch(() => {});
    if (registeredToken) await unregisterAndroidPushToken(registeredToken);
  };
}
