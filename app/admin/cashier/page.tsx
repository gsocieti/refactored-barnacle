import { markOrderPaid } from '@/app/admin/actions';
import AdminNav from '@/components/admin/AdminNav';
import OrderControls from '@/components/admin/OrderControls';
import { formatJakartaDateTime } from '@/lib/date-format';
import { PAYMENT_METHODS } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';

const rupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const orderStatus: Record<string, string> = {
  pending: 'Menunggu',
  confirmed: 'Dikonfirmasi',
  preparing: 'Disiapkan',
  served: 'Disajikan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const paymentStatus: Record<string, string> = {
  unpaid: 'Belum dibayar',
  pending: 'Menunggu pembayaran',
  paid: 'Lunas',
  failed: 'Gagal',
  refunded: 'Dikembalikan',
};

type CashierOrder = {
  id: string;
  table_number: number | null;
  status: string;
  payment_status: string;
  payment_method: string | null;
  total_amount: number;
  created_at: string;
  order_items: {
    quantity: number;
    price_at_time: number;
    menu_items: { name: string } | null;
  }[];
};

type Approval = { order_id: string; actor_email: string; created_at: string };

function isAuditUnavailable(error: { code: string; message: string }) {
  return ['42P01', 'PGRST205'].includes(error.code) || /admin_activity_logs/i.test(error.message);
}

function jakartaDayBounds() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? '';
  const date = `${part('year')}-${part('month')}-${part('day')}`;
  const start = Date.parse(`${date}T00:00:00+07:00`);
  return {
    start: new Date(start).toISOString(),
    end: new Date(start + 24 * 60 * 60 * 1000).toISOString(),
  };
}

