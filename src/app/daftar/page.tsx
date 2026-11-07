import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Home } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/ui";
import { register } from "@/lib/actions/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Daftar" };

export const dynamic = "force-dynamic";

export default async function DaftarPage() {
  if (!isSupabaseConfigured()) redirect("/setup");

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
            Buat akun Kostin
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Setiap akun punya dashboard, kamar, dan tagihan sendiri.
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          <ActionForm
            action={register}
            submitLabel="Daftar"
            pendingLabel="Membuat akun…"
          >
            <Field label="Email">
              <input
                className="input"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="kamu@email.com"
                required
              />
            </Field>
            <Field label="Password" hint="Minimal 6 karakter.">
              <input
                className="input"
                type="password"
                name="password"
                autoComplete="new-password"
                placeholder="••••••••"
                required
              />
            </Field>
            <Field label="Ulangi password">
              <input
                className="input"
                type="password"
                name="confirm"
                autoComplete="new-password"
                placeholder="••••••••"
                required
              />
            </Field>
          </ActionForm>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-emerald-700 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
