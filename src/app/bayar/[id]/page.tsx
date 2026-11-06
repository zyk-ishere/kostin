import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, CheckCircle2, Home, ShieldCheck } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import {
  Card,
  Field,
  InvoiceBadge,
  Notice,
  PaymentBadge,
} from "@/components/ui";
import { submitPublicPayment } from "@/lib/actions/payments";
import { getPublicInvoice } from "@/lib/data";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import {
  formatBulan,
  formatRupiah,
  formatTanggal,
  jakartaToday,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Pembayaran tagihan" };
export const dynamic = "force-dynamic";

export default async function BayarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sukses?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  if (!isServiceRoleConfigured()) {
    return (
      <PublicShell kostName="Kostin">
        <Card className="p-6">
          <h1 className="text-lg font-semibold text-slate-900">
            Halaman pembayaran belum aktif
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Admin perlu menambahkan{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
              SUPABASE_SERVICE_ROLE_KEY
            </code>{" "}
            ke file <code className="font-mono text-xs">.env.local</code> lalu
            menjalankan ulang server.
          </p>
        </Card>
      </PublicShell>
    );
  }

  const data = await getPublicInvoice(id);
  if (!data) notFound();

  const { invoice, settings } = data;
  const kostName = settings?.nama_kost ?? "Kost";
  const bulan = invoice.periode.slice(0, 7);
  const visiblePayments = invoice.payments.filter(
    (payment) => payment.status !== "ditolak",
  );
  const lunas = invoice.sisa <= 0;

  return (
    <PublicShell kostName={kostName} alamat={settings?.alamat}>
      {query.sukses ? (
        <div className="mb-4">
          <Notice>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Bukti transfer terkirim. Admin akan memverifikasi pembayaranmu.
            </span>
          </Notice>
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
          <p className="text-xs text-slate-500">Tagihan untuk</p>
          <p className="text-base font-semibold text-slate-900">
            {invoice.tenant?.nama ?? "Penghuni"}
          </p>
          <p className="text-xs text-slate-500">
            Kamar {invoice.room?.nomor ?? "—"} · {formatBulan(bulan)}
          </p>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">Jumlah yang harus dibayar</p>
              <p className="text-3xl font-semibold tracking-tight text-slate-900">
                {formatRupiah(lunas ? 0 : invoice.sisa)}
              </p>
            </div>
            <InvoiceBadge status={invoice.status} />
          </div>

          <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Total tagihan</dt>
              <dd className="font-medium text-slate-800">
                {formatRupiah(invoice.total)}
              </dd>
            </div>
            {invoice.dibayar > 0 ? (
              <div className="flex justify-between">
                <dt className="text-slate-500">Sudah dibayar</dt>
                <dd className="font-medium text-emerald-700">
                  {formatRupiah(invoice.dibayar)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-slate-500">Jatuh tempo</dt>
              <dd className="font-medium text-slate-800">
                {formatTanggal(invoice.jatuh_tempo)}
              </dd>
            </div>
            {invoice.denda > 0 ? (
              <div className="flex justify-between">
                <dt className="text-slate-500">Termasuk denda</dt>
                <dd className="font-medium text-rose-600">
                  {formatRupiah(invoice.denda)}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </Card>

      {settings?.nomor_rekening ? (
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <Building2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs text-slate-500">Transfer ke rekening</p>
              <p className="text-sm font-semibold text-slate-900">
                {settings.bank} · {settings.nomor_rekening}
              </p>
              <p className="text-xs text-slate-500">
                a.n. {settings.atas_nama || "-"}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {visiblePayments.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3">
            <p className="text-sm font-semibold text-slate-900">
              Pembayaran yang sudah dikirim
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {visiblePayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {formatRupiah(payment.jumlah)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatTanggal(payment.tanggal_bayar)}
                    {payment.pengirim ? ` · ${payment.pengirim}` : ""}
                  </p>
                </div>
                <PaymentBadge status={payment.status} />
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {lunas ? (
        <Card className="p-6 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
          <p className="mt-2 text-sm font-semibold text-slate-900">
            Tagihan sudah lunas
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Terima kasih, tidak ada pembayaran yang perlu dilakukan.
          </p>
        </Card>
      ) : (
        <Card>
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-sm font-semibold text-slate-900">
              Konfirmasi pembayaran
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Sudah transfer? Unggah buktinya di sini.
            </p>
          </div>
          <div className="p-5">
            <ActionForm
              action={submitPublicPayment}
              submitLabel="Kirim bukti transfer"
              pendingLabel="Mengirim…"
            >
              <input type="hidden" name="invoice_id" value={invoice.id} />

              <Field label="Jumlah transfer">
                <input
                  className="input"
                  name="jumlah"
                  type="text"                
                  defaultValue={invoice.sisa}
                  required
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nama pengirim">
                  <input
                    className="input"
                    name="pengirim"
                    defaultValue={invoice.tenant?.nama ?? ""}
                    required
                  />
                </Field>
                <Field label="Tanggal transfer">
                  <input
                    className="input"
                    name="tanggal_bayar"
                    type="date"
                    defaultValue={jakartaToday()}
                    max={jakartaToday()}
                  />
                </Field>
              </div>

              <Field
                label="Bukti transfer"
                hint="Foto struk atau screenshot mutasi. JPG, PNG, WEBP, atau PDF (maks 5 MB)."
              >
                <input
                  className="input file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold"
                  name="bukti"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  required
                />
              </Field>

              <Field label="Catatan">
                <input
                  className="input"
                  name="catatan"
                  placeholder="Opsional"
                />
              </Field>
            </ActionForm>
          </div>
        </Card>
      )}

      <p className="flex items-center justify-center gap-1.5 pt-2 text-center text-xs text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5" />
        Halaman ini hanya bisa diakses lewat link dari admin kost.
      </p>
    </PublicShell>
  );
}

function PublicShell({
  kostName,
  alamat,
  children,
}: {
  kostName: string;
  alamat?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-emerald-50/60 px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
            <Home className="h-6 w-6" strokeWidth={2.2} />
          </span>
          <h1 className="mt-3 text-lg font-semibold text-slate-900">{kostName}</h1>
          {alamat ? <p className="text-xs text-slate-500">{alamat}</p> : null}
        </div>

        {children}

        <p className="mt-6 text-center text-[11px] text-slate-400">
          Dibuat dengan{" "}
          <Link href="/" className="font-semibold text-slate-500 hover:underline">
            Kostin
          </Link>
        </p>
      </div>
    </div>
  );
}
