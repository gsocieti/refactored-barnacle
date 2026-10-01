import { addAdmin, removeAdmin } from './actions';
import AdminNav from '@/components/admin/AdminNav';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient, getAdminKeyConfigurationError } from '@/lib/supabase/admin';

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-');
const field = 'mt-1 w-full rounded-lg border-2 border-kuah bg-white px-3 py-2 font-normal';

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const me = await requireAdmin();
  const { notice } = await searchParams;

  const keyError = getAdminKeyConfigurationError();
  if (keyError) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 p-5">
        <AdminNav current="users" />
        <p className="rounded-xl border-4 border-kuah bg-white p-5">
          {keyError} Setelah mengganti nilainya di <code>.env.local</code>, restart <code>npm run dev</code>.
        </p>
      </main>
    );
  }

  const { data, error } = await createAdminClient().auth.admin.listUsers({ perPage: 200 });
  if (error) throw new Error(`Gagal memuat daftar admin: ${error.message}`);
  const admins = (data?.users ?? []).filter((u) => u.app_metadata?.role === 'admin');

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-5">
      <AdminNav current="users" />
      <h1 className="font-display text-3xl font-extrabold">Kelola Admin</h1>
      {notice && <p role="status" className="rounded-lg border-2 border-kuah bg-white p-3 text-sm">{notice}</p>}

      <details className="rounded-2xl border-4 border-kuah bg-white">
        <summary className="cursor-pointer p-4 font-bold">Tambah admin baru</summary>
        <form action={addAdmin} className="grid gap-3 p-4 pt-0 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Email
            <input name="email" type="email" required className={field} />
          </label>
          <label className="block text-sm font-semibold">
            Password (min. 8 karakter)
            <input name="password" type="password" required minLength={8} autoComplete="new-password" className={field} />
          </label>
          <button type="submit" className="btn bg-cabai text-white sm:col-span-2">Tambah admin</button>
          <p className="text-sm sm:col-span-2">Admin baru bisa langsung masuk di /admin/login dengan email dan password ini.</p>
        </form>
      </details>

      <ul className="space-y-3">
        {admins.map((u) => (
          <li key={u.id} className="rounded-2xl border-4 border-kuah bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold">{u.email}{u.id === me.id ? ' (Anda)' : ''}</p>
                <p className="text-sm">Dibuat {fmt(u.created_at)} · Login terakhir {fmt(u.last_sign_in_at)}</p>
              </div>
              {u.id !== me.id && (
                <details>
                  <summary className="cursor-pointer rounded-lg border-2 border-kuah px-3 py-1.5 text-sm font-semibold">Hapus</summary>
                  <form action={removeAdmin} className="mt-2 space-y-2 text-sm">
                    <input type="hidden" name="id" value={u.id} />
                    <p>Hapus akun {u.email}? Aksi ini tidak bisa dibatalkan.</p>
                    <button type="submit" className="btn bg-cabai px-4 py-1.5 text-white">Ya, hapus</button>
                  </form>
                </details>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
