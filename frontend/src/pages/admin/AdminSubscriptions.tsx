import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeCheck, Ban, CircleDollarSign, RefreshCw, Save } from "lucide-react";
import {
  adminApi,
  type AdminPayment,
  type AdminPlan,
  type AdminSubscription,
  type AdminTenant,
} from "@/lib/adminApi";
import { useAdminStore } from "@/store/adminStore";

const idOf = (value?: { _id?: string; id?: string } | string) =>
  typeof value === "string" ? value : value?._id || value?.id || "";

const labelLimit = (value?: number) => (!value ? "Unlimited" : value);

const AdminSubscriptions = () => {
  const token = useAdminStore((s) => s.token);
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [planDrafts, setPlanDrafts] = useState<Record<string, AdminPlan & { featureFlagsText?: string }>>({});
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [tenantData, planData, subscriptionData, paymentData] = await Promise.all([
        adminApi.listTenants(token),
        adminApi.listPlans(token),
        adminApi.listSubscriptions(token),
        adminApi.listPayments(token),
      ]);
      setTenants(tenantData);
      setPlans(planData);
      setPlanDrafts(Object.fromEntries(planData.map((plan) => {
        const id = idOf(plan);
        return [id, { ...plan, featureFlagsText: JSON.stringify(plan.featureFlags || {}, null, 2) }];
      })));
      setSubscriptions(subscriptionData);
      setPayments(paymentData);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load SaaS subscriptions");
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const activeTenants = useMemo(
    () => tenants.filter((tenant) => tenant.status === "active" || tenant.status === "trial").length,
    [tenants],
  );

  const subscriptionRevenue = useMemo(
    () =>
      payments
        .filter((payment) => payment.paymentFor === "owner_subscription" && payment.status === "paid")
        .reduce((sum, payment) => sum + (payment.amount || 0), 0),
    [payments],
  );

  const toggleTenant = async (tenant: AdminTenant) => {
    if (!token) return;
    const id = idOf(tenant);
    const next = tenant.status === "disabled" ? "active" : "disabled";
    try {
      await adminApi.updateTenantStatus(token, id, next);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update tenant");
    }
  };

  const updatePlanDraft = (planId: string, patch: Partial<AdminPlan & { featureFlagsText?: string }>) => {
    setPlanDrafts((current) => ({ ...current, [planId]: { ...current[planId], ...patch } }));
  };

  const updateBillingPrice = (planId: string, cycle: "monthly" | "half_yearly" | "yearly", price: number) => {
    const draft = planDrafts[planId];
    const existing = draft?.billingCycles || [];
    const fallback = [
      { cycle: "monthly" as const, label: "Monthly", price: draft?.monthlyPrice || 0, months: 1, active: true, sortOrder: 1 },
      { cycle: "half_yearly" as const, label: "Half-Yearly", price: (draft?.monthlyPrice || 0) * 6, months: 6, active: true, sortOrder: 2 },
      { cycle: "yearly" as const, label: "Yearly", price: draft?.yearlyPrice || 0, months: 12, active: true, sortOrder: 3 },
    ];
    const cycles = (existing.length ? existing : fallback).map((item) => item.cycle === cycle ? { ...item, price } : item);
    updatePlanDraft(planId, {
      billingCycles: cycles,
      ...(cycle === "monthly" ? { monthlyPrice: price } : {}),
      ...(cycle === "yearly" ? { yearlyPrice: price } : {}),
    });
  };

  const savePlan = async (plan: AdminPlan) => {
    if (!token) return;
    const id = idOf(plan);
    const draft = planDrafts[id];
    if (!draft) return;
    try {
      const { featureFlagsText, ...payload } = draft;
      payload.featureFlags = featureFlagsText ? JSON.parse(featureFlagsText) : {};
      await adminApi.updatePlan(token, id, payload);
      await load();
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save plan. Check feature flag JSON.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">SaaS Subscriptions</h1>
        <p className="text-muted-foreground mt-1">Manage shop tenants, owner subscriptions, plan limits, and platform revenue.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-background p-5">
          <BadgeCheck className="text-primary" size={22} />
          <p className="mt-3 text-sm text-muted-foreground">Active shops</p>
          <p className="font-heading text-3xl font-bold text-foreground">{activeTenants}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-5">
          <CircleDollarSign className="text-success" size={22} />
          <p className="mt-3 text-sm text-muted-foreground">Subscription revenue</p>
          <p className="font-heading text-3xl font-bold text-foreground">INR {subscriptionRevenue}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-5">
          <RefreshCw className="text-accent" size={22} />
          <p className="mt-3 text-sm text-muted-foreground">Plans</p>
          <p className="font-heading text-3xl font-bold text-foreground">{plans.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="px-6 py-4 border-b border-border font-heading font-bold text-foreground">Plans</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-6">
          {plans.map((plan) => {
            const id = idOf(plan);
            const draft = planDrafts[id] || plan;
            const cyclePrice = (cycle: "monthly" | "half_yearly" | "yearly") =>
              draft.billingCycles?.find((item) => item.cycle === cycle)?.price
              || (cycle === "yearly" ? draft.yearlyPrice : cycle === "half_yearly" ? (draft.monthlyPrice || 0) * 6 : draft.monthlyPrice)
              || 0;
            return (
            <div key={id} className="rounded-xl border border-border p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <input
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2 font-heading text-xl font-bold text-foreground"
                    value={draft.name || ""}
                    onChange={(event) => updatePlanDraft(id, { name: event.target.value })}
                  />
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">{plan.code}</p>
                </div>
                <button
                  type="button"
                  onClick={() => updatePlanDraft(id, { active: !draft.active })}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${draft.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
                >
                  {draft.active ? "Active" : "Inactive"}
                </button>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3">
                {[
                  ["Monthly", "monthly"],
                  ["Half-Yearly", "half_yearly"],
                  ["Yearly", "yearly"],
                ].map(([label, cycle]) => (
                  <label key={cycle} className="text-xs font-medium text-muted-foreground">
                    {label} price
                    <input
                      type="number"
                      className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                      value={cyclePrice(cycle as "monthly" | "half_yearly" | "yearly")}
                      onChange={(event) => updateBillingPrice(id, cycle as "monthly" | "half_yearly" | "yearly", Number(event.target.value))}
                    />
                  </label>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                {[
                  ["Vehicles", "bikeLimit"],
                  ["Staff", "staffLimit"],
                  ["Branches", "branchLimit"],
                ].map(([label, key]) => (
                  <label key={key} className="text-xs font-medium">
                    {label}
                    <input
                      type="number"
                      className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                      value={Number((draft as unknown as Record<string, number>)[key] || 0)}
                      onChange={(event) => updatePlanDraft(id, { [key]: Number(event.target.value) } as AdminPlan)}
                    />
                  </label>
                ))}
              </div>
              <label className="mt-4 block text-xs font-medium text-muted-foreground">
                Recommended for
                <input
                  className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                  value={draft.recommendedFor || ""}
                  onChange={(event) => updatePlanDraft(id, { recommendedFor: event.target.value })}
                />
              </label>
              <label className="mt-4 block text-xs font-medium text-muted-foreground">
                Badges
                <input
                  className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                  value={(draft.planBadges || []).join(", ")}
                  onChange={(event) => updatePlanDraft(id, { planBadges: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })}
                />
              </label>
              <label className="mt-4 block text-xs font-medium text-muted-foreground">
                Feature flags JSON
                <textarea
                  className="mt-1 min-h-36 w-full rounded-lg border border-border bg-secondary px-3 py-2 font-mono text-xs text-foreground"
                  value={draft.featureFlagsText || ""}
                  onChange={(event) => updatePlanDraft(id, { featureFlagsText: event.target.value })}
                />
              </label>
              <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                <p>Analytics: {plan.analyticsLevel}</p>
                <p>Branding: {draft.customBranding ? "Yes" : "No"}</p>
                <p>API access: {draft.apiAccess ? "Yes" : "No"}</p>
              </div>
              <button onClick={() => savePlan(plan)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                <Save size={15} />
                Save plan
              </button>
            </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="px-6 py-4 border-b border-border font-heading font-bold text-foreground">Tenants</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Shop</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Owner</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Plan</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Subscription</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-6 py-3 font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => {
                const subscription = subscriptions.find((item) => idOf(item.tenantId) === idOf(tenant));
                return (
                  <tr key={idOf(tenant)} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="px-6 py-4 font-medium text-foreground">{tenant.companyName}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <p>{tenant.ownerName}</p>
                      <p className="text-xs">{tenant.email}</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{tenant.planId?.name || "-"}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {subscription?.billingCycle || "-"} / {subscription?.paymentStatus || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">{tenant.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => toggleTenant(tenant)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground">
                        <Ban size={15} />
                        {tenant.status === "disabled" ? "Activate" : "Disable"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {tenants.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-muted-foreground" colSpan={6}>No tenants yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSubscriptions;
