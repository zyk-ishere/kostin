# Kostin — Sistem Pembayaran & Penagihan Kost

Aplikasi web untuk mengelola satu lokasi kost (hingga puluhan kamar): data kamar,
penghuni, tagihan bulanan, pencatatan pembayaran, dan verifikasi bukti transfer.

Dibangun dengan **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, dan
**Supabase** (Postgres, Auth, Storage).

---

## Fitur

- **Dashboard** — pendapatan bulan ini, tunggakan, okupansi kamar, pembayaran yang
  menunggu verifikasi.
- **Kamar** — CRUD kamar, harga sewa, fasilitas, status (kosong / terisi / perbaikan).
- **Penghuni** — data kontak, kamar, tanggal masuk/keluar, deposit, checkout otomatis
  mengosongkan kamar.
- **Tagihan bulanan** — buat tagihan semua penghuni aktif sekaligus (anti-duplikat per
  periode), rincian listrik/air/biaya lain/diskon, dan denda keterlambatan otomatis.
- **Pembayaran** — catat pembayaran manual (transfer/tunai/QRIS), unggah bukti, dan
  verifikasi antrean bukti transfer.
- **Halaman pembayaran publik** — penghuni membuka link khusus per tagihan, melihat
  sisa tagihan & rekening tujuan, lalu mengunggah bukti transfer tanpa perlu akun.
- **Pengingat WhatsApp** — tombol yang membuka WhatsApp dengan pesan tagihan dan link
  pembayaran sudah terisi.
- **Laporan** — rekap per bulan dan ekspor CSV.

---

## 1. Siapkan Supabase

