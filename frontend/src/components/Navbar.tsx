import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Menu, X } from 'lucide-react';
import BrandMark from '@/components/BrandMark';
import { ProIcon } from '@/components/ProIcons';
import { useStore } from '@/store/useStore';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, logout, user } = useStore();

  const navLinks = [
    { to: '/dashboard', label: 'Vehicles' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
    ...(isAuthenticated ? [
      { to: '/my-bookings', label: 'My Booking' },
      { to: '/profile', label: 'Profile' },
    ] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/94 backdrop-blur-xl">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between md:h-20">
          <Link to="/" className="group flex items-center gap-3" onClick={closeMenu}>
            <BrandMark logoClassName="h-12 w-12 md:h-14 md:w-14 transition-transform duration-300 group-hover:scale-[1.03]" />
          </Link>

          <div className="hidden items-center gap-1 rounded-lg border border-border bg-secondary/70 p-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  isActive(link.to)
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-medium text-muted-foreground">
                  <ProIcon name="user" size={15} />
                  Hi, {user?.name?.split(' ')[0]}
                </span>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="btn-primary-gradient rounded-md px-6 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Login
              </Link>
            )}
          </div>

          <button
            onClick={() => setIsOpen((value) => !value)}
            className="focus-ring rounded-md p-2 transition-colors hover:bg-secondary lg:hidden"
            aria-label="Toggle navigation"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-border bg-background/96 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMenu}
                  className={`rounded-md px-4 py-3 text-sm font-medium transition-all ${
                    isActive(link.to) ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {isAuthenticated ? (
                <button
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className="flex items-center gap-2 rounded-md px-4 py-3 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="btn-primary-gradient rounded-md px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
                >
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
