'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { parseCsv } from '@/lib/csv';
import { createClient } from '@/lib/supabase/server';

function done(msg: string): never {
  revalidatePath('/');
  revalidatePath('/admin');
  redirect(`/admin?notice=${encodeURIComponent(msg)}`);
}

const truthy = (v: string, fallback: boolean) => (v === '' ? fallback : /^(1|y|ya|yes|true)$/i.test(v));
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// CSV accepts both the localized export headers and common database column names.
export async function importMenu(formData: FormData) {
  await requireAdmin();
  const file = formData.get('csv');
  if (!(file instanceof File) || file.size === 0) return done('Pilih file CSV terlebih dahulu');

  const [header = [], ...rows] = parseCsv(await file.text());
  const col = (...names: string[]) =>
    header.findIndex((h) => names.includes(h.trim().toLowerCase()));
  const c = {
    nama: col('nama', 'name'),
    harga: col('harga', 'price'),
    kategori: col('kategori', 'category'),
    categoryId: col('category_id'),
    deskripsi: col('deskripsi', 'description'),
    tersedia: col('tersedia', 'is_available'),
    favorit: col('favorit', 'is_featured'),
  };
  if (c.nama < 0 || c.harga < 0) {
    return done('Header CSV harus memuat kolom nama/name dan harga/price');
  }

  const cell = (r: string[], i: number) => (i >= 0 ? (r[i] ?? '').trim() : '');
  const valid = rows
    .map((r) => {
      const digits = cell(r, c.harga).replace(/\D/g, '');
      return {
        nama: cell(r, c.nama),
        harga: digits === '' ? NaN : Number(digits),
        kategori: cell(r, c.kategori),
        categoryId: cell(r, c.categoryId),
        deskripsi: cell(r, c.deskripsi),
        tersedia: cell(r, c.tersedia),
        favorit: cell(r, c.favorit),
      };
    })
    .filter((r) => r.nama !== '' && Number.isFinite(r.harga));
  const skipped = rows.length - valid.length;

  const supabase = await createClient();
  const catId = new Map<string, string>();
  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name');
    catId.clear();
    for (const x of (data ?? []) as { id: string; name: string }[]) catId.set(x.name.toLowerCase(), x.id);
  };
  await loadCategories();

  const missing = new Map<string, string>();
  for (const r of valid) if (r.kategori && !catId.has(r.kategori.toLowerCase())) missing.set(r.kategori.toLowerCase(), r.kategori);
  if (missing.size > 0) {
    const base = catId.size;
    const { error } = await supabase.from('categories').insert(
      [...missing.values()].map((name, i) => ({ name, slug: slugify(name) || `kategori-${base + i + 1}`, sort_order: base + i + 1 })),
    );
    if (error) return done(`Gagal membuat kategori: ${error.message}`);
    await loadCategories();
  }

  const items = new Map<string, Record<string, unknown>>();
  for (const r of valid) {
    items.set(r.nama, {
      name: r.nama,
      price: r.harga,
      ...(c.deskripsi >= 0 && { description: r.deskripsi || null }),
      ...(c.kategori >= 0 && { category_id: r.kategori ? (catId.get(r.kategori.toLowerCase()) ?? null) : null }),
      ...(c.kategori < 0 && r.categoryId && { category_id: r.categoryId }),
      ...(c.tersedia >= 0 && { is_available: truthy(r.tersedia, true) }),
      ...(c.favorit >= 0 && { is_featured: truthy(r.favorit, false) }),
    });
  }
  if (items.size === 0) return done('Tidak ada baris valid (nama dan harga wajib diisi)');

  const { error } = await supabase.from('menu_items').upsert([...items.values()], { onConflict: 'name' });
  if (error) return done(`Impor gagal: ${error.message}`);
  return done(`Impor selesai: ${items.size} menu diproses${skipped ? `, ${skipped} baris dilewati (nama/harga kosong)` : ''}.`);
}
