import type { InvoiceStatus } from "./types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatRupiah(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return "Rp" + new Intl.NumberFormat("id-ID").format(Math.round(n));
}

/** Format tanggal ISO (YYYY-MM-DD) menjadi "6 Nov 2026". */
export function formatTanggal(iso: string | null | undefined) {
  if (!iso) return "—";
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** "2026-11" -> "November 2026" */
export function formatBulan(periode: string) {
  const [tahun, bulan] = periode.split("-").map(Number);
  if (!tahun || !bulan) return periode;
  const date = new Date(Date.UTC(tahun, bulan - 1, 1));
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Tanggal hari ini menurut zona waktu Jakarta (YYYY-MM-DD). */
export function jakartaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Bulan berjalan dalam format "YYYY-MM". */
export function currentMonth() {
  return jakartaToday().slice(0, 7);
}

export function monthBounds(bulan: string) {
  const [tahun, bulanKe] = bulan.split("-").map(Number);
  const start = `${bulan}-01`;
  const end = new Date(Date.UTC(tahun, bulanKe, 0)).toISOString().slice(0, 10);
  return { start, end };
}

export function isPastDate(iso: string) {
  return iso.slice(0, 10) < jakartaToday();
}

export function daysLate(jatuhTempo: string) {
  const due = Date.parse(`${jatuhTempo.slice(0, 10)}T00:00:00Z`);
  const now = Date.parse(`${jakartaToday()}T00:00:00Z`);
  if (Number.isNaN(due)) return 0;
  return Math.max(0, Math.round((now - due) / 86_400_000));
}

export function invoiceStatus(invoice: {
  total: number;
  dibayar: number;
  jatuh_tempo: string;
}): InvoiceStatus {
  if (invoice.dibayar >= invoice.total) return "lunas";
  if (isPastDate(invoice.jatuh_tempo)) return "telat";
  if (invoice.dibayar > 0) return "sebagian";
  return "belum";
}

/** Validasi redirect internal: hanya path relatif yang aman. */
export function safeNext(value: string | null | undefined): string {
  if (typeof value !== "string" || !value) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  if (value.includes("\\")) return "/";
  if (value.includes("://")) return "/";
  if (/[ \t\r\n]/.test(value)) return "/";
  return value;
}

/** Nomor HP Indonesia -> format wa.me (62xxx). */
export function waNumber(noHp: string) {
  const digits = (noHp || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return `62${digits}`;
}

export function waLink(noHp: string, message: string) {
  const nomor = waNumber(noHp);
  if (!nomor) return null;
  return `https://wa.me/${nomor}?text=${encodeURIComponent(message)}`;
}
