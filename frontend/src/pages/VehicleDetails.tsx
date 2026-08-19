import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, CheckCircle, Clock, CreditCard, IndianRupee, MapPin, ShieldCheck, Sparkles, Star, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { Vehicle } from "@/lib/types";
import { useStore } from "@/store/useStore";
import VehicleImageGallery from "@/components/VehicleImageGallery";
import PublicWorkflowBar from "@/components/PublicWorkflowBar";

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

  if (loading) {
    return (
      <div className="section-padding min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading vehicle...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="section-padding min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground">Vehicle not found</h2>
          <Link to="/dashboard" className="text-primary mt-4 inline-block hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const galleryImages = (vehicle.images && vehicle.images.length > 0)
    ? vehicle.images
    : vehicle.image
      ? [vehicle.image]
      : [];
  const tenant = vehicle.tenantId && typeof vehicle.tenantId === "object" ? vehicle.tenantId : null;
  const branch = vehicle.branchId && typeof vehicle.branchId === "object" ? vehicle.branchId : null;
  const paymentMethods = vehicle.availablePaymentMethods?.length ? vehicle.availablePaymentMethods : ["cash"];

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-[linear-gradient(180deg,hsl(var(--secondary))_0%,hsl(var(--background))_100%)] px-4 pb-10 pt-8 md:px-8 lg:px-16 xl:px-24">
        <div className="container mx-auto max-w-[1280px]">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft size={18} /> Back to rides
        </button>

        <div className="mb-8">
          <PublicWorkflowBar current="review" />
        </div>

        <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                {vehicle.category?.replace("_", " ")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-bold text-foreground shadow-sm">
                <Star className="fill-warning text-warning" size={13} /> 4.8 guest rating
              </span>
              {vehicle.availability ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                  <CheckCircle size={13} /> Available now
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                  <XCircle size={13} /> Unavailable
                </span>
              )}
            </div>
            <h1 className="font-heading mt-4 text-4xl font-bold leading-tight text-foreground md:text-5xl">{vehicle.name}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
              {vehicle.description || "Premium verified rental listing with transparent pricing, secure payment, and branch-backed pickup support."}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Starts from</p>
            <p className="font-heading text-3xl font-bold text-foreground">INR {vehicle.pricePerHour}<span className="text-sm font-medium text-muted-foreground"> /hr</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-8">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            <VehicleImageGallery images={galleryImages} alt={vehicle.name} />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 lg:sticky lg:top-6">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-xl shadow-foreground/10 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Your deal summary</p>
                  <h2 className="font-heading mt-2 text-2xl font-bold text-foreground">Reserve this ride</h2>
                </div>
                <div className="flex items-center gap-2 mt-1 shrink-0">
                  {vehicle.availability ? (
                    <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-success/10 text-success">
                      <CheckCircle size={14} /> Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-accent/10 text-accent">
                      <XCircle size={14} /> Unavailable
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-border/60 bg-secondary/50 p-4">
                <div className="flex items-start gap-3">
                  {tenant?.branding?.logoUrl ? (
                    <img src={tenant.branding.logoUrl} alt={tenant.companyName || "Company"} className="h-11 w-11 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Building2 size={20} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Listed by</p>
                    <p className="truncate font-heading text-lg font-bold text-foreground">{tenant?.companyName || "Verified rental company"}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin size={13} />
                      {branch?.name || branch?.city || branch?.address || "Pickup location available after booking"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock size={14} /> Per Hour
                  </div>
                  <div className="mt-2 flex items-end gap-2">
                    <p className="font-heading text-lg font-bold text-foreground md:text-2xl">INR {vehicle.pricePerHour}</p>
                    <span className="text-xs text-muted-foreground mb-1">/hr</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <IndianRupee size={14} /> Per Day
                  </div>
                  <div className="mt-2 flex items-end gap-2">
                    <p className="font-heading text-lg font-bold text-foreground md:text-2xl">INR {vehicle.pricePerDay}</p>
                    <span className="text-xs text-muted-foreground mb-1">/day</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <IndianRupee size={14} /> Per Week
                  </div>
                  <div className="mt-2 flex items-end gap-2">
                    <p className="font-heading text-lg font-bold text-foreground md:text-2xl">INR {vehicle.pricePerWeek || vehicle.pricePerDay * 7}</p>
                    <span className="text-xs text-muted-foreground mb-1">/week</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ShieldCheck size={16} className="text-primary" /> Safety first
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Inspected & sanitized before every ride.</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Sparkles size={16} className="text-accent" /> Premium experience
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Smooth booking, instant confirmation, no hassle.</p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={vehicle.availability ? (isAuthenticated ? `/booking/${vehicle.id}` : "/login") : "#"}
                  className={`w-full text-center btn-primary-gradient py-3 rounded-xl font-semibold text-primary-foreground ${vehicle.availability ? "" : "pointer-events-none opacity-50"}`}
                >
                  {vehicle.availability ? "Book Now" : "Currently Unavailable"}
                </Link>
                <Link
                  to="/contact"
                  className="w-full text-center py-3 rounded-xl font-semibold border border-border text-foreground hover:bg-secondary transition-colors"
                >
                  Ask a question
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
        </div>
      </section>

      <section className="px-4 py-12 md:px-8 lg:px-16 xl:px-24">
        <div className="container mx-auto max-w-[1280px]">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-7">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">Highlights</h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  "Instant booking & confirmation",
                  "Flexible hourly/daily plans",
                  "Clean, serviced and ready to ride",
                  vehicle.category === "bike" ? "Sporty handling & confident braking" : "Easy city rides with great comfort",
                ].map((text) => (
                  <div key={text} className="rounded-2xl border border-border/60 bg-background/60 p-4 flex items-start gap-3">
                    <CheckCircle size={18} className="text-success mt-0.5" />
                    <p className="text-sm text-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-7">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">What you get</h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { title: "Helmet", desc: "Included where applicable." },
                  { title: "Support", desc: "Help during pickup & drop." },
                  { title: "Clean ride", desc: "Sanitized and inspected." },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-border/60 bg-secondary/40 p-4">
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-7">
              <h2 className="font-heading text-xl font-bold text-foreground">Policies</h2>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  Bring a valid ID at pickup.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  Late returns may incur extra charges.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  Ride responsibly and follow traffic rules.
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-7">
              <h2 className="font-heading text-xl font-bold text-foreground">Accepted payment methods</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {paymentMethods.map((method) => (
                  <span key={method} className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-2 text-xs font-semibold uppercase text-foreground">
                    <CreditCard size={14} className="text-primary" />
                    {method}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-7">
              <h2 className="font-heading text-xl font-bold text-foreground">Need help?</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Have questions about availability, pricing, or pickup location? We're happy to help.
              </p>
              <Link to="/contact" className="mt-4 inline-flex items-center justify-center w-full btn-primary-gradient py-3 rounded-xl font-semibold text-primary-foreground">
                Contact support
              </Link>
            </div>
          </div>
        </div>
        </div>
      </section>
    </div>
  );
};

export default VehicleDetails;
