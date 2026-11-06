import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Clock,
  DoorOpen,
  Wallet,
} from "lucide-react";
import {
  Card,
  CardHeader,
  EmptyState,
  InvoiceBadge,
  PageHeader,
  ProgressBar,
  Stat,
} from "@/components/ui";
import { getDashboard, listPayments, listRoomsWithTenants } from "@/lib/data";
import type { InvoiceStatus } from "@/lib/types";
import {
  currentMonth,
  formatBulan,
  formatRupiah,
  formatTanggal,
} from "@/lib/utils";

export const metadata = { title: "Dashboard" };

const STATUS_ORDER: Record<InvoiceStatus, number> = {
  telat: 0,
  belum: 1,
  sebagian: 2,
  lunas: 3,
};

export default async function DashboardPage() {
  const bulan = currentMonth();

  const [data, rooms, pending] = await Promise.all([
    getDashboard(bulan),
    listRoomsWithTenants(),
    listPayments("menunggu", 4),
  ]);

  const rows = [...data.invoices]
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
    .slice(0, 6);

  const persen =
    data.tagihanTotal > 0
      ? Math.round((data.tagihanTerbayar / data.tagihanTotal) * 100)
      : 0;

  const tagihanTelat = data.invoices.filter(
    (invoice) => invoice.status === "telat",
  ).length;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Ringkasan kost untuk ${formatBulan(bulan)}.`}
        actions={
          <Link href="/tagihan" className="btn btn-ghost btn-sm">
            Kelola tagihan <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Pendapatan bulan ini"
          value={formatRupiah(data.pendapatanBulanIni)}
          hint="Total pembayaran valid"
          tone="emerald"
          icon={<Wallet className="h-4 w-4" />}
        />
        <Stat
          label="Tunggakan"
          value={formatRupiah(data.tunggakan)}
          hint={`${tagihanTelat} tagihan telat`}
          tone="rose"
          icon={<AlertCircle className="h-4 w-4" />}
        />
        <Stat
          label="Kamar terisi"
          value={`${data.kamarTerisi}/${data.totalKamar}`}
          hint={`${data.kamarKosong} kosong · ${data.kamarPerbaikan} perbaikan`}
          tone="sky"
          icon={<DoorOpen className="h-4 w-4" />}
        />
        <Stat
          label="Menunggu verifikasi"
          value={data.jumlahMenunggu}
          hint={formatRupiah(data.nominalMenunggu)}
          tone="amber"
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader
            title={`Tagihan ${formatBulan(bulan)}`}
            description={`${data.jumlahLunas} dari ${data.jumlahTagihan} tagihan lunas`}
            action={
              <Link href="/tagihan" className="text-xs font-semibold text-emerald-700 hover:underline">
                Lihat semua
              </Link>
            }
          />

          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">Terkumpul</p>
                <p className="text-lg font-semibold text-slate-900">
                  {formatRupiah(data.tagihanTerbayar)}
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    dari {formatRupiah(data.tagihanTotal)}
                  </span>
                </p>
              </div>
              <p className="text-sm font-semibold text-emerald-700">{persen}%</p>
            </div>
            <div className="mt-3">
              <ProgressBar value={data.tagihanTerbayar} max={data.tagihanTotal} />
            </div>
          </div>

          {rows.length === 0 ? (
            <EmptyState
              title="Belum ada tagihan bulan ini"
              description="Buat tagihan untuk semua penghuni aktif lewat halaman Tagihan."
              action={
                <Link href="/tagihan" className="btn btn-primary btn-sm">
                  Buat tagihan
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="th">Penghuni</th>
                    <th className="th">Jatuh tempo</th>
                    <th className="th text-right">Total</th>
                    <th className="th text-right">Sisa</th>
                    <th className="th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="td">
                        <Link
                          href={`/tagihan/${invoice.id}`}
                          className="font-medium text-slate-900 hover:text-emerald-700"
                        >
                          {invoice.tenant?.nama ?? "—"}
                        </Link>
                        <p className="text-xs text-slate-500">
                          Kamar {invoice.room?.nomor ?? "—"}
                        </p>
                      </td>
                      <td className="td text-slate-500">
                        {formatTanggal(invoice.jatuh_tempo)}
                      </td>
                      <td className="td text-right">{formatRupiah(invoice.total)}</td>
                      <td className="td text-right font-medium">
                        {invoice.sisa > 0 ? formatRupiah(invoice.sisa) : "—"}
                      </td>
                      <td className="td">
                        <InvoiceBadge status={invoice.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Perlu tindakan"
            description="Pembayaran yang menunggu verifikasi"
            action={
              <Link href="/pembayaran" className="text-xs font-semibold text-emerald-700 hover:underline">
                Buka
              </Link>
            }
          />

          {pending.length === 0 ? (
            <EmptyState title="Tidak ada pembayaran menunggu" />
          ) : (
            <div className="divide-y divide-slate-100">
              {pending.map((payment) => (
                <Link
                  key={payment.id}
                  href="/pembayaran"
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {payment.invoice?.tenant?.nama ?? "Penghuni"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Kamar {payment.invoice?.room?.nomor ?? "—"} ·{" "}
                      {formatTanggal(payment.tanggal_bayar)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-slate-900">
                    {formatRupiah(payment.jumlah)}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {data.tunggakan > 0 ? (
            <div className="border-t border-slate-100 bg-amber-50/50 px-5 py-3">
              <p className="text-xs text-amber-800">
                Total tunggakan saat ini{" "}
                <strong>{formatRupiah(data.tunggakan)}</strong>.
              </p>
            </div>
          ) : null}
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Okupansi kamar"
          description="Status tiap kamar saat ini"
          action={
            <Link href="/kamar" className="text-xs font-semibold text-emerald-700 hover:underline">
              Kelola kamar
            </Link>
          }
        />

        {rooms.length === 0 ? (
          <EmptyState
            title="Belum ada kamar"
            description="Tambahkan kamar pertama untuk mulai mencatat penghuni dan tagihan."
            action={
              <Link href="/kamar" className="btn btn-primary btn-sm">
                Tambah kamar
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-3 gap-2 px-5 py-5 sm:grid-cols-5 lg:grid-cols-8">
            {rooms.map((room) => {
              const occupied = Boolean(room.tenant);
              const maintenance = room.status === "perbaikan";
              return (
                <Link
                  key={room.id}
                  href={`/kamar/${room.id}`}
                  className={`rounded-xl border px-3 py-3 text-center transition hover:-translate-y-0.5 ${
                    maintenance
                      ? "border-amber-200 bg-amber-50"
                      : occupied
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {room.nomor}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">
                    {maintenance
                      ? "Perbaikan"
                      : occupied
                        ? room.tenant?.nama
                        : "Kosong"}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
