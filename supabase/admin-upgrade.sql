-- Jalankan sekali: nama menu harus unik (dipakai impor CSV untuk memperbarui menu yang sama).
create unique index if not exists menu_items_name_key on public.menu_items (name);

-- Metode pembayaran yang dipilih pelanggan ketika membuat pesanan.
alter table public.orders
  add column if not exists payment_method text not null default 'cash'
  check (payment_method in ('cash', 'transfer_bca', 'transfer_bri', 'transfer_mandiri', 'qris', 'gopay', 'ovo', 'dana'));

-- Append-only audit log for admin approval, edit, and cancellation/deletion of orders.
create table if not exists public.admin_activity_logs (
  id bigint generated always as identity primary key,
  order_id uuid not null,
  actor_user_id uuid not null,
  actor_email text not null,
  action text not null check (action in ('approved', 'edited', 'deleted')),
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_activity_logs_created_idx
  on public.admin_activity_logs (created_at desc);
create index if not exists admin_activity_logs_order_created_idx
  on public.admin_activity_logs (order_id, created_at desc);

alter table public.admin_activity_logs enable row level security;
revoke all on public.admin_activity_logs from anon, authenticated;
grant select on public.admin_activity_logs to authenticated;
drop policy if exists "admin read activity logs" on public.admin_activity_logs;
create policy "admin read activity logs" on public.admin_activity_logs
  for select to authenticated using ((select public.is_admin()));

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.log_order_admin_activity() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  activity_action text;
  changed_by uuid := auth.uid();
  changed_by_email text := auth.jwt() ->> 'email';
  jwt_role text := auth.jwt() ->> 'role';
begin
  if changed_by is null or not public.is_admin() then
    if jwt_role = 'service_role' then
      if tg_op = 'DELETE' then return old; end if;
      return new;
    end if;
    raise exception 'Only authenticated admins can change or delete orders';
  end if;

  if tg_op = 'DELETE' then
    activity_action := 'deleted';
    insert into public.admin_activity_logs (order_id, actor_user_id, actor_email, action, old_data)
    values (old.id, changed_by, coalesce(changed_by_email, ''), activity_action, to_jsonb(old));
    return old;
  end if;

  if old.status is distinct from 'cancelled' and new.status = 'cancelled' then
    activity_action := 'deleted';
  elsif old.payment_status is distinct from 'paid' and new.payment_status = 'paid' then
    activity_action := 'approved';
  elsif to_jsonb(old) is distinct from to_jsonb(new) then
    activity_action := 'edited';
  else
    return new;
  end if;

  insert into public.admin_activity_logs (order_id, actor_user_id, actor_email, action, old_data, new_data)
  values (new.id, changed_by, coalesce(changed_by_email, ''), activity_action, to_jsonb(old), to_jsonb(new));
  return new;
end;
$$;

revoke all on function private.log_order_admin_activity() from public, anon, authenticated;
drop trigger if exists orders_admin_activity_audit on public.orders;
create trigger orders_admin_activity_audit
  after update or delete on public.orders
  for each row execute function private.log_order_admin_activity();
