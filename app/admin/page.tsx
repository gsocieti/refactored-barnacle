import { toggleAvailability } from './actions';
import { syncDriveMenuPhotos } from './drive-sync';
import { importMenu } from './menu-io';
import AdminNav from '@/components/admin/AdminNav';
import ItemForm from '@/components/admin/ItemForm';
import { createClient } from '@/lib/supabase/server';
import type { Category, MenuItem } from '@/lib/types';

const rupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  const supabase = await createClient();
  const [cats, menu] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('menu_items').select('*').order('name'),
  ]);
  const categories = (cats.data ?? []) as Category[];
  const items = (menu.data ?? []) as MenuItem[];
  const groups = [
    ...categories.map((c) => ({ name: c.name, items: items.filter((i) => i.category_id === c.id) })),
    { name: 'Tanpa kategori', items: items.filter((i) => !categories.some((c) => c.id === i.category_id)) },
  ].filter((g) => g.items.length > 0);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-5">
      <AdminNav current="menu" />
      <h1 className="font-display text-3xl font-extrabold">Menu Momiega</h1>
      {notice && (
        <p role="status" className="rounded-lg border-2 border-kuah bg-white p-3 text-sm">{notice}</p>
      )}

      <section className="space-y-3 rounded-2xl border-4 border-kuah bg-white p-4">
        <div>
          <h2 className="font-bold">Sinkronkan foto menu dari Google Drive</h2>
          <p className="mt-1 text-sm leading-6 text-kuah/70">
            Unggah 10 foto Drive yang sudah dicocokkan berdasarkan isi hidangan dengan menu GoFood, lalu simpan
            tautannya di Supabase. Menu dan harga tetap. Foto lain yang belum dapat dicocokkan dengan yakin
            tidak diubah.
          </p>
        </div>
        <form action={syncDriveMenuPhotos}>
          <button type="submit" className="btn bg-cabai px-4 py-2 text-white">
            Sinkronkan 10 foto sekarang
          </button>
        </form>
      </section>

      <details className="rounded-2xl border-4 border-kuah bg-white">
        <summary className="cursor-pointer p-4 font-bold">Unggah daftar harga (CSV)</summary>
        <div className="space-y-3 p-4 pt-0 text-sm">
          <ol className="list-decimal space-y-1 pl-5">
            <li><a href="/admin/export" className="font-semibold underline underline-offset-4">Unduh daftar menu saat ini</a> (CSV).</li>
            <li>Buka di Excel, ubah harga atau tambah baris baru. Kolom: nama/name dan harga/price wajib; kategori/category, deskripsi/description, tersedia/is_available, dan favorit/is_featured opsional.</li>
            <li>Simpan sebagai CSV, lalu unggah di bawah. Nama yang sama diperbarui, nama baru ditambahkan, foto tidak berubah.</li>
          </ol>
          <form action={importMenu} className="flex flex-wrap items-center gap-3">
            <input name="csv" type="file" accept=".csv,text/csv" required className="text-sm" />
            <button type="submit" className="btn bg-cabai px-4 py-2 text-white">Unggah dan perbarui</button>
          </form>
        </div>
      </details>

      <details className="rounded-2xl border-4 border-kuah bg-white">
        <summary className="cursor-pointer p-4 font-bold">Tambah menu baru</summary>
        <ItemForm categories={categories} />
      </details>

      {groups.map((g) => (
        <section key={g.name} className="space-y-3">
          <h2 className="font-display text-xl font-bold">{g.name} ({g.items.length})</h2>
          <ul className="space-y-3">
            {g.items.map((item) => (
              <li key={item.id} className="rounded-2xl border-4 border-kuah bg-white">
                <div className="flex flex-wrap items-center gap-3 p-4">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_url} alt="" className="h-12 w-12 rounded-lg border-2 border-kuah object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg border-2 border-dashed border-kuah" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{item.name}</p>
                    <p className="text-sm">
                      {rupiah(item.price)} · {item.is_available ? 'Tersedia' : 'Sold out'}
                      {item.is_featured ? ' · Favorit' : ''}
                    </p>
                  </div>
                  <form action={toggleAvailability}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="next" value={String(!item.is_available)} />
                    <button type="submit" className="rounded-lg border-2 border-kuah px-3 py-1.5 text-sm font-semibold">
                      {item.is_available ? 'Tandai sold out' : 'Tandai tersedia'}
                    </button>
                  </form>
                </div>
                <details className="border-t-2 border-kuah">
                  <summary className="cursor-pointer px-4 py-2 text-sm font-semibold">Edit harga, foto, deskripsi</summary>
                  <ItemForm categories={categories} item={item} />
                </details>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {items.length === 0 && (
        <p className="rounded-xl border-2 border-dashed border-kuah p-6">Belum ada menu. Tambahkan menu pertama di atas.</p>
      )}
    </main>
  );
}
