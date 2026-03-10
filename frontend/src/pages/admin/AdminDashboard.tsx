import { useEffect, useState } from "react";
import { useAdminStore } from "@/store/adminStore";

interface Overview {
  vehicleCount: number;
  bookingCount: number;
}

const AdminDashboard = () => {
  const token = useAdminStore((state) => state.token);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");

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
        });
      } catch {
        setError("Failed to load overview");
      }
    };

    load();
  }, [token]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Admin Overview</h1>
        <p className="text-muted-foreground mt-1">Operational snapshot for MotoRentix.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-background p-6">
          <p className="text-sm text-muted-foreground">Vehicles</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{overview?.vehicleCount ?? "-"}</p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-6">
          <p className="text-sm text-muted-foreground">Bookings</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{overview?.bookingCount ?? "-"}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
