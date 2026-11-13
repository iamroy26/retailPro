import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
  <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
  </div>
);

export default function ProtectedRoute() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  if (isLoadingAuth) return <LoadingScreen />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
