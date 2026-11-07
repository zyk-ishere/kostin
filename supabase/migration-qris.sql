-- =============================================================
--  KOSTIN — Foto QRIS bisnis per akun
--
--  Jalankan SELURUH file ini di Supabase → SQL Editor → New query.
--  Aman dijalankan berulang.
--
--  Isi:
--    1. Kolom settings.qris_path (lokasi foto QRIS)
--    2. Bucket storage "qris" + aturan akses per pemilik
--    3. Pastikan akun baru otomatis dapat 10 kamar (kalau belum)
-- =============================================================

-- -------------------------------------------------------------
-- 1. Kolom untuk menyimpan lokasi foto QRIS
-- -------------------------------------------------------------
alter table public.settings add column if not exists qris_path text;

-- -------------------------------------------------------------
-- 2. Bucket storage "qris" (privat) + akses hanya pemiliknya
--    Path file: <owner_id>/<file>
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('qris', 'qris', false)
on conflict (id) do nothing;

drop policy if exists "qris_insert_owner" on storage.objects;
create policy "qris_insert_owner" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'qris'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "qris_select_owner" on storage.objects;
create policy "qris_select_owner" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'qris'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "qris_update_owner" on storage.objects;
create policy "qris_update_owner" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'qris'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'qris'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "qris_delete_owner" on storage.objects;
create policy "qris_delete_owner" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'qris'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- -------------------------------------------------------------
-- 3. Akun baru otomatis dapat pengaturan + 10 kamar
--    (bagian ini juga dipakai oleh migration-default-rooms.sql)
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

  insert into public.rooms (owner_id, nomor, tipe, harga_sewa, fasilitas, status)
  select new.id, lpad(g::text, 2, '0'), 'Standar', 600000, '', 'kosong'
  from generate_series(1, 10) as t(g)
  on conflict (owner_id, nomor) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_kostin on auth.users;
create trigger on_auth_user_created_kostin
  after insert on auth.users
  for each row execute function public.handle_new_user_kostin();

-- Selesai.
