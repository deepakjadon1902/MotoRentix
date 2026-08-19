import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Building2, CheckCircle2, MapPin, ShieldCheck, Star } from "lucide-react";
import type { Vehicle } from "@/lib/types";
import { optimizeImageUrl } from "@/lib/assetUrl";

interface VehicleCardProps {
  vehicle: Vehicle;
  index?: number;
}

const VehicleCard = ({ vehicle, index = 0 }: VehicleCardProps) => {
  const tenant = vehicle.tenantId && typeof vehicle.tenantId === "object" ? vehicle.tenantId : null;
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div
        className="royal-card group overflow-hidden"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          {canShow ? (
            <img
              src={displaySrc}
              srcSet={srcSet.join(", ")}
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              alt={vehicle.name}
              loading={index < 2 ? "eager" : "lazy"}
              decoding="async"
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
          <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur">
            <Star className="fill-warning text-warning" size={13} />
            4.8
          </div>
          <div className="absolute bottom-2 left-2 rounded-full bg-slate-950/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
            {images.length || 1} photos
          </div>
        </div>

        <div className="space-y-3 p-3 sm:p-4">
          <div className="min-h-[50px]">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 font-heading text-sm font-bold leading-snug text-foreground sm:text-base">{vehicle.name}</h3>
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold capitalize text-primary sm:text-[11px]">{vehicle.category?.replace("_", " ")}</span>
            </div>
          </div>

          <div className="space-y-1.5 rounded-xl bg-secondary/70 p-2.5">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground sm:text-sm">
              {tenant?.branding?.logoUrl ? (
                <img
                  src={optimizeImageUrl(tenant.branding.logoUrl, { width: 48, height: 48 })}
                  alt={tenant.companyName || "Company"}
                  className="h-5 w-5 rounded-full object-cover sm:h-6 sm:w-6"
                />
              ) : (
                <Building2 className="text-primary" size={16} />
              )}
              <span className="truncate">Listed by {tenant?.companyName || "Verified rental company"}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground sm:text-xs">
              <MapPin size={14} />
              <span className="truncate">{branch?.city || branch?.address || "Location available after booking"}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <div className="rounded-lg border border-border bg-background p-2 sm:rounded-xl">
              <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-[10px]">Hour</span>
              <p className="font-heading text-xs font-bold text-foreground sm:text-sm">INR {vehicle.pricePerHour}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-2 sm:rounded-xl">
              <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-[10px]">Day</span>
              <p className="font-heading text-xs font-bold text-foreground sm:text-sm">INR {vehicle.pricePerDay}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-2 sm:rounded-xl">
              <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-[10px]">Week</span>
              <p className="font-heading text-xs font-bold text-foreground sm:text-sm">INR {vehicle.pricePerWeek || vehicle.pricePerDay * 7}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {["Verified company", "Secure payment"].map((item, itemIndex) => (
              <span key={item} className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success sm:text-xs">
                {itemIndex === 0 ? <ShieldCheck size={12} /> : <CheckCircle2 size={12} />}
                {item}
              </span>
            ))}
          </div>

          <Link
            to={`/vehicle/${vehicle.id}`}
            className="btn-primary-gradient block w-full rounded-xl py-2.5 text-center text-xs font-bold text-primary-foreground sm:text-sm"
          >
            View deal
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default VehicleCard;
