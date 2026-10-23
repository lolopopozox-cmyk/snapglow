/**
 * Supabase client (browser). Uses the PUBLIC anon key only — the
 * service-role key must never appear in frontend code.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};
const url = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing).');
  }
  return supabase;
}

/** Deterministic internal email for username-based auth (never shown to users). */
export function authEmailFor(username: string): string {
  return `sg.${username.trim().toLowerCase().replace(/^@/, '')}@gmail.com`;
}

export const STORAGE_PUBLIC_URL = url ? `${url.replace(/\/$/, '')}/storage/v1/object/public` : '';
