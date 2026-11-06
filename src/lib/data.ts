import { createAdminClient } from "./supabase/admin";
import { isServiceRoleConfigured } from "./supabase/config";
import { createClient } from "./supabase/server";
import type {
  Invoice,
  InvoiceView,
  Payment,
  PaymentStatus,
  PaymentWithInvoice,
  Room,
  RoomWithTenant,
  Settings,
  Tenant,
  TenantWithRoom,
} from "./types";
import { invoiceStatus, monthBounds } from "./utils";

function one<T>(value: unknown): T | null {
  return (value ?? null) as T | null;
}

function many<T>(value: unknown): T[] {
  return (value ?? []) as T[];
}

const INVOICE_SELECT =
  "*, tenant:tenants(nama,no_hp), room:rooms(nomor), payments(*)";

type RawInvoice = Invoice & {
  tenant: { nama: string; no_hp: string } | null;
  room: { nomor: string } | null;
  payments: Payment[] | null;
};

function toInvoiceView(raw: RawInvoice): InvoiceView {
  const payments = (raw.payments ?? []).slice().sort((a, b) => {
    return (b.created_at ?? "").localeCompare(a.created_at ?? "");
  });
  const dibayar = payments
    .filter((payment) => payment.status === "valid")
    .reduce((sum, payment) => sum + Number(payment.jumlah ?? 0), 0);
  const total = Number(raw.total ?? 0);

  return {
    ...raw,
    payments,
    dibayar,
    sisa: Math.max(0, total - dibayar),
    status: invoiceStatus({ total, dibayar, jatuh_tempo: raw.jatuh_tempo }),
  };
}

export async function getSettings(): Promise<Settings | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  return one<Settings>(data);
}

export async function listRooms(): Promise<Room[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("rooms").select("*").order("nomor");
  return many<Room>(data);
}

export async function getRoom(id: string): Promise<Room | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return one<Room>(data);
}

export async function listRoomsWithTenants(): Promise<RoomWithTenant[]> {
  const supabase = await createClient();
  const [roomsRes, tenantsRes] = await Promise.all([
    supabase.from("rooms").select("*").order("nomor"),
    supabase
      .from("tenants")
      .select("id,nama,no_hp,room_id")
      .eq("status", "aktif"),
  ]);

  const byRoom = new Map<string, Pick<Tenant, "id" | "nama" | "no_hp">>();
  many<Pick<Tenant, "id" | "nama" | "no_hp" | "room_id">>(tenantsRes.data).forEach(
    (tenant) => {
      if (tenant.room_id) {
        byRoom.set(tenant.room_id, {
          id: tenant.id,
          nama: tenant.nama,
          no_hp: tenant.no_hp,
        });
      }
    },
  );

  return many<Room>(roomsRes.data).map((room) => ({
    ...room,
    tenant: byRoom.get(room.id) ?? null,
  }));
}

export async function listTenants(): Promise<TenantWithRoom[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select("*, room:rooms(id,nomor,harga_sewa)")
    .order("status", { ascending: true })
    .order("nama", { ascending: true });
  return many<TenantWithRoom>(data);
}

export async function getTenant(id: string): Promise<TenantWithRoom | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select("*, room:rooms(id,nomor,harga_sewa)")
    .eq("id", id)
    .maybeSingle();
  return one<TenantWithRoom>(data);
}

export async function listInvoices(
  filter: { bulan?: string; tenantId?: string } = {},
): Promise<InvoiceView[]> {
  const supabase = await createClient();
  let query = supabase
    .from("invoices")
    .select(INVOICE_SELECT)
    .order("periode", { ascending: false })
    .order("created_at", { ascending: false });

  if (filter.bulan) {
    const { start, end } = monthBounds(filter.bulan);
    query = query.gte("periode", start).lte("periode", end);
  }
  if (filter.tenantId) {
    query = query.eq("tenant_id", filter.tenantId);
  }

  const { data } = await query;
  return many<RawInvoice>(data)
    .map(toInvoiceView)
    .sort((a, b) => (a.tenant?.nama ?? "").localeCompare(b.tenant?.nama ?? ""));
}

export async function getInvoice(id: string): Promise<InvoiceView | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select(INVOICE_SELECT)
    .eq("id", id)
    .maybeSingle();

  const invoice = one<RawInvoice>(data);
  if (!invoice) return null;

  const view = toInvoiceView(invoice);

  // Buat signed URL (1 jam) untuk setiap bukti transfer.
  view.payments = await Promise.all(
    view.payments.map(async (payment) => {
      if (!payment.bukti_path) return payment;
      const { data: signed } = await supabase.storage
        .from("bukti-transfer")
        .createSignedUrl(payment.bukti_path, 60 * 60);
      return { ...payment, bukti_url: signed?.signedUrl ?? null };
    }),
  );

  return view;
}

