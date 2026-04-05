# Desarrollo Local con Visual Studio Code

## Requisitos Previos

### Software necesario:
- **Node.js**: 18.x o superior
- **Python**: 3.11+
- **MongoDB**: 6.0+ (local o Docker)
- **Git**: 2.x+
- **Visual Studio Code**: Última versión

### Extensiones recomendadas de VS Code:
- **Python** (ms-python.python)
- **Pylance** (ms-python.vscode-pylance)
- **ESLint** (dbaeumer.vscode-eslint)
- **Prettier** (esbenp.prettier-vscode)
- **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)
- **MongoDB for VS Code** (mongodb.mongodb-vscode)
- **Thunder Client** (rangav.vscode-thunder-client) - Para probar APIs
- **GitLens** (eamodio.gitlens)
- **Docker** (ms-azuretools.vscode-docker)

---

## 1. Clonar el Repositorio

```bash
# Clonar
git clone https://github.com/m4rkss/centralitaplus.git
cd centralitaplus
git checkout emergentDev

# Abrir en VS Code
code .
```

---

## 2. Configurar MongoDB Local

### Opción A: Docker (Recomendado)

```bash
# Crear y ejecutar contenedor MongoDB
docker run -d \
  --name centralita-mongo-dev \
  -p 27017:27017 \
  -v centralita-mongo-data:/data/db \
  mongo:6.0

# Verificar que está corriendo
docker ps
```

### Opción B: Instalación local

```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# macOS con Homebrew
brew tap mongodb/brew
brew install mongodb-community@6.0
brew services start mongodb-community@6.0
```

---

## 3. Configurar Backend (Python/FastAPI)

### Crear entorno virtual

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### Configurar variables de entorno

```bash
# Crear archivo .env
cat > .env << 'EOF'
# MongoDB
MONGO_URL=mongodb://localhost:27017
DB_NAME=centralita_dev

# JWT
JWT_SECRET=dev-secret-key-cambiar-en-produccion
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Onyx (opcional para desarrollo)
ONYX_API_URL=https://cloud.onyx.app/api/v1
ONYX_API_KEY=
ONYX_PROJECT_ID=

# Ambiente
ENVIRONMENT=development
EOF
```

### Ejecutar backend

```bash
# Desde el directorio backend/
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

---

## 4. Configurar Frontend (React)

### Instalar dependencias

```bash
cd frontend

# Instalar con yarn (recomendado)
yarn install

# O con npm
npm install
```

### Configurar variables de entorno

```bash
# Crear archivo .env
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=http://localhost:8001
EOF
```

### Ejecutar frontend

```bash
# Desde el directorio frontend/
yarn start
# O
npm start
```

---

## 5. Configuración de VS Code

### Crear carpeta .vscode

```bash
mkdir -p .vscode
```

### settings.json

```json
{
  // Editor
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  
  // Python
  "python.defaultInterpreterPath": "${workspaceFolder}/backend/venv/bin/python",
  "python.formatting.provider": "none",
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.formatOnSave": true,
    "editor.tabSize": 4
  },
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": false,
  "python.linting.flake8Enabled": true,
  "python.analysis.typeCheckingMode": "basic",
  
  // JavaScript/TypeScript
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  
  // Tailwind CSS
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "tailwindCSS.includeLanguages": {
    "javascript": "javascript",
    "javascriptreact": "javascript"
  },
  
  // ESLint
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  
  // Files
  "files.exclude": {
    "**/__pycache__": true,
    "**/*.pyc": true,
    "**/node_modules": true,
    "**/.git": true
  },
  
  // Search
  "search.exclude": {
    "**/node_modules": true,
    "**/venv": true,
    "**/.git": true,
    "**/build": true
  },
  
  // Emmet
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

