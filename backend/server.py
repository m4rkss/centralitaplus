from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import json
import asyncio
import jwt
from passlib.context import CryptContext
import resend
import secrets

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# JWT Configuration
JWT_SECRET = os.environ.get("JWT_SECRET", "centralita-virtual-secret-key-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Resend email
resend.api_key = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
security = HTTPBearer(auto_error=False)

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create the main app
app = FastAPI(title="Centralita Virtual API", version="2.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============================================================
# MODELS
# ============================================================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    tenant_id: str
    rol: str = "user"  # admin, user
    nombre: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None

class UserCreate(BaseModel):
    email: str
    password: str
    tenant_id: str
    rol: str = "user"
    nombre: str = ""

class UserLogin(BaseModel):
    email: str
    password: str
    tenant_id: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    tenant_id: str
    rol: str
    nombre: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class Tenant(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    subdomain: str
    nombre: str
    primary_color: str = "#1e3a5f"
    config: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Llamada(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    fecha: datetime
    duracion_segundos: int
    descripcion: str
    proveedor: str = "vapi"
    estado: str = "completada"
    telefono_origen: Optional[str] = None
    transcripcion: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Incidencia(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    titulo: str
    descripcion: str = ""
    ubicacion: str = ""
    prioridad: str = "media"
    estado: str = "abierta"
    categoria: str = "otros"
    creador_id: Optional[str] = None
    cerrada_por_id: Optional[str] = None
    notas: List[Dict] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    closed_at: Optional[datetime] = None

class IncidenciaCreate(BaseModel):
    titulo: str
    descripcion: str = ""
    ubicacion: str = ""
    prioridad: str = "media"
    categoria: str = "otros"

class Comunicado(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    titulo: str
    mensaje: str
    canal: str = "whatsapp"
    destinatarios_count: int = 0
    estado: str = "borrador"
    enviado_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ComunicadoCreate(BaseModel):
    titulo: str
    mensaje: str
    canal: str = "whatsapp"

class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str
    rol: str = "user"
    nombre: str = ""

class AdminUserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    rol: Optional[str] = None
    nombre: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: EmailStr
    tenant_id: Optional[str] = None

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class ChatMessage(BaseModel):
    role: str
    content: str

class OnyxChatRequest(BaseModel):
    messages: List[ChatMessage]

# ============================================================
# HELPER FUNCTIONS
# ============================================================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(user_id: str, tenant_id: str, rol: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": user_id,
        "tenant_id": tenant_id,
        "rol": rol,
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> Dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

def extract_tenant_from_host(host: str) -> str:
    """Extract tenant subdomain from host header"""
    # santagadea.centralitaia.com -> santa-gadea
    # switchboard-pro-2.preview.emergentagent.com -> santa-gadea (default)
    if not host:
        return "santa-gadea"
    
    parts = host.split(".")
    if len(parts) >= 3 and parts[0] not in ["www", "api"]:
        subdomain = parts[0]
        # Map subdomains to tenant IDs
        tenant_map = {
            "santagadea": "santa-gadea",
            "santa-gadea": "santa-gadea",
            "demo": "demo",
        }
        return tenant_map.get(subdomain, "santa-gadea")
    
    return "santa-gadea"  # Default tenant

# ============================================================
# DEPENDENCIES
# ============================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    x_tenant: Optional[str] = Header(None, alias="X-Tenant-ID")
) -> Dict:
    """Verify JWT token and return user info"""
    if not credentials:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    token = credentials.credentials
    payload = decode_token(token)
    
    # Verify user exists
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    
    return {
        "user_id": payload["sub"],
        "tenant_id": payload["tenant_id"],
        "rol": payload["rol"],
        "user": user
    }

async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Optional[Dict]:
    """Optional auth - returns None if no valid token"""
    if not credentials:
        return None
    try:
        token = credentials.credentials
        payload = decode_token(token)
        return {
            "user_id": payload["sub"],
            "tenant_id": payload["tenant_id"],
            "rol": payload["rol"]
        }
    except:
        return None

def get_tenant_from_request(request: Request, x_tenant: Optional[str] = Header(None, alias="X-Tenant-ID")) -> str:
    """Extract tenant ID from request (header or host)"""
    if x_tenant:
        return x_tenant
    host = request.headers.get("host", "")
    return extract_tenant_from_host(host)

# ============================================================
# SEED DATA
# ============================================================

async def seed_database():
    """Seed initial data for Santa Gadea tenant"""
    logger.info("Checking database seed...")
    
    # Check if already seeded
    admin_exists = await db.users.find_one({"email": "admin@santa-gadea.es"})
    if admin_exists:
        logger.info("Database already seeded")
        return
    
    logger.info("Seeding database...")
    
    # Seed Tenants
    tenants = [
        {
            "id": "santa-gadea",
            "subdomain": "santagadea",
            "nombre": "Ayuntamiento de Santa Gadea del Cid",
            "primary_color": "#1e3a5f",
            "config": {
                "vapi_enabled": True,
                "retell_enabled": True,
                "onyx_workspace_id": "ws_santagadea_001"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "demo",
            "subdomain": "demo",
            "nombre": "Demo Centralita",
            "primary_color": "#6366f1",
            "config": {},
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.tenants.insert_many(tenants)
    
    # Seed Users
    users = [
        {
            "id": str(uuid.uuid4()),
            "email": "admin@santa-gadea.es",
            "password_hash": hash_password("pass123"),
            "tenant_id": "santa-gadea",
            "rol": "admin",
            "nombre": "Administrador",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": None
        },
        {
            "id": str(uuid.uuid4()),
            "email": "secretaria@santa-gadea.es",
            "password_hash": hash_password("pass123"),
            "tenant_id": "santa-gadea",
            "rol": "user",
            "nombre": "Secretaría Municipal",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": None
        }
    ]
    await db.users.insert_many(users)
    
    # Seed Llamadas (24 for today)
    llamadas = []
    descripciones = [
        "Reserva piscina municipal", "Información fiestas patronales",
        "Consulta horario biblioteca", "Reserva pabellón deportivo",
        "Queja ruidos nocturnos", "Información recogida basura",
        "Consulta padrón municipal", "Reserva salón actos",
        "Información licencias obras", "Consulta tributos locales",
        "Reserva frontón municipal", "Información ayudas sociales",
        "Consulta certificado empadronamiento", "Queja aparcamiento indebido",
        "Información mercadillo semanal", "Reserva consultorio médico",
        "Consulta bodas civiles", "Información transporte escolar",
        "Queja contenedores llenos", "Consulta subvenciones",
        "Reserva casa cultura", "Información censo electoral",
        "Consulta ordenanzas municipales", "Queja farola fundida"
    ]
    
    hoy = datetime.now(timezone.utc)
    for i in range(24):
        hora = 8 + (i // 3)
        minuto = (i % 3) * 20 + (i % 15)
        fecha = hoy.replace(hour=hora, minute=minuto, second=0, microsecond=0)
        
        llamadas.append({
            "id": f"call-{str(i+1).zfill(3)}",
            "tenant_id": "santa-gadea",
            "fecha": fecha.isoformat(),
            "duracion_segundos": 30 + (i * 10) % 270,
            "descripcion": descripciones[i % len(descripciones)],
            "proveedor": "retell" if i % 3 == 0 else "vapi",
            "estado": "revision" if i in [4, 13] else "completada",
            "telefono_origen": f"+34 6{str(i).zfill(8)}",
            "transcripcion": None,
            "created_at": fecha.isoformat()
        })
    
    # Add historical calls for chart
    for dia in range(1, 7):
        for j in range(15 + (dia % 10)):
            fecha = (hoy - timedelta(days=dia)).replace(
                hour=8 + (j % 10), 
                minute=(j * 7) % 60
            )
            llamadas.append({
                "id": f"call-prev-{dia}-{j}",
                "tenant_id": "santa-gadea",
                "fecha": fecha.isoformat(),
                "duracion_segundos": 30 + (j * 11) % 270,
                "descripcion": descripciones[j % len(descripciones)],
                "proveedor": "vapi" if j % 2 == 0 else "retell",
                "estado": "completada",
                "telefono_origen": f"+34 6{str(j).zfill(8)}",
                "transcripcion": None,
                "created_at": fecha.isoformat()
            })
    
    await db.llamadas.insert_many(llamadas)
    
    # Seed Incidencias (3)
    admin_id = users[0]["id"]
    incidencias = [
        {
            "id": "inc-001",
            "tenant_id": "santa-gadea",
            "titulo": "Farola fundida Plaza Mayor",
            "descripcion": "La farola junto al banco de la Plaza Mayor está fundida desde hace 3 días.",
            "ubicacion": "Plaza Mayor, junto al banco",
            "prioridad": "alta",
            "estado": "abierta",
            "categoria": "alumbrado",
            "creador_id": admin_id,
            "cerrada_por_id": None,
            "notas": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "closed_at": None
        },
        {
            "id": "inc-002",
            "tenant_id": "santa-gadea",
            "titulo": "Fuga de agua en C/ Iglesia",
            "descripcion": "Charco constante en la acera del número 5. Posible fuga en tubería.",
            "ubicacion": "C/ Iglesia, 5",
            "prioridad": "alta",
            "estado": "abierta",
            "categoria": "agua",
            "creador_id": admin_id,
            "cerrada_por_id": None,
            "notas": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "closed_at": None
        },
        {
            "id": "inc-003",
            "tenant_id": "santa-gadea",
            "titulo": "Bache en Avenida Principal",
            "descripcion": "Bache de tamaño medio en la calzada, puede dañar vehículos.",
            "ubicacion": "Av. Principal, altura nº 23",
            "prioridad": "media",
            "estado": "en_progreso",
            "categoria": "vias_publicas",
            "creador_id": admin_id,
            "cerrada_por_id": None,
            "notas": [{
                "id": "note-001",
                "texto": "Material solicitado para reparación",
                "autor": "Brigada Municipal",
                "fecha": datetime.now(timezone.utc).isoformat()
            }],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "closed_at": None
        }
    ]
    await db.incidencias.insert_many(incidencias)
    
    # Seed Comunicados (1)
    comunicados = [
        {
            "id": "com-001",
            "tenant_id": "santa-gadea",
            "titulo": "Corte de agua programado",
            "mensaje": "Se informa que el día 05/01 de 09:00 a 14:00 se realizarán trabajos de mantenimiento en la red de agua.",
            "canal": "whatsapp",
            "destinatarios_count": 234,
            "estado": "enviado",
            "enviado_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
            "created_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
        }
    ]
    await db.comunicados.insert_many(comunicados)
    
    logger.info("Database seeded successfully!")

# ============================================================
# AUTH ENDPOINTS
# ============================================================

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, request: Request):
    """Login and get JWT token"""
    # Get tenant from request or credentials
    tenant_id = credentials.tenant_id or extract_tenant_from_host(request.headers.get("host", ""))
    
    logger.info(f"Login attempt: {credentials.email} for tenant: {tenant_id}")
    
    # Find user
    user = await db.users.find_one(
        {"email": credentials.email, "tenant_id": tenant_id},
        {"_id": 0}
    )
    
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    # Update last login
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Create token
    token = create_access_token(user["id"], user["tenant_id"], user["rol"])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            tenant_id=user["tenant_id"],
            rol=user["rol"],
            nombre=user.get("nombre", "")
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(auth: Dict = Depends(get_current_user)):
    """Get current user info"""
    user = auth["user"]
    return UserResponse(
        id=user["id"],
        email=user["email"],
        tenant_id=user["tenant_id"],
        rol=user["rol"],
        nombre=user.get("nombre", "")
    )

@api_router.post("/auth/logout")
async def logout():
    """Logout (client-side token removal)"""
    return {"message": "Sesión cerrada correctamente"}

@api_router.post("/auth/password-reset/request")
async def request_password_reset(data: PasswordResetRequest, request: Request):
    """Send password reset email with a 6-digit code"""
    tenant_id = data.tenant_id or get_tenant_from_request(request)

    user = await db.users.find_one(
        {"email": data.email, "tenant_id": tenant_id},
        {"_id": 0}
    )

    # Always return success to not leak user existence
    if not user:
        logger.info(f"Password reset requested for unknown email: {data.email}")
        return {"message": "Si el email existe, recibirás un correo con instrucciones"}

    # Generate 6-digit code and store it
    code = f"{secrets.randbelow(900000) + 100000}"
    expires = datetime.now(timezone.utc) + timedelta(minutes=15)

    await db.password_resets.delete_many({"email": data.email, "tenant_id": tenant_id})
    await db.password_resets.insert_one({
        "email": data.email,
        "tenant_id": tenant_id,
        "token": code,
        "expires_at": expires.isoformat(),
        "used": False
    })

    # Get tenant name for email
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    tenant_name = tenant["nombre"] if tenant else "Centralita Virtual"

    # Send email via Resend
    html_content = f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f172a;border-radius:12px;color:#e2e8f0;">
      <h2 style="color:#fff;margin:0 0 8px;">Restablecer contraseña</h2>
      <p style="color:#94a3b8;margin:0 0 24px;font-size:14px;">{tenant_name}</p>
      <p style="color:#cbd5e1;font-size:14px;">Usa el siguiente código para restablecer tu contraseña. Expira en 15 minutos.</p>
      <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:20px;text-align:center;margin:24px 0;">
        <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#3b82f6;">{code}</span>
      </div>
      <p style="color:#64748b;font-size:12px;margin:0;">Si no solicitaste este cambio, ignora este email.</p>
    </div>
    """

    try:
        await asyncio.to_thread(resend.Emails.send, {
            "from": SENDER_EMAIL,
            "to": [data.email],
            "subject": f"Código de recuperación - {tenant_name}",
            "html": html_content
        })
        logger.info(f"Password reset email sent to {data.email}")
    except Exception as e:
        logger.error(f"Failed to send reset email: {e}")
        raise HTTPException(status_code=500, detail="Error al enviar el email. Inténtalo de nuevo.")

    return {"message": "Si el email existe, recibirás un correo con instrucciones"}

@api_router.post("/auth/password-reset/confirm")
async def confirm_password_reset(data: PasswordResetConfirm):
    """Verify code and reset password"""
    reset = await db.password_resets.find_one(
        {"token": data.token, "used": False},
        {"_id": 0}
    )

    if not reset:
        raise HTTPException(status_code=400, detail="Código inválido o ya utilizado")

    if datetime.fromisoformat(reset["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="El código ha expirado. Solicita uno nuevo.")

    if len(data.new_password) < 4:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 4 caracteres")

    # Update password
    await db.users.update_one(
        {"email": reset["email"], "tenant_id": reset["tenant_id"]},
        {"$set": {"password_hash": hash_password(data.new_password)}}
    )

    # Mark token as used
    await db.password_resets.update_one(
        {"token": data.token},
        {"$set": {"used": True}}
    )

    logger.info(f"Password reset completed for {reset['email']}")
    return {"message": "Contraseña actualizada correctamente"}

# ============================================================
# ADMIN: USER MANAGEMENT (Admin only)
# ============================================================

async def require_admin(auth: Dict = Depends(get_current_user)) -> Dict:
    if auth["rol"] != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    return auth

@api_router.get("/admin/users")
async def list_users(auth: Dict = Depends(require_admin)):
    """List all users for the admin's tenant"""
    users = await db.users.find(
        {"tenant_id": auth["tenant_id"]},
        {"_id": 0, "password_hash": 0}
    ).sort("created_at", -1).to_list(200)
    return {"users": users}

@api_router.post("/admin/users", response_model=UserResponse)
async def create_user(data: AdminUserCreate, auth: Dict = Depends(require_admin)):
    """Create a new user in the admin's tenant"""
    existing = await db.users.find_one({
        "email": data.email,
        "tenant_id": auth["tenant_id"]
    })
    if existing:
        raise HTTPException(status_code=409, detail="Ya existe un usuario con ese email")

    if data.rol not in ("admin", "user"):
        raise HTTPException(status_code=400, detail="Rol inválido. Usa 'admin' o 'user'")

    user = {
        "id": str(uuid.uuid4()),
        "email": data.email,
        "password_hash": hash_password(data.password),
        "tenant_id": auth["tenant_id"],
        "rol": data.rol,
        "nombre": data.nombre,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login": None
    }
    await db.users.insert_one(user)

    return UserResponse(
        id=user["id"],
        email=user["email"],
        tenant_id=user["tenant_id"],
        rol=user["rol"],
        nombre=user["nombre"]
    )

@api_router.patch("/admin/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, data: AdminUserUpdate, auth: Dict = Depends(require_admin)):
    """Update a user in the admin's tenant"""
    user = await db.users.find_one({"id": user_id, "tenant_id": auth["tenant_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    updates = {}
    if data.email is not None:
        dup = await db.users.find_one({
            "email": data.email,
            "tenant_id": auth["tenant_id"],
            "id": {"$ne": user_id}
        })
        if dup:
            raise HTTPException(status_code=409, detail="Ya existe un usuario con ese email")
        updates["email"] = data.email
    if data.password is not None:
        updates["password_hash"] = hash_password(data.password)
    if data.rol is not None:
        if data.rol not in ("admin", "user"):
            raise HTTPException(status_code=400, detail="Rol inválido")
        updates["rol"] = data.rol
    if data.nombre is not None:
        updates["nombre"] = data.nombre

    if updates:
        await db.users.update_one({"id": user_id}, {"$set": updates})

    updated = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return UserResponse(
        id=updated["id"],
        email=updated["email"],
        tenant_id=updated["tenant_id"],
        rol=updated["rol"],
        nombre=updated.get("nombre", "")
    )

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, auth: Dict = Depends(require_admin)):
    """Delete a user from the admin's tenant"""
    if user_id == auth["user_id"]:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")

    result = await db.users.delete_one({"id": user_id, "tenant_id": auth["tenant_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return {"message": "Usuario eliminado correctamente"}

# ============================================================
# TENANT ENDPOINTS
# ============================================================

@api_router.get("/tenant")
async def get_tenant_info(request: Request, x_tenant: Optional[str] = Header(None, alias="X-Tenant-ID")):
    """Get tenant info from subdomain"""
    tenant_id = x_tenant or extract_tenant_from_host(request.headers.get("host", ""))
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    
    if not tenant:
        # Return default
        return {
            "id": "santa-gadea",
            "subdomain": "santagadea",
            "nombre": "Ayuntamiento de Santa Gadea del Cid",
            "primary_color": "#1e3a5f"
        }
    
    return tenant

# ============================================================
# LLAMADAS ENDPOINTS (PROTECTED + TENANT FILTERED)
# ============================================================

@api_router.get("/llamadas")
async def get_llamadas(
    auth: Dict = Depends(get_current_user),
    limit: int = 100,
    skip: int = 0
):
    """Get llamadas filtered by tenant"""
    tenant_id = auth["tenant_id"]
    
    llamadas = await db.llamadas.find(
        {"tenant_id": tenant_id},
        {"_id": 0}
    ).sort("fecha", -1).skip(skip).limit(limit).to_list(limit)
    
    return {"llamadas": llamadas, "total": await db.llamadas.count_documents({"tenant_id": tenant_id})}

@api_router.get("/llamadas/chart")
async def get_llamadas_chart(auth: Dict = Depends(get_current_user)):
    """Get chart data for last 7 days"""
    tenant_id = auth["tenant_id"]
    dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    hoy = datetime.now(timezone.utc)
    
    chart_data = []
    for i in range(6, -1, -1):
        fecha = hoy - timedelta(days=i)
        fecha_start = fecha.replace(hour=0, minute=0, second=0, microsecond=0)
        fecha_end = fecha_start + timedelta(days=1)
        
        total = await db.llamadas.count_documents({
            "tenant_id": tenant_id,
            "fecha": {"$gte": fecha_start.isoformat(), "$lt": fecha_end.isoformat()}
        })
        
        vapi = await db.llamadas.count_documents({
            "tenant_id": tenant_id,
            "fecha": {"$gte": fecha_start.isoformat(), "$lt": fecha_end.isoformat()},
            "proveedor": "vapi"
        })
        
        chart_data.append({
            "dia": dias[fecha.weekday()],
            "fecha": fecha.strftime("%d/%m"),
            "llamadas": total,
            "vapi": vapi,
            "retell": total - vapi
        })
    
    return chart_data

@api_router.get("/llamadas/{llamada_id}")
async def get_llamada(llamada_id: str, auth: Dict = Depends(get_current_user)):
    """Get single llamada"""
    llamada = await db.llamadas.find_one(
        {"id": llamada_id, "tenant_id": auth["tenant_id"]},
        {"_id": 0}
    )
    if not llamada:
        raise HTTPException(status_code=404, detail="Llamada no encontrada")
    return llamada

# ============================================================
# INCIDENCIAS ENDPOINTS (PROTECTED + TENANT FILTERED)
# ============================================================

@api_router.get("/incidencias")
async def get_incidencias(auth: Dict = Depends(get_current_user)):
    """Get incidencias filtered by tenant"""
    incidencias = await db.incidencias.find(
        {"tenant_id": auth["tenant_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"incidencias": incidencias}

@api_router.post("/incidencias")
async def create_incidencia(
    data: IncidenciaCreate,
    auth: Dict = Depends(get_current_user)
):
    """Create new incidencia"""
    incidencia = {
        "id": str(uuid.uuid4()),
        "tenant_id": auth["tenant_id"],
        "titulo": data.titulo,
        "descripcion": data.descripcion,
        "ubicacion": data.ubicacion,
        "prioridad": data.prioridad,
        "estado": "abierta",
        "categoria": data.categoria,
        "creador_id": auth["user_id"],
        "cerrada_por_id": None,
        "notas": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "closed_at": None
    }
    
    await db.incidencias.insert_one(incidencia)
    incidencia.pop("_id", None)
    return incidencia

@api_router.patch("/incidencias/{incidencia_id}")
async def update_incidencia(
    incidencia_id: str,
    updates: Dict[str, Any],
    auth: Dict = Depends(get_current_user)
):
    """Update incidencia"""
    # Verify ownership
    incidencia = await db.incidencias.find_one(
        {"id": incidencia_id, "tenant_id": auth["tenant_id"]}
    )
    if not incidencia:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada")
    
    # Update
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    if updates.get("estado") == "cerrada":
        updates["closed_at"] = datetime.now(timezone.utc).isoformat()
        updates["cerrada_por_id"] = auth["user_id"]
    
    await db.incidencias.update_one(
        {"id": incidencia_id},
        {"$set": updates}
    )
    
    updated = await db.incidencias.find_one({"id": incidencia_id}, {"_id": 0})
    return updated

# ============================================================
# COMUNICADOS ENDPOINTS (PROTECTED + TENANT FILTERED)
# ============================================================

@api_router.get("/comunicados")
async def get_comunicados(auth: Dict = Depends(get_current_user)):
    """Get comunicados filtered by tenant"""
    comunicados = await db.comunicados.find(
        {"tenant_id": auth["tenant_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"comunicados": comunicados}

@api_router.post("/comunicados")
async def create_comunicado(
    data: ComunicadoCreate,
    auth: Dict = Depends(get_current_user)
):
    """Create and optionally send comunicado"""
    comunicado = {
        "id": str(uuid.uuid4()),
        "tenant_id": auth["tenant_id"],
        "titulo": data.titulo,
        "mensaje": data.mensaje,
        "canal": data.canal,
        "destinatarios_count": 0,
        "estado": "borrador",
        "enviado_at": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.comunicados.insert_one(comunicado)
    if "_id" in comunicado:
        del comunicado["_id"]
    return comunicado

@api_router.post("/comunicados/{comunicado_id}/send")
async def send_comunicado(
    comunicado_id: str,
    auth: Dict = Depends(get_current_user)
):
    """Send comunicado (mock n8n)"""
    comunicado = await db.comunicados.find_one(
        {"id": comunicado_id, "tenant_id": auth["tenant_id"]}
    )
    if not comunicado:
        raise HTTPException(status_code=404, detail="Comunicado no encontrado")
    
    # Mock send
    await asyncio.sleep(1)  # Simulate n8n delay
    
    await db.comunicados.update_one(
        {"id": comunicado_id},
        {"$set": {
            "estado": "enviado",
            "destinatarios_count": 150 + (hash(comunicado_id) % 200),
            "enviado_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    updated = await db.comunicados.find_one({"id": comunicado_id}, {"_id": 0})
    return updated

# ============================================================
# KPIs ENDPOINT (PROTECTED + TENANT FILTERED)
# ============================================================

@api_router.get("/kpis")
async def get_kpis(auth: Dict = Depends(get_current_user)):
    """Get KPIs for tenant"""
    tenant_id = auth["tenant_id"]
    
    hoy = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    hace_7_dias = hoy - timedelta(days=7)
    
    # Llamadas hoy
    llamadas_hoy = await db.llamadas.count_documents({
        "tenant_id": tenant_id,
        "fecha": {"$gte": hoy.isoformat()}
    })
    
    # Llamadas semana
    llamadas_semana = await db.llamadas.count_documents({
        "tenant_id": tenant_id,
        "fecha": {"$gte": hace_7_dias.isoformat()}
    })
    
    # Incidencias abiertas
    incidencias_abiertas = await db.incidencias.count_documents({
        "tenant_id": tenant_id,
        "estado": {"$ne": "cerrada"}
    })
    
    # Incidencias cerradas semana
    incidencias_cerradas = await db.incidencias.count_documents({
        "tenant_id": tenant_id,
        "closed_at": {"$gte": hace_7_dias.isoformat()}
    })
    
    # Comunicados semana
    comunicados_semana = await db.comunicados.count_documents({
        "tenant_id": tenant_id,
        "estado": "enviado",
        "enviado_at": {"$gte": hace_7_dias.isoformat()}
    })
    
    return {
        "llamadas_hoy": llamadas_hoy,
        "llamadas_semana": llamadas_semana,
        "incidencias_abiertas": incidencias_abiertas,
        "incidencias_cerradas_semana": incidencias_cerradas,
        "comunicados_enviados_semana": comunicados_semana,
        "satisfaccion_ia": 98
    }

# ============================================================
# ONYX CHAT (PUBLIC - but tenant aware)
# ============================================================

SANTA_GADEA_MOCK = {
    "fiestas": "Las **Fiestas Patronales de Santa Gadea del Cid** se celebran del **14 al 17 de agosto**.\n\n📅 **Programa:**\n- 14 ago: Pregón y verbena\n- 15 ago: Misa solemne, procesión\n- 16 ago: Actividades infantiles\n- 17 ago: Encierro y clausura",
    "horarios": "🏛️ **Ayuntamiento Santa Gadea**\n\n⏰ L-V: 9:00-14:00\nTardes Mar/Jue: 17:00-19:00\n\n📞 947 58 XX XX",
    "piscina": "🏊 **Piscina Municipal**\n\n📅 15 jun - 15 sep\n⏰ 11:00-20:00\n\n💰 Adultos 3€, Niños 1.50€",
    "default": "¡Hola! Soy el asistente de **Santa Gadea del Cid** 🏛️\n\nPuedo ayudarte con:\n• 📅 Fiestas (14-17 agosto)\n• ⏰ Horarios\n• 🏊 Piscina\n• 🚨 Incidencias"
}

def get_mock_response(message: str) -> str:
    lower = message.lower()
    if any(k in lower for k in ["fiesta", "agosto", "patronal"]):
        return SANTA_GADEA_MOCK["fiestas"]
    if any(k in lower for k in ["horario", "hora", "abierto"]):
        return SANTA_GADEA_MOCK["horarios"]
    if any(k in lower for k in ["piscina", "nadar", "bañar"]):
        return SANTA_GADEA_MOCK["piscina"]
    return SANTA_GADEA_MOCK["default"]

@api_router.post("/onyx-chat")
async def onyx_chat(
    request: OnyxChatRequest,
    auth: Optional[Dict] = Depends(get_optional_user)
):
    """Onyx chat proxy with mock fallback"""
    last_message = ""
    for msg in reversed(request.messages):
        if msg.role == "user":
            last_message = msg.content
            break
    
    # Mock response
    await asyncio.sleep(0.5)  # Simulate API delay
    return {
        "response": get_mock_response(last_message),
        "source": "mock",
        "tenant_id": auth["tenant_id"] if auth else "santa-gadea"
    }

# ============================================================
# CORS & STARTUP
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.on_event("startup")
async def startup_db_client():
    logger.info("Starting up...")
    await seed_database()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
