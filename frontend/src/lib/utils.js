import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Formatear duración en segundos a mm:ss
export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Formatear fecha relativa
export function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays} días`;
  
  return date.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: '2-digit',
    year: '2-digit'
  });
}

// Formatear fecha completa
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Formatear fecha y hora
export function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Generar ID único
export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Colores por prioridad
export const PRIORITY_COLORS = {
  alta: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-500',
    badge: 'bg-red-500 text-white'
  },
  media: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-500',
    badge: 'bg-amber-500 text-white'
  },
  baja: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-500',
    badge: 'bg-emerald-500 text-white'
  }
};

// Colores por estado
export const STATUS_COLORS = {
  abierta: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    badge: 'bg-blue-500/20 text-blue-400'
  },
  en_progreso: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    badge: 'bg-amber-500/20 text-amber-400'
  },
  cerrada: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    badge: 'bg-slate-500/20 text-slate-400'
  },
  completada: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    badge: 'bg-emerald-500/20 text-emerald-400'
  },
  revision: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    badge: 'bg-amber-500/20 text-amber-400'
  },
  fallida: {
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    badge: 'bg-red-500/20 text-red-400'
  },
  enviado: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    badge: 'bg-emerald-500/20 text-emerald-400'
  },
  borrador: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    badge: 'bg-slate-500/20 text-slate-400'
  }
};

// Iconos por categoría
export const CATEGORY_ICONS = {
  alumbrado: 'Lightbulb',
  vias_publicas: 'Construction',
  agua: 'Droplets',
  limpieza: 'Trash2',
  otros: 'HelpCircle'
};