### launch.json (Configuración de Debug)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: Backend FastAPI",
      "type": "debugpy",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "server:app",
        "--reload",
        "--host", "0.0.0.0",
        "--port", "8001"
      ],
      "cwd": "${workspaceFolder}/backend",
      "envFile": "${workspaceFolder}/backend/.env",
      "jinja": true,
      "justMyCode": false,
      "console": "integratedTerminal"
    },
    {
      "name": "Python: Debug Current File",
      "type": "debugpy",
      "request": "launch",
      "program": "${file}",
      "cwd": "${workspaceFolder}/backend",
      "envFile": "${workspaceFolder}/backend/.env",
      "console": "integratedTerminal"
    },
    {
      "name": "Chrome: Frontend React",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/frontend/src",
      "sourceMapPathOverrides": {
        "webpack:///src/*": "${webRoot}/*"
      }
    },
    {
      "name": "Node: Debug Frontend",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "yarn",
      "runtimeArgs": ["start"],
      "cwd": "${workspaceFolder}/frontend",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ],
  "compounds": [
    {
      "name": "Full Stack: Backend + Frontend",
      "configurations": ["Python: Backend FastAPI", "Chrome: Frontend React"],
      "stopAll": true
    }
  ]
}
```

### tasks.json (Tareas automatizadas)

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Backend: Install Dependencies",
      "type": "shell",
      "command": "pip install -r requirements.txt",
      "options": {
        "cwd": "${workspaceFolder}/backend"
      },
      "group": "build"
    },
    {
      "label": "Backend: Run Server",
      "type": "shell",
      "command": "uvicorn server:app --reload --host 0.0.0.0 --port 8001",
      "options": {
        "cwd": "${workspaceFolder}/backend"
      },
      "isBackground": true,
      "problemMatcher": []
    },
    {
      "label": "Frontend: Install Dependencies",
      "type": "shell",
      "command": "yarn install",
      "options": {
        "cwd": "${workspaceFolder}/frontend"
      },
      "group": "build"
    },
    {
      "label": "Frontend: Run Dev Server",
      "type": "shell",
      "command": "yarn start",
      "options": {
        "cwd": "${workspaceFolder}/frontend"
      },
      "isBackground": true,
      "problemMatcher": []
    },
    {
      "label": "Frontend: Build Production",
      "type": "shell",
      "command": "yarn build",
      "options": {
        "cwd": "${workspaceFolder}/frontend"
      },
      "group": "build"
    },
    {
      "label": "Frontend: Lint",
      "type": "shell",
      "command": "yarn lint",
      "options": {
        "cwd": "${workspaceFolder}/frontend"
      },
      "problemMatcher": ["$eslint-compact"]
    },
    {
      "label": "Docker: Start MongoDB",
      "type": "shell",
      "command": "docker start centralita-mongo-dev || docker run -d --name centralita-mongo-dev -p 27017:27017 -v centralita-mongo-data:/data/db mongo:6.0",
      "problemMatcher": []
    },
    {
      "label": "Docker: Stop MongoDB",
      "type": "shell",
      "command": "docker stop centralita-mongo-dev",
      "problemMatcher": []
    },
    {
      "label": "Full Stack: Start All",
      "dependsOn": [
        "Docker: Start MongoDB",
        "Backend: Run Server",
        "Frontend: Run Dev Server"
      ],
      "dependsOrder": "sequence",
      "problemMatcher": []
    }
  ]
}
```

### extensions.json (Extensiones recomendadas)

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.vscode-pylance",
    "ms-python.black-formatter",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "mongodb.mongodb-vscode",
    "rangav.vscode-thunder-client",
    "eamodio.gitlens",
    "ms-azuretools.vscode-docker",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "dsznajder.es7-react-js-snippets"
  ]
}
```

---

## 6. Flujo de Desarrollo

### Iniciar entorno de desarrollo

```bash
# Terminal 1: MongoDB (si usas Docker)
docker start centralita-mongo-dev

# Terminal 2: Backend
cd backend
source venv/bin/activate  # Linux/macOS
# o venv\Scripts\activate  # Windows
uvicorn server:app --reload --host 0.0.0.0 --port 8001

