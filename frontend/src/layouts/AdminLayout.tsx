import { Outlet, Link } from 'react-router-dom';
import { useAdminStore } from '@/store/adminStore';

const AdminLayout = () => {
  const { user, logout } = useAdminStore();

  return (
    <div className="min-h-screen bg-secondary">
      <header className="border-b border-border bg-background">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/admin" className="font-heading text-xl font-bold text-foreground">MotoRentix Admin</Link>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{user?.email}</span>
            <button onClick={logout} className="btn-primary-gradient px-4 py-2 rounded-lg text-primary-foreground font-semibold">
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
