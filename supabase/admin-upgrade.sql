-- Jalankan sekali: nama menu harus unik (dipakai impor CSV untuk memperbarui menu yang sama).
create unique index if not exists menu_items_name_key on public.menu_items (name);

-- Metode pembayaran yang dipilih pelanggan ketika membuat pesanan.
alter table public.orders
  add column if not exists payment_method text not null default 'cash'
  check (payment_method in ('cash', 'transfer_bca', 'transfer_bri', 'transfer_mandiri', 'qris', 'gopay', 'ovo', 'dana'));
