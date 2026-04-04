import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useTenantStore';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, token, verifyToken } = useAuthStore();
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verify = async () => {
      if (token) {
        await verifyToken();
      }
      setIsVerifying(false);
    };
    verify();
  }, [token, verifyToken]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
