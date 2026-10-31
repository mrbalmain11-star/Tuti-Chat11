/**
 * Staging-only, read-first backend adapter.
 * No service role credentials or production fallback. No visual UI changes.
 * Configure VITE_SUPABASE_PUBLISHABLE_KEY using the Staging publishable key.
 */
import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { imageUrl } from './imageUrl';

const STAGING_URL = 'https://rziaedugbdwefbefcxjt.supabase.co';
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!publishableKey) {
  console.warn('TotiChat staging backend is not configured. Real-data features must remain unavailable.');
}

export const stagingBackend = publishableKey
  ? createClient(STAGING_URL, publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: !Capacitor.isNativePlatform() },
    })
  : null;

export type BackendRoom = {
  id: string;
  public_id: number;
  owner_id: string;
  title: string;
  is_private: boolean;
  welcome_message: string;
  cover_path: string | null;
  background_path: string | null;
  background_url?: string;
  cover_url?: string;
};

export type BackendProfile = {
  id: string;
  public_id: number;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  cover_path: string | null;
};

function requireBackend() {
  if (!stagingBackend) throw new Error('Supabase Staging is not configured');
  return stagingBackend;
}

export async function fetchRealRooms(): Promise<BackendRoom[]> {
  const client = requireBackend();
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) return [];
  const fields = 'id,public_id,owner_id,title,is_private,welcome_message,cover_path,background_path';
  const [publicRooms, ownedRooms] = await Promise.all([
    client.from('rooms').select(fields).eq('is_private', false).order('created_at', { ascending: false }),
    client.from('rooms').select(fields).eq('owner_id', auth.user.id).order('created_at', { ascending: false }),
  ]);
  if (publicRooms.error) throw publicRooms.error;
  if (ownedRooms.error) throw ownedRooms.error;
  const unique = new Map<string, BackendRoom>();
  for (const room of [...(ownedRooms.data ?? []), ...(publicRooms.data ?? [])] as BackendRoom[]) {
    unique.set(room.id, room);
  }
  const rooms = [...unique.values()];
  for (const room of rooms) {
    room.cover_url = imageUrl(room.cover_path,'totichat-room-images');
    room.background_url = imageUrl(room.background_path,'totichat-room-images');
  }
  return rooms;
}

export async function fetchMyProfile(): Promise<BackendProfile | null> {
  const client = requireBackend();
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) return null;
  const { data, error } = await client.from('profiles')
    .select('id,public_id,display_name,bio,avatar_url,cover_path').eq('id', auth.user.id).maybeSingle();
  if (error) throw error;
  return data as BackendProfile | null;
}

const NATIVE_OAUTH_CALLBACK = 'com.numyar.totichat.staging://auth/callback';

export const NATIVE_AUTH_ERROR_EVENT = 'totichat:native-auth-error';

async function handleNativeOAuthUrl(url: string): Promise<void> {
  if (!url.startsWith(NATIVE_OAUTH_CALLBACK + '?') &&
      !url.startsWith(NATIVE_OAUTH_CALLBACK + '#') &&
      url !== NATIVE_OAUTH_CALLBACK) return;
  try {
    const client = requireBackend();
    const callback = new URL(url);
    const params = new URLSearchParams(callback.search);
    const hash = new URLSearchParams(callback.hash.replace(/^#/, ''));
    const error = params.get('error_description') ?? hash.get('error_description')
      ?? params.get('error') ?? hash.get('error');
    if (error) throw new Error(error);
    const code = params.get('code');
    if (code) {
      const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
    } else {
      const access_token = hash.get('access_token');
      const refresh_token = hash.get('refresh_token');
      if (!access_token || !refresh_token) {
        throw new Error('OAuth redirect returned without a session. Check Supabase redirect URL allowlist.');
      }
      const { error: sessionError } = await client.auth.setSession({ access_token, refresh_token });
      if (sessionError) throw sessionError;
    }
    const { data: { session }, error: verifyError } = await client.auth.getSession();
    if (verifyError || !session?.user) throw verifyError ?? new Error('OAuth session not established');
  } catch (error) {
    console.error('Native OAuth callback failed:', error);
    window.dispatchEvent(new CustomEvent(NATIVE_AUTH_ERROR_EVENT, {
      detail: error instanceof Error ? error.message : String(error),
    }));
  } finally {
    try { await Browser.close(); } catch { /* Browser may already be closed */ }
  }
}

export async function initializeNativeAuthLinks(): Promise<() => void> {
  if (!Capacitor.isNativePlatform()) return () => {};
  const listener = await App.addListener('appUrlOpen', ({ url }) => {
    void handleNativeOAuthUrl(url);
  });
  // Android can cold-start the app for an OAuth deep link before the listener exists.
  const launch = await App.getLaunchUrl();
  if (launch?.url) void handleNativeOAuthUrl(launch.url);
  return () => { void listener.remove(); };
}

export async function signInWithRealGoogle(): Promise<void> {
  const client = requireBackend();
  if (Capacitor.isNativePlatform()) {
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: NATIVE_OAUTH_CALLBACK,
        skipBrowserRedirect: true,
      },
    });
    if (error) throw error;
    if (!data.url) throw new Error('Google authorization URL unavailable');
    await Browser.open({ url: data.url });
    return;
  }
  const redirectTo = new URL('/auth/callback', window.location.origin).toString();
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) throw error;
}

