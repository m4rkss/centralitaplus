# Centralita Virtual Ayuntamiento

Sistema SaaS multi-tenant de gestión de centralita telefónica para ayuntamientos. Desarrollado con React, FastAPI y MongoDB.

---

## Funcionalidades

- **Dashboard** con KPIs en tiempo real (llamadas, incidencias, comunicados)
- **Gestión de Llamadas** — registro y seguimiento de llamadas entrantes/salientes
- **Incidencias** — creación, asignación y resolución de incidencias ciudadanas
- **Comunicados** — envío de comunicados por múltiples canales
- **Chatbot** — asistente integrado con Onyx Cloud
- **Multi-tenant** — aislamiento completo de datos por ayuntamiento (tenantId)
- **Autenticación JWT** — login seguro con tokens y roles

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, Tailwind CSS, Shadcn UI, Zustand, Recharts |
| Backend | Python 3.11, FastAPI, PyJWT |
| Base de datos | MongoDB 6.0 |
| Infraestructura | Docker, Nginx |

---

## Inicio Rápido con Docker

```bash
# 1. Clonar repositorio
git clone https://github.com/m4rkss/centralitaplus.git
cd centralitaplus
git checkout emergentDev

# 2. Configurar variables de entorno
cp backend/.env.example backend/.env.production
# Editar backend/.env.production con tus valores

# 3. Levantar servicios
REACT_APP_BACKEND_URL=https://tu-dominio.com docker compose up -d --build

# 4. Verificar
docker compose ps
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **MongoDB**: localhost:27017

---

## Desarrollo Local

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8001

# Frontend (otra terminal)
cd frontend
yarn install
yarn start
```

> Documentación completa de desarrollo: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)

---

## Credenciales por Defecto

| Rol | Email | Password |
|-----|-------|----------|
| Admin | admin@santa-gadea.es | pass123 |
| Secretaria | secretaria@santa-gadea.es | pass123 |

---

## Estructura del Proyecto

```
centralitaplus/
├── backend/
│   ├── server.py             # API FastAPI + Auth + Mock DB
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/       # UI (auth, chatbot, dashboard, layout)
│   │   ├── pages/            # Login, Dashboard, Llamadas, Incidencias...
│   │   ├── stores/           # Zustand (estado global)
│   │   └── data/             # Datos mock
│   ├── Dockerfile
│   └── package.json
├── docs/
│   ├── DEPLOYMENT.md         # Guía despliegue VPS con Docker
│   └── DEVELOPMENT.md        # Guía desarrollo local con VS Code
├── docker-compose.yml
└── README.md
```

---

## Despliegue en VPS

Guía completa con Docker, Nginx, SSL y configuración multi-tenant:

> [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Inicio de sesión (devuelve JWT) |
| GET | `/api/auth/me` | Verificar sesión activa |
| GET | `/api/kpis` | KPIs del dashboard |
| GET | `/api/llamadas` | Listado de llamadas |
| GET | `/api/incidencias` | Listado de incidencias |
| GET | `/api/comunicados` | Listado de comunicados |
| POST | `/api/onyx-chat` | Proxy chatbot Onyx Cloud |

> Todas las rutas (excepto login) requieren header `Authorization: Bearer <token>`

---

## Licencia

Proyecto privado. Todos los derechos reservados.
