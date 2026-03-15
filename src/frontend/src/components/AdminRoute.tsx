import type { ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { LoadingSpinner } from './LoadingSpinner';

interface AdminRouteProps {
  children: ReactNode;
}

/**
 * Renders children only for authenticated users with role ADMIN.
 * Shows a loading spinner while session bootstrap is in progress.
 * Redirects unauthenticated users to /login.
 * Shows a full-page "Access Denied" message for authenticated non-admin users.
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, loading, user } = useAppSelector(
    (state) => state.auth
  );

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

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 text-sm mb-6">
            You do not have permission to view this page. Admin access is
            required.
          </p>
          <Link
            to="/"
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
