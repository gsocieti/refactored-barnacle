import { deleteMenuItem, saveMenuItem } from '@/app/admin/actions';
import ImageField from './ImageField';
import type { Category, MenuItem } from '@/lib/types';

const field = 'mt-1 w-full rounded-lg border-2 border-kuah bg-white px-3 py-2 font-normal';
const label = 'block text-sm font-semibold';

export default function ItemForm({ categories, item }: { categories: Category[]; item?: MenuItem }) {
  return (
    <div className="space-y-3 p-4">
      <form action={saveMenuItem} className="grid gap-3 sm:grid-cols-2">
        {item && <input type="hidden" name="id" value={item.id} />}
        <label className={`${label} sm:col-span-2`}>
          Nama menu
          <input name="name" required defaultValue={item?.name} className={field} />
        </label>
        <label className={label}>
          Harga (Rp)
          <input name="price" type="number" min={0} step={500} required defaultValue={item?.price} className={field} />
        </label>
        <label className={label}>
          Kategori
          <select name="category_id" defaultValue={item?.category_id ?? ''} className={field}>
            <option value="">Tanpa kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className={`${label} sm:col-span-2`}>
          Deskripsi
          <textarea name="description" rows={2} defaultValue={item?.description ?? ''} className={field} />
        </label>
        <ImageField current={item?.image_url ?? null} />
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
          <input name="is_available" type="checkbox" defaultChecked={item?.is_available ?? true} className="h-5 w-5" />
          Tersedia (hilangkan centang jika sold out)
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
          <input name="is_featured" type="checkbox" defaultChecked={item?.is_featured ?? false} className="h-5 w-5" />
          Tandai sebagai favorit
        </label>
        <button type="submit" className="btn bg-cabai text-white sm:col-span-2">
          {item ? 'Simpan perubahan' : 'Tambah menu'}
        </button>
      </form>
      {item && (
        <form action={deleteMenuItem}>
          <input type="hidden" name="id" value={item.id} />
          <button type="submit" className="text-sm font-semibold text-cabai underline underline-offset-4">
            Hapus menu ini
          </button>
        </form>
      )}
    </div>
  );
}
