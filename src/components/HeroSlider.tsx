import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroBike1 from '@/assets/hero-bike-1.jpg';
import heroScooter1 from '@/assets/hero-scooter-1.jpg';
import heroBike2 from '@/assets/hero-bike-2.jpg';
import heroScooter2 from '@/assets/hero-scooter-2.jpg';

const slides = [
  { image: heroBike1, title: 'Feel the Power', subtitle: 'Premium sports bikes at your fingertips' },
  { image: heroScooter1, title: 'Ride Electric', subtitle: 'Eco-friendly scooters for the modern commuter' },
  { image: heroBike2, title: 'Born to Ride', subtitle: 'Unleash your inner rider with our top machines' },
  { image: heroScooter2, title: 'City Freedom', subtitle: 'Navigate the city with style and ease' },
];

const HeroSlider = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-[85vh] md:h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img
            src={slides[current].image}
            alt={slides[current].title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 container mx-auto px-4 lg:px-8 h-full flex items-center">
        <motion.div
          key={`text-${current}`}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-2xl"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary-foreground text-sm font-medium mb-4 backdrop-blur-sm border border-primary-foreground/20">
            🏍️ MotoRentix
          </span>
          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-background mb-4 leading-tight">
            {slides[current].title}
          </h1>
          <p className="text-lg md:text-xl text-background/80 mb-8 max-w-lg">
            {slides[current].subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/dashboard"
              className="btn-primary-gradient px-8 py-3.5 rounded-xl font-semibold text-primary-foreground flex items-center justify-center gap-2"
            >
              Explore Vehicles <ChevronRight size={18} />
            </Link>
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl font-semibold border-2 border-background/30 text-background hover:bg-background/10 transition-colors text-center"
            >
              Get Started
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-500 ${i === current ? 'w-8 bg-primary' : 'w-2 bg-background/50'}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;
