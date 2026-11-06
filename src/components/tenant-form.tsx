import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/ui";
import { saveTenant } from "@/lib/actions/tenants";
import type { Room, Tenant } from "@/lib/types";
import { jakartaToday } from "@/lib/utils";

export function TenantForm({
  tenant,
  rooms,
  submitLabel,
}: {
  tenant?: Tenant | null;
  rooms: Room[];
  submitLabel: string;
}) {
  return (
    <ActionForm action={saveTenant} submitLabel={submitLabel}>
      {tenant ? <input type="hidden" name="id" value={tenant.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama lengkap">
          <input
            className="input"
            name="nama"
            defaultValue={tenant?.nama ?? ""}
            placeholder="Nama penghuni"
            required
          />
        </Field>
        <Field label="Nomor WhatsApp">
          <input
            className="input"
            name="no_hp"
            defaultValue={tenant?.no_hp ?? ""}
            placeholder="0812xxxxxxx"
            inputMode="tel"
          />
        </Field>
        <Field label="Email" hint="Opsional, untuk pengingat lewat email.">
          <input
            className="input"
            name="email"
            type="email"
            defaultValue={tenant?.email ?? ""}
            placeholder="nama@email.com"
          />
        </Field>
        <Field label="Kamar">
          <select
            className="input"
            name="room_id"
            defaultValue={tenant?.room_id ?? ""}
          >
            <option value="">— Belum ada kamar —</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.nomor} · {room.tipe}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tanggal masuk">
          <input
            className="input"
            name="tanggal_masuk"
            type="date"
            defaultValue={tenant?.tanggal_masuk ?? jakartaToday()}
            required
          />
        </Field>
        <Field label="Deposit">
          <input
            className="input"
            name="deposit"
            type="number"
            min={0}
            step={50000}
            defaultValue={tenant?.deposit ?? 0}
          />
        </Field>
        <Field label="Status">
          <select
            className="input"
            name="status"
            defaultValue={tenant?.status ?? "aktif"}
          >
            <option value="aktif">Aktif</option>
            <option value="keluar">Sudah keluar</option>
          </select>
        </Field>
      </div>

      <Field label="Catatan">
        <textarea
          className="input min-h-24"
          name="catatan"
          defaultValue={tenant?.catatan ?? ""}
          placeholder="Catatan tambahan, misal: bawa kulkas pribadi."
        />
      </Field>
    </ActionForm>
  );
}
