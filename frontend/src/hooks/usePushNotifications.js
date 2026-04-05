import { useState, useEffect, useCallback } from 'react';

// Check if push notifications are supported
export const isPushSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
};

// Hook for managing push notifications
export function usePushNotifications() {
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);

  // Initialize on mount
  useEffect(() => {
    const supported = isPushSupported();
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      registerServiceWorker();
    }
  }, []);

  // Register Service Worker
  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('[Push] Service Worker registered:', registration.scope);
      setSwRegistration(registration);
      
      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'NOTIFICATION_CLICK') {
          // Handle navigation from notification click
          window.location.href = event.data.url;
        }
      });
      
      return registration;
    } catch (error) {
      console.error('[Push] SW registration failed:', error);
      return null;
    }
  };

  // Request permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      console.warn('[Push] Push notifications not supported');
      return 'unsupported';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      console.log('[Push] Permission:', result);
      return result;
    } catch (error) {
      console.error('[Push] Permission request failed:', error);
      return 'denied';
    }
  }, [isSupported]);

  // Show a local notification (no server needed)
  const showNotification = useCallback(async (title, options = {}) => {
    if (!isSupported) {
      console.warn('[Push] Notifications not supported');
      return false;
    }

    if (permission !== 'granted') {
      console.warn('[Push] Permission not granted');
      return false;
    }

    try {
      // If SW is registered, use it for better reliability
      if (swRegistration) {
        await swRegistration.showNotification(title, {
          body: options.body || '',
          icon: options.icon || '/logo192.png',
          badge: '/logo192.png',
          tag: options.tag || `centralita-${Date.now()}`,
          data: options.data || { url: '/' },
          vibrate: [100, 50, 100],
          requireInteraction: options.requireInteraction || false,
          ...options
        });
      } else {
        // Fallback to regular Notification API
        new Notification(title, {
          body: options.body || '',
          icon: options.icon || '/logo192.png',
          tag: options.tag || `centralita-${Date.now()}`,
          ...options
        });
      }
      return true;
    } catch (error) {
      console.error('[Push] Failed to show notification:', error);
      return false;
    }
  }, [isSupported, permission, swRegistration]);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    swRegistration
  };
}

// Priority to icon/color mapping for notifications
export const NOTIFICATION_ICONS = {
  incidencia_nueva: '⚠️',
  incidencia_prioritaria: '🚨',
  incidencia_retrasada: '⏰',
  incidencia_cerrada: '✅',
  llamada_derivada: '📞',
  llamada_resumen: '📋',
  comunicado_enviado: '✉️',
  comunicado_error: '❌',
  reserva_nueva: '📅',
  documento_indexado: '📄',
};

// Helper to create notification content from our notification object
export function createPushContent(notification) {
  const icon = NOTIFICATION_ICONS[notification.type] || '🔔';
  
  return {
    title: `${icon} ${notification.title}`,
    body: notification.message,
    tag: notification.id,
    data: { 
      url: notification.link || '/',
      notificationId: notification.id 
    },
    requireInteraction: notification.priority === 'urgent' || notification.priority === 'high'
  };
}
