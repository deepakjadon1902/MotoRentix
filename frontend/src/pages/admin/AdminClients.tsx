import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeCheck, Ban, Building2, CalendarClock, CreditCard, PlayCircle } from "lucide-react";
import { adminApi, type AdminPlan, type AdminSubscription, type AdminTenant } from "@/lib/adminApi";
import { useAdminStore } from "@/store/adminStore";
import AdminPagination from "@/components/admin/AdminPagination";

const PAGE_SIZE = 10;

const idOf = (value?: { _id?: string; id?: string } | string) =>
  typeof value === "string" ? value : value?._id || value?.id || "";

const today = () => new Date().toISOString().slice(0, 10);

const addMonths = (months: number) => {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
};

type BillingCycle = "monthly" | "half_yearly" | "yearly";
const endDateForCycle = (cycle: BillingCycle) => addMonths(cycle === "yearly" ? 12 : cycle === "half_yearly" ? 6 : 1);

const emptyClientForm = {
  companyName: "",
  ownerName: "",
  email: "",
  phone: "",
  password: "",
  planId: "",
  billingCycle: "monthly" as BillingCycle,
  paymentStatus: "paid" as "pending" | "paid" | "failed" | "refunded",
  startDate: today(),
  endDate: addMonths(1),
};

const AdminClients = () => {
  const token = useAdminStore((s) => s.token);
  const [clients, setClients] = useState<AdminTenant[]>([]);
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [form, setForm] = useState(emptyClientForm);
  const [planDrafts, setPlanDrafts] = useState<Record<string, { planId: string; billingCycle: BillingCycle; paymentStatus: "pending" | "paid"; endDate: string }>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [tenantData, planData, subscriptionData] = await Promise.all([
        adminApi.listTenants(token),
        adminApi.listPlans(token),
        adminApi.listSubscriptions(token),
      ]);
      setClients(tenantData);
      setPlans(planData.filter((plan) => plan.active !== false));
      setSubscriptions(subscriptionData);
      setError("");
      setForm((current) => ({ ...current, planId: current.planId || idOf(planData.find((plan) => plan.active !== false)) }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load clients");
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const activeClients = useMemo(
    () => clients.filter((client) => client.status === "active" || client.status === "trial").length,
    [clients],
  );

  const expiringSoon = useMemo(() => {
    const now = Date.now();
    const soon = now + 1000 * 60 * 60 * 24 * 7;
    return subscriptions.filter((item) => {
      const end = item.endDate ? new Date(item.endDate).getTime() : 0;
      return item.status === "active" && end >= now && end <= soon;
    }).length;
  }, [subscriptions]);

  const pagedClients = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return clients.slice(start, start + PAGE_SIZE);
  }, [clients, page]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(clients.length / PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
  }, [clients.length, page]);

  const getSubscription = (tenant: AdminTenant) =>
    subscriptions.find((subscription) => idOf(subscription.tenantId) === idOf(tenant));

  const createClient = async () => {
    if (!token) return;
    if (!form.companyName || !form.ownerName || !form.email || !form.phone || !form.password || !form.planId) {
      setError("Please complete all client and subscription fields");
      return;
    }
    setSaving(true);
    try {
      await adminApi.createTenantClient(token, form);
      setForm({ ...emptyClientForm, planId: form.planId });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create client");
    } finally {
      setSaving(false);
    }
  };

  const setTenantStatus = async (tenant: AdminTenant, status: NonNullable<AdminTenant["status"]>) => {
    if (!token) return;
    try {
      await adminApi.updateTenantStatus(token, idOf(tenant), status);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update client status");
    }
  };

  const assignPlan = async (tenant: AdminTenant) => {
    if (!token) return;
    const tenantId = idOf(tenant);
    const draft = planDrafts[tenantId] || {
      planId: idOf(tenant.planId) || idOf(plans[0]),
      billingCycle: "monthly" as const,
      paymentStatus: "paid" as const,
      endDate: addMonths(1),
    };
    if (!draft.planId) {
      setError("Select a plan first");
      return;
    }
    try {
      await adminApi.assignTenantPlan(token, tenantId, {
        planId: draft.planId,
        billingCycle: draft.billingCycle,
        paymentStatus: draft.paymentStatus,
        startDate: today(),
        endDate: draft.endDate,
      });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to assign plan");
    }
  };

  const updateDraft = (tenantId: string, patch: Partial<{ planId: string; billingCycle: BillingCycle; paymentStatus: "pending" | "paid"; endDate: string }>) => {
    setPlanDrafts((current) => ({
      ...current,
      [tenantId]: {
        planId: current[tenantId]?.planId || idOf(plans[0]),
        billingCycle: current[tenantId]?.billingCycle || "monthly",
        paymentStatus: current[tenantId]?.paymentStatus || "paid",
        endDate: current[tenantId]?.endDate || addMonths(1),
        ...patch,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Clients</h1>
        <p className="text-muted-foreground mt-1">Add bike rental shop clients, assign subscriptions, activate access, or disable expired accounts.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-background p-5">
          <Building2 className="text-primary" size={22} />
          <p className="mt-3 text-sm text-muted-foreground">Total clients</p>
          <p className="font-heading text-3xl font-bold text-foreground">{clients.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-5">
          <BadgeCheck className="text-success" size={22} />
          <p className="mt-3 text-sm text-muted-foreground">Active clients</p>
          <p className="font-heading text-3xl font-bold text-foreground">{activeClients}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-5">
          <CalendarClock className="text-warning" size={22} />
          <p className="mt-3 text-sm text-muted-foreground">Expiring in 7 days</p>
          <p className="font-heading text-3xl font-bold text-foreground">{expiringSoon}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-5">
          <CreditCard className="text-accent" size={22} />
          <p className="mt-3 text-sm text-muted-foreground">Plans available</p>
          <p className="font-heading text-3xl font-bold text-foreground">{plans.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background p-6 space-y-4">
        <h2 className="font-heading text-xl font-bold text-foreground">Add Client</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input className="px-4 py-3 rounded-lg bg-secondary border border-border text-sm" placeholder="Company name" value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} />
          <input className="px-4 py-3 rounded-lg bg-secondary border border-border text-sm" placeholder="Owner name" value={form.ownerName} onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))} />
          <input className="px-4 py-3 rounded-lg bg-secondary border border-border text-sm" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <input className="px-4 py-3 rounded-lg bg-secondary border border-border text-sm" placeholder="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <input className="px-4 py-3 rounded-lg bg-secondary border border-border text-sm" placeholder="Temporary password" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          <select className="px-4 py-3 rounded-lg bg-secondary border border-border text-sm" value={form.planId} onChange={(e) => setForm((f) => ({ ...f, planId: e.target.value }))}>
            <option value="">Select plan</option>
            {plans.map((plan) => <option key={idOf(plan)} value={idOf(plan)}>{plan.name} - INR {plan.monthlyPrice}/mo</option>)}
          </select>
          <select className="px-4 py-3 rounded-lg bg-secondary border border-border text-sm" value={form.billingCycle} onChange={(e) => setForm((f) => ({ ...f, billingCycle: e.target.value as BillingCycle, endDate: endDateForCycle(e.target.value as BillingCycle) }))}>
            <option value="monthly">Monthly</option>
            <option value="half_yearly">Half-yearly</option>
            <option value="yearly">Yearly</option>
          </select>
          <select className="px-4 py-3 rounded-lg bg-secondary border border-border text-sm" value={form.paymentStatus} onChange={(e) => setForm((f) => ({ ...f, paymentStatus: e.target.value as typeof form.paymentStatus }))}>
            <option value="paid">Paid - activate now</option>
            <option value="pending">Pending - keep inactive</option>
          </select>
          <input className="px-4 py-3 rounded-lg bg-secondary border border-border text-sm" type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
          <input className="px-4 py-3 rounded-lg bg-secondary border border-border text-sm" type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
        </div>
        <button onClick={createClient} disabled={saving} className="btn-primary-gradient px-5 py-2 rounded-lg text-primary-foreground font-semibold disabled:opacity-50">
          Create Client and Assign Plan
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="px-6 py-4 border-b border-border font-heading font-bold text-foreground">Client List</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Client</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Current Plan</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Expiry</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Assign / Renew</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-6 py-3 font-medium text-muted-foreground">Access</th>
              </tr>
            </thead>
            <tbody>
              {pagedClients.map((client) => {
                const tenantId = idOf(client);
                const subscription = getSubscription(client);
                const draft = planDrafts[tenantId];
                return (
                  <tr key={tenantId} className="border-b border-border/50 align-top hover:bg-secondary/30">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{client.companyName}</p>
                      <p className="text-xs text-muted-foreground">{client.ownerName} - {client.email}</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <p>{client.planId?.name || "-"}</p>
                      <p className="text-xs">{subscription?.billingCycle || "-"} / {subscription?.paymentStatus || "-"}</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="grid min-w-[420px] grid-cols-[1.2fr_0.8fr_0.9fr_1fr_auto] gap-2">
                        <select className="px-3 py-2 rounded-lg bg-secondary border border-border text-xs" value={draft?.planId || idOf(client.planId) || idOf(plans[0])} onChange={(e) => updateDraft(tenantId, { planId: e.target.value })}>
                          {plans.map((plan) => <option key={idOf(plan)} value={idOf(plan)}>{plan.name}</option>)}
                        </select>
                        <select className="px-3 py-2 rounded-lg bg-secondary border border-border text-xs" value={draft?.billingCycle || "monthly"} onChange={(e) => updateDraft(tenantId, { billingCycle: e.target.value as BillingCycle, endDate: endDateForCycle(e.target.value as BillingCycle) })}>
                          <option value="monthly">Monthly</option>
                          <option value="half_yearly">Half-yearly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                        <select className="px-3 py-2 rounded-lg bg-secondary border border-border text-xs" value={draft?.paymentStatus || "paid"} onChange={(e) => updateDraft(tenantId, { paymentStatus: e.target.value as "pending" | "paid" })}>
                          <option value="paid">Paid</option>
                          <option value="pending">Pending</option>
                        </select>
                        <input className="px-3 py-2 rounded-lg bg-secondary border border-border text-xs" type="date" value={draft?.endDate || addMonths(1)} onChange={(e) => updateDraft(tenantId, { endDate: e.target.value })} />
                        <button onClick={() => assignPlan(client)} className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                          <PlayCircle size={14} /> Apply
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">{client.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {client.status === "disabled" ? (
                        <button onClick={() => setTenantStatus(client, "active")} className="px-4 py-2 rounded-lg border border-border text-foreground">Activate</button>
                      ) : (
                        <button onClick={() => setTenantStatus(client, "disabled")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground">
                          <Ban size={15} /> Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {clients.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-muted-foreground" colSpan={6}>No clients yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <AdminPagination page={page} total={clients.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
};

export default AdminClients;
