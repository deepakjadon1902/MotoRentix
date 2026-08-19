import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  Bike,
  BookOpenCheck,
  Building2,
  CreditCard,
  Handshake,
  KeyRound,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  UserCog,
  Users,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { tenantApi, type TenantLicenseSnapshot, type TenantSettings } from "@/lib/tenantApi";

const links = [
  { to: "/tenant", label: "Overview", icon: LayoutDashboard, end: true, feature: "dashboard" },
  { to: "/tenant/fleet", label: "Fleet", icon: Bike, feature: "vehicleManagement" },
  { to: "/tenant/users", label: "Users", icon: Users, feature: "customerManagement" },
  { to: "/tenant/bookings", label: "Bookings", icon: BookOpenCheck, feature: "bookingManagement" },
  { to: "/tenant/orders", label: "Orders", icon: ShoppingBag, feature: "bookingManagement" },
  { to: "/tenant/payments", label: "Payments", icon: CreditCard, feature: "paymentHistory" },
  { to: "/tenant/settings", label: "Settings", icon: Settings, feature: "profileSettings" },
];

const iconMap = {
  Bike,
  BookOpenCheck,
  Building2,
  CreditCard,
  Handshake,
  KeyRound,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  UserCog,
  Users,
};

const TenantLayout = () => {
  const user = useStore((state) => state.user);
  const token = useStore((state) => state.token);
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [license, setLicense] = useState<TenantLicenseSnapshot | null>(null);

  useEffect(() => {
    if (!token || !user?.tenantId) return;
    tenantApi.settings(token).then(setSettings).catch(() => setSettings(null));
    tenantApi.license(token).then(setLicense).catch(() => setLicense(null));
  }, [token, user?.tenantId]);

  const features = settings?.entitlements?.features || {};
  const starterSafeFeatures = new Set(["dashboard", "vehicleManagement", "bookingManagement", "paymentHistory", "profileSettings"]);
  const databaseLinks = (settings?.entitlements?.navigationItems || [])
    .filter((link) => Boolean(features[link.featureKey]))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((link) => ({
      to: link.route,
      label: link.label,
      icon: iconMap[link.icon as keyof typeof iconMap] || LayoutDashboard,
      end: link.exact,
      feature: link.featureKey,
    }));
  const visibleLinks = databaseLinks.length > 0
    ? databaseLinks
    : settings
      ? links.filter((link) => Boolean(features[link.feature]))
      : links.filter((link) => starterSafeFeatures.has(link.feature));
  const status = license?.status || settings?.tenant?.status;
  const showRenewalScreen = ["expired", "suspended", "cancelled", "blocked_by_admin"].includes(status || "");
  const expiryDate = license?.subscription?.endDate
    ? new Date(license.subscription.endDate).toLocaleDateString("en-IN")
    : null;

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1480px]">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Client workspace</p>
            <h1 className="font-heading mt-2 text-2xl font-bold text-foreground md:text-3xl">
              {user?.name || "Rental Owner"} Dashboard
            </h1>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs sm:flex sm:text-left">
            {["Fleet", "Bookings", "Payments"].map((item) => (
              <span key={item} className="rounded-full border border-border bg-secondary px-3 py-2 font-medium text-muted-foreground">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[250px_1fr]">
          <aside className="dashboard-surface h-fit p-3 xl:sticky xl:top-24">
            <p className="hidden px-3 pb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground xl:block">
              Operations
            </p>
            <nav className="scroll-fade-x flex gap-2 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible xl:pb-0">
              {visibleLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `flex min-w-max items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground hover:bg-secondary"
                    }`
                  }
                >
                  <link.icon size={16} />
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </aside>

          <main className="min-w-0 animate-soft-pop">
            {showRenewalScreen ? (
              <section className="dashboard-surface p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-destructive">
                  Subscription {status?.replace(/_/g, " ")}
                </p>
                <h2 className="mt-3 text-2xl font-bold text-foreground">Renew to continue operations</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Dashboard tools, public bookings, marketplace visibility, APIs, and custom domains are paused.
                  Your rental data remains intact and will be restored automatically after successful payment.
                  {expiryDate ? ` Expired on ${expiryDate}.` : ""}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link to="/pricing">Renew now</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/tenant/payments">Payment history</Link>
                  </Button>
                </div>
              </section>
            ) : (
              <Outlet />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default TenantLayout;
