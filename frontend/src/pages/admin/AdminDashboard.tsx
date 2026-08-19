import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  Bike,
  BookOpenCheck,
  CalendarClock,
  IndianRupee,
  MessageCircle,
  Plus,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import { adminApi, type AdminBooking, type AdminMessage } from "@/lib/adminApi";
import { useAdminStore } from "@/store/adminStore";

type Overview = Awaited<ReturnType<typeof adminApi.analytics>>;

const formatMoney = (value?: number) => `INR ${Number(value || 0).toLocaleString("en-IN")}`;
const idOf = (item?: { _id?: string; id?: string } | string) =>
  typeof item === "string" ? item : item?._id || item?.id || "";

const AdminDashboard = () => {
  const token = useAdminStore((state) => state.token);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [vehicles, setVehicles] = useState<Awaited<ReturnType<typeof adminApi.listVehicles>>>([]);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [analyticsData, vehicleData, bookingData, messageData] = await Promise.all([
        adminApi.analytics(token),
        adminApi.listVehicles(token),
        adminApi.listBookings(token),
        adminApi.listMessages(token),
      ]);
      setOverview(analyticsData);
      setVehicles(vehicleData);
      setBookings(bookingData);
      setMessages(messageData);
      setLastUpdated(new Date());
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    }
  }, [token]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  const vehicleHealth = useMemo(() => {
    const available = vehicles.filter((vehicle) => vehicle.availability && vehicle.status !== "maintenance" && vehicle.status !== "disabled").length;
    const maintenance = vehicles.filter((vehicle) => vehicle.status === "maintenance").length;
    const disabled = vehicles.filter((vehicle) => vehicle.status === "disabled" || vehicle.status === "archived").length;
    return { available, maintenance, disabled };
  }, [vehicles]);

  const bookingStatus = useMemo(() => ({
    pending: bookings.filter((booking) => booking.status === "pending").length,
    confirmed: bookings.filter((booking) => booking.status === "confirmed").length,
    completed: bookings.filter((booking) => booking.status === "completed").length,
    rejected: bookings.filter((booking) => booking.status === "rejected").length,
  }), [bookings]);

  const recentBookings = bookings.slice(0, 5);
  const recentMessages = messages.slice(0, 4);
  const availabilityRate = vehicles.length ? Math.round((vehicleHealth.available / vehicles.length) * 100) : 0;

  const kpis = [
    { label: "Rental Revenue", value: formatMoney(overview?.monthlyRevenue), helper: "This month", icon: IndianRupee, href: "/admin/analytics", tone: "from-emerald-500/18 to-emerald-500/0 text-emerald-500" },
    { label: "Bookings", value: overview?.totalBookings ?? "-", helper: `${bookingStatus.pending} pending`, icon: BookOpenCheck, href: "/admin/bookings", tone: "from-amber-500/18 to-amber-500/0 text-amber-500" },
    { label: "Fleet", value: overview?.totalVehicles ?? "-", helper: `${availabilityRate}% available`, icon: Bike, href: "/admin/vehicles", tone: "from-blue-500/18 to-blue-500/0 text-blue-500" },
    { label: "Active Users", value: overview?.activeUsers ?? "-", helper: `${overview?.totalUsers ?? 0} total users`, icon: Users, href: "/admin/users", tone: "from-violet-500/18 to-violet-500/0 text-violet-500" },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-lg border border-white/10 bg-slate-950 text-white shadow-2xl shadow-slate-950/20">
        <img src="/admin-hero/sport-bike.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(2,6,23,0.96)_0%,rgba(15,23,42,0.86)_44%,rgba(15,23,42,0.18)_100%)]" />
        <div className="relative grid gap-6 p-6 md:p-8 xl:grid-cols-[1fr_330px] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/75">
              <Activity size={15} />
              Live admin command
            </div>
            <h1 className="mt-5 max-w-3xl font-heading text-4xl font-bold leading-tight md:text-5xl">
              MotoRentix operations, revenue, and fleet health.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72 md:text-base">
              Monitor bookings, vehicles, users, messages, and revenue from one realistic control center. Data refreshes automatically every 15 seconds.
            </p>
          </div>
          <div className="rounded-lg border border-white/12 bg-white/10 p-4 backdrop-blur-md">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/58">System status</p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 text-lg font-bold">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
                Live
              </span>
              <span className="text-xs text-white/60">{lastUpdated ? lastUpdated.toLocaleTimeString("en-IN") : "Syncing..."}</span>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Link key={kpi.label} to={kpi.href} className="group rounded-lg border border-border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${kpi.tone}`}>
              <kpi.icon size={21} />
            </div>
            <p className="mt-4 text-sm font-semibold text-muted-foreground">{kpi.label}</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <p className="font-heading text-3xl font-bold text-foreground">{kpi.value}</p>
              <ArrowUpRight className="text-muted-foreground transition group-hover:text-primary" size={18} />
            </div>
            <p className="mt-2 text-xs font-medium text-muted-foreground">{kpi.helper}</p>
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground">Booking Pipeline</h2>
              <p className="mt-1 text-sm text-muted-foreground">Real-time booking state across the rental operation.</p>
            </div>
            <Link to="/admin/bookings" className="rounded-md border border-border px-3 py-2 text-sm font-bold text-foreground hover:bg-secondary">Manage</Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Pending", bookingStatus.pending, "bg-amber-500"],
              ["Confirmed", bookingStatus.confirmed, "bg-blue-500"],
              ["Completed", bookingStatus.completed, "bg-emerald-500"],
              ["Rejected", bookingStatus.rejected, "bg-rose-500"],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-lg border border-border bg-secondary/45 p-4">
                <span className={`block h-1.5 w-10 rounded-full ${color}`} />
                <p className="mt-4 text-sm font-semibold text-muted-foreground">{label}</p>
                <p className="mt-1 font-heading text-3xl font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6">
          <h2 className="font-heading text-2xl font-bold text-foreground">Fleet Health</h2>
          <div className="mt-5 space-y-4">
            {[
              ["Available", vehicleHealth.available, "bg-emerald-500"],
              ["Maintenance", vehicleHealth.maintenance, "bg-amber-500"],
              ["Offline", vehicleHealth.disabled, "bg-rose-500"],
            ].map(([label, value, color]) => {
              const percent = vehicles.length ? Math.round((Number(value) / vehicles.length) * 100) : 0;
              return (
                <div key={label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-foreground">{label}</span>
                    <span className="text-muted-foreground">{value} vehicles</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-bold text-foreground">Recent Bookings</h2>
            <CalendarClock className="text-primary" size={22} />
          </div>
          <div className="mt-4 divide-y divide-border">
            {recentBookings.map((booking) => (
              <div key={idOf(booking)} className="grid gap-3 py-3 text-sm md:grid-cols-[1fr_140px_100px] md:items-center">
                <div>
                  <p className="font-bold text-foreground">{booking.vehicleId?.name || "Vehicle booking"}</p>
                  <p className="text-xs text-muted-foreground">{booking.userId?.name || "Customer"} · {booking.userId?.email || "No email"}</p>
                </div>
                <p className="font-semibold text-foreground">{formatMoney(booking.totalPrice)}</p>
                <span className="w-fit rounded-md bg-secondary px-2.5 py-1 text-xs font-bold capitalize text-muted-foreground">{booking.status || "pending"}</span>
              </div>
            ))}
            {recentBookings.length === 0 && <p className="py-6 text-sm text-muted-foreground">No bookings yet.</p>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6">
            <h2 className="font-heading text-2xl font-bold text-foreground">Quick Actions</h2>
            <div className="mt-4 grid gap-3">
              <Link to="/admin/vehicles" className="inline-flex items-center justify-between rounded-md bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">
                Add or edit vehicles <Plus size={17} />
              </Link>
              <Link to="/admin/bookings" className="inline-flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm font-bold text-foreground hover:bg-secondary">
                Review bookings <BookOpenCheck size={17} />
              </Link>
              <Link to="/admin/analytics" className="inline-flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm font-bold text-foreground hover:bg-secondary">
                Open analytics <Activity size={17} />
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-foreground">Messages</h2>
              <MessageCircle className="text-primary" size={20} />
            </div>
            <div className="mt-4 space-y-3">
              {recentMessages.map((message) => (
                <div key={idOf(message)} className="rounded-md border border-border bg-secondary/45 p-3">
                  <p className="truncate text-sm font-bold text-foreground">{message.subject || "Support message"}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{message.message}</p>
                </div>
              ))}
              {recentMessages.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: "Security", value: "Admin protected routes", icon: ShieldCheck },
          { label: "Maintenance", value: `${vehicleHealth.maintenance} vehicles need attention`, icon: Wrench },
          { label: "Activity", value: "Auto refresh every 15 seconds", icon: Activity },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <item.icon className="text-primary" size={20} />
            <p className="mt-3 text-sm font-bold text-foreground">{item.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
