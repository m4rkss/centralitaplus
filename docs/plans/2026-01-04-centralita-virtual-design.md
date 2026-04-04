# Centralita Virtual Ayuntamiento - Design Document

**Fecha:** 2026-01-04  
**Proyecto:** SaaS Multi-tenant para Ayuntamientos de Burgos/CyL  
**Demo:** santagadea.centralitaia.com  

---

## 1. ARQUITECTURA HIGH-LEVEL

### 1.1 Pages (Rutas)

```
/                     → Dashboard principal (KPIs + gráficos)
/llamadas             → Gestión de llamadas IA (Vapi/Retell)
/incidencias          → Gestión de incidencias ciudadanas
/comunicados          → Envío masivo WhatsApp/Email (n8n)
/chatbot              → Iframe Onyx Cloud (RAG docs)
/configuracion        → Configuración del tenant
```

### 1.2 Component Tree

```
App
├── Layout (Sidebar + Header + Content)
│   ├── Sidebar
│   │   ├── Logo (dinámico por tenant)
│   │   ├── NavLinks
│   │   └── TenantSwitcher (solo admin)
│   ├── Header
│   │   ├── BreadcrumbNav
│   │   ├── SearchCommand (⌘K)
│   │   └── UserMenu
│   └── Content (outlet)
│
├── Pages
│   ├── Dashboard
│   │   ├── KPICards (llamadas hoy, incidencias abiertas, etc.)
│   │   ├── CallsChart (Recharts - área/línea)
│   │   ├── RecentActivity
│   │   └── QuickActions
│   │
│   ├── Llamadas
│   │   ├── CallsTable (filtros, paginación)
│   │   ├── CallDetailModal (transcripción, audio)
│   │   └── CallFilters (fecha, proveedor, estado)
│   │
│   ├── Incidencias
│   │   ├── IncidenciasGrid (cards por prioridad)
│   │   ├── IncidenciaDetailModal
│   │   ├── IncidenciaForm (crear/editar)
│   │   └── PriorityBadge
│   │
│   ├── Comunicados
│   │   ├── ComunicadosList
│   │   ├── ComunicadoForm (nuevo)
│   │   └── ChannelSelector (WA/Email)
│   │
│   └── Chatbot
│       └── OnyxIframe (fullscreen)
```

### 1.3 Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│  LocalStorage│
│   (React)   │     │  (FastAPI)  │     │   (Demo)    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                    │
       │                   │           ┌───────────────┐
       │                   └──────────▶│   MongoDB     │
       │                               │ (Producción)  │
       │                               └───────────────┘
       │
       ├── Vapi/Retell Webhooks (llamadas)
       ├── n8n Mock (comunicados)
       └── Onyx Cloud iframe (chatbot)
```

---

## 2. WIREFRAMES TEXTUALES

### 2.1 Dashboard

```
┌────────────────────────────────────────────────────────────────┐
│ [Logo]  SANTA GADEA                    [Search ⌘K] [Avatar ▼] │
├──────────┬─────────────────────────────────────────────────────┤
│          │                                                     │
│ Dashboard│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│ Llamadas │  │   24    │ │    3    │ │   12    │ │   98%   │  │
│ Incidenc.│  │Llamadas │ │Incidenc.│ │Comunic. │ │Satisfac.│  │
│ Comunicad│  │  hoy    │ │abiertas │ │ semana  │ │   IA    │  │
│ Chatbot  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│ Config   │                                                     │
│          │  ┌─────────────────────────────────────────────────┐│
│          │  │           LLAMADAS ÚLTIMOS 7 DÍAS              ││
│          │  │  30│    ╱╲                                     ││
│          │  │  20│___╱  ╲___╱╲____                          ││
│          │  │  10│                ╲___                       ││
│          │  │   0└───────────────────────────────────────    ││
│          │  │    Lun  Mar  Mié  Jue  Vie  Sáb  Dom          ││
│          │  └─────────────────────────────────────────────────┘│
│          │                                                     │
│          │  ACTIVIDAD RECIENTE                                │
│          │  ┌─────────────────────────────────────────────────┐│
│          │  │ 🔔 Llamada: Reserva piscina - hace 5 min       ││
│          │  │ 🔔 Incidencia: Farola Plaza Mayor - hace 15min ││
│          │  │ 🔔 Comunicado: Corte agua enviado - hace 1h    ││
│          │  └─────────────────────────────────────────────────┘│
└──────────┴─────────────────────────────────────────────────────┘
```

### 2.2 Llamadas

```
┌────────────────────────────────────────────────────────────────┐
│ LLAMADAS                              [Filtros ▼] [Exportar]  │
├────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Fecha       │ Duración │ Descripción      │ Prov. │Estado │ │
│ ├─────────────┼──────────┼──────────────────┼───────┼───────┤ │
│ │ 04/01 10:23 │ 2:34     │ Reserva piscina  │ Vapi  │✓ OK   │ │
│ │ 04/01 09:15 │ 1:12     │ Info fiestas     │Retell │✓ OK   │ │
│ │ 04/01 08:45 │ 3:21     │ Queja ruidos     │ Vapi  │⚠ Rev  │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                │
│ [◀ Anterior]                    Pág 1 de 3          [Siguiente ▶]│
└────────────────────────────────────────────────────────────────┘

