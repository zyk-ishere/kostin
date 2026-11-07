"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "../auth";
import type { ActionState } from "../action-state";
import { dateField, num, str } from "../parse";
import type { createClient } from "../supabase/server";
import { jakartaToday } from "../utils";

type Db = Awaited<ReturnType<typeof createClient>>;

async function refreshRoomStatus(supabase: Db, roomId: string | null) {
  if (!roomId) return;

  const { count } = await supabase
    .from("tenants")
    .select("id", { count: "exact", head: true })
    .eq("room_id", roomId)
    .eq("status", "aktif");

  if (count && count > 0) {
    await supabase.from("rooms").update({ status: "terisi" }).eq("id", roomId);
  } else {
    await supabase
      .from("rooms")
      .update({ status: "kosong" })
      .eq("id", roomId)
      .neq("status", "perbaikan");
  }
}

export async function saveTenant(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const id = str(formData, "id");
  const nama = str(formData, "nama");
  const noHp = str(formData, "no_hp");
  const email = str(formData, "email");
  const roomId = str(formData, "room_id") || null;
  const tanggalMasuk = dateField(formData, "tanggal_masuk");
  const deposit = num(formData, "deposit");
  const status = str(formData, "status") === "keluar" ? "keluar" : "aktif";
  const catatan = str(formData, "catatan");

  if (!nama) {
    return { ok: false, message: "Nama penghuni wajib diisi." };
  }
  if (!tanggalMasuk) {
    return { ok: false, message: "Tanggal masuk wajib diisi." };
  }

  if (roomId && status === "aktif") {
    let check = supabase
      .from("tenants")
      .select("nama")
      .eq("room_id", roomId)
      .eq("status", "aktif");

    if (id) check = check.neq("id", id);

    const { data: occupant } = await check.maybeSingle();
    if (occupant) {
      return {
        ok: false,
        message: `Kamar itu sudah dihuni ${(occupant as { nama: string }).nama}.`,
      };
    }
  }

  const payload = {
    nama,
    no_hp: noHp,
    email,
    room_id: roomId,
    tanggal_masuk: tanggalMasuk,
    deposit,
    status,
    catatan,
    ...(id ? {} : { owner_id: user.id }),
  };

  if (id) {
    const { data: before } = await supabase
      .from("tenants")
      .select("room_id, tanggal_keluar")
      .eq("id", id)
      .maybeSingle();

    const beforeRow = before as {
      room_id: string | null;
      tanggal_keluar: string | null;
    } | null;

    const { error } = await supabase
      .from("tenants")
      .update({
        ...payload,
        tanggal_keluar:
          status === "keluar"
            ? (beforeRow?.tanggal_keluar ?? jakartaToday())
            : null,
      })
      .eq("id", id);

    if (error) {
      return { ok: false, message: error.message };
    }

    await refreshRoomStatus(supabase, beforeRow?.room_id ?? null);
    await refreshRoomStatus(supabase, roomId);

    revalidatePath("/penghuni");
    revalidatePath("/kamar");
    revalidatePath("/");
    redirect(`/penghuni/${id}?saved=1`);
  }

  const { data, error } = await supabase
    .from("tenants")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  await refreshRoomStatus(supabase, roomId);

  revalidatePath("/penghuni");
  revalidatePath("/kamar");
  revalidatePath("/");
  redirect(`/penghuni/${(data as { id: string }).id}?saved=1`);
}

export async function checkoutTenant(formData: FormData) {
  const { supabase } = await requireUser();
  const id = str(formData, "id");
  if (!id) return;

  const { data: before } = await supabase
    .from("tenants")
    .select("room_id")
    .eq("id", id)
    .maybeSingle();

  await supabase
    .from("tenants")
    .update({ status: "keluar", tanggal_keluar: jakartaToday() })
    .eq("id", id);

  await refreshRoomStatus(
    supabase,
    (before as { room_id: string | null } | null)?.room_id ?? null,
  );

  revalidatePath("/penghuni");
  revalidatePath("/kamar");
  revalidatePath("/");
  redirect(`/penghuni/${id}?checkedout=1`);
}

export async function deleteTenant(formData: FormData) {
  const { supabase } = await requireUser();
  const id = str(formData, "id");
  if (!id) return;

  const { data: before } = await supabase
    .from("tenants")
    .select("room_id")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("tenants").delete().eq("id", id);

  await refreshRoomStatus(
    supabase,
    (before as { room_id: string | null } | null)?.room_id ?? null,
  );

  revalidatePath("/penghuni");
  revalidatePath("/kamar");
  revalidatePath("/");
  redirect("/penghuni?deleted=1");
}
