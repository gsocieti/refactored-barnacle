import { deleteOrder, editOrder } from '@/app/admin/actions';
import { PAYMENT_METHODS } from '@/lib/types';

const statuses = [
  ['pending', 'Menunggu'],
  ['confirmed', 'Dikonfirmasi'],
  ['preparing', 'Disiapkan'],
  ['served', 'Disajikan'],
  ['completed', 'Selesai'],
] as const;

export default function OrderControls({
  orderId,
  status,
  paymentMethod,
  paymentMethodAvailable,
  canCancel,
  enabled,
}: {
  orderId: string;
  status: string;
  paymentMethod: string | null;
  paymentMethodAvailable: boolean;
  canCancel: boolean;
  enabled: boolean;
}) {
  if (!enabled) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {status !== 'cancelled' && (
        <details>
          <summary className="cursor-pointer rounded-lg border-2 border-kuah px-3 py-2 text-sm font-semibold">
            Edit pesanan
          </summary>
          <form action={editOrder} className="mt-3 grid gap-3 rounded-xl border-2 border-kuah/15 bg-mie/40 p-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={orderId} />
            <label className="text-sm font-bold">
              Status pesanan
              <select name="status" defaultValue={status} className="mt-1 w-full rounded-lg border-2 border-kuah bg-white px-3 py-2 font-normal">
                {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            {paymentMethodAvailable && (
              <label className="text-sm font-bold">
                Metode pembayaran
                <select name="payment_method" defaultValue={paymentMethod ?? 'cash'} className="mt-1 w-full rounded-lg border-2 border-kuah bg-white px-3 py-2 font-normal">
                  {PAYMENT_METHODS.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
                </select>
              </label>
            )}
            <button type="submit" className="btn bg-white px-4 py-2 text-sm sm:col-span-2">Simpan perubahan</button>
          </form>
        </details>
      )}
      {canCancel && status !== 'cancelled' && (
        <details>
          <summary className="cursor-pointer rounded-lg border-2 border-cabai px-3 py-2 text-sm font-semibold text-cabai">
            Batalkan pesanan
          </summary>
          <form action={deleteOrder} className="mt-3 space-y-3 rounded-xl border-2 border-cabai/20 bg-white p-4 text-sm">
            <input type="hidden" name="id" value={orderId} />
            <p>Pesanan akan ditandai batal dan tetap tersimpan di riwayat audit.</p>
            <button type="submit" className="btn bg-cabai px-4 py-2 text-sm text-white">Ya, batalkan pesanan</button>
          </form>
        </details>
      )}
    </div>
  );
}
