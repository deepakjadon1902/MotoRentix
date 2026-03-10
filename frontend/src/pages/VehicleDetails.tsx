import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, CheckCircle, XCircle } from 'lucide-react';
import { vehicles } from '@/data/vehicles';
import { useStore } from '@/store/useStore';

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useStore();
  const vehicle = vehicles.find(v => v.id === id);

  if (!vehicle) {
    return (
      <div className="section-padding min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground">Vehicle not found</h2>
          <Link to="/dashboard" className="text-primary mt-4 inline-block hover:underline">← Back to dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding bg-background min-h-screen">
      <div className="container mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={18} /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl overflow-hidden">
            <img src={vehicle.image} alt={vehicle.name} className="w-full h-full object-cover rounded-2xl" />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
                {vehicle.category}
              </span>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3">{vehicle.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Star size={18} className="fill-warning text-warning" />
                <span className="font-semibold text-foreground">{vehicle.rating}</span>
                <span className="text-muted-foreground text-sm">/ 5.0</span>
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed">{vehicle.description}</p>

            <div className="glass rounded-xl p-6 flex items-center gap-8">
              <div>
                <span className="text-sm text-muted-foreground">Per Hour</span>
                <p className="font-heading text-2xl font-bold text-foreground">₹{vehicle.pricePerHour}</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div>
                <span className="text-sm text-muted-foreground">Per Day</span>
                <p className="font-heading text-2xl font-bold text-foreground">₹{vehicle.pricePerDay}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {vehicle.available ? (
                  <><CheckCircle size={18} className="text-success" /><span className="text-sm font-medium text-success">Available</span></>
                ) : (
                  <><XCircle size={18} className="text-accent" /><span className="text-sm font-medium text-accent">Unavailable</span></>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-heading text-xl font-bold text-foreground mb-4">Specifications</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {vehicle.specifications.map(spec => (
                  <div key={spec.label} className="glass rounded-lg p-3">
                    <span className="text-xs text-muted-foreground">{spec.label}</span>
                    <p className="font-semibold text-foreground text-sm">{spec.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {vehicle.available && (
              <Link
                to={isAuthenticated ? `/booking/${vehicle.id}` : '/login'}
                className="block w-full text-center btn-primary-gradient py-3.5 rounded-xl font-semibold text-primary-foreground text-lg"
              >
                Book Now
              </Link>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;
