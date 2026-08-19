import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bike,
  BookOpenCheck,
  Clock3,
  IndianRupee,
  PieChart as PieChartIcon,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { adminApi, type AdminBooking } from "@/lib/adminApi";
import { useAdminStore } from "@/store/adminStore";

const formatMoney = (value?: number) => `INR ${Number(value || 0).toLocaleString("en-IN")}`;

const shortDate = (value?: string) => {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(date);
};

const categoryLabel = (category?: string) => {
  if (category === "electric_bike" || category === "electric_scooter") return "Electric";
  if (category === "scooter") return "Scooters";
  return "Bikes";
};

const AdminAnalytics = () => {
  const token = useAdminStore((s) => s.token);
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof adminApi.analytics>> | null>(null);
  const [vehicles, setVehicles] = useState<Awaited<ReturnType<typeof adminApi.listVehicles>>>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [users, setUsers] = useState<Awaited<ReturnType<typeof adminApi.listUsers>>>([]);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [analyticsData, vehicleData, bookingData, userData] = await Promise.all([
        adminApi.analytics(token),
        adminApi.listVehicles(token),
        adminApi.listBookings(token),
        adminApi.listUsers(token),
      ]);
      setOverview(analyticsData);
      setVehicles(vehicleData);
      setBookings(bookingData);
      setUsers(userData);
      setLastUpdated(new Date());
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    }
  }, [token]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  const bookingStatusData = useMemo(() => {
    const statuses = ["pending", "confirmed", "completed", "rejected"];
    return statuses.map((status) => ({
      name: status,
      value: bookings.filter((booking) => booking.status === status).length,
    }));
  }, [bookings]);

  const categoryData = useMemo(() => {
    const counts = vehicles.reduce<Record<string, number>>((acc, vehicle) => {
      const label = categoryLabel(vehicle.category);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [vehicles]);

  const revenueTimeline = useMemo(() => {
    const map = bookings.reduce<Record<string, number>>((acc, booking) => {
      const key = shortDate(booking.createdAt);
      acc[key] = (acc[key] || 0) + Number(booking.totalPrice || 0);
      return acc;
    }, {});
    return Object.entries(map).slice(0, 8).map(([name, revenue]) => ({ name, revenue }));
  }, [bookings]);

  const bookingTrend = useMemo(() => {
    const map = bookings.reduce<Record<string, number>>((acc, booking) => {
      const key = shortDate(booking.createdAt);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(map).slice(0, 8).map(([name, value]) => ({ name, value }));
  }, [bookings]);

  const activeVehicleRate = vehicles.length
    ? Math.round((vehicles.filter((vehicle) => vehicle.availability).length / vehicles.length) * 100)
    : 0;

  const statCards = [
    { label: "Revenue", value: formatMoney(overview?.monthlyRevenue), note: "Confirmed and completed bookings", icon: IndianRupee },
    { label: "Bookings", value: overview?.totalBookings ?? "-", note: "All rental requests", icon: BookOpenCheck },
    { label: "Fleet Availability", value: `${activeVehicleRate}%`, note: `${vehicles.filter((vehicle) => vehicle.availability).length} active vehicles`, icon: Bike },
    { label: "Active Users", value: overview?.activeUsers ?? "-", note: `${users.length} total accounts`, icon: Users },
  ];

  const pieColors = ["#2563eb", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Real-time analytics</p>
            <h1 className="font-heading mt-2 text-3xl font-bold text-foreground md:text-4xl">MotoRentix performance center</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Live view of revenue, bookings, fleet status, users, and demand signals. Refreshes every 15 seconds.
            </p>
          </div>
          <div className="rounded-md border border-border bg-secondary px-4 py-3 text-sm font-semibold text-foreground">
            Last sync: {lastUpdated ? lastUpdated.toLocaleTimeString("en-IN") : "Syncing..."}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon size={22} />
              </div>
              <TrendingUp className="text-success" size={18} />
            </div>
            <p className="mt-4 text-sm font-semibold text-muted-foreground">{item.label}</p>
            <p className="mt-2 font-heading text-3xl font-bold text-foreground">{item.value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{item.note}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground">Revenue Movement</h2>
              <p className="mt-1 text-sm text-muted-foreground">Revenue grouped by recent booking dates.</p>
            </div>
            <IndianRupee className="text-primary" size={22} />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTimeline}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground">Booking Status</h2>
              <p className="mt-1 text-sm text-muted-foreground">Current operational split.</p>
            </div>
            <PieChartIcon className="text-primary" size={22} />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bookingStatusData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={98} paddingAngle={4}>
                  {bookingStatusData.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-heading text-2xl font-bold text-foreground">Booking Demand</h2>
            <Activity className="text-primary" size={22} />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-heading text-2xl font-bold text-foreground">Fleet Composition</h2>
            <Bike className="text-primary" size={22} />
          </div>
          <div className="space-y-4">
            {categoryData.map((item, index) => {
              const percent = vehicles.length ? Math.round((item.value / vehicles.length) * 100) : 0;
              return (
                <div key={item.name}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-bold text-foreground">{item.name}</span>
                    <span className="text-muted-foreground">{item.value} · {percent}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: pieColors[index % pieColors.length] }} />
                  </div>
                </div>
              );
            })}
            {categoryData.length === 0 && <p className="text-sm text-muted-foreground">No fleet data yet.</p>}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold text-foreground">Recent Operational Feed</h2>
          <Clock3 className="text-primary" size={22} />
        </div>
        <div className="divide-y divide-border">
          {bookings.slice(0, 8).map((booking) => (
            <div key={`${booking.createdAt}-${booking.vehicleId?.name}-${booking.totalPrice}`} className="grid gap-3 py-3 text-sm md:grid-cols-[1fr_130px_120px_110px] md:items-center">
              <div>
                <p className="font-bold text-foreground">{booking.vehicleId?.name || "Vehicle booking"}</p>
                <p className="text-xs text-muted-foreground">{booking.userId?.name || "Customer"} · {shortDate(booking.createdAt)}</p>
              </div>
              <p className="font-semibold text-foreground">{formatMoney(booking.totalPrice)}</p>
              <p className="capitalize text-muted-foreground">{booking.durationType || "rental"}</p>
              <span className="w-fit rounded-md bg-secondary px-2.5 py-1 text-xs font-bold capitalize text-muted-foreground">{booking.status || "pending"}</span>
            </div>
          ))}
          {bookings.length === 0 && <p className="py-8 text-sm text-muted-foreground">No booking activity yet.</p>}
        </div>
      </section>
    </div>
  );
};

export default AdminAnalytics;
