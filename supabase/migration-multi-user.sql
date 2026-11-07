-- =============================================================
--  KOSTIN — Migrasi multi-akun (1 akun = 1 dashboard)
--
--  Jalankan SELURUH file ini di Supabase → SQL Editor → New query.
--  Setelah migrasi:
--    - setiap akun hanya melihat data miliknya sendiri
--    - akun baru otomatis mendapat baris pengaturan sendiri
--    - data lama diberikan ke satu akun (lihat bagian 2)
--
--  Catatan: file ini aman dijalankan pada database versi single-admin.
--  Jalankan sekali saja. Kalau ragu, backup dulu lewat Database → Backups.
-- =============================================================

-- -------------------------------------------------------------
-- 1. Settings: izinkan lebih dari satu baris (satu per akun)
-- -------------------------------------------------------------
alter table public.settings drop constraint if exists settings_id_check;

create sequence if not exists public.settings_id_seq;
alter sequence public.settings_id_seq owned by public.settings.id;
alter table public.settings alter column id set default nextval('public.settings_id_seq');

-- -------------------------------------------------------------
-- 2. Tambah owner_id ke semua tabel
-- -------------------------------------------------------------
alter table public.settings add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.rooms    add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.tenants  add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.invoices add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.payments add column if not exists owner_id uuid references auth.users(id) on delete cascade;

-- -------------------------------------------------------------
-- 3. Tentukan pemilik data lama
--
--    GANTI email di bawah kalau data lama mau diberikan ke akun lain.
--    Semua kamar, penghuni, tagihan, dan pembayaran yang sudah ada
--    akan menjadi milik akun ini.
-- -------------------------------------------------------------
do $$
declare
  v_owner uuid;
begin
  select id into v_owner
  from auth.users
  where lower(email) = lower('qwertyuzyk420@gmail.com');

  if v_owner is null then
    select id into v_owner from auth.users order by created_at limit 1;
  end if;

  if v_owner is null then
    raise exception 'Belum ada akun Supabase. Buat akun dulu di Authentication → Users.';
  end if;

  update public.settings set owner_id = v_owner where owner_id is null;
  update public.rooms    set owner_id = v_owner where owner_id is null;
  update public.tenants  set owner_id = v_owner where owner_id is null;
  update public.invoices set owner_id = v_owner where owner_id is null;
  update public.payments set owner_id = v_owner where owner_id is null;
end $$;

-- -------------------------------------------------------------
-- 4. owner_id wajib terisi & otomatis memakai user yang login
-- -------------------------------------------------------------
alter table public.settings alter column owner_id set default auth.uid();
alter table public.rooms    alter column owner_id set default auth.uid();
alter table public.tenants  alter column owner_id set default auth.uid();
alter table public.invoices alter column owner_id set default auth.uid();
alter table public.payments alter column owner_id set default auth.uid();

alter table public.settings alter column owner_id set not null;
alter table public.rooms    alter column owner_id set not null;
alter table public.tenants  alter column owner_id set not null;
alter table public.invoices alter column owner_id set not null;
alter table public.payments alter column owner_id set not null;

-- -------------------------------------------------------------
-- 5. Constraint: satu settings per akun, nomor kamar unik per akun
-- -------------------------------------------------------------
alter table public.settings drop constraint if exists settings_owner_id_key;
alter table public.settings add constraint settings_owner_id_key unique (owner_id);

alter table public.rooms drop constraint if exists rooms_nomor_key;
alter table public.rooms drop constraint if exists rooms_owner_id_nomor_key;
alter table public.rooms add constraint rooms_owner_id_nomor_key unique (owner_id, nomor);

-- -------------------------------------------------------------
-- 6. Buatkan settings default untuk akun yang belum punya
-- -------------------------------------------------------------
-- Pastikan sequence tidak menabrak id yang sudah ada.
select setval(
  'public.settings_id_seq',
  greatest((select coalesce(max(id), 1) from public.settings), 1)
);

insert into public.settings (owner_id)
select u.id
from auth.users u
left join public.settings s on s.owner_id = u.id
where s.owner_id is null;

-- -------------------------------------------------------------
-- 7. Akun baru otomatis punya dashboard (settings) sendiri
-- -------------------------------------------------------------
create or replace function public.handle_new_user_kostin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.settings (owner_id)
  values (new.id)
  on conflict (owner_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_kostin on auth.users;
create trigger on_auth_user_created_kostin
  after insert on auth.users
  for each row execute function public.handle_new_user_kostin();

-- -------------------------------------------------------------
-- 8. Row Level Security: hanya pemilik data yang boleh akses
-- -------------------------------------------------------------
alter table public.settings enable row level security;
alter table public.rooms    enable row level security;
alter table public.tenants  enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;

drop policy if exists "admin_settings" on public.settings;
drop policy if exists "admin_rooms"    on public.rooms;
drop policy if exists "admin_tenants"  on public.tenants;
drop policy if exists "admin_invoices" on public.invoices;
drop policy if exists "admin_payments" on public.payments;

drop policy if exists "owner_settings" on public.settings;
create policy "owner_settings" on public.settings
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "owner_rooms" on public.rooms;
create policy "owner_rooms" on public.rooms
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "owner_tenants" on public.tenants;
create policy "owner_tenants" on public.tenants
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "owner_invoices" on public.invoices;
create policy "owner_invoices" on public.invoices
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "owner_payments" on public.payments;
create policy "owner_payments" on public.payments
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- -------------------------------------------------------------
-- 9. Index untuk performa
-- -------------------------------------------------------------
create index if not exists settings_owner_idx on public.settings (owner_id);
create index if not exists rooms_owner_idx    on public.rooms (owner_id);
create index if not exists tenants_owner_idx  on public.tenants (owner_id);
create index if not exists invoices_owner_idx on public.invoices (owner_id);
create index if not exists payments_owner_idx on public.payments (owner_id);

-- -------------------------------------------------------------
-- 10. Storage: bukti transfer hanya bisa diakses pemiliknya
--     Path file baru: <owner_id>/<invoice_id>/<file>
-- -------------------------------------------------------------
drop policy if exists "bukti_upload_admin" on storage.objects;
drop policy if exists "bukti_read_admin"   on storage.objects;
drop policy if exists "bukti_delete_admin" on storage.objects;

drop policy if exists "bukti_insert_owner" on storage.objects;
create policy "bukti_insert_owner" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'bukti-transfer'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "bukti_select_owner" on storage.objects;
create policy "bukti_select_owner" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'bukti-transfer'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "bukti_delete_owner" on storage.objects;
create policy "bukti_delete_owner" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'bukti-transfer'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- Selesai.
