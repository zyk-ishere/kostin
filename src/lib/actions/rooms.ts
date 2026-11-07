"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "../auth";
import type { ActionState } from "../action-state";
import { num, str } from "../parse";

const ROOM_STATUS = ["kosong", "terisi", "perbaikan"] as const;
type RoomStatusValue = (typeof ROOM_STATUS)[number];

function parseStatus(value: string): RoomStatusValue {
  return (ROOM_STATUS as readonly string[]).includes(value)
    ? (value as RoomStatusValue)
    : "kosong";
}

export async function saveRoom(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const id = str(formData, "id");
  const nomor = str(formData, "nomor");
  const tipe = str(formData, "tipe") || "Standar";
  const harga = num(formData, "harga_sewa");
  const fasilitas = str(formData, "fasilitas");
  const status = parseStatus(str(formData, "status"));

  if (!nomor) {
    return { ok: false, message: "Nomor kamar wajib diisi." };
  }
  if (harga <= 0) {
    return { ok: false, message: "Harga sewa harus lebih dari 0." };
  }

  const payload = {
    nomor,
    tipe,
    harga_sewa: harga,
    fasilitas,
    status,
    ...(id ? {} : { owner_id: user.id }),
  };

  if (id) {
    const { error } = await supabase
      .from("rooms")
      .update(payload)
      .eq("id", id);
    if (error) {
      return {
        ok: false,
        message:
          error.code === "23505"
            ? "Nomor kamar itu sudah dipakai."
            : error.message,
      };
    }
    revalidatePath("/kamar");
    revalidatePath("/");
    redirect(`/kamar/${id}?saved=1`);
  }

  const { data, error } = await supabase
    .from("rooms")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return {
      ok: false,
      message:
        error.code === "23505"
          ? "Nomor kamar itu sudah dipakai."
          : error.message,
    };
  }

  revalidatePath("/kamar");
  revalidatePath("/");
  redirect(`/kamar/${(data as { id: string }).id}?saved=1`);
}

export async function deleteRoom(formData: FormData) {
  const { supabase } = await requireUser();
  const id = str(formData, "id");

  if (!id) return;

  const { count } = await supabase
    .from("tenants")
    .select("id", { count: "exact", head: true })
    .eq("room_id", id)
    .eq("status", "aktif");

  if (count && count > 0) {
    redirect(`/kamar/${id}?error=masih-dihuni`);
  }

  await supabase.from("rooms").delete().eq("id", id);
  revalidatePath("/kamar");
  revalidatePath("/");
  redirect("/kamar?deleted=1");
}
