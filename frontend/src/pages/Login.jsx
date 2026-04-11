import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore, useTenantStore } from '@/stores/useTenantStore';
import { API_URL } from '@/config';
import { Building2, Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

// Helper: XHR POST bypasses dev overlay fetch interception
function xhrPost(url, body) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        resolve({ ok: xhr.status >= 200 && xhr.status < 300, data });
      } catch {
        resolve({ ok: false, data: { detail: 'Error de conexión' } });
      }
    };
    xhr.onerror = () => reject(new Error('Error de red'));
    xhr.send(JSON.stringify(body));
  });
}

// Views: 'login' | 'reset-request' | 'reset-confirm' | 'reset-success'
export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoading, error, isAuthenticated, clearError } = useAuthStore();
  const { initTenant, currentTenant, subdomain } = useTenantStore();

  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  // Reset flow state
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  useEffect(() => { initTenant(); }, [initTenant]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(searchParams.get('redirect') || '/');
    }
  }, [isAuthenticated, navigate, searchParams]);
  
// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (error) clearError();
    if (localError) setLocalError('');
  }, [email, password]);

  useEffect(() => { setResetError(''); }, [resetEmail, resetCode, newPassword]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!email || !password) { setLocalError('Por favor, complete todos los campos'); return; }
    try {
      await login(email, password, subdomain);
      navigate('/');
    } catch (err) {
      setLocalError(err.message || 'Error de autenticación');
    }
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setResetError('');
    if (!resetEmail) { setResetError('Introduce tu email'); return; }
    setResetLoading(true);
    try {
      const { ok, data } = await xhrPost(`${API_URL}/api/auth/password-reset/request`, {
        email: resetEmail, tenant_id: subdomain
      });
      if (!ok) throw new Error(data.detail || 'Error al enviar');
      setView('reset-confirm');
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetConfirm = async (e) => {
    e.preventDefault();
    setResetError('');
    if (!resetCode || !newPassword) { setResetError('Completa todos los campos'); return; }
    if (newPassword.length < 4) { setResetError('La contraseña debe tener al menos 4 caracteres'); return; }
    setResetLoading(true);
    try {
      const { ok, data } = await xhrPost(`${API_URL}/api/auth/password-reset/confirm`, {
        token: resetCode, new_password: newPassword
      });
      if (!ok) throw new Error(data.detail || 'Error al restablecer');
      setView('reset-success');
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  const goBackToLogin = () => {
    setView('login');
    setResetEmail('');
    setResetCode('');
    setNewPassword('');
    setResetError('');
  };

  const fillDemoCredentials = (type) => {
    setEmail(type === 'admin' ? 'admin@santa-gadea.es' : 'secretaria@santa-gadea.es');
    setPassword('pass123');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: currentTenant?.primary_color || '#1e3a5f' }}
          >
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Centralita Virtual</h1>
          <p className="text-sm text-slate-400">{currentTenant?.nombre || 'Cargando...'}</p>
          <p className="text-xs text-slate-500 mt-1">
            Tenant: <span className="text-emerald-400">{subdomain}</span>
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">

          {/* ─── LOGIN VIEW ─── */}
          {view === 'login' && (
            <>
              <h2 className="text-xl font-semibold text-white mb-6">Iniciar Sesión</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@santa-gadea.es" className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      data-testid="login-email" autoComplete="email" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="password" className="text-slate-300">Contraseña</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="password" type={showPassword ? 'text' : 'password'} value={password}
                      onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                      className="pl-10 pr-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      data-testid="login-password" autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {(error || localError) && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error || localError}</span>
                  </div>
                )}

                <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11" data-testid="login-submit">
                  {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Iniciando sesión...</>) : 'Iniciar Sesión'}
                </Button>
              </form>

              <button data-testid="forgot-password-link" type="button" onClick={() => setView('reset-request')}
                className="block w-full text-center text-sm text-blue-400 hover:text-blue-300 mt-4 transition-colors">
                ¿Olvidaste tu contraseña?
              </button>

              <div className="mt-6 pt-6 border-t border-slate-800">
                <p className="text-xs text-slate-500 text-center mb-3">Credenciales de demostración</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => fillDemoCredentials('admin')}
                    className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors">Admin</button>
                  <button type="button" onClick={() => fillDemoCredentials('user')}
                    className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors">Secretaría</button>
                </div>
              </div>
            </>
          )}

          {/* ─── RESET REQUEST VIEW ─── */}
          {view === 'reset-request' && (
            <>
              <button data-testid="back-to-login" onClick={goBackToLogin}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver al login
              </button>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Recuperar contraseña</h2>
                  <p className="text-xs text-slate-400">Te enviaremos un código por email</p>
                </div>
              </div>
              <form onSubmit={handleResetRequest} className="space-y-4">
                <div>
                  <Label className="text-slate-300">Email de tu cuenta</Label>
                  <Input data-testid="reset-email" type="email" value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)} placeholder="tu@santa-gadea.es"
                    className="mt-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" required />
                </div>
                {resetError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{resetError}</span>
                  </div>
                )}
                <Button type="submit" disabled={resetLoading} data-testid="reset-request-submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11">
                  {resetLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</>) : 'Enviar código'}
                </Button>
              </form>
            </>
          )}

          {/* ─── RESET CONFIRM VIEW ─── */}
          {view === 'reset-confirm' && (
            <>
              <button data-testid="back-to-request" onClick={() => setView('reset-request')}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Introduce el código</h2>
                  <p className="text-xs text-slate-400">Enviado a <span className="text-white">{resetEmail}</span></p>
                </div>
              </div>
              <form onSubmit={handleResetConfirm} className="space-y-4">
                <div>
                  <Label className="text-slate-300">Código de 6 dígitos</Label>
                  <Input data-testid="reset-code" value={resetCode} onChange={(e) => setResetCode(e.target.value)}
                    placeholder="123456" maxLength={6} className="mt-1 bg-slate-800 border-slate-700 text-white text-center text-xl tracking-[0.3em] font-mono placeholder:text-slate-600"
                    required />
                </div>
                <div>
                  <Label className="text-slate-300">Nueva contraseña</Label>
                  <Input data-testid="reset-new-password" type="password" value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} placeholder="Nueva contraseña"
                    className="mt-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" required minLength={4} />
                </div>
                {resetError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{resetError}</span>
                  </div>
                )}
                <Button type="submit" disabled={resetLoading} data-testid="reset-confirm-submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11">
                  {resetLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Cambiando...</>) : 'Cambiar contraseña'}
                </Button>
              </form>
            </>
          )}

          {/* ─── SUCCESS VIEW ─── */}
          {view === 'reset-success' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Contraseña actualizada</h2>
              <p className="text-sm text-slate-400 mb-6">Ya puedes iniciar sesión con tu nueva contraseña</p>
              <Button data-testid="back-to-login-success" onClick={goBackToLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11">
                Ir al login
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">Centralita Virtual IA © 2026</p>
      </div>
    </div>
  );
}
