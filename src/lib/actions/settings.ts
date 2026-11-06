"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "../auth";
import type { ActionState } from "../action-state";
import { num, str } from "../parse";

export async function saveSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireUser();

  const namaKost = str(formData, "nama_kost");
  if (!namaKost) {
    return { ok: false, message: "Nama kost wajib diisi." };
  }

  const jatuhTempo = Math.min(28, Math.max(1, num(formData, "jatuh_tempo_hari", 5)));

  const payload = {
    id: 1,
    nama_kost: namaKost,
    alamat: str(formData, "alamat"),
    bank: str(formData, "bank"),
    nomor_rekening: str(formData, "nomor_rekening"),
    atas_nama: str(formData, "atas_nama"),
    whatsapp_admin: str(formData, "whatsapp_admin"),
    jatuh_tempo_hari: jatuhTempo,
    denda_per_hari: Math.max(0, num(formData, "denda_per_hari")),
  };

  const { error } = await supabase.from("settings").upsert(payload);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  revalidatePath("/pengaturan");
  revalidatePath("/tagihan");
  return { ok: true, message: "Pengaturan berhasil disimpan." };
}
