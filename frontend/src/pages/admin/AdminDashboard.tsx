import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bike, BookOpenCheck, Users, UserCheck, MessageCircle } from "lucide-react";
import { useAdminStore } from "@/store/adminStore";

interface Overview {
  vehicleCount: number;
  bookingCount: number;
  totalUsers: number;
  activeUsers: number;
  monthlyRevenue: number;
}

const AdminDashboard = () => {
  const token = useAdminStore((state) => state.token);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const res = await fetch("/api/admin/analytics", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setError("Failed to load overview");
          return;
        }
        const data = await res.json();
        setOverview({
          vehicleCount: data.totalVehicles ?? 0,
          bookingCount: data.totalBookings ?? 0,
          totalUsers: data.totalUsers ?? 0,
          activeUsers: data.activeUsers ?? 0,
          monthlyRevenue: data.monthlyRevenue ?? 0,
        });
      } catch {
        setError("Failed to load overview");
      }
    };

    load();
  }, [token]);

  const heroImages = useMemo(
    () => ["/admin-hero/sport-bike.jpg", "/admin-hero/scooter.jpg"],
    []
  );

  useEffect(() => {
    const id = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(id);
  }, [heroImages.length]);

  const kpis = [
    {
      label: "Total Users",
      value: overview?.totalUsers ?? "-",
      icon: Users,
      href: "/admin/users",
      accent: "from-emerald-500/30 to-emerald-500/0",
      text: "text-emerald-500",
    },
    {
      label: "Active Users",
      value: overview?.activeUsers ?? "-",
      icon: UserCheck,
      href: "/admin/users",
      accent: "from-sky-500/30 to-sky-500/0",
      text: "text-sky-500",
    },
    {
      label: "Vehicles",
      value: overview?.vehicleCount ?? "-",
      icon: Bike,
      href: "/admin/vehicles",
      accent: "from-violet-500/30 to-violet-500/0",
      text: "text-violet-500",
    },
    {
      label: "Bookings",
      value: overview?.bookingCount ?? "-",
      icon: BookOpenCheck,
      href: "/admin/bookings",
      accent: "from-amber-500/30 to-amber-500/0",
      text: "text-amber-500",
    },
    {
      label: "Messages",
      value: "View",
      icon: MessageCircle,
      href: "/admin/messages",
      accent: "from-rose-500/30 to-rose-500/0",
      text: "text-rose-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-slate-950 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
          style={{ backgroundImage: `url(${heroImages[heroIndex]})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent" />
        <div className="relative z-10 p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">Admin Command Center</p>
          <h1 className="mt-3 font-heading text-3xl md:text-4xl font-bold">
            MotoRentix at a glance.
          </h1>
          <p className="mt-2 text-sm text-white/80 max-w-xl">
            Monitor the fleet, bookings, and revenue trends in real time. KPIs update as your business grows.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            to={kpi.href}
            className="group rounded-2xl border border-border bg-background p-6 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className={`rounded-xl bg-gradient-to-br ${kpi.accent} p-3 w-fit`}>
              <kpi.icon className={kpi.text} size={20} />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{kpi.label}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{kpi.value}</p>
            <p className="mt-3 text-xs text-muted-foreground group-hover:text-foreground transition">
              View details →
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
