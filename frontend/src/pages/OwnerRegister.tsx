import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { SubscriptionPlan } from "@/lib/types";

type BillingCycle = "monthly" | "half_yearly" | "yearly";

const OwnerRegister = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [form, setForm] = useState({
    companyName: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    billingCycle: (params.get("billing") as BillingCycle) || "monthly",
    planCode: params.get("plan") || "starter",
  });

  useEffect(() => {
    api.listPlans().then(setPlans).catch(() => setPlans([]));
  }, []);

  const selectedPlan = useMemo(() => plans.find((plan) => plan.code === form.planCode), [plans, form.planCode]);
  const selectedPrice = selectedPlan
    ? form.billingCycle === "yearly"
      ? selectedPlan.yearlyPrice
      : form.billingCycle === "half_yearly"
        ? Math.round(selectedPlan.monthlyPrice * 6)
        : selectedPlan.monthlyPrice
    : 0;

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (Object.values(form).some((value) => !String(value).trim())) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      const data = await api.registerTenantOwner(form);
      localStorage.setItem("motorentix_user_token", data.token);
      localStorage.setItem("motorentix_user", JSON.stringify(data.user));
      toast.success("Shop account created");
      navigate("/tenant");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    }
  };

  return (
    <div className="section-padding bg-secondary min-h-screen">
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-8 items-start">
        <div>
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Owner onboarding</p>
          <h1 className="font-heading text-4xl font-bold text-foreground mt-3">Create your rental shop workspace.</h1>
          <p className="text-muted-foreground mt-4">
            Your customers will still book bikes normally. This account is for managing your fleet, branches, staff, bookings, payments, and reports.
          </p>
          {selectedPlan && (
            <div className="mt-6 rounded-2xl border border-border bg-background p-5">
              <h2 className="font-heading text-xl font-bold text-foreground">{selectedPlan.name}</h2>
              <p className="text-muted-foreground mt-2">INR {selectedPrice.toLocaleString("en-IN")} / {form.billingCycle.replace("_", "-")}</p>
            </div>
          )}
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-border bg-background p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="px-4 py-3 rounded-lg bg-secondary border border-border text-sm" placeholder="Company name" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
            <input className="px-4 py-3 rounded-lg bg-secondary border border-border text-sm" placeholder="Owner name" value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} />
            <input className="px-4 py-3 rounded-lg bg-secondary border border-border text-sm" placeholder="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            <input className="px-4 py-3 rounded-lg bg-secondary border border-border text-sm" placeholder="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            <input className="px-4 py-3 rounded-lg bg-secondary border border-border text-sm" placeholder="Password" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} />
            <select className="px-4 py-3 rounded-lg bg-secondary border border-border text-sm" value={form.planCode} onChange={(e) => update("planCode", e.target.value)}>
              {plans.map((plan) => <option key={plan.code} value={plan.code}>{plan.name}</option>)}
            </select>
            <select className="px-4 py-3 rounded-lg bg-secondary border border-border text-sm md:col-span-2" value={form.billingCycle} onChange={(e) => update("billingCycle", e.target.value)}>
              <option value="monthly">Monthly billing</option>
              <option value="half_yearly">Half-yearly billing</option>
              <option value="yearly">Yearly billing</option>
            </select>
          </div>
          <button className="w-full btn-primary-gradient py-3 rounded-lg text-primary-foreground font-semibold">Create Owner Account</button>
          <p className="text-sm text-muted-foreground text-center">Already registered? <Link to="/login" className="text-primary font-medium">Login</Link></p>
        </form>
      </div>
    </div>
  );
};

export default OwnerRegister;
