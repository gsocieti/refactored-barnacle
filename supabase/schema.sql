-- Momiega: skema Supabase (jalankan di SQL Editor).

-- ===== Helper =====
-- Admin = user dengan app_metadata.role = 'admin' (tidak bisa diubah user sendiri).
create or replace function public.is_admin() returns boolean
language sql stable as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ===== FASE 1 =====
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price integer not null check (price >= 0), -- rupiah
  category_id uuid references public.categories (id) on delete set null,
  image_url text,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index menu_items_category_idx on public.menu_items (category_id);
create trigger menu_items_updated_at before update on public.menu_items
  for each row execute function public.set_updated_at();

-- ===== FASE 2 (belum dipakai di UI) =====
create table public.tables (
  id uuid primary key default gen_random_uuid(),
  table_number integer not null unique,
  qr_code_url text
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  table_number integer references public.tables (table_number),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'preparing', 'served', 'completed', 'cancelled')),
  total_amount integer not null default 0 check (total_amount >= 0),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
  payment_method text not null default 'cash'
    check (payment_method in ('cash', 'transfer_bca', 'transfer_bri', 'transfer_mandiri', 'qris', 'gopay', 'ovo', 'dana')),
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  menu_item_id uuid not null references public.menu_items (id),
  quantity integer not null check (quantity > 0),
  price_at_time integer not null check (price_at_time >= 0),
  notes text
);
create index order_items_order_idx on public.order_items (order_id);

-- ===== RLS =====
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.tables enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Publik boleh membaca; hanya admin boleh menulis.
create policy "public read categories" on public.categories for select using (true);
create policy "admin write categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy "public read menu_items" on public.menu_items for select using (true);
create policy "admin write menu_items" on public.menu_items for all using (public.is_admin()) with check (public.is_admin());

create policy "public read tables" on public.tables for select using (true);
create policy "admin write tables" on public.tables for all using (public.is_admin()) with check (public.is_admin());

-- Pesanan: admin saja. Pelanggan membuat pesanan lewat Route Handler (service role);
-- kasir memverifikasi pembayaran sebelum mengubah payment_status menjadi paid.
create policy "admin all orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all order_items" on public.order_items for all using (public.is_admin()) with check (public.is_admin());

-- ===== Storage foto menu =====
insert into storage.buckets (id, name, public) values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;
create policy "public read menu images" on storage.objects for select using (bucket_id = 'menu-images');
create policy "admin write menu images" on storage.objects for all to authenticated
  using (bucket_id = 'menu-images' and public.is_admin())
  with check (bucket_id = 'menu-images' and public.is_admin());

-- Data menu asli: jalankan supabase/seed.sql setelah file ini.

-- ===== Jadikan akun admin =====
-- 1) Buat user di Authentication > Users (matikan "Allow new users to sign up").
-- 2) Jalankan:
-- update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}' where email = 'admin@contoh.com';