// Modal Detalle Llamada
┌──────────────────────────────────────┐
│ DETALLE LLAMADA           [X]        │
├──────────────────────────────────────┤
│ Fecha: 04/01/2026 10:23              │
│ Duración: 2:34                       │
│ Proveedor: Vapi                      │
│ Estado: Completada                   │
│                                      │
│ TRANSCRIPCIÓN:                       │
│ ┌──────────────────────────────────┐ │
│ │ IA: Buenos días, Ayuntamiento   │ │
│ │     de Santa Gadea...           │ │
│ │ Usuario: Quería reservar la     │ │
│ │     piscina para el sábado...   │ │
│ └──────────────────────────────────┘ │
│                                      │
│ [▶ Reproducir Audio]  [📋 Copiar]   │
└──────────────────────────────────────┘
```

### 2.3 Incidencias

```
┌────────────────────────────────────────────────────────────────┐
│ INCIDENCIAS                   [+ Nueva]  [Vista: Grid ▼]      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ ALTA PRIORIDAD (2)                                            │
│ ┌──────────────────┐  ┌──────────────────┐                    │
│ │ 🔴 ALTA          │  │ 🔴 ALTA          │                    │
│ │ Farola fundida   │  │ Fuga agua        │                    │
│ │ Plaza Mayor      │  │ C/ Iglesia 5     │                    │
│ │ Abierta - 2h     │  │ Abierta - 30min  │                    │
│ │ [Ver detalle]    │  │ [Ver detalle]    │                    │
│ └──────────────────┘  └──────────────────┘                    │
│                                                                │
│ MEDIA PRIORIDAD (1)                                           │
│ ┌──────────────────┐                                          │
│ │ 🟡 MEDIA         │                                          │
│ │ Bache calle      │                                          │
│ │ Av. Principal    │                                          │
│ │ En progreso      │                                          │
│ │ [Ver detalle]    │                                          │
│ └──────────────────┘                                          │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. MOCK DATA SCHEMA

### 3.1 Schema Zod/TypeScript

