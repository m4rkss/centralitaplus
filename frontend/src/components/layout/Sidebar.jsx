import { NavLink, useLocation } from 'react-router-dom';
import { useTenantStore } from '@/stores/useTenantStore';
import { 
  LayoutDashboard, 
  Phone, 
  AlertTriangle, 
  Send, 
  MessageSquare,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/llamadas', label: 'Llamadas', icon: Phone },
  { path: '/incidencias', label: 'Incidencias', icon: AlertTriangle },
  { path: '/comunicados', label: 'Comunicados', icon: Send },
  { path: '/chatbot', label: 'Chatbot', icon: MessageSquare },
];

export function Sidebar({ isOpen = true, onClose, isMobile = false }) {
  const { currentTenant } = useTenantStore();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Don't render if not open on mobile
  if (!isOpen && isMobile) return null;

  return (
    <aside 
      data-testid="sidebar"
      className={cn(
        "fixed left-0 top-0 h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300",
        isMobile 
          ? "z-40 w-64" 
          : collapsed 
            ? "z-40 w-16" 
            : "z-40 w-64"
      )}
    >
      {/* Logo y nombre del ayuntamiento */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: currentTenant?.primaryColor || '#6366f1' }}
            >
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-white truncate">
                {currentTenant?.nombre?.split(' ').slice(0, 2).join(' ') || 'Centralita'}
              </h1>
              <p className="text-xs text-slate-400 truncate">
                Centralita IA
              </p>
            </div>
          </div>
        )}
        
        {(collapsed && !isMobile) && (
          <div 
            className="w-9 h-9 rounded-lg flex items-center justify-center mx-auto"
            style={{ backgroundColor: currentTenant?.primaryColor || '#6366f1' }}
          >
            <Building2 className="w-5 h-5 text-white" />
          </div>
        )}

        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={isMobile ? onClose : undefined}
              data-testid={`nav-${item.label.toLowerCase()}`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive 
                  ? "bg-slate-800 text-white" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50",
                (collapsed && !isMobile) && "justify-center px-2"
              )}
              title={(collapsed && !isMobile) ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {(!collapsed || isMobile) && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Configuración al fondo */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-800">
        <NavLink
          to="/configuracion"
          onClick={isMobile ? onClose : undefined}
          data-testid="nav-configuracion"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            location.pathname === '/configuracion'
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50",
            (collapsed && !isMobile) && "justify-center px-2"
          )}
          title={(collapsed && !isMobile) ? 'Configuración' : undefined}
        >
          <Settings className="w-5 h-5" />
          {(!collapsed || isMobile) && <span>Configuración</span>}
        </NavLink>
        
        {/* Collapse button - only desktop */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "mt-2 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all",
              collapsed && "justify-center px-2"
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Colapsar</span>
              </>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}
