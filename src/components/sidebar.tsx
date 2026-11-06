"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  DoorOpen,
  Home,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

export function Sidebar({
  kostName,
  email,
  pendingCount,
}: {
  kostName: string;
  email: string;
  pendingCount: number;
}) {
  const pathname = usePathname();

  const nav: NavItem[] = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/kamar", label: "Kamar", icon: DoorOpen },
    { href: "/penghuni", label: "Penghuni", icon: Users },
    { href: "/tagihan", label: "Tagihan", icon: ReceiptText },
    {
      href: "/pembayaran",
      label: "Pembayaran",
      icon: Wallet,
      badge: pendingCount,
    },
    { href: "/laporan", label: "Laporan", icon: BarChart3 },
    { href: "/pengaturan", label: "Pengaturan", icon: Settings },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-slate-800/60 bg-slate-950 lg:flex">
        <div className="flex items-center gap-3 px-5 py-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500 text-slate-950">
            <Home className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{kostName}</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Kostin
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                <span className="flex-1">{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-amber-950">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800/60 p-4">
          <p className="px-2 pb-2 text-[11px] uppercase tracking-wider text-slate-500">
            Masuk sebagai
          </p>
          <p className="truncate px-2 text-xs text-slate-400">{email}</p>
          <form action={logout}>
            <button
              type="submit"
              className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <div className="lg:hidden">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-white">
              <Home className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold text-slate-900">{kostName}</span>
          </Link>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Keluar"
              className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium",
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-500 hover:bg-slate-50",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {item.badge && item.badge > 0 ? (
                  <span className="rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-amber-950">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
