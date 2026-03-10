import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import { useAdminStore } from "@/store/adminStore";
import type { Vehicle } from "@/lib/types";

type VehicleForm = Omit<Vehicle, "id">;

const emptyForm: VehicleForm = {
  name: "",
  category: "bike",
  description: "",
  image: "",
  pricePerHour: 0,
  pricePerDay: 0,
  availability: true,
};

const AdminVehicles = () => {
  const token = useAdminStore((s) => s.token);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState<VehicleForm>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const canSubmit = useMemo(() => form.name && form.pricePerHour > 0 && form.pricePerDay > 0, [form]);

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listVehicles();
      setVehicles(data);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const submit = async () => {
    if (!token) return;
    try {
      if (editingId) {
        await adminApi.updateVehicle(token, editingId, { ...form, imageFile });
      } else {
        await adminApi.addVehicle(token, { ...form, imageFile });
      }
      setForm(emptyForm);
      setImageFile(null);
      setEditingId(null);
      await loadVehicles();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save vehicle");
    }
  };

  const onEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setForm({
      name: v.name,
      category: v.category,
      description: v.description || "",
      image: v.image || "",
      pricePerHour: v.pricePerHour,
      pricePerDay: v.pricePerDay,
      availability: v.availability,
    });
    setImageFile(null);
  };

  const onDelete = async (id: string) => {
    if (!token) return;
    if (!confirm("Delete this vehicle?")) return;
    try {
      await adminApi.deleteVehicle(token, id);
      await loadVehicles();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete vehicle");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Vehicles</h1>
        <p className="text-muted-foreground mt-1">Add, edit, or remove vehicles.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-background p-6 space-y-4">
        <h2 className="font-heading text-xl font-bold text-foreground">
          {editingId ? "Edit Vehicle" : "Add Vehicle"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            className="w-full px-4 py-3 rounded-lg bg-secondary text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <select
            className="w-full px-4 py-3 rounded-lg bg-secondary text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as "bike" | "scooter" }))}
          >
            <option value="bike">Bike</option>
            <option value="scooter">Scooter</option>
          </select>
          <input
            className="w-full px-4 py-3 rounded-lg bg-secondary text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
          <input
            className="w-full px-4 py-3 rounded-lg bg-secondary text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            placeholder="Price Per Hour"
            type="number"
            value={form.pricePerHour}
            onChange={(e) => setForm((f) => ({ ...f, pricePerHour: Number(e.target.value) }))}
          />
          <input
            className="w-full px-4 py-3 rounded-lg bg-secondary text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            placeholder="Price Per Day"
            type="number"
            value={form.pricePerDay}
            onChange={(e) => setForm((f) => ({ ...f, pricePerDay: Number(e.target.value) }))}
          />
          <select
            className="w-full px-4 py-3 rounded-lg bg-secondary text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            value={form.availability ? "true" : "false"}
            onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value === "true" }))}
          >
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
        </div>
        <textarea
          className="w-full px-4 py-3 rounded-lg bg-secondary text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          rows={3}
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        {form.image && !imageFile && (
          <p className="text-xs text-muted-foreground">Current image: {form.image}</p>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={submit}
            disabled={!canSubmit || !token}
            className="btn-primary-gradient px-5 py-2 rounded-lg text-primary-foreground font-semibold disabled:opacity-50"
          >
            {editingId ? "Update Vehicle" : "Add Vehicle"}
          </button>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
                setImageFile(null);
              }}
              className="px-5 py-2 rounded-lg border border-border text-foreground"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background">
        <div className="px-6 py-4 border-b border-border font-heading font-bold text-foreground">Vehicle List</div>
        <div className="p-6">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-3">
              {vehicles.map((v) => (
                <div key={v.id} className="flex flex-col md:flex-row md:items-center gap-3 border border-border rounded-xl p-4">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{v.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.category} · INR {v.pricePerHour}/hr · INR {v.pricePerDay}/day
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onEdit(v)} className="px-4 py-2 rounded-lg border border-border text-foreground">
                      Edit
                    </button>
                    <button onClick={() => onDelete(v.id)} className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {vehicles.length === 0 && <p className="text-muted-foreground">No vehicles found.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminVehicles;