```typescript
// types/schemas.ts
import { z } from 'zod';

// === TENANT ===
export const TenantSchema = z.object({
  id: z.string().uuid(),
  subdomain: z.string().min(3).max(50), // santagadea
  nombre: z.string(), // Ayuntamiento de Santa Gadea
  logo_url: z.string().url().optional(),
  config: z.object({
    vapi_enabled: z.boolean().default(true),
    retell_enabled: z.boolean().default(true),
    onyx_workspace_id: z.string().optional(),
    n8n_webhook_url: z.string().url().optional(),
  }),
  created_at: z.string().datetime(),
});

// === LLAMADA ===
export const LlamadaSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  fecha: z.string().datetime(),
  duracion_segundos: z.number().int().min(0),
  descripcion: z.string().max(500),
  proveedor: z.enum(['vapi', 'retell']),
  estado: z.enum(['completada', 'revision', 'fallida']),
  telefono_origen: z.string().optional(),
  transcripcion: z.string().optional(),
  audio_url: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
  created_at: z.string().datetime(),
});

// === INCIDENCIA ===
export const IncidenciaSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  titulo: z.string().min(5).max(200),
  descripcion: z.string().max(2000),
  ubicacion: z.string().max(300),
  prioridad: z.enum(['alta', 'media', 'baja']),
  estado: z.enum(['abierta', 'en_progreso', 'cerrada']),
  categoria: z.enum([
    'alumbrado', 
    'vias_publicas', 
    'agua', 
    'limpieza', 
    'otros'
  ]),
  reportado_por: z.string().optional(),
  asignado_a: z.string().optional(),
  notas: z.array(z.object({
    id: z.string().uuid(),
    texto: z.string(),
    autor: z.string(),
    fecha: z.string().datetime(),
  })).default([]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  closed_at: z.string().datetime().optional(),
});

// === COMUNICADO ===
export const ComunicadoSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  titulo: z.string().min(5).max(200),
  mensaje: z.string().max(5000),
  canal: z.enum(['whatsapp', 'email', 'ambos']),
  destinatarios_count: z.number().int().min(0),
  estado: z.enum(['borrador', 'enviado', 'fallido']),
  enviado_at: z.string().datetime().optional(),
  created_at: z.string().datetime(),
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
```

### 3.2 Mock Data Santa Gadea

```typescript
// data/mockSantaGadea.ts
export const TENANT_SANTA_GADEA = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  subdomain: "santagadea",
  nombre: "Ayuntamiento de Santa Gadea del Cid",
  logo_url: "/logos/santagadea.png",
  config: {
    vapi_enabled: true,
    retell_enabled: true,
    onyx_workspace_id: "ws_santagadea_001",
    n8n_webhook_url: "https://n8n.centralitaia.com/webhook/santagadea"
  },
  created_at: "2024-01-01T00:00:00Z"
};

export const LLAMADAS_MOCK = [
  {
    id: "call-001",
    tenant_id: TENANT_SANTA_GADEA.id,
    fecha: "2026-01-04T10:23:00Z",
    duracion_segundos: 154,
    descripcion: "Reserva piscina municipal sábado 11 enero",
    proveedor: "vapi",
    estado: "completada",
    telefono_origen: "+34 620 XXX XXX",
    transcripcion: `IA: Buenos días, Ayuntamiento de Santa Gadea, ¿en qué puedo ayudarle?
