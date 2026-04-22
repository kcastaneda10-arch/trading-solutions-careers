'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy init para browser — no romper build si la env var no existe
let _client: SupabaseClient | null = null;
function getBrowserClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase browser client not configured');
  }
  _client = createClient(url, key);
  return _client;
}

export const supabaseBrowser: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const c = getBrowserClient() as unknown as Record<PropertyKey, unknown>;
    const v = c[prop];
    return typeof v === 'function' ? (v as (...args: unknown[]) => unknown).bind(c) : v;
  },
});