export async function signOutRealUser(): Promise<void> {
  const client = requireBackend();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export type BackendWallet = { coins: number; diamonds: number };

export async function fetchMyWallet(): Promise<BackendWallet> {
  const client = requireBackend();
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('Not authenticated');
  const { data, error } = await client.from('wallets')
    .select('coins,diamonds')
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { coins: 0, diamonds: 0 };
  const coins = Number(data.coins);
  const diamonds = Number(data.diamonds);
  if (!Number.isSafeInteger(coins) || !Number.isSafeInteger(diamonds)) {
    throw new Error('Wallet value exceeds safe integer precision');
  }
  return { coins, diamonds };
}

export type BackendRoomMember = {
  room_id: string;
  user_id: string;
  seat_no: number | null;
  is_muted: boolean;
  moderation_muted: boolean;
};

export async function fetchRoomMembers(roomId: string): Promise<BackendRoomMember[]> {
  const client = requireBackend();
  const { data, error } = await client.from('room_members')
    .select('room_id,user_id,seat_no,is_muted,moderation_muted')
    .eq('room_id', roomId);
  if (error) throw error;
  return (data ?? []) as BackendRoomMember[];
}

/** Verify the active Supabase identity against its own persisted profile. Does not confer admin rights. */
export async function verifySignedInProfile(): Promise<{ userId: string; publicId: number } | null> {
  const client = requireBackend();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user || !user.email_confirmed_at) return null;
  const { data: profile, error: profileError } = await client.from('profiles')
    .select('id,public_id').eq('id', user.id).maybeSingle();
  if (profileError) throw profileError;
  if (!profile || profile.id !== user.id || !Number.isInteger(profile.public_id)) return null;
  return { userId: user.id, publicId: profile.public_id };
}

export type AdminAccess = { role: string; permissions: string[] };

/** Server-authorized access for the signed-in user only. Fail closed on any error. */
export async function fetchMyAdminAccess(): Promise<AdminAccess | null> {
  const client = requireBackend();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) return null;
  const { data, error } = await client.rpc('my_admin_access');
  if (error) throw error;
  const access = Array.isArray(data) ? data[0] : null;
  if (!access || typeof access.role !== 'string' || !Array.isArray(access.permissions)) return null;
  return { role: access.role, permissions: access.permissions };
}

export type OwnerDashboardCounts = { users_count: number; agencies_count: number; rooms_count: number };
/** Read-only real staging totals. SQL RPC checks owner on the server. */
export async function fetchOwnerDashboardCounts(): Promise<OwnerDashboardCounts | null> {
  const client = requireBackend();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) return null;
  const { data, error } = await client.rpc('owner_dashboard_counts');
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return null;
  const values = [row.users_count, row.agencies_count, row.rooms_count].map(Number);
  if (!values.every(n => Number.isSafeInteger(n) && n >= 0)) throw new Error('Invalid dashboard counts');
  return { users_count: values[0], agencies_count: values[1], rooms_count: values[2] };
}

