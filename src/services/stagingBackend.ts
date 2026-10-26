/**
 * Staging-only, read-first backend adapter.
 * No service role credentials or production fallback. No visual UI changes.
 * Configure VITE_SUPABASE_PUBLISHABLE_KEY using the Staging publishable key.
 */
import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

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
  owner_id: string;
  title: string;
  is_private: boolean;
  welcome_message: string;
  cover_path: string | null;
  background_path: string | null;
};

export type BackendProfile = {
  id: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
};

function requireBackend() {
  if (!stagingBackend) throw new Error('Supabase Staging is not configured');
  return stagingBackend;
}

export async function fetchRealRooms(): Promise<BackendRoom[]> {
  const client = requireBackend();
  const { data, error } = await client.from('rooms')
    .select('id,owner_id,title,is_private,welcome_message,cover_path,background_path')
    .eq('is_private', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as BackendRoom[];
}

export async function fetchMyProfile(): Promise<BackendProfile | null> {
  const client = requireBackend();
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) return null;
  const { data, error } = await client.from('profiles')
    .select('id,display_name,bio,avatar_url').eq('id', auth.user.id).maybeSingle();
  if (error) throw error;
  return data as BackendProfile | null;
}

const NATIVE_OAUTH_CALLBACK = 'com.numyar.totichat.staging://auth/callback';

export async function initializeNativeAuthLinks(): Promise<() => void> {
  if (!Capacitor.isNativePlatform()) return () => {};
  const listener = await App.addListener('appUrlOpen', async ({ url }) => {
    if (!url.startsWith(NATIVE_OAUTH_CALLBACK)) return;
    try {
      const client = requireBackend();
      const callback = new URL(url);
      const params = new URLSearchParams(callback.search);
      const hash = new URLSearchParams(callback.hash.replace(/^#/, ''));
      const error = params.get('error_description') ?? hash.get('error_description');
      if (error) throw new Error(error);
      const code = params.get('code');
      if (code) {
        const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
      } else {
        const access_token = hash.get('access_token');
        const refresh_token = hash.get('refresh_token');
        if (!access_token || !refresh_token) throw new Error('Missing OAuth session tokens');
        const { error: sessionError } = await client.auth.setSession({ access_token, refresh_token });
        if (sessionError) throw sessionError;
      }
      await Browser.close();
    } catch (error) {
      console.error('Native OAuth callback failed:', error);
    }
  });
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
