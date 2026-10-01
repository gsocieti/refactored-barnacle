import { createClient } from '@/lib/supabase/server';
import type { Category, MenuItem } from '@/lib/types';

const q = (v: string) => `"${v.replace(/"/g, '""')}"`;

// Pemisah titik koma agar langsung terbagi kolom di Excel Indonesia. Dilindungi middleware (/admin/*).
export async function GET() {
  const supabase = await createClient();
  const [cats, menu] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('menu_items').select('*').order('name'),
  ]);
  const names = new Map<string, string>();
  for (const c of (cats.data ?? []) as Category[]) names.set(c.id, c.name);

  const lines = ['nama;harga;kategori;deskripsi;tersedia;favorit'];
  for (const i of (menu.data ?? []) as MenuItem[]) {
    lines.push(
      [q(i.name), String(i.price), q(names.get(i.category_id ?? '') ?? ''), q(i.description ?? ''), i.is_available ? 'ya' : 'tidak', i.is_featured ? 'ya' : 'tidak'].join(';'),
    );
  }
  return new Response('\uFEFF' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="menu-momiega.csv"',
    },
  });
}
