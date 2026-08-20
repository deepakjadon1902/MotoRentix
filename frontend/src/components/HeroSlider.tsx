import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, MapPin, RotateCcw } from 'lucide-react';
import { ProIcon, type ProIconName } from '@/components/ProIcons';
import heroBike1 from '@/assets/hero-bike-1.jpg';
import heroScooter1 from '@/assets/hero-scooter-1.jpg';
import heroBike2 from '@/assets/hero-bike-2.jpg';
import heroScooter2 from '@/assets/hero-scooter-2.jpg';
import type { VehicleCategory } from '@/lib/types';

const slides = [
  { image: heroBike1, title: 'Find your next MotoRentix ride', subtitle: 'Browse bikes, scooters, and electric rides from our managed fleet.' },
  { image: heroScooter1, title: 'City rides with clear pricing', subtitle: 'Hourly, daily and weekly rentals with simple pickup support.' },
  { image: heroBike2, title: 'Premium rides, simple booking', subtitle: 'Choose your vehicle, verify documents, pay securely and ride.' },
  { image: heroScooter2, title: 'More options in every location', subtitle: 'Browse fleet listings across available pickup areas.' },
];

export type MarketplaceFilters = {
  category: 'all' | 'electric' | VehicleCategory;
  location: string;
  pickupDate: string;
  verifiedOnly: boolean;
};

type HeroSliderProps = {
  filters: MarketplaceFilters;
  resultCount: number;
  onFiltersChange: (filters: MarketplaceFilters) => void;
  onSearch: () => void;
};

const categories: Array<{ label: string; value: MarketplaceFilters['category'] | 'verified'; icon: ProIconName }> = [
  { label: 'Bikes', value: 'bike', icon: 'bike' },
  { label: 'Scooters', value: 'scooter', icon: 'bolt' },
  { label: 'Electric', value: 'electric', icon: 'gauge' },
  { label: 'Verified', value: 'verified', icon: 'shield' },
];

const HeroSlider = ({ filters, resultCount, onFiltersChange, onSearch }: HeroSliderProps) => {
  const [current, setCurrent] = useState(0);
  const today = new Date().toISOString().slice(0, 10);
  const hasFilters =
    filters.category !== 'all' ||
    filters.location.trim() ||
    filters.pickupDate ||
    filters.verifiedOnly;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[calc(100svh-64px)] overflow-hidden md:min-h-[calc(100svh-80px)]">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img src={slides[current].image} alt={slides[current].title} className="h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/88 via-slate-950/58 to-slate-950/18" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950/36 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-64px)] max-w-[1280px] flex-col justify-end px-4 pb-14 pt-20 md:min-h-[calc(100svh-80px)] md:px-8 md:pb-16 md:pt-24 lg:pb-20">
        <motion.div
          key={`text-${current}`}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-[760px] text-white"
        >
          <span className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/12 px-4 py-2 text-sm font-semibold backdrop-blur">
            <ProIcon name="shield" size={16} />
            MotoRentix managed rental fleet
          </span>
          <h1 className="font-heading mt-4 text-4xl font-bold leading-tight md:text-5xl lg:text-[3.75rem]">
            {slides[current].title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-white/78 md:text-lg">
            {slides[current].subtitle}
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.38 }}
          className="marketplace-shell mt-6 overflow-hidden bg-white/96 p-3 shadow-2xl shadow-slate-950/20 backdrop-blur-xl"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch();
          }}
        >
          <div className="scroll-fade-x flex gap-2 overflow-x-auto px-1 pb-3">
            {categories.map((item) => {
              const active = item.value === 'verified' ? filters.verifiedOnly : filters.category === item.value;
              return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.value === 'verified') {
                    onFiltersChange({ ...filters, verifiedOnly: !filters.verifiedOnly });
                    return;
                  }
                  onFiltersChange({ ...filters, category: filters.category === item.value ? 'all' : item.value });
                }}
                className={`marketplace-pill min-w-max ${active ? 'border-primary text-primary ring-2 ring-primary/15' : ''}`}
              >
                <ProIcon name={item.icon} size={17} />
                {item.label}
              </button>
            );
            })}
          </div>

          <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-background p-3 md:grid-cols-[1.15fr_0.85fr_auto] md:items-end">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Search</span>
              <div className="flex items-center gap-2 rounded-md bg-secondary px-4 py-3">
                <MapPin className="text-primary" size={18} />
                <input
                  value={filters.location}
                  onChange={(event) => onFiltersChange({ ...filters, location: event.target.value })}
                  placeholder="Apache, Activa, 500/day, Mathura"
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Pickup</span>
              <div className="flex items-center gap-2 rounded-md bg-secondary px-4 py-3">
                <ProIcon name="calendar" className="text-primary" size={18} />
                <input
                  type="date"
                  min={today}
                  value={filters.pickupDate}
                  onChange={(event) => onFiltersChange({ ...filters, pickupDate: event.target.value })}
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-foreground outline-none"
                  aria-label="Pickup date"
                />
              </div>
            </label>
            <div className="flex gap-2">
                {hasFilters ? (
                  <button
                  type="button"
                  onClick={() =>
                    onFiltersChange({
                      category: 'all',
                      location: '',
                      pickupDate: '',
                      verifiedOnly: false,
                    })
                  }
                  className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:text-foreground"
                  aria-label="Reset search filters"
                  >
                    <RotateCcw size={17} />
                  </button>
                ) : null}
              <button
                type="submit"
                className="btn-primary-gradient flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-bold text-primary-foreground md:min-w-[170px]"
              >
                {resultCount > 0 ? `Search ${resultCount} rides` : 'No rides found'} <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </motion.form>
      </div>

      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 md:bottom-5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-500 ${i === current ? 'w-8 bg-white' : 'w-2 bg-white/45'}`}
            aria-label={`Show slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;
