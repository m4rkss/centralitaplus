# ──────────────────────────────────────────────
# Centralita Virtual - Frontend (React)
# ──────────────────────────────────────────────

# --- Etapa 1: Build ---
FROM node:18-alpine AS build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

RUN yarn build

# --- Etapa 2: Servir con Nginx ---
FROM nginx:alpine

# Copiar build de React
COPY --from=build /app/build /usr/share/nginx/html

# Configuración Nginx para SPA (React Router)
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 3000;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Compresión gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # Cache de assets estáticos
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback - todas las rutas van a index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
