import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Camera, MapPin } from "lucide-react";
import { ProIcon } from "@/components/ProIcons";
import type { Vehicle } from "@/lib/types";
import { optimizeImageUrl } from "@/lib/assetUrl";

interface VehicleCardProps {
  vehicle: Vehicle;
  index?: number;
}

const VehicleCard = ({ vehicle, index = 0 }: VehicleCardProps) => {
  const branch = vehicle.branchId && typeof vehicle.branchId === "object" ? vehicle.branchId : null;
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
  const displaySrc = optimizeImageUrl(src, { width: 720, height: 540, quality: 78 });
  const srcSet = [
    `${optimizeImageUrl(src, { width: 360, height: 270, quality: 78 })} 360w`,
    `${optimizeImageUrl(src, { width: 720, height: 540, quality: 78 })} 720w`,
    `${optimizeImageUrl(src, { width: 1080, height: 810, quality: 78 })} 1080w`,
  ].filter((item) => !item.startsWith("undefined"));
  const canShow = Boolean(src) && !broken[activeIndex];
  const categoryLabel =
    vehicle.category === "electric_bike" || vehicle.category === "electric_scooter"
      ? "Electric"
      : vehicle.category?.replace("_", " ");
  const location = branch?.city || branch?.address || "Pickup after booking";
  const weeklyPrice = vehicle.pricePerWeek || vehicle.pricePerDay * 7;
  const priceItems = [
    { label: "Hour", value: vehicle.pricePerHour },
    { label: "Day", value: vehicle.pricePerDay },
    { label: "Week", value: weeklyPrice },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.24) }}
      className="h-full"
    >
      <div
        className="royal-card group flex h-full min-h-[455px] flex-col overflow-hidden"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div className="vehicle-media-stage relative aspect-[16/11] overflow-hidden">
          {canShow ? (
            <img
              src={displaySrc}
              srcSet={srcSet.join(", ")}
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              alt={vehicle.name}
              loading={index < 2 ? "eager" : "lazy"}
              decoding="async"
              className="h-full w-full object-contain p-3 transition-transform duration-700 group-hover:scale-[1.06]"
              onError={() => setBroken((prev) => ({ ...prev, [activeIndex]: true }))}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary text-primary">
              <ProIcon name="bike" size={54} />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_42%,hsl(var(--foreground)/0.14))] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          {!vehicle.availability && (
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/50">
              <span className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">Not Available</span>
            </div>
          )}
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md border border-white/50 bg-background/90 px-2.5 py-1 text-[11px] font-bold text-foreground shadow-sm backdrop-blur">
            <ProIcon name="star" className="text-warning" size={13} />
            4.8
          </div>
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-slate-950/78 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur">
            <Camera size={12} />
            {images.length || 1}
          </div>
          <div className="absolute right-3 top-3 rounded-md border border-primary/15 bg-primary/10 px-2.5 py-1 text-[11px] font-bold capitalize text-primary backdrop-blur">{categoryLabel}</div>
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <div className="min-h-[56px]">
            <h3 className="line-clamp-2 font-heading text-lg font-bold leading-snug text-foreground">{vehicle.name}</h3>
          </div>

          <div className="mt-3 rounded-md border border-border/70 bg-secondary/55 p-3">
            <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
              <ProIcon name="building" className="text-primary" size={16} />
              <span className="truncate">MotoRentix managed fleet</span>
            </div>
            <div className="mt-1.5 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <MapPin size={14} />
              <span className="truncate">{location}</span>
            </div>
          </div>

          <div className="mt-4 divide-y divide-border rounded-md border border-border bg-background/85">
            {priceItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <span className="text-[11px] font-bold uppercase text-muted-foreground">{item.label}</span>
                <span className="font-heading text-sm font-bold text-foreground">INR {Number(item.value || 0).toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {["Verified ride", "Secure booking"].map((item, itemIndex) => (
              <span key={item} className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2.5 py-1 text-[11px] font-bold text-success">
                <ProIcon name={itemIndex === 0 ? "shield" : "check"} size={12} />
                {item}
              </span>
            ))}
          </div>

          <Link
            to={`/vehicle/${vehicle.id}`}
            className="vehicle-card-action btn-primary-gradient mt-auto block w-full rounded-md py-3 text-center text-sm font-bold text-primary-foreground"
          >
            View deal
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default VehicleCard;
