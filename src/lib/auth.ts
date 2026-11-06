import { createClient } from "./supabase/server";

/** Pastikan ada sesi login. Dipanggil di setiap Server Action yang mengubah data. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sesi tidak valid. Silakan login ulang.");
  }

  return { supabase, user };
}
