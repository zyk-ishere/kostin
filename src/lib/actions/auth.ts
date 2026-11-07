"use server";

import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { safeNext } from "../utils";
import type { ActionState } from "../action-state";
import { str } from "../parse";

export async function login(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = str(formData, "email");
  const passwordValue = formData.get("password");
  const password =
    typeof passwordValue === "string" ? passwordValue : "";

  if (!email || !password) {
    return { ok: false, message: "Email dan password wajib diisi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (/invalid api key/i.test(error.message)) {
      return {
        ok: false,
        message:
          "Kunci publik Supabase (NEXT_PUBLIC_SUPABASE_ANON_KEY) tidak valid. Salin ulang publishable/anon key dari Project Settings → API Keys, lalu coba lagi.",
      };
    }
    return { ok: false, message: "Email atau password salah." };
  }

  const target = safeNext(str(formData, "next"));

  redirect(target);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
