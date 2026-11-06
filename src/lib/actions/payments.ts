"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "../auth";
import type { ActionState } from "../action-state";
import { dateField, fileField, num, str } from "../parse";
import { createAdminClient } from "../supabase/admin";
import type { createClient } from "../supabase/server";
import { formatRupiah, jakartaToday } from "../utils";

type Db = Awaited<ReturnType<typeof createClient>>;

const BUCKET = "bukti-transfer";
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const METHODS = ["transfer", "tunai", "qris", "lainnya"] as const;

type InvoiceForPayment = {
  id: string;
  total: number;
  payments: { jumlah: number; status: string }[] | null;
};

async function uploadBukti(
  client: Db,
  invoiceId: string,
  file: File | null,
): Promise<{ path: string | null; error?: string }> {
  if (!file) return { path: null };

  if (file.size > MAX_SIZE) {
    return { path: null, error: "Ukuran bukti maksimal 5 MB." };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { path: null, error: "Format bukti harus JPG, PNG, WEBP, atau PDF." };
  }

  const extension =
    (file.name.split(".").pop() ?? "jpg")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 5) || "jpg";
  const path = `${invoiceId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await client.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return { path: null, error: `Gagal mengunggah bukti: ${error.message}` };
  }

  return { path };
}

function paidAmount(invoice: InvoiceForPayment | null) {
  return (invoice?.payments ?? [])
    .filter((payment) => payment.status === "valid")
    .reduce((sum, payment) => sum + Number(payment.jumlah ?? 0), 0);
}

/** Catat pembayaran yang sudah diterima admin (langsung valid). */
export async function recordPayment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const invoiceId = str(formData, "invoice_id");
  const jumlah = num(formData, "jumlah");
  const metodeRaw = str(formData, "metode");
  const metode = (METHODS as readonly string[]).includes(metodeRaw)
    ? metodeRaw
    : "transfer";
  const tanggalBayar = dateField(formData, "tanggal_bayar") ?? jakartaToday();
  const pengirim = str(formData, "pengirim");
  const catatan = str(formData, "catatan");
  const bukti = fileField(formData, "bukti");

  if (!invoiceId) return { ok: false, message: "Tagihan tidak ditemukan." };
  if (jumlah <= 0) {
    return { ok: false, message: "Jumlah pembayaran harus lebih dari 0." };
  }

  const { data } = await supabase
    .from("invoices")
    .select("id, total, payments(jumlah,status)")
    .eq("id", invoiceId)
    .maybeSingle();

  const invoice = data as InvoiceForPayment | null;
  if (!invoice) return { ok: false, message: "Tagihan tidak ditemukan." };

  const sisa = Math.max(0, Number(invoice.total) - paidAmount(invoice));
  if (sisa <= 0) {
    return { ok: false, message: "Tagihan ini sudah lunas." };
  }
  if (jumlah > sisa) {
    return {
      ok: false,
      message: `Jumlah melebihi sisa tagihan (${formatRupiah(sisa)}).`,
    };
  }

  const uploaded = await uploadBukti(supabase, invoiceId, bukti);
  if (uploaded.error) return { ok: false, message: uploaded.error };

  const { error } = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    jumlah,
    metode,
    tanggal_bayar: tanggalBayar,
    pengirim,
    catatan,
    bukti_path: uploaded.path,
    status: "valid",
    verified_by: user.email ?? null,
    verified_at: new Date().toISOString(),
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  revalidatePath("/tagihan");
  revalidatePath(`/tagihan/${invoiceId}`);
  revalidatePath("/pembayaran");
  revalidatePath("/laporan");
  redirect(`/tagihan/${invoiceId}?sukses=1`);
}

export async function approvePayment(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = str(formData, "id");
  if (!id) return;

  await supabase
    .from("payments")
    .update({
      status: "valid",
      verified_by: user.email ?? null,
      verified_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/");
  revalidatePath("/pembayaran");
  revalidatePath("/tagihan");
  revalidatePath("/laporan");
}

export async function rejectPayment(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = str(formData, "id");
  if (!id) return;

  await supabase
    .from("payments")
    .update({
      status: "ditolak",
      verified_by: user.email ?? null,
      verified_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/");
  revalidatePath("/pembayaran");
  revalidatePath("/tagihan");
  revalidatePath("/laporan");
}

export async function deletePayment(formData: FormData) {
  const { supabase } = await requireUser();
  const id = str(formData, "id");
  if (!id) return;

  await supabase.from("payments").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/pembayaran");
  revalidatePath("/tagihan");
  revalidatePath("/laporan");
}

/** Dipakai halaman publik /bayar/[id]. Penghuni mengunggah bukti transfer. */
export async function submitPublicPayment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const invoiceId = str(formData, "invoice_id");
  const jumlah = num(formData, "jumlah");
  const pengirim = str(formData, "pengirim");
  const catatan = str(formData, "catatan");
  const tanggalBayar = dateField(formData, "tanggal_bayar") ?? jakartaToday();
  const bukti = fileField(formData, "bukti");

  if (!/^[0-9a-f-]{36}$/i.test(invoiceId)) {
    return { ok: false, message: "Link pembayaran tidak valid." };
  }
  if (!pengirim) {
    return { ok: false, message: "Nama pengirim wajib diisi." };
  }
  if (jumlah <= 0) {
    return { ok: false, message: "Jumlah transfer harus lebih dari 0." };
  }
  if (!bukti) {
    return { ok: false, message: "Bukti transfer wajib diunggah." };
  }

  const supabase = createAdminClient();

  const { data } = await supabase
    .from("invoices")
    .select("id, total, payments(jumlah,status)")
    .eq("id", invoiceId)
    .maybeSingle();

  const invoice = data as InvoiceForPayment | null;
  if (!invoice) {
    return { ok: false, message: "Tagihan tidak ditemukan." };
  }

  const sisa = Math.max(0, Number(invoice.total) - paidAmount(invoice));
  if (sisa <= 0) {
    return { ok: false, message: "Tagihan ini sudah lunas." };
  }
  if (jumlah > sisa) {
    return {
      ok: false,
      message: `Jumlah melebihi sisa tagihan (${formatRupiah(sisa)}).`,
    };
  }

  const uploaded = await uploadBukti(supabase, invoiceId, bukti);
  if (uploaded.error) return { ok: false, message: uploaded.error };

  const { error } = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    jumlah,
    metode: "transfer",
    tanggal_bayar: tanggalBayar,
    pengirim,
    catatan,
    bukti_path: uploaded.path,
    status: "menunggu",
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/bayar/${invoiceId}`);
  redirect(`/bayar/${invoiceId}?sukses=1`);
}
