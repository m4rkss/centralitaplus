# Centralita Virtual - PRD

## Project Overview
Sistema SaaS multi-tenant de gestión de centralita telefónica para ayuntamientos.

## Tech Stack
| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, Tailwind CSS, Shadcn UI, Zustand, Recharts |
| Backend | Python 3.11, FastAPI, SQLAlchemy, httpx |
| Base de datos | PostgreSQL 15 |
| Integraciones | n8n webhooks |

## What's Been Implemented

### Core Features
- [x] Migración completa de MongoDB a PostgreSQL
- [x] Autenticación JWT funcional
- [x] Dashboard con KPIs en tiempo real
- [x] Gestión de llamadas, incidencias y comunicados
- [x] Sistema de notificaciones in-app con push del navegador

### n8n Integration (05/04/2026)
- [x] Endpoint POST `/api/comunicados/enviar` para envío vía n8n
- [x] Payload estructurado hacia webhook n8n
- [x] Manejo de errores: timeout, conexión, respuesta inválida
- [x] Estados de comunicado: borrador, en_proceso, enviado, error
- [x] Request ID para trazabilidad
- [x] Modo mock cuando N8N_COMUNICADOS_WEBHOOK_URL no está configurado
- [x] Frontend con validación, loading states y toasts

## n8n Integration Details

### Environment Variables
```
N8N_COMUNICADOS_WEBHOOK_URL=https://your-n8n.com/webhook/comunicados
N8N_WEBHOOK_TIMEOUT=30
```

### Payload sent to n8n
```json
{
  "tenant_id": "santa-gadea",
  "municipio": "Ayuntamiento de Santa Gadea del Cid",
  "comunicado_id": "uuid",
  "request_id": "req-xxxx",
  "title": "Aviso corte de agua",
  "channel": "whatsapp",
  "message": "Mensaje del comunicado...",
  "created_by": "admin@santa-gadea.es",
  "source": "centralita-dashboard",
  "timestamp": "ISO8601"
}
```

### Expected n8n Response
```json
{
  "success": true,
  "workflowExecutionId": "abc123",
  "status": "queued",
  "message": "Comunicado enviado al workflow",
  "destinatarios_count": 150
}
```

## Credentials
- PostgreSQL: `centralita:centralita123@localhost:5432/centralita_db`
- Admin: `admin@santa-gadea.es` / `pass123`

## Files Modified for n8n Integration
- `/app/backend/server.py` - Nuevo endpoint y modelos
- `/app/backend/.env` - Variables N8N_*
- `/app/frontend/src/stores/useTenantStore.js` - enviarComunicado()
- `/app/frontend/src/pages/Comunicados.jsx` - Validación y UX

## Next Tasks / Backlog
- P1: Configurar webhook real de n8n en producción
- P2: Callback endpoint para actualizar estado desde n8n
- P2: Historial de envíos con workflowExecutionId
- P3: Reintentos automáticos en caso de error
