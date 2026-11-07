import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { Card, CardHeader, Field, PageHeader } from "@/components/ui";
import { saveQris, saveSettings } from "@/lib/actions/settings";
import { getSettings } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function PengaturanPage() {
  const settings = await getSettings();

  let qrisUrl: string | null = null;
  if (settings?.qris_path) {
    const supabase = await createClient();
    const { data } = await supabase.storage
      .from("qris")
      .createSignedUrl(settings.qris_path, 60 * 60);
    qrisUrl = data?.signedUrl ?? null;
  }

  return (
    <div>
      <PageHeader
        title="Pengaturan"
        description="Data ini dipakai di tagihan, pesan pengingat, dan halaman pembayaran penghuni."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader title="Identitas kost & rekening" />
          <div className="p-5 sm:p-6">
            <ActionForm action={saveSettings} submitLabel="Simpan pengaturan">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nama kost" className="sm:col-span-2">
                  <input
                    className="input"
                    name="nama_kost"
                    defaultValue={settings?.nama_kost ?? ""}
                    placeholder="Kost Bahagia"
                    required
                  />
                </Field>
                <Field label="Alamat" className="sm:col-span-2">
                  <textarea
                    className="input min-h-20"
                    name="alamat"
                    defaultValue={settings?.alamat ?? ""}
                    placeholder="Jl. Contoh No. 1, Kota"
                  />
                </Field>
                <Field label="Bank / e-wallet">
                  <input
                    className="input"
                    name="bank"
                    defaultValue={settings?.bank ?? "BCA"}
                    placeholder="BCA"
                  />
                </Field>
                <Field label="Nomor rekening">
                  <input
                    className="input"
                    name="nomor_rekening"
                    defaultValue={settings?.nomor_rekening ?? ""}
                    placeholder="1234567890"
                  />
                </Field>
                <Field label="Atas nama">
                  <input
                    className="input"
                    name="atas_nama"
                    defaultValue={settings?.atas_nama ?? ""}
                    placeholder="Nama pemilik rekening"
                  />
                </Field>
                <Field
                  label="WhatsApp admin"
                  hint="Dipakai sebagai kontak di halaman pembayaran."
                >
                  <input
                    className="input"
                    name="whatsapp_admin"
                    defaultValue={settings?.whatsapp_admin ?? ""}
                    placeholder="0812xxxxxxx"
                  />
                </Field>
              </div>

              <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <Field
                  label="Tanggal jatuh tempo"
                  hint="Tanggal setiap bulan (1–28)."
                >
                  <input
                    className="input"
                    name="jatuh_tempo_hari"
                    type="number"
                    min={1}
                    max={28}
                    defaultValue={settings?.jatuh_tempo_hari ?? 5}
                  />
                </Field>
                <Field
                  label="Denda per hari"
                  hint="Isi 0 kalau tidak menerapkan denda keterlambatan."
                >
                  <input
                    className="input"
                    name="denda_per_hari"
                    type="number"
                    min={0}
                    step={1000}
                    defaultValue={settings?.denda_per_hari ?? 0}
                  />
                </Field>
              </div>
            </ActionForm>
          </div>
        </Card>

        <Card>
          <CardHeader title="QRIS pembayaran" />
          <div className="p-5 sm:p-6">
            <ActionForm
              action={saveQris}
              submitLabel="Simpan QRIS"
              pendingLabel="Mengunggah…"
            >
              {qrisUrl ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrisUrl}
                    alt="QRIS bisnis"
                    className="mx-auto max-h-72 w-auto rounded-xl bg-white object-contain"
                  />
                  <a
                    href={qrisUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    Buka gambar QRIS
                  </a>
                </div>
              ) : (
                <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-500 ring-1 ring-inset ring-slate-200">
                  Belum ada QRIS. Unggah foto QRIS bisnis di bawah supaya
                  penyewa bisa membayar dengan scan QRIS.
                </p>
              )}

              <Field
                label="Foto QRIS bisnis"
                hint="JPG, PNG, atau WEBP (maks 5 MB). Gambar ini tampil di halaman pembayaran penyewa."
              >
                <input
                  className="input file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold"
                  name="qris"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                />
              </Field>

              {qrisUrl ? (
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    name="hapus_qris"
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Hapus QRIS yang sekarang
                </label>
              ) : null}
            </ActionForm>
          </div>
        </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Cara kerja singkat" />
            <ol className="list-decimal space-y-2 px-8 py-5 text-sm text-slate-600">
              <li>Daftarkan kamar beserta harga sewanya.</li>
              <li>Tambahkan penghuni dan pilih kamarnya.</li>
              <li>
                Setiap awal bulan, klik <strong>Buat tagihan</strong> di halaman
                Tagihan.
              </li>
              <li>
                Kirim pengingat WhatsApp dari halaman detail tagihan. Penghuni
                bisa mengunggah bukti transfer lewat link yang disertakan.
              </li>
              <li>
                Verifikasi bukti di halaman <strong>Pembayaran</strong>.
              </li>
            </ol>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-900">
              Format pesan pengingat
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Pesan otomatis berisi nama penghuni, periode tagihan, sisa
              nominal, tanggal jatuh tempo, dan link pembayaran. Kamu bisa
              mengedit teksnya di WhatsApp sebelum mengirim.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
