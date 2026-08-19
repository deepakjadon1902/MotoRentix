import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bike, MapPin, Search, ShieldCheck, SlidersHorizontal, Zap } from "lucide-react";
import VehicleCard from "@/components/VehicleCard";
import PublicWorkflowBar from "@/components/PublicWorkflowBar";
import { api } from "@/lib/api";
import type { Vehicle } from "@/lib/types";
import bikeSectionBg from "@/assets/hero-bike-1.jpg";

const Dashboard = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.listVehicles();
        setVehicles(data);
      } catch {
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      const tenant = vehicle.tenantId && typeof vehicle.tenantId === "object" ? vehicle.tenantId : null;
      const branch = vehicle.branchId && typeof vehicle.branchId === "object" ? vehicle.branchId : null;
      const haystack = [
        vehicle.name,
        vehicle.category,
        tenant?.companyName,
        branch?.city,
        branch?.address,
      ].filter(Boolean).join(" ").toLowerCase();
      const matchesQuery = !needle || haystack.includes(needle);
      const matchesCategory = category === "all" || vehicle.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [category, query, vehicles]);

  const stats = useMemo(() => ({
    companies: new Set(vehicles.map((vehicle) => typeof vehicle.tenantId === "object" ? vehicle.tenantId?._id || vehicle.tenantId?.id : vehicle.tenantId).filter(Boolean)).size,
    bikes: vehicles.filter((vehicle) => vehicle.category === "bike" || vehicle.category === "electric_bike").length,
    scooters: vehicles.filter((vehicle) => vehicle.category === "scooter" || vehicle.category === "electric_scooter").length,
  }), [vehicles]);

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden px-4 py-12 md:px-8 lg:px-16">
        <img src={bikeSectionBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-18" />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/92 to-secondary/90" />
        <div className="relative mx-auto max-w-[1280px]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-primary">Compare rental deals</p>
            <h1 className="font-heading mt-3 text-4xl font-bold text-foreground md:text-5xl">Find your best ride from verified rental companies.</h1>
            <p className="mt-3 text-muted-foreground">Search bikes and scooters by vehicle, company, location, or category. Every listing shows who owns it before you book.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="marketplace-search mt-8 p-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_170px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-14 w-full rounded-xl border border-border bg-secondary pl-11 pr-4 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Search location, company, bike, scooter..."
                />
              </div>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-14 rounded-xl border border-border bg-secondary px-4 text-sm font-semibold text-foreground"
              >
                <option value="all">All vehicles</option>
                <option value="bike">Bikes</option>
                <option value="scooter">Scooters</option>
                <option value="electric_bike">Electric bikes</option>
                <option value="electric_scooter">Electric scooters</option>
              </select>
              <button className="btn-primary-gradient inline-flex h-14 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold text-primary-foreground">
                <SlidersHorizontal size={17} />
                Search
              </button>
            </div>
          </motion.div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: "Verified companies", value: stats.companies, icon: ShieldCheck },
              { label: "Bike deals", value: stats.bikes, icon: Bike },
              { label: "Scooter deals", value: stats.scooters, icon: Zap },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-border bg-card/90 p-4 shadow-sm backdrop-blur">
                <item.icon className="text-primary" size={20} />
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                <p className="font-heading text-2xl font-bold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <PublicWorkflowBar current={filtered.length > 0 ? "compare" : "search"} />
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 md:px-8 lg:px-16">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground">Available rides</h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={15} />
                Showing marketplace listings from active rental companies
              </p>
            </div>
            <p className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-foreground">{filtered.length} results</p>
          </div>

          {loading ? (
            <div className="marketplace-search p-8 text-muted-foreground">Loading vehicles...</div>
          ) : filtered.length === 0 ? (
            <div className="marketplace-search p-10 text-center">
              <h3 className="font-heading text-xl font-bold text-foreground">No matching rides found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Try another company, location, vehicle name, or category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((vehicle, index) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
