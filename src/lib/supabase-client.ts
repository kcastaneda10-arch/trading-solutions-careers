'use client';

import { createClient } from '@supabase/supabase-js';

// Client-side only Supabase client (safe for browser)
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
