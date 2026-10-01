import { createClient } from '@supabase/supabase-js';

const secretKeyMessage =
  'Ganti SUPABASE_SERVICE_ROLE_KEY dengan Secret API Key berawalan sb_secret_ dari Supabase Project Settings → API Keys, atau kunci legacy service_role. Jangan gunakan sb_publishable_ atau anon key. Setelah mengubah .env.local, restart server Next.js.';

export function getAdminKeyConfigurationError(): string | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    return `Tambahkan SUPABASE_SERVICE_ROLE_KEY ke .env.local. ${secretKeyMessage}`;
  }

  if (key === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || key.startsWith('sb_publishable_')) {
    return 'SUPABASE_SERVICE_ROLE_KEY saat ini terdeteksi sebagai publishable/anon key, bukan kunci admin. ' + secretKeyMessage;
  }

  if (key.startsWith('sb_secret_')) return null;

  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1] ?? '', 'base64url').toString());
    if (payload.role === 'service_role') return null;
  } catch {
    return secretKeyMessage;
  }

  return secretKeyMessage;
}

export const createAdminClient = () => {
  const configurationError = getAdminKeyConfigurationError();
  if (configurationError) throw new Error(configurationError);

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};
