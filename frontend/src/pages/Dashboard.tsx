import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import VehicleCard from "@/components/VehicleCard";
import { api } from "@/lib/api";
import type { Vehicle } from "@/lib/types";
import bikeSectionBg from "@/assets/hero-bike-1.jpg";
import scooterSectionBg from "@/assets/hero-scooter-2.jpg";

const Dashboard = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

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

  const bikes = useMemo(() => vehicles.filter((v) => v.category === "bike"), [vehicles]);
  const scooters = useMemo(() => vehicles.filter((v) => v.category === "scooter"), [vehicles]);

  return (
    <div className="section-padding bg-background min-h-screen">
      <div className="container mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">All Vehicles</h1>
          <p className="text-muted-foreground mt-2">Browse our complete fleet of bikes and scooters</p>
        </motion.div>

        {loading ? (
          <p className="text-muted-foreground">Loading vehicles...</p>
        ) : (
          <>
            <section className="mb-12">
              <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-background/80 p-6 md:p-10">
                <img src={bikeSectionBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
                <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/70 to-background/95" />
                <div className="relative z-10">
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-6 flex items-center gap-2">Bikes</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bikes.map((v, i) => (
                      <VehicleCard key={v.id} vehicle={v} index={i} />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-background/80 p-6 md:p-10">
                <img src={scooterSectionBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
                <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/70 to-background/95" />
                <div className="relative z-10">
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-6 flex items-center gap-2">Scooters</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {scooters.map((v, i) => (
                      <VehicleCard key={v.id} vehicle={v} index={i} />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
