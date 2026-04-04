import { z } from 'zod';

// === TENANT ===
export const TenantSchema = z.object({
  id: z.string(),
  subdomain: z.string(),
  nombre: z.string(),
  logo_url: z.string().optional(),
  config: z.object({
    vapi_enabled: z.boolean().default(true),
    retell_enabled: z.boolean().default(true),
    onyx_workspace_id: z.string().optional(),
    n8n_webhook_url: z.string().optional(),
  }),
  primaryColor: z.string().optional(),
  created_at: z.string(),
});

// === LLAMADA ===
export const LlamadaSchema = z.object({
  id: z.string(),
  tenant_id: z.string(),
  fecha: z.string(),
  duracion_segundos: z.number().int().min(0),
  descripcion: z.string(),
  proveedor: z.enum(['vapi', 'retell']),
  estado: z.enum(['completada', 'revision', 'fallida']),
  telefono_origen: z.string().optional(),
  transcripcion: z.string().optional(),
  audio_url: z.string().optional(),
  created_at: z.string(),
});

// === INCIDENCIA ===
export const IncidenciaSchema = z.object({
  id: z.string(),
  tenant_id: z.string(),
  titulo: z.string(),
  descripcion: z.string(),
  ubicacion: z.string(),
  prioridad: z.enum(['alta', 'media', 'baja']),
  estado: z.enum(['abierta', 'en_progreso', 'cerrada']),
  categoria: z.enum(['alumbrado', 'vias_publicas', 'agua', 'limpieza', 'otros']),
  reportado_por: z.string().optional(),
  asignado_a: z.string().optional(),
  notas: z.array(z.object({
    id: z.string(),
    texto: z.string(),
    autor: z.string(),
    fecha: z.string(),
  })).default([]),
  created_at: z.string(),
  updated_at: z.string(),
  closed_at: z.string().optional(),
});

// === COMUNICADO ===
export const ComunicadoSchema = z.object({
  id: z.string(),
  tenant_id: z.string(),
  titulo: z.string(),
  mensaje: z.string(),
  canal: z.enum(['whatsapp', 'email', 'ambos']),
  destinatarios_count: z.number().int().min(0),
  estado: z.enum(['borrador', 'enviado', 'fallido']),
  enviado_at: z.string().optional(),
  created_at: z.string(),
});

// === KPI ===
export const KPISchema = z.object({
  llamadas_hoy: z.number().int(),
  llamadas_semana: z.number().int(),
  incidencias_abiertas: z.number().int(),
  incidencias_cerradas_semana: z.number().int(),
  comunicados_enviados_semana: z.number().int(),
  satisfaccion_ia: z.number().min(0).max(100),
});

export const CATEGORIAS = [
  { value: 'alumbrado', label: 'Alumbrado' },
  { value: 'vias_publicas', label: 'Vías Públicas' },
  { value: 'agua', label: 'Agua' },
  { value: 'limpieza', label: 'Limpieza' },
  { value: 'otros', label: 'Otros' },
];

export const PRIORIDADES = [
  { value: 'alta', label: 'Alta', color: 'text-red-500' },
  { value: 'media', label: 'Media', color: 'text-amber-500' },
  { value: 'baja', label: 'Baja', color: 'text-green-500' },
];

export const ESTADOS_INCIDENCIA = [
  { value: 'abierta', label: 'Abierta' },
  { value: 'en_progreso', label: 'En Progreso' },
  { value: 'cerrada', label: 'Cerrada' },
];
