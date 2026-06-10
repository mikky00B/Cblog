import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getAdminToken } from '../../lib/api';

export function ProtectedAdmin() {
  const location = useLocation();
  if (!getAdminToken()) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
