import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminStore } from '@/store/adminStore';

const AdminGuard = () => {
  const isAdminAuthenticated = useAdminStore(state => state.isAdminAuthenticated);
  const location = useLocation();

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default AdminGuard;
