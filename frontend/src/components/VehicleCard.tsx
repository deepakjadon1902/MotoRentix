import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { Vehicle } from "@/lib/types";

interface VehicleCardProps {
  vehicle: Vehicle;
  index?: number;
}

const VehicleCard = ({ vehicle, index = 0 }: VehicleCardProps) => {
  const images = (vehicle.images && vehicle.images.length > 0)
    ? vehicle.images
    : vehicle.image
      ? [vehicle.image]
      : [];

  const [activeIndex, setActiveIndex] = useState(0);
  const [broken, setBroken] = useState<Record<number, true>>({});
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
    setBroken({});
  }, [vehicle.id]);

  useEffect(() => {
    if (!hovering || images.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % images.length);
    }, 1200);
    return () => window.clearInterval(id);
  }, [hovering, images.length]);

  const src = images[activeIndex];
  const canShow = Boolean(src) && !broken[activeIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div
        className="glass rounded-2xl overflow-hidden metallic-hover group"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div className="relative overflow-hidden aspect-[4/3]">
          {canShow ? (
            <img
              src={src}
              alt={vehicle.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={() => setBroken((prev) => ({ ...prev, [activeIndex]: true }))}
            />
          ) : (
            <div className="w-full h-full bg-secondary" />
          )}
          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_60%)]" />
          {!vehicle.availability && (
            <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
              <span className="bg-accent text-accent-foreground px-4 py-2 rounded-lg font-semibold text-sm">Not Available</span>
            </div>
          )}
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-lg text-foreground">{vehicle.name}</h3>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">{vehicle.category}</span>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <span className="text-xs text-muted-foreground">Per Hour</span>
              <p className="font-heading font-bold text-foreground">INR {vehicle.pricePerHour}</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <span className="text-xs text-muted-foreground">Per Day</span>
              <p className="font-heading font-bold text-foreground">INR {vehicle.pricePerDay}</p>
            </div>
          </div>

          <Link
            to={`/vehicle/${vehicle.id}`}
            className="block w-full text-center btn-primary-gradient py-2.5 rounded-lg text-sm font-semibold text-primary-foreground"
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default VehicleCard;
