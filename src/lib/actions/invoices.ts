"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "../auth";
import type { ActionState } from "../action-state";
import { monthField, num, str } from "../parse";
import {
  currentMonth,
  daysLate,
  formatBulan,
  formatRupiah,
  jakartaToday,
} from "../utils";

type TenantRow = {
  id: string;
  room_id: string | null;
  room: { harga_sewa: number } | null;
};

type InvoiceRow = {
  id: string;
  total: number;
  denda: number;
  jatuh_tempo: string;
  payments: { jumlah: number; status: string }[] | null;
};

function revalidateInvoicePaths(invoiceId?: string) {
  revalidatePath("/");
  revalidatePath("/tagihan");
  revalidatePath("/laporan");
  revalidatePath("/pembayaran");
  if (invoiceId) revalidatePath(`/tagihan/${invoiceId}`);
}

/** Buat tagihan bulanan untuk semua penghuni aktif yang belum punya tagihan. */
export async function generateInvoices(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const bulan = monthField(formData, "bulan") ?? currentMonth();
  const periode = `${bulan}-01`;

  const { data: settings } = await supabase
    .from("settings")
    .select("jatuh_tempo_hari")
    .limit(1)
    .maybeSingle();

  const dueDay = Number(
    (settings as { jatuh_tempo_hari: number } | null)?.jatuh_tempo_hari ?? 5,
  );
  const jatuhTempo = `${bulan}-${String(dueDay).padStart(2, "0")}`;

  const { data: tenantData, error: tenantError } = await supabase
    .from("tenants")
    .select("id, room_id, room:rooms(harga_sewa)")
    .eq("status", "aktif");

  if (tenantError) {
    return { ok: false, message: tenantError.message };
  }

  const tenants = (tenantData ?? []) as unknown as TenantRow[];
  if (tenants.length === 0) {
    return { ok: false, message: "Belum ada penghuni aktif." };
  }

  const { data: existingData } = await supabase
    .from("invoices")
    .select("tenant_id")
    .eq("periode", periode);

  const existing = new Set(
    ((existingData ?? []) as { tenant_id: string }[]).map(
      (row) => row.tenant_id,
    ),
  );

  const rows = tenants
    .filter((tenant) => !existing.has(tenant.id))
    .map((tenant) => ({
      tenant_id: tenant.id,
      room_id: tenant.room_id,
      periode,
      jatuh_tempo: jatuhTempo,
      sewa: Number(tenant.room?.harga_sewa ?? 0),
      owner_id: user.id,
    }));

  if (rows.length === 0) {
    return {
      ok: true,
      message: `Semua tagihan ${formatBulan(bulan)} sudah dibuat sebelumnya.`,
    };
  }

  const { error } = await supabase.from("invoices").insert(rows);
  if (error) {
    return { ok: false, message: error.message };
  }

  revalidateInvoicePaths();
  return {
    ok: true,
    message: `${rows.length} tagihan ${formatBulan(bulan)} berhasil dibuat.`,
  };
}

/** Hitung ulang denda untuk semua tagihan yang lewat jatuh tempo. */
export async function applyLateFees(
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireUser();

  const { data: settings } = await supabase
    .from("settings")
    .select("denda_per_hari")
    .limit(1)
    .maybeSingle();

  const dendaPerHari = Number(
    (settings as { denda_per_hari: number } | null)?.denda_per_hari ?? 0,
  );

  if (dendaPerHari <= 0) {
    return {
      ok: false,
      message: "Atur nominal denda per hari di halaman Pengaturan dulu.",
    };
  }

  const { data } = await supabase
    .from("invoices")
    .select("id, total, denda, jatuh_tempo, payments(jumlah,status)");

  const invoices = (data ?? []) as InvoiceRow[];
  let updated = 0;
  let totalDenda = 0;

  for (const invoice of invoices) {
    const dibayar = (invoice.payments ?? [])
      .filter((payment) => payment.status === "valid")
      .reduce((sum, payment) => sum + Number(payment.jumlah ?? 0), 0);

    if (dibayar >= Number(invoice.total)) continue;
    if (invoice.jatuh_tempo >= jakartaToday()) continue;

    const denda = Math.max(0, daysLate(invoice.jatuh_tempo) * dendaPerHari);
    if (denda === Number(invoice.denda)) continue;

    const { error } = await supabase
      .from("invoices")
      .update({ denda })
      .eq("id", invoice.id);

    if (!error) {
      updated += 1;
      totalDenda += denda;
    }
  }

  revalidateInvoicePaths();

  if (updated === 0) {
    return {
      ok: true,
      message: "Tidak ada tagihan telat yang perlu diperbarui.",
    };
  }

  return {
    ok: true,
    message: `Denda diperbarui untuk ${updated} tagihan (total ${formatRupiah(totalDenda)}).`,
  };
}

/** Ubah rincian tagihan: listrik, air, biaya lain, diskon, catatan. */
export async function updateInvoiceDetails(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireUser();

  const id = str(formData, "id");
  if (!id) return { ok: false, message: "Tagihan tidak ditemukan." };

  const payload = {
    listrik: Math.max(0, num(formData, "listrik")),
    air: Math.max(0, num(formData, "air")),
    biaya_lain: Math.max(0, num(formData, "biaya_lain")),
    diskon: Math.max(0, num(formData, "diskon")),
    catatan: str(formData, "catatan"),
  };

  const { error } = await supabase
    .from("invoices")
    .update(payload)
    .eq("id", id);

  if (error) return { ok: false, message: error.message };

  revalidateInvoicePaths(id);
  return { ok: true, message: "Rincian tagihan diperbarui." };
}

export async function deleteInvoice(formData: FormData) {
  const { supabase } = await requireUser();
  const id = str(formData, "id");
  if (!id) return;

  await supabase.from("invoices").delete().eq("id", id);
  revalidateInvoicePaths();
  redirect("/tagihan?deleted=1");
}
