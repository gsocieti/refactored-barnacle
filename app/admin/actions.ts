'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const text = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim();

function refresh() {
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: text(formData, 'email'),
    password: text(formData, 'password'),
  });
  if (error) redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  if (data.user?.app_metadata?.role !== 'admin') {
    await supabase.auth.signOut();
    redirect(`/admin/login?error=${encodeURIComponent('Akun ini belum berstatus admin')}`);
  }
  redirect('/admin');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

export async function saveMenuItem(formData: FormData) {
  const supabase = await createClient();
  const id = text(formData, 'id');
  let imageUrl = text(formData, 'image_url') || null;

  const file = formData.get('image');
  if (file instanceof File && file.size > 0) {
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, '_')}`;
    const { error } = await supabase.storage.from('menu-images').upload(path, file, { contentType: file.type });
    if (error) throw new Error(`Upload foto gagal: ${error.message}`);
    imageUrl = supabase.storage.from('menu-images').getPublicUrl(path).data.publicUrl;
  }

  const price = Number(text(formData, 'price'));
  if (!Number.isFinite(price) || price < 0) throw new Error('Harga tidak valid');

  const payload = {
    name: text(formData, 'name'),
    description: text(formData, 'description') || null,
    price: Math.round(price),
    category_id: text(formData, 'category_id') || null,
    image_url: imageUrl,
    is_available: formData.get('is_available') === 'on',
    is_featured: formData.get('is_featured') === 'on',
  };

  const { error } = id
    ? await supabase.from('menu_items').update(payload).eq('id', id)
    : await supabase.from('menu_items').insert(payload);
  if (error) throw new Error(error.message);
  refresh();
}

export async function toggleAvailability(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('menu_items')
    .update({ is_available: text(formData, 'next') === 'true' })
    .eq('id', text(formData, 'id'));
  if (error) throw new Error(error.message);
  refresh();
}

export async function deleteMenuItem(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from('menu_items').delete().eq('id', text(formData, 'id'));
  if (error) throw new Error(error.message);
  refresh();
}