Usuario: Hola, quería reservar la piscina municipal para el sábado.
IA: Por supuesto. ¿Para cuántas personas sería la reserva?
Usuario: Somos 4 adultos y 2 niños.
IA: Perfecto. Le confirmo reserva para 6 personas el sábado 11 de enero. ¿Le envío confirmación por WhatsApp?
Usuario: Sí, gracias.
IA: Listo, reserva confirmada. ¿Necesita algo más?
Usuario: No, muchas gracias.
IA: A usted, que tenga buen día.`,
    created_at: "2026-01-04T10:23:00Z"
  },
  {
    id: "call-002",
    tenant_id: TENANT_SANTA_GADEA.id,
    fecha: "2026-01-04T09:15:00Z",
    duracion_segundos: 72,
    descripcion: "Información fiestas patronales agosto",
    proveedor: "retell",
    estado: "completada",
    created_at: "2026-01-04T09:15:00Z"
  },
  // ... 22 llamadas más simuladas para "24 hoy"
];

export const INCIDENCIAS_MOCK = [
  {
    id: "inc-001",
    tenant_id: TENANT_SANTA_GADEA.id,
    titulo: "Farola fundida Plaza Mayor",
    descripcion: "La farola situada junto al banco de la Plaza Mayor está fundida desde hace 3 días. Zona muy transitada por las noches.",
    ubicacion: "Plaza Mayor, junto al banco",
    prioridad: "alta",
    estado: "abierta",
    categoria: "alumbrado",
    reportado_por: "Vecino anónimo",
    notas: [],
    created_at: "2026-01-04T08:00:00Z",
    updated_at: "2026-01-04T08:00:00Z"
  },
  {
    id: "inc-002",
    tenant_id: TENANT_SANTA_GADEA.id,
    titulo: "Fuga de agua en C/ Iglesia",
    descripcion: "Se observa charco constante en la acera del número 5 de la Calle Iglesia. Posible fuga en tubería.",
    ubicacion: "C/ Iglesia, 5",
    prioridad: "alta",
    estado: "abierta",
    categoria: "agua",
    reportado_por: "María García",
    notas: [],
    created_at: "2026-01-04T09:30:00Z",
    updated_at: "2026-01-04T09:30:00Z"
  },
  {
    id: "inc-003",
    tenant_id: TENANT_SANTA_GADEA.id,
    titulo: "Bache en Avenida Principal",
    descripcion: "Bache de tamaño medio en la calzada, puede dañar vehículos.",
    ubicacion: "Av. Principal, altura nº 23",
    prioridad: "media",
    estado: "en_progreso",
    categoria: "vias_publicas",
    asignado_a: "Brigada Municipal",
    notas: [
      {
        id: "note-001",
        texto: "Material solicitado para reparación",
        autor: "Brigada Municipal",
        fecha: "2026-01-03T14:00:00Z"
      }
    ],
    created_at: "2026-01-02T10:00:00Z",
    updated_at: "2026-01-03T14:00:00Z"
  }
];

export const COMUNICADOS_MOCK = [
  {
    id: "com-001",
    tenant_id: TENANT_SANTA_GADEA.id,
    titulo: "Corte de agua programado",
    mensaje: "Se informa a los vecinos que el día 05/04 de 09:00 a 14:00 se realizarán trabajos de mantenimiento en la red de agua. Se recomienda aprovisionarse de agua para ese período.",
    canal: "whatsapp",
    destinatarios_count: 234,
    estado: "enviado",
    enviado_at: "2026-01-03T08:00:00Z",
    created_at: "2026-01-02T16:00:00Z"
  }
];

export const KPI_MOCK = {
  llamadas_hoy: 24,
  llamadas_semana: 156,
  incidencias_abiertas: 3,
  incidencias_cerradas_semana: 8,
  comunicados_enviados_semana: 12,
  satisfaccion_ia: 98
};
```

---

## 4. UX FLOWS

### 4.1 Flow: KPI → Modal → Acción

```
[Usuario ve Dashboard]
       │
       ▼
[Click en KPI "24 Llamadas hoy"]
       │
       ▼
[Modal: Lista rápida últimas llamadas]
   ┌─────────────────────────────────┐
   │ LLAMADAS HOY (24)        [X]   │
   │ ─────────────────────────────── │
   │ 10:23 - Reserva piscina   [→]  │
   │ 09:15 - Info fiestas      [→]  │
   │ 08:45 - Queja ruidos      [→]  │
   │ ...                            │
   │ ─────────────────────────────── │
   │ [Ver todas las llamadas →]     │
   └─────────────────────────────────┘
       │
       ├─── [Click fila] → Modal detalle llamada
       │
       └─── [Ver todas] → Navega a /llamadas
```

### 4.2 Flow: Crear Incidencia

```
[/incidencias]
       │
       ▼
[Click "+ Nueva Incidencia"]
       │
       ▼
[Dialog/Sheet lateral]
   ┌─────────────────────────────────┐
   │ NUEVA INCIDENCIA         [X]   │
   │                                │
   │ Título*: [________________]    │
   │                                │
   │ Categoría*: [Seleccionar ▼]    │
   │                                │
   │ Prioridad*: ○Alta ○Media ○Baja │
   │                                │
   │ Ubicación*: [________________] │
   │                                │
   │ Descripción:                   │
   │ [___________________________]  │
   │ [___________________________]  │
   │                                │
   │ [Cancelar]      [Crear →]      │
   └─────────────────────────────────┘
       │
       ▼
[Toast: "Incidencia creada correctamente"]
       │
       ▼
[Grid actualizado con nueva card]
```

### 4.3 Flow: Enviar Comunicado (n8n mock)

