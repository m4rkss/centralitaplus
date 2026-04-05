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
- [x] Migración completa de MongoDB a PostgreSQL (04/05/2026)
- [x] Modelos SQLAlchemy con relaciones
- [x] Seed data para tenant Santa Gadea
- [x] 135 llamadas, 3 incidencias, 1 comunicado
- [x] Autenticación JWT funcional
- [x] Dashboard con KPIs en tiempo real
- [x] Sistema de notificaciones funcional (05/04/2026)
  - Badge con contador de no leídas
  - Panel dropdown con lista scrolleable
  - Tabs: Todas / No leídas / Urgentes
  - Marcar como leída individual y masivo
  - Navegación a módulo relacionado
  - Persistencia con Zustand + localStorage
  - 10 notificaciones mock realistas para Santa Gadea
  - Responsive (desktop + móvil)

## Notification Types
- incidencia_nueva, incidencia_prioritaria, incidencia_retrasada, incidencia_cerrada
- llamada_derivada, llamada_resumen
- comunicado_enviado, comunicado_error
- reserva_nueva, documento_indexado

## Credentials
- PostgreSQL: `centralita:centralita123@localhost:5432/centralita_db`
- Admin: `admin@santa-gadea.es` / `pass123`
- Secretaria: `secretaria@santa-gadea.es` / `pass123`

## API Endpoints
All routes require JWT except `/api/auth/login` and `/api/tenant`

## Next Tasks / Backlog
- P1: Backend endpoint para notificaciones reales (CRUD)
- P1: WebSocket para notificaciones en tiempo real
- P2: Configuración de preferencias de notificaciones por usuario
- P2: Alembic migrations para cambios de schema
