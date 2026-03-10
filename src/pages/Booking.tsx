import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarDays, Clock } from 'lucide-react';
import { vehicles } from '@/data/vehicles';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addBooking, isAuthenticated } = useStore();
  const vehicle = vehicles.find(v => v.id === id);

  const [durationType, setDurationType] = useState<'hour' | 'day'>('day');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const totalCharges = useMemo(() => {
    if (!vehicle || !startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return 0;
    if (durationType === 'day') {
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return days * vehicle.pricePerDay;
    } else {
      const hours = Math.ceil(diffMs / (1000 * 60 * 60));
      return hours * vehicle.pricePerHour;
    }
  }, [vehicle, startDate, endDate, durationType]);

  if (!vehicle) {
    return (
      <div className="section-padding min-h-screen flex items-center justify-center">
        <h2 className="font-heading text-2xl font-bold text-foreground">Vehicle not found</h2>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="section-padding min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="font-heading text-2xl font-bold text-foreground">Please login to book</h2>
          <Link to="/login" className="btn-primary-gradient px-6 py-3 rounded-lg text-primary-foreground font-semibold inline-block">Login</Link>
        </div>
      </div>
    );
  }

  const handleConfirm = () => {
    if (!startDate || !endDate || totalCharges <= 0) {
      toast.error('Please select valid dates');
      return;
    }
    addBooking({
      id: `b-${Date.now()}`,
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      vehicleImage: vehicle.image,
      durationType,
      startDate,
      endDate,
      totalCharges,
      bookingDate: new Date().toISOString().split('T')[0],
      status: 'Confirmed',
    });
    toast.success('Booking confirmed!');
    navigate('/my-bookings');
  };

  return (
    <div className="section-padding bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={18} /> Back
        </button>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-3xl font-bold text-foreground mb-8">
          Book {vehicle.name}
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-3 space-y-6">
            <div className="glass rounded-2xl p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Vehicle</label>
                <div className="glass rounded-lg p-3 flex items-center gap-4">
                  <img src={vehicle.image} alt={vehicle.name} className="w-16 h-12 object-cover rounded-lg" />
                  <div>
                    <p className="font-semibold text-foreground">{vehicle.name}</p>
                    <p className="text-xs text-muted-foreground">{vehicle.category}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Duration Type</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDurationType('hour')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium text-sm transition-all ${durationType === 'hour' ? 'bg-primary text-primary-foreground' : 'glass text-foreground hover:bg-secondary'}`}
                  >
                    <Clock size={16} /> Per Hour
                  </button>
                  <button
                    onClick={() => setDurationType('day')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium text-sm transition-all ${durationType === 'day' ? 'bg-primary text-primary-foreground' : 'glass text-foreground hover:bg-secondary'}`}
                  >
                    <CalendarDays size={16} /> Per Day
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Start Date</label>
                  <input
                    type={durationType === 'hour' ? 'datetime-local' : 'date'}
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-secondary text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">End Date</label>
                  <input
                    type={durationType === 'hour' ? 'datetime-local' : 'date'}
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-secondary text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={totalCharges <= 0}
                className="w-full btn-primary-gradient py-3.5 rounded-xl font-semibold text-primary-foreground text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Booking
              </button>
            </div>
          </motion.div>

          {/* Summary */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2">
            <div className="glass rounded-2xl p-6 sticky top-24 space-y-4">
              <h3 className="font-heading text-lg font-bold text-foreground">Booking Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Vehicle</span><span className="font-medium text-foreground">{vehicle.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span className="font-medium text-foreground">₹{durationType === 'hour' ? vehicle.pricePerHour + '/hr' : vehicle.pricePerDay + '/day'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Start</span><span className="font-medium text-foreground">{startDate || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">End</span><span className="font-medium text-foreground">{endDate || '—'}</span></div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-heading text-xl font-bold text-primary">₹{totalCharges}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
