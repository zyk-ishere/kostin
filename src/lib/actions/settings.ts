"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "../auth";
import type { ActionState } from "../action-state";
import { fileField, num, str } from "../parse";

const QRIS_BUCKET = "qris";
const QRIS_MAX_SIZE = 5 * 1024 * 1024;
const QRIS_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function saveSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const namaKost = str(formData, "nama_kost");
  if (!namaKost) {
    return { ok: false, message: "Nama kost wajib diisi." };
  }

  const jatuhTempo = Math.min(28, Math.max(1, num(formData, "jatuh_tempo_hari", 5)));

  const payload = {
    owner_id: user.id,
    nama_kost: namaKost,
    alamat: str(formData, "alamat"),
    bank: str(formData, "bank"),
    nomor_rekening: str(formData, "nomor_rekening"),
    atas_nama: str(formData, "atas_nama"),
    whatsapp_admin: str(formData, "whatsapp_admin"),
    jatuh_tempo_hari: jatuhTempo,
    denda_per_hari: Math.max(0, num(formData, "denda_per_hari")),
  };

  const { error } = await supabase
    .from("settings")
    .upsert(payload, { onConflict: "owner_id" });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  revalidatePath("/pengaturan");
  revalidatePath("/tagihan");
  return { ok: true, message: "Pengaturan berhasil disimpan." };
}

/** Unggah / ganti / hapus foto QRIS bisnis milik akun yang sedang login. */
export async function saveQris(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const file = fileField(formData, "qris");
  const hapus = str(formData, "hapus_qris") === "on";

  const { data: current } = await supabase
    .from("settings")
    .select("qris_path")
    .limit(1)
    .maybeSingle();
  const oldPath = (current as { qris_path: string | null } | null)?.qris_path;

  if (!file && !hapus) {
    return {
      ok: false,
      message: "Pilih foto QRIS dulu, atau centang “Hapus QRIS”.",
    };
  }

  if (hapus) {
    if (oldPath) {
      await supabase.storage.from(QRIS_BUCKET).remove([oldPath]);
    }
    const { error } = await supabase
      .from("settings")
      .update({ qris_path: null })
      .eq("owner_id", user.id);
    if (error) return { ok: false, message: error.message };

    revalidatePath("/pengaturan");
    return { ok: true, message: "Foto QRIS dihapus." };
  }

  if (!file) return { ok: false, message: "Pilih foto QRIS dulu." };
  if (file.size > QRIS_MAX_SIZE) {
    return { ok: false, message: "Ukuran foto QRIS maksimal 5 MB." };
  }
  const extension = QRIS_TYPES[file.type];
  if (!extension) {
    return { ok: false, message: "Format QRIS harus JPG, PNG, atau WEBP." };
  }

  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from(QRIS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return {
      ok: false,
      message: `Gagal mengunggah QRIS: ${uploadError.message}`,
    };
  }

  const { error: saveError } = await supabase
    .from("settings")
    .upsert(
      { owner_id: user.id, qris_path: path },
      { onConflict: "owner_id" },
    );

  if (saveError) {
    await supabase.storage.from(QRIS_BUCKET).remove([path]);
    return { ok: false, message: saveError.message };
  }

  if (oldPath) {
    await supabase.storage.from(QRIS_BUCKET).remove([oldPath]);
  }

  revalidatePath("/pengaturan");
  return { ok: true, message: "Foto QRIS berhasil disimpan." };
}
