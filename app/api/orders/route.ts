import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  ORDER_MAX_DISTINCT_ITEMS,
  ORDER_MAX_QUANTITY,
  ORDER_MAX_TOTAL,
  PAYMENT_METHODS,
  type PaymentMethod,
} from '@/lib/types';

const paymentMethodValues = new Set<string>(PAYMENT_METHODS.map((method) => method.value));
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Data pesanan tidak valid.' }, { status: 400 });
  }

  if (
    !isRecord(body) ||
    !Array.isArray(body.items) ||
    body.items.length === 0 ||
    body.items.length > ORDER_MAX_DISTINCT_ITEMS
  ) {
    return NextResponse.json({ error: 'Keranjang pesanan kosong atau tidak valid.' }, { status: 400 });
  }

  const tableNumber = body.tableNumber;
  if (
    tableNumber !== null &&
    tableNumber !== undefined &&
    (!Number.isSafeInteger(tableNumber) || Number(tableNumber) < 1 || Number(tableNumber) > 2147483647)
  ) {
    return NextResponse.json({ error: 'Nomor meja tidak valid.' }, { status: 400 });
  }
  if (typeof body.paymentMethod !== 'string' || !paymentMethodValues.has(body.paymentMethod)) {
    return NextResponse.json({ error: 'Metode pembayaran tidak valid.' }, { status: 400 });
  }

  const quantities = new Map<string, number>();
  for (const entry of body.items) {
    if (
      !isRecord(entry) ||
      typeof entry.menuItemId !== 'string' ||
      !uuidPattern.test(entry.menuItemId) ||
      !Number.isInteger(entry.quantity) ||
      Number(entry.quantity) < 1 ||
      Number(entry.quantity) > ORDER_MAX_QUANTITY
    ) {
      return NextResponse.json({ error: 'Daftar menu atau jumlah pesanan tidak valid.' }, { status: 400 });
    }
    const quantity = (quantities.get(entry.menuItemId) ?? 0) + Number(entry.quantity);
    if (quantity > ORDER_MAX_QUANTITY) {
      return NextResponse.json({ error: 'Jumlah setiap menu maksimal 99.' }, { status: 400 });
    }
    quantities.set(entry.menuItemId, quantity);
  }

  try {
    const supabase = createAdminClient();
    const menuItemIds = [...quantities.keys()];
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, price, is_available')
      .in('id', menuItemIds);
    if (menuError) throw new Error(`Gagal memeriksa menu: ${menuError.message}`);
    if (!menuItems || menuItems.length !== menuItemIds.length) {
      return NextResponse.json({ error: 'Sebagian menu tidak lagi tersedia.' }, { status: 409 });
    }
    if (menuItems.some((item) => !item.is_available)) {
      return NextResponse.json({ error: 'Sebagian menu baru saja habis. Perbarui keranjang Anda.' }, { status: 409 });
    }

    const priceById = new Map(menuItems.map((item) => [item.id, item.price]));
    const orderItems: { menu_item_id: string; quantity: number; price_at_time: number }[] = [];
    let totalAmount = 0;
    for (const [menuItemId, quantity] of quantities) {
      const price = priceById.get(menuItemId);
      if (price === undefined) throw new Error('Harga menu tidak ditemukan.');
      totalAmount += price * quantity;
      orderItems.push({ menu_item_id: menuItemId, quantity, price_at_time: price });
    }
    if (!Number.isSafeInteger(totalAmount) || totalAmount > ORDER_MAX_TOTAL) {
      return NextResponse.json({ error: 'Total pesanan melebihi batas yang dapat diproses.' }, { status: 400 });
    }

    if (tableNumber !== null && tableNumber !== undefined) {
      const { error: tableError } = await supabase
        .from('tables')
        .upsert({ table_number: tableNumber }, { onConflict: 'table_number', ignoreDuplicates: true });
      if (tableError) throw new Error(`Gagal menyiapkan meja: ${tableError.message}`);
    }

    const paymentMethod = body.paymentMethod as PaymentMethod;
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        table_number: tableNumber ?? null,
        status: 'pending',
        total_amount: totalAmount,
        payment_status: 'pending',
        payment_method: paymentMethod,
      })
      .select('id')
      .single();
    if (
      orderError &&
      /payment_method/i.test(orderError.message) &&
      (['42703', 'PGRST204'].includes(orderError.code) ||
        /could not find|does not exist|schema cache/i.test(orderError.message))
    ) {
      console.error('Pembuatan pesanan gagal: skema orders.payment_method belum diterapkan.');
      return NextResponse.json(
        { error: 'Database belum diperbarui untuk pembayaran. Minta admin menjalankan supabase/admin-upgrade.sql di Supabase SQL Editor.' },
        { status: 503 },
      );
    }
    if (orderError) throw new Error(`Gagal menyimpan pesanan: ${orderError.message}`);

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems.map((item) => ({ ...item, order_id: order.id })));
    if (itemsError) {
      const { error: cleanupError } = await supabase.from('orders').delete().eq('id', order.id);
      if (cleanupError) {
        console.error(`Gagal membersihkan pesanan ${order.id} setelah detail gagal disimpan:`, cleanupError);
      }
      throw new Error(`Gagal menyimpan rincian pesanan: ${itemsError.message}`);
    }

    return NextResponse.json({ orderId: order.id, totalAmount }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan pesanan.';
    console.error('Pembuatan pesanan gagal:', message);
    return NextResponse.json(
      { error: 'Pesanan gagal disimpan. Silakan ulangi atau minta bantuan kasir.' },
      { status: 500 },
    );
  }
}
