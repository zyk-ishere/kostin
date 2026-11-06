import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { serviceRoleKey, supabaseUrl } from "./config";

/**
 * Client dengan service role. HANYA untuk kode server.
 * Dipakai oleh halaman publik /bayar/[id] supaya penghuni bisa mengunggah
 * bukti transfer tanpa akun, tanpa membuka seluruh data ke anon key.
 */
export function createAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY belum diatur. Tambahkan ke .env.local untuk memakai halaman pembayaran publik.",
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, cache: "no-store" as RequestCache }),
    },
  });
}
