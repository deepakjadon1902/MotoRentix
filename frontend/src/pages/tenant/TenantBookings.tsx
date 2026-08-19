import { useCallback, useEffect, useState } from "react";
import { tenantApi, type TenantBooking } from "@/lib/tenantApi";
import { useStore } from "@/store/useStore";

const idOf = (item: TenantBooking) => item._id || item.id || "";

const TenantBookings = () => {
  const token = useStore((state) => state.token);
  const [bookings, setBookings] = useState<TenantBooking[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setBookings(await tenantApi.bookings(token));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (booking: TenantBooking, status: NonNullable<TenantBooking["status"]>) => {
    if (!token) return;
    try {
      await tenantApi.updateBookingStatus(token, idOf(booking), status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update booking");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Bookings</h1>
        <p className="text-muted-foreground mt-1">Review and update bookings for your rental company only.</p>
      </div>
      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left px-6 py-3">Customer</th>
                <th className="text-left px-6 py-3">Vehicle</th>
                <th className="text-left px-6 py-3">Duration</th>
                <th className="text-left px-6 py-3">Amount</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-right px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={idOf(booking)} className="border-t border-border">
                  <td className="px-6 py-4">{booking.customerId?.name || booking.userId?.name || "Customer"}</td>
                  <td className="px-6 py-4">{booking.vehicleId?.name || "Vehicle"}</td>
                  <td className="px-6 py-4">{booking.durationType}</td>
                  <td className="px-6 py-4">INR {booking.totalPrice || 0}</td>
                  <td className="px-6 py-4">{booking.status}</td>
                  <td className="px-6 py-4 text-right">
                    <select className="px-3 py-2 rounded-lg bg-secondary border border-border" value={booking.status} onChange={(e) => updateStatus(booking, e.target.value as NonNullable<TenantBooking["status"]>)}>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="rejected">Rejected</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && <tr><td className="px-6 py-6 text-muted-foreground" colSpan={6}>No bookings yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TenantBookings;
