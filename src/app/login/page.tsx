import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Home } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/ui";
import { login } from "@/lib/actions/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Masuk" };

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/setup");

  const query = await searchParams;
  const next =
    typeof query.next === "string" &&
    query.next.startsWith("/") &&
    !query.next.startsWith("//")
      ? query.next
      : "/";

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

        <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">
          Akun admin dibuat lewat Supabase → Authentication → Users.
          <br />
          Belum menyiapkan database?{" "}
          <Link href="/setup" className="link">
            Lihat panduan setup
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
