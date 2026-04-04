import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore, useTenantStore } from '@/stores/useTenantStore';
import { Building2, Lock, Mail, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoading, error, isAuthenticated, clearError } = useAuthStore();
  const { initTenant, currentTenant, subdomain } = useTenantStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  // Initialize tenant on mount
  useEffect(() => {
    initTenant();
  }, [initTenant]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = searchParams.get('redirect') || '/';
      navigate(redirectTo);
    }
  }, [isAuthenticated, navigate, searchParams]);

  // Clear errors on input change
  useEffect(() => {
    if (error) clearError();
    if (localError) setLocalError('');
  }, [email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Por favor, complete todos los campos');
      return;
    }

    try {
      await login(email, password, subdomain);
      navigate('/');
    } catch (err) {
      setLocalError(err.message || 'Error de autenticación');
    }
  };

  // Demo credentials autofill
  const fillDemoCredentials = (type) => {
    if (type === 'admin') {
      setEmail('admin@santa-gadea.es');
      setPassword('pass123');
    } else {
      setEmail('secretaria@santa-gadea.es');
      setPassword('pass123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & Tenant Info */}
        <div className="text-center mb-8">
          <div 
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: currentTenant?.primary_color || '#1e3a5f' }}
          >
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Centralita Virtual
          </h1>
          <p className="text-sm text-slate-400">
            {currentTenant?.nombre || 'Cargando...'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Tenant: <span className="text-emerald-400">{subdomain}</span>
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@santa-gadea.es"
                  className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  data-testid="login-email"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-slate-300">Contraseña</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  data-testid="login-password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {(error || localError) && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error || localError}</span>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
              data-testid="login-submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-xs text-slate-500 text-center mb-3">
              Credenciales de demostración
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fillDemoCredentials('admin')}
                className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('user')}
                className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
              >
                Secretaría
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Centralita Virtual IA © 2026
        </p>
      </div>
    </div>
  );
}
