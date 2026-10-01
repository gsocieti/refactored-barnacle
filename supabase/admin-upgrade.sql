-- Jalankan sekali: nama menu harus unik (dipakai impor CSV untuk memperbarui menu yang sama).
create unique index if not exists menu_items_name_key on public.menu_items (name);
