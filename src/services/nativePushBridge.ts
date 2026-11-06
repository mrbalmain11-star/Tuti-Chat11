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
  const register = async ({ token }: PushToken) => {
    if (stopped || !token?.trim()) return;
    const { data: { user }, error } = await client.auth.getUser();
    if (stopped || error || !user) return;
    if (ownerId && ownerId !== user.id && registeredToken) {
      // Do not reuse a previous user's token registration.
      await unregisterAndroidPushToken(registeredToken);
      registeredToken = null;
    }
    if (stopped) return;
    await registerAndroidPushToken(token);
    if (!stopped) {
      registeredToken = token;
      ownerId = user.id;
    }
  };
  const listener = await NativePush.addListener('tokenChanged', event => {
    void register(event).catch(() => console.warn('Push token registration unavailable'));
  });
  try {
    await register(await NativePush.getToken());
  } catch {
    // No token is expected when Google Play services or permission is unavailable.
  }
  return async () => {
    stopped = true;
    await listener.remove();
    // Cleanup must occur before signOut while Supabase still has user context.
    if (registeredToken) await unregisterAndroidPushToken(registeredToken);
  };
}