# Terminal 3: Frontend
cd frontend
yarn start
```

### O usar VS Code Tasks

1. Presiona `Ctrl+Shift+P` (o `Cmd+Shift+P` en macOS)
2. Escribe "Tasks: Run Task"
3. Selecciona "Full Stack: Start All"

---

## 7. Debugging

### Debug del Backend (Python)

1. Abre VS Code
2. Ve a la pestaña "Run and Debug" (Ctrl+Shift+D)
3. Selecciona "Python: Backend FastAPI"
4. Presiona F5 o el botón de Play
5. Coloca breakpoints haciendo clic en el margen izquierdo del código

### Debug del Frontend (React)

1. Asegúrate de que el frontend está corriendo (`yarn start`)
2. En VS Code, selecciona "Chrome: Frontend React"
3. Presiona F5
4. Se abrirá Chrome con las DevTools de React
5. Coloca breakpoints en el código JavaScript/JSX

### Debug Full Stack

1. Selecciona "Full Stack: Backend + Frontend" en el dropdown
2. Presiona F5
3. Ambos debuggers se iniciarán simultáneamente

---

## 8. Testing

### Backend Tests

```bash
cd backend

# Ejecutar tests
pytest

# Con coverage
pytest --cov=. --cov-report=html

# Ver reporte
open htmlcov/index.html
```

### Frontend Tests

```bash
cd frontend

# Ejecutar tests
yarn test

# Con coverage
yarn test --coverage

# Tests en modo watch
yarn test --watch
```

---

## 9. Linting y Formateo

### Backend

```bash
cd backend

# Formatear código
black .

# Linting
flake8 .

# Type checking
mypy .
```

### Frontend

```bash
cd frontend

# Linting
yarn lint

# Formatear
yarn format  # Si está configurado
# O usar Prettier directamente
npx prettier --write "src/**/*.{js,jsx,ts,tsx,css}"
```

---

## 10. Estructura del Proyecto

```
centralitaplus/
├── backend/
│   ├── venv/                 # Entorno virtual Python
│   ├── server.py             # Aplicación FastAPI principal
│   ├── requirements.txt      # Dependencias Python
│   ├── .env                  # Variables de entorno (no commitear)
│   └── tests/                # Tests del backend
│
├── frontend/
│   ├── node_modules/         # Dependencias Node.js
│   ├── public/               # Archivos estáticos
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── pages/            # Páginas
│   │   ├── stores/           # Zustand stores
│   │   ├── lib/              # Utilidades
│   │   ├── App.js            # Componente principal
│   │   └── index.js          # Entry point
│   ├── package.json          # Dependencias y scripts
│   ├── .env                  # Variables de entorno
│   └── tailwind.config.js    # Configuración Tailwind
│
├── docs/                     # Documentación
├── .vscode/                  # Configuración VS Code
├── docker-compose.yml        # Docker Compose
└── README.md                 # Documentación principal
```

---

## 11. Troubleshooting

### Error: "Module not found" en Python

```bash
# Asegúrate de tener el entorno virtual activado
source backend/venv/bin/activate
pip install -r backend/requirements.txt
```

### Error: "Cannot connect to MongoDB"

```bash
# Verificar que MongoDB está corriendo
docker ps | grep mongo
# Si no está, iniciarlo
docker start centralita-mongo-dev
```

### Error: "Port 3000 already in use"

```bash
# Encontrar proceso
lsof -i :3000
# Matar proceso
kill -9 <PID>
```

### Error: "CORS blocked"

Verifica que el backend tiene el middleware CORS configurado y que `REACT_APP_BACKEND_URL` en el frontend apunta a la URL correcta del backend.

### Hot Reload no funciona

```bash
# Frontend: Reiniciar el servidor
cd frontend && yarn start

# Backend: Verificar que --reload está en el comando
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

---

## 12. Credenciales de Desarrollo

### Usuario Admin
- **Email**: admin@santa-gadea.es
- **Password**: pass123

### Usuario Normal
- **Email**: secretaria@santa-gadea.es
- **Password**: pass123

### MongoDB
- **URL**: mongodb://localhost:27017
- **Database**: centralita_dev

---

## 13. Recursos Adicionales

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [MongoDB Manual](https://www.mongodb.com/docs/manual/)
