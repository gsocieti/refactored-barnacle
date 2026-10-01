import { createClient } from '@supabase/supabase-js';

// Client tanpa cookie untuk data publik, supaya halaman bisa di-cache (ISR).
export const createPublicClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
