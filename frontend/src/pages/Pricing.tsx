import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, CreditCard, Infinity, ShieldCheck, Sparkles, X } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import type { SubscriptionPlan } from "@/lib/types";

type BillingCycle = "monthly" | "half_yearly" | "yearly";

const fallbackCycles = [
  { cycle: "monthly" as const, label: "Monthly", price: 0, months: 1, sortOrder: 1 },
  { cycle: "half_yearly" as const, label: "Half-Yearly", price: 0, months: 6, sortOrder: 2 },
  { cycle: "yearly" as const, label: "Yearly", price: 0, months: 12, sortOrder: 3 },
];

const showLimit = (value?: number) =>
  Number(value || 0) === 0 ? <Infinity size={18} /> : Number(value).toLocaleString("en-IN");

const billingCyclesForPlan = (plan?: SubscriptionPlan) => {
  const cycles = (plan?.billingCycles || []).filter((cycle) => cycle.active !== false);
  if (cycles.length > 0) return [...cycles].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  return fallbackCycles.map((cycle) => ({
    ...cycle,
    price:
      cycle.cycle === "yearly"
        ? plan?.yearlyPrice || 0
        : cycle.cycle === "half_yearly"
          ? Math.round((plan?.monthlyPrice || 0) * 6)
          : plan?.monthlyPrice || 0,
  }));
};

const priceFor = (plan: SubscriptionPlan, billing: BillingCycle) =>
  billingCyclesForPlan(plan).find((cycle) => cycle.cycle === billing)?.price || plan.monthlyPrice;

const suffixFor = (plan: SubscriptionPlan, billing: BillingCycle) => {
  const cycle = billingCyclesForPlan(plan).find((item) => item.cycle === billing);
  return cycle?.months === 12 ? "/year" : cycle?.months === 6 ? "/6 months" : "/month";
};

const featureValue = (plan: SubscriptionPlan, key: string) =>
  plan.featureFlags?.[key] ?? (plan as unknown as Record<string, unknown>)[key];

