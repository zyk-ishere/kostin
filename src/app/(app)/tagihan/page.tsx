import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Plus, Scale } from "lucide-react";
import { ActionButton } from "@/components/action-button";
import {
  Card,
  EmptyState,
  InvoiceBadge,
  Notice,
  PageHeader,
} from "@/components/ui";
import { applyLateFees, generateInvoices } from "@/lib/actions/invoices";
import { listInvoices } from "@/lib/data";
import {
  currentMonth,
  formatBulan,
  formatRupiah,
  formatTanggal,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Tagihan" };

export default async function TagihanPage({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string; deleted?: string }>;
}) {
  const query = await searchParams;
  const bulan = /^\d{4}-\d{2}$/.test(query.bulan ?? "")
    ? (query.bulan as string)
    : currentMonth();

  const invoices = await listInvoices({ bulan });

  const total = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const terbayar = invoices.reduce((sum, invoice) => sum + invoice.dibayar, 0);
  const sisa = invoices.reduce((sum, invoice) => sum + invoice.sisa, 0);
  const lunas = invoices.filter((invoice) => invoice.status === "lunas").length;

  return (
    <div>
      <PageHeader
        title="Tagihan"
        description="Buat tagihan bulanan, pantau pembayaran, dan kelola tunggakan."
      />

      {query.deleted ? (
        <div className="mb-4">
          <Notice tone="sky">Tagihan berhasil dihapus.</Notice>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <form className="flex items-end gap-2">
          <div>
            <span className="label">Periode tagihan</span>
            <input
              type="month"
              name="bulan"
              defaultValue={bulan}
              className="input w-[190px]"
            />
          </div>
          <button type="submit" className="btn btn-ghost btn-sm">
            <CalendarDays className="h-4 w-4" /> Tampilkan
          </button>
        </form>

        <div className="flex flex-wrap items-start gap-2">
          <ActionButton
            action={generateInvoices}
            label="Buat tagihan"
            pendingLabel="Membuat…"
          >
            <input type="hidden" name="bulan" value={bulan} />
          </ActionButton>
          <ActionButton
            action={applyLateFees}
            label="Terapkan denda"
            pendingLabel="Menghitung…"
            variant="ghost"
          />
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card px-4 py-3">
          <p className="text-xs text-slate-500">Total tagihan</p>
          <p className="mt-0.5 text-lg font-semibold text-slate-900">
            {formatRupiah(total)}
          </p>
        </div>
        <div className="card px-4 py-3">
          <p className="text-xs text-slate-500">Sudah dibayar</p>
          <p className="mt-0.5 text-lg font-semibold text-emerald-700">
            {formatRupiah(terbayar)}
          </p>
        </div>
        <div className="card px-4 py-3">
          <p className="text-xs text-slate-500">Sisa / tunggakan</p>
          <p className="mt-0.5 text-lg font-semibold text-rose-600">
            {formatRupiah(sisa)}
          </p>
        </div>
        <div className="card px-4 py-3">
          <p className="text-xs text-slate-500">Lunas</p>
          <p className="mt-0.5 text-lg font-semibold text-slate-900">
            {lunas}{" "}
            <span className="text-sm font-normal text-slate-400">
              / {invoices.length} tagihan
            </span>
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Tagihan {formatBulan(bulan)}
            </h2>
            <p className="text-xs text-slate-500">
              {invoices.length} tagihan pada periode ini
            </p>
          </div>
          <Link
            href="/penghuni/baru"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Penghuni baru
          </Link>
        </div>

        {invoices.length === 0 ? (
          <EmptyState
            title={`Belum ada tagihan ${formatBulan(bulan)}`}
            description="Klik “Buat tagihan” untuk membuat tagihan sewa semua penghuni aktif sekaligus."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="th">Penghuni</th>
                  <th className="th">Kamar</th>
                  <th className="th">Jatuh tempo</th>
                  <th className="th text-right">Total</th>
                  <th className="th text-right">Dibayar</th>
                  <th className="th text-right">Sisa</th>
                  <th className="th">Status</th>
                  <th className="th" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="td">
                      <Link
                        href={`/tagihan/${invoice.id}`}
                        className="font-medium text-slate-900 hover:text-emerald-700"
                      >
                        {invoice.tenant?.nama ?? "—"}
                      </Link>
                      {invoice.denda > 0 ? (
                        <p className="flex items-center gap-1 text-xs text-rose-600">
                          <Scale className="h-3 w-3" /> denda{" "}
                          {formatRupiah(invoice.denda)}
                        </p>
                      ) : null}
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
                    <td className="td text-right font-medium">
                      {formatRupiah(invoice.sisa)}
                    </td>
                    <td className="td">
                      <InvoiceBadge status={invoice.status} />
                    </td>
                    <td className="td text-right">
                      <Link
                        href={`/tagihan/${invoice.id}`}
                        className="text-xs font-semibold text-emerald-700 hover:underline"
                      >
                        Detail
                      </Link>
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
