import Link from 'next/link';
import AdminNav from '@/components/admin/AdminNav';
import OrderControls from '@/components/admin/OrderControls';
import { formatJakartaDateTime } from '@/lib/date-format';
import { PAYMENT_METHODS } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';

const pageSize = 25;
const logPageSize = 25;

const rupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

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

const auditAction: Record<string, string> = {
  approved: 'Menyetujui pembayaran',
  edited: 'Mengedit pesanan',
  deleted: 'Membatalkan/menghapus pesanan',
};

const auditFields: Record<string, string> = {
  status: 'Status pesanan',
  payment_status: 'Status pembayaran',
  payment_method: 'Metode pembayaran',
  table_number: 'Nomor meja',
  total_amount: 'Total',
};

type HistoryOrder = {
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

type ActivityLog = {
  id: number;
  order_id: string;
  actor_email: string;
  action: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
};

function isAuditUnavailable(error: { code: string; message: string }) {
  return ['42P01', 'PGRST205'].includes(error.code) || /admin_activity_logs/i.test(error.message);
}

function auditValue(field: string, value: unknown) {
  if (value === null || value === undefined) return '-';
  if (field === 'total_amount' && typeof value === 'number') return rupiah(value);
  if (field === 'status' && typeof value === 'string') return orderStatus[value] ?? value;
  if (field === 'payment_status' && typeof value === 'string') return paymentStatus[value] ?? value;
  if (field === 'payment_method' && typeof value === 'string') {
    return PAYMENT_METHODS.find((method) => method.value === value)?.label ?? value;
  }
  return String(value);
}

function HistoryPagination({
  page,
  pageCount,
  parameter,
}: {
  page: number;
  pageCount: number;
  parameter: 'page' | 'logPage';
}) {
  if (pageCount < 2) return null;
  const href = (target: number) => `/admin/history?${parameter}=${target}`;
  return (
    <nav aria-label={parameter === 'page' ? 'Navigasi riwayat transaksi' : 'Navigasi log admin'} className="flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={href(page - 1)} className="rounded-lg border-2 border-kuah bg-white px-4 py-2 text-sm font-bold">Sebelumnya</Link>
      ) : <span />}
      <p className="text-sm font-semibold">Halaman {page} dari {pageCount}</p>
      {page < pageCount ? (
        <Link href={href(page + 1)} className="rounded-lg border-2 border-kuah bg-white px-4 py-2 text-sm font-bold">Berikutnya</Link>
      ) : <span />}
    </nav>
  );
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; logPage?: string }>;
}) {
  const params = await searchParams;
  const parsedPage = Number(params.page ?? 1);
  const parsedLogPage = Number(params.logPage ?? 1);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const logPage = Number.isSafeInteger(parsedLogPage) && parsedLogPage > 0 ? parsedLogPage : 1;
  const supabase = await createClient();

  const { count: transactionCount, error: countError } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true });
  if (countError) throw new Error(`Gagal menghitung riwayat transaksi: ${countError.message}`);
  const totalTransactions = transactionCount ?? 0;
  const transactionPageCount = Math.max(1, Math.ceil(totalTransactions / pageSize));
  const transactionOffset = Math.min((page - 1) * pageSize, Math.max(0, totalTransactions - 1));

  const result = await supabase
    .from('orders')
    .select('id, table_number, status, payment_status, payment_method, total_amount, created_at, order_items(quantity, price_at_time, menu_items(name))')
    .order('created_at', { ascending: false })
    .range(transactionOffset, transactionOffset + pageSize - 1);
  let transactionRows = result.data as HistoryOrder[] | null;
  let paymentMethodAvailable = true;
  let transactionError = result.error;
  if (
    transactionError &&
    ['42703', 'PGRST204'].includes(transactionError.code) &&
    /payment_method/i.test(transactionError.message)
  ) {
    paymentMethodAvailable = false;
    const fallback = await supabase
      .from('orders')
      .select('id, table_number, status, payment_status, total_amount, created_at, order_items(quantity, price_at_time, menu_items(name))')
      .order('created_at', { ascending: false })
      .range(transactionOffset, transactionOffset + pageSize - 1);
    transactionRows = fallback.data as HistoryOrder[] | null;
    transactionError = fallback.error;
  }
  if (transactionError) throw new Error(`Gagal memuat riwayat transaksi: ${transactionError.message}`);
  const transactions = transactionRows ?? [];

  const { count: activityCount, error: activityCountError } = await supabase
    .from('admin_activity_logs')
    .select('id', { count: 'exact', head: true });
  let auditUnavailable = false;
  let activityTotal = 0;
  let activities: ActivityLog[] = [];
  if (activityCountError && isAuditUnavailable(activityCountError)) {
    auditUnavailable = true;
  } else if (activityCountError) {
    throw new Error(`Gagal menghitung log aktivitas admin: ${activityCountError.message}`);
  } else {
    activityTotal = activityCount ?? 0;
    const activityPageCount = Math.max(1, Math.ceil(activityTotal / logPageSize));
    const activityOffset = Math.min((logPage - 1) * logPageSize, Math.max(0, activityTotal - 1));
    const { data, error } = await supabase
      .from('admin_activity_logs')
      .select('id, order_id, actor_email, action, old_data, new_data, created_at')
      .order('created_at', { ascending: false })
      .range(activityOffset, activityOffset + logPageSize - 1);
    if (error && isAuditUnavailable(error)) {
      auditUnavailable = true;
    } else if (error) {
      throw new Error(`Gagal memuat log aktivitas admin: ${error.message}`);
    } else {
      activities = (data ?? []) as ActivityLog[];
    }
    if (logPage > activityPageCount) activities = [];
  }

  const approvals = new Map<string, ActivityLog>();
  if (transactions.length > 0 && !auditUnavailable) {
    const { data, error } = await supabase
      .from('admin_activity_logs')
      .select('id, order_id, actor_email, action, old_data, new_data, created_at')
      .eq('action', 'approved')
      .in('order_id', transactions.map((order) => order.id))
      .order('created_at', { ascending: true });
    if (error && isAuditUnavailable(error)) {
      auditUnavailable = true;
    } else if (error) {
      throw new Error(`Gagal memuat timestamp approval: ${error.message}`);
    } else {
      for (const approval of (data ?? []) as ActivityLog[]) {
        if (!approvals.has(approval.order_id)) approvals.set(approval.order_id, approval);
      }
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-5">
      <AdminNav current="history" />
      <header>
        <h1 className="font-display text-3xl font-extrabold">Riwayat transaksi & log admin</h1>
        <p className="mt-1 text-sm text-kuah/70">Tanggal dan waktu ditampilkan dalam WIB (Asia/Jakarta).</p>
      </header>

      {!paymentMethodAvailable && (
        <p role="status" className="rounded-xl border-2 border-kuah bg-white p-4 text-sm leading-6">
          Kolom metode pembayaran belum tersedia. Jalankan <code>supabase/admin-upgrade.sql</code> untuk mengaktifkan pencatatan metode pembayaran.
        </p>
      )}
      {auditUnavailable && (
        <p role="status" className="rounded-xl border-2 border-kuah bg-white p-4 text-sm leading-6">
          Tabel audit belum tersedia. Jalankan <code>supabase/admin-upgrade.sql</code> di Supabase SQL Editor untuk menyimpan timestamp approval, edit, dan pembatalan admin.
        </p>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl font-bold">Riwayat transaksi</h2>
            <p className="text-sm text-kuah/70">{totalTransactions} transaksi tersimpan</p>
          </div>
          <p className="text-sm">Urutan terbaru terlebih dahulu</p>
        </div>
        {transactions.length === 0 ? (
          <p className="rounded-2xl border-4 border-dashed border-kuah bg-white p-6">Belum ada transaksi.</p>
        ) : (
          <ul className="space-y-3">
            {transactions.map((order) => {
              const method = PAYMENT_METHODS.find((entry) => entry.value === order.payment_method);
              const quantity = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
              const approval = approvals.get(order.id);
              return (
                <li key={order.id} className="rounded-2xl border-4 border-kuah bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">
                        Pesanan #{order.id.slice(0, 8).toUpperCase()}
                        {order.table_number === null ? ' · Takeaway' : ` · Meja ${order.table_number}`}
                      </p>
                      <p className="mt-1 text-sm">
                        Dibuat: {formatJakartaDateTime(order.created_at)}
                        {' · '}{quantity} item · {method?.label ?? order.payment_method ?? 'Metode belum dicatat'}
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        Status: {orderStatus[order.status] ?? order.status} · {paymentStatus[order.payment_status] ?? order.payment_status}
                      </p>
                      {approval && (
                        <p className="mt-1 text-sm font-semibold text-green-800">
                          Disetujui: {formatJakartaDateTime(approval.created_at)} oleh {approval.actor_email}
                        </p>
                      )}
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
                  <OrderControls
                    orderId={order.id}
                    status={order.status}
                    paymentMethod={order.payment_method}
                    paymentMethodAvailable={paymentMethodAvailable}
                    canCancel={order.payment_status !== 'paid' && order.payment_status !== 'refunded'}
                    enabled={!auditUnavailable}
                  />
                </li>
              );
            })}
          </ul>
        )}
        <HistoryPagination page={page} pageCount={transactionPageCount} parameter="page" />
      </section>

      <section className="space-y-4 border-t-4 border-kuah/15 pt-6">
        <div>
          <h2 className="font-display text-2xl font-bold">Log aktivitas admin</h2>
          <p className="text-sm text-kuah/70">
            Timestamp persetujuan, perubahan, dan pembatalan disimpan permanen bersama akun admin yang melakukannya.
          </p>
        </div>
        {activities.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-kuah bg-white p-5 text-sm">
            {auditUnavailable ? 'Log tersedia setelah skema audit diaktifkan.' : 'Belum ada aktivitas admin yang tercatat.'}
          </p>
        ) : (
          <ul className="space-y-3">
            {activities.map((activity) => {
              const changedFields = Object.keys(auditFields).filter(
                (field) => activity.old_data?.[field] !== activity.new_data?.[field],
              );
              return (
                <li key={activity.id} className="rounded-2xl border-2 border-kuah/20 bg-white p-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <p className="font-bold">
                        {auditAction[activity.action] ?? activity.action}
                        {' · '}Pesanan #{activity.order_id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="mt-1 text-sm">{activity.actor_email}</p>
                    </div>
                    <time className="text-sm font-semibold">{formatJakartaDateTime(activity.created_at)}</time>
                  </div>
                  {changedFields.length > 0 && (
                    <details className="mt-3 text-sm">
                      <summary className="cursor-pointer font-semibold">Lihat detail perubahan</summary>
                      <ul className="mt-2 space-y-1 pl-4">
                        {changedFields.map((field) => (
                          <li key={field}>
                            {auditFields[field]}: {auditValue(field, activity.old_data?.[field])}
                            {' → '}{auditValue(field, activity.new_data?.[field])}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {!auditUnavailable && (
          <HistoryPagination
            page={logPage}
            pageCount={Math.max(1, Math.ceil(activityTotal / logPageSize))}
            parameter="logPage"
          />
        )}
      </section>
    </main>
  );
}
