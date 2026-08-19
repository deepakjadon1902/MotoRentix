import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bike,
  Calendar,
  CheckCircle2,
  ImagePlus,
  IndianRupee,
  MapPin,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Store,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { adminApi, type AdminVehiclePayload } from "@/lib/adminApi";
import { optimizeImageUrl } from "@/lib/assetUrl";
import type { Vehicle, VehicleCategory } from "@/lib/types";
import { useAdminStore } from "@/store/adminStore";

type PopulatedBranch = Exclude<Vehicle["branchId"], string | undefined>;

type VehicleForm = AdminVehiclePayload;

const emptyForm: VehicleForm = {
  branchId: "",
  name: "",
  bikeNumber: "",
  category: "bike",
  description: "",
  image: "",
  images: [],
  imageFiles: [],
  features: ["Helmet available", "Sanitized before pickup", "Verified documents"],
  engineNumber: "",
  chassisNumber: "",
  pricePerHour: 100,
  pricePerDay: 500,
  pricePerWeek: 2500,
  pricePerMonth: 9000,
  securityDeposit: 1000,
  availability: true,
  status: "available",
};

const categories: Array<{ value: VehicleCategory; label: string }> = [
  { value: "bike", label: "Bike" },
  { value: "scooter", label: "Scooter" },
  { value: "electric_bike", label: "Electric bike / scooter" },
];

type CategoryFilter = "all" | "bike" | "scooter" | "electric";

const categoryLabel = (category?: string) =>
  category === "electric_bike" || category === "electric_scooter"
    ? "Electric"
    : category || "bike";

const categoryMatches = (filter: CategoryFilter, category?: VehicleCategory) =>
  filter === "all" ||
  category === filter ||
  (filter === "electric" && (category === "electric_bike" || category === "electric_scooter"));

const statusOptions: Array<NonNullable<Vehicle["status"]>> = ["available", "booked", "maintenance", "disabled"];

const getBranch = (vehicle: Vehicle): PopulatedBranch | null =>
  vehicle.branchId && typeof vehicle.branchId === "object" ? vehicle.branchId : null;

const itemId = (item?: { _id?: string; id?: string } | string) =>
  typeof item === "string" ? item : item?._id || item?.id || "";

