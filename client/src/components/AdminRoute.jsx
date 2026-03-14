import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Extends ProtectedRoute — also requires is_admin = true.
 */
export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading…</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_approved) return <Navigate to="/pending" replace />;
  if (!user.is_admin) return <Navigate to="/directory" replace />;

  return children;
}
