import type { Metadata } from "next";
import { Check, ExternalLink, X } from "lucide-react";
import { Card, CardHeader, EmptyState, PageHeader, PaymentBadge } from "@/components/ui";
import { approvePayment, rejectPayment } from "@/lib/actions/payments";
import { listPayments } from "@/lib/data";
import { formatBulan, formatRupiah, formatTanggal } from "@/lib/utils";

export const metadata: Metadata = { title: "Pembayaran" };

export default async function PembayaranPage() {
  const [pending, history] = await Promise.all([
    listPayments("menunggu", 50),
    listPayments(undefined, 40),
  ]);

  const riwayat = history.filter((payment) => payment.status !== "menunggu");
  const totalPending = pending.reduce(
    (sum, payment) => sum + Number(payment.jumlah ?? 0),
    0,
  );

  return (
    <div>
      <PageHeader
        title="Pembayaran"
        description="Verifikasi bukti transfer yang dikirim penghuni lewat link pembayaran."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="card px-4 py-3">
          <p className="text-xs text-slate-500">Menunggu verifikasi</p>
          <p className="mt-0.5 text-lg font-semibold text-amber-700">
            {pending.length} pembayaran
          </p>
        </div>
        <div className="card px-4 py-3">
          <p className="text-xs text-slate-500">Nominal menunggu</p>
          <p className="mt-0.5 text-lg font-semibold text-slate-900">
            {formatRupiah(totalPending)}
          </p>
        </div>
        <div className="card px-4 py-3">
          <p className="text-xs text-slate-500">Riwayat terverifikasi</p>
          <p className="mt-0.5 text-lg font-semibold text-emerald-700">
            {riwayat.filter((payment) => payment.status === "valid").length}{" "}
            pembayaran
          </p>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader
          title="Menunggu verifikasi"
          description="Cek nominal dan bukti transfer sebelum memvalidasi."
        />

        {pending.length === 0 ? (
          <EmptyState
            title="Tidak ada pembayaran menunggu"
            description="Pembayaran yang dikirim penghuni lewat link pembayaran akan muncul di sini."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {pending.map((payment) => (
              <div key={payment.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {payment.invoice?.tenant?.nama ?? "Penghuni"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Kamar {payment.invoice?.room?.nomor ?? "—"} ·{" "}
                      {payment.invoice?.periode
                        ? formatBulan(payment.invoice.periode.slice(0, 7))
                        : "—"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatTanggal(payment.tanggal_bayar)} · {payment.metode}
                      {payment.pengirim ? ` · pengirim ${payment.pengirim}` : ""}
                    </p>
                    {payment.catatan ? (
                      <p className="mt-1 text-xs text-slate-400">{payment.catatan}</p>
                    ) : null}
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold text-slate-900">
                      {formatRupiah(payment.jumlah)}
                    </p>
                    <PaymentBadge status={payment.status} />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {payment.bukti_url ? (
                    <a
                      href={payment.bukti_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost btn-sm"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Lihat bukti
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">
                      Tanpa lampiran bukti
                    </span>
                  )}

                  <div className="ml-auto flex items-center gap-2">
                    <form action={rejectPayment}>
                      <input type="hidden" name="id" value={payment.id} />
                      <button type="submit" className="btn btn-ghost btn-sm text-rose-600">
                        <X className="h-4 w-4" /> Tolak
                      </button>
                    </form>
                    <form action={approvePayment}>
                      <input type="hidden" name="id" value={payment.id} />
                      <button type="submit" className="btn btn-primary btn-sm">
                        <Check className="h-4 w-4" /> Validasi
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="Riwayat pembayaran" description="40 transaksi terakhir." />

        {riwayat.length === 0 ? (
          <EmptyState title="Belum ada riwayat pembayaran" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="th">Penghuni</th>
                  <th className="th">Periode</th>
                  <th className="th">Tanggal</th>
                  <th className="th text-right">Jumlah</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody>
                {riwayat.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-50 last:border-0">
                    <td className="td">
                      <p className="font-medium text-slate-900">
                        {payment.invoice?.tenant?.nama ?? "—"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Kamar {payment.invoice?.room?.nomor ?? "—"}
                      </p>
                    </td>
                    <td className="td text-slate-600">
                      {payment.invoice?.periode
                        ? formatBulan(payment.invoice.periode.slice(0, 7))
                        : "—"}
                    </td>
                    <td className="td text-slate-600">
                      {formatTanggal(payment.tanggal_bayar)}
                    </td>
                    <td className="td text-right font-medium">
                      {formatRupiah(payment.jumlah)}
                    </td>
                    <td className="td">
                      <PaymentBadge status={payment.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
