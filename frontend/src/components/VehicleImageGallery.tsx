import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type VehicleImageGalleryProps = {
  images: string[];
  alt: string;
  className?: string;
};

const AUTO_INTERVAL_MS = 1400;

const VehicleImageGallery = ({ images, alt, className }: VehicleImageGalleryProps) => {
  const safeImages = useMemo(() => images.filter(Boolean), [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageOk, setImageOk] = useState<Record<number, boolean>>({});
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setActiveIndex(0);
    setImageOk({});
  }, [safeImages.join("|")]);

  const stopAuto = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startAuto = () => {
    if (timerRef.current || safeImages.length <= 1) return;
    timerRef.current = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % safeImages.length);
    }, AUTO_INTERVAL_MS);
  };

  useEffect(() => stopAuto, []);

  const mainSrc = safeImages[activeIndex];

  return (
    <div className={cn("grid gap-3 sm:gap-4 lg:grid-cols-[80px_1fr]", className)}>
      <div
        className="order-2 lg:order-1 flex gap-2 lg:flex-col lg:gap-3 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0"
        onMouseEnter={startAuto}
        onMouseLeave={stopAuto}
      >
        {safeImages.slice(0, 10).map((src, idx) => {
          const ok = imageOk[idx] !== false;
          return (
            <button
              key={`${src}-${idx}`}
              type="button"
              onMouseEnter={() => {
                stopAuto();
                setActiveIndex(idx);
              }}
              onFocus={() => setActiveIndex(idx)}
              className={cn(
                "relative shrink-0 rounded-xl border overflow-hidden transition-all",
                idx === activeIndex ? "border-primary ring-2 ring-primary/30" : "border-border/60 hover:border-primary/50",
                "h-16 w-20 lg:h-16 lg:w-20 bg-secondary"
              )}
              aria-label={`Show image ${idx + 1}`}
            >
              {ok ? (
                <img
                  src={src}
                  alt={`${alt} thumbnail ${idx + 1}`}
                  className="h-full w-full object-cover"
                  onError={() => setImageOk((prev) => ({ ...prev, [idx]: false }))}
                />
              ) : (
                <div className="h-full w-full bg-secondary" />
              )}
              <div className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-br from-white/10 via-transparent to-black/10" />
            </button>
          );
        })}
      </div>

      <div className="order-1 lg:order-2">
        <div className="glass metallic-hover rounded-3xl overflow-hidden border border-border/60">
          <div className="relative aspect-[4/3] sm:aspect-[16/12] bg-secondary">
            {mainSrc && imageOk[activeIndex] !== false ? (
              <>
                <img
                  src={mainSrc}
                  alt={alt}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]"
                  onError={() => setImageOk((prev) => ({ ...prev, [activeIndex]: false }))}
                />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_55%)]" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-70" />
              </>
            ) : (
              <div className="h-full w-full bg-secondary" />
            )}
          </div>
        </div>
        {safeImages.length > 10 && (
          <p className="text-xs text-muted-foreground mt-2">Showing 10 images</p>
        )}
      </div>
    </div>
  );
};

export default VehicleImageGallery;