const Pricing = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [billing, setBilling] = useState<BillingCycle>("monthly");

  useEffect(() => {
    api.listPlans().then((data) => setPlans(data.filter((plan) => plan.active))).catch(() => setPlans([]));
  }, []);

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => (a.billingCycles?.[0]?.price || a.monthlyPrice || 0) - (b.billingCycles?.[0]?.price || b.monthlyPrice || 0)),
    [plans],
  );

  const billingOptions = useMemo(() => {
    const byCycle = new Map<string, { cycle: BillingCycle; label: string; sortOrder?: number }>();
    sortedPlans.forEach((plan) => {
      billingCyclesForPlan(plan).forEach((cycle) => {
        byCycle.set(cycle.cycle, { cycle: cycle.cycle, label: cycle.label, sortOrder: cycle.sortOrder });
      });
    });
    return [...byCycle.values()].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [sortedPlans]);

  const comparisonRows = useMemo(() => {
    const rows = new Map<string, { label: string; featureKey: string; category?: string; sortOrder?: number }>();
    sortedPlans.forEach((plan) => {
      (plan.comparisonFeatures || []).forEach((item) => rows.set(item.featureKey, item));
    });
    return [...rows.values()].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [sortedPlans]);

  const faqs = sortedPlans.find((plan) => (plan.faqs || []).length > 0)?.faqs || [];

  return (
    <div className="section-padding bg-background">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_460px] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">White label rental SaaS</p>
            <h1 className="font-heading mt-3 text-4xl font-bold text-foreground md:text-6xl">
              Plans that unlock features automatically.
            </h1>
            <p className="mt-4 text-muted-foreground md:text-lg">
              Pricing, limits, billing cycles, sidebar modules, integrations, reports, and feature visibility are loaded
              from Super Admin managed subscription plans.
            </p>
          </div>

          <div className="dashboard-surface p-4">
            <div className="grid rounded-xl bg-secondary p-1" style={{ gridTemplateColumns: `repeat(${Math.max(1, billingOptions.length)}, minmax(0, 1fr))` }}>
              {billingOptions.map((option) => (
                <button
                  key={option.cycle}
                  onClick={() => setBilling(option.cycle)}
                  className={`rounded-lg px-3 py-3 text-sm font-semibold transition ${
                    billing === option.cycle ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-xs font-medium text-muted-foreground">
              Purchase, activation, expiry, renewal, remaining days, grace period, and status are calculated by the backend.
            </p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {sortedPlans.map((plan, index) => {
            const badges = plan.planBadges || [];
            const featured = badges.includes("Most Popular") || badges.includes("Best Value");
            const price = priceFor(plan, billing);

            return (
              <motion.div
                key={plan.code}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className={`premium-card relative flex flex-col p-6 ${featured ? "border-primary shadow-xl shadow-primary/10" : ""}`}
              >
                {badges[0] && (
                  <div className="absolute -top-3 left-6 flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    <Sparkles size={14} />
                    {badges[0]}
                  </div>
                )}
                <h2 className="font-heading text-2xl font-bold text-foreground">{plan.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{plan.recommendedFor || "Rental business teams"}</p>
                <p className="mt-5 flex items-end gap-1 font-heading text-4xl font-bold text-foreground">
                  INR {price.toLocaleString("en-IN")}
                  <span className="pb-1 text-sm font-medium text-muted-foreground">{suffixFor(plan, billing)}</span>
                </p>

                <div className="mt-6 grid grid-cols-3 gap-2 text-sm">
                  {[
                    ["Vehicles", showLimit(plan.bikeLimit)],
                    ["Staff", showLimit(plan.staffLimit)],
                    ["Branches", showLimit(plan.branchLimit)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-border bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-1 font-heading font-bold text-foreground">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex-1 space-y-2 text-sm">
                  {(plan.featureList || []).slice(0, 14).map((feature) => (
                    <p key={feature} className="flex items-start gap-2 text-muted-foreground">
                      <Check size={16} className="mt-0.5 shrink-0 text-success" />
                      <span>{feature}</span>
                    </p>
                  ))}
                </div>

                <Link
                  to={`/owner/register?plan=${plan.code}&billing=${billing}`}
                  className={`mt-6 block rounded-lg py-3 text-center font-semibold ${
                    featured
                      ? "btn-primary-gradient text-primary-foreground"
                      : "border border-border bg-background text-foreground transition hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {plan.code === "starter" ? "Start Free Trial" : "Subscribe Now"}
                </Link>
              </motion.div>
            );
          })}
        </div>

        <section className="mt-14 dashboard-surface overflow-hidden p-6">
          <h2 className="font-heading text-2xl font-bold text-foreground">Feature comparison matrix</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-3 text-muted-foreground">Feature</th>
                  <th className="py-3 text-muted-foreground">Category</th>
                  {sortedPlans.map((plan) => (
                    <th key={plan.code} className="py-3 text-center font-heading text-lg text-foreground">{plan.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.featureKey} className="border-b border-border/60">
                    <td className="py-3 font-medium text-foreground">{row.label}</td>
                    <td className="py-3 text-muted-foreground">{row.category || "Feature"}</td>
                    {sortedPlans.map((plan) => {
                      const value = featureValue(plan, row.featureKey);
                      return (
                        <td key={`${plan.code}-${row.featureKey}`} className="py-3 text-center">
                          {value ? (
                            typeof value === "string" ? (
                              <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold capitalize text-success">{value}</span>
                            ) : (
                              <Check className="mx-auto text-success" size={18} />
                            )
                          ) : (
                            <X className="mx-auto text-muted-foreground" size={18} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.85fr]">
          <div className="dashboard-surface p-6">
            <div className="flex items-center gap-3">
              <CreditCard className="text-primary" size={24} />
              <h2 className="font-heading text-2xl font-bold text-foreground">Upgrade comparison</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              The pricing page is rendered from active plan records. Updating a plan, limit, badge, billing price,
              hidden feature, or comparison row in Super Admin changes what prospects and clients see without deployment.
            </p>
          </div>

          <div className="dashboard-surface p-6">
            <ShieldCheck className="text-success" size={26} />
            <h2 className="font-heading mt-4 text-2xl font-bold text-foreground">Feature access is enforced</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Hidden modules are removed from the tenant sidebar and protected by backend checks, so clients cannot access
              unavailable APIs by typing URLs manually.
            </p>
          </div>
        </div>

        <section className="mt-12 dashboard-surface p-6">
          <h2 className="font-heading text-2xl font-bold text-foreground">Frequently asked questions</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-xl border border-border bg-card p-4">
                <p className="font-semibold text-foreground">{faq.question}</p>
                <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Pricing;
