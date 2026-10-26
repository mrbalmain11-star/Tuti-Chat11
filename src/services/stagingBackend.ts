/**
 * Staging-only, read-first backend adapter.
 * No service role credentials or production fallback. No visual UI changes.
 * Configure VITE_SUPABASE_PUBLISHABLE_KEY using the Staging publishable key.
 */
import { createClient } from '@supabase/supabase-js';

const STAGING_URL = 'https://rziaedugbdwefbefcxjt.supabase.co';
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!publishableKey) {
  console.warn('TotiChat staging backend is not configured. Real-data features must remain unavailable.');
}

export const stagingBackend = publishableKey
  ? createClient(STAGING_URL, publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
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

export async function signInWithRealGoogle(): Promise<void> {
  const client = requireBackend();
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
