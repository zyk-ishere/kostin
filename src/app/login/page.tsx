import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Home } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/ui";
import { login } from "@/lib/actions/auth";
import { ADMIN_WHATSAPP_DISPLAY, adminWhatsAppUrl } from "@/lib/contact";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/utils";

export const metadata: Metadata = { title: "Masuk" };

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/setup");

  const query = await searchParams;
  const next = safeNext(query.next);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
            <Home className="h-6 w-6" strokeWidth={2.2} />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
            Masuk ke Kostin
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola kamar, tagihan, dan pembayaran kost dari satu tempat.
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          {query.error === "konfirmasi" ? (
            <p className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
              Link konfirmasi tidak valid atau sudah kedaluwarsa. Coba masuk,
              atau hubungi admin lewat WhatsApp untuk link baru.
            </p>
          ) : null}
          <ActionForm action={login} submitLabel="Masuk" pendingLabel="Memeriksa…">
            <input type="hidden" name="next" value={next} />
            <Field label="Email">
              <input
                className="input"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="admin@kostku.id"
                required
              />
            </Field>
            <Field label="Password">
              <input
                className="input"
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </Field>
          </ActionForm>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Belum punya akun?{" "}
          <a
            href={adminWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-emerald-700 hover:underline"
          >
            Hubungi admin via WhatsApp
          </a>
        </p>
        <p className="mt-1 text-center text-xs text-slate-400">
          Akun dibuat berbayar oleh admin · {ADMIN_WHATSAPP_DISPLAY}
        </p>
      </div>
    </div>
  );
}
