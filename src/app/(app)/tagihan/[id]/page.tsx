import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  MessageCircle,
  Trash2,
  X,
} from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { ConfirmSubmit } from "@/components/confirm-submit";
import {
  Card,
  CardHeader,
  EmptyState,
  Field,
  InvoiceBadge,
  Notice,
  PageHeader,
  PaymentBadge,
} from "@/components/ui";
import { deleteInvoice, updateInvoiceDetails } from "@/lib/actions/invoices";
import {
  approvePayment,
  deletePayment,
  recordPayment,
  rejectPayment,
} from "@/lib/actions/payments";
import { getInvoice, getSettings } from "@/lib/data";
import { appUrl } from "@/lib/supabase/config";
import {
  formatBulan,
  formatRupiah,
  formatTanggal,
  jakartaToday,
  waLink,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Detail tagihan" };

export default async function TagihanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sukses?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const [invoice, settings] = await Promise.all([getInvoice(id), getSettings()]);
  if (!invoice) notFound();

  const bulan = invoice.periode.slice(0, 7);
  const publicLink = `${appUrl}/bayar/${invoice.id}`;
  const lunas = invoice.sisa <= 0;

  const pesan = lunas
    ? `Halo ${invoice.tenant?.nama ?? "penghuni"}, terima kasih, tagihan kost ${settings?.nama_kost ?? ""} periode ${formatBulan(bulan)} sudah lunas.`
    : `Halo ${invoice.tenant?.nama ?? "penghuni"}, tagihan kost ${settings?.nama_kost ?? ""} periode ${formatBulan(bulan)} sebesar ${formatRupiah(invoice.sisa)} akan jatuh tempo ${formatTanggal(invoice.jatuh_tempo)}. Silakan bayar dan unggah bukti transfer di ${publicLink}. Terima kasih.`;

  const wa = waLink(invoice.tenant?.no_hp ?? "", pesan);

  const breakdown = [
    { label: "Sewa", value: invoice.sewa },
    { label: "Listrik", value: invoice.listrik },
    { label: "Air", value: invoice.air },
    { label: "Biaya lain", value: invoice.biaya_lain },
    { label: "Denda", value: invoice.denda },
  ].filter((row) => row.value > 0);

  return (
    <div>
      <PageHeader
        title={`Tagihan ${invoice.tenant?.nama ?? ""}`}
        description={`Kamar ${invoice.room?.nomor ?? "—"} · ${formatBulan(bulan)}`}
        actions={
          <>
            <InvoiceBadge status={invoice.status} />
            <Link href="/tagihan" className="btn btn-ghost btn-sm">
              <ArrowLeft className="h-4 w-4" /> Semua tagihan
            </Link>
          </>
        }
      />

      {query.sukses ? (
        <div className="mb-4">
          <Notice>Pembayaran berhasil dicatat dan tagihan sudah diperbarui.</Notice>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Card>
            <CardHeader
              title="Rincian tagihan"
              description={`Jatuh tempo ${formatTanggal(invoice.jatuh_tempo)}`}
            />
            <div className="p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">Total tagihan</p>
                  <p className="text-3xl font-semibold tracking-tight text-slate-900">
                    {formatRupiah(invoice.total)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Sisa</p>
                  <p className="text-lg font-semibold text-rose-600">
                    {formatRupiah(invoice.sisa)}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
                {breakdown.length === 0 ? (
                  <p className="text-slate-500">Belum ada rincian biaya.</p>
                ) : (
                  breakdown.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between"
                    >
                      <span className="text-slate-500">{row.label}</span>
                      <span className="font-medium text-slate-800">
                        {formatRupiah(row.value)}
                      </span>
                    </div>
                  ))
                )}
                {invoice.diskon > 0 ? (
                  <div className="flex items-center justify-between text-emerald-700">
                    <span>Diskon</span>
                    <span className="font-medium">
                      −{formatRupiah(invoice.diskon)}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-base">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="font-semibold text-slate-900">
                    {formatRupiah(invoice.total)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Sudah dibayar</span>
                  <span className="font-medium">
                    {formatRupiah(invoice.dibayar)}
                  </span>
                </div>
              </div>

              {invoice.catatan ? (
                <p className="mt-4 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">
                  {invoice.catatan}
                </p>
              ) : null}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Riwayat pembayaran"
              description={`${invoice.payments.length} pembayaran tercatat`}
            />

            {invoice.payments.length === 0 ? (
              <EmptyState
                title="Belum ada pembayaran"
                description="Catat pembayaran dari panel di samping, atau tunggu penghuni mengunggah bukti lewat link pembayaran."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60">
                      <th className="th">Pembayaran</th>
                      <th className="th">Bukti</th>
                      <th className="th">Status</th>
                      <th className="th text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-slate-50 last:border-0"
                      >
                        <td className="td">
                          <p className="font-medium text-slate-900">
                            {formatRupiah(payment.jumlah)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatTanggal(payment.tanggal_bayar)} ·{" "}
                            {payment.metode}
                            {payment.pengirim ? ` · ${payment.pengirim}` : ""}
                          </p>
                          {payment.catatan ? (
                            <p className="text-xs text-slate-400">
                              {payment.catatan}
                            </p>
                          ) : null}
                        </td>
                        <td className="td">
                          {payment.bukti_url ? (
                            <a
                              href={payment.bukti_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                            >
                              Lihat <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="td">
                          <PaymentBadge status={payment.status} />
                        </td>
                        <td className="td">
                          <div className="flex items-center justify-end gap-1">
                            {payment.status === "menunggu" ? (
                              <>
                                <form action={approvePayment}>
                                  <input type="hidden" name="id" value={payment.id} />
                                  <button
                                    type="submit"
                                    className="btn btn-primary btn-sm"
                                    title="Validasi pembayaran"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                </form>
                                <form action={rejectPayment}>
                                  <input type="hidden" name="id" value={payment.id} />
                                  <button
                                    type="submit"
                                    className="btn btn-ghost btn-sm"
                                    title="Tolak pembayaran"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </form>
                              </>
                            ) : (
                              <form action={deletePayment}>
                                <input type="hidden" name="id" value={payment.id} />
                                <ConfirmSubmit message="Hapus catatan pembayaran ini?">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </ConfirmSubmit>
                              </form>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <details>
              <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Ubah rincian biaya (listrik, air, diskon)
              </summary>
              <div className="border-t border-slate-100 p-5">
                <ActionForm
                  action={updateInvoiceDetails}
                  submitLabel="Simpan rincian"
                >
                  <input type="hidden" name="id" value={invoice.id} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Listrik">
                      <input
                        className="input"
                        name="listrik"
                        type="number"
                        min={0}
                        step={1000}
                        defaultValue={invoice.listrik}
                      />
                    </Field>
                    <Field label="Air">
                      <input
                        className="input"
                        name="air"
                        type="number"
                        min={0}
                        step={1000}
                        defaultValue={invoice.air}
                      />
                    </Field>
                    <Field label="Biaya lain">
                      <input
                        className="input"
                        name="biaya_lain"
                        type="number"
                        min={0}
                        step={1000}
                        defaultValue={invoice.biaya_lain}
                      />
                    </Field>
                    <Field label="Diskon">
                      <input
                        className="input"
                        name="diskon"
                        type="number"
                        min={0}
                        step={1000}
                        defaultValue={invoice.diskon}
                      />
                    </Field>
                  </div>
                  <Field label="Catatan tagihan">
                    <textarea
                      className="input min-h-20"
                      name="catatan"
                      defaultValue={invoice.catatan}
                    />
                  </Field>
                </ActionForm>
              </div>
            </details>
          </Card>
        </div>

        <div className="space-y-4">
          {lunas ? (
            <Card className="p-5">
              <p className="text-sm font-semibold text-emerald-700">
                Tagihan sudah lunas
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Total dibayar {formatRupiah(invoice.dibayar)}. Tidak ada sisa
                yang perlu ditagih.
              </p>
            </Card>
          ) : (
            <Card>
              <CardHeader title="Catat pembayaran" description="Pembayaran langsung dianggap valid." />
              <div className="p-5">
                <ActionForm
                  action={recordPayment}
                  submitLabel="Simpan pembayaran"
                  pendingLabel="Menyimpan…"
                >
                  <input type="hidden" name="invoice_id" value={invoice.id} />
                  <Field label="Jumlah diterima">
                    <input
                      className="input"
                      name="jumlah"
                      type="number"
                      min={1}
                      step={1000}
                      defaultValue={invoice.sisa}
                      required
                    />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Metode">
                      <select className="input" name="metode" defaultValue="transfer">
                        <option value="transfer">Transfer</option>
                        <option value="tunai">Tunai</option>
                        <option value="qris">QRIS</option>
                        <option value="lainnya">Lainnya</option>
                      </select>
                    </Field>
                    <Field label="Tanggal bayar">
                      <input
                        className="input"
                        name="tanggal_bayar"
                        type="date"
                        defaultValue={jakartaToday()}
                      />
                    </Field>
                  </div>
                  <Field label="Nama pengirim">
                    <input
                      className="input"
                      name="pengirim"
                      defaultValue={invoice.tenant?.nama ?? ""}
                    />
                  </Field>
                  <Field label="Bukti transfer" hint="JPG, PNG, WEBP, atau PDF. Maks 5 MB.">
                    <input
                      className="input file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold"
                      name="bukti"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                    />
                  </Field>
                  <Field label="Catatan">
                    <input className="input" name="catatan" placeholder="Opsional" />
                  </Field>
                </ActionForm>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Pengingat pembayaran" />
            <div className="space-y-3 p-5">
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary w-full"
                >
                  <MessageCircle className="h-4 w-4" /> Kirim WhatsApp
                </a>
              ) : (
                <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
                  Nomor HP penghuni belum diisi, jadi pengingat WhatsApp tidak
                  bisa dibuat.
                </p>
              )}

              <div>
                <p className="mb-1.5 text-xs font-medium text-slate-500">
                  Link pembayaran untuk penghuni
                </p>
                <input
                  readOnly
                  value={publicLink}
                  className="input text-xs text-slate-500"
                />
                <a
                  href={publicLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Buka halaman pembayaran <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {settings?.nomor_rekening ? (
                <div className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Rekening tujuan</p>
                  <p>
                    {settings.bank} {settings.nomor_rekening}
                  </p>
                  <p>a.n. {settings.atas_nama || "-"}</p>
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-rose-700">Hapus tagihan</h2>
            <p className="mt-1 text-xs text-slate-500">
              Semua pembayaran yang terkait tagihan ini juga akan terhapus.
            </p>
            <form action={deleteInvoice} className="mt-3">
              <input type="hidden" name="id" value={invoice.id} />
              <ConfirmSubmit message="Hapus tagihan ini beserta riwayat pembayarannya?">
                <Trash2 className="h-4 w-4" /> Hapus tagihan
              </ConfirmSubmit>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
