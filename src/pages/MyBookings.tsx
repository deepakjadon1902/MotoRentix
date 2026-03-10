import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Link } from 'react-router-dom';
import { CalendarDays, IndianRupee, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const statusConfig = {
  Confirmed: { icon: CheckCircle, className: 'text-primary bg-primary/10' },
  Completed: { icon: AlertCircle, className: 'text-success bg-success/10' },
  Cancelled: { icon: XCircle, className: 'text-accent bg-accent/10' },
};

const MyBookings = () => {
  const { bookings, isAuthenticated } = useStore();

  if (!isAuthenticated) {
    return (
      <div className="section-padding min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="font-heading text-2xl font-bold text-foreground">Please login to view bookings</h2>
          <Link to="/login" className="btn-primary-gradient px-6 py-3 rounded-lg text-primary-foreground font-semibold inline-block">Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">My Bookings</h1>
          <p className="text-muted-foreground mt-2">Track all your rental history</p>
        </motion.div>

        {bookings.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <CalendarDays size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="font-heading text-xl font-bold text-foreground">No bookings yet</h3>
            <p className="text-muted-foreground mt-2 mb-6">Start exploring our vehicles and book your first ride!</p>
            <Link to="/dashboard" className="btn-primary-gradient px-6 py-3 rounded-lg text-primary-foreground font-semibold inline-block">Browse Vehicles</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking, i) => {
              const { icon: StatusIcon, className } = statusConfig[booking.status];
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4"
                >
                  <div className="flex-1 space-y-2">
                    <h3 className="font-heading text-lg font-bold text-foreground">{booking.vehicleName}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock size={14} /> {booking.durationType === 'hour' ? 'Hourly' : 'Daily'}</span>
                      <span className="flex items-center gap-1"><CalendarDays size={14} /> {booking.startDate} → {booking.endDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">Charges</span>
                      <p className="font-heading font-bold text-foreground flex items-center gap-0.5"><IndianRupee size={14} />{booking.totalCharges}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${className}`}>
                      <StatusIcon size={14} />
                      {booking.status}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
