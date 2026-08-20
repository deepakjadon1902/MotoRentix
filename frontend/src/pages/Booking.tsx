import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, CheckCircle, Clock, CreditCard, ExternalLink, QrCode, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Vehicle } from "@/lib/types";
import { useStore } from "@/store/useStore";
import VehicleImageGallery from "@/components/VehicleImageGallery";
import PublicWorkflowBar from "@/components/PublicWorkflowBar";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const loadRazorpayCheckout = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

type CheckoutResponse = Awaited<ReturnType<typeof api.createCustomerRentalPayment>>;

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, token, loadBookings } = useStore();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  const [durationType, setDurationType] = useState<"hour" | "day" | "week">("day");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentProvider, setPaymentProvider] = useState("cash");
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null);
  const [checkoutBookingId, setCheckoutBookingId] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    setPaymentProvider("razorpay");
  }, [vehicle]);

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
    if (durationType === "week") {
      const weeks = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7));
      return { units: weeks, total: weeks * (vehicle.pricePerWeek || vehicle.pricePerDay * 7), label: `${weeks} week${weeks === 1 ? "" : "s"}` };
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
    setCheckout(null);
    setCheckoutBookingId("");
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
    if (!token) return;
    setSubmitting(true);
    try {
      const booking = await api.createBooking(token, {
        vehicleId: vehicle.id,
        durationType,
        startDate,
        endDate,
      });
      const bookingId = booking._id || booking.id || "";
      const payment = await api.createCustomerRentalPayment(token, { bookingId, provider: paymentProvider });
      setCheckout(payment);
      setCheckoutBookingId(bookingId);

      if (payment.checkout?.provider === "razorpay" && payment.checkout.keyId && payment.checkout.orderId) {
        const loaded = await loadRazorpayCheckout();
        if (!loaded || !window.Razorpay) {
          toast.error("Razorpay checkout could not load. Please try again.");
          return;
        }
        const checkout = new window.Razorpay({
          key: payment.checkout.keyId,
          amount: payment.checkout.amount,
          currency: payment.checkout.currency || "INR",
          name: "MotoRentix Rental",
          description: vehicle.name,
          order_id: payment.checkout.orderId,
          prefill: {
            name: user?.name,
            email: user?.email,
            contact: user?.phone,
          },
          notes: {
            bookingId,
            paymentId: payment.payment._id || payment.payment.id || "",
          },
          handler: async (response: Record<string, string>) => {
            try {
              const paymentId = payment.payment._id || payment.payment.id || "";
              await api.verifyCustomerRentalRazorpayPayment(token, {
                paymentId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              });
              toast.success("Razorpay payment verified. Booking confirmed.");
              await loadBookings();
              navigate(`/booking-status/${bookingId}`, { state: { provider: "razorpay", paymentStatus: "paid" } });
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Razorpay payment verification failed");
              navigate(`/booking-status/${bookingId}`, { state: { provider: "razorpay", paymentStatus: "pending" } });
            }
          },
          modal: {
            ondismiss: () => toast.info("Payment popup closed. Your booking is pending payment."),
          },
        });
        checkout.open();
        return;
      }

      if (payment.checkout?.provider === "stripe" && payment.checkout.redirectUrl) {
        window.location.assign(payment.checkout.redirectUrl);
        return;
      }

      if (payment.checkout?.provider === "payu" && payment.checkout.form) {
        const form = document.createElement("form");
        form.method = payment.checkout.form.method || "POST";
        form.action = payment.checkout.form.action;
        form.style.display = "none";
        Object.entries(payment.checkout.form.fields).forEach(([name, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = String(value);
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        return;
      }

      if (payment.checkout?.provider === "upi") {
        toast.success("UPI QR generated for the exact booking amount");
        await loadBookings();
        return;
      }

      toast.success("Booking created. MotoRentix admin will manage payment confirmation.");
      await loadBookings();
      navigate(`/booking-status/${bookingId}`, { state: { provider: paymentProvider, paymentStatus: payment.payment.status || "pending" } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Booking or payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const branch = vehicle.branchId && typeof vehicle.branchId === "object" ? vehicle.branchId : null;
  const paymentMethods = ["razorpay", "cash"];

  return (
    <div className="section-padding bg-background min-h-screen">
      <div className="container mx-auto max-w-6xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={18} /> Back
        </button>

        <div className="mb-8">
          <PublicWorkflowBar current="checkout" />
        </div>

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
                <div className="grid grid-cols-3 gap-3">
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
                  <button
                    type="button"
                    onClick={() => setDurationType("week")}
                    className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
                      durationType === "week" ? "bg-primary text-primary-foreground" : "glass text-foreground hover:bg-secondary"
                    }`}
                  >
                    <CalendarDays size={16} /> Weekly
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
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Managed by</span>
                  <span className="text-right font-semibold text-foreground">MotoRentix Fleet</span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Pickup branch</span>
                  <span className="text-right font-semibold text-foreground">{branch?.name || branch?.city || "Assigned after booking"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-semibold text-foreground">
                    {durationType === "hour"
                      ? `INR ${vehicle.pricePerHour}/hr`
                      : durationType === "week"
                        ? `INR ${vehicle.pricePerWeek || vehicle.pricePerDay * 7}/week`
                        : `INR ${vehicle.pricePerDay}/day`}
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

              <div className="rounded-2xl border border-border/60 bg-background/60 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ShieldCheck size={16} className="text-primary" />
                  Payment is managed by MotoRentix admin
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentProvider(method)}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase ${
                        paymentProvider === method ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                      }`}
                    >
                      <CreditCard size={13} className={paymentProvider === method ? "text-primary-foreground" : "text-primary"} />
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {checkout?.checkout?.provider === "upi" && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <QrCode size={17} className="text-primary" />
                    Scan & pay exact amount
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
                    {checkout.checkout.qrDataUrl && (
                      <img
                        src={checkout.checkout.qrDataUrl}
                        alt={`UPI QR for INR ${checkout.checkout.amount || pricing.total}`}
                        className="mx-auto h-44 w-44 rounded-2xl border border-border bg-white p-2 shadow-sm"
                      />
                    )}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">UPI ID</span>
                        <span className="text-right font-semibold text-foreground">{checkout.checkout.upiId}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Payee</span>
                        <span className="text-right font-semibold text-foreground">{checkout.checkout.displayName || "MotoRentix Rental"}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="text-right font-heading text-lg font-bold text-primary">INR {checkout.checkout.amount || pricing.total}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{checkout.checkout.note}</p>
                      {checkout.checkout.upiIntentUrl && (
                        <a
                          href={checkout.checkout.upiIntentUrl}
                          className="btn-primary-gradient mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-primary-foreground"
                        >
                          Open UPI app <ExternalLink size={15} />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          await loadBookings();
                          navigate(`/booking-status/${checkoutBookingId}`, { state: { provider: "upi", paymentStatus: checkout.payment.status || "pending" } });
                        }}
                        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary"
                      >
                        I have paid
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
                disabled={submitting || pricing.total <= 0 || !vehicle.availability || !user?.phone || !user?.address || !user?.city || !user?.pincode || !user?.aadhaarNumber}
                className="w-full btn-primary-gradient py-3.5 rounded-xl font-semibold text-primary-foreground text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? "Preparing checkout..."
                  : paymentProvider === "upi"
                    ? "Generate UPI QR"
                    : ["razorpay", "stripe", "payu"].includes(paymentProvider)
                      ? `Pay with ${paymentProvider.toUpperCase()}`
                      : "Request Booking"}
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
