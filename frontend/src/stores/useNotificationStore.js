import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Notification types
export const NOTIFICATION_TYPES = {
  INCIDENCIA_NUEVA: 'incidencia_nueva',
  INCIDENCIA_PRIORITARIA: 'incidencia_prioritaria',
  INCIDENCIA_RETRASADA: 'incidencia_retrasada',
  INCIDENCIA_CERRADA: 'incidencia_cerrada',
  LLAMADA_DERIVADA: 'llamada_derivada',
  LLAMADA_RESUMEN: 'llamada_resumen',
  COMUNICADO_ENVIADO: 'comunicado_enviado',
  COMUNICADO_ERROR: 'comunicado_error',
  RESERVA_NUEVA: 'reserva_nueva',
  DOCUMENTO_INDEXADO: 'documento_indexado',
};

// Icon and color mapping by type
export const NOTIFICATION_CONFIG = {
  [NOTIFICATION_TYPES.INCIDENCIA_NUEVA]: { 
    icon: 'AlertTriangle', 
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    link: '/incidencias'
  },
  [NOTIFICATION_TYPES.INCIDENCIA_PRIORITARIA]: { 
    icon: 'AlertTriangle', 
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    link: '/incidencias'
  },
  [NOTIFICATION_TYPES.INCIDENCIA_RETRASADA]: { 
    icon: 'Clock', 
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    link: '/incidencias'
  },
  [NOTIFICATION_TYPES.INCIDENCIA_CERRADA]: { 
    icon: 'CheckCircle', 
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    link: '/incidencias'
  },
  [NOTIFICATION_TYPES.LLAMADA_DERIVADA]: { 
    icon: 'PhoneForwarded', 
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    link: '/llamadas'
  },
  [NOTIFICATION_TYPES.LLAMADA_RESUMEN]: { 
    icon: 'Phone', 
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    link: '/llamadas'
  },
  [NOTIFICATION_TYPES.COMUNICADO_ENVIADO]: { 
    icon: 'Send', 
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    link: '/comunicados'
  },
  [NOTIFICATION_TYPES.COMUNICADO_ERROR]: { 
    icon: 'AlertCircle', 
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    link: '/comunicados'
  },
  [NOTIFICATION_TYPES.RESERVA_NUEVA]: { 
    icon: 'Calendar', 
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    link: '/incidencias'
  },
  [NOTIFICATION_TYPES.DOCUMENTO_INDEXADO]: { 
    icon: 'FileText', 
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    link: '/chatbot'
  },
};

// Priority levels
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

