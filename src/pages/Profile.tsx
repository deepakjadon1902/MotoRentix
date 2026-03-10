import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Link } from 'react-router-dom';
import { User, Mail, MapPin, Calendar, Hash, IndianRupee, Bookmark } from 'lucide-react';

const Profile = () => {
  const { user, bookings, isAuthenticated } = useStore();

  if (!isAuthenticated || !user) {
    return (
      <div className="section-padding min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="font-heading text-2xl font-bold text-foreground">Please login to view profile</h2>
          <Link to="/login" className="btn-primary-gradient px-6 py-3 rounded-lg text-primary-foreground font-semibold inline-block">Login</Link>
        </div>
      </div>
    );
  }

  const totalSpent = bookings.reduce((sum, b) => sum + b.totalCharges, 0);

  return (
    <div className="section-padding bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
            Welcome back, <span className="text-gradient-primary">{user.name.split(' ')[0]}</span>
          </h1>
          <p className="text-muted-foreground mt-2">Manage your account and view your stats</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bookmark className="text-primary" size={24} />
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Total Bookings</span>
              <p className="font-heading text-2xl font-bold text-foreground">{bookings.length}</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <IndianRupee className="text-accent" size={24} />
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Total Spent</span>
              <p className="font-heading text-2xl font-bold text-foreground">₹{totalSpent}</p>
            </div>
          </motion.div>
        </div>

        {/* User Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-6 mb-8">
          <h2 className="font-heading text-xl font-bold text-foreground mb-5">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { icon: User, label: 'Name', value: user.name },
              { icon: Mail, label: 'Email', value: user.email },
              { icon: Calendar, label: 'Date of Birth', value: user.dob },
              { icon: MapPin, label: 'Address', value: user.address },
              { icon: MapPin, label: 'City', value: user.city },
              { icon: Hash, label: 'Pincode', value: user.pincode },
              { icon: Hash, label: 'Aadhaar', value: user.aadhaar },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon size={16} className="text-muted-foreground" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <p className="text-sm font-medium text-foreground">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Booking history table */}
        {bookings.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="font-heading text-xl font-bold text-foreground">Booking History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Vehicle</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Duration</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-right px-6 py-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-right px-6 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{b.vehicleName}</td>
                      <td className="px-6 py-4 text-muted-foreground">{b.startDate} → {b.endDate}</td>
                      <td className="px-6 py-4 text-muted-foreground">{b.bookingDate}</td>
                      <td className="px-6 py-4 text-right font-medium text-foreground">₹{b.totalCharges}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${b.status === 'Confirmed' ? 'bg-primary/10 text-primary' : b.status === 'Completed' ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent'}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Profile;
