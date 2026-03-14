import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo.jpeg';
import adminHero from '@/assets/hero-scooter-2.jpg';
import { useAdminStore } from '@/store/adminStore';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const login = useAdminStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    const result = await login(email, password);
    if (result.ok) {
      toast.success('Admin access granted');
      navigate('/admin');
    } else {
      const message = result.message || 'Login failed';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center section-padding bg-background overflow-hidden">
      <div className="absolute inset-0">
        <img src={adminHero} alt="" className="h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-background/90" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-4xl glass rounded-3xl overflow-hidden border border-border/60 grid md:grid-cols-[0.9fr_1.1fr]"
      >
        <div className="p-8 md:p-10 bg-background/85">
          <div className="text-center md:text-left mb-6">
            <img
              src={logo}
              alt="MotoRentix"
              className="h-12 w-12 rounded-full object-cover mx-auto md:mx-0 ring-2 ring-border/70"
            />
            <h2 className="font-heading text-2xl font-bold text-foreground mt-4">Admin Login</h2>
            <p className="text-sm text-muted-foreground mt-1">Secure access to the admin console</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-4 py-3 rounded-xl bg-secondary/60 text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/60 text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full btn-primary-gradient py-3 rounded-xl font-semibold text-primary-foreground">
              Login
            </button>
          </form>
        </div>

        <div
          className="hidden md:flex flex-col justify-between p-10 bg-cover bg-center text-background"
          style={{
            backgroundImage: `linear-gradient(140deg, rgba(12, 20, 35, 0.9), rgba(12, 20, 35, 0.45)), url(${adminHero})`,
          }}
        >
          <div className="flex items-center gap-3">
            <img src={logo} alt="MotoRentix" className="h-12 w-12 rounded-full object-cover ring-2 ring-white/60" />
            <span className="font-heading text-xl font-bold">MotoRentix</span>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] opacity-80">Control Center</p>
            <h1 className="mt-3 font-heading text-4xl font-bold">Analytics first.</h1>
            <p className="mt-3 text-sm text-white/80 max-w-sm">
              Track fleet performance, bookings, and revenue with real time insights.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
