import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bike,
  Building2,
  Calendar,
  CircleDot,
  IndianRupee,
  MapPin,
  Search,
  ShieldCheck,
  Store,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { optimizeImageUrl } from "@/lib/assetUrl";
import type { Vehicle } from "@/lib/types";
import { useAdminStore } from "@/store/adminStore";

type PopulatedTenant = Exclude<Vehicle["tenantId"], string | undefined>;
type PopulatedBranch = Exclude<Vehicle["branchId"], string | undefined>;

const getTenant = (vehicle: Vehicle): PopulatedTenant | null =>
  vehicle.tenantId && typeof vehicle.tenantId === "object" ? vehicle.tenantId : null;

const getBranch = (vehicle: Vehicle): PopulatedBranch | null =>
  vehicle.branchId && typeof vehicle.branchId === "object" ? vehicle.branchId : null;

const formatCurrency = (value?: number) => `INR ${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value?: string) => {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
};

const statusTone: Record<string, string> = {
  available: "bg-success/10 text-success border-success/20",
  booked: "bg-primary/10 text-primary border-primary/20",
  maintenance: "bg-accent/10 text-accent border-accent/20",
  disabled: "bg-destructive/10 text-destructive border-destructive/20",
};

const AdminVehicles = () => {
  const token = useAdminStore((state) => state.token);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | "bike" | "scooter">("all");
  const [availability, setAvailability] = useState<"all" | "available" | "unavailable">("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadVehicles = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await adminApi.listVehicles(token);
      setVehicles(data);
      setSelectedId((current) => current || data[0]?.id || null);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const filteredVehicles = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      const tenant = getTenant(vehicle);
      const branch = getBranch(vehicle);
      const searchable = [
        vehicle.name,
        vehicle.bikeNumber,
        vehicle.category,
        vehicle.status,
        tenant?.companyName,
        tenant?.ownerName,
        tenant?.email,
        branch?.name,
        branch?.city,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !needle || searchable.includes(needle);
      const matchesCategory = category === "all" || vehicle.category === category;
      const matchesAvailability =
        availability === "all" ||
        (availability === "available" && vehicle.availability) ||
        (availability === "unavailable" && !vehicle.availability);

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [availability, category, query, vehicles]);

  const selectedVehicle = useMemo(
    () => filteredVehicles.find((vehicle) => vehicle.id === selectedId) || filteredVehicles[0] || null,
    [filteredVehicles, selectedId],
  );

  const stats = useMemo(
    () => ({
      total: vehicles.length,
      bikes: vehicles.filter((vehicle) => vehicle.category === "bike").length,
      scooters: vehicles.filter((vehicle) => vehicle.category === "scooter").length,
      available: vehicles.filter((vehicle) => vehicle.availability).length,
    }),
    [vehicles],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Read-only fleet oversight</p>
          <h1 className="font-heading mt-2 text-3xl font-bold text-foreground">Listed Vehicles</h1>
          <p className="mt-1 max-w-3xl text-muted-foreground">
            Super admin can only view vehicles listed by tenant clients. Create, update, and delete actions stay inside
            the tenant owner dashboards.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-success">
          <ShieldCheck size={18} />
          View-only access
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { label: "Total listed", value: stats.total, icon: Bike },
          { label: "Bikes", value: stats.bikes, icon: CircleDot },
          { label: "Scooters", value: stats.scooters, icon: CircleDot },
          { label: "Available now", value: stats.available, icon: ShieldCheck },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-background p-5">
            <stat.icon className="text-primary" size={20} />
            <p className="mt-3 text-sm text-muted-foreground">{stat.label}</p>
            <p className="font-heading text-3xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-background p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
            <input
              className="w-full rounded-lg border border-border bg-secondary px-10 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Search by vehicle, registration, client, branch, or status..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select
            className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground"
            value={category}
            onChange={(event) => setCategory(event.target.value as typeof category)}
          >
            <option value="all">All categories</option>
            <option value="bike">Bikes</option>
            <option value="scooter">Scooters</option>
          </select>
          <select
            className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground"
            value={availability}
            onChange={(event) => setAvailability(event.target.value as typeof availability)}
          >
            <option value="all">All status</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-border bg-background p-6 text-muted-foreground">
              Loading listed vehicles...
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background p-10 text-center">
              <Bike className="mx-auto text-muted-foreground" size={34} />
              <h2 className="font-heading mt-4 text-xl font-bold text-foreground">No vehicles found</h2>
              <p className="mt-2 text-sm text-muted-foreground">No tenant listed vehicles match the current filters.</p>
            </div>
          ) : (
            filteredVehicles.map((vehicle) => {
              const tenant = getTenant(vehicle);
              const branch = getBranch(vehicle);
              const image = optimizeImageUrl(vehicle.image || vehicle.images?.[0], { width: 480, height: 300 });
              const active = selectedVehicle?.id === vehicle.id;

              return (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => setSelectedId(vehicle.id)}
                  className={`w-full rounded-2xl border bg-background p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${
                    active ? "border-primary shadow-md" : "border-border"
                  }`}
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[190px_1fr]">
                    <div className="aspect-[4/3] overflow-hidden rounded-xl border border-border bg-secondary">
                      {image ? (
                        <img src={image} alt={vehicle.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <Bike size={34} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-heading text-xl font-bold text-foreground">{vehicle.name}</h2>
                            <span className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">
                              {vehicle.category}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {vehicle.bikeNumber || "Registration number not added"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                            statusTone[vehicle.status || ""] ||
                            (vehicle.availability
                              ? "border-success/20 bg-success/10 text-success"
                              : "border-accent/20 bg-accent/10 text-accent")
                          }`}
                        >
                          {vehicle.status || (vehicle.availability ? "available" : "unavailable")}
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                        {vehicle.description || "No description provided by tenant."}
                      </p>

                      <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                        <div className="rounded-xl bg-secondary p-3">
                          <p className="text-xs text-muted-foreground">Client</p>
                          <p className="truncate font-medium text-foreground">{tenant?.companyName || "Unassigned"}</p>
                        </div>
                        <div className="rounded-xl bg-secondary p-3">
                          <p className="text-xs text-muted-foreground">Branch</p>
                          <p className="truncate font-medium text-foreground">{branch?.name || branch?.city || "Main branch"}</p>
                        </div>
                        <div className="rounded-xl bg-secondary p-3">
                          <p className="text-xs text-muted-foreground">Daily rent</p>
                          <p className="font-medium text-foreground">{formatCurrency(vehicle.pricePerDay)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-background p-5 xl:sticky xl:top-6">
          {selectedVehicle ? (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Vehicle Details</p>
                <h2 className="font-heading mt-2 text-2xl font-bold text-foreground">{selectedVehicle.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{selectedVehicle.bikeNumber || "No registration number"}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(selectedVehicle.images?.length ? selectedVehicle.images : [selectedVehicle.image]).filter(Boolean).slice(0, 3).map((url, index) => (
                  <div key={`${url}-${index}`} className="aspect-square overflow-hidden rounded-xl border border-border bg-secondary">
                    <img
                      src={optimizeImageUrl(url, { width: 220, height: 220 })}
                      alt={`${selectedVehicle.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: "Hourly rent", value: formatCurrency(selectedVehicle.pricePerHour), icon: IndianRupee },
                  { label: "Daily rent", value: formatCurrency(selectedVehicle.pricePerDay), icon: IndianRupee },
                  { label: "Weekly rent", value: formatCurrency(selectedVehicle.pricePerWeek), icon: IndianRupee },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <item.icon size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="font-semibold text-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 rounded-xl border border-border p-4 text-sm">
                <DetailRow icon={Store} label="Client company" value={getTenant(selectedVehicle)?.companyName || "Unassigned"} />
                <DetailRow icon={Building2} label="Owner" value={getTenant(selectedVehicle)?.ownerName || "Not available"} />
                <DetailRow icon={MapPin} label="Branch" value={getBranch(selectedVehicle)?.name || getBranch(selectedVehicle)?.city || "Main branch"} />
                <DetailRow icon={Calendar} label="Listed on" value={formatDate(selectedVehicle.createdAt)} />
              </div>

              <div className="rounded-xl bg-secondary p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Description</p>
                <p className="mt-2 text-sm leading-6 text-foreground">
                  {selectedVehicle.description || "No detailed description has been added by the tenant owner."}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">Select a vehicle to view complete details.</div>
          )}
        </aside>
      </div>
    </div>
  );
};

const DetailRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Store;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-3">
    <Icon className="text-muted-foreground" size={17} />
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate font-medium text-foreground">{value}</p>
    </div>
  </div>
);

export default AdminVehicles;
