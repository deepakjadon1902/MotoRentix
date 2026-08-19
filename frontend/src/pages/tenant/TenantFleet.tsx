import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bike,
  CalendarCheck,
  CheckCircle2,
  ImagePlus,
  IndianRupee,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import { tenantApi, type TenantVehicle } from "@/lib/tenantApi";
import { optimizeImageUrl } from "@/lib/assetUrl";
import { useStore } from "@/store/useStore";

const emptyForm: TenantVehicle = {
  name: "",
  bikeNumber: "",
  category: "bike",
  description: "",
  images: [],
  imageFiles: [],
  features: ["Helmet available", "Sanitized before pickup", "Verified documents"],
  pricePerHour: 100,
  pricePerDay: 500,
  pricePerWeek: 2500,
  pricePerMonth: 9000,
  securityDeposit: 1000,
  availability: true,
  status: "available",
};

const categories = [
  { value: "bike", label: "Bike" },
  { value: "scooter", label: "Scooter" },
  { value: "electric_bike", label: "Electric Bike" },
  { value: "electric_scooter", label: "Electric Scooter" },
] as const;

const idOf = (item: TenantVehicle) => item._id || item.id || "";

const TenantFleet = () => {
  const token = useStore((state) => state.token);
  const [vehicles, setVehicles] = useState<TenantVehicle[]>([]);
  const [form, setForm] = useState<TenantVehicle>(emptyForm);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [editingId, setEditingId] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | TenantVehicle["category"]>("all");
  const [availability, setAvailability] = useState<"all" | "available" | "unavailable">("all");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setVehicles(await tenantApi.vehicles(token));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fleet");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [selectedFiles]);

  const visibleGallery = previewUrls.length > 0
    ? previewUrls
    : form.images?.length
      ? form.images
      : form.image
        ? [form.image]
        : [];

  const heroPreview = optimizeImageUrl(visibleGallery[0], { width: 900, height: 620, quality: 78 });

  const stats = useMemo(
    () => ({
      total: vehicles.length,
      bikes: vehicles.filter((vehicle) => vehicle.category === "bike" || vehicle.category === "electric_bike").length,
      scooters: vehicles.filter((vehicle) => vehicle.category === "scooter" || vehicle.category === "electric_scooter").length,
      available: vehicles.filter((vehicle) => vehicle.availability).length,
    }),
    [vehicles],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      const matchesQuery =
        !needle ||
        vehicle.name?.toLowerCase().includes(needle) ||
        vehicle.bikeNumber?.toLowerCase().includes(needle) ||
        vehicle.category?.toLowerCase().includes(needle);
      const matchesCategory = category === "all" || vehicle.category === category;
      const matchesAvailability =
        availability === "all" ||
        (availability === "available" && vehicle.availability) ||
        (availability === "unavailable" && !vehicle.availability);
      return matchesQuery && matchesCategory && matchesAvailability;
    });
  }, [availability, category, query, vehicles]);

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedFiles([]);
    setEditingId("");
  };

  const onFiles = (files: FileList | null) => {
    const images = Array.from(files || []).filter((file) => file.type.startsWith("image/")).slice(0, 10);
    setSelectedFiles(images);
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
    if (!form.name?.trim() || !form.category || !form.pricePerHour || !form.pricePerDay) {
      setError("Name, category, hourly price, and daily price are required");
      return;
    }
    if (!editingId && selectedFiles.length === 0) {
      setError("Please upload at least one vehicle image from your device");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        imageFiles: selectedFiles,
        features: (form.features || []).map((item) => item.trim()).filter(Boolean),
        availability: Boolean(form.availability),
        status: form.availability ? "available" : "disabled",
      };
      if (editingId) {
        await tenantApi.updateVehicle(token, editingId, payload);
      } else {
        await tenantApi.addVehicle(token, payload);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save vehicle");
    } finally {
      setSaving(false);
    }
  };

  const edit = (vehicle: TenantVehicle) => {
    setEditingId(idOf(vehicle));
    setSelectedFiles([]);
    setForm({
      ...emptyForm,
      ...vehicle,
      images: vehicle.images || (vehicle.image ? [vehicle.image] : []),
      features: vehicle.features?.length ? vehicle.features : emptyForm.features,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (vehicle: TenantVehicle) => {
    if (!token || !confirm("Delete this vehicle listing?")) return;
    try {
      await tenantApi.deleteVehicle(token, idOf(vehicle));
      if (editingId === idOf(vehicle)) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete vehicle");
    }
  };

  return (
    <div className="space-y-6">
      <div className="dashboard-surface p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Marketplace listing studio</p>
            <h1 className="font-heading mt-2 text-3xl font-bold text-foreground">Bikes & Scooters</h1>
            <p className="mt-1 max-w-3xl text-muted-foreground">
              Create rich customer-facing listings with multi-image galleries, pricing, features, registration details, and publishing status.
            </p>
          </div>
          <button onClick={resetForm} className="w-fit rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary">
            New Vehicle
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { label: "Total fleet", value: stats.total, icon: CalendarCheck },
          { label: "Bikes", value: stats.bikes, icon: Bike },
          { label: "Scooters", value: stats.scooters, icon: Zap },
          { label: "Available", value: stats.available, icon: ShieldCheck },
        ].map((stat) => (
          <div key={stat.label} className="premium-card p-5">
            <stat.icon className="text-primary" size={22} />
            <p className="mt-3 text-sm text-muted-foreground">{stat.label}</p>
            <p className="font-heading text-3xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[520px_1fr]">
        <section className="dashboard-surface h-fit overflow-hidden">
          <div className="border-b border-border p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground">{editingId ? "Edit Listing" : "Create Listing"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {editingId ? "Update the public marketplace details." : "Build a premium listing customers can trust."}
                </p>
              </div>
              {editingId && (
                <button onClick={resetForm} className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground" aria-label="Cancel editing">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6 p-5">
            <div className="overflow-hidden rounded-2xl border border-border bg-secondary">
              <div className="relative aspect-[16/10]">
                {heroPreview ? (
                  <img src={heroPreview} alt={form.name || "Vehicle preview"} className="h-full w-full object-cover" />
                ) : (
                  <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-3 text-muted-foreground">
                    <UploadCloud size={34} />
                    <span className="text-sm font-medium">Browse vehicle images from device</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => onFiles(event.target.files)} />
                  </label>
                )}
                <label className="absolute bottom-3 right-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-background/90 px-3 py-2 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
                  <ImagePlus size={15} />
                  Upload images
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => onFiles(event.target.files)} />
                </label>
              </div>
              {visibleGallery.length > 0 && (
                <div className="grid grid-cols-5 gap-2 p-3">
                  {visibleGallery.slice(0, 10).map((url, index) => (
                    <div key={`${url}-${index}`} className="aspect-square overflow-hidden rounded-lg border border-border bg-background">
                      <img src={optimizeImageUrl(url, { width: 180, height: 180, quality: 72 })} alt={`Gallery ${index + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <input className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm" placeholder="Vehicle name, e.g. Royal Enfield Classic 350" value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <input className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm" placeholder="Registration / fleet number" value={form.bikeNumber || ""} onChange={(e) => setForm((f) => ({ ...f, bikeNumber: e.target.value }))} />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <select className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as TenantVehicle["category"] }))}>
                  {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <select className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm" value={String(form.availability)} onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value === "true" }))}>
                  <option value="true">Publish as available</option>
                  <option value="false">Keep unavailable</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm" placeholder="Engine number" value={form.engineNumber || ""} onChange={(e) => setForm((f) => ({ ...f, engineNumber: e.target.value }))} />
                <input className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm" placeholder="Chassis number" value={form.chassisNumber || ""} onChange={(e) => setForm((f) => ({ ...f, chassisNumber: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {[
                  ["Hour", "pricePerHour"],
                  ["Day", "pricePerDay"],
                  ["Week", "pricePerWeek"],
                  ["Month", "pricePerMonth"],
                  ["Deposit", "securityDeposit"],
                ].map(([label, key]) => (
                  <label key={key} className="space-y-1 text-xs text-muted-foreground">
                    {label}
                    <input
                      className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground"
                      type="number"
                      value={Number(form[key as keyof TenantVehicle] || 0)}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: Number(e.target.value) }))}
                    />
                  </label>
                ))}
              </div>

              <textarea className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm" rows={4} placeholder="Customer-facing description, condition, pickup notes, helmets, mileage, etc." value={form.description || ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-heading text-lg font-bold text-foreground">Listing features</h3>
                <button type="button" onClick={addFeature} className="text-sm font-semibold text-primary">Add feature</button>
              </div>
              <div className="space-y-2">
                {(form.features || []).map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <input className="flex-1 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm" value={feature} onChange={(event) => updateFeature(index, event.target.value)} placeholder="Feature, e.g. Bluetooth helmet available" />
                    <button type="button" onClick={() => removeFeature(index)} className="rounded-lg border border-border px-3 text-muted-foreground hover:text-destructive">
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={save} disabled={saving} className="btn-primary-gradient w-full rounded-lg px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50">
              {saving ? "Saving..." : editingId ? "Save Listing Changes" : "Publish Vehicle Listing"}
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="dashboard-surface p-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_190px_170px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                <input className="w-full rounded-lg border border-border bg-secondary px-10 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Search by name, registration, category..." value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <select className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground" value={category || "all"} onChange={(e) => setCategory(e.target.value as typeof category)}>
                <option value="all">All categories</option>
                {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <select className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground" value={availability} onChange={(e) => setAvailability(e.target.value as typeof availability)}>
                <option value="all">All status</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="dashboard-surface p-6 text-muted-foreground">Loading fleet...</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {filtered.map((vehicle) => {
                const gallery = vehicle.images?.length ? vehicle.images : vehicle.image ? [vehicle.image] : [];
                const image = optimizeImageUrl(gallery[0], { width: 720, height: 480, quality: 78 });
                return (
                  <article key={idOf(vehicle)} className="premium-card overflow-hidden">
                    <div className="relative aspect-[16/10] bg-secondary">
                      {image ? <img src={image} alt={vehicle.name || "Vehicle"} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>}
                      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-medium capitalize text-foreground">{vehicle.category?.replace("_", " ")}</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${vehicle.availability ? "bg-success text-success-foreground" : "bg-accent text-accent-foreground"}`}>{vehicle.availability ? "Available" : "Unavailable"}</span>
                      </div>
                      <div className="absolute bottom-3 right-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground">
                        {gallery.length} photos
                      </div>
                    </div>
                    <div className="space-y-4 p-5">
                      <div>
                        <h3 className="font-heading text-xl font-bold text-foreground">{vehicle.name}</h3>
                        <p className="text-xs text-muted-foreground">{vehicle.bikeNumber || "No registration number"}</p>
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{vehicle.description || "No description added yet."}</p>
                      <div className="flex flex-wrap gap-2">
                        {(vehicle.features || []).slice(0, 3).map((feature) => (
                          <span key={feature} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
                            <CheckCircle2 size={12} className="text-success" />
                            {feature}
                          </span>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          ["Hour", vehicle.pricePerHour],
                          ["Day", vehicle.pricePerDay],
                          ["Week", vehicle.pricePerWeek],
                        ] as [string, number | undefined][]).map(([label, amount]) => (
                          <div key={label} className="rounded-lg bg-secondary p-3">
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className="flex items-center font-heading font-bold text-foreground"><IndianRupee size={14} />{amount || 0}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => edit(vehicle)} className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary">
                          <Pencil className="mr-2 inline" size={15} /> Edit listing
                        </button>
                        <button onClick={() => remove(vehicle)} className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
              {filtered.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground xl:col-span-2">
                  No vehicles match your filters. Create a marketplace listing using the studio.
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TenantFleet;
