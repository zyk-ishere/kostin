import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, LogOut, Trash2 } from "lucide-react";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { TenantForm } from "@/components/tenant-form";
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  InvoiceBadge,
  Notice,
  PageHeader,
} from "@/components/ui";
import { checkoutTenant, deleteTenant } from "@/lib/actions/tenants";
import { getTenant, listInvoices, listRooms } from "@/lib/data";
import { formatBulan, formatRupiah, formatTanggal } from "@/lib/utils";

export const metadata: Metadata = { title: "Detail penghuni" };

export default async function PenghuniDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; checkedout?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const tenant = await getTenant(id);
  if (!tenant) notFound();

  const [rooms, invoices] = await Promise.all([
    listRooms(),
    listInvoices({ tenantId: tenant.id }),
  ]);

  return (
    <div>
      <PageHeader
        title={tenant.nama}
        description={
          tenant.room
            ? `Kamar ${tenant.room.nomor} · ${formatRupiah(tenant.room.harga_sewa)}/bulan`
            : "Belum ditempatkan di kamar"
        }
        actions={
          <>
            <Badge tone={tenant.status === "aktif" ? "emerald" : "slate"}>
              {tenant.status === "aktif" ? "Aktif" : "Sudah keluar"}
            </Badge>
            <Link href="/penghuni" className="btn btn-ghost btn-sm">
              <ArrowLeft className="h-4 w-4" /> Semua penghuni
            </Link>
          </>
        }
      />

      {query.saved ? <div className="mb-4"><Notice>Data penghuni tersimpan.</Notice></div> : null}
      {query.checkedout ? (
        <div className="mb-4">
          <Notice tone="sky">
            Penghuni sudah di-checkout dan kamarnya kembali kosong. Riwayat
            tagihan tetap tersimpan.
          </Notice>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Data penghuni" description="Ubah kontak, kamar, dan status." />
          <div className="p-5 sm:p-6">
            <TenantForm tenant={tenant} rooms={rooms} submitLabel="Simpan perubahan" />
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Ringkasan" />
            <dl className="space-y-3 p-5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Kamar</dt>
                <dd className="font-medium text-slate-900">
                  {tenant.room?.nomor ?? "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Tanggal masuk</dt>
                <dd className="text-slate-800">{formatTanggal(tenant.tanggal_masuk)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Tanggal keluar</dt>
                <dd className="text-slate-800">{formatTanggal(tenant.tanggal_keluar)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Deposit</dt>
                <dd className="font-medium text-slate-900">
                  {formatRupiah(tenant.deposit)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Catatan</dt>
                <dd className="mt-1 text-slate-800">{tenant.catatan || "—"}</dd>
              </div>
            </dl>
          </Card>

          {tenant.status === "aktif" ? (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-slate-900">Checkout</h2>
              <p className="mt-1 text-xs text-slate-500">
                Tandai penghuni sudah keluar. Kamar akan otomatis menjadi kosong.
              </p>
              <form action={checkoutTenant} className="mt-3">
                <input type="hidden" name="id" value={tenant.id} />
                <button type="submit" className="btn btn-ghost btn-sm w-full">
                  <LogOut className="h-4 w-4" /> Checkout penghuni
                </button>
              </form>
            </Card>
          ) : null}

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-rose-700">Hapus data</h2>
            <p className="mt-1 text-xs text-slate-500">
              Menghapus penghuni juga menghapus seluruh tagihan dan riwayat
              pembayarannya.
            </p>
            <form action={deleteTenant} className="mt-3">
              <input type="hidden" name="id" value={tenant.id} />
              <ConfirmSubmit message={`Hapus ${tenant.nama} beserta semua tagihannya?`}>
                <Trash2 className="h-4 w-4" /> Hapus penghuni
              </ConfirmSubmit>
            </form>
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Riwayat tagihan"
          description={`${invoices.length} tagihan tercatat`}
          action={
            <Link href="/tagihan" className="text-xs font-semibold text-emerald-700 hover:underline">
              Buat tagihan
            </Link>
          }
        />

        {invoices.length === 0 ? (
          <EmptyState
            title="Belum ada tagihan"
            description="Buat tagihan bulanan dari halaman Tagihan."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="th">Periode</th>
                  <th className="th text-right">Total</th>
                  <th className="th text-right">Dibayar</th>
                  <th className="th text-right">Sisa</th>
                  <th className="th">Status</th>
                  <th className="th" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-slate-50 last:border-0">
                    <td className="td font-medium text-slate-900">
                      {formatBulan(invoice.periode.slice(0, 7))}
                    </td>
                    <td className="td text-right">{formatRupiah(invoice.total)}</td>
                    <td className="td text-right text-emerald-700">
                      {formatRupiah(invoice.dibayar)}
                    </td>
                    <td className="td text-right">{formatRupiah(invoice.sisa)}</td>
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
