import { listInvoices } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { currentMonth } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const requested = url.searchParams.get("bulan") ?? "";
  const bulan = /^\d{4}-\d{2}$/.test(requested) ? requested : currentMonth();

  const invoices = await listInvoices({ bulan });

  const header = [
    "Periode",
    "Penghuni",
    "Kamar",
    "Jatuh tempo",
    "Total",
    "Dibayar",
    "Sisa",
    "Status",
  ];

  const rows = invoices.map((invoice) => [
    bulan,
    invoice.tenant?.nama ?? "",
    invoice.room?.nomor ?? "",
    invoice.jatuh_tempo,
    String(invoice.total),
    String(invoice.dibayar),
    String(invoice.sisa),
    invoice.status,
  ]);

  const csv = [header, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\r\n");

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-kost-${bulan}.csv"`,
    },
  });
}
