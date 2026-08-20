import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, IndianRupee, RefreshCcw, ShieldCheck, Smartphone, XCircle } from "lucide-react";
import { adminApi, type AdminPayment } from "@/lib/adminApi";
import { useAdminStore } from "@/store/adminStore";

const idOf = (item?: { _id?: string; id?: string } | string) =>
  typeof item === "string" ? item : item?._id || item?.id || "";

const formatMoney = (value?: number, currency = "INR") =>
  `${currency} ${Number(value || 0).toLocaleString("en-IN")}`;

const statusClass = (status?: string) => {
  if (status === "paid") return "bg-emerald-500/10 text-emerald-600";
  if (status === "failed") return "bg-rose-500/10 text-rose-600";
  if (status === "refunded") return "bg-slate-500/10 text-slate-600";
  return "bg-amber-500/10 text-amber-600";
};

const methodLabel = (provider?: string) => {
  if (provider === "razorpay") return "Razorpay online";
  if (provider === "upi") return "UPI / QR";
  if (provider === "cash") return "Cash";
  if (provider === "bank_transfer") return "Bank transfer";
  return provider || "manual";
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
    const pendingManual = payments.filter((payment) => payment.status === "pending" && payment.provider !== "razorpay");
    return {
      paidAmount: paid.reduce((sum, payment) => sum + (payment.amount || 0), 0),
      paidCount: paid.length,
      pendingManual: pendingManual.length,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Payments</h1>
          <p className="mt-1 text-muted-foreground">
            Razorpay payments verify automatically. UPI and QR payments stay pending until admin confirms receipt.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-bold text-foreground hover:bg-secondary"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Paid Revenue", value: formatMoney(totals.paidAmount), icon: IndianRupee },
          { label: "Paid Payments", value: totals.paidCount, icon: CheckCircle2 },
          { label: "Manual Pending", value: totals.pendingManual, icon: Smartphone },
          { label: "Razorpay Auto Verified", value: totals.razorpayPaid, icon: ShieldCheck },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
              <item.icon size={20} />
            </div>
            <p className="mt-4 text-sm font-semibold text-muted-foreground">{item.label}</p>
            <p className="mt-1 font-heading text-3xl font-bold text-foreground">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-heading text-xl font-bold text-foreground">Payment Records</h2>
        </div>
        <div className="divide-y divide-border">
          {payments.map((payment) => {
            const booking = payment.bookingId;
            const user = booking?.userId;
            const vehicle = booking?.vehicleId;
            const canManualVerify = payment.status === "pending" && payment.provider !== "razorpay";
            const upiId = metadataValue(payment, "upiId");
            const payerUpiId = metadataValue(payment, "payerUpiId");
            const isUpdating = updatingId === idOf(payment);

            return (
              <article key={idOf(payment)} className="grid gap-5 p-5 xl:grid-cols-[1.15fr_1fr_260px] xl:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-md bg-secondary px-2.5 py-1 text-xs font-bold uppercase text-foreground">
                      <CreditCard size={13} />
                      {methodLabel(payment.provider)}
                    </span>
                    <span className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase ${statusClass(payment.status)}`}>
                      {payment.status || "pending"}
                    </span>
                    {payment.provider === "razorpay" && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600">
                        <ShieldCheck size={13} />
                        server verified
                      </span>
                    )}
                  </div>
                  <p className="mt-3 font-heading text-2xl font-bold text-foreground">
                    {formatMoney(payment.amount, payment.currency || "INR")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {payment.createdAt ? new Date(payment.createdAt).toLocaleString("en-IN") : "-"} · {payment.paymentFor || "customer_rental"}
                  </p>
                  <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
                    <p>Payment ID: <span className="font-mono text-foreground">{idOf(payment) || "-"}</span></p>
                    {payment.providerOrderId && <p>Order: <span className="font-mono text-foreground">{payment.providerOrderId}</span></p>}
                    {payment.providerPaymentId && <p>Gateway payment: <span className="font-mono text-foreground">{payment.providerPaymentId}</span></p>}
                    {payerUpiId && <p>User UPI ID: <span className="font-semibold text-foreground">{payerUpiId}</span></p>}
                    {upiId && <p>MotoRentix UPI ID: <span className="font-semibold text-foreground">{upiId}</span></p>}
                    {metadataValue(payment, "note") && <p>Note: <span className="text-foreground">{metadataValue(payment, "note")}</span></p>}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-lg border border-border bg-secondary/35 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Customer</p>
                    <p className="mt-2 font-bold text-foreground">{user?.name || "Unknown user"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email || "-"}</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{user?.phone || "-"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {(user?.address || user?.city || user?.pincode)
                        ? `${user?.address || ""}${user?.city ? `, ${user.city}` : ""}${user?.pincode ? ` - ${user.pincode}` : ""}`
                        : "-"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-secondary/35 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Booking</p>
                    <p className="mt-2 font-bold text-foreground">{vehicle?.name || "Vehicle booking"}</p>
                    <p className="text-xs text-muted-foreground">{vehicle?.bikeNumber || vehicle?.category || "-"}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {booking?.startDate ? booking.startDate.split("T")[0] : "-"} to {booking?.endDate ? booking.endDate.split("T")[0] : "-"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-md bg-background px-2 py-1 text-xs font-bold text-foreground">Booking: {booking?.status || "-"}</span>
                      <span className="rounded-md bg-background px-2 py-1 text-xs font-bold text-foreground">Payment: {booking?.paymentStatus || payment.status || "-"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-background p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Verification</p>
                  {payment.provider === "razorpay" ? (
                    <div className="mt-3 rounded-md bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-700">
                      Razorpay online payments are verified by backend signature check and webhook. No manual action needed.
                    </div>
                  ) : canManualVerify ? (
                    <div className="mt-3 grid gap-2">
                      <button
                        type="button"
                        onClick={() => updateStatus(payment, "paid")}
                        disabled={isUpdating}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} />
                        Verify Received
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(payment, "failed")}
                        disabled={isUpdating}
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-rose-500/30 px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-500/10 disabled:opacity-50"
                      >
                        <XCircle size={16} />
                        Mark Failed
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">No manual action available for this payment.</p>
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
    </div>
  );
};

export default AdminPayments;
