import { useNavigate } from 'react-router-dom';
import { useTenantStore } from '@/stores/useTenantStore';
import { 
  useNotificationStore, 
  NOTIFICATION_CONFIG, 
  PRIORITY,
  formatRelativeTime 
} from '@/stores/useNotificationStore';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  PhoneForwarded, 
  Phone, 
  Send, 
  AlertCircle, 
  Calendar, 
  FileText,
  Check,
  BellOff,
  X
} from 'lucide-react';
import { useEffect } from 'react';

// Icon mapping
const IconMap = {
  AlertTriangle,
  Clock,
  CheckCircle,
  PhoneForwarded,
  Phone,
  Send,
  AlertCircle,
  Calendar,
  FileText,
};

// Priority badge styles
const priorityStyles = {
  [PRIORITY.URGENT]: 'bg-red-500/20 text-red-400 border-red-500/30',
  [PRIORITY.HIGH]: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  [PRIORITY.MEDIUM]: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  [PRIORITY.LOW]: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const priorityLabels = {
  [PRIORITY.URGENT]: 'Urgente',
  [PRIORITY.HIGH]: 'Alta',
  [PRIORITY.MEDIUM]: 'Media',
  [PRIORITY.LOW]: 'Baja',
};

function NotificationItem({ notification, onClose }) {
  const navigate = useNavigate();
  const { markAsRead } = useNotificationStore();
  
  const config = NOTIFICATION_CONFIG[notification.type] || NOTIFICATION_CONFIG.incidencia_nueva;
  const IconComponent = IconMap[config.icon] || AlertTriangle;
  
  const handleClick = () => {
    markAsRead(notification.id);
    onClose();
    navigate(notification.link || config.link);
  };
  
  return (
    <button
      onClick={handleClick}
      data-testid={`notification-item-${notification.id}`}
      className={cn(
        "w-full text-left p-3 rounded-lg transition-all duration-200",
        "hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50",
        "border border-transparent",
        notification.read 
          ? "opacity-60 hover:opacity-100" 
          : "bg-slate-800/50 border-slate-700/50"
      )}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={cn(
          "flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center",
          config.bgColor
        )}>
          <IconComponent className={cn("w-4 h-4", config.color)} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              "text-sm font-medium truncate",
              notification.read ? "text-slate-400" : "text-white"
            )}>
              {notification.title}
            </p>
            {!notification.read && (
              <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
            )}
          </div>
          
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          
          <div className="flex items-center gap-2 mt-2">
            {/* Priority badge */}
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded border font-medium",
              priorityStyles[notification.priority]
            )}>
              {priorityLabels[notification.priority]}
            </span>
            
            {/* Timestamp */}
            <span className="text-[10px] text-slate-500">
              {formatRelativeTime(notification.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function EmptyState({ filter }) {
  const messages = {
    all: 'No hay notificaciones',
    unread: 'No hay notificaciones sin leer',
    urgent: 'No hay notificaciones urgentes',
  };
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
        <BellOff className="w-6 h-6 text-slate-500" />
      </div>
      <p className="text-sm text-slate-400 text-center">
        {messages[filter]}
      </p>
      <p className="text-xs text-slate-500 mt-1 text-center">
        Las nuevas notificaciones aparecerán aquí
      </p>
    </div>
  );
}

export function NotificationPanel() {
  const navigate = useNavigate();
  const { currentTenant } = useTenantStore();
  const { 
    isOpen, 
    setOpen, 
    activeFilter, 
    setFilter,
    getFilteredNotifications,
    getUnreadCount,
    markAllAsRead,
    initNotifications
  } = useNotificationStore();
  
  const tenantId = currentTenant?.id || 'santa-gadea';
  
  // Initialize notifications on mount
  useEffect(() => {
    initNotifications(tenantId);
  }, [initNotifications, tenantId]);
  
  const notifications = getFilteredNotifications(tenantId);
  const unreadCount = getUnreadCount(tenantId);
  
  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    markAllAsRead(tenantId);
  };
  
  const handleClose = () => setOpen(false);
  
  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button 
          data-testid="notifications-btn"
          className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          {unreadCount > 0 && (
            <span 
              data-testid="notification-badge"
              className={cn(
                "absolute flex items-center justify-center",
                "bg-red-500 text-white text-[10px] font-bold rounded-full",
                "min-w-[18px] h-[18px] px-1",
                "-top-0.5 -right-0.5",
                "border-2 border-slate-900"
              )}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      
      <PopoverContent 
        align="end" 
        sideOffset={8}
        className={cn(
          "w-[380px] sm:w-[420px] p-0",
          "bg-slate-900 border-slate-700/50",
          "shadow-xl shadow-black/20"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                {unreadCount} nuevas
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                data-testid="mark-all-read-btn"
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
              >
                <Check className="w-3.5 h-3.5 inline mr-1" />
                Marcar leídas
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors sm:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Tabs / Filters */}
        <div className="px-3 pt-3 pb-2 border-b border-slate-800/50">
          <Tabs value={activeFilter} onValueChange={setFilter}>
            <TabsList className="w-full bg-slate-800/50 p-1 h-auto">
              <TabsTrigger 
                value="all"
                data-testid="filter-all"
                className={cn(
                  "flex-1 text-xs py-1.5",
                  "data-[state=active]:bg-slate-700 data-[state=active]:text-white",
                  "text-slate-400"
                )}
              >
                Todas
              </TabsTrigger>
              <TabsTrigger 
                value="unread"
                data-testid="filter-unread"
                className={cn(
                  "flex-1 text-xs py-1.5",
                  "data-[state=active]:bg-slate-700 data-[state=active]:text-white",
                  "text-slate-400"
                )}
              >
                No leídas
              </TabsTrigger>
              <TabsTrigger 
                value="urgent"
                data-testid="filter-urgent"
                className={cn(
                  "flex-1 text-xs py-1.5",
                  "data-[state=active]:bg-slate-700 data-[state=active]:text-white",
                  "text-slate-400"
                )}
              >
                Urgentes
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Notifications List */}
        <ScrollArea className="h-[360px]">
          <div className="p-2 space-y-1">
            {notifications.length === 0 ? (
              <EmptyState filter={activeFilter} />
            ) : (
              notifications.map((notification) => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification}
                  onClose={handleClose}
                />
              ))
            )}
          </div>
        </ScrollArea>
        
        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-slate-800 bg-slate-800/30">
            <button
              onClick={() => {
                handleClose();
                navigate('/configuracion');
              }}
              data-testid="notification-settings-btn"
              className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors"
            >
              Configurar notificaciones
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
