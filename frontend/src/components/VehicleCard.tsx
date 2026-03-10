import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Vehicle } from '@/data/vehicles';

interface VehicleCardProps {
  vehicle: Vehicle;
  index?: number;
}

const VehicleCard = ({ vehicle, index = 0 }: VehicleCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div className="glass rounded-2xl overflow-hidden metallic-hover group">
        <div className="relative overflow-hidden aspect-[4/3]">
          <img
            src={vehicle.image}
            alt={vehicle.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute top-3 right-3 glass rounded-full px-3 py-1 flex items-center gap-1">
            <Star size={14} className="fill-warning text-warning" />
            <span className="text-xs font-semibold text-foreground">{vehicle.rating}</span>
          </div>
          {!vehicle.available && (
            <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
              <span className="bg-accent text-accent-foreground px-4 py-2 rounded-lg font-semibold text-sm">
                Not Available
              </span>
            </div>
          )}
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-lg text-foreground">{vehicle.name}</h3>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
              {vehicle.category}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <span className="text-xs text-muted-foreground">Per Hour</span>
              <p className="font-heading font-bold text-foreground">₹{vehicle.pricePerHour}</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <span className="text-xs text-muted-foreground">Per Day</span>
              <p className="font-heading font-bold text-foreground">₹{vehicle.pricePerDay}</p>
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
