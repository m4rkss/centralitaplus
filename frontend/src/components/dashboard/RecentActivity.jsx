import { formatRelativeTime } from '@/lib/utils';
import { Phone, AlertTriangle, Send, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const activityIcons = {
  llamada: Phone,
  incidencia: AlertTriangle,
  comunicado: Send,
};

const activityColors = {
  llamada: 'text-blue-400 bg-blue-500/20',
  incidencia: 'text-amber-400 bg-amber-500/20',
  comunicado: 'text-emerald-400 bg-emerald-500/20',
};

export function RecentActivity({ llamadas = [], incidencias = [], comunicados = [] }) {
  const navigate = useNavigate();

  // Combinar y ordenar actividades recientes
  const activities = [
    ...llamadas.slice(0, 3).map(l => ({
      id: l.id,
      type: 'llamada',
      title: l.descripcion,
      subtitle: `Duración: ${Math.floor(l.duracion_segundos / 60)}:${(l.duracion_segundos % 60).toString().padStart(2, '0')}`,
      date: l.fecha,
      link: '/llamadas'
    })),
    ...incidencias.slice(0, 2).map(i => ({
      id: i.id,
      type: 'incidencia',
      title: i.titulo,
      subtitle: i.ubicacion,
      date: i.created_at,
      link: '/incidencias'
    })),
    ...comunicados.slice(0, 2).map(c => ({
      id: c.id,
      type: 'comunicado',
      title: c.titulo,
      subtitle: `${c.destinatarios_count} destinatarios`,
      date: c.enviado_at || c.created_at,
      link: '/comunicados'
    }))
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  return (
    <div 
      data-testid="recent-activity"
      className="bg-slate-900/50 border border-slate-800 rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Actividad Reciente</h3>
        <button className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
          Ver todo <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.type];
          return (
            <div
              key={activity.id}
              onClick={() => navigate(activity.link)}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors group"
            >
              <div className={cn("p-2 rounded-lg", activityColors[activity.type])}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate group-hover:text-blue-400 transition-colors">
                  {activity.title}
                </p>
                <p className="text-xs text-slate-500 truncate">{activity.subtitle}</p>
              </div>
              <p className="text-xs text-slate-500 whitespace-nowrap">
                {formatRelativeTime(activity.date)}
              </p>
            </div>
          );
        })}

        {activities.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">
            No hay actividad reciente
          </p>
        )}
      </div>
    </div>
  );
}
