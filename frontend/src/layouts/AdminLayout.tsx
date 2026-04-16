import { NavLink, Outlet, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAdminStore } from '@/store/adminStore';

const AdminLayout = () => {
  const { user, logout } = useAdminStore();
  const [bgIndex, setBgIndex] = useState(0);

  const backgrounds = useMemo(
    () => ["/admin-bg/admin-bike-1.jpg", "/admin-bg/admin-bike-2.jpg", "/admin-bg/admin-scooter-1.jpg"],
    []
  );

  useEffect(() => {
    const id = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgrounds.length);
    }, 5000);
    return () => clearInterval(id);
  }, [backgrounds.length]);

  return (
    <div className="min-h-screen relative text-foreground">
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
        style={{ backgroundImage: `url(${backgrounds[bgIndex]})` }}
      />
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px]" />

      <div className="relative z-10">
        <header className="border-b border-white/10 bg-slate-950/40">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/admin" className="font-heading text-xl font-bold text-white">MotoRentix Admin</Link>
            <div className="flex items-center gap-4 text-sm text-white/70">
              <span>{user?.email}</span>
              <button onClick={logout} className="btn-primary-gradient px-4 py-2 rounded-lg text-primary-foreground font-semibold">
                Logout
              </button>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          <aside className="bg-white/85 border border-white/20 rounded-2xl p-4 h-fit backdrop-blur">
            <nav className="flex flex-col gap-1">
              {[
                { to: "/admin", label: "Dashboard" },
                { to: "/admin/vehicles", label: "Vehicles" },
                { to: "/admin/users", label: "Users" },
                { to: "/admin/bookings", label: "Bookings" },
                { to: "/admin/messages", label: "Messages" },
              ].map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/admin"}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </aside>
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
