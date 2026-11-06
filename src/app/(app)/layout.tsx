import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { countPendingPayments, getSettings } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [settings, pendingCount] = await Promise.all([
    getSettings(),
    countPendingPayments(),
  ]);

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar
        kostName={settings?.nama_kost ?? "Kost Saya"}
        email={user.email ?? ""}
        pendingCount={pendingCount}
      />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
