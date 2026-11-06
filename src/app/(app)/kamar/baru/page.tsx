import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { RoomForm } from "@/components/room-form";

export const metadata: Metadata = { title: "Tambah kamar" };

export default function KamarBaruPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Tambah kamar"
        description="Data kamar dipakai untuk menghitung tagihan sewa bulanan."
        actions={
          <Link href="/kamar" className="btn btn-ghost btn-sm">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        }
      />

      <Card className="p-5 sm:p-6">
        <RoomForm submitLabel="Simpan kamar" />
      </Card>
    </div>
  );
}