// Mock notifications for Santa Gadea del Cid
const generateMockNotifications = (tenantId = 'santa-gadea') => {
  const now = new Date();
  
  return [
    {
      id: 'notif-001',
      tenantId,
      type: NOTIFICATION_TYPES.INCIDENCIA_PRIORITARIA,
      title: 'Incidencia prioritaria',
      message: 'Fuga de agua en C/ Iglesia lleva 48h abierta sin asignar',
      priority: PRIORITY.URGENT,
      read: false,
      createdAt: new Date(now - 30 * 60 * 1000).toISOString(), // 30 min ago
      link: '/incidencias',
      relatedEntityId: 'inc-002',
      relatedEntityType: 'incidencia',
    },
    {
      id: 'notif-002',
      tenantId,
      type: NOTIFICATION_TYPES.LLAMADA_DERIVADA,
      title: 'Llamada derivada a humano',
      message: 'Vecino solicita información sobre empadronamiento. IA no pudo resolver.',
      priority: PRIORITY.HIGH,
      read: false,
      createdAt: new Date(now - 45 * 60 * 1000).toISOString(), // 45 min ago
      link: '/llamadas',
      relatedEntityId: 'call-015',
      relatedEntityType: 'llamada',
    },
    {
      id: 'notif-003',
      tenantId,
      type: NOTIFICATION_TYPES.INCIDENCIA_NUEVA,
      title: 'Nueva incidencia creada',
      message: 'Farola fundida en Plaza Mayor reportada por ciudadano',
      priority: PRIORITY.MEDIUM,
      read: false,
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      link: '/incidencias',
      relatedEntityId: 'inc-001',
      relatedEntityType: 'incidencia',
    },
    {
      id: 'notif-004',
      tenantId,
      type: NOTIFICATION_TYPES.COMUNICADO_ENVIADO,
      title: 'Comunicado enviado',
      message: '"Corte de agua programado" enviado a 156 vecinos por WhatsApp',
      priority: PRIORITY.LOW,
      read: false,
      createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      link: '/comunicados',
      relatedEntityId: 'com-001',
      relatedEntityType: 'comunicado',
    },
    {
      id: 'notif-005',
      tenantId,
      type: NOTIFICATION_TYPES.COMUNICADO_ERROR,
      title: 'Error en envío de emails',
      message: '4 emails del aviso de Fiestas Patronales no pudieron enviarse',
      priority: PRIORITY.HIGH,
      read: false,
      createdAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      link: '/comunicados',
      relatedEntityId: 'com-002',
      relatedEntityType: 'comunicado',
    },
    {
      id: 'notif-006',
      tenantId,
      type: NOTIFICATION_TYPES.DOCUMENTO_INDEXADO,
      title: 'Documento indexado',
      message: 'Programa de Fiestas Patronales 2026 añadido al chatbot',
      priority: PRIORITY.LOW,
      read: true,
      createdAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      link: '/chatbot',
      relatedEntityId: 'doc-001',
      relatedEntityType: 'documento',
    },
    {
      id: 'notif-007',
      tenantId,
      type: NOTIFICATION_TYPES.RESERVA_NUEVA,
      title: 'Nueva reserva recibida',
      message: 'Solicitud de reserva para excursión cultural a Burgos (12 personas)',
      priority: PRIORITY.MEDIUM,
      read: false,
      createdAt: new Date(now - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
      link: '/incidencias',
      relatedEntityId: 'res-001',
      relatedEntityType: 'reserva',
    },
    {
      id: 'notif-008',
      tenantId,
      type: NOTIFICATION_TYPES.LLAMADA_RESUMEN,
      title: 'Resumen de llamada importante',
      message: 'Vecino preguntó por subvenciones agrícolas 2026. Requiere seguimiento.',
      priority: PRIORITY.MEDIUM,
      read: true,
      createdAt: new Date(now - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      link: '/llamadas',
      relatedEntityId: 'call-008',
      relatedEntityType: 'llamada',
    },
    {
      id: 'notif-009',
      tenantId,
      type: NOTIFICATION_TYPES.INCIDENCIA_CERRADA,
      title: 'Incidencia resuelta',
      message: 'Bache en Avenida Principal reparado por brigada municipal',
      priority: PRIORITY.LOW,
      read: true,
      createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      link: '/incidencias',
      relatedEntityId: 'inc-003',
      relatedEntityType: 'incidencia',
    },
    {
      id: 'notif-010',
      tenantId,
      type: NOTIFICATION_TYPES.INCIDENCIA_RETRASADA,
      title: 'Incidencia sin actualizar',
      message: 'Contenedor desbordado en C/ Mayor lleva 72h sin respuesta',
      priority: PRIORITY.HIGH,
      read: false,
      createdAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      link: '/incidencias',
      relatedEntityId: 'inc-004',
      relatedEntityType: 'incidencia',
    },
  ];
};

// Notification store
export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      isOpen: false,
      activeFilter: 'all', // 'all', 'unread', 'urgent'
      initialized: false,
      pushEnabled: false, // Push notifications toggle

      // Initialize notifications for tenant
      initNotifications: (tenantId = 'santa-gadea') => {
        const state = get();
        // Only initialize if not already done or if tenant changed
        if (!state.initialized || state.notifications.length === 0) {
          const mockData = generateMockNotifications(tenantId);
          set({ 
            notifications: mockData,
            initialized: true 
          });
        }
      },

      // Toggle dropdown
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      setOpen: (isOpen) => set({ isOpen }),

      // Set active filter
      setFilter: (filter) => set({ activeFilter: filter }),

      // Push notifications toggle
      setPushEnabled: (enabled) => set({ pushEnabled: enabled }),

      // Get filtered notifications
      getFilteredNotifications: (tenantId) => {
        const { notifications, activeFilter } = get();
        let filtered = notifications.filter(n => n.tenantId === tenantId);
        
        switch (activeFilter) {
          case 'unread':
            return filtered.filter(n => !n.read);
          case 'urgent':
            return filtered.filter(n => n.priority === PRIORITY.URGENT || n.priority === PRIORITY.HIGH);
          default:
            return filtered;
        }
      },

      // Get unread count
      getUnreadCount: (tenantId) => {
        const { notifications } = get();
        return notifications.filter(n => n.tenantId === tenantId && !n.read).length;
      },

      // Mark single notification as read
      markAsRead: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        }));
      },

      // Mark all as read
      markAllAsRead: (tenantId) => {
        set((state) => ({
          notifications: state.notifications.map(n =>
            n.tenantId === tenantId ? { ...n, read: true } : n
          )
        }));
      },

      // Add new notification (with optional push)
      addNotification: (notification, triggerPush = true) => {
        const newNotification = {
          ...notification,
          id: `notif-${Date.now()}`,
          createdAt: new Date().toISOString(),
          read: false,
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications]
        }));
        
        // Return the new notification for push handling
        return newNotification;
      },

      // Remove notification
      removeNotification: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== notificationId)
        }));
      },

      // Clear all notifications for tenant
      clearAll: (tenantId) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.tenantId !== tenantId)
        }));
      },
    }),
    {
      name: 'centralita-notifications',
      partialize: (state) => ({ 
        notifications: state.notifications,
        initialized: state.initialized,
        pushEnabled: state.pushEnabled
      }),
    }
  )
);

// Helper to format relative time
export function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Ahora mismo';
  if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 172800) return 'Ayer';
  if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