export default async function CashierPage() {
  const supabase = await createClient();
  const { start, end } = jakartaDayBounds();
  const orders: CashierOrder[] = [];
  let paymentMethodColumnMissing = false;
  let auditLogUnavailable = false;

  for (let offset = 0; ; offset += 500) {
    const result = await supabase
      .from('orders')
      .select('id, table_number, status, payment_status, payment_method, total_amount, created_at, order_items(quantity, price_at_time, menu_items(name))')
      .gte('created_at', start)
      .lt('created_at', end)
      .order('created_at', { ascending: false })
      .range(offset, offset + 499);
    let data = result.data as CashierOrder[] | null;
    let error = result.error;
    if (
      error &&
      ['42703', 'PGRST204'].includes(error.code) &&
      /payment_method/i.test(error.message)
    ) {
      paymentMethodColumnMissing = true;
      const fallback = await supabase
        .from('orders')
        .select('id, table_number, status, payment_status, total_amount, created_at, order_items(quantity, price_at_time, menu_items(name))')
        .gte('created_at', start)
        .lt('created_at', end)
        .order('created_at', { ascending: false })
        .range(offset, offset + 499);
      data = fallback.data as CashierOrder[] | null;
      error = fallback.error;
    }
    if (error) throw new Error(`Gagal memuat pesanan kasir: ${error.message}`);
    orders.push(...(data ?? []));
    if (!data || data.length < 500) break;
  }

  const activeOrders = orders.filter((order) => order.status !== 'cancelled');
  const totalRevenue = activeOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const totalItems = activeOrders.reduce(
    (sum, order) => sum + order.order_items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  );
  const approvals = new Map<string, Approval>();
  const orderIds = orders.map((order) => order.id);
  if (orderIds.length > 0) {
    const { data, error } = await supabase
      .from('admin_activity_logs')
      .select('order_id, actor_email, created_at')
      .eq('action', 'approved')
      .in('order_id', orderIds)
      .order('created_at', { ascending: true });
    if (error && isAuditUnavailable(error)) {
      auditLogUnavailable = true;
    } else if (error) {
      throw new Error(`Gagal memuat waktu persetujuan: ${error.message}`);
    } else {
      for (const approval of data ?? []) {
        if (!approvals.has(approval.order_id)) approvals.set(approval.order_id, approval);
      }
    }
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-5">
      <AdminNav current="cashier" />
      <div>
        <h1 className="font-display text-3xl font-extrabold">Kasir</h1>
        <p className="mt-1 text-sm text-kuah/70">Ringkasan pesanan hari ini (WIB).</p>
      </div>
      {paymentMethodColumnMissing && (
        <p role="status" className="rounded-xl border-2 border-kuah bg-white p-4 text-sm leading-6">
          Kolom metode pembayaran belum tersedia di database. Pesanan tetap ditampilkan; jalankan <code>supabase/admin-upgrade.sql</code> untuk mencatat metode pembayaran.
        </p>
      )}
      {auditLogUnavailable && (
        <p role="status" className="rounded-xl border-2 border-kuah bg-white p-4 text-sm leading-6">
          Log persetujuan admin belum tersedia. Jalankan <code>supabase/admin-upgrade.sql</code> untuk mengaktifkan cap waktu approval dan audit.
        </p>
      )}

      <section aria-label="Ringkasan penjualan hari ini" className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border-4 border-kuah bg-white p-5">
          <p className="text-sm font-bold text-kuah/70">Jumlah pesanan (tidak termasuk batal)</p>
          <p className="mt-2 font-display text-3xl font-extrabold">{activeOrders.length}</p>
        </article>
        <article className="rounded-2xl border-4 border-kuah bg-white p-5">
          <p className="text-sm font-bold text-kuah/70">Jumlah item (tidak termasuk batal)</p>
          <p className="mt-2 font-display text-3xl font-extrabold">{totalItems}</p>
        </article>
        <article className="rounded-2xl border-4 border-kuah bg-white p-5">
          <p className="text-sm font-bold text-kuah/70">Total harga pesanan (tidak termasuk batal)</p>
          <p className="mt-2 font-display text-2xl font-extrabold">{rupiah(totalRevenue)}</p>
        </article>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">Pesanan hari ini ({orders.length})</h2>
        {orders.length === 0 ? (
          <p className="rounded-2xl border-4 border-dashed border-kuah bg-white p-6">Belum ada pesanan hari ini.</p>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => {
              const method = PAYMENT_METHODS.find((entry) => entry.value === order.payment_method);
              const quantity = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
              const approval = approvals.get(order.id);
              return (
                <li key={order.id} className="rounded-2xl border-4 border-kuah bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">
                        Pesanan #{order.id.slice(0, 8).toUpperCase()}
                        {order.table_number === null ? ' · Takeaway' : ` · Meja ${order.table_number}`}
                      </p>
                      <p className="mt-1 text-sm">
                        {formatJakartaDateTime(order.created_at)}
                        {' · '}{quantity} item · {method?.label ?? order.payment_method ?? 'Metode belum dicatat'}
                      </p>
                      {approval && (
                        <p className="mt-1 text-sm text-kuah/70">
                          Disetujui {formatJakartaDateTime(approval.created_at)} oleh {approval.actor_email}
                        </p>
                      )}
                      <p className="mt-1 text-sm font-semibold">
                        Status: {orderStatus[order.status] ?? order.status} · {paymentStatus[order.payment_status] ?? order.payment_status}
                      </p>
                      <ul className="mt-3 space-y-1 text-sm">
                        {order.order_items.map((item, index) => (
                          <li key={`${order.id}-${index}`} className="flex flex-wrap justify-between gap-x-4">
                            <span>{item.menu_items?.name ?? 'Menu'} × {item.quantity}</span>
                            <span className="text-kuah/65">
                              {rupiah(item.price_at_time)} / item · {rupiah(item.price_at_time * item.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="font-display text-lg font-extrabold">{rupiah(order.total_amount)}</p>
                  </div>
                  {!auditLogUnavailable && order.payment_status !== 'paid' && order.payment_status !== 'refunded' && order.status !== 'cancelled' && (
                    <form action={markOrderPaid} className="mt-4">
                      <input type="hidden" name="id" value={order.id} />
                      <button type="submit" className="btn bg-cabai px-4 py-2 text-sm text-white">Konfirmasi pembayaran diterima</button>
                    </form>
                  )}
                  <OrderControls
                    orderId={order.id}
                    status={order.status}
                    paymentMethod={order.payment_method}
                    paymentMethodAvailable={!paymentMethodColumnMissing}
                    canCancel={order.payment_status !== 'paid' && order.payment_status !== 'refunded'}
                    enabled={!auditLogUnavailable}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <aside className="rounded-2xl border-2 border-kuah/20 bg-white p-4 text-sm leading-6 text-kuah/70">
        QR meja diarahkan ke alamat <code className="rounded bg-mie px-1">/?table=1</code>; ganti angka sesuai nomor meja. Transfer dan pembayaran digital hanya tercatat sebagai metode pilihan, lalu kasir menandai lunas setelah dana diterima.
      </aside>
    </main>
  );
}
