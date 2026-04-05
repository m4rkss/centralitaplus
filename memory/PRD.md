# Centralita Virtual - PRD

## Project Overview
Sistema SaaS multi-tenant de gestión de centralita telefónica para ayuntamientos.

## Tech Stack
| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, Tailwind CSS, Shadcn UI, Zustand, Recharts |
| Backend | Python 3.11, FastAPI, SQLAlchemy |
| Base de datos | PostgreSQL 15 |

## Database Schema (PostgreSQL)
- `tenants` - Configuración multi-tenant
- `users` - Usuarios con roles (admin/user)
- `llamadas` - Registro de llamadas telefónicas
- `incidencias` - Gestión de incidencias ciudadanas  
- `comunicados` - Comunicados por WhatsApp/Email
- `password_resets` - Tokens de recuperación

## What's Been Implemented
- [x] Migración completa de MongoDB a PostgreSQL (05/04/2026)
- [x] Modelos SQLAlchemy con relaciones
- [x] Seed data para tenant Santa Gadea
- [x] 135 llamadas, 3 incidencias, 1 comunicado
- [x] Autenticación JWT funcional
- [x] Dashboard con KPIs en tiempo real
- [x] Sistema de notificaciones in-app (05/04/2026)
  - Badge con contador de no leídas
  - Panel dropdown con lista scrolleable
  - Tabs: Todas / No leídas / Urgentes
  - Marcar como leída individual y masivo
  - Navegación a módulo relacionado
  - Persistencia con Zustand + localStorage
  - 10 notificaciones mock realistas
- [x] Notificaciones Push del navegador (05/04/2026)
  - Service Worker para push notifications
  - Banner de solicitud de permisos
  - Botón "Test" para probar push
  - Control en página de Configuración
  - Soporte para notificaciones urgentes (requireInteraction)
  - Click en notificación navega a módulo relacionado

## Push Notification Types
- incidencia_nueva, incidencia_prioritaria, incidencia_retrasada
- llamada_derivada, llamada_resumen
- comunicado_enviado, comunicado_error
- reserva_nueva, documento_indexado

## Credentials
- PostgreSQL: `centralita:centralita123@localhost:5432/centralita_db`
- Admin: `admin@santa-gadea.es` / `pass123`
- Secretaria: `secretaria@santa-gadea.es` / `pass123`

## Files Created/Modified for Push
- `/app/frontend/public/sw.js` - Service Worker
- `/app/frontend/src/hooks/usePushNotifications.js` - Hook principal
- `/app/frontend/src/hooks/useRealtimeNotifications.js` - Demo realtime
- `/app/frontend/src/components/notifications/PushNotificationBanner.jsx`
- `/app/frontend/src/stores/useNotificationStore.js` - pushEnabled state

## Next Tasks / Backlog
- P1: Backend WebSocket para notificaciones en tiempo real
- P1: Endpoint CRUD de notificaciones
- P2: Configuración granular de tipos de notificación
- P2: Notificaciones por email (resumen diario)
