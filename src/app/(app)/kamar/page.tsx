import type { Metadata } from "next";
import Link from "next/link";
import { Plus, User } from "lucide-react";
import { Badge, EmptyState, PageHeader, type Tone } from "@/components/ui";
import { listRoomsWithTenants } from "@/lib/data";
import { formatRupiah } from "@/lib/utils";

export const metadata: Metadata = { title: "Kamar" };

export default async function KamarPage() {
  const rooms = await listRoomsWithTenants();
  const terisi = rooms.filter((room) => room.tenant).length;

  return (
    <div>
      <PageHeader
        title="Kamar"
        description={`${rooms.length} kamar · ${terisi} terisi · ${rooms.length - terisi} kosong`}
        actions={
          <Link href="/kamar/baru" className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" /> Tambah kamar
          </Link>
        }
      />

      {rooms.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Belum ada kamar"
            description="Tambahkan kamar terlebih dahulu, lalu daftarkan penghuni dan tagihan bulanannya."
            action={
              <Link href="/kamar/baru" className="btn btn-primary btn-sm">
                Tambah kamar pertama
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => {
            const occupied = Boolean(room.tenant);
            const maintenance = room.status === "perbaikan";
            const tone: Tone = maintenance
              ? "amber"
              : occupied
                ? "emerald"
                : "slate";

            return (
              <Link
                key={room.id}
                href={`/kamar/${room.id}`}
                className="card group p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Kamar
                    </p>
                    <p className="text-2xl font-semibold tracking-tight text-slate-900">
                      {room.nomor}
                    </p>
                  </div>
                  <Badge tone={tone}>
                    {maintenance ? "Perbaikan" : occupied ? "Terisi" : "Kosong"}
                  </Badge>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {room.tipe} · {formatRupiah(room.harga_sewa)}/bulan
                </p>

                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-sm">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className={occupied ? "text-slate-700" : "text-slate-400"}>
                    {room.tenant?.nama ?? "Belum ada penghuni"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
