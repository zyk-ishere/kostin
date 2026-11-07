-- =============================================================
--  KOSTIN — Data contoh (opsional)
--  Jalankan SETELAH schema.sql kalau ingin langsung melihat
--  dashboard berisi data. Data diberikan ke akun pertama.
--  Aman dijalankan berulang.
-- =============================================================

-- ---------- Kamar ----------
insert into public.rooms (owner_id, nomor, tipe, harga_sewa, fasilitas, status)
select o.id, v.nomor, v.tipe, v.harga_sewa, v.fasilitas, v.status
from (values
  ('101', 'Standar',  750000,  'Kasur, lemari, kipas angin',        'terisi'),
  ('102', 'Standar',  750000,  'Kasur, lemari, kipas angin',        'terisi'),
  ('103', 'Standar',  800000,  'Kasur, lemari, kipas angin',        'terisi'),
  ('104', 'Deluxe',   1100000, 'AC, kasur springbed, kamar mandi dalam', 'terisi'),
  ('105', 'Deluxe',   1100000, 'AC, kasur springbed, kamar mandi dalam', 'kosong'),
  ('106', 'Deluxe',   1150000, 'AC, kasur springbed, kamar mandi dalam', 'terisi'),
  ('107', 'Premium',  1400000, 'AC, kasur springbed, TV, kamar mandi dalam', 'kosong'),
  ('108', 'Premium',  1400000, 'AC, kasur springbed, TV, kamar mandi dalam', 'perbaikan')
) as v(nomor, tipe, harga_sewa, fasilitas, status)
cross join (select id from auth.users order by created_at limit 1) o
where not exists (
  select 1 from public.rooms r where r.owner_id = o.id and r.nomor = v.nomor
);

-- ---------- Penghuni ----------
insert into public.tenants (owner_id, nama, no_hp, email, room_id, tanggal_masuk, deposit, status)
select o.id, v.nama, v.no_hp, v.email, r.id, v.tanggal_masuk, v.deposit, 'aktif'
from (values
  ('Rizky Pratama',  '081234567801', 'rizky@example.com',  '101', current_date - interval '5 months', 500000),
  ('Nadia Putri',    '081234567802', 'nadia@example.com',  '102', current_date - interval '3 months', 500000),
  ('Bagas Saputra',  '081234567803', 'bagas@example.com',  '103', current_date - interval '1 months', 500000),
  ('Sinta Maharani', '081234567804', 'sinta@example.com',  '104', current_date - interval '8 months', 750000),
  ('Fajar Nugroho',  '081234567805', 'fajar@example.com',  '106', current_date - interval '2 months', 750000)
) as v(nama, no_hp, email, nomor_kamar, tanggal_masuk, deposit)
cross join (select id from auth.users order by created_at limit 1) o
join public.rooms r on r.owner_id = o.id and r.nomor = v.nomor_kamar
where not exists (
  select 1 from public.tenants t where t.owner_id = o.id and t.nama = v.nama
);

-- ---------- Tagihan bulan ini ----------
insert into public.invoices (owner_id, tenant_id, room_id, periode, jatuh_tempo, sewa, listrik, air, catatan)
select
  t.owner_id,
  t.id,
  t.room_id,
  date_trunc('month', current_date)::date,
  (date_trunc('month', current_date) + interval '4 days')::date,
  r.harga_sewa,
  case when t.nama = 'Sinta Maharani' then 85000 else 0 end,
  case when t.nama in ('Rizky Pratama', 'Nadia Putri') then 25000 else 0 end,
  'Tagihan contoh'
from public.tenants t
join public.rooms r on r.id = t.room_id
where t.status = 'aktif'
on conflict (tenant_id, periode) do nothing;

-- ---------- Pembayaran contoh ----------
-- Satu tagihan sudah lunas.
insert into public.payments (owner_id, invoice_id, jumlah, metode, tanggal_bayar, pengirim, status, verified_by, verified_at, catatan)
select i.owner_id, i.id, i.total, 'transfer', current_date - interval '2 days', 'Rizky Pratama', 'valid', 'seed@kostin.local', now(), 'seed'
from public.invoices i
join public.tenants t on t.id = i.tenant_id
where t.nama = 'Rizky Pratama'
  and i.periode = date_trunc('month', current_date)::date
  and not exists (
    select 1 from public.payments p where p.invoice_id = i.id and p.catatan = 'seed'
  );

-- Satu tagihan menunggu verifikasi.
insert into public.payments (owner_id, invoice_id, jumlah, metode, tanggal_bayar, pengirim, status, catatan)
select i.owner_id, i.id, i.total, 'transfer', current_date, 'Nadia Putri', 'menunggu', 'seed'
from public.invoices i
join public.tenants t on t.id = i.tenant_id
where t.nama = 'Nadia Putri'
  and i.periode = date_trunc('month', current_date)::date
  and not exists (
    select 1 from public.payments p where p.invoice_id = i.id and p.catatan = 'seed'
  );
