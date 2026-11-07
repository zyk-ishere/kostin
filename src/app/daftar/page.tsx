import type { Metadata } from "next";
import Link from "next/link";
import { Home, MessageCircle } from "lucide-react";
import {
  ADMIN_WHATSAPP_DISPLAY,
  adminWhatsAppUrl,
} from "@/lib/contact";

export const metadata: Metadata = { title: "Buat akun" };

export const dynamic = "force-dynamic";

export default function BuatAkunPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-[460px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
            <Home className="h-6 w-6" strokeWidth={2.2} />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
            Buat akun Kostin
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Akun Kostin dibuat oleh admin dan bersifat berbayar.
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          <p className="text-sm leading-relaxed text-slate-600">
            Setiap akun punya dashboard, kamar, penghuni, dan tagihan sendiri
            yang tidak bisa dilihat akun lain. Untuk membuat akun, silakan
            hubungi admin lewat WhatsApp.
          </p>

          <ol className="mt-5 space-y-3 text-sm text-slate-600">
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                1
              </span>
              Hubungi admin dan lakukan pembayaran.
            </li>
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                2
              </span>
              Admin membuatkan akun dengan email &amp; password kamu.
            </li>
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                3
              </span>
              Masuk lewat halaman login dan mulai kelola kostmu.
            </li>
          </ol>

          <a
            href={adminWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary mt-6 w-full"
          >
            <MessageCircle className="h-4 w-4" />
            Hubungi admin: {ADMIN_WHATSAPP_DISPLAY}
          </a>

          <p className="mt-3 text-center text-xs text-slate-500">
            Nomor WhatsApp admin: {ADMIN_WHATSAPP_DISPLAY}
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-semibold text-emerald-700 hover:underline"
          >
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
