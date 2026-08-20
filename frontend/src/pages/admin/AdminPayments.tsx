import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  Landmark,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  XCircle,
} from "lucide-react";
import { adminApi, type AdminPayment } from "@/lib/adminApi";
import { useAdminStore } from "@/store/adminStore";
import AdminPagination from "@/components/admin/AdminPagination";

const PAGE_SIZE = 10;

const idOf = (item?: { _id?: string; id?: string } | string) =>
  typeof item === "string" ? item : item?._id || item?.id || "";

const formatMoney = (value?: number, currency = "INR") =>
  `${currency} ${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "-";

const shortId = (value?: string) => {
  if (!value) return "-";
  return value.length > 12 ? `${value.slice(0, 6)}...${value.slice(-5)}` : value;
};

const statusStyle = (status?: string) => {
  if (status === "paid") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "failed") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "refunded") return "border-slate-200 bg-slate-100 text-slate-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
};

const methodConfig = (provider?: string) => {
  if (provider === "razorpay") return { label: "Razorpay", icon: CreditCard, tone: "text-blue-700 bg-blue-50 border-blue-100" };
  if (provider === "upi") return { label: "UPI / QR", icon: Smartphone, tone: "text-violet-700 bg-violet-50 border-violet-100" };
  if (provider === "cash") return { label: "Cash", icon: Landmark, tone: "text-slate-700 bg-slate-100 border-slate-200" };
  if (provider === "bank_transfer") return { label: "Bank", icon: Landmark, tone: "text-cyan-700 bg-cyan-50 border-cyan-100" };
  return { label: provider || "Manual", icon: CreditCard, tone: "text-slate-700 bg-slate-100 border-slate-200" };
};

const metadataValue = (payment: AdminPayment, key: string) => {
  const value = payment.metadata?.[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
};

const AdminPayments = () => {
  const token = useAdminStore((state) => state.token);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setPayments(await adminApi.listPayments(token));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load payments");
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    const paid = payments.filter((payment) => payment.status === "paid");
    const manualPending = payments.filter((payment) => payment.status === "pending" && payment.provider !== "razorpay");
    return {
      paidAmount: paid.reduce((sum, payment) => sum + (payment.amount || 0), 0),
      paidCount: paid.length,
      manualPending: manualPending.length,
      razorpayPaid: payments.filter((payment) => payment.provider === "razorpay" && payment.status === "paid").length,
    };
  }, [payments]);

  const updateStatus = async (payment: AdminPayment, status: "paid" | "failed" | "refunded") => {
    if (!token) return;
    const paymentId = idOf(payment);
    if (!paymentId) return;
    setUpdatingId(paymentId);
    try {
      const updated = await adminApi.updatePaymentStatus(token, paymentId, status);
      setPayments((current) => current.map((item) => (idOf(item) === paymentId ? updated : item)));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update payment");
    } finally {
      setUpdatingId(null);
    }
  };

  const pagedPayments = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return payments.slice(start, start + PAGE_SIZE);
  }, [page, payments]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(payments.length / PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
  }, [page, payments.length]);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-white/10 bg-slate-950 px-5 py-4 text-white shadow-xl shadow-slate-950/10">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white/65">
              <ShieldCheck size={13} />
              Payment Control
            </div>
            <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight md:text-3xl">Payments</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-white/62">
              Razorpay settles through server verification. UPI and QR records remain in manual review until admin confirms receipt.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/12 bg-white px-4 text-sm font-bold text-slate-950 transition hover:bg-white/90"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Paid revenue", value: formatMoney(totals.paidAmount), icon: IndianRupee },
          { label: "Paid records", value: totals.paidCount, icon: CheckCircle2 },
          { label: "Manual queue", value: totals.manualPending, icon: Smartphone },
          { label: "Razorpay verified", value: totals.razorpayPaid, icon: BadgeCheck },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{item.label}</p>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <item.icon size={16} />
              </span>
            </div>
            <p className="mt-2 truncate font-heading text-2xl font-bold text-foreground">{item.value}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {pagedPayments.map((payment) => {
            const booking = payment.bookingId;
            const user = booking?.userId;
            const vehicle = booking?.vehicleId;
            const canManualVerify = payment.status === "pending" && payment.provider !== "razorpay";
            const upiId = metadataValue(payment, "upiId");
            const payerUpiId = metadataValue(payment, "payerUpiId");
            const method = methodConfig(payment.provider);
            const MethodIcon = method.icon;
            const isUpdating = updatingId === idOf(payment);

            return (
              <article
                key={idOf(payment)}
                className="rounded-lg border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs font-bold ${method.tone}`}>
                        <MethodIcon size={13} />
                        {method.label}
                      </span>
                      <span className={`inline-flex h-7 items-center rounded-md border px-2.5 text-xs font-bold uppercase ${statusStyle(payment.status)}`}>
                        {payment.status || "pending"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{formatDate(payment.createdAt)} - {payment.paymentFor || "customer_rental"}</p>
                  </div>
                  <p className="shrink-0 text-right font-heading text-2xl font-bold leading-none text-foreground">
                    {formatMoney(payment.amount, payment.currency || "INR")}
                  </p>
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_0.9fr]">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Customer</p>
                    <p className="mt-1 truncate text-sm font-bold text-foreground">{user?.name || "Unknown customer"}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email || "-"}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-md bg-secondary px-2 py-1 font-bold text-foreground">{user?.phone || "No phone"}</span>
                      {user?.aadhaarNumber && <span className="rounded-md bg-secondary px-2 py-1 text-muted-foreground">Aadhaar {shortId(user.aadhaarNumber)}</span>}
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {(user?.address || user?.city || user?.pincode)
                        ? `${user?.address || ""}${user?.city ? `, ${user.city}` : ""}${user?.pincode ? ` - ${user.pincode}` : ""}`
                        : "-"}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Booking</p>
                    <p className="mt-1 truncate text-sm font-bold text-foreground">{vehicle?.name || "Vehicle booking"}</p>
                    <p className="truncate text-xs text-muted-foreground">{vehicle?.bikeNumber || vehicle?.category || "-"}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {booking?.startDate ? booking.startDate.split("T")[0] : "-"} to {booking?.endDate ? booking.endDate.split("T")[0] : "-"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold">
                      <span className="rounded-md border border-border bg-background px-2 py-1 text-foreground">Booking {booking?.status || "-"}</span>
                      <span className="rounded-md border border-border bg-background px-2 py-1 text-foreground">Pay {booking?.paymentStatus || payment.status || "-"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-1 border-t border-border pt-3 text-[11px] leading-5 text-muted-foreground">
                  <p className="truncate">Payment ID <span className="font-mono text-foreground">{shortId(idOf(payment))}</span></p>
                  {payment.providerOrderId && <p className="truncate">Order <span className="font-mono text-foreground">{shortId(payment.providerOrderId)}</span></p>}
                  {payment.providerPaymentId && <p className="truncate">Gateway <span className="font-mono text-foreground">{shortId(payment.providerPaymentId)}</span></p>}
                  {(payerUpiId || upiId) && (
                    <p className="truncate">
                      UPI <span className="font-semibold text-foreground">{payerUpiId || "-"}</span>
                      {upiId ? <span> to <span className="font-semibold text-foreground">{upiId}</span></span> : null}
                    </p>
                  )}
                </div>

                <div className="mt-3">
                  {payment.provider === "razorpay" ? (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                      <div className="flex items-center gap-2 font-bold">
                        <ShieldCheck size={15} />
                        Auto verified
                      </div>
                    </div>
                  ) : canManualVerify ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateStatus(payment, "paid")}
                        disabled={isUpdating}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle2 size={15} />
                        Verify
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(payment, "failed")}
                        disabled={isUpdating}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-rose-300 bg-white px-3 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                      >
                        <XCircle size={15} />
                        Failed
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-md border border-border bg-secondary/45 px-3 py-2 text-xs font-semibold text-muted-foreground">
                      Verification closed
                    </div>
                  )}
                </div>
              </article>
            );
          })}

          {payments.length === 0 && (
            <div className="p-8 text-sm text-muted-foreground">No payments found.</div>
          )}
        </div>
      </section>

      <AdminPagination page={page} total={payments.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
};

export default AdminPayments;
