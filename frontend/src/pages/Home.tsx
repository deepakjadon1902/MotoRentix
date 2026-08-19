import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ProIcon, type ProIconName } from "@/components/ProIcons";
import HeroSlider, { type MarketplaceFilters } from "@/components/HeroSlider";
import VehicleCard from "@/components/VehicleCard";
import { api } from "@/lib/api";
import type { Vehicle, VehicleCategory } from "@/lib/types";
import bikeSectionBg from "@/assets/hero-bike-1.jpg";
import scooterSectionBg from "@/assets/hero-scooter-1.jpg";

const categoryMatches = (filter: MarketplaceFilters["category"], category?: VehicleCategory) =>
  filter === "all" ||
  category === filter ||
  (filter === "electric" && (category === "electric_bike" || category === "electric_scooter"));

const Home = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const [filters, setFilters] = useState<MarketplaceFilters>({
    category: "all",
    location: "",
    pickupDate: "",
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

  const filteredVehicles = useMemo(() => {
    const locationNeedle = filters.location.trim().toLowerCase();
    const today = new Date().toISOString().slice(0, 10);
    const pickupDateValid = !filters.pickupDate || filters.pickupDate >= today;
    return vehicles.filter((vehicle) => {
      const branch = vehicle.branchId && typeof vehicle.branchId === "object" ? vehicle.branchId : null;
      const categoryMatch = categoryMatches(filters.category, vehicle.category);
      const locationMatch =
        !locationNeedle ||
        [branch?.city, branch?.address, branch?.name, vehicle.name, vehicle.bikeNumber, vehicle.category]
          .filter(Boolean)
          .some((item) => item?.toLowerCase().includes(locationNeedle));
      const verifiedMatch = !filters.verifiedOnly || vehicle.status !== "disabled";
      return vehicle.availability && pickupDateValid && categoryMatch && locationMatch && verifiedMatch;
    });
  }, [filters, vehicles]);

  const hasActiveFilters = filters.category !== "all" || Boolean(filters.location.trim()) || Boolean(filters.pickupDate) || filters.verifiedOnly;
  const featured = useMemo(() => (hasActiveFilters ? filteredVehicles : vehicles.filter((v) => v.availability)).slice(0, 8), [filteredVehicles, hasActiveFilters, vehicles]);
  const bikes = useMemo(() => vehicles.filter((v) => v.category === "bike"), [vehicles]);
  const scooters = useMemo(() => vehicles.filter((v) => v.category === "scooter"), [vehicles]);
  const electric = useMemo(() => vehicles.filter((v) => v.category === "electric_bike" || v.category === "electric_scooter"), [vehicles]);

  const platformWorkflow = [
    { title: "Browse Fleet", copy: "Customers compare MotoRentix bikes, scooters, and electric rides with transparent pricing.", icon: "search" },
    { title: "Pick Dates", copy: "Select pickup date, duration, and the ride that fits the trip.", icon: "calendar" },
    { title: "Verify Profile", copy: "Rider details and required documents keep bookings safe and accountable.", icon: "shield" },
    { title: "Book Ride", copy: "Submit the booking request and track status from the customer dashboard.", icon: "bike" },
    { title: "Pickup Support", copy: "Our team prepares the vehicle and assists during pickup and return.", icon: "check" },
    { title: "Admin Managed", copy: "Admin controls vehicles, users, bookings, messages, pricing, and availability.", icon: "gauge" },
  ];

  return (
    <div>
      <HeroSlider
        filters={filters}
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
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Rental workflow</span>
              <h2 className="font-heading mt-3 text-3xl font-bold text-foreground md:text-5xl">
                From vehicle discovery to pickup in one premium flow.
              </h2>
              <p className="mt-4 text-muted-foreground">
                MotoRentix keeps the full rental experience in one place: our team manages the fleet, customers book quickly, and every ride is tracked from request to return.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                {["Managed fleet", "Clear pricing", "Admin approval", "Customer booking"].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
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
                ? "Review available MotoRentix rides and open the deal that fits your plan."
                : "Handpicked rides that our customers love. Book now and experience the thrill."}
            </p>
          </motion.div>

          {loading ? (
            <p className="text-center text-muted-foreground">Loading vehicles...</p>
          ) : featured.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
              No vehicles match these filters. Try another location, vehicle, or category.
            </div>
          ) : (
            <div className="vehicle-card-grid">
              {featured.map((v, i) => (
                <VehicleCard key={v.id} vehicle={v} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-background px-4 py-12 md:px-8 lg:px-16 xl:px-24">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
          >
            <div>
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Categories</span>
              <h2 className="font-heading mt-2 text-3xl font-bold text-foreground md:text-4xl">Choose Your Ride</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Browse verified listings by ride type. Empty categories stay compact until new vehicles are published.
            </p>
          </motion.div>

          <div className="mb-10 grid grid-cols-1 overflow-hidden rounded-lg border border-border bg-card shadow-sm md:grid-cols-3">
            {[
              { title: "Bikes", count: bikes.length, caption: "Manual and premium bikes", icon: "bike" as const, tone: "text-primary bg-primary/10" },
              { title: "Scooters", count: scooters.length, caption: "City scooters and daily rides", icon: "bolt" as const, tone: "text-accent bg-accent/10" },
              { title: "Electric", count: electric.length, caption: "Electric bike / scooter", icon: "gauge" as const, tone: "text-success bg-success/10" },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="flex items-center gap-4 border-b border-border p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md ${item.tone}`}>
                  <ProIcon name={item.icon} size={24} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-heading text-xl font-bold text-foreground">{item.title}</h3>
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-bold text-foreground">{item.count}</span>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{item.caption}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="space-y-8">
            <RideSection title="Bikes" subtitle="Performance and commuter motorcycles" vehicles={bikes} image={bikeSectionBg} />
            <RideSection title="Scooters" subtitle="Easy city rentals for daily movement" vehicles={scooters} image={scooterSectionBg} />
            <RideSection title="Electric Bike / Scooter" subtitle="Quiet electric rides for modern commutes" vehicles={electric} image={scooterSectionBg} />
          </div>
        </div>
      </section>
    </div>
  );
};

const RideSection = ({
  title,
  subtitle,
  vehicles,
  image,
}: {
  title: string;
  subtitle: string;
  vehicles: Vehicle[];
  image: string;
}) => (
  <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
    <div className="relative min-h-[112px] border-b border-border px-5 py-5 md:px-7">
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.08]" />
      <div className="absolute inset-0 bg-gradient-to-r from-card via-card/92 to-card/80" />
      <div className="relative z-10 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="font-heading text-2xl font-bold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <span className="w-fit rounded-md bg-secondary px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {vehicles.length} available
        </span>
      </div>
    </div>

    {vehicles.length > 0 ? (
      <div className="vehicle-card-grid p-4 md:p-6">
        {vehicles.map((v, i) => (
          <VehicleCard key={v.id} vehicle={v} index={i} />
        ))}
      </div>
    ) : (
      <div className="flex min-h-[92px] items-center justify-between gap-4 px-5 py-5 text-sm text-muted-foreground md:px-7">
        <span>No listings in this category yet.</span>
        <span className="hidden rounded-md border border-dashed border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] md:inline-flex">
          Coming soon
        </span>
      </div>
    )}
  </section>
);

export default Home;
