import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Link } from 'react-router-dom';
import { CalendarDays, IndianRupee, Clock, CheckCircle, XCircle, AlertCircle, Bike } from 'lucide-react';
import { vehicles } from '@/data/vehicles';

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
          <div className="space-y-5">
            {bookings.map((booking, i) => {
              const { icon: StatusIcon, className } = statusConfig[booking.status];
              const vehicleData = vehicles.find(v => v.id === booking.vehicleId);
              const vehicleImage = booking.vehicleImage || vehicleData?.image;
              const vehicleCategory = vehicleData?.category;
              const vehiclePricePerHour = vehicleData?.pricePerHour;
              const vehiclePricePerDay = vehicleData?.pricePerDay;

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass rounded-2xl overflow-hidden metallic-hover"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Vehicle Image */}
                    <div className="md:w-56 lg:w-64 shrink-0">
                      {vehicleImage ? (
                        <img
                          src={vehicleImage}
                          alt={booking.vehicleName}
                          className="w-full h-48 md:h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 md:h-full bg-secondary flex items-center justify-center">
                          <Bike size={48} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-heading text-xl font-bold text-foreground">{booking.vehicleName}</h3>
                            {vehicleCategory && (
                              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary mt-1 inline-block">
                                {vehicleCategory}
                              </span>
                            )}
                          </div>
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${className}`}>
                            <StatusIcon size={14} />
                            {booking.status}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                          <div className="bg-secondary/60 rounded-lg p-3">
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={12} /> Duration</span>
                            <p className="text-sm font-semibold text-foreground mt-0.5">{booking.durationType === 'hour' ? 'Hourly' : 'Daily'}</p>
                          </div>
                          <div className="bg-secondary/60 rounded-lg p-3">
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><CalendarDays size={12} /> Period</span>
                            <p className="text-sm font-semibold text-foreground mt-0.5">{booking.startDate}</p>
                            <p className="text-xs text-muted-foreground">to {booking.endDate}</p>
                          </div>
                          <div className="bg-secondary/60 rounded-lg p-3">
                            <span className="text-xs text-muted-foreground">Rate</span>
                            <p className="text-sm font-semibold text-foreground mt-0.5">
                              ₹{booking.durationType === 'hour' ? vehiclePricePerHour : vehiclePricePerDay}
                              <span className="text-xs text-muted-foreground">/{booking.durationType === 'hour' ? 'hr' : 'day'}</span>
                            </p>
                          </div>
                          <div className="bg-secondary/60 rounded-lg p-3">
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><IndianRupee size={12} /> Total</span>
                            <p className="text-sm font-bold text-primary mt-0.5">₹{booking.totalCharges}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                        <span className="text-xs text-muted-foreground">Booked on {booking.bookingDate}</span>
                        <Link
                          to={`/vehicle/${booking.vehicleId}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          View Vehicle →
                        </Link>
                      </div>
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
