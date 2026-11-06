import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import {
  Card,
  CardHeader,
  EmptyState,
  InvoiceBadge,
  PageHeader,
  ProgressBar,
} from "@/components/ui";
import { listInvoices } from "@/lib/data";
import {
  currentMonth,
  formatBulan,
  formatRupiah,
  formatTanggal,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Laporan" };

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string }>;
}) {
  const query = await searchParams;
  const bulan = /^\d{4}-\d{2}$/.test(query.bulan ?? "")
    ? (query.bulan as string)
    : currentMonth();

  const invoices = await listInvoices({ bulan });

  const total = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const terbayar = invoices.reduce((sum, invoice) => sum + invoice.dibayar, 0);
  const sisa = invoices.reduce((sum, invoice) => sum + invoice.sisa, 0);
  const persen = total > 0 ? Math.round((terbayar / total) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Laporan"
        description="Rekap pemasukan dan tunggakan per periode."
        actions={
          <a
            href={`/api/laporan/export?bulan=${bulan}`}
            className="btn btn-ghost btn-sm"
          >
            <Download className="h-4 w-4" /> Unduh CSV
          </a>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <form className="flex items-end gap-2">
          <div>
            <span className="label">Periode</span>
            <input
              type="month"
              name="bulan"
              defaultValue={bulan}
              className="input w-[190px]"
            />
          </div>
          <button type="submit" className="btn btn-ghost btn-sm">
            Tampilkan
          </button>
        </form>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card px-4 py-3">
          <p className="text-xs text-slate-500">Total tagihan</p>
          <p className="mt-0.5 text-lg font-semibold text-slate-900">
            {formatRupiah(total)}
          </p>
        </div>
        <div className="card px-4 py-3">
          <p className="text-xs text-slate-500">Pemasukan terkumpul</p>
          <p className="mt-0.5 text-lg font-semibold text-emerald-700">
            {formatRupiah(terbayar)}
          </p>
        </div>
        <div className="card px-4 py-3">
          <p className="text-xs text-slate-500">Tunggakan</p>
          <p className="mt-0.5 text-lg font-semibold text-rose-600">
            {formatRupiah(sisa)}
          </p>
        </div>
        <div className="card px-4 py-3">
          <p className="text-xs text-slate-500">Tingkat koleksi</p>
          <p className="mt-0.5 text-lg font-semibold text-slate-900">{persen}%</p>
          <div className="mt-2">
            <ProgressBar value={terbayar} max={total} />
          </div>
        </div>
      </div>

      <Card className="mt-4 overflow-hidden">
        <CardHeader
          title={`Rekap ${formatBulan(bulan)}`}
          description={`${invoices.length} tagihan · ${invoices.filter((invoice) => invoice.status === "lunas").length} lunas`}
        />

        {invoices.length === 0 ? (
          <EmptyState
            title={`Belum ada data untuk ${formatBulan(bulan)}`}
            description="Buat tagihan pada periode ini terlebih dahulu."
            action={
              <Link href="/tagihan" className="btn btn-primary btn-sm">
                Ke halaman tagihan
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="th">Penghuni</th>
                  <th className="th">Kamar</th>
                  <th className="th">Jatuh tempo</th>
                  <th className="th text-right">Tagihan</th>
                  <th className="th text-right">Dibayar</th>
                  <th className="th text-right">Sisa</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-slate-50 last:border-0">
                    <td className="td">
                      <Link
                        href={`/tagihan/${invoice.id}`}
                        className="font-medium text-slate-900 hover:text-emerald-700"
                      >
                        {invoice.tenant?.nama ?? "—"}
                      </Link>
                    </td>
                    <td className="td text-slate-600">
                      {invoice.room?.nomor ?? "—"}
                    </td>
                    <td className="td text-slate-600">
                      {formatTanggal(invoice.jatuh_tempo)}
                    </td>
                    <td className="td text-right">{formatRupiah(invoice.total)}</td>
                    <td className="td text-right text-emerald-700">
                      {formatRupiah(invoice.dibayar)}
                    </td>
                    <td className="td text-right">{formatRupiah(invoice.sisa)}</td>
                    <td className="td">
                      <InvoiceBadge status={invoice.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/80 font-semibold text-slate-900">
                  <td className="td" colSpan={3}>
                    Total
                  </td>
                  <td className="td text-right">{formatRupiah(total)}</td>
                  <td className="td text-right text-emerald-700">
                    {formatRupiah(terbayar)}
                  </td>
                  <td className="td text-right">{formatRupiah(sisa)}</td>
                  <td className="td" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
