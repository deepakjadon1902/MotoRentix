import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, CheckCircle, Clock, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Vehicle } from "@/lib/types";
import { useStore } from "@/store/useStore";
import VehicleImageGallery from "@/components/VehicleImageGallery";

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { createBooking, isAuthenticated, user } = useStore();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  const [durationType, setDurationType] = useState<"hour" | "day">("day");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

  const pricing = useMemo(() => {
    if (!vehicle || !startDate || !endDate) return { units: 0, total: 0, label: "" };
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return { units: 0, total: 0, label: "" };
    if (durationType === "day") {
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return { units: days, total: days * vehicle.pricePerDay, label: `${days} day${days === 1 ? "" : "s"}` };
    }
    const hours = Math.ceil(diffMs / (1000 * 60 * 60));
    return { units: hours, total: hours * vehicle.pricePerHour, label: `${hours} hour${hours === 1 ? "" : "s"}` };
  }, [vehicle, startDate, endDate, durationType]);

  if (!isAuthenticated) {
    return (
      <div className="section-padding min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="font-heading text-2xl font-bold text-foreground">Please login to book</h2>
          <Link to="/login" className="btn-primary-gradient px-6 py-3 rounded-lg text-primary-foreground font-semibold inline-block">
            Login
          </Link>
        </div>
      </div>
    );
  }

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
        <h2 className="font-heading text-2xl font-bold text-foreground">Vehicle not found</h2>
      </div>
    );
  }

  const handleConfirm = async () => {
    const missingProfile =
      !user?.phone || !user?.address || !user?.city || !user?.pincode || !user?.aadhaarNumber;
    if (missingProfile) {
      toast.error("Please complete your profile details before booking");
      navigate("/profile");
      return;
    }
    if (!startDate || !endDate || pricing.total <= 0) {
      toast.error("Please select valid dates");
      return;
    }
    const ok = await createBooking({
      vehicleId: vehicle.id,
      durationType,
      startDate,
      endDate,
    });
    if (ok) {
      toast.success("Booking request sent! Await admin confirmation.");
      navigate("/my-bookings");
    } else {
      toast.error("Booking failed");
    }
  };

  return (
    <div className="section-padding bg-background min-h-screen">
      <div className="container mx-auto max-w-6xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={18} /> Back
        </button>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-3xl font-bold text-foreground mb-8">
          Book {vehicle.name}
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-10 items-start">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <VehicleImageGallery
              images={(vehicle.images && vehicle.images.length > 0) ? vehicle.images : vehicle.image ? [vehicle.image] : []}
              alt={vehicle.name}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="glass rounded-2xl p-5 border border-border/60">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ShieldCheck size={16} className="text-primary" /> Verified & inspected
                </div>
                <p className="text-xs text-muted-foreground mt-1">Every ride is checked before pickup for a smooth experience.</p>
              </div>
              <div className="glass rounded-2xl p-5 border border-border/60">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Sparkles size={16} className="text-accent" /> Clean & ready
                </div>
                <p className="text-xs text-muted-foreground mt-1">Sanitized and prepared so you can start riding instantly.</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:sticky lg:top-6">
            <div className="glass rounded-3xl p-6 md:p-7 border border-border/60 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Booking</p>
                  <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground mt-1">Choose dates & confirm</h2>
                </div>
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Duration Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDurationType("hour")}
                    className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
                      durationType === "hour" ? "bg-primary text-primary-foreground" : "glass text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Clock size={16} /> Hourly
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationType("day")}
                    className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
                      durationType === "day" ? "bg-primary text-primary-foreground" : "glass text-foreground hover:bg-secondary"
                    }`}
                  >
                    <CalendarDays size={16} /> Daily
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Start</label>
                  <input
                    type={durationType === "hour" ? "datetime-local" : "date"}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">End</label>
                  <input
                    type={durationType === "hour" ? "datetime-local" : "date"}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/60 p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vehicle</span>
                  <span className="font-semibold text-foreground">{vehicle.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-semibold text-foreground">
                    {durationType === "hour" ? `INR ${vehicle.pricePerHour}/hr` : `INR ${vehicle.pricePerDay}/day`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-semibold text-foreground">{pricing.label || "-"}</span>
                </div>
                <div className="border-t border-border pt-3 flex items-end justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-heading text-2xl font-bold text-primary">INR {pricing.total}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/60 p-5 space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Your details</p>
                <div className="text-sm text-foreground font-medium">{user?.name || "-"}</div>
                <div className="text-xs text-muted-foreground">{user?.email || "-"}</div>
                <div className="text-xs text-muted-foreground">Phone: {user?.phone || "-"}</div>
                <div className="text-xs text-muted-foreground">
                  Address: {(user?.address || user?.city || user?.pincode)
                    ? `${user?.address || ""}${user?.city ? `, ${user.city}` : ""}${user?.pincode ? ` - ${user.pincode}` : ""}`
                    : "-"}
                </div>
                <div className="text-xs text-muted-foreground">Aadhaar: {user?.aadhaarNumber || "-"}</div>
                {(!user?.phone || !user?.address || !user?.city || !user?.pincode || !user?.aadhaarNumber) && (
                  <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    className="mt-2 text-sm font-medium text-primary hover:underline text-left"
                  >
                    Complete profile to book
                  </button>
                )}
              </div>

              <button
                onClick={handleConfirm}
                disabled={pricing.total <= 0 || !vehicle.availability || !user?.phone || !user?.address || !user?.city || !user?.pincode || !user?.aadhaarNumber}
                className="w-full btn-primary-gradient py-3.5 rounded-xl font-semibold text-primary-foreground text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Request Booking
              </button>

              <p className="text-xs text-muted-foreground">
                By confirming, you agree to follow safety rules and return the vehicle on time.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
