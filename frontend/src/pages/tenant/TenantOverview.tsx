import { useEffect, useState } from "react";
import { Bike, BookOpenCheck, Building2, CreditCard, TrendingUp, Users } from "lucide-react";
import { tenantApi } from "@/lib/tenantApi";
import { useStore } from "@/store/useStore";

type Overview = {
  vehicles?: number;
  bookings?: number;
  customers?: number;
  branches?: number;
  staff?: number;
  rentalRevenue?: number;
  plan?: { name?: string };
  subscription?: { status?: string; endDate?: string };
  entitlements?: { features?: Record<string, boolean | string> };
};

const formatCurrency = (value?: number) => `INR ${Number(value || 0).toLocaleString("en-IN")}`;

const TenantOverview = () => {
  const token = useStore((state) => state.token);
  const user = useStore((state) => state.user);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    tenantApi.overview(token)
      .then((data) => setOverview(data as Overview))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard"));
  }, [token]);

  const features = overview?.entitlements?.features || {};
  const cards = [
    { label: "Fleet", value: overview?.vehicles ?? "-", icon: Bike, hint: "Bikes and scooters" },
    { label: "Bookings", value: overview?.bookings ?? "-", icon: BookOpenCheck, hint: "Total rental orders" },
    { label: "Customers", value: overview?.customers ?? "-", icon: Users, hint: "Tenant customers" },
    { label: "Branches", value: overview?.branches ?? "-", icon: Building2, hint: "Active locations", feature: "branchManagement" },
  ].filter((card) => !card.feature || Boolean(features[card.feature]));

  return (
    <div className="space-y-6">
      <div className="dashboard-surface overflow-hidden">
        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_360px] lg:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Tenant dashboard</p>
            <h1 className="font-heading mt-2 text-3xl font-bold text-foreground md:text-5xl">
              Welcome, {user?.name || "Owner"}
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Manage fleet availability, bookings, customers, payments, and business settings from one tenant workspace.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                {overview?.plan?.name || "Plan pending"}
              </span>
              <span className="rounded-full bg-success/10 px-3 py-2 text-sm font-medium text-success">
                {overview?.subscription?.status || "Subscription pending"}
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-950 p-5 text-white">
            <CreditCard className="text-primary" size={24} />
            <p className="mt-4 text-sm text-white/60">Rental revenue</p>
            <p className="font-heading mt-1 text-4xl font-bold">{formatCurrency(overview?.rentalRevenue)}</p>
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-white/75">
              <TrendingUp size={16} className="text-success" />
              Live tenant business overview
            </div>
          </div>
        </div>
      </div>

      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => (
          <div key={card.label} className="premium-card p-5" style={{ animationDelay: `${index * 60}ms` }}>
            <card.icon className="text-primary" size={22} />
            <p className="mt-3 text-sm text-muted-foreground">{card.label}</p>
            <p className="font-heading text-3xl font-bold text-foreground">{card.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TenantOverview;
