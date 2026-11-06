import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "./config";

/**
 * Supabase client untuk Server Component, Server Action, dan Route Handler.
 * Sesi disimpan di cookie sehingga proxy dan server bisa membaca user yang login.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component tidak boleh menulis cookie. Aman diabaikan karena
          // penyegaran sesi sudah ditangani oleh proxy.
        }
      },
    },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, cache: "no-store" as RequestCache }),
    },
  });
}
