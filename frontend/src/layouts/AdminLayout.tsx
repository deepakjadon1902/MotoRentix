import { NavLink, Outlet, Link } from "react-router-dom";
import {
  BarChart3,
  Bike,
  BookOpenCheck,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Shield,
  Store,
  Users,
} from "lucide-react";
import { useAdminStore } from '@/store/adminStore';

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/clients", label: "Clients", icon: Store },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/admin/vehicles", label: "Vehicles", icon: Bike },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/bookings", label: "Bookings", icon: BookOpenCheck },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare },
];

const AdminLayout = () => {
  const { user, logout } = useAdminStore();

  return (
    <div className="min-h-screen bg-slate-950 text-foreground">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(15,23,42,0.88)_34%,rgba(248,250,252,1)_34%)]" />
      <div className="relative z-10">
        <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1480px] flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8">
            <Link to="/admin" className="flex items-center gap-3 text-white">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Shield size={21} />
              </span>
              <div>
                <p className="font-heading text-xl font-bold leading-none">MotoRentix Control</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-white/50">Super admin</p>
              </div>
            </Link>

            <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">{user?.email}</span>
              <button
                onClick={logout}
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-slate-950 transition hover:bg-white/90"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-[1480px] grid-cols-1 gap-6 px-4 py-6 md:px-8 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit rounded-2xl border border-white/10 bg-white/95 p-3 shadow-xl shadow-slate-950/10 backdrop-blur-xl lg:sticky lg:top-6">
            <div className="mb-3 hidden rounded-xl bg-slate-950 p-4 text-white lg:block">
              <BarChart3 className="text-primary" size={22} />
              <p className="mt-3 font-heading text-lg font-bold">Platform Command</p>
              <p className="mt-1 text-xs text-white/60">Clients, revenue, subscriptions, and fleet oversight.</p>
            </div>

            <nav className="scroll-fade-x flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `flex min-w-max items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
                    }`
                  }
                >
                  <link.icon size={16} />
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </aside>

          <main className="min-w-0 animate-soft-pop">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
