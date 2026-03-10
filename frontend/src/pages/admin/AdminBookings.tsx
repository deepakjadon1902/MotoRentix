import { useCallback, useEffect, useState } from "react";
import { adminApi, type AdminBooking } from "@/lib/adminApi";
import { useAdminStore } from "@/store/adminStore";

const AdminBookings = () => {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Bookings</h1>
        <p className="text-muted-foreground mt-1">All customer bookings.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="px-6 py-4 border-b border-border font-heading font-bold text-foreground">Booking List</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Vehicle</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Duration</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id || b.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{b.userId?.name || "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">{b.userId?.email || ""}</div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {b.vehicleId?.name || "Vehicle"} ({b.vehicleId?.category || "-"})
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {b.startDate?.split("T")[0]} to {b.endDate?.split("T")[0]}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">INR {b.totalPrice}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-muted-foreground" colSpan={5}>
                    No bookings found.
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

export default AdminBookings;
