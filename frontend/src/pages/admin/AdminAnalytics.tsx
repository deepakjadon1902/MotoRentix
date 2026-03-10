import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { adminApi } from "@/lib/adminApi";
import { useAdminStore } from "@/store/adminStore";

const AdminAnalytics = () => {
  const token = useAdminStore((s) => s.token);
  const navigate = useNavigate();
  const [data, setData] = useState<{
    totalUsers: number;
    totalBookings: number;
    totalVehicles: number;
    activeUsers: number;
    monthlyRevenue: number;
  } | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await adminApi.analytics(token);
      setData(res);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Total Users", value: data.totalUsers },
      { name: "Active Users", value: data.activeUsers },
      { name: "Total Vehicles", value: data.totalVehicles },
      { name: "Monthly Revenue", value: data.monthlyRevenue },
    ];
  }, [data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Revenue and platform insights.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button
          onClick={() => navigate("/admin/analytics/users")}
          className="rounded-2xl border border-border bg-background p-6 text-left hover:shadow-lg transition"
        >
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{data?.totalUsers ?? "-"}</p>
        </button>
        <button
          onClick={() => navigate("/admin/analytics/active-users")}
          className="rounded-2xl border border-border bg-background p-6 text-left hover:shadow-lg transition"
        >
          <p className="text-sm text-muted-foreground">Active Users</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{data?.activeUsers ?? "-"}</p>
        </button>
        <button
          onClick={() => navigate("/admin/analytics/vehicles")}
          className="rounded-2xl border border-border bg-background p-6 text-left hover:shadow-lg transition"
        >
          <p className="text-sm text-muted-foreground">Total Vehicles</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{data?.totalVehicles ?? "-"}</p>
        </button>
        <button
          onClick={() => navigate("/admin/analytics/revenue")}
          className="rounded-2xl border border-border bg-background p-6 text-left hover:shadow-lg transition"
        >
          <p className="text-sm text-muted-foreground">Monthly Revenue</p>
          <p className="mt-2 text-3xl font-bold text-foreground">INR {data?.monthlyRevenue ?? "-"}</p>
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-background p-6">
        <p className="text-sm text-muted-foreground mb-4">KPI Snapshot</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
