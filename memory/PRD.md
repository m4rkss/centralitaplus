# Centralita Virtual Ayuntamiento - PRD

## Información del Proyecto
- **Nombre**: Centralita Virtual IA
- **Tipo**: SaaS Multi-tenant
- **Cliente Demo**: Ayuntamiento de Santa Gadea del Cid (Burgos/CyL)
- **Fecha Inicio**: 04/01/2026

## Arquitectura

### Stack Tecnológico
| Capa | Tecnología |
|------|------------|
| Frontend | React 19, Tailwind CSS, Shadcn/ui |
| State Management | Zustand (auth + data stores) |
| Gráficos | Recharts |
| Backend | FastAPI + JWT Auth |
| Database | MongoDB |
| Auth | JWT (HS256, 24h expiration) |
| Password | bcrypt (passlib) |
| Integraciones | Vapi, Retell, Onyx Cloud, n8n |

### Multi-Tenant Architecture
- **Tenant Detection**: Subdominio → tenant_id (santagadea.centralitaia.com → santa-gadea)
- **Data Isolation**: ALL queries include WHERE tenant_id = session.tenant_id
- **JWT Payload**: {sub: userId, tenant_id, rol, exp, iat}
- **Protected Routes**: Redirect to /login if not authenticated

### Estructura de Carpetas
```
/app/frontend/src/
├── components/
│   ├── ui/              # Shadcn components
│   ├── layout/          # Sidebar, Header, Layout
│   └── dashboard/       # KPICard, CallsChart, etc.
├── pages/               # Dashboard, Llamadas, Incidencias, etc.
├── stores/              # Zustand stores
├── data/                # Mock data Santa Gadea
├── types/               # Zod schemas
└── lib/                 # Utilities
```

## User Personas
1. **Admin Municipal**: Gestiona llamadas, incidencias y comunicados
2. **Técnico**: Resuelve incidencias y actualiza estados
3. **Ciudadano**: Usa el chatbot Onyx para consultas

## Core Requirements (Static)
- [x] Dashboard con KPIs en tiempo real
- [x] Gráfico de llamadas por proveedor (Vapi/Retell)
- [x] Tabla de llamadas con filtros y transcripción
- [x] Gestión de incidencias con prioridades
- [x] Sistema de comunicados (mock n8n)
- [x] Chatbot RAG con Onyx Cloud
- [x] Multi-tenant con detección de subdominio

## Implementado (04/01/2026)

### Autenticación Multi-Tenant ✅ (Nuevo)
- **Login Page**: Detección automática de tenant desde subdominio
- **JWT Auth**: HS256, 24h expiration, payload con tenant_id
- **Seed Data**: admin@santa-gadea.es/pass123, secretaria@santa-gadea.es/pass123
- **Protected Routes**: Todas las rutas requieren autenticación
- **Tenant Isolation**: Todos los datos filtrados por tenant_id
- **User Header**: Nombre de usuario + rol + logout

### Fase 1: Foundation ✅
- Schemas Zod para tipos
- Mock data completo Santa Gadea (24 llamadas, 4 incidencias, 3 comunicados)
- Zustand stores con localStorage persistence

### Fase 2: Layout & Navigation ✅
- Sidebar colapsable con navegación
- Header con búsqueda y usuario
- Layout responsivo

### Fase 3: Dashboard ✅
- KPICards interactivas (click → modal)
- Gráfico Recharts área con Vapi/Retell
- Actividad reciente
- Acciones rápidas

### Fase 4: Llamadas ✅
- Tabla paginada con filtros
- Modal detalle con transcripción
- Badges por proveedor y estado

### Fase 5: Incidencias ✅
- Grid de cards por prioridad
- Formulario crear/editar
- Sistema de notas
- Cambio de estado

### Fase 6: Comunicados ✅
- Lista con stats
- Formulario con preview
- Selección de canal (WA/Email/Ambos)
- Mock n8n con delay

### Fase 7: Chatbot NATIVO ✅ (Actualizado - 100% Responsive)
- **Chat Nativo RAG** (NO iframe)
- API proxy: `/api/onyx-chat` → Onyx Cloud
- Mock fallback Santa Gadea (fiestas 14-17 agosto)
- Markdown rendering (react-markdown)
- MessageBubbles user/assistant con avatars
- Quick suggestions
- FileUpload (mock)
- **Responsive Design**:
  - Mobile (< 640px): Fullscreen chat, hamburger menu
  - Tablet (768px): Adaptive layout
  - Desktop (1024px+): Floating 400x600px window
- ChatDock global (oculto en /chatbot)
- Tabs: Chat Nativo / Iframe Onyx
- UX: Typing dots, clear chat, minimize/maximize

### Fase 8: Configuración ✅
- Info del tenant
- Cambio de tenant (demo)
- Switches de integraciones

## Backlog (Priorizado)

### P0 - Crítico (Next Sprint)
- [ ] Autenticación real con JWT
- [ ] Backend API para persistencia
- [ ] Webhooks reales Vapi/Retell

### P1 - Importante
- [ ] Dashboard analytics avanzados
- [ ] Exportación CSV/PDF
- [ ] Notificaciones push
- [ ] Histórico de incidencias

### P2 - Nice to Have
- [ ] Modo oscuro/claro toggle
- [ ] Multi-idioma (ES/EN)
- [ ] App móvil PWA
- [ ] Integración calendario

## URLs
- **Preview**: https://switchboard-pro-2.preview.emergentagent.com
- **Tenant Demo**: ?tenant=santagadea (query param para desarrollo)

## Notas Técnicas
- Los datos se almacenan en localStorage para la demo
- El iframe de Onyx requiere autenticación en el servicio externo
- n8n está mockeado con setTimeout (1.5s delay)
