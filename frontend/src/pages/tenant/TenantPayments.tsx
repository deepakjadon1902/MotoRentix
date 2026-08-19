import { useEffect, useMemo, useState } from "react";
import { tenantApi, type TenantPayment } from "@/lib/tenantApi";
import { useStore } from "@/store/useStore";

const TenantPayments = () => {
  const token = useStore((state) => state.token);
  const [payments, setPayments] = useState<TenantPayment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    tenantApi.payments(token).then(setPayments).catch((err) => setError(err instanceof Error ? err.message : "Failed to load payments"));
  }, [token]);

  const total = useMemo(() => payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + (p.amount || 0), 0), [payments]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground mt-1">Tenant-isolated customer rental and subscription payment records.</p>
      </div>
      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Paid total</p>
        <p className="font-heading text-3xl font-bold">INR {total}</p>
      </div>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="divide-y divide-border">
          {payments.map((payment) => (
            <div key={payment._id || payment.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1">
                <p className="font-medium">{payment.paymentFor}</p>
                <p className="text-xs text-muted-foreground">{payment.provider} - {payment.status} - {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : "-"}</p>
              </div>
              <p className="font-heading font-bold">INR {payment.amount || 0}</p>
            </div>
          ))}
          {payments.length === 0 && <p className="p-6 text-muted-foreground">No payments yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default TenantPayments;
