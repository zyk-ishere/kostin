import type { Metadata } from "next";
import Link from "next/link";
import { Home, SearchX } from "lucide-react";

export const metadata: Metadata = { title: "Halaman tidak ditemukan" };

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <div className="card w-full max-w-md p-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <SearchX className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Alamat ini tidak tersedia. Kalau kamu membuka link pembayaran dari
          WhatsApp, minta link terbaru ke admin kost.
        </p>
        <Link href="/" className="btn btn-primary mt-6 w-full">
          <Home className="h-4 w-4" /> Kembali ke dashboard
        </Link>
      </div>
    </main>
  );
}
