import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

const Register = () => {
  const [form, setForm] = useState({
    name: '', email: '', dob: '', password: '',
    address: '', city: '', pincode: '', aadhaar: '',
  });
  const [showPw, setShowPw] = useState(false);
  const { register } = useStore();
  const navigate = useNavigate();

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { password, ...profile } = form;
    if (Object.values(form).some(v => !v.trim())) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    register(profile, password);
    toast.success('Account created successfully!');
    navigate('/');
  };

  const fields: { key: string; label: string; type: string; placeholder: string; half?: boolean }[] = [
    { key: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
    { key: 'dob', label: 'Date of Birth', type: 'date', placeholder: '', half: true },
    { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••', half: true },
    { key: 'address', label: 'Address', type: 'text', placeholder: '42 MG Road' },
    { key: 'city', label: 'City', type: 'text', placeholder: 'Bangalore', half: true },
    { key: 'pincode', label: 'Pincode', type: 'text', placeholder: '560001', half: true },
    { key: 'aadhaar', label: 'Aadhaar Number', type: 'text', placeholder: 'XXXX-XXXX-XXXX' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center section-padding bg-secondary">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg glass rounded-2xl p-8 space-y-6"
      >
        <div className="text-center">
          <img src={logo} alt="MotoRentix" className="h-14 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold text-foreground">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Join MotoRentix and start riding today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(f => {
              const isPassword = f.key === 'password';
              return (
                <div key={f.key} className={f.half ? '' : 'sm:col-span-2'}>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{f.label}</label>
                  <div className="relative">
                    <input
                      type={isPassword ? (showPw ? 'text' : 'password') : f.type}
                      value={(form as any)[f.key]}
                      onChange={e => update(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full px-4 py-3 rounded-lg bg-secondary text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                    {isPassword && (
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button type="submit" className="w-full btn-primary-gradient py-3 rounded-lg font-semibold text-primary-foreground">
            Create Account
          </button>
        </form>

        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">Login</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
