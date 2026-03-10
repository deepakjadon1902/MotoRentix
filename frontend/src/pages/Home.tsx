import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bike, Zap } from "lucide-react";
import HeroSlider from "@/components/HeroSlider";
import VehicleCard from "@/components/VehicleCard";
import { api } from "@/lib/api";
import type { Vehicle } from "@/lib/types";

const Home = () => {
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

  const featured = useMemo(() => vehicles.filter((v) => v.availability).slice(0, 3), [vehicles]);
  const bikes = useMemo(() => vehicles.filter((v) => v.category === "bike"), [vehicles]);
  const scooters = useMemo(() => vehicles.filter((v) => v.category === "scooter"), [vehicles]);

  return (
    <div>
      <HeroSlider />

      <section className="section-padding bg-background">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Top Picks</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-2">Featured Vehicles</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              Handpicked rides that our customers love. Book now and experience the thrill.
            </p>
          </motion.div>

          {loading ? (
            <p className="text-center text-muted-foreground">Loading vehicles...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((v, i) => (
                <VehicleCard key={v.id} vehicle={v} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section-padding bg-secondary">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Categories</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-2">Choose Your Ride</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl p-8 flex items-center gap-6 metallic-hover cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Bike className="text-primary" size={32} />
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
              className="glass rounded-2xl p-8 flex items-center gap-6 metallic-hover cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
                <Zap className="text-accent" size={32} />
              </div>
              <div>
                <h3 className="font-heading text-2xl font-bold text-foreground">Scooters</h3>
                <p className="text-muted-foreground text-sm mt-1">{scooters.length} scooters available for rent</p>
              </div>
            </motion.div>
          </div>

          <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Bikes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {bikes.map((v, i) => (
              <VehicleCard key={v.id} vehicle={v} index={i} />
            ))}
          </div>

          <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Scooters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scooters.map((v, i) => (
              <VehicleCard key={v.id} vehicle={v} index={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
