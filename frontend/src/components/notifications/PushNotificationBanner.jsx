import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { Bell, BellRing, BellOff, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function PushNotificationBanner() {
  const { isSupported, permission, requestPermission } = usePushNotifications();
  const { pushEnabled, setPushEnabled } = useNotificationStore();
  const [dismissed, setDismissed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // Check if we should show the banner
  const shouldShow = isSupported && 
                     permission === 'default' && 
                     !dismissed && 
                     !pushEnabled;

  const handleEnable = async () => {
    setIsRequesting(true);
    const result = await requestPermission();
    setIsRequesting(false);
    
    if (result === 'granted') {
      setPushEnabled(true);
      toast.success('Notificaciones push activadas', {
        description: 'Recibirás alertas incluso cuando no tengas la app abierta'
      });
      setDismissed(true);
    } else if (result === 'denied') {
      toast.error('Permiso denegado', {
        description: 'Puedes activarlo desde la configuración del navegador'
      });
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('push-banner-dismissed', 'true');
  };

  // Check localStorage on mount
  useEffect(() => {
    const wasDismissed = localStorage.getItem('push-banner-dismissed');
    if (wasDismissed) setDismissed(true);
  }, []);

  if (!shouldShow) return null;

  return (
    <div 
      data-testid="push-notification-banner"
      className={cn(
        "fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50",
        "bg-gradient-to-r from-blue-600 to-indigo-600",
        "rounded-xl shadow-lg shadow-blue-500/20 border border-blue-400/20",
        "p-4 animate-in slide-in-from-bottom-4 duration-300"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
          <BellRing className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white">
            Activar notificaciones
          </h4>
          <p className="text-xs text-blue-100 mt-0.5">
            Recibe alertas de incidencias urgentes y llamadas derivadas al instante
          </p>
          
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleEnable}
              disabled={isRequesting}
              data-testid="enable-push-btn"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                "bg-white text-blue-600 hover:bg-blue-50 transition-colors",
                isRequesting && "opacity-50 cursor-not-allowed"
              )}
            >
              {isRequesting ? (
                <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              Activar
            </button>
            
            <button
              onClick={handleDismiss}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
            >
              Ahora no
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Small status indicator for settings page
export function PushNotificationStatus() {
  const { isSupported, permission, requestPermission } = usePushNotifications();
  const { pushEnabled, setPushEnabled } = useNotificationStore();

  const handleToggle = async () => {
    if (permission === 'granted') {
      setPushEnabled(!pushEnabled);
      toast.success(pushEnabled ? 'Notificaciones push desactivadas' : 'Notificaciones push activadas');
    } else if (permission === 'default') {
      const result = await requestPermission();
      if (result === 'granted') {
        setPushEnabled(true);
        toast.success('Notificaciones push activadas');
      }
    } else {
      toast.error('Permiso denegado por el navegador', {
        description: 'Cambia los permisos en la configuración del navegador'
      });
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <BellOff className="w-5 h-5 text-slate-500" />
        <div>
          <p className="text-sm text-slate-400">Notificaciones push no soportadas</p>
          <p className="text-xs text-slate-500">Tu navegador no soporta esta función</p>
        </div>
      </div>
    );
  }

  const getStatusInfo = () => {
    if (permission === 'denied') {
      return {
        icon: <BellOff className="w-5 h-5 text-red-400" />,
        title: 'Bloqueadas por el navegador',
        description: 'Permite notificaciones en la configuración del navegador',
        buttonText: 'Ver cómo activar',
        buttonAction: () => {
          toast.info('Configuración del navegador', {
            description: 'Ve a Configuración → Privacidad → Notificaciones y permite este sitio'
          });
        }
      };
    }
    if (permission === 'granted' && pushEnabled) {
      return {
        icon: <BellRing className="w-5 h-5 text-green-400" />,
        title: 'Notificaciones activas',
        description: 'Recibirás alertas importantes al instante',
        buttonText: 'Desactivar',
        buttonAction: handleToggle
      };
    }
    return {
      icon: <Bell className="w-5 h-5 text-amber-400" />,
      title: 'Notificaciones desactivadas',
      description: 'Actívalas para no perderte alertas urgentes',
      buttonText: 'Activar',
      buttonAction: handleToggle
    };
  };

  const status = getStatusInfo();

  return (
    <div 
      data-testid="push-notification-status"
      className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
    >
      <div className="flex items-center gap-3">
        {status.icon}
        <div>
          <p className="text-sm text-white font-medium">{status.title}</p>
          <p className="text-xs text-slate-400">{status.description}</p>
        </div>
      </div>
      
      <button
        onClick={status.buttonAction}
        data-testid="toggle-push-btn"
        className={cn(
          "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
          permission === 'granted' && pushEnabled
            ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
            : "bg-blue-600 text-white hover:bg-blue-500"
        )}
      >
        {status.buttonText}
      </button>
    </div>
  );
}
