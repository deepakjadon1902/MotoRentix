import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, Clock, IndianRupee, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { Vehicle } from "@/lib/types";
import { useStore } from "@/store/useStore";
import VehicleImageGallery from "@/components/VehicleImageGallery";

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

  return (
    <div className="section-padding bg-background min-h-screen">
      <div className="container mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={18} /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-10 items-start">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            <VehicleImageGallery images={galleryImages} alt={vehicle.name} />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 lg:sticky lg:top-6">
            <div className="glass rounded-3xl p-6 md:p-7 border border-border/60 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                    {vehicle.category}
                  </span>
                  <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3">{vehicle.name}</h1>
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

              {vehicle.description && (
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{vehicle.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock size={14} /> Per Hour
                  </div>
                  <div className="mt-2 flex items-end gap-2">
                    <p className="font-heading text-2xl font-bold text-foreground">INR {vehicle.pricePerHour}</p>
                    <span className="text-xs text-muted-foreground mb-1">/hr</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <IndianRupee size={14} /> Per Day
                  </div>
                  <div className="mt-2 flex items-end gap-2">
                    <p className="font-heading text-2xl font-bold text-foreground">INR {vehicle.pricePerDay}</p>
                    <span className="text-xs text-muted-foreground mb-1">/day</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
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

        <div className="mt-10 lg:mt-14 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass rounded-3xl p-6 md:p-7 border border-border/60">
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

            <div className="glass rounded-3xl p-6 md:p-7 border border-border/60">
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
            <div className="glass rounded-3xl p-6 md:p-7 border border-border/60">
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

            <div className="glass rounded-3xl p-6 md:p-7 border border-border/60">
              <h2 className="font-heading text-xl font-bold text-foreground">Need help?</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Have questions about availability, pricing, or pickup location? We’re happy to help.
              </p>
              <Link to="/contact" className="mt-4 inline-flex items-center justify-center w-full btn-primary-gradient py-3 rounded-xl font-semibold text-primary-foreground">
                Contact support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;
