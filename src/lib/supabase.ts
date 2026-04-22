import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ─── Lazy init para que el build de Next.js no requiera las env vars ─
// Se crean los clients al primer uso (request time), no al importar el módulo.
let _admin: SupabaseClient | null = null;
let _anon: SupabaseClient | null = null;

function getAdminClient(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Supabase admin client not configured: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set'
    );
  }
  _admin = createClient(url, key);
  return _admin;
}

function getAnonClient(): SupabaseClient {
  if (_anon) return _anon;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'Supabase client not configured: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set'
    );
  }
  _anon = createClient(url, key);
  return _anon;
}

// ─── Proxies exportados ─────────────────────────────────────────────
// Se mantiene la API antigua (supabaseAdmin.from(...), supabase.from(...))
// pero se resuelve el cliente real al primer acceso en runtime.
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const c = getAdminClient() as unknown as Record<PropertyKey, unknown>;
    const v = c[prop];
    return typeof v === 'function' ? (v as (...args: unknown[]) => unknown).bind(c) : v;
  },
});

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const c = getAnonClient() as unknown as Record<PropertyKey, unknown>;
    const v = c[prop];
    return typeof v === 'function' ? (v as (...args: unknown[]) => unknown).bind(c) : v;
  },
});
