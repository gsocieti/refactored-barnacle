'use client';

import { useMemo, useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import type { Category, MenuItem } from '@/lib/types';

const rupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function MenuCatalog({ categories, items }: { categories: Category[]; items: MenuItem[] }) {
  const [active, setActive] = useState('all');
  const tabs = [{ id: 'all', name: 'Semua' }, ...categories.map((c) => ({ id: c.id, name: c.name }))];
  const visible = useMemo(
    () =>
      (active === 'all' ? items : items.filter((i) => i.category_id === active)).toSorted(
        (a, b) => Number(b.is_featured) - Number(a.is_featured),
      ),
    [active, items],
  );

  return (
    <section id="menu" className="scroll-mt-24 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-cabai">Dari dapur Momiega</p>
        <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Menu yang bikin balik lagi</h2>
          <p className="max-w-md text-sm leading-6 text-kuah/65">Pilih mie ayam, mie yamin, ramen, coffee, dan minuman favoritmu.</p>
        </div>

        <div className="scrollbar-none mt-7 flex gap-2 overflow-x-auto pb-2">
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
            Menu belum tersedia untuk kategori ini. Tanyakan langsung lewat WhatsApp di bagian lokasi.
          </p>
        ) : (
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((item) => (
              <li
                key={item.id}
                className={`group overflow-hidden rounded-3xl border border-kuah/10 bg-white shadow-[0_8px_28px_-20px_rgba(59,34,22,0.5)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_-20px_rgba(59,34,22,0.32)] ${item.is_available ? '' : 'opacity-60'}`}
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
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg font-bold leading-snug">{item.name}</h3>
                    <p className="shrink-0 rounded-lg bg-mie/60 px-2 py-1 text-sm font-extrabold text-cabai">{rupiah(item.price)}</p>
                  </div>
                  {item.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-kuah/65">{item.description}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
