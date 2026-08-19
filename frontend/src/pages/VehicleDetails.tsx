import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  CreditCard,
  Gauge,
  IndianRupee,
  MapPin,
  Route,
  ShieldCheck,
  Sparkles,
  Star,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Vehicle } from "@/lib/types";
import { useStore } from "@/store/useStore";
import VehicleImageGallery from "@/components/VehicleImageGallery";
import PublicWorkflowBar from "@/components/PublicWorkflowBar";

const money = (value?: number) => `INR ${Number(value || 0).toLocaleString("en-IN")}`;

const labelForCategory = (category?: string) => {
  if (category === "electric_bike" || category === "electric_scooter") return "Electric";
  return category?.replace("_", " ") || "Vehicle";
};

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useStore();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const v = await api.getVehicle(id);
        setVehicle(v);
      } catch {
        setVehicle(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const galleryImages = useMemo(() => {
    if (!vehicle) return [];
    return vehicle.images?.length ? vehicle.images : vehicle.image ? [vehicle.image] : [];
  }, [vehicle]);

  if (loading) {
    return (
      <div className="section-padding flex min-h-screen items-center justify-center">
        <div className="dashboard-surface px-6 py-5 text-sm font-semibold text-muted-foreground">Loading vehicle...</div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="section-padding flex min-h-screen items-center justify-center">
        <div className="dashboard-surface max-w-md p-8 text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground">Vehicle not found</h2>
          <Link to="/dashboard" className="mt-4 inline-block text-primary hover:underline">
            Back to vehicles
          </Link>
        </div>
      </div>
    );
  }

  const branch = vehicle.branchId && typeof vehicle.branchId === "object" ? vehicle.branchId : null;
  const paymentMethods = vehicle.availablePaymentMethods?.length ? vehicle.availablePaymentMethods : ["cash", "upi"];
  const categoryLabel = labelForCategory(vehicle.category);
  const featureList = vehicle.features?.length
    ? vehicle.features
    : ["Helmet available", "Sanitized before pickup", "Verified documents", "Road-ready inspection"];
  const weeklyPrice = vehicle.pricePerWeek || vehicle.pricePerDay * 7;
  const monthlyPrice = vehicle.pricePerMonth || vehicle.pricePerDay * 26;
  const pickupLocation = branch?.name || branch?.city || branch?.address || "Pickup location shared after booking";

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-border px-4 py-6 md:px-8 lg:px-12 xl:px-16">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--secondary))_0%,hsl(var(--background))_48%,hsl(var(--primary)/0.08)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

        <div className="relative mx-auto max-w-[1180px]">
          <button
            onClick={() => navigate(-1)}
            className="mb-5 inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-muted-foreground shadow-sm transition hover:text-foreground"
          >
            <ArrowLeft size={17} /> Back to rides
          </button>

          <div className="mb-5">
            <PublicWorkflowBar current="review" />
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,700px)_380px] xl:grid-cols-[minmax(0,740px)_390px]">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-md bg-primary/10 px-3 py-1 text-xs font-bold uppercase text-primary">{categoryLabel}</span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-card px-3 py-1 text-xs font-bold text-foreground shadow-sm">
                  <Star className="fill-warning text-warning" size={13} /> 4.8 guest rating
                </span>
                {vehicle.availability ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-success/10 px-3 py-1 text-xs font-bold text-success">
                    <CheckCircle size={13} /> Available now
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                    <XCircle size={13} /> Unavailable
                  </span>
                )}
              </div>

              <h1 className="font-heading mt-4 max-w-3xl text-4xl font-bold leading-tight text-foreground md:text-5xl">
                {vehicle.name}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                {vehicle.description || "A premium MotoRentix ride prepared for smooth pickup, transparent pricing, and confident city travel."}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  { label: "Starts", value: `${money(vehicle.pricePerHour)}/hr`, icon: Clock },
                  { label: "Daily", value: money(vehicle.pricePerDay), icon: IndianRupee },
                  { label: "Category", value: categoryLabel, icon: Gauge },
                  { label: "Pickup", value: branch?.city || branch?.name || "Assigned", icon: MapPin },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-border bg-card/90 p-3.5 shadow-sm">
                    <item.icon className="text-primary" size={18} />
                    <p className="mt-2 text-[11px] font-bold uppercase text-muted-foreground">{item.label}</p>
                    <p className="mt-1 truncate font-heading text-sm font-bold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <VehicleImageGallery images={galleryImages} alt={vehicle.name} />
              </div>
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="lg:sticky lg:top-24"
            >
              <div className="rounded-lg border border-border bg-card p-5 shadow-xl shadow-foreground/10 md:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Reserve ride</p>
                    <h2 className="font-heading mt-2 text-2xl font-bold text-foreground">Booking summary</h2>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold ${vehicle.availability ? "bg-success/10 text-success" : "bg-accent/10 text-accent"}`}>
                    {vehicle.availability ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {vehicle.availability ? "Ready" : "Paused"}
                  </span>
                </div>

                <div className="mt-5 rounded-lg border border-border/70 bg-secondary/55 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <ShieldCheck size={20} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase text-muted-foreground">Managed by</p>
                      <p className="truncate font-heading text-lg font-bold text-foreground">MotoRentix Fleet</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin size={13} />
                        {pickupLocation}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 divide-y divide-border rounded-lg border border-border bg-background/80">
                  {[
                    ["Hourly", `${money(vehicle.pricePerHour)} / hr`],
                    ["Daily", `${money(vehicle.pricePerDay)} / day`],
                    ["Weekly", `${money(weeklyPrice)} / week`],
                    ["Monthly", `${money(monthlyPrice)} / month`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4 px-4 py-3">
                      <span className="text-sm font-semibold text-muted-foreground">{label}</span>
                      <span className="text-right font-heading text-sm font-bold text-foreground">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-secondary/45 p-4">
                    <ShieldCheck className="text-primary" size={18} />
                    <p className="mt-2 text-sm font-bold text-foreground">Inspected</p>
                    <p className="mt-1 text-xs text-muted-foreground">Checked before pickup.</p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/45 p-4">
                    <Sparkles className="text-accent" size={18} />
                    <p className="mt-2 text-sm font-bold text-foreground">Prepared</p>
                    <p className="mt-1 text-xs text-muted-foreground">Clean and ride-ready.</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3">
                  <Link
                    to={vehicle.availability ? (isAuthenticated ? `/booking/${vehicle.id}` : "/login") : "#"}
                    className={`btn-primary-gradient rounded-md py-3.5 text-center text-sm font-bold text-primary-foreground ${vehicle.availability ? "" : "pointer-events-none opacity-50"}`}
                  >
                    {vehicle.availability ? "Book this ride" : "Currently unavailable"}
                  </Link>
                  <Link
                    to="/contact"
                    className="rounded-md border border-border bg-background px-5 py-3 text-center text-sm font-bold text-foreground transition hover:bg-secondary"
                  >
                    Ask about this vehicle
                  </Link>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 md:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <section className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6">
              <div className="flex items-center gap-3">
                <Route className="text-primary" size={21} />
                <div>
                  <h2 className="font-heading text-2xl font-bold text-foreground">Ride Highlights</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Everything important before you reserve this vehicle.</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {featureList.slice(0, 8).map((text) => (
                  <div key={text} className="flex items-start gap-3 rounded-lg border border-border bg-secondary/45 p-4">
                    <CheckCircle size={18} className="mt-0.5 shrink-0 text-success" />
                    <p className="text-sm font-medium leading-6 text-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6">
              <h2 className="font-heading text-2xl font-bold text-foreground">What You Get</h2>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { title: "Helmet", desc: "Provided where applicable.", icon: ShieldCheck },
                  { title: "Pickup Support", desc: "Clear pickup and return guidance.", icon: MapPin },
                  { title: "Simple Payment", desc: "Accepted methods shown upfront.", icon: CreditCard },
                ].map((item) => (
                  <div key={item.title} className="rounded-lg border border-border bg-card p-4">
                    <item.icon className="text-primary" size={19} />
                    <p className="mt-3 font-heading text-lg font-bold text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6">
              <h2 className="font-heading text-xl font-bold text-foreground">Accepted Payments</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {paymentMethods.map((method) => (
                  <span key={method} className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-bold uppercase text-foreground">
                    <CreditCard size={14} className="text-primary" />
                    {method}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6">
              <h2 className="font-heading text-xl font-bold text-foreground">Pickup Policy</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                <p>Bring a valid ID and driving license for verification.</p>
                <p>Late returns may add extra rental charges.</p>
                <p>Ride responsibly and follow local traffic rules.</p>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default VehicleDetails;