1. Buat project gratis di [supabase.com/dashboard](https://supabase.com/dashboard).
2. Buka **SQL Editor → New query**, jalankan seluruh isi
   [`supabase/schema.sql`](./supabase/schema.sql). File ini membuat tabel, RLS,
   bucket storage `bukti-transfer`, dan baris pengaturan awal.
3. *(Opsional)* Jalankan [`supabase/seed.sql`](./supabase/seed.sql) untuk mengisi
   8 kamar + 5 penghuni + tagihan contoh supaya dashboard langsung terlihat berisi.
4. Buat akun admin di **Authentication → Users → Add user**. Isi email & password,
   dan pastikan user langsung terkonfirmasi (matikan “Confirm email” atau klik
   konfirmasi pada user tersebut).

## 2. Isi environment variable

Salin `.env.example` menjadi `.env.local`:

```bash
cp .env.example .env.local
```

Ambil nilainya dari **Project Settings → API Keys**:

| Variable | Diambil dari | Wajib |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | Ya |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable / anon key | Ya |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret / service_role key | Untuk halaman `/bayar/[id]` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` saat lokal, domain asli saat deploy | Disarankan |

> `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di server untuk halaman pembayaran publik
> (penghuni tanpa akun). Jangan pernah memberi prefix `NEXT_PUBLIC_` dan jangan commit
> file `.env.local`.

## 3. Jalankan

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Kalau kredensial belum lengkap,
aplikasi otomatis menampilkan halaman panduan `/setup`.

---

## Alur pemakaian bulanan

1. **Awal bulan** → buka *Tagihan*, pilih periode, klik **Buat tagihan**. Semua
   penghuni aktif mendapat tagihan sewa sesuai harga kamar.
2. **Sesuaikan** tagihan bila perlu (listrik, air, biaya lain, diskon) lewat halaman
   detail tagihan.
3. **Kirim pengingat** — tombol *Kirim WhatsApp* di detail tagihan berisi nominal,
   jatuh tempo, dan link pembayaran publik.
4. **Penghuni membayar** — transfer ke rekening kost, lalu unggah bukti di link
   pembayaran.
5. **Admin verifikasi** — buka *Pembayaran*, cek bukti, klik **Validasi** atau
   **Tolak**. Status tagihan (belum / sebagian / lunas / telat) ikut menyesuaikan.
6. **Akhir bulan** — buka *Laporan*, cek rekap, unduh CSV bila perlu.

Denda keterlambatan dihitung dengan tombol **Terapkan denda** di halaman Tagihan:
`hari terlambat × denda per hari` (diatur di *Pengaturan*).

---

## Struktur project

```
src/
  proxy.ts                 # penjaga sesi (pengganti middleware di Next.js 16)
  app/
    (app)/                 # semua halaman admin (butuh login)
      page.tsx             # dashboard
      kamar/               # daftar, tambah, detail/edit
      penghuni/            # daftar, tambah, detail/edit
      tagihan/             # daftar tagihan + detail & pembayaran
      pembayaran/          # verifikasi bukti transfer
      laporan/             # rekap bulanan + ekspor CSV
      pengaturan/          # identitas kost, rekening, jatuh tempo, denda
    login/                 # login admin
    setup/                 # panduan saat env belum diisi
    bayar/[id]/            # halaman pembayaran publik (tanpa login)
    api/laporan/export/    # ekspor CSV
  components/              # UI, form, sidebar
  lib/
    actions/               # Server Actions (mutasi data)
    data.ts                # query baca ke Supabase
    supabase/              # client server & admin (service role)
supabase/
  schema.sql               # tabel + RLS + storage
  seed.sql                 # data contoh (opsional)
```

---

## Model data singkat

| Tabel | Isi |
| --- | --- |
| `settings` | Satu baris: nama kost, rekening, jatuh tempo, denda |
| `rooms` | Kamar + harga sewa + status |
| `tenants` | Penghuni + kamar + tanggal masuk/keluar + deposit |
| `invoices` | Tagihan per penghuni per bulan; `total` dihitung otomatis oleh database |
| `payments` | Pembayaran/bukti transfer; `valid` dihitung sebagai pelunasan |

Status tagihan tidak disimpan, tapi diturunkan dari total − pembayaran valid:

- `lunas` — dibayar ≥ total
- `telat` — belum lunas dan melewati jatuh tempo
- `sebagian` — sudah ada pembayaran valid tapi belum lunas
- `belum` — belum ada pembayaran

---

## Deploy (Vercel)

1. Push project ke GitHub, import ke Vercel.
2. Tambahkan keempat environment variable di atas pada Project Settings → Environment
   Variables (gunakan nilai production).
3. Set `NEXT_PUBLIC_APP_URL` ke domain Vercel/hosting kamu, lalu redeploy.
4. Di Supabase **Authentication → URL Configuration**, tambahkan domain tersebut ke
   *Site URL* dan *Redirect URLs*.

---

## Keamanan

- Semua tabel memakai RLS; hanya user yang login (`authenticated`) yang bisa membaca
  dan menulis.
- Service role key hanya dipakai di server pada halaman `/bayar/[id]`, sehingga
  penghuni hanya bisa melihat satu tagihan yang link-nya mereka pegang (UUID acak).
- Bucket `bukti-transfer` bersifat privat. Admin melihat bukti lewat *signed URL*
  berumur 1 jam.
- Setiap Server Action memverifikasi sesi lewat `requireUser()` sebelum mengubah data.
- Tetap disarankan mengganti password admin secara berkala dan tidak membagikan link
  dashboard.

---

## Troubleshooting

| Gejala | Penyebab & solusi |
| --- | --- |
| Selalu diarahkan ke `/setup` | `.env.local` belum terisi atau dev server belum di-restart. |
| Login berhasil tapi kembali ke halaman login | Cookie diblokir, atau `NEXT_PUBLIC_SUPABASE_URL` salah. Cek console server. |
| Login selalu bilang "Email atau password salah" | Pastikan `NEXT_PUBLIC_SUPABASE_ANON_KEY` valid. Kalau log Supabase/server berbunyi `Invalid API key`, salin ulang **publishable/anon key** dari Project Settings → API Keys (bukan key yang sudah di-revoke), lalu restart dev server. |
| `relation "public.settings" does not exist` | `supabase/schema.sql` belum dijalankan. |
| Upload bukti gagal | Bucket `bukti-transfer` belum ada / policy storage belum dibuat. Jalankan ulang bagian storage di `schema.sql`. |
| Halaman `/bayar/[id]` bilang belum aktif | `SUPABASE_SERVICE_ROLE_KEY` belum diisi. |
| Data tidak muncul setelah insert | Cek RLS aktif dan user sudah login; lihat log di Supabase. |

---

## Langkah lanjutan yang disarankan

- **Payment gateway** (Midtrans/Xendit) untuk QRIS/VA otomatis dan webhook status bayar.
- **WhatsApp API** (Fonnte/Wablas/Cloud API) untuk pengingat otomatis H-3 dan H+1.
- **Portal penghuni** dengan login sendiri agar bisa melihat riwayat tagihan.
- **Multi-cabang** dengan kolom `property_id` dan laporan konsolidasi.
- **Backup** otomatis dari Supabase dan audit log perubahan data.
