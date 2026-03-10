import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import type { Vehicle } from "@/lib/types";

const AdminVehiclesDetail = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await adminApi.listVehicles();
      setVehicles(data);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load vehicles");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
              {vehicles.map((v) => (
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
    </div>
  );
};

export default AdminVehiclesDetail;
