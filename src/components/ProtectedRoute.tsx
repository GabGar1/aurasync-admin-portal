import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { can, homePathFor, type Permission } from '@/lib/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Omit to only require a signed-in user. */
  permission?: Permission;
}

export default function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (permission && !can(user.role, permission)) {
    return <Navigate to={homePathFor(user.role)} replace />;
  }
  return <>{children}</>;
}
