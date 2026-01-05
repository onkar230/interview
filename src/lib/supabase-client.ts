/**
 * Supabase Client-Side Configuration
 * Use this in client components (components with 'use client')
 */

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Client-side Supabase client (Browser/Client Components)
 * Uses cookie-based storage to work with middleware authentication
 */
export const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
