// Pindahkan bukti transfer lama ke folder pemilik:
//   <owner_id>/<invoice_id>/<file>
// Jalankan setelah supabase/migration-multi-user.sql:
//   node scripts/migrate-storage.mjs
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const envPath = new URL("../.env.local", import.meta.url);
if (!existsSync(envPath)) {
  console.error(".env.local tidak ditemukan.");
  process.exit(1);
}

const raw = await readFile(envPath, "utf8");
const env = {};
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY kosong.");
  process.exit(1);
}

const auth = { apikey: key, Authorization: `Bearer ${key}` };
const enc = (p) => p.split("/").map(encodeURIComponent).join("/");

const res = await fetch(
  `${url}/rest/v1/payments?select=id,owner_id,bukti_path&bukti_path=not.is.null`,
  { headers: auth },
);
if (!res.ok) {
  console.error("Gagal membaca payments:", res.status, await res.text());
  process.exit(1);
}
const rows = await res.json();

let moved = 0;
for (const row of rows) {
  const oldPath = row.bukti_path;
  if (!oldPath || !row.owner_id) continue;
  if (oldPath.startsWith(`${row.owner_id}/`)) continue;

  const newPath = `${row.owner_id}/${oldPath}`;
  console.log(`Pindah: ${oldPath}\n     -> ${newPath}`);

  const download = await fetch(
    `${url}/storage/v1/object/bukti-transfer/${enc(oldPath)}`,
    { headers: auth },
  );
  if (!download.ok) {
    console.error(`  gagal unduh (${download.status}); dilewati.`);
    continue;
  }
  const body = Buffer.from(await download.arrayBuffer());
  const contentType =
    download.headers.get("content-type") ?? "application/octet-stream";

  const upload = await fetch(
    `${url}/storage/v1/object/bukti-transfer/${enc(newPath)}`,
    {
      method: "POST",
      headers: {
        ...auth,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body,
    },
  );
  if (!upload.ok) {
    console.error(`  gagal unggah (${upload.status}):`, await upload.text());
    continue;
  }

  const patch = await fetch(`${url}/rest/v1/payments?id=eq.${row.id}`, {
    method: "PATCH",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ bukti_path: newPath }),
  });
  if (!patch.ok) {
    console.error(`  gagal update database (${patch.status}).`);
    continue;
  }

  const del = await fetch(`${url}/storage/v1/object/bukti-transfer`, {
    method: "DELETE",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [oldPath] }),
  });
  if (!del.ok) {
    console.warn(`  file lama gagal dihapus (${del.status}), tidak masalah.`);
  }

  moved += 1;
}

console.log(`Selesai. ${moved} bukti dipindahkan.`);
