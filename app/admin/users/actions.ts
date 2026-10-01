'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient, getAdminKeyConfigurationError } from '@/lib/supabase/admin';

function back(msg: string): never {
  revalidatePath('/admin/users');
  redirect(`/admin/users?notice=${encodeURIComponent(msg)}`);
}

export async function addAdmin(formData: FormData) {
  await requireAdmin();
  const keyError = getAdminKeyConfigurationError();
  if (keyError) return back(`Konfigurasi Supabase: ${keyError}`);

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!email) return back('Email wajib diisi');
  if (password.length < 8) return back('Password minimal 8 karakter');
  const { error } = await createAdminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: 'admin' },
  });
  if (error) return back(`Gagal menambah admin: ${error.message}`);
  return back(`Admin ${email} ditambahkan`);
}

export async function removeAdmin(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (id === me.id) return back('Anda tidak bisa menghapus akun sendiri');
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.getUserById(id);
  if (data.user?.app_metadata?.role !== 'admin') return back('Pengguna ini bukan admin');
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return back(`Gagal menghapus: ${error.message}`);
  return back('Admin dihapus');
}
