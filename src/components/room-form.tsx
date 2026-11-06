import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/ui";
import { saveRoom } from "@/lib/actions/rooms";
import type { Room } from "@/lib/types";

export function RoomForm({
  room,
  submitLabel,
}: {
  room?: Room | null;
  submitLabel: string;
}) {
  return (
    <ActionForm action={saveRoom} submitLabel={submitLabel}>
      {room ? <input type="hidden" name="id" value={room.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nomor kamar">
          <input
            className="input"
            name="nomor"
            defaultValue={room?.nomor ?? ""}
            placeholder="101"
            required
          />
        </Field>
        <Field label="Tipe kamar">
          <input
            className="input"
            name="tipe"
            defaultValue={room?.tipe ?? "Standar"}
            placeholder="Standar / Deluxe / Premium"
          />
        </Field>
        <Field label="Harga sewa per bulan">
          <input
            className="input"
            name="harga_sewa"
            type="number"
            min={0}
            step={50000}
            defaultValue={room?.harga_sewa ?? 750000}
            required
          />
        </Field>
        <Field label="Status kamar">
          <select
            className="input"
            name="status"
            defaultValue={room?.status ?? "kosong"}
          >
            <option value="kosong">Kosong</option>
            <option value="terisi">Terisi</option>
            <option value="perbaikan">Perbaikan</option>
          </select>
        </Field>
      </div>

      <Field label="Fasilitas" hint="Pisahkan dengan koma, misal: AC, kasur, lemari.">
        <input
          className="input"
          name="fasilitas"
          defaultValue={room?.fasilitas ?? ""}
          placeholder="AC, kasur, lemari"
        />
      </Field>
    </ActionForm>
  );
}
