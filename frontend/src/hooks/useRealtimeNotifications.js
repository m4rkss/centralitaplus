import { useEffect, useCallback, useRef } from 'react';
import { useNotificationStore, NOTIFICATION_TYPES, PRIORITY } from '@/stores/useNotificationStore';
import { usePushNotifications, createPushContent } from '@/hooks/usePushNotifications';
import { useTenantStore } from '@/stores/useTenantStore';

// Sample real-time notifications that could come from the server
const REALTIME_NOTIFICATIONS = [
  {
    type: NOTIFICATION_TYPES.LLAMADA_DERIVADA,
    title: 'Llamada derivada a humano',
    message: 'Ciudadano pregunta por horarios de consulta médica. IA no encontró información.',
    priority: PRIORITY.HIGH,
    link: '/llamadas',
  },
  {
    type: NOTIFICATION_TYPES.INCIDENCIA_NUEVA,
    title: 'Nueva incidencia reportada',
    message: 'Banco roto en parque infantil de C/ Nueva',
    priority: PRIORITY.MEDIUM,
    link: '/incidencias',
  },
  {
    type: NOTIFICATION_TYPES.COMUNICADO_ENVIADO,
    title: 'Comunicado enviado',
    message: 'Aviso de fumigación enviado a 89 vecinos',
    priority: PRIORITY.LOW,
    link: '/comunicados',
  },
  {
    type: NOTIFICATION_TYPES.INCIDENCIA_PRIORITARIA,
    title: 'Incidencia urgente',
    message: 'Semáforo averiado en cruce principal - riesgo de accidente',
    priority: PRIORITY.URGENT,
    link: '/incidencias',
  },
  {
    type: NOTIFICATION_TYPES.RESERVA_NUEVA,
    title: 'Nueva reserva',
    message: 'Solicitud de reserva del salón de actos para el 15/04',
    priority: PRIORITY.MEDIUM,
    link: '/incidencias',
  },
];

// Hook to simulate real-time notifications (for demo)
export function useRealtimeNotifications(enabled = false, intervalMs = 45000) {
  const { addNotification, pushEnabled } = useNotificationStore();
  const { currentTenant } = useTenantStore();
  const { permission, showNotification } = usePushNotifications();
  const indexRef = useRef(0);

  const triggerNotification = useCallback(() => {
    if (!currentTenant?.id) return;

    const notifTemplate = REALTIME_NOTIFICATIONS[indexRef.current % REALTIME_NOTIFICATIONS.length];
    indexRef.current++;

    const newNotification = addNotification({
      ...notifTemplate,
      tenantId: currentTenant.id,
      relatedEntityId: `entity-${Date.now()}`,
      relatedEntityType: notifTemplate.type.split('_')[0],
    });

    // Trigger push notification if enabled and permission granted
    if (pushEnabled && permission === 'granted' && newNotification) {
      const pushContent = createPushContent(newNotification);
      showNotification(pushContent.title, pushContent);
    }

    return newNotification;
  }, [addNotification, currentTenant?.id, pushEnabled, permission, showNotification]);

  // Auto-trigger notifications at interval (for demo)
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      triggerNotification();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [enabled, intervalMs, triggerNotification]);

  return { triggerNotification };
}

// Hook to manually trigger a push notification
export function useTriggerPushNotification() {
  const { pushEnabled } = useNotificationStore();
  const { permission, showNotification } = usePushNotifications();

  const triggerPush = useCallback(async (notification) => {
    if (!pushEnabled || permission !== 'granted') {
      console.log('[Push] Not enabled or permission denied');
      return false;
    }

    const pushContent = createPushContent(notification);
    return showNotification(pushContent.title, pushContent);
  }, [pushEnabled, permission, showNotification]);

  return { triggerPush, canPush: pushEnabled && permission === 'granted' };
}