```
[/comunicados]
       │
       ▼
[Click "+ Nuevo Comunicado"]
       │
       ▼
[Form completo]
   ┌─────────────────────────────────┐
   │ NUEVO COMUNICADO               │
   │                                │
   │ Título*: [________________]    │
   │                                │
   │ Canal*: [x]WhatsApp [ ]Email   │
   │                                │
   │ Mensaje*:                      │
   │ [___________________________]  │
   │                                │
   │ Vista previa:                  │
   │ ┌───────────────────────────┐  │
   │ │ 💬 [Mensaje formateado]   │  │
   │ └───────────────────────────┘  │
   │                                │
   │ [Guardar borrador] [Enviar →]  │
   └─────────────────────────────────┘
       │
       ▼
[POST /api/comunicados → n8n webhook mock]
       │
       ▼
[Toast: "Comunicado enviado a 234 destinatarios"]
```

---

## 5. TECH DECISIONS

### 5.1 Stack Confirmado

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| **Framework** | React 19 + React Router | Ya instalado, SPA suficiente para demo |
| **Estilos** | Tailwind CSS + Shadcn/ui | Componentes pre-construidos, theming fácil |
| **Gráficos** | Recharts | Ya instalado, buen soporte para área/línea |
| **Estado** | Zustand | Ligero, simple, perfecto para demo |
| **Validación** | Zod | Ya instalado, tipado fuerte |
| **Backend** | FastAPI | Ya configurado, mock endpoints |
| **Storage Demo** | localStorage | Sin infra adicional, datos persisten |
| **Storage Prod** | MongoDB (ya configurado) | Multi-tenant ready |

### 5.2 Estructura de Carpetas

```
/app/frontend/src/
├── components/
│   ├── ui/              # Shadcn components
│   ├── layout/          # Sidebar, Header, etc.
│   ├── dashboard/       # KPICard, CallsChart, etc.
│   ├── llamadas/        # CallsTable, CallModal
│   ├── incidencias/     # IncidenciaCard, IncidenciaForm
│   └── comunicados/     # ComunicadoForm, ComunicadoList
├── pages/
│   ├── Dashboard.jsx
│   ├── Llamadas.jsx
│   ├── Incidencias.jsx
│   ├── Comunicados.jsx
│   └── Chatbot.jsx
├── stores/
│   └── useTenantStore.js
├── lib/
│   ├── api.js           # Axios instance
│   ├── storage.js       # localStorage helpers
│   └── utils.js
├── data/
│   └── mockSantaGadea.js
└── types/
    └── schemas.js       # Zod schemas
```

---

## 6. MULTI-TENANT LOGIC

### 6.1 Middleware Subdominio (Backend)

```python
# backend/middleware/tenant.py
from fastapi import Request, HTTPException
from typing import Optional

TENANTS = {
    "santagadea": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "nombre": "Ayuntamiento de Santa Gadea del Cid"
    },
    "demo": {
        "id": "demo-tenant-id",
        "nombre": "Demo Centralita"
    }
}

async def get_tenant_from_request(request: Request) -> dict:
    """Extrae tenant del subdominio o header"""
    # 1. Intentar desde subdominio
    host = request.headers.get("host", "")
    subdomain = host.split(".")[0] if "." in host else None
    
    # 2. Fallback a header X-Tenant
    if not subdomain or subdomain not in TENANTS:
        subdomain = request.headers.get("X-Tenant", "demo")
    
    if subdomain not in TENANTS:
        raise HTTPException(status_code=404, detail="Tenant no encontrado")
    
    return TENANTS[subdomain]
```

### 6.2 Frontend: Detección Tenant

```javascript
// lib/tenant.js
export function getTenantFromURL() {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // santagadea.centralitaia.com → santagadea
  // localhost → demo
  if (parts.length >= 3) {
    return parts[0];
  }
  
  return 'demo';
}

export function getTenantConfig(subdomain) {
  const configs = {
    santagadea: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      nombre: "Ayuntamiento de Santa Gadea del Cid",
      logo: "/logos/santagadea.png",
      primaryColor: "#1e3a5f" // Azul institucional
    },
    demo: {
      id: "demo-tenant-id",
      nombre: "Demo Centralita",
      logo: "/logos/demo.png",
      primaryColor: "#6366f1"
    }
  };
  
  return configs[subdomain] || configs.demo;
}
```

---

## 7. INTEGRACIONES DEMO

### 7.1 Onyx Chatbot (iframe)

