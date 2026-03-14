import { NavLink, Outlet, Link } from "react-router-dom";
import { useAdminStore } from '@/store/adminStore';

const AdminLayout = () => {
  const { user, logout } = useAdminStore();

  return (
    <div className="min-h-screen admin-shell">
      <header className="border-b border-border bg-background">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/admin/analytics" className="font-heading text-xl font-bold text-foreground">MotoRentix Admin</Link>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{user?.email}</span>
            <button onClick={logout} className="btn-primary-gradient px-4 py-2 rounded-lg text-primary-foreground font-semibold">
              Logout
            </button>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        <aside className="bg-background border border-border rounded-2xl p-4 h-fit">
          <nav className="flex flex-col gap-1">
            {[
              { to: "/admin/analytics", label: "Analytics" },
              { to: "/admin/vehicles", label: "Vehicles" },
              { to: "/admin/users", label: "Users" },
              { to: "/admin/bookings", label: "Bookings" },
              { to: "/admin/messages", label: "Messages" },
            ].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/admin/analytics"}
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
  );
};

export default AdminLayout;
