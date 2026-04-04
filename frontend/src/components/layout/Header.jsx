import { useTenantStore } from '@/stores/useTenantStore';
import { Bell, Search, User, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const pageTitles = {
  '/': 'Dashboard',
  '/llamadas': 'Llamadas',
  '/incidencias': 'Incidencias',
  '/comunicados': 'Comunicados',
  '/chatbot': 'Chatbot Asistente',
  '/configuracion': 'Configuración'
};

export function Header() {
  const { currentTenant } = useTenantStore();
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || 'Dashboard';

  return (
    <header 
      data-testid="header"
      className="h-16 bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between px-6"
    >
      {/* Título de página */}
      <div>
        <h2 className="text-xl font-semibold text-white">{pageTitle}</h2>
        <p className="text-xs text-slate-400">
          {currentTenant?.nombre || 'Cargando...'}
        </p>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-3">
        {/* Búsqueda */}
        <button 
          data-testid="search-btn"
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg text-slate-400 text-sm hover:bg-slate-700 transition-colors"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Buscar...</span>
          <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-700 rounded text-xs text-slate-500">
            ⌘K
          </kbd>
        </button>

        {/* Notificaciones */}
        <button 
          data-testid="notifications-btn"
          className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              data-testid="user-menu-btn"
              className="flex items-center gap-2 p-1.5 pr-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-white hidden sm:inline">Admin</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
            <DropdownMenuLabel className="text-slate-300">Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem className="text-slate-300 focus:bg-slate-700 focus:text-white cursor-pointer">
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem className="text-slate-300 focus:bg-slate-700 focus:text-white cursor-pointer">
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem className="text-red-400 focus:bg-slate-700 focus:text-red-300 cursor-pointer">
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
