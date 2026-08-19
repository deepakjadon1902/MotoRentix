import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { optimizeImageUrl } from "@/lib/assetUrl";

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
    <div className={cn("grid gap-3 lg:grid-cols-[70px_1fr]", className)}>
      <div
        className="order-2 flex gap-2 overflow-x-auto pb-1 lg:order-1 lg:flex-col lg:overflow-visible lg:pb-0"
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
                "relative shrink-0 overflow-hidden rounded-md border bg-secondary transition-all",
                idx === activeIndex ? "border-primary ring-2 ring-primary/25" : "border-border/60 hover:border-primary/50",
                "h-16 w-20 lg:h-[62px] lg:w-[70px]"
              )}
              aria-label={`Show image ${idx + 1}`}
            >
              {ok ? (
                <img
                  src={optimizeImageUrl(src, { width: 180, height: 180, quality: 72 })}
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
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="vehicle-media-stage relative aspect-[16/9] max-h-[390px] min-h-[260px] sm:min-h-[330px]">
            {mainSrc && imageOk[activeIndex] !== false ? (
              <>
                <img
                  src={optimizeImageUrl(mainSrc, { width: 1100, height: 720, quality: 88 })}
                  alt={alt}
                  className="h-full w-full object-contain p-2 transition-transform duration-500 hover:scale-[1.018] sm:p-3"
                  onError={() => setImageOk((prev) => ({ ...prev, [activeIndex]: false }))}
                />
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
