export function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function num(formData: FormData, key: string, fallback = 0) {
  const raw = str(formData, key).replace(/[^\d-]/g, "");
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

export function dateField(formData: FormData, key: string) {
  const value = str(formData, key);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export function monthField(formData: FormData, key: string) {
  const value = str(formData, key);
  return /^\d{4}-\d{2}$/.test(value) ? value : null;
}

export function fileField(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  if (value instanceof File && value.size > 0) return value;
  return null;
}
