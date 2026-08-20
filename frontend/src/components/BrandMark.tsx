import logo from "@/assets/logo.jpeg";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  compact?: boolean;
  inverted?: boolean;
  className?: string;
  logoClassName?: string;
};

const BrandMark = ({ compact = false, inverted = false, className, logoClassName }: BrandMarkProps) => {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-3", className)}>
      <span
        className={cn(
          "relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden",
          logoClassName,
        )}
      >
        <img src={logo} alt="MotoRentix" className="h-full w-full object-cover" />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className={cn("block font-heading text-lg font-bold leading-none", inverted ? "text-white" : "text-foreground")}>
            MotoRentix
          </span>
          <span
            className={cn(
              "mt-1 block text-[11px] font-semibold uppercase tracking-[0.16em]",
              inverted ? "text-white/58" : "text-muted-foreground",
            )}
          >
            Rental operating system
          </span>
        </span>
      )}
    </span>
  );
};

export default BrandMark;
