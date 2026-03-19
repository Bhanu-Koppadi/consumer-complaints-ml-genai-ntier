import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { LoadingSpinner } from './LoadingSpinner';

interface PrivateRouteProps {
  children: ReactNode;
  allowAdmin?: boolean;
}

/**
 * Renders children when the user is authenticated.
 * Shows a loading spinner while session bootstrap is in progress.
 * Redirects unauthenticated users to /login.
 */
export function PrivateRoute({ children, allowAdmin = true }: PrivateRouteProps) {
  const { isAuthenticated, loading, user } = useAppSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Restoring session…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // User-only pages should redirect admins to the dashboard.
  if (!allowAdmin && user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
