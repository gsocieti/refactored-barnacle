import { getHistoryDateBounds, ORDER_STATUS_LABELS, parseHistoryRange } from '@/lib/order-history';
import { PAYMENT_METHODS } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';

const pageSize = 500;

type ExportOrder = {
  id: string;
  table_number: number | null;
  status: string;
  payment_status: string;
  payment_method: string | null;
  total_amount: number;
  created_at: string;
  order_items: { quantity: number }[];
};

const paymentStatusLabels: Record<string, string> = {
  unpaid: 'Belum dibayar',
  pending: 'Menunggu pembayaran',
  paid: 'Lunas',
  failed: 'Gagal',
  refunded: 'Dikembalikan',
};

function csvTextCell(value: string) {
  const safeText = /^[\s\u0000-\u001f]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeText.replace(/"/g, '""')}"`;
}

function jakartaDateTimeParts(value: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? '';
  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    time: `${part('hour')}:${part('minute')}:${part('second')}`,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = parseHistoryRange(searchParams.get('range') ?? undefined);
  const bounds = getHistoryDateBounds(range);
  const supabase = await createClient();
  const orders: ExportOrder[] = [];

  for (let offset = 0; ; offset += pageSize) {
    let query = supabase
      .from('orders')
      .select('id, table_number, status, payment_status, payment_method, total_amount, created_at, order_items(quantity)')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (bounds) query = query.gte('created_at', bounds.start).lt('created_at', bounds.end);

    const result = await query;
    let rows = result.data as ExportOrder[] | null;
    let error = result.error;
    if (error && ['42703', 'PGRST204'].includes(error.code) && /payment_method/i.test(error.message)) {
      let fallbackQuery = supabase
        .from('orders')
        .select('id, table_number, status, payment_status, total_amount, created_at, order_items(quantity)')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);
      if (bounds) fallbackQuery = fallbackQuery.gte('created_at', bounds.start).lt('created_at', bounds.end);
      const fallback = await fallbackQuery;
      rows = fallback.data as ExportOrder[] | null;
      error = fallback.error;
    }
    if (error) throw new Error(`Gagal mengekspor riwayat transaksi: ${error.message}`);

    orders.push(...(rows ?? []));
    if (!rows || rows.length < pageSize) break;
  }

  const lines = [
    [
      'ID Pesanan',
      'Tanggal (WIB)',
      'Waktu (WIB)',
      'Tipe Pesanan',
      'Jumlah Item',
      'Total (Rp)',
      'Metode Pembayaran',
      'Status Pesanan',
      'Status Pembayaran',
    ]
      .map(csvTextCell)
      .join(';'),
    ...orders.map((order) => {
      const paymentMethod = PAYMENT_METHODS.find((method) => method.value === order.payment_method);
      const itemCount = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
      const { date, time } = jakartaDateTimeParts(order.created_at);
      return [
        `#${order.id.slice(0, 8).toUpperCase()}`,
        date,
        time,
        order.table_number === null ? 'Takeaway' : `Meja ${order.table_number}`,
        itemCount,
        order.total_amount,
        paymentMethod?.label ?? order.payment_method ?? 'Metode belum dicatat',
        ORDER_STATUS_LABELS[order.status] ?? order.status,
        paymentStatusLabels[order.payment_status] ?? order.payment_status,
      ]
        .map((value) => typeof value === 'number' ? String(value) : csvTextCell(value))
        .join(';');
    }),
  ];
  const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta' }).format(new Date());

  return new Response(`\uFEFF${lines.join('\r\n')}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="riwayat-transaksi-${range}-${date}.csv"`,
    },
  });
}
