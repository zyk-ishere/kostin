import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Circle, Home, KeyRound, Database, Terminal } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import {
  appUrl,
  isServiceRoleConfigured,
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Setup" };

export const dynamic = "force-dynamic";

function EnvRow({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-0">
      <div className="min-w-0">
        <p className="font-mono text-xs text-slate-700">{label}</p>
        <p className="truncate text-xs text-slate-400">
          {ok ? value : "belum diisi"}
        </p>
      </div>
      {ok ? (
        <Badge tone="emerald">
          <CheckCircle2 className="h-3 w-3" /> Siap
        </Badge>
      ) : (
        <Badge tone="amber">
          <Circle className="h-3 w-3" /> Kosong
        </Badge>
      )}
    </div>
  );
}

const steps = [
  {
    icon: Database,
    title: "Buat project Supabase",
    body: (
      <>
        Daftar gratis di{" "}
        <a
          className="link"
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noreferrer"
        >
          supabase.com/dashboard
        </a>{" "}
        lalu buat project baru. Tunggu sampai database selesai disiapkan.
      </>
    ),
  },
  {
    icon: Terminal,
    title: "Jalankan skema database",
    body: (
      <>
        Buka <strong>SQL Editor → New query</strong>, tempel seluruh isi file{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px]">
          supabase/schema.sql
        </code>{" "}
        dari folder project, lalu klik <strong>Run</strong>. File itu membuat
        tabel, aturan keamanan, dan bucket penyimpanan bukti transfer.
        <br />
        <span className="text-slate-500">
          Opsional: jalankan{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px]">
            supabase/seed.sql
          </code>{" "}
          untuk mengisi data contoh.
        </span>
      </>
    ),
  },
  {
    icon: KeyRound,
    title: "Buat akun admin",
    body: (
      <>
        Masuk ke <strong>Authentication → Users → Add user</strong>. Isi email
        dan password, dan pastikan opsi konfirmasi email dimatikan atau user
        sudah dikonfirmasi. Akun inilah yang dipakai login ke Kostin.
      </>
    ),
  },
  {
    icon: Home,
    title: "Isi kredensial di .env.local",
    body: (
      <>
        Salin file{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px]">
          .env.example
        </code>{" "}
        menjadi{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px]">
          .env.local
        </code>{" "}
        lalu isi nilainya dari <strong>Project Settings → API</strong>. Setelah
        itu hentikan dan jalankan ulang <code>npm run dev</code>.
      </>
    ),
  },
];

export default function SetupPage() {
  const configured = isSupabaseConfigured();
  const appUrlSet = Boolean(process.env.NEXT_PUBLIC_APP_URL);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <div className="mb-8 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-white">
          <Home className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Kostin
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Siapkan sistem dalam 4 langkah
          </h1>
        </div>
      </div>

      {configured ? (
        <Card className="mb-6 p-5">
          <p className="text-sm font-semibold text-emerald-700">
            Kredensial Supabase sudah terbaca.
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Kalau tabel belum dibuat, jalankan{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px]">
              supabase/schema.sql
            </code>{" "}
            dulu. Setelah itu{" "}
            <Link className="link" href="/login">
              masuk ke dashboard
            </Link>
            .
          </p>
        </Card>
      ) : null}

      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card key={step.title} className="p-5">
              <div className="flex gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-900 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Icon className="h-4 w-4 text-emerald-600" />
                    {step.title}
                  </h2>
                  <div className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {step.body}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 p-5">
        <h2 className="text-sm font-semibold text-slate-900">Status konfigurasi</h2>
        <p className="mt-1 text-xs text-slate-500">
          Nilai dibaca oleh server. Jangan pernah commit file{" "}
          <code className="font-mono">.env.local</code>.
        </p>
        <div className="mt-3">
          <EnvRow
            label="NEXT_PUBLIC_SUPABASE_URL"
            value={supabaseUrl}
            ok={Boolean(supabaseUrl)}
          />
          <EnvRow
            label="NEXT_PUBLIC_SUPABASE_ANON_KEY"
            value={supabaseAnonKey ? `${supabaseAnonKey.slice(0, 12)}…` : ""}
            ok={Boolean(supabaseAnonKey)}
          />
          <EnvRow
            label="SUPABASE_SERVICE_ROLE_KEY"
            value={isServiceRoleConfigured() ? "terisi" : ""}
            ok={isServiceRoleConfigured()}
          />
          <EnvRow label="NEXT_PUBLIC_APP_URL" value={appUrl} ok={appUrlSet} />
        </div>
        {!appUrlSet ? (
          <p className="mt-3 text-xs text-slate-500">
            <code className="font-mono">NEXT_PUBLIC_APP_URL</code> masih memakai
            default <code className="font-mono">http://localhost:3000</code>.
            Isi dengan domain asli setelah aplikasi di-deploy supaya link
            pembayaran di WhatsApp mengarah ke alamat yang benar.
          </p>
        ) : null}
      </Card>

      <p className="mt-6 text-center text-xs text-slate-500">
        Penjelasan lengkap ada di <strong>README.md</strong>.
      </p>
    </div>
  );
}
