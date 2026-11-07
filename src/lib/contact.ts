/**
 * Kontak admin untuk pembuatan akun Kostin.
 * Akun dibuat manual oleh admin (berbayar), bukan pendaftaran mandiri.
 */
export const ADMIN_WHATSAPP = "6282383377494";
export const ADMIN_WHATSAPP_DISPLAY = "0823-8337-7494";

export function adminWhatsAppUrl(
  message = "Halo, saya mau membuat akun Kostin. Bisa info harga dan caranya?",
) {
  return `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
