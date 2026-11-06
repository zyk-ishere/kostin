import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TenantForm } from "@/components/tenant-form";
import { Card, PageHeader } from "@/components/ui";
import { listRooms } from "@/lib/data";

export const metadata: Metadata = { title: "Tambah penghuni" };

export default async function PenghuniBaruPage() {
  const rooms = await listRooms();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Tambah penghuni"
        description="Penghuni aktif akan otomatis masuk daftar pembuat tagihan bulanan."
        actions={
          <Link href="/penghuni" className="btn btn-ghost btn-sm">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        }
      />

      <Card className="p-5 sm:p-6">
        <TenantForm rooms={rooms} submitLabel="Simpan penghuni" />
      </Card>
    </div>
  );
}
