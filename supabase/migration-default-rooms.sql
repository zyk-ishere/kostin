-- =============================================================
--  KOSTIN — 10 kamar otomatis untuk setiap akun baru
--
--  Jalankan SELURUH file ini di Supabase → SQL Editor → New query.
--  Aman dijalankan berulang. Akun lama tidak diubah.
--
--  Setelah ini, setiap user baru (dibuat lewat Authentication →
--  Users → Add user) otomatis mendapat:
--    - 1 baris pengaturan (default "Kost Saya")
--    - 10 kamar: 01–10, tipe Standar, sewa 600.000, status kosong
-- =============================================================

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

-- -------------------------------------------------------------
-- OPSIONAL: beri 10 kamar ke akun lama yang belum punya kamar.
-- Hapus tanda komentar di bawah kalau ingin dijalankan.
-- -------------------------------------------------------------
-- insert into public.rooms (owner_id, nomor, tipe, harga_sewa, fasilitas, status)
-- select u.id, lpad(g::text, 2, '0'), 'Standar', 600000, '', 'kosong'
-- from auth.users u
-- cross join generate_series(1, 10) as t(g)
-- where not exists (
--   select 1 from public.rooms r where r.owner_id = u.id
-- )
-- on conflict (owner_id, nomor) do nothing;

-- Selesai.
