import { useEffect, useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Bike, CalendarDays, CheckCircle, Clock, CreditCard, IndianRupee, MapPin, ShieldCheck, XCircle } from "lucide-react";
import PublicWorkflowBar from "@/components/PublicWorkflowBar";
import { useStore } from "@/store/useStore";

type RouteState = {
  provider?: string;
  paymentStatus?: string;
};

const paymentCopy = {
  paid: {
    title: "Payment verified",
    tone: "text-success bg-success/10",
    icon: CheckCircle,
  },
  failed: {
    title: "Payment failed",
    tone: "text-destructive bg-destructive/10",
    icon: XCircle,
  },
  pending: {
    title: "Payment verification pending",
    tone: "text-accent bg-accent/10",
    icon: Clock,
  },
  refunded: {
    title: "Payment refunded",
    tone: "text-muted-foreground bg-secondary",
    icon: CreditCard,
  },
};

const BookingStatus = () => {
  const { id } = useParams();
  const location = useLocation();
  const routeState = (location.state || {}) as RouteState;
  const query = new URLSearchParams(location.search);
  const { bookings, isAuthenticated, loadBookings } = useStore();

  useEffect(() => {
    if (isAuthenticated) {
      loadBookings();
    }
  }, [isAuthenticated, loadBookings]);

  const booking = useMemo(() => bookings.find((item) => item.id === id), [bookings, id]);
  const paymentStatus = booking?.paymentStatus || routeState.paymentStatus || (query.get("payment") === "cancelled" ? "failed" : "pending");
  const paymentMeta = paymentCopy[paymentStatus as keyof typeof paymentCopy] || paymentCopy.pending;
  const PaymentIcon = paymentMeta.icon;

  if (!isAuthenticated) {
    return (
      <div className="section-padding min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="font-heading text-2xl font-bold text-foreground">Please login to view booking status</h2>
          <Link to="/login" className="btn-primary-gradient px-6 py-3 rounded-lg text-primary-foreground font-semibold inline-block">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl">
        <PublicWorkflowBar current="confirmed" />

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <div className="glass rounded-3xl border border-border/60 p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Booking status</p>
                <h1 className="font-heading mt-2 text-3xl font-bold text-foreground md:text-4xl">
                  {paymentStatus === "failed" ? "Payment needs attention" : "Your ride request is in progress"}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  MotoRentix keeps your booking, payment status, pickup preparation, and return workflow in one managed admin system.
                </p>
              </div>
              <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${paymentMeta.tone}`}>
                <PaymentIcon size={16} />
                {paymentMeta.title}
              </span>
            </div>

            {booking ? (
              <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background/70 p-5">
                  <div className="flex items-start gap-4">
                    {booking.vehicle.image ? (
                      <img src={booking.vehicle.image} alt={booking.vehicle.name} className="h-20 w-24 rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-20 w-24 items-center justify-center rounded-xl bg-secondary">
                        <Bike className="text-muted-foreground" size={28} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Selected ride</p>
                      <h2 className="truncate font-heading text-xl font-bold text-foreground">{booking.vehicle.name}</h2>
                      <p className="mt-1 text-xs text-muted-foreground capitalize">{booking.vehicle.category?.replace("_", " ") || "Vehicle"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background/70 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <ShieldCheck size={20} />
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Managed by</p>
                      <p className="font-heading text-lg font-bold text-foreground">MotoRentix Fleet</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-secondary/55 p-5">
                  <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    <CalendarDays size={14} /> Rental period
                  </p>
                  <p className="mt-2 font-semibold text-foreground">{booking.startDate || "-"} to {booking.endDate || "-"}</p>
                </div>

                <div className="rounded-2xl border border-border bg-secondary/55 p-5">
                  <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    <IndianRupee size={14} /> Total amount
                  </p>
                  <p className="mt-2 font-heading text-2xl font-bold text-primary">INR {booking.totalPrice}</p>
                </div>
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-border bg-secondary/50 p-6 text-sm text-muted-foreground">
                Loading latest booking details. Open My Bookings if this takes longer than a moment.
              </div>
            )}

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-4">
              {[
                { title: "Request received", text: "Booking created in the admin system.", done: true },
                { title: "Payment check", text: routeState.provider || query.get("provider") ? `${routeState.provider || query.get("provider")} gateway response` : "Gateway webhook response", done: paymentStatus === "paid" },
                { title: "Admin verification", text: "Documents and pickup readiness.", done: booking?.status === "confirmed" || booking?.status === "running" || booking?.status === "completed" },
                { title: "Pickup & ride", text: "Collect vehicle and enjoy.", done: booking?.status === "running" || booking?.status === "completed" },
              ].map((step) => (
                <div key={step.title} className="rounded-2xl border border-border bg-background/70 p-4">
                  <CheckCircle size={18} className={step.done ? "text-success" : "text-muted-foreground"} />
                  <p className="mt-3 text-sm font-bold text-foreground">{step.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="glass rounded-3xl border border-border/60 p-6">
              <h2 className="font-heading text-xl font-bold text-foreground">Next actions</h2>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <p className="flex gap-2"><ShieldCheck size={16} className="mt-0.5 text-primary" /> Keep your license and ID ready for pickup verification.</p>
                <p className="flex gap-2"><MapPin size={16} className="mt-0.5 text-primary" /> MotoRentix will confirm pickup instructions.</p>
                <p className="flex gap-2"><CreditCard size={16} className="mt-0.5 text-primary" /> Failed or pending payments can be reviewed from My Bookings.</p>
              </div>
              <div className="mt-6 grid gap-3">
                <Link to="/my-bookings" className="btn-primary-gradient rounded-xl px-5 py-3 text-center font-semibold text-primary-foreground">
                  View My Bookings
                </Link>
                <Link to="/dashboard" className="rounded-xl border border-border px-5 py-3 text-center font-semibold text-foreground hover:bg-secondary">
                  Compare More Rides
                </Link>
              </div>
            </div>
          </aside>
        </motion.div>
      </div>
    </div>
  );
};

export default BookingStatus;
