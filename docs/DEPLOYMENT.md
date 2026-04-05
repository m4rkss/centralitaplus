# Despliegue en VPS con Docker

## Requisitos Previos

### En tu VPS:
- **Sistema Operativo**: Ubuntu 20.04+ / Debian 11+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **RAM**: Mínimo 2GB (recomendado 4GB)
- **CPU**: 2 cores
- **Almacenamiento**: 20GB+

### Puertos a abrir:
- `80` (HTTP)
- `443` (HTTPS)
- `27017` (MongoDB - solo interno)

---

## 1. Preparación del VPS

### Instalar Docker y Docker Compose

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Añadir repositorio Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Añadir usuario al grupo docker
sudo usermod -aG docker $USER
newgrp docker

# Verificar instalación
docker --version
docker compose version
```

---

## 2. Clonar el Repositorio

```bash
# Crear directorio de la aplicación
mkdir -p /opt/centralita
cd /opt/centralita

# Clonar repositorio
git clone https://github.com/m4rkss/centralitaplus.git .
git checkout emergentDev
```

---

## 3. Configurar Variables de Entorno

### Backend (.env)

```bash
# Crear archivo de entorno para producción
cat > backend/.env.production << 'EOF'
# MongoDB
MONGO_URL=mongodb://mongo:27017
DB_NAME=centralita_prod

# JWT
JWT_SECRET=tu-clave-secreta-muy-segura-cambiar-en-produccion
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Onyx (opcional)
ONYX_API_URL=https://cloud.onyx.app/api/v1
ONYX_API_KEY=tu-api-key
ONYX_PROJECT_ID=tu-project-id

# Ambiente
ENVIRONMENT=production
EOF
```

### Frontend (.env)

```bash
cat > frontend/.env.production << 'EOF'
REACT_APP_BACKEND_URL=https://tu-dominio.com
EOF
```

---

## 4. Configurar Docker

### Crear red de Docker

```bash
docker network create centralita-network
```

### Levantar servicios

```bash
# Construir y levantar en modo detached
docker compose -f docker-compose.yml up -d --build

# Ver logs
docker compose logs -f

# Ver estado de contenedores
docker compose ps
```

---

## 5. Configurar Nginx como Reverse Proxy (Opcional pero recomendado)

### Instalar Nginx

```bash
sudo apt install -y nginx
```

### Configuración Nginx

```bash
sudo cat > /etc/nginx/sites-available/centralita << 'EOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name tu-dominio.com *.tu-dominio.com;
    return 301 https://$server_name$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name tu-dominio.com *.tu-dominio.com;

    # SSL certificates (usar Certbot para generar)
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Logs
    access_log /var/log/nginx/centralita.access.log;
    error_log /var/log/nginx/centralita.error.log;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts para llamadas largas
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
}
EOF

# Activar sitio
sudo ln -s /etc/nginx/sites-available/centralita /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Obtener certificado SSL con Certbot

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com -d *.tu-dominio.com

# Renovación automática (ya configurado por Certbot)
sudo systemctl status certbot.timer
```

---

## 6. Configurar Multi-Tenant con Subdominios

### DNS Configuration

Añade estos registros DNS en tu proveedor:

| Tipo | Nombre | Valor |
|------|--------|-------|
| A | @ | IP_DE_TU_VPS |
| A | * | IP_DE_TU_VPS |
| CNAME | santagadea | tu-dominio.com |

### Ejemplo de subdominios:
- `santagadea.tu-dominio.com` → Tenant Santa Gadea
- `demo.tu-dominio.com` → Tenant Demo

---

## 7. Comandos Útiles

### Gestión de contenedores

```bash
# Ver logs en tiempo real
docker compose logs -f backend
docker compose logs -f frontend

# Reiniciar servicio específico
docker compose restart backend

# Parar todos los servicios
docker compose down

# Parar y eliminar volúmenes (¡CUIDADO! Elimina datos)
docker compose down -v

# Reconstruir sin caché
docker compose build --no-cache
docker compose up -d
```

### Backup de MongoDB

```bash
# Crear backup
docker exec centralita-mongo mongodump --out /backup/$(date +%Y%m%d)

# Copiar backup a host
docker cp centralita-mongo:/backup ./backups/

# Restaurar backup
docker exec centralita-mongo mongorestore /backup/20260104
```

### Monitorización

```bash
# Ver uso de recursos
docker stats

# Ver espacio en disco
docker system df

# Limpiar recursos no utilizados
docker system prune -a
```

---

## 8. Troubleshooting

### El frontend no conecta con el backend

```bash
# Verificar que el backend está corriendo
docker compose ps
curl http://localhost:8001/api/health

# Ver logs del backend
docker compose logs backend
```

### Error de conexión a MongoDB

```bash
# Verificar MongoDB
docker compose logs mongo
docker exec -it centralita-mongo mongosh --eval "db.adminCommand('ping')"
```

### Problemas de permisos

```bash
# Asegurar permisos correctos
sudo chown -R $USER:$USER /opt/centralita
chmod -R 755 /opt/centralita
```

### Reiniciar todo desde cero

```bash
cd /opt/centralita
docker compose down -v
docker system prune -a
docker compose up -d --build
```

---

## 9. Actualizaciones

### Actualizar la aplicación

```bash
cd /opt/centralita

# Obtener últimos cambios
git pull origin emergentDev

# Reconstruir y reiniciar
docker compose down
docker compose up -d --build

# Verificar
docker compose ps
docker compose logs -f
```

---

## 10. Seguridad Adicional

### Firewall (UFW)

```bash
# Instalar y configurar UFW
sudo apt install -y ufw

sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### Fail2ban

```bash
# Instalar
sudo apt install -y fail2ban

# Configurar para Nginx
sudo cat > /etc/fail2ban/jail.local << 'EOF'
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/centralita.error.log
maxretry = 5
bantime = 3600
EOF

sudo systemctl restart fail2ban
```

---

## Arquitectura de Despliegue

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    NGINX (Reverse Proxy)                    │
│                    - SSL Termination                        │
│                    - Load Balancing                         │
│                    - Subdomain Routing                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ▼                           ▼
┌───────────────────────┐   ┌───────────────────────┐
│   Frontend (React)    │   │   Backend (FastAPI)   │
│   Port: 3000          │   │   Port: 8001          │
│   - Nginx serve       │   │   - JWT Auth          │
│   - Static files      │   │   - REST API          │
└───────────────────────┘   └───────────┬───────────┘
                                        │
                                        ▼
                            ┌───────────────────────┐
                            │   MongoDB             │
                            │   Port: 27017         │
                            │   - Data persistence  │
                            └───────────────────────┘
```

---

## Soporte

Para problemas o dudas:
- Revisar logs: `docker compose logs -f`
- GitHub Issues: https://github.com/m4rkss/centralitaplus/issues
