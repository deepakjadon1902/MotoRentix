import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import type { Vehicle } from "@/lib/types";
import { useAdminStore } from "@/store/adminStore";
import AdminPagination from "@/components/admin/AdminPagination";

const PAGE_SIZE = 10;

const AdminVehiclesDetail = () => {
  const token = useAdminStore((state) => state.token);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await adminApi.listVehicles(token);
      setVehicles(data);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load vehicles");
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const pagedVehicles = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return vehicles.slice(start, start + PAGE_SIZE);
  }, [page, vehicles]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(vehicles.length / PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
  }, [page, vehicles.length]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">All Vehicles</h1>
        <p className="text-muted-foreground mt-1">Full list of bikes and scooters.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="px-6 py-4 border-b border-border font-heading font-bold text-foreground">Vehicles</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Category</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Price/Hour</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Price/Day</th>
              </tr>
            </thead>
            <tbody>
              {pagedVehicles.map((v) => (
                <tr key={v.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="px-6 py-4 font-medium text-foreground">{v.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{v.category}</td>
                  <td className="px-6 py-4 text-muted-foreground">INR {v.pricePerHour}</td>
                  <td className="px-6 py-4 text-muted-foreground">INR {v.pricePerDay}</td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-muted-foreground" colSpan={4}>
                    No vehicles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <AdminPagination page={page} total={vehicles.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
};

export default AdminVehiclesDetail;
