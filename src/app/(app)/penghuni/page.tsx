import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { listTenants } from "@/lib/data";
import { formatRupiah, formatTanggal } from "@/lib/utils";

export const metadata: Metadata = { title: "Penghuni" };

export default async function PenghuniPage() {
  const tenants = await listTenants();
  const aktif = tenants.filter((tenant) => tenant.status === "aktif").length;

  return (
    <div>
      <PageHeader
        title="Penghuni"
        description={`${aktif} penghuni aktif dari ${tenants.length} data penghuni.`}
        actions={
          <Link href="/penghuni/baru" className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" /> Tambah penghuni
          </Link>
        }
      />

      <div className="card overflow-hidden">
        {tenants.length === 0 ? (
          <EmptyState
            title="Belum ada penghuni"
            description="Daftarkan penghuni dan pilih kamarnya. Tagihan bulanan akan mengikuti harga sewa kamar."
            action={
              <Link href="/penghuni/baru" className="btn btn-primary btn-sm">
                Tambah penghuni pertama
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="th">Nama</th>
                  <th className="th">Kamar</th>
                  <th className="th">Kontak</th>
                  <th className="th">Masuk</th>
                  <th className="th text-right">Deposit</th>
                  <th className="th">Status</th>
                  <th className="th" />
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="td">
                      <Link
                        href={`/penghuni/${tenant.id}`}
                        className="font-medium text-slate-900 hover:text-emerald-700"
                      >
                        {tenant.nama}
                      </Link>
                      {tenant.email ? (
                        <p className="text-xs text-slate-500">{tenant.email}</p>
                      ) : null}
                    </td>
                    <td className="td">
                      {tenant.room ? (
                        <span className="font-medium text-slate-800">
                          {tenant.room.nomor}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="td text-slate-600">{tenant.no_hp || "—"}</td>
                    <td className="td text-slate-600">
                      {formatTanggal(tenant.tanggal_masuk)}
                    </td>
                    <td className="td text-right text-slate-600">
                      {formatRupiah(tenant.deposit)}
                    </td>
                    <td className="td">
                      <Badge tone={tenant.status === "aktif" ? "emerald" : "slate"}>
                        {tenant.status === "aktif" ? "Aktif" : "Keluar"}
                      </Badge>
                    </td>
                    <td className="td text-right">
                      <Link
                        href={`/penghuni/${tenant.id}`}
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
      </div>
    </div>
  );
}
