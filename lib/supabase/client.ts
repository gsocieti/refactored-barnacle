import { createBrowserClient } from '@supabase/ssr';

// Client browser (disiapkan untuk Fase 2: keranjang & status pesanan realtime).
export const createClient = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
