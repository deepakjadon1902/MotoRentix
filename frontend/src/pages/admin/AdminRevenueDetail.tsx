import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi, type AdminBooking } from "@/lib/adminApi";
import { useAdminStore } from "@/store/adminStore";

const AdminRevenueDetail = () => {
  const token = useAdminStore((s) => s.token);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await adminApi.listBookings(token);
      setBookings(data);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load bookings");
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const { monthlyBookings, totalRevenue } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthBookings = bookings.filter((b) => {
      const created = b.createdAt ? new Date(b.createdAt) : null;
      const isBillable = b.status === "confirmed" || b.status === "completed";
      return created && created >= start && isBillable;
    });
    const revenue = monthBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    return { monthlyBookings: monthBookings, totalRevenue: revenue };
  }, [bookings]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Monthly Revenue</h1>
        <p className="text-muted-foreground mt-1">Bookings and revenue for the current month.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-background p-6">
        <p className="text-sm text-muted-foreground">Total Revenue This Month</p>
        <p className="mt-2 text-3xl font-bold text-foreground">INR {totalRevenue}</p>
      </div>

      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="px-6 py-4 border-b border-border font-heading font-bold text-foreground">Monthly Bookings</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Vehicle</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {monthlyBookings.map((b) => (
                <tr key={b._id || b.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="px-6 py-4 text-muted-foreground">{b.userId?.name || "User"}</td>
                  <td className="px-6 py-4 text-muted-foreground">{b.vehicleId?.name || "Vehicle"}</td>
                  <td className="px-6 py-4 text-muted-foreground">INR {b.totalPrice}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {b.createdAt ? b.createdAt.split("T")[0] : "-"}
                  </td>
                </tr>
              ))}
              {monthlyBookings.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-muted-foreground" colSpan={4}>
                    No bookings this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRevenueDetail;
