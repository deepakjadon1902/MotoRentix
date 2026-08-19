import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import BrandMark from '@/components/BrandMark';
import bikeHero from '@/assets/hero-bike-2.jpg';
import GoogleButton from '@/components/auth/GoogleButton';
import { apiUrl } from '@/lib/apiBase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    const result = await login(email, password);
    if (result.ok) {
      toast.success('Welcome back!');
      navigate(result.user?.role === "owner" || result.user?.role === "staff" ? "/tenant" : "/profile");
    } else {
      const message = result.message || 'Login failed';
      toast.error(message);
    }
  };

  const googleHref = `${apiUrl("/auth/google")}?role=user&next=${encodeURIComponent("/profile")}`;

  return (
    <div className="min-h-screen relative flex items-center justify-center section-padding bg-secondary overflow-hidden">
      <div className="absolute inset-0">
        <img src={bikeHero} alt="" className="h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/80 to-background/95" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass relative z-10 grid w-full max-w-4xl overflow-hidden rounded-lg border border-border/60 md:grid-cols-[1.1fr_0.9fr]"
      >
        <div
          className="hidden md:flex flex-col justify-between p-10 bg-cover bg-center text-background"
          style={{
            backgroundImage: `linear-gradient(140deg, rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.4)), url(${bikeHero})`,
          }}
        >
          <div className="flex items-center gap-3">
            <BrandMark inverted logoClassName="h-12 w-12" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] opacity-80">Member Access</p>
            <h1 className="mt-3 font-heading text-4xl font-bold">Welcome back.</h1>
            <p className="mt-3 text-sm text-white/80 max-w-sm">
              Log in to manage bookings, track rides, and discover the newest bikes.
            </p>
          </div>
        </div>

        <div className="p-8 md:p-10 bg-background/80">
          <div className="text-center md:text-left mb-6">
            <BrandMark compact className="justify-center md:justify-start" logoClassName="h-12 w-12 mx-auto md:mx-0" />
            <h2 className="font-heading text-2xl font-bold text-foreground mt-4">User Login</h2>
            <p className="text-sm text-muted-foreground mt-1">Access your MotoRentix account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                  className="w-full rounded-md border border-border bg-secondary/60 px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-foreground">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="w-full rounded-md border border-border bg-secondary/60 px-4 py-3 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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

            <button type="submit" className="w-full btn-primary-gradient rounded-md py-3 font-semibold text-primary-foreground">
              Login
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-[0.2em]">
              <span className="bg-background/80 px-3 text-muted-foreground">or</span>
            </div>
          </div>

          <GoogleButton href={googleHref} disabled={googleLoading} />

          <p className="text-sm text-center md:text-left text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">Register</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
