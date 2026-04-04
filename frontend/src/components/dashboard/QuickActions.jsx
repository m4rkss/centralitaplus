import { Plus, FileText, Send, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const quickActions = [
  {
    label: 'Nueva Incidencia',
    icon: Plus,
    color: 'bg-blue-500 hover:bg-blue-600',
    path: '/incidencias?action=new'
  },
  {
    label: 'Nuevo Comunicado',
    icon: Send,
    color: 'bg-emerald-500 hover:bg-emerald-600',
    path: '/comunicados?action=new'
  },
  {
    label: 'Ver Llamadas',
    icon: Phone,
    color: 'bg-purple-500 hover:bg-purple-600',
    path: '/llamadas'
  },
  {
    label: 'Chatbot',
    icon: FileText,
    color: 'bg-amber-500 hover:bg-amber-600',
    path: '/chatbot'
  }
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div 
      data-testid="quick-actions"
      className="bg-slate-900/50 border border-slate-800 rounded-xl p-5"
    >
      <h3 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              data-testid={`quick-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-white text-sm font-medium transition-all ${action.color}`}
            >
              <Icon className="w-4 h-4" />
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
