export type RoomStatus = "kosong" | "terisi" | "perbaikan";
export type TenantStatus = "aktif" | "keluar";
export type PaymentStatus = "menunggu" | "valid" | "ditolak";
export type PaymentMethod = "transfer" | "tunai" | "qris" | "lainnya";
export type InvoiceStatus = "lunas" | "sebagian" | "telat" | "belum";

export interface Settings {
  id: number;
  owner_id: string;
  nama_kost: string;
  alamat: string;
  bank: string;
  nomor_rekening: string;
  atas_nama: string;
  whatsapp_admin: string;
  jatuh_tempo_hari: number;
  denda_per_hari: number;
  created_at: string;
}

export interface Room {
  id: string;
  owner_id: string;
  nomor: string;
  tipe: string;
  harga_sewa: number;
  fasilitas: string;
  status: RoomStatus;
  created_at: string;
}

export interface RoomWithTenant extends Room {
  tenant: Pick<Tenant, "id" | "nama" | "no_hp"> | null;
}

export interface Tenant {
  id: string;
  owner_id: string;
  nama: string;
  no_hp: string;
  email: string;
  room_id: string | null;
  tanggal_masuk: string;
  tanggal_keluar: string | null;
  deposit: number;
  status: TenantStatus;
  catatan: string;
  created_at: string;
}

export interface TenantWithRoom extends Tenant {
  room: Pick<Room, "id" | "nomor" | "harga_sewa"> | null;
}

export interface Payment {
  id: string;
  owner_id: string;
  invoice_id: string;
  jumlah: number;
  metode: PaymentMethod;
  tanggal_bayar: string;
  pengirim: string;
  bukti_path: string | null;
  status: PaymentStatus;
  catatan: string;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  bukti_url?: string | null;
}

export interface Invoice {
  id: string;
  owner_id: string;
  tenant_id: string;
  room_id: string | null;
  periode: string;
  jatuh_tempo: string;
  sewa: number;
  listrik: number;
  air: number;
  biaya_lain: number;
  diskon: number;
  denda: number;
  total: number;
  catatan: string;
  created_at: string;
}

export interface InvoiceView extends Invoice {
  tenant: Pick<Tenant, "nama" | "no_hp"> | null;
  room: Pick<Room, "nomor"> | null;
  payments: Payment[];
  dibayar: number;
  sisa: number;
  status: InvoiceStatus;
}

export interface PaymentWithInvoice extends Payment {
  invoice:
    | (Pick<Invoice, "id" | "periode" | "total" | "jatuh_tempo"> & {
        tenant: Pick<Tenant, "nama"> | null;
        room: Pick<Room, "nomor"> | null;
      })
    | null;
}
