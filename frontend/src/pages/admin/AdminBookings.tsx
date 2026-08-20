import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi, type AdminBooking } from "@/lib/adminApi";
import { useAdminStore } from "@/store/adminStore";
import AdminPagination from "@/components/admin/AdminPagination";

const PAGE_SIZE = 10;

const AdminBookings = () => {
  const token = useAdminStore((s) => s.token);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

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

  const updateStatus = async (bookingId: string, status: "pending" | "confirmed" | "rejected" | "completed") => {
    if (!token) return;
    setUpdatingId(bookingId);
    try {
      await adminApi.updateBookingStatus(token, bookingId, status);
      setBookings((prev) =>
        prev.map((b) => ((b._id || b.id) === bookingId ? { ...b, status } : b)),
      );
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update booking status");
    } finally {
      setUpdatingId(null);
    }
  };

  const pagedBookings = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return bookings.slice(start, start + PAGE_SIZE);
  }, [bookings, page]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(bookings.length / PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
  }, [bookings.length, page]);

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

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="px-6 py-4 border-b border-border font-heading font-bold text-foreground">Booking List</div>
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Contact</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Vehicle</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Duration</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-6 py-3 font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedBookings.map((b) => (
                <tr key={b._id || b.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{b.userId?.name || "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">{b.userId?.email || ""}</div>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    <div>{b.userId?.phone || "-"}</div>
                    <div className="mt-1">
                      {(b.userId?.address || b.userId?.city || b.userId?.pincode)
                        ? `${b.userId?.address || ""}${b.userId?.city ? `, ${b.userId.city}` : ""}${b.userId?.pincode ? ` - ${b.userId.pincode}` : ""}`
                        : "-"}
                    </div>
                    <div className="mt-1">Aadhaar: {b.userId?.aadhaarNumber || "-"}</div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {b.vehicleId?.name || "Vehicle"} ({b.vehicleId?.category || "-"})
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {b.startDate?.split("T")[0]} to {b.endDate?.split("T")[0]}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">INR {b.totalPrice}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        b.status === "confirmed"
                          ? "bg-primary/10 text-primary"
                          : b.status === "completed"
                            ? "bg-success/10 text-success"
                            : b.status === "rejected"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-accent/10 text-accent"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <select
                      value={b.status || "pending"}
                      onChange={(e) => updateStatus((b._id || b.id) as string, e.target.value as "pending" | "confirmed" | "rejected" | "completed")}
                      disabled={((!b._id && !b.id) || updatingId === (b._id || b.id))}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-50"
                    >
                      <option value="pending">pending</option>
                      <option value="confirmed">confirmed</option>
                      <option value="rejected">rejected</option>
                      <option value="completed">completed</option>
                    </select>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-muted-foreground" colSpan={7}>
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-border lg:hidden">
          {pagedBookings.map((b) => (
            <article key={b._id || b.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-foreground">{b.vehicleId?.name || "Vehicle"}</p>
                  <p className="truncate text-xs text-muted-foreground">{b.userId?.name || "Unknown"} - {b.userId?.email || ""}</p>
                </div>
                <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-bold text-foreground">{b.status || "pending"}</span>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                <p>Phone: <span className="font-semibold text-foreground">{b.userId?.phone || "-"}</span></p>
                <p>Duration: <span className="font-semibold text-foreground">{b.startDate?.split("T")[0]} to {b.endDate?.split("T")[0]}</span></p>
                <p>Total: <span className="font-semibold text-foreground">INR {b.totalPrice}</span></p>
                <p>Aadhaar: <span className="font-semibold text-foreground">{b.userId?.aadhaarNumber || "-"}</span></p>
              </div>
              <select
                value={b.status || "pending"}
                onChange={(e) => updateStatus((b._id || b.id) as string, e.target.value as "pending" | "confirmed" | "rejected" | "completed")}
                disabled={((!b._id && !b.id) || updatingId === (b._id || b.id))}
                className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-50"
              >
                <option value="pending">pending</option>
                <option value="confirmed">confirmed</option>
                <option value="rejected">rejected</option>
                <option value="completed">completed</option>
              </select>
            </article>
          ))}
          {bookings.length === 0 && <div className="p-6 text-sm text-muted-foreground">No bookings found.</div>}
        </div>
      </div>

      <AdminPagination page={page} total={bookings.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
};

export default AdminBookings;
