'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Minus, Plus, Search, ShoppingBag, UtensilsCrossed, X } from 'lucide-react';
import {
  ORDER_MAX_DISTINCT_ITEMS,
  ORDER_MAX_QUANTITY,
  ORDER_MAX_TOTAL,
  PAYMENT_METHODS,
  type Category,
  type MenuItem,
  type PaymentMethod,
} from '@/lib/types';

const rupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

type CartItem = { item: MenuItem; quantity: number };

function isPaymentMethod(value: string): value is PaymentMethod {
  return PAYMENT_METHODS.some((method) => method.value === value);
}

export default function MenuCatalog({
  categories,
  items,
  tableNumber,
}: {
  categories: Category[];
  items: MenuItem[];
  tableNumber: number | null;
}) {
  const [active, setActive] = useState('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [submitting, setSubmitting] = useState(false);
  const [orderMessage, setOrderMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const tabs = [{ id: 'all', name: 'Semua' }, ...categories.map((c) => ({ id: c.id, name: c.name }))];
  const normalizedSearch = search.trim().toLocaleLowerCase('id-ID');
  const visible = useMemo(
    () =>
      (active === 'all' ? items : items.filter((i) => i.category_id === active)).toSorted(
        (a, b) => Number(b.is_featured) - Number(a.is_featured),
      ).filter((item) =>
        normalizedSearch === '' ||
        `${item.name} ${item.description ?? ''}`.toLocaleLowerCase('id-ID').includes(normalizedSearch),
      ),
    [active, items, normalizedSearch],
  );
  const cartItems = Object.values(cart);
  const itemCount = cartItems.reduce((sum, entry) => sum + entry.quantity, 0);
  const total = cartItems.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0);

  function changeQuantity(item: MenuItem, amount: number) {
    const currentQuantity = cart[item.id]?.quantity ?? 0;
    const nextQuantity = currentQuantity + amount;
    if (nextQuantity > ORDER_MAX_QUANTITY) {
      setOrderMessage({ kind: 'error', text: `Maksimal ${ORDER_MAX_QUANTITY} porsi untuk setiap menu.` });
      return;
    }
    if (amount > 0 && currentQuantity === 0 && cartItems.length >= ORDER_MAX_DISTINCT_ITEMS) {
      setOrderMessage({
        kind: 'error',
        text: `Maksimal ${ORDER_MAX_DISTINCT_ITEMS} jenis menu dalam satu pesanan.`,
      });
      return;
    }
    if (amount > 0 && total + item.price * amount > ORDER_MAX_TOTAL) {
      setOrderMessage({ kind: 'error', text: 'Total pesanan sudah mencapai batas maksimum.' });
      return;
    }

    setOrderMessage(null);
    setCart((current) => {
      const next = { ...current };
      if (nextQuantity <= 0) delete next[item.id];
      else next[item.id] = { item, quantity: nextQuantity };
      return next;
    });
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || cartItems.length === 0) return;
    setSubmitting(true);
    setOrderMessage(null);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber,
          paymentMethod,
          items: cartItems.map(({ item, quantity }) => ({ menuItemId: item.id, quantity })),
        }),
      });
      const result = (await response.json()) as { orderId?: string; totalAmount?: number; error?: string };
      if (!response.ok || !result.orderId) throw new Error(result.error || 'Pesanan tidak dapat disimpan.');
      setCart({});
      setOrderMessage({
        kind: 'success',
        text: `Pesanan ${result.orderId.slice(0, 8).toUpperCase()} berhasil dicatat dengan total ${rupiah(result.totalAmount ?? total)}. Pembayaran menunggu konfirmasi kasir.`,
      });
    } catch (error) {
      setOrderMessage({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Pesanan tidak dapat disimpan. Coba lagi.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="menu" className="scroll-mt-24 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-cabai">Dari dapur Momiega</p>
        <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Menu yang bikin balik lagi</h2>
          <p className="max-w-md text-sm leading-6 text-kuah/65">Pilih mie ayam, mie yamin, ramen, coffee, dan minuman favoritmu.</p>
        </div>
        {tableNumber !== null && (
          <p className="mt-5 inline-flex rounded-full border-2 border-kuah bg-mie px-4 py-2 text-sm font-bold">
            <ShoppingBag size={18} className="mr-2" aria-hidden /> Pesan untuk Meja {tableNumber}
          </p>
        )}

        <label className="mt-7 flex max-w-xl items-center gap-3 rounded-xl border-2 border-kuah bg-white px-4 py-3 focus-within:border-cabai focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-cabai">
          <Search size={20} className="shrink-0 text-kuah/60" aria-hidden />
          <span className="sr-only">Cari menu</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama menu atau deskripsi..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-kuah/50"
          />
        </label>

        <div className="scrollbar-none mt-4 flex gap-2 overflow-x-auto pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={active === t.id}
              onClick={() => setActive(t.id)}
              className={`shrink-0 rounded-full border px-5 py-2 text-sm font-bold transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-cabai ${
                active === t.id ? 'border-cabai bg-cabai text-white' : 'border-kuah/15 bg-white text-kuah hover:border-cabai/40'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="mt-10 rounded-xl border-2 border-dashed border-kuah p-6">
            {normalizedSearch
              ? `Menu dengan kata kunci “${search.trim()}” tidak ditemukan. Coba kata kunci lain atau pilih kategori berbeda.`
              : items.length === 0
                ? 'Menu belum tersedia. Tanyakan langsung lewat WhatsApp di bagian lokasi.'
                : 'Menu belum tersedia untuk kategori ini. Tanyakan langsung lewat WhatsApp di bagian lokasi.'}
          </p>
        ) : (
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((item) => {
              const quantity = cart[item.id]?.quantity ?? 0;
              const cannotAdd =
                !item.is_available ||
                quantity >= ORDER_MAX_QUANTITY ||
                (quantity === 0 && cartItems.length >= ORDER_MAX_DISTINCT_ITEMS) ||
                total + item.price > ORDER_MAX_TOTAL;
              return (
                <li
                  key={item.id}
                  className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-kuah/10 bg-white pb-20 shadow-[0_8px_28px_-20px_rgba(59,34,22,0.5)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_-20px_rgba(59,34,22,0.32)] ${item.is_available ? '' : 'opacity-60'}`}
                >
                  <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-mie">
                    {item.image_url || item.name === 'Yamin Spesial Karet' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url || '/yamin-spesial-karet.jpeg'} alt={item.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <UtensilsCrossed size={38} className="text-cabai/70" aria-hidden />
                    )}
                    {item.is_featured && (
                      <span className="absolute left-3 top-3 rounded-full bg-cabai px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white shadow-sm">Favorit</span>
                    )}
                    {!item.is_available && (
                      <span className="absolute right-3 top-3 rounded-full bg-kuah px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white">Habis</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-lg font-bold leading-snug">{item.name}</h3>
                      <p className="shrink-0 rounded-lg bg-mie/60 px-2 py-1 text-sm font-extrabold text-cabai">{rupiah(item.price)}</p>
                    </div>
                    {item.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-kuah/65">{item.description}</p>}
                    <div className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-kuah/65">
                        {cart[item.id] ? `${cart[item.id].quantity} di keranjang` : ' '}
                      </p>
                      <button
                        type="button"
                        onClick={() => changeQuantity(item, 1)}
                        disabled={cannotAdd}
                        aria-label={`Tambah ${item.name}`}
                        title={cannotAdd ? 'Batas pesanan tercapai atau menu tidak tersedia' : undefined}
                        className="btn border-2 bg-mie px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Plus size={17} aria-hidden /> Tambah
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <section id="keranjang" aria-label="Keranjang pesanan" className="mt-10 rounded-3xl border-4 border-kuah bg-mie/50 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl font-extrabold">Keranjang</h3>
              <p className="mt-1 text-sm text-kuah/70">{itemCount} item</p>
            </div>
            <p className="text-lg font-extrabold">{rupiah(total)}</p>
          </div>

          {cartItems.length === 0 ? (
            <p className="mt-4 rounded-xl border-2 border-dashed border-kuah/40 bg-white p-4 text-sm">
              Belum ada menu. Tekan “Tambah” pada menu untuk memasukkannya ke keranjang.
            </p>
          ) : (
            <form onSubmit={submitOrder} className="mt-5 space-y-4">
              <ul className="divide-y-2 divide-kuah/10 rounded-2xl border-2 border-kuah/10 bg-white px-4">
                {cartItems.map(({ item, quantity }) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{item.name}</p>
                      <p className="text-sm text-kuah/65">{rupiah(item.price * quantity)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => changeQuantity(item, -1)} aria-label={`Kurangi ${item.name}`} className="rounded-lg border-2 border-kuah p-1.5">
                        {quantity === 1 ? <X size={16} /> : <Minus size={16} />}
                      </button>
                      <span className="min-w-6 text-center font-bold">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => changeQuantity(item, 1)}
                        disabled={
                          quantity >= ORDER_MAX_QUANTITY ||
                          total + item.price > ORDER_MAX_TOTAL
                        }
                        aria-label={`Tambah ${item.name}`}
                        className="rounded-lg border-2 border-kuah p-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <label className="block text-sm font-bold">
                Metode pembayaran
                <select
                  value={paymentMethod}
                  onChange={(event) => {
                    if (isPaymentMethod(event.target.value)) setPaymentMethod(event.target.value);
                  }}
                  className="mt-1 w-full rounded-xl border-2 border-kuah bg-white px-3 py-3 font-normal"
                >
                  {PAYMENT_METHODS.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
                </select>
              </label>
              <p className="text-sm leading-6 text-kuah/70">
                Pembayaran transfer, QRIS, dan e-wallet dikonfirmasi kasir setelah diterima. Detail rekening atau QR pembayaran diberikan oleh kasir.
              </p>
              <button type="submit" disabled={submitting} className="btn w-full bg-cabai text-white disabled:cursor-wait disabled:opacity-60">
                {submitting ? 'Menyimpan pesanan…' : `Pesan sekarang · ${rupiah(total)}`}
              </button>
            </form>
          )}
          {orderMessage && (
            <p role={orderMessage.kind === 'error' ? 'alert' : 'status'} className={`mt-4 rounded-xl border-2 bg-white p-3 text-sm ${orderMessage.kind === 'error' ? 'border-cabai text-cabai' : 'border-kuah'}`}>
              {orderMessage.text}
            </p>
          )}
        </section>
      </div>
      {itemCount > 0 && (
        <a
          href="#keranjang"
          aria-label={`Lihat keranjang, ${itemCount} item, total ${rupiah(total)}`}
          className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full border-4 border-kuah bg-mie px-4 py-3 font-extrabold text-kuah shadow-[0_8px_24px_-8px_rgba(59,34,22,0.55)] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-cabai sm:bottom-7 sm:right-7"
        >
          <span className="relative">
            <ShoppingBag size={22} aria-hidden />
            <span className="absolute -right-3 -top-3 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-extrabold leading-none text-white">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          </span>
          <span>Keranjang</span>
          <span className="hidden border-l-2 border-kuah/20 pl-2 text-sm sm:inline">{rupiah(total)}</span>
        </a>
      )}
    </section>
  );
}
