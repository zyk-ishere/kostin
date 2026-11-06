import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, DoorOpen, Trash2, User } from "lucide-react";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { RoomForm } from "@/components/room-form";
import { Badge, Card, CardHeader, Notice, PageHeader, type Tone } from "@/components/ui";
import { deleteRoom } from "@/lib/actions/rooms";
import { getRoom, listTenants } from "@/lib/data";
import { formatRupiah, formatTanggal } from "@/lib/utils";

export const metadata: Metadata = { title: "Detail kamar" };

export default async function KamarDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const room = await getRoom(id);
  if (!room) notFound();

  const tenants = await listTenants();
  const occupant =
    tenants.find(
      (tenant) => tenant.room_id === room.id && tenant.status === "aktif",
    ) ?? null;

  const tone: Tone =
    room.status === "perbaikan" ? "amber" : occupant ? "emerald" : "slate";

  return (
    <div>
      <PageHeader
        title={`Kamar ${room.nomor}`}
        description={`${room.tipe} · ${formatRupiah(room.harga_sewa)}/bulan`}
        actions={
          <Link href="/kamar" className="btn btn-ghost btn-sm">
            <ArrowLeft className="h-4 w-4" /> Semua kamar
          </Link>
        }
      />

      {query.saved ? <div className="mb-4"><Notice>Perubahan kamar tersimpan.</Notice></div> : null}
      {query.error === "masih-dihuni" ? (
        <div className="mb-4">
          <Notice tone="rose">
            Kamar tidak bisa dihapus karena masih ada penghuni aktif. Pindahkan
            atau checkout penghuni terlebih dahulu.
          </Notice>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Data kamar" description="Ubah detail dan harga sewa." />
          <div className="p-5 sm:p-6">
            <RoomForm room={room} submitLabel="Simpan perubahan" />
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Status" />
            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Status kamar</span>
                <Badge tone={tone}>
                  {room.status === "perbaikan"
                    ? "Perbaikan"
                    : occupant
                      ? "Terisi"
                      : "Kosong"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Harga sewa</span>
                <span className="text-sm font-semibold text-slate-900">
                  {formatRupiah(room.harga_sewa)}
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-500">Fasilitas</p>
                <p className="mt-1 text-sm text-slate-800">
                  {room.fasilitas || "—"}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Penghuni saat ini" />
            {occupant ? (
              <div className="p-5">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-600" />
                  <Link
                    href={`/penghuni/${occupant.id}`}
                    className="text-sm font-semibold text-slate-900 hover:text-emerald-700"
                  >
                    {occupant.nama}
                  </Link>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {occupant.no_hp || "Tanpa nomor HP"} · masuk{" "}
                  {formatTanggal(occupant.tanggal_masuk)}
                </p>
                <Link
                  href={`/penghuni/${occupant.id}`}
                  className="btn btn-ghost btn-sm mt-4 w-full"
                >
                  Lihat penghuni
                </Link>
              </div>
            ) : (
              <div className="p-5">
                <p className="text-sm text-slate-500">
                  Kamar ini belum punya penghuni aktif.
                </p>
                <Link
                  href="/penghuni/baru"
                  className="btn btn-primary btn-sm mt-3 w-full"
                >
                  <DoorOpen className="h-4 w-4" /> Daftarkan penghuni
                </Link>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-rose-700">Hapus kamar</h2>
            <p className="mt-1 text-xs text-slate-500">
              Kamar hanya bisa dihapus kalau tidak ada penghuni aktif.
            </p>
            <form action={deleteRoom} className="mt-3">
              <input type="hidden" name="id" value={room.id} />
              <ConfirmSubmit message={`Hapus kamar ${room.nomor}? Tindakan ini tidak bisa dibatalkan.`}>
                <Trash2 className="h-4 w-4" /> Hapus kamar
              </ConfirmSubmit>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
