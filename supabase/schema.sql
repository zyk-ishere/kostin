-- =============================================================
--  KOSTIN — Skema database untuk sistem pembayaran & penagihan kost
--  Jalankan seluruh file ini di Supabase → SQL Editor → New query.
-- =============================================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- 1. Pengaturan (satu baris saja, id = 1)
-- -------------------------------------------------------------
create table if not exists public.settings (
  id                smallint primary key default 1 check (id = 1),
  nama_kost         text not null default 'Kost Saya',
  alamat            text not null default '',
  bank              text not null default 'BCA',
  nomor_rekening    text not null default '',
  atas_nama         text not null default '',
  whatsapp_admin    text not null default '',
  jatuh_tempo_hari  smallint not null default 5 check (jatuh_tempo_hari between 1 and 28),
  denda_per_hari    integer not null default 0 check (denda_per_hari >= 0),
  created_at        timestamptz not null default now()
);

insert into public.settings (id) values (1) on conflict (id) do nothing;

-- -------------------------------------------------------------
-- 2. Kamar
-- -------------------------------------------------------------
create table if not exists public.rooms (
  id           uuid primary key default gen_random_uuid(),
  nomor        text not null unique,
  tipe         text not null default 'Standar',
  harga_sewa   integer not null default 0 check (harga_sewa >= 0),
  fasilitas    text not null default '',
  status       text not null default 'kosong'
               check (status in ('kosong', 'terisi', 'perbaikan')),
  created_at   timestamptz not null default now()
);

-- -------------------------------------------------------------
-- 3. Penghuni
-- -------------------------------------------------------------
create table if not exists public.tenants (
  id              uuid primary key default gen_random_uuid(),
  nama            text not null,
  no_hp           text not null default '',
  email           text not null default '',
  room_id         uuid references public.rooms(id) on delete set null,
  tanggal_masuk   date not null default current_date,
  tanggal_keluar  date,
  deposit         integer not null default 0 check (deposit >= 0),
  status          text not null default 'aktif'
                  check (status in ('aktif', 'keluar')),
  catatan         text not null default '',
  created_at      timestamptz not null default now()
);

-- -------------------------------------------------------------
-- 4. Tagihan (invoice) bulanan
--    total dihitung otomatis oleh database.
-- -------------------------------------------------------------
create table if not exists public.invoices (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  room_id       uuid references public.rooms(id) on delete set null,
  periode       date not null,
  jatuh_tempo   date not null,
  sewa          integer not null default 0 check (sewa >= 0),
  listrik       integer not null default 0 check (listrik >= 0),
  air           integer not null default 0 check (air >= 0),
  biaya_lain    integer not null default 0 check (biaya_lain >= 0),
  diskon        integer not null default 0 check (diskon >= 0),
  denda         integer not null default 0 check (denda >= 0),
  total         integer generated always as
                (sewa + listrik + air + biaya_lain + denda - diskon) stored,
  catatan       text not null default '',
  created_at    timestamptz not null default now(),
  unique (tenant_id, periode)
);

-- -------------------------------------------------------------
-- 5. Pembayaran / bukti transfer
-- -------------------------------------------------------------
create table if not exists public.payments (
  id             uuid primary key default gen_random_uuid(),
  invoice_id     uuid not null references public.invoices(id) on delete cascade,
  jumlah         integer not null check (jumlah > 0),
  metode         text not null default 'transfer'
                 check (metode in ('transfer', 'tunai', 'qris', 'lainnya')),
  tanggal_bayar  date not null default current_date,
  pengirim       text not null default '',
  bukti_path     text,
  status         text not null default 'menunggu'
                 check (status in ('menunggu', 'valid', 'ditolak')),
  catatan        text not null default '',
  verified_by    text,
  verified_at    timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists invoices_periode_idx on public.invoices (periode);
create index if not exists invoices_tenant_idx on public.invoices (tenant_id);
create index if not exists payments_invoice_idx on public.payments (invoice_id);
create index if not exists payments_status_idx on public.payments (status);
create index if not exists tenants_room_idx on public.tenants (room_id);
create index if not exists tenants_status_idx on public.tenants (status);

-- -------------------------------------------------------------
-- 6. Row Level Security
--    Aplikasi ini single-admin: semua user yang login boleh akses penuh.
--    Halaman publik /bayar memakai service role di server, bukan anon key.
-- -------------------------------------------------------------
alter table public.settings enable row level security;
alter table public.rooms    enable row level security;
alter table public.tenants  enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;

drop policy if exists "admin_settings" on public.settings;
create policy "admin_settings" on public.settings
  for all to authenticated using (true) with check (true);

drop policy if exists "admin_rooms" on public.rooms;
create policy "admin_rooms" on public.rooms
  for all to authenticated using (true) with check (true);

drop policy if exists "admin_tenants" on public.tenants;
create policy "admin_tenants" on public.tenants
  for all to authenticated using (true) with check (true);

drop policy if exists "admin_invoices" on public.invoices;
create policy "admin_invoices" on public.invoices
  for all to authenticated using (true) with check (true);

drop policy if exists "admin_payments" on public.payments;
create policy "admin_payments" on public.payments
  for all to authenticated using (true) with check (true);

-- -------------------------------------------------------------
-- 7. Storage untuk bukti transfer (bucket privat)
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('bukti-transfer', 'bukti-transfer', false)
on conflict (id) do nothing;

drop policy if exists "bukti_upload_admin" on storage.objects;
create policy "bukti_upload_admin" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'bukti-transfer');

drop policy if exists "bukti_read_admin" on storage.objects;
create policy "bukti_read_admin" on storage.objects
  for select to authenticated
  using (bucket_id = 'bukti-transfer');

drop policy if exists "bukti_delete_admin" on storage.objects;
create policy "bukti_delete_admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'bukti-transfer');
