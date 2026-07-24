'use client';

import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Fallback to local 127.0.0.1 if URL is unconfigured or a placeholder domain
const isPlaceholder = !rawUrl || rawUrl.includes('placeholder-project-id');
const supabaseUrl = isPlaceholder ? 'http://127.0.0.1:54321' : rawUrl;
const supabaseAnonKey = isPlaceholder ? 'placeholder-anon-key' : rawKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
