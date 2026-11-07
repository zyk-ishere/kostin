"use server";

import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { appUrl } from "../supabase/config";
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

  const next = str(formData, "next");
  const target =
    next.startsWith("/") && !next.startsWith("//") ? next : "/";

  redirect(target);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Buat akun baru. Setiap akun otomatis mendapat dashboard sendiri. */
export async function register(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = str(formData, "email").toLowerCase();
  const passwordValue = formData.get("password");
  const password =
    typeof passwordValue === "string" ? passwordValue : "";
  const confirmValue = formData.get("confirm");
  const confirm = typeof confirmValue === "string" ? confirmValue : "";

  if (!email || !password) {
    return { ok: false, message: "Email dan password wajib diisi." };
  }
  if (password.length < 6) {
    return { ok: false, message: "Password minimal 6 karakter." };
  }
  if (password !== confirm) {
    return { ok: false, message: "Konfirmasi password tidak sama." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    const already = /already registered|already exists|user already/i.test(
      error.message,
    );
    return {
      ok: false,
      message: already
        ? "Email ini sudah terdaftar. Silakan masuk."
        : error.message,
    };
  }

  // Kalau konfirmasi email dimatikan di Supabase, sesi langsung aktif.
  if (data.session) redirect("/");

  return {
    ok: true,
    message:
      "Akun berhasil dibuat. Buka email konfirmasi dari Supabase, lalu masuk.",
  };
}
