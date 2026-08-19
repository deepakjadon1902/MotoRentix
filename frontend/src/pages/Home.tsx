import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ProIcon, type ProIconName } from "@/components/ProIcons";
import HeroSlider, { type MarketplaceFilters } from "@/components/HeroSlider";
import VehicleCard from "@/components/VehicleCard";
import { api } from "@/lib/api";
import type { Vehicle } from "@/lib/types";
import bikeSectionBg from "@/assets/hero-bike-1.jpg";
import scooterSectionBg from "@/assets/hero-scooter-1.jpg";

const Home = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const [filters, setFilters] = useState<MarketplaceFilters>({
    category: "all",
    location: "",
    company: "all",
    verifiedOnly: false,
  });

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

  const companies = useMemo(() => {
    const names = vehicles
      .map((v) => (v.tenantId && typeof v.tenantId === "object" ? v.tenantId.companyName : ""))
      .filter(Boolean) as string[];
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    const locationNeedle = filters.location.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      const tenant = vehicle.tenantId && typeof vehicle.tenantId === "object" ? vehicle.tenantId : null;
      const branch = vehicle.branchId && typeof vehicle.branchId === "object" ? vehicle.branchId : null;
      const vehicleCompany = tenant?.companyName || "";
      const categoryMatch =
        filters.category === "all" ||
        vehicle.category === filters.category ||
        (filters.category === "electric_bike" && vehicle.category === "electric_scooter");
      const locationMatch =
        !locationNeedle ||
        [branch?.city, branch?.address, branch?.name, vehicle.name, vehicle.bikeNumber]
          .filter(Boolean)
          .some((item) => item?.toLowerCase().includes(locationNeedle));
      const companyMatch = filters.company === "all" || vehicleCompany === filters.company;
      const verifiedMatch = !filters.verifiedOnly || ["trial", "active"].includes(tenant?.status || "");
      return vehicle.availability && categoryMatch && locationMatch && companyMatch && verifiedMatch;
    });
  }, [filters, vehicles]);

  const hasActiveFilters = filters.category !== "all" || Boolean(filters.location.trim()) || filters.company !== "all" || filters.verifiedOnly;
  const featured = useMemo(() => (hasActiveFilters ? filteredVehicles : vehicles.filter((v) => v.availability)).slice(0, 8), [filteredVehicles, hasActiveFilters, vehicles]);
  const bikes = useMemo(() => vehicles.filter((v) => v.category === "bike" || v.category === "electric_bike"), [vehicles]);
  const scooters = useMemo(() => vehicles.filter((v) => v.category === "scooter" || v.category === "electric_scooter"), [vehicles]);

  const platformWorkflow = [
    { title: "Register Company", copy: "Rental owners create a verified tenant account with business, GST, contact, and branding details.", icon: "building" },
    { title: "Choose Plan", copy: "Starter, Professional, or Enterprise controls fleet, staff, branches, reports, and integrations.", icon: "card" },
    { title: "Activate Dashboard", copy: "After payment, the tenant workspace opens with isolated data, roles, settings, and billing.", icon: "shield" },
    { title: "List Fleet", copy: "Owners add bikes and scooters, pricing, availability, documents, images, and branch assignment.", icon: "bike" },
    { title: "Accept Bookings", copy: "Customers browse that tenant's vehicles, upload documents, pay rent, and receive invoices.", icon: "check" },
    { title: "Scale Operations", copy: "Teams track revenue, bookings, maintenance, customers, payments, and branch performance.", icon: "gauge" },
  ];

  return (
    <div>
      <HeroSlider
        filters={filters}
        companies={companies}
        resultCount={filteredVehicles.length}
        onFiltersChange={setFilters}
        onSearch={() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
      />

      <section className="section-padding bg-background">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Complete SaaS workflow</span>
              <h2 className="font-heading mt-3 text-3xl font-bold text-foreground md:text-5xl">
                From company registration to daily rentals in one premium flow.
              </h2>
              <p className="mt-4 text-muted-foreground">
                MotoRentix works like a modern subscription platform: shop owners subscribe to the software, while their customers continue renting bikes and scooters normally.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                {["Tenant data isolation", "Subscription billing", "Owner dashboard", "Customer checkout"].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
                    <ProIcon name="check" className="text-success" size={17} />
                    <span className="font-medium text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {platformWorkflow.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="premium-card p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <ProIcon name={step.icon as ProIconName} size={21} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Step {index + 1}
                      </p>
                      <h3 className="font-heading mt-1 text-lg font-bold text-foreground">{step.title}</h3>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.copy}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section ref={resultsRef} className="section-padding bg-secondary/70">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">{hasActiveFilters ? "Search results" : "Top Picks"}</span>
            <h2 className="font-heading mt-2 text-3xl font-bold text-foreground md:text-4xl">
              {hasActiveFilters ? `${filteredVehicles.length} matching rides` : "Featured Vehicles"}
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              {hasActiveFilters
                ? "Compare verified local listings and open the deal that fits your plan."
                : "Handpicked rides that our customers love. Book now and experience the thrill."}
            </p>
          </motion.div>

          {loading ? (
            <p className="text-center text-muted-foreground">Loading vehicles...</p>
          ) : featured.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
              No vehicles match these filters. Try another location, company, or category.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {featured.map((v, i) => (
                <VehicleCard key={v.id} vehicle={v} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Categories</span>
            <h2 className="font-heading mt-2 text-3xl font-bold text-foreground md:text-4xl">Choose Your Ride</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="premium-card flex cursor-pointer items-center gap-6 p-8"
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <ProIcon name="bike" className="text-primary" size={32} />
              </div>
              <div>
                <h3 className="font-heading text-2xl font-bold text-foreground">Bikes</h3>
                <p className="text-muted-foreground text-sm mt-1">{bikes.length} bikes available for rent</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="premium-card flex cursor-pointer items-center gap-6 p-8"
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-accent/10">
                <ProIcon name="bolt" className="text-accent" size={32} />
              </div>
              <div>
                <h3 className="font-heading text-2xl font-bold text-foreground">Scooters</h3>
                <p className="text-muted-foreground text-sm mt-1">{scooters.length} scooters available for rent</p>
              </div>
            </motion.div>
          </div>

          <section className="mb-12">
            <div className="relative overflow-hidden rounded-lg border border-border/60 bg-background/80 p-6 md:p-10">
              <img src={bikeSectionBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
              <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/70 to-background/95" />
              <div className="relative z-10">
                <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Bikes</h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  {bikes.map((v, i) => (
                    <VehicleCard key={v.id} vehicle={v} index={i} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="relative overflow-hidden rounded-lg border border-border/60 bg-background/80 p-6 md:p-10">
              <img src={scooterSectionBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
              <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/70 to-background/95" />
              <div className="relative z-10">
                <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Scooters</h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  {scooters.map((v, i) => (
                    <VehicleCard key={v.id} vehicle={v} index={i} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
};

export default Home;
