import { motion } from 'framer-motion';
import VehicleCard from '@/components/VehicleCard';
import { vehicles } from '@/data/vehicles';

const Dashboard = () => {
  const bikes = vehicles.filter(v => v.category === 'Bike');
  const scooters = vehicles.filter(v => v.category === 'Scooter');

  return (
    <div className="section-padding bg-background min-h-screen">
      <div className="container mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">All Vehicles</h1>
          <p className="text-muted-foreground mt-2">Browse our complete fleet of bikes and scooters</p>
        </motion.div>

        <section className="mb-12">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            🏍️ Bikes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bikes.map((v, i) => <VehicleCard key={v.id} vehicle={v} index={i} />)}
          </div>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            🛵 Scooters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scooters.map((v, i) => <VehicleCard key={v.id} vehicle={v} index={i} />)}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