```jsx
// components/chatbot/OnyxEmbed.jsx
export function OnyxEmbed({ workspaceId }) {
  // URL de Onyx Cloud con workspace del tenant
  const onyxUrl = `https://app.onyx.app/chat/${workspaceId}`;
  
  return (
    <div className="h-full w-full">
      <iframe
        src={onyxUrl}
        className="w-full h-full border-0 rounded-lg"
        title="Chatbot Onyx"
        allow="microphone"
      />
    </div>
  );
}
```

### 7.2 n8n Mock (Comunicados)

```javascript
// lib/n8n.js
const N8N_MOCK = true; // Toggle para demo

export async function sendComunicado(comunicado) {
  if (N8N_MOCK) {
    // Simular delay de envío
    await new Promise(r => setTimeout(r, 1500));
    
    return {
      success: true,
      destinatarios_enviados: comunicado.destinatarios_count,
      timestamp: new Date().toISOString()
    };
  }
  
  // Producción: llamar a n8n webhook real
  const response = await fetch(process.env.REACT_APP_N8N_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(comunicado)
  });
  
  return response.json();
}
```

### 7.3 Vapi/Retell Mock (Llamadas)

```javascript
// Backend generará llamadas mock
// En producción, webhooks de Vapi/Retell poblarán la BD
```

---

## 8. LISTA DE ACCIÓN ORDENADA

### Fase 1: Foundation (2-3h)
1. [ ] Crear estructura de carpetas
2. [ ] Configurar Zustand store para tenant
3. [ ] Implementar schemas Zod
4. [ ] Crear mock data Santa Gadea
5. [ ] Configurar localStorage helpers

### Fase 2: Layout & Navigation (2h)
6. [ ] Crear Sidebar component
7. [ ] Crear Header component
8. [ ] Implementar Layout wrapper
9. [ ] Configurar rutas React Router
10. [ ] Añadir detección de tenant

### Fase 3: Dashboard (2-3h)
11. [ ] Crear KPICard component
12. [ ] Implementar CallsChart (Recharts)
13. [ ] Crear RecentActivity list
14. [ ] Crear QuickActions
15. [ ] Integrar modal KPI → detalle

### Fase 4: Llamadas (2h)
16. [ ] Crear CallsTable con filtros
17. [ ] Implementar CallDetailModal
18. [ ] Añadir paginación
19. [ ] Conectar con mock data

### Fase 5: Incidencias (2-3h)
20. [ ] Crear IncidenciaCard
21. [ ] Implementar IncidenciasGrid
22. [ ] Crear IncidenciaDetailModal
23. [ ] Implementar IncidenciaForm
24. [ ] Añadir CRUD localStorage

### Fase 6: Comunicados (1-2h)
25. [ ] Crear ComunicadosList
26. [ ] Implementar ComunicadoForm
27. [ ] Añadir preview de mensaje
28. [ ] Conectar con n8n mock

### Fase 7: Chatbot (30min)
29. [ ] Crear página Chatbot
30. [ ] Implementar OnyxEmbed iframe

### Fase 8: Polish & Testing (1-2h)
31. [ ] Añadir estados de carga
32. [ ] Implementar error boundaries
33. [ ] Testing E2E con testing_agent
34. [ ] Ajustes responsive

---

## 9. DISEÑO VISUAL

### 9.1 Color Palette (Institucional)

```css
:root {
  /* Primarios - Azul institucional */
  --azul-900: #1e3a5f;
  --azul-700: #2d5a87;
  --azul-500: #3b7ab8;
  
  /* Acentos */
  --dorado: #c9a227;
  --verde-ok: #10b981;
  --rojo-alerta: #ef4444;
  --amarillo-warning: #f59e0b;
  
  /* Neutros */
  --slate-900: #0f172a;
  --slate-700: #334155;
  --slate-400: #94a3b8;
  --slate-100: #f1f5f9;
  --white: #ffffff;
  
  /* Superficies */
  --surface-1: var(--white);
  --surface-2: var(--slate-100);
  --surface-3: var(--slate-700);
}
```

### 9.2 Tipografía

```css
/* Display: DM Sans - Moderno, legible */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

/* Monospace para datos: JetBrains Mono */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --font-sans: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

---

**Documento validado y listo para implementación.**