const formatCurrency = (value?: number) => `INR ${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value?: string) => {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
};

const statusTone: Record<string, string> = {
  available: "bg-success/10 text-success border-success/20",
  booked: "bg-primary/10 text-primary border-primary/20",
  maintenance: "bg-warning/10 text-warning border-warning/20",
  disabled: "bg-destructive/10 text-destructive border-destructive/20",
  archived: "bg-muted text-muted-foreground border-border",
};

const AdminVehicles = () => {
  const token = useAdminStore((state) => state.token);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState<VehicleForm>(emptyForm);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [editingId, setEditingId] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [availability, setAvailability] = useState<"all" | "available" | "unavailable">("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const vehicleData = await adminApi.listVehicles(token);
      setVehicles(vehicleData.filter((vehicle) => vehicle.status !== "archived"));
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load vehicle management data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [selectedFiles]);

  const persistedGallery = form.images?.length ? form.images : form.image ? [form.image] : [];
  const visibleGallery = [...persistedGallery, ...previewUrls].slice(0, 10);

  const heroPreview = optimizeImageUrl(visibleGallery[0], { width: 900, height: 620, quality: 78 });

  const filteredVehicles = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      const branch = getBranch(vehicle);
      const searchable = [
        vehicle.name,
        vehicle.bikeNumber,
        vehicle.category,
        vehicle.status,
        branch?.name,
        branch?.city,
      ].filter(Boolean).join(" ").toLowerCase();

      const matchesSearch = !needle || searchable.includes(needle);
      const matchesCategory = categoryMatches(category, vehicle.category);
      const matchesAvailability =
        availability === "all" ||
        (availability === "available" && vehicle.availability) ||
        (availability === "unavailable" && !vehicle.availability);

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [availability, category, query, vehicles]);

  const stats = useMemo(
    () => ({
      total: vehicles.length,
      bikes: vehicles.filter((vehicle) => vehicle.category === "bike").length,
      scooters: vehicles.filter((vehicle) => vehicle.category === "scooter").length,
      electric: vehicles.filter((vehicle) => vehicle.category === "electric_bike" || vehicle.category === "electric_scooter").length,
      available: vehicles.filter((vehicle) => vehicle.availability).length,
    }),
    [vehicles],
  );

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedFiles([]);
    setEditingId("");
    setError("");
  };

  const onFiles = (files: FileList | null) => {
    const images = [...selectedFiles, ...Array.from(files || []).filter((file) => file.type.startsWith("image/"))].slice(0, 10);
    setSelectedFiles(images);
  };

  const removeNewImage = (index: number) => {
    setSelectedFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateFeature = (index: number, value: string) => {
    setForm((current) => {
      const next = [...(current.features || [])];
      next[index] = value;
      return { ...current, features: next };
    });
  };

  const addFeature = () => setForm((current) => ({ ...current, features: [...(current.features || []), ""] }));

  const removeFeature = (index: number) => {
    setForm((current) => ({ ...current, features: (current.features || []).filter((_, itemIndex) => itemIndex !== index) }));
  };

  const save = async () => {
    if (!token) return;
    if (!form.name.trim() || !form.category || !form.pricePerHour || !form.pricePerDay) {
      setError("Name, category, hourly price, and daily price are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        imageFiles: selectedFiles,
        features: (form.features || []).map((item) => item.trim()).filter(Boolean),
        availability: form.status === "available" ? true : Boolean(form.availability),
      };
      if (editingId) {
        await adminApi.updateVehicle(token, editingId, payload);
        toast.success("Vehicle updated");
      } else {
        await adminApi.createVehicle(token, payload);
        toast.success("Vehicle created");
      }
      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save vehicle");
    } finally {
      setSaving(false);
    }
  };

  const edit = (vehicle: Vehicle) => {
    setEditingId(vehicle.id);
    setSelectedFiles([]);
    setForm({
      ...emptyForm,
      branchId: itemId(vehicle.branchId),
      name: vehicle.name || "",
      bikeNumber: vehicle.bikeNumber || "",
      category: vehicle.category || "bike",
      description: vehicle.description || "",
      image: vehicle.image || "",
      images: vehicle.images || (vehicle.image ? [vehicle.image] : []),
      features: vehicle.features?.length ? vehicle.features : emptyForm.features,
      engineNumber: vehicle.engineNumber || "",
      chassisNumber: vehicle.chassisNumber || "",
      pricePerHour: vehicle.pricePerHour || 0,
      pricePerDay: vehicle.pricePerDay || 0,
      pricePerWeek: vehicle.pricePerWeek || 0,
      pricePerMonth: vehicle.pricePerMonth || 0,
      securityDeposit: vehicle.securityDeposit || 0,
      availability: vehicle.availability,
      status: vehicle.status || (vehicle.availability ? "available" : "disabled"),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (vehicle: Vehicle) => {
    if (vehicle.status === "archived") {
      toast.info("This vehicle is already archived");
      return;
    }
    if (!token || !confirm(`Delete ${vehicle.name}? Vehicles with booking history will be archived instead.`)) return;
    try {
      const result = await adminApi.deleteVehicle(token, vehicle.id);
      toast.success(result.message);
      if (editingId === vehicle.id) resetForm();
      setVehicles((current) => current.filter((item) => item.id !== vehicle.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete vehicle");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Fleet CRUD control</p>
          <h1 className="font-heading mt-2 text-3xl font-bold text-foreground">Manage Vehicles</h1>
          <p className="mt-1 max-w-3xl text-muted-foreground">
            Create, edit, archive, delete, and price every MotoRentix vehicle from one admin workspace.
          </p>
        </div>
        <button onClick={resetForm} className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
          <Plus size={17} />
          New vehicle
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {[
          { label: "Total listed", value: stats.total, icon: Bike },
          { label: "Bike inventory", value: stats.bikes, icon: Bike },
          { label: "Scooter inventory", value: stats.scooters, icon: Store },
          { label: "Electric", value: stats.electric, icon: ShieldCheck },
          { label: "Available now", value: stats.available, icon: ShieldCheck },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-background p-5">
            <stat.icon className="text-primary" size={20} />
            <p className="mt-3 text-sm text-muted-foreground">{stat.label}</p>
            <p className="font-heading text-3xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[440px_1fr]">
        <section className="h-fit overflow-hidden rounded-lg border border-border bg-background">
          <div className="flex items-start justify-between gap-3 border-b border-border p-5">
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground">{editingId ? "Edit Vehicle" : "Create Vehicle"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage category, pricing, photos, availability, and marketplace status.
              </p>
            </div>
            {editingId && (
              <button onClick={resetForm} className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground" aria-label="Cancel editing">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="space-y-5 p-5">
            <div className="overflow-hidden rounded-lg border border-border bg-secondary">
              <div className="relative h-52">
                {heroPreview ? (
                  <img src={heroPreview} alt={form.name || "Vehicle preview"} className="h-full w-full object-cover" />
                ) : (
                  <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-3 text-muted-foreground">
                    <UploadCloud size={34} />
                    <span className="text-sm font-medium">Upload vehicle photos</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => onFiles(event.target.files)} />
                  </label>
                )}
                <label className="absolute bottom-3 right-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-background/90 px-3 py-2 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
                  <ImagePlus size={15} />
                  Images
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => onFiles(event.target.files)} />
                </label>
              </div>
              {(visibleGallery.length > 0 || selectedFiles.length > 0) && (
                <div className="grid grid-cols-5 gap-2 p-3">
                  {visibleGallery.slice(0, 10).map((url, index) => (
                    <div key={`${url}-${index}`} className="group relative aspect-square overflow-hidden rounded-md border border-border bg-background">
                      <img src={optimizeImageUrl(url, { width: 180, height: 180, quality: 72 })} alt={`Gallery ${index + 1}`} className="h-full w-full object-cover" />
                      {index >= persistedGallery.length && (
                        <button
                          type="button"
                          onClick={() => removeNewImage(index - persistedGallery.length)}
                          className="absolute right-1 top-1 hidden rounded bg-background/90 p-1 text-destructive shadow-sm group-hover:block"
                          aria-label="Remove image"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <input className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm" placeholder="Vehicle name, e.g. Honda Activa 6G" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <input className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm" placeholder="Registration / fleet number" value={form.bikeNumber || ""} onChange={(e) => setForm((f) => ({ ...f, bikeNumber: e.target.value }))} />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <select className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as VehicleCategory }))}>
                  {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <select
                  className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm"
                  value={form.status || "available"}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as NonNullable<Vehicle["status"]>, availability: e.target.value === "available" }))}
                >
                  {statusOptions.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm" placeholder="Engine number" value={form.engineNumber || ""} onChange={(e) => setForm((f) => ({ ...f, engineNumber: e.target.value }))} />
                <input className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm" placeholder="Chassis number" value={form.chassisNumber || ""} onChange={(e) => setForm((f) => ({ ...f, chassisNumber: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {([
                  ["Hour", "pricePerHour"],
                  ["Day", "pricePerDay"],
                  ["Week", "pricePerWeek"],
                  ["Month", "pricePerMonth"],
                  ["Deposit", "securityDeposit"],
                ] as Array<[string, keyof VehicleForm]>).map(([label, key]) => (
                  <label key={key} className="space-y-1 text-xs text-muted-foreground">
                    {label}
                    <input
                      className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground"
                      type="number"
                      value={Number(form[key] || 0)}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: Number(e.target.value) }))}
                    />
                  </label>
                ))}
              </div>

              <textarea className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm" rows={4} placeholder="Customer-facing description, condition, pickup notes, helmet info..." value={form.description || ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-heading text-lg font-bold text-foreground">Listing features</h3>
                <button type="button" onClick={addFeature} className="text-sm font-semibold text-primary">Add feature</button>
              </div>
              <div className="space-y-2">
                {(form.features || []).map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <input className="flex-1 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm" value={feature} onChange={(event) => updateFeature(index, event.target.value)} placeholder="Feature, e.g. Sanitized before pickup" />
                    <button type="button" onClick={() => removeFeature(index)} className="rounded-lg border border-border px-3 text-muted-foreground hover:text-destructive">
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={save} disabled={saving} className="btn-primary-gradient w-full rounded-lg px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50">
              {saving ? "Saving..." : editingId ? "Save Vehicle Changes" : "Create Vehicle"}
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_190px_170px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                <input className="w-full rounded-lg border border-border bg-secondary px-10 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Search by vehicle, registration, branch, or status..." value={query} onChange={(event) => setQuery(event.target.value)} />
              </div>
              <select className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground" value={category} onChange={(event) => setCategory(event.target.value as typeof category)}>
                <option value="all">All categories</option>
                <option value="bike">Bike</option>
                <option value="scooter">Scooter</option>
                <option value="electric">Electric bike / scooter</option>
              </select>
              <select className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground" value={availability} onChange={(event) => setAvailability(event.target.value as typeof availability)}>
                <option value="all">All status</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="rounded-lg border border-border bg-background p-6 text-muted-foreground">Loading vehicles...</div>
          ) : filteredVehicles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-background p-10 text-center">
              <Bike className="mx-auto text-muted-foreground" size={34} />
              <h2 className="font-heading mt-4 text-xl font-bold text-foreground">No vehicles found</h2>
              <p className="mt-2 text-sm text-muted-foreground">No vehicles match the current filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {filteredVehicles.map((vehicle) => {
                const branch = getBranch(vehicle);
                const gallery = vehicle.images?.length ? vehicle.images : vehicle.image ? [vehicle.image] : [];
                const image = optimizeImageUrl(gallery[0], { width: 720, height: 480, quality: 78 });
                const currentStatus = vehicle.status || (vehicle.availability ? "available" : "disabled");

                return (
                  <article key={vehicle.id} className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
                    <div className="relative aspect-[16/10] bg-secondary">
                      {image ? (
                        <img src={image} alt={vehicle.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <Bike size={34} />
                        </div>
                      )}
                      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                        <span className="rounded-md bg-background/90 px-3 py-1 text-xs font-medium capitalize text-foreground">{categoryLabel(vehicle.category)}</span>
                        <span className={`rounded-md border px-3 py-1 text-xs font-semibold capitalize ${statusTone[currentStatus] || statusTone.disabled}`}>
                          {currentStatus}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3 rounded-md bg-background/90 px-3 py-1 text-xs font-semibold text-foreground">
                        {gallery.length} photos
                      </div>
                    </div>

                    <div className="space-y-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate font-heading text-xl font-bold text-foreground">{vehicle.name}</h2>
                          <p className="mt-1 text-sm text-muted-foreground">{vehicle.bikeNumber || "Registration number not added"}</p>
                        </div>
                      </div>

                      <p className="line-clamp-2 text-sm text-muted-foreground">{vehicle.description || "No description provided."}</p>

                      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                        <DetailRow icon={MapPin} label="Branch" value={branch?.name || branch?.city || "Main branch"} />
                        <DetailRow icon={Calendar} label="Listed" value={formatDate(vehicle.createdAt)} />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {([
                          ["Hour", vehicle.pricePerHour],
                          ["Day", vehicle.pricePerDay],
                          ["Week", vehicle.pricePerWeek],
                        ] as [string, number | undefined][]).map(([label, value]) => (
                          <div key={label} className="rounded-lg bg-secondary p-3">
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className="font-heading text-sm font-bold text-foreground">{formatCurrency(value)}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(vehicle.features || []).slice(0, 3).map((feature) => (
                          <span key={feature} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
                            <CheckCircle2 size={12} className="text-success" />
                            {feature}
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => edit(vehicle)} className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary">
                          <Pencil className="mr-2 inline" size={15} /> Edit
                        </button>
                        <button onClick={() => remove(vehicle)} className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground" aria-label={`Delete ${vehicle.name}`}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
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
  <div className="flex min-w-0 items-center gap-3 rounded-lg bg-secondary p-3">
    <Icon className="text-muted-foreground" size={17} />
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate font-medium text-foreground">{value}</p>
    </div>
  </div>
);

export default AdminVehicles;
