import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

/**
 * ProtectedRoute — Wraps content that requires authentication.
 * Redirects to /login if the user is not authenticated.
 * Shows a loading spinner while checking auth state on initial load.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking token validity on app mount
  if (isLoading) {
    return (
      <div className="login-page">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
          <span className="font-label-sm" style={{ color: 'var(--on-surface-variant)' }}>
            Verifying session...
          </span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
