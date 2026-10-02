'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { PAYMENT_METHODS } from '@/lib/types';

const text = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim();

function refresh() {
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/cashier');
  revalidatePath('/admin/history');
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

export async function markOrderPaid(formData: FormData) {
  await requireAdmin();
  const id = text(formData, 'id');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error('ID pesanan tidak valid');
  }

  const supabase = await createClient();
  await requireOrderAuditLog(supabase);
  const { data, error } = await supabase
    .from('orders')
    .update({ payment_status: 'paid', status: 'confirmed' })
    .eq('id', id)
    .neq('payment_status', 'paid')
    .neq('payment_status', 'refunded')
    .neq('status', 'cancelled')
    .select('id')
    .maybeSingle();
  if (error) throw new Error(`Gagal mengonfirmasi pembayaran: ${error.message}`);
  if (!data) throw new Error('Pesanan tidak ditemukan atau sudah lunas');
  revalidatePath('/admin/cashier');
  revalidatePath('/admin/history');
}

const orderStatuses = ['pending', 'confirmed', 'preparing', 'served', 'completed'] as const;
const orderIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validatedOrderId(formData: FormData) {
  const id = text(formData, 'id');
  if (!orderIdPattern.test(id)) throw new Error('ID pesanan tidak valid');
  return id;
}

async function requireOrderAuditLog(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { error } = await supabase.from('admin_activity_logs').select('id', { head: true }).limit(1);
  if (error) {
    throw new Error(`Log audit belum aktif (${error.message}). Jalankan supabase/admin-upgrade.sql sebelum mengubah pesanan.`);
  }
}

export async function editOrder(formData: FormData) {
  await requireAdmin();
  const id = validatedOrderId(formData);
  const status = text(formData, 'status');
  const paymentMethod = text(formData, 'payment_method');
  if (!orderStatuses.includes(status as (typeof orderStatuses)[number])) {
    throw new Error('Status pesanan tidak valid');
  }
  if (paymentMethod && !PAYMENT_METHODS.some((method) => method.value === paymentMethod)) {
    throw new Error('Metode pembayaran tidak valid');
  }

  const supabase = await createClient();
  await requireOrderAuditLog(supabase);
  const { data, error } = await supabase
    .from('orders')
    .update({ status, ...(paymentMethod ? { payment_method: paymentMethod } : {}) })
    .eq('id', id)
    .neq('status', 'cancelled')
    .select('id')
    .maybeSingle();
  if (error) throw new Error(`Gagal mengedit pesanan: ${error.message}`);
  if (!data) throw new Error('Pesanan tidak ditemukan atau sudah dibatalkan');
  revalidatePath('/admin/cashier');
  revalidatePath('/admin/history');
}

export async function deleteOrder(formData: FormData) {
  await requireAdmin();
  const id = validatedOrderId(formData);
  const supabase = await createClient();
  await requireOrderAuditLog(supabase);
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .neq('status', 'cancelled')
    .neq('payment_status', 'paid')
    .neq('payment_status', 'refunded')
    .select('id')
    .maybeSingle();
  if (error) throw new Error(`Gagal membatalkan pesanan: ${error.message}`);
  if (!data) throw new Error('Pesanan tidak ditemukan, sudah batal, atau sudah dibayar');
  revalidatePath('/admin/cashier');
  revalidatePath('/admin/history');
}
