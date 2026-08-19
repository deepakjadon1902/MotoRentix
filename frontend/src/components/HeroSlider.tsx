import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, MapPin } from 'lucide-react';
import { ProIcon, type ProIconName } from '@/components/ProIcons';
import heroBike1 from '@/assets/hero-bike-1.jpg';
import heroScooter1 from '@/assets/hero-scooter-1.jpg';
import heroBike2 from '@/assets/hero-bike-2.jpg';
import heroScooter2 from '@/assets/hero-scooter-2.jpg';
import type { VehicleCategory } from '@/lib/types';

const slides = [
  { image: heroBike1, title: 'Compare trusted rental companies', subtitle: 'Find bikes and scooters listed by verified local operators.' },
  { image: heroScooter1, title: 'City rides with clear pricing', subtitle: 'Hourly, daily and weekly rentals with company-owned payment methods.' },
  { image: heroBike2, title: 'Premium rides, simple booking', subtitle: 'Choose your vehicle, verify documents, pay securely and ride.' },
  { image: heroScooter2, title: 'More options in every location', subtitle: 'Browse marketplace listings across branches and rental companies.' },
];

export type MarketplaceFilters = {
  category: 'all' | VehicleCategory;
  location: string;
  company: string;
  verifiedOnly: boolean;
};

type HeroSliderProps = {
  filters: MarketplaceFilters;
  companies: string[];
  resultCount: number;
  onFiltersChange: (filters: MarketplaceFilters) => void;
  onSearch: () => void;
};

const categories: Array<{ label: string; value: MarketplaceFilters['category'] | 'verified'; icon: ProIconName }> = [
  { label: 'Bikes', value: 'bike', icon: 'bike' },
  { label: 'Scooters', value: 'scooter', icon: 'bolt' },
  { label: 'Electric', value: 'electric_bike', icon: 'gauge' },
  { label: 'Verified', value: 'verified', icon: 'shield' },
];

const HeroSlider = ({ filters, companies, resultCount, onFiltersChange, onSearch }: HeroSliderProps) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[760px] overflow-hidden md:min-h-[820px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img src={slides[current].image} alt={slides[current].title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/66 to-slate-950/28" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 mx-auto flex min-h-[760px] max-w-[1280px] flex-col justify-center px-4 pb-16 pt-28 md:min-h-[820px] md:px-8">
        <motion.div
          key={`text-${current}`}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-3xl text-white"
        >
          <span className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/12 px-4 py-2 text-sm font-semibold backdrop-blur">
            <ProIcon name="shield" size={16} />
            Multi-company rental marketplace
          </span>
          <h1 className="font-heading mt-5 text-4xl font-bold leading-tight md:text-6xl lg:text-7xl">
            {slides[current].title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/78 md:text-xl">
            {slides[current].subtitle}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.38 }}
          className="marketplace-shell mt-10 overflow-hidden bg-white/96 p-3 backdrop-blur-xl"
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

          <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-background p-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Location</span>
              <div className="flex items-center gap-2 rounded-md bg-secondary px-4 py-3">
                <MapPin className="text-primary" size={18} />
                <input
                  value={filters.location}
                  onChange={(event) => onFiltersChange({ ...filters, location: event.target.value })}
                  placeholder="City, branch, area"
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Pickup</span>
              <div className="flex items-center gap-2 rounded-md bg-secondary px-4 py-3">
                <ProIcon name="calendar" className="text-primary" size={18} />
                <span className="text-sm font-semibold text-foreground">Today or later</span>
              </div>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Compare</span>
              <div className="flex items-center gap-2 rounded-md bg-secondary px-4 py-3">
                <ProIcon name="search" className="text-primary" size={18} />
                <select
                  value={filters.company}
                  onChange={(event) => onFiltersChange({ ...filters, company: event.target.value })}
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-foreground outline-none"
                >
                  <option value="all">All companies</option>
                  {companies.map((company) => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>
            </label>
            <button
              type="button"
              onClick={onSearch}
              className="btn-primary-gradient flex items-center justify-center gap-2 rounded-md px-7 py-3.5 text-sm font-bold text-primary-foreground md:mb-0"
            >
              {resultCount > 0 ? `Search ${resultCount} rides` : 'Search rides'} <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
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