export type AdminRecentItem = { public_id?: number; id?: string; display_name?: string; name?: string; title?: string; created_at: string };
export type OwnerDashboardRecent = { users: AdminRecentItem[]; agencies: AdminRecentItem[]; rooms: AdminRecentItem[] };
/** Owner-only, read-only latest records. Authorization enforced by the SQL function. */
export async function fetchOwnerDashboardRecent(): Promise<OwnerDashboardRecent> {
  const client = requireBackend();
  const { data, error } = await client.rpc('owner_dashboard_recent');
  if (error) throw error;
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Owner dashboard access denied');
  const recent = data as Record<string, unknown>;
  if (!Array.isArray(recent.users) || !Array.isArray(recent.agencies) || !Array.isArray(recent.rooms)) throw new Error('Invalid owner dashboard response');
  return { users: recent.users as AdminRecentItem[], agencies: recent.agencies as AdminRecentItem[], rooms: recent.rooms as AdminRecentItem[] };
}

/** Persist only editable profile fields for the authenticated account. */
export async function saveMyProfile(changes: { display_name?: string; bio?: string; avatar_url?: string | null; cover_path?: string | null }): Promise<BackendProfile> {
  const client = requireBackend();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('يرجى تسجيل الدخول مجدداً');
  const { data, error } = await client.from('profiles')
    .update(changes).eq('id', user.id)
    .select('id,public_id,display_name,bio,avatar_url,cover_path').single();
  if (error) {
    console.error('Profile save failed', { code: error.code, message: error.message, details: error.details });
    if (error.code === 'PGRST116') throw new Error('تعذر العثور على ملف حسابك أو لا توجد صلاحية لتعديله. سجّل الدخول مجدداً ثم حاول.');
    if (error.code === '42501') throw new Error('الخادم رفض تعديل الملف الشخصي بسبب الصلاحيات.');
    throw error;
  }
  if (!data) throw new Error('لم يؤكد الخادم حفظ الملف الشخصي');
  return data as BackendProfile;
}

/** Storage policy requires UUID/UUID.webp under the authenticated user's folder. */
export async function uploadMyAvatar(file: Blob): Promise<string> {
  const client = requireBackend();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('يرجى تسجيل الدخول مجدداً');
  if (file.size > 2 * 1024 * 1024 || file.type !== 'image/webp') throw new Error('حجم الصورة أو نوعها غير مدعوم');
  const path = user.id + '/' + crypto.randomUUID() + '.webp';
  const { error: uploadError } = await client.storage.from('profile-avatars').upload(path, file, { contentType: 'image/webp', upsert: false });
  if (uploadError) throw new Error(`رفع الصورة فشل (${uploadError.statusCode ?? 'unknown'}): ${uploadError.message}`);
  try {
    await saveMyProfile({ avatar_url: path });
  } catch (error) {
    await client.storage.from('profile-avatars').remove([path]);
    throw error;
  }
  return path;
}

export async function getMyAvatarUrl(path: string): Promise<string> {
  const client = requireBackend();
  return imageUrl(path,'profile-avatars');
}

/** Save a separate profile cover using the existing owner-scoped image storage policy. */
export async function uploadMyCover(file: Blob): Promise<string> {
  const client = requireBackend();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('يرجى تسجيل الدخول مجدداً');
  if (file.type !== 'image/webp' || file.size > 2 * 1024 * 1024) throw new Error('الغلاف يجب أن يكون WebP وبحجم لا يتجاوز 2MB');
  const path = user.id + '/' + crypto.randomUUID() + '.webp';
  const { error: uploadError } = await client.storage.from('profile-avatars').upload(path, file, { contentType: 'image/webp', upsert: false });
  if (uploadError) throw new Error('فشل رفع الغلاف: ' + uploadError.message);
  try {
    await saveMyProfile({ cover_path: path });
  } catch (error) {
    await client.storage.from('profile-avatars').remove([path]);
    throw error;
  }
  return path;
}