export async function countPendingPayments(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("status", "menunggu");
  return count ?? 0;
}

export async function listPayments(
  status?: PaymentStatus,
  limit = 50,
): Promise<PaymentWithInvoice[]> {
  const supabase = await createClient();
  let query = supabase
    .from("payments")
    .select(
      "*, invoice:invoices(id,periode,total,jatuh_tempo,tenant:tenants(nama),room:rooms(nomor))",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }

  const { data } = await query;
  const payments = many<PaymentWithInvoice>(data);

  await Promise.all(
    payments.map(async (payment) => {
      if (!payment.bukti_path) return;
      const { data: signed } = await supabase.storage
        .from("bukti-transfer")
        .createSignedUrl(payment.bukti_path, 60 * 60);
      payment.bukti_url = signed?.signedUrl ?? null;
    }),
  );

  return payments;
}

export interface DashboardData {
  bulan: string;
  totalKamar: number;
  kamarTerisi: number;
  kamarKosong: number;
  kamarPerbaikan: number;
  penghuniAktif: number;
  tagihanTotal: number;
  tagihanTerbayar: number;
  tunggakan: number;
  pendapatanBulanIni: number;
  jumlahMenunggu: number;
  nominalMenunggu: number;
  jumlahTagihan: number;
  jumlahLunas: number;
  invoices: InvoiceView[];
}

export async function getDashboard(bulan: string): Promise<DashboardData> {
  const supabase = await createClient();
  const { start, end } = monthBounds(bulan);

  const [roomsRes, tenantsRes, invoicesRes, pendingRes, revenueRes] =
    await Promise.all([
      supabase.from("rooms").select("id,status"),
      supabase
        .from("tenants")
        .select("id,room_id")
        .eq("status", "aktif"),
      supabase
        .from("invoices")
        .select(INVOICE_SELECT)
        .gte("periode", start)
        .lte("periode", end)
        .order("created_at", { ascending: true }),
      supabase.from("payments").select("jumlah").eq("status", "menunggu"),
      supabase
        .from("payments")
        .select("jumlah")
        .eq("status", "valid")
        .gte("tanggal_bayar", start)
        .lte("tanggal_bayar", end),
    ]);

  const rooms = many<Pick<Room, "id" | "status">>(roomsRes.data);
  const tenants = many<Pick<Tenant, "id" | "room_id">>(tenantsRes.data);
  const invoices = many<RawInvoice>(invoicesRes.data).map(toInvoiceView);
  const pending = many<{ jumlah: number }>(pendingRes.data);
  const revenue = many<{ jumlah: number }>(revenueRes.data);

  const occupiedRoomIds = new Set(
    tenants.map((tenant) => tenant.room_id).filter(Boolean) as string[],
  );

  const tagihanTotal = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.total ?? 0),
    0,
  );
  const tagihanTerbayar = invoices.reduce(
    (sum, invoice) => sum + invoice.dibayar,
    0,
  );

  return {
    bulan,
    totalKamar: rooms.length,
    kamarTerisi: occupiedRoomIds.size,
    kamarKosong: rooms.filter((room) => room.status === "kosong").length,
    kamarPerbaikan: rooms.filter((room) => room.status === "perbaikan").length,
    penghuniAktif: tenants.length,
    tagihanTotal,
    tagihanTerbayar,
    tunggakan: invoices.reduce((sum, invoice) => sum + invoice.sisa, 0),
    pendapatanBulanIni: revenue.reduce(
      (sum, payment) => sum + Number(payment.jumlah ?? 0),
      0,
    ),
    jumlahMenunggu: pending.length,
    nominalMenunggu: pending.reduce(
      (sum, payment) => sum + Number(payment.jumlah ?? 0),
      0,
    ),
    jumlahTagihan: invoices.length,
    jumlahLunas: invoices.filter((invoice) => invoice.status === "lunas").length,
    invoices,
  };
}

export interface PublicInvoiceData {
  invoice: InvoiceView;
  settings: Settings | null;
}

export async function getPublicInvoice(
  id: string,
): Promise<PublicInvoiceData | null> {
  if (!isServiceRoleConfigured()) return null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const supabase = createAdminClient();
  const [invoiceRes, settingsRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, tenant:tenants(nama,no_hp), room:rooms(nomor), payments(*)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  const raw = one<RawInvoice>(invoiceRes.data);
  if (!raw) return null;

  return {
    invoice: toInvoiceView(raw),
    settings: one<Settings>(settingsRes.data),
  };
}
