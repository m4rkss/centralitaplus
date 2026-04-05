from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, DateTime, Text, Boolean, ForeignKey, select, func, and_
from sqlalchemy.dialects.postgresql import JSONB
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
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

# PostgreSQL connection
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql+asyncpg://centralita:centralita123@localhost:5432/centralita_db")

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

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
# SQLAlchemy MODELS
# ============================================================

class Base(DeclarativeBase):
    pass

class TenantModel(Base):
    __tablename__ = "tenants"
    
    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    subdomain: Mapped[str] = mapped_column(String(100), unique=True)
    nombre: Mapped[str] = mapped_column(String(255))
    primary_color: Mapped[str] = mapped_column(String(20), default="#1e3a5f")
    config: Mapped[dict] = mapped_column(JSONB, default={})
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class UserModel(Base):
    __tablename__ = "users"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255))
    password_hash: Mapped[str] = mapped_column(String(255))
    tenant_id: Mapped[str] = mapped_column(String(100), ForeignKey("tenants.id"))
    rol: Mapped[str] = mapped_column(String(20), default="user")
    nombre: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

class LlamadaModel(Base):
    __tablename__ = "llamadas"
    
    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(100), ForeignKey("tenants.id"))
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    duracion_segundos: Mapped[int] = mapped_column(Integer)
    descripcion: Mapped[str] = mapped_column(Text)
    proveedor: Mapped[str] = mapped_column(String(50), default="vapi")
    estado: Mapped[str] = mapped_column(String(50), default="completada")
    telefono_origen: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    transcripcion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class IncidenciaModel(Base):
    __tablename__ = "incidencias"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(100), ForeignKey("tenants.id"))
    titulo: Mapped[str] = mapped_column(String(255))
    descripcion: Mapped[str] = mapped_column(Text, default="")
    ubicacion: Mapped[str] = mapped_column(String(255), default="")
    prioridad: Mapped[str] = mapped_column(String(20), default="media")
    estado: Mapped[str] = mapped_column(String(20), default="abierta")
    categoria: Mapped[str] = mapped_column(String(50), default="otros")
    creador_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    cerrada_por_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    notas: Mapped[list] = mapped_column(JSONB, default=[])
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

class ComunicadoModel(Base):
    __tablename__ = "comunicados"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(100), ForeignKey("tenants.id"))
    titulo: Mapped[str] = mapped_column(String(255))
    mensaje: Mapped[str] = mapped_column(Text)
    canal: Mapped[str] = mapped_column(String(50), default="whatsapp")
    destinatarios_count: Mapped[int] = mapped_column(Integer, default=0)
    estado: Mapped[str] = mapped_column(String(20), default="borrador")
    enviado_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class PasswordResetModel(Base):
    __tablename__ = "password_resets"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255))
    tenant_id: Mapped[str] = mapped_column(String(100))
    token: Mapped[str] = mapped_column(String(10))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used: Mapped[bool] = mapped_column(Boolean, default=False)

# ============================================================
# PYDANTIC MODELS
# ============================================================

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

class IncidenciaCreate(BaseModel):
    titulo: str
    descripcion: str = ""
    ubicacion: str = ""
    prioridad: str = "media"
    categoria: str = "otros"

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
    if not host:
        return "santa-gadea"
    
    parts = host.split(".")
    if len(parts) >= 3 and parts[0] not in ["www", "api"]:
        subdomain = parts[0]
        tenant_map = {
            "santagadea": "santa-gadea",
            "santa-gadea": "santa-gadea",
            "demo": "demo",
        }
        return tenant_map.get(subdomain, "santa-gadea")
    
    return "santa-gadea"

async def get_db():
    async with async_session() as session:
        yield session

# ============================================================
# DEPENDENCIES
# ============================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Dict:
    """Verify JWT token and return user info"""
    if not credentials:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    token = credentials.credentials
    payload = decode_token(token)
    
    result = await db.execute(
        select(UserModel).where(UserModel.id == payload["sub"])
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    
    return {
        "user_id": payload["sub"],
        "tenant_id": payload["tenant_id"],
        "rol": payload["rol"],
        "user": user
    }

async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
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

# ============================================================
# SEED DATA
# ============================================================

async def seed_database():
    """Seed initial data for Santa Gadea tenant"""
    logger.info("Creating tables and checking seed...")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session() as db:
        result = await db.execute(
            select(UserModel).where(UserModel.email == "admin@santa-gadea.es")
        )
        if result.scalar_one_or_none():
            logger.info("Database already seeded")
            return
        
        logger.info("Seeding database...")
        
        # Seed Tenants
        tenants = [
            TenantModel(
                id="santa-gadea",
                subdomain="santagadea",
                nombre="Ayuntamiento de Santa Gadea del Cid",
                primary_color="#1e3a5f",
                config={"vapi_enabled": True, "retell_enabled": True, "onyx_workspace_id": "ws_santagadea_001"}
            ),
            TenantModel(
                id="demo",
                subdomain="demo",
                nombre="Demo Centralita",
                primary_color="#6366f1",
                config={}
            )
        ]
        db.add_all(tenants)
        await db.flush()
        
        # Seed Users
        admin_id = str(uuid.uuid4())
        users = [
            UserModel(
                id=admin_id,
                email="admin@santa-gadea.es",
                password_hash=hash_password("pass123"),
                tenant_id="santa-gadea",
                rol="admin",
                nombre="Administrador"
            ),
            UserModel(
                id=str(uuid.uuid4()),
                email="secretaria@santa-gadea.es",
                password_hash=hash_password("pass123"),
                tenant_id="santa-gadea",
                rol="user",
                nombre="Secretaría Municipal"
            )
        ]
        db.add_all(users)
        
        # Seed Llamadas
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
        llamadas = []
        
        # Today's calls
        for i in range(24):
            hora = 8 + (i // 3)
            minuto = (i % 3) * 20 + (i % 15)
            fecha = hoy.replace(hour=hora, minute=minuto, second=0, microsecond=0)
            
            llamadas.append(LlamadaModel(
                id=f"call-{str(i+1).zfill(3)}",
                tenant_id="santa-gadea",
                fecha=fecha,
                duracion_segundos=30 + (i * 10) % 270,
                descripcion=descripciones[i % len(descripciones)],
                proveedor="retell" if i % 3 == 0 else "vapi",
                estado="revision" if i in [4, 13] else "completada",
                telefono_origen=f"+34 6{str(i).zfill(8)}"
            ))
        
        # Historical calls
        for dia in range(1, 7):
            for j in range(15 + (dia % 10)):
                fecha = (hoy - timedelta(days=dia)).replace(hour=8 + (j % 10), minute=(j * 7) % 60)
                llamadas.append(LlamadaModel(
                    id=f"call-prev-{dia}-{j}",
                    tenant_id="santa-gadea",
                    fecha=fecha,
                    duracion_segundos=30 + (j * 11) % 270,
                    descripcion=descripciones[j % len(descripciones)],
                    proveedor="vapi" if j % 2 == 0 else "retell",
                    estado="completada",
                    telefono_origen=f"+34 6{str(j).zfill(8)}"
                ))
        
        db.add_all(llamadas)
        
        # Seed Incidencias
        incidencias = [
            IncidenciaModel(
                id="inc-001",
                tenant_id="santa-gadea",
                titulo="Farola fundida Plaza Mayor",
                descripcion="La farola junto al banco de la Plaza Mayor está fundida desde hace 3 días.",
                ubicacion="Plaza Mayor, junto al banco",
                prioridad="alta",
                estado="abierta",
                categoria="alumbrado",
                creador_id=admin_id
            ),
            IncidenciaModel(
                id="inc-002",
                tenant_id="santa-gadea",
                titulo="Fuga de agua en C/ Iglesia",
                descripcion="Charco constante en la acera del número 5. Posible fuga en tubería.",
                ubicacion="C/ Iglesia, 5",
                prioridad="alta",
                estado="abierta",
                categoria="agua",
                creador_id=admin_id
            ),
            IncidenciaModel(
                id="inc-003",
                tenant_id="santa-gadea",
                titulo="Bache en Avenida Principal",
                descripcion="Bache de tamaño medio en la calzada, puede dañar vehículos.",
                ubicacion="Av. Principal, altura nº 23",
                prioridad="media",
                estado="en_progreso",
                categoria="vias_publicas",
                creador_id=admin_id,
                notas=[{"id": "note-001", "texto": "Material solicitado para reparación", "autor": "Brigada Municipal", "fecha": datetime.now(timezone.utc).isoformat()}],
                created_at=datetime.now(timezone.utc) - timedelta(days=2)
            )
        ]
        db.add_all(incidencias)
        
        # Seed Comunicados
        comunicados = [
            ComunicadoModel(
                id="com-001",
                tenant_id="santa-gadea",
                titulo="Corte de agua programado",
                mensaje="Se informa que el día 05/01 de 09:00 a 14:00 se realizarán trabajos de mantenimiento en la red de agua.",
                canal="whatsapp",
                destinatarios_count=234,
                estado="enviado",
                enviado_at=datetime.now(timezone.utc) - timedelta(days=1),
                created_at=datetime.now(timezone.utc) - timedelta(days=2)
            )
        ]
        db.add_all(comunicados)
        
        await db.commit()
        logger.info("Database seeded successfully!")

# ============================================================
# AUTH ENDPOINTS
# ============================================================

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, request: Request, db: AsyncSession = Depends(get_db)):
    """Login and get JWT token"""
    tenant_id = credentials.tenant_id or extract_tenant_from_host(request.headers.get("host", ""))
    
    logger.info(f"Login attempt: {credentials.email} for tenant: {tenant_id}")
    
    result = await db.execute(
        select(UserModel).where(
            and_(UserModel.email == credentials.email, UserModel.tenant_id == tenant_id)
        )
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    user.last_login = datetime.now(timezone.utc)
    await db.commit()
    
    token = create_access_token(user.id, user.tenant_id, user.rol)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            tenant_id=user.tenant_id,
            rol=user.rol,
            nombre=user.nombre or ""
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(auth: Dict = Depends(get_current_user)):
    """Get current user info"""
    user = auth["user"]
    return UserResponse(
        id=user.id,
        email=user.email,
        tenant_id=user.tenant_id,
        rol=user.rol,
        nombre=user.nombre or ""
    )

@api_router.post("/auth/logout")
async def logout():
    """Logout (client-side token removal)"""
    return {"message": "Sesión cerrada correctamente"}

@api_router.post("/auth/password-reset/request")
async def request_password_reset(data: PasswordResetRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Send password reset email with a 6-digit code"""
    tenant_id = data.tenant_id or extract_tenant_from_host(request.headers.get("host", ""))

    result = await db.execute(
        select(UserModel).where(
            and_(UserModel.email == data.email, UserModel.tenant_id == tenant_id)
        )
    )
    user = result.scalar_one_or_none()

    if not user:
        logger.info(f"Password reset requested for unknown email: {data.email}")
        return {"message": "Si el email existe, recibirás un correo con instrucciones"}

    code = f"{secrets.randbelow(900000) + 100000}"
    expires = datetime.now(timezone.utc) + timedelta(minutes=15)

    # Delete old resets
    await db.execute(
        PasswordResetModel.__table__.delete().where(
            and_(PasswordResetModel.email == data.email, PasswordResetModel.tenant_id == tenant_id)
        )
    )
    
    reset = PasswordResetModel(
        email=data.email,
        tenant_id=tenant_id,
        token=code,
        expires_at=expires,
        used=False
    )
    db.add(reset)
    await db.commit()

    result = await db.execute(
        select(TenantModel).where(TenantModel.id == tenant_id)
    )
    tenant = result.scalar_one_or_none()
    tenant_name = tenant.nombre if tenant else "Centralita Virtual"

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
async def confirm_password_reset(data: PasswordResetConfirm, db: AsyncSession = Depends(get_db)):
    """Verify code and reset password"""
    result = await db.execute(
        select(PasswordResetModel).where(
            and_(PasswordResetModel.token == data.token, PasswordResetModel.used == False)
        )
    )
    reset = result.scalar_one_or_none()

    if not reset:
        raise HTTPException(status_code=400, detail="Código inválido o ya utilizado")

    if reset.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="El código ha expirado. Solicita uno nuevo.")

    if len(data.new_password) < 4:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 4 caracteres")

    result = await db.execute(
        select(UserModel).where(
            and_(UserModel.email == reset.email, UserModel.tenant_id == reset.tenant_id)
        )
    )
    user = result.scalar_one_or_none()
    if user:
        user.password_hash = hash_password(data.new_password)
    
    reset.used = True
    await db.commit()

    logger.info(f"Password reset completed for {reset.email}")
    return {"message": "Contraseña actualizada correctamente"}

# ============================================================
# ADMIN: USER MANAGEMENT
# ============================================================

async def require_admin(auth: Dict = Depends(get_current_user)) -> Dict:
    if auth["rol"] != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    return auth

@api_router.get("/admin/users")
async def list_users(auth: Dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """List all users for the admin's tenant"""
    result = await db.execute(
        select(UserModel).where(UserModel.tenant_id == auth["tenant_id"]).order_by(UserModel.created_at.desc())
    )
    users = result.scalars().all()
    return {"users": [
        {"id": u.id, "email": u.email, "tenant_id": u.tenant_id, "rol": u.rol, "nombre": u.nombre, "created_at": u.created_at.isoformat() if u.created_at else None, "last_login": u.last_login.isoformat() if u.last_login else None}
        for u in users
    ]}

@api_router.post("/admin/users", response_model=UserResponse)
async def create_user(data: AdminUserCreate, auth: Dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Create a new user in the admin's tenant"""
    result = await db.execute(
        select(UserModel).where(
            and_(UserModel.email == data.email, UserModel.tenant_id == auth["tenant_id"])
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Ya existe un usuario con ese email")

    if data.rol not in ("admin", "user"):
        raise HTTPException(status_code=400, detail="Rol inválido. Usa 'admin' o 'user'")

    user = UserModel(
        id=str(uuid.uuid4()),
        email=data.email,
        password_hash=hash_password(data.password),
        tenant_id=auth["tenant_id"],
        rol=data.rol,
        nombre=data.nombre
    )
    db.add(user)
    await db.commit()

    return UserResponse(id=user.id, email=user.email, tenant_id=user.tenant_id, rol=user.rol, nombre=user.nombre)

@api_router.patch("/admin/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, data: AdminUserUpdate, auth: Dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Update a user in the admin's tenant"""
    result = await db.execute(
        select(UserModel).where(and_(UserModel.id == user_id, UserModel.tenant_id == auth["tenant_id"]))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if data.email is not None:
        dup_result = await db.execute(
            select(UserModel).where(
                and_(UserModel.email == data.email, UserModel.tenant_id == auth["tenant_id"], UserModel.id != user_id)
            )
        )
        if dup_result.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Ya existe un usuario con ese email")
        user.email = data.email
    if data.password is not None:
        user.password_hash = hash_password(data.password)
    if data.rol is not None:
        if data.rol not in ("admin", "user"):
            raise HTTPException(status_code=400, detail="Rol inválido")
        user.rol = data.rol
    if data.nombre is not None:
        user.nombre = data.nombre

    await db.commit()
    return UserResponse(id=user.id, email=user.email, tenant_id=user.tenant_id, rol=user.rol, nombre=user.nombre or "")

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, auth: Dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Delete a user from the admin's tenant"""
    if user_id == auth["user_id"]:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")

    result = await db.execute(
        select(UserModel).where(and_(UserModel.id == user_id, UserModel.tenant_id == auth["tenant_id"]))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    await db.delete(user)
    await db.commit()
    return {"message": "Usuario eliminado correctamente"}

# ============================================================
# TENANT ENDPOINTS
# ============================================================

@api_router.get("/tenant")
async def get_tenant_info(request: Request, x_tenant: Optional[str] = Header(None, alias="X-Tenant-ID"), db: AsyncSession = Depends(get_db)):
    """Get tenant info from subdomain"""
    tenant_id = x_tenant or extract_tenant_from_host(request.headers.get("host", ""))
    
    result = await db.execute(select(TenantModel).where(TenantModel.id == tenant_id))
    tenant = result.scalar_one_or_none()
    
    if not tenant:
        return {
            "id": "santa-gadea",
            "subdomain": "santagadea",
            "nombre": "Ayuntamiento de Santa Gadea del Cid",
            "primary_color": "#1e3a5f"
        }
    
    return {
        "id": tenant.id,
        "subdomain": tenant.subdomain,
        "nombre": tenant.nombre,
        "primary_color": tenant.primary_color,
        "config": tenant.config,
        "created_at": tenant.created_at.isoformat() if tenant.created_at else None
    }

# ============================================================
# LLAMADAS ENDPOINTS
# ============================================================

@api_router.get("/llamadas")
async def get_llamadas(auth: Dict = Depends(get_current_user), db: AsyncSession = Depends(get_db), limit: int = 100, skip: int = 0):
    """Get llamadas filtered by tenant"""
    result = await db.execute(
        select(LlamadaModel)
        .where(LlamadaModel.tenant_id == auth["tenant_id"])
        .order_by(LlamadaModel.fecha.desc())
        .offset(skip).limit(limit)
    )
    llamadas = result.scalars().all()
    
    total_result = await db.execute(
        select(func.count()).select_from(LlamadaModel).where(LlamadaModel.tenant_id == auth["tenant_id"])
    )
    total = total_result.scalar()
    
    return {
        "llamadas": [
            {"id": l.id, "tenant_id": l.tenant_id, "fecha": l.fecha.isoformat(), "duracion_segundos": l.duracion_segundos,
             "descripcion": l.descripcion, "proveedor": l.proveedor, "estado": l.estado, "telefono_origen": l.telefono_origen,
             "transcripcion": l.transcripcion, "created_at": l.created_at.isoformat() if l.created_at else None}
            for l in llamadas
        ],
        "total": total
    }

@api_router.get("/llamadas/chart")
async def get_llamadas_chart(auth: Dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get chart data for last 7 days"""
    dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    hoy = datetime.now(timezone.utc)
    
    chart_data = []
    for i in range(6, -1, -1):
        fecha = hoy - timedelta(days=i)
        fecha_start = fecha.replace(hour=0, minute=0, second=0, microsecond=0)
        fecha_end = fecha_start + timedelta(days=1)
        
        total_result = await db.execute(
            select(func.count()).select_from(LlamadaModel).where(
                and_(LlamadaModel.tenant_id == auth["tenant_id"],
                     LlamadaModel.fecha >= fecha_start,
                     LlamadaModel.fecha < fecha_end)
            )
        )
        total = total_result.scalar()
        
        vapi_result = await db.execute(
            select(func.count()).select_from(LlamadaModel).where(
                and_(LlamadaModel.tenant_id == auth["tenant_id"],
                     LlamadaModel.fecha >= fecha_start,
                     LlamadaModel.fecha < fecha_end,
                     LlamadaModel.proveedor == "vapi")
            )
        )
        vapi = vapi_result.scalar()
        
        chart_data.append({
            "dia": dias[fecha.weekday()],
            "fecha": fecha.strftime("%d/%m"),
            "llamadas": total,
            "vapi": vapi,
            "retell": total - vapi
        })
    
    return chart_data

@api_router.get("/llamadas/{llamada_id}")
async def get_llamada(llamada_id: str, auth: Dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get single llamada"""
    result = await db.execute(
        select(LlamadaModel).where(
            and_(LlamadaModel.id == llamada_id, LlamadaModel.tenant_id == auth["tenant_id"])
        )
    )
    llamada = result.scalar_one_or_none()
    if not llamada:
        raise HTTPException(status_code=404, detail="Llamada no encontrada")
    
    return {
        "id": llamada.id, "tenant_id": llamada.tenant_id, "fecha": llamada.fecha.isoformat(),
        "duracion_segundos": llamada.duracion_segundos, "descripcion": llamada.descripcion,
        "proveedor": llamada.proveedor, "estado": llamada.estado, "telefono_origen": llamada.telefono_origen,
        "transcripcion": llamada.transcripcion
    }

# ============================================================
# INCIDENCIAS ENDPOINTS
# ============================================================

@api_router.get("/incidencias")
async def get_incidencias(auth: Dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get incidencias filtered by tenant"""
    result = await db.execute(
        select(IncidenciaModel)
        .where(IncidenciaModel.tenant_id == auth["tenant_id"])
        .order_by(IncidenciaModel.created_at.desc())
    )
    incidencias = result.scalars().all()
    
    return {"incidencias": [
        {"id": i.id, "tenant_id": i.tenant_id, "titulo": i.titulo, "descripcion": i.descripcion,
         "ubicacion": i.ubicacion, "prioridad": i.prioridad, "estado": i.estado, "categoria": i.categoria,
         "creador_id": i.creador_id, "cerrada_por_id": i.cerrada_por_id, "notas": i.notas,
         "created_at": i.created_at.isoformat() if i.created_at else None,
         "updated_at": i.updated_at.isoformat() if i.updated_at else None,
         "closed_at": i.closed_at.isoformat() if i.closed_at else None}
        for i in incidencias
    ]}

@api_router.post("/incidencias")
async def create_incidencia(data: IncidenciaCreate, auth: Dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Create new incidencia"""
    incidencia = IncidenciaModel(
        id=str(uuid.uuid4()),
        tenant_id=auth["tenant_id"],
        titulo=data.titulo,
        descripcion=data.descripcion,
        ubicacion=data.ubicacion,
        prioridad=data.prioridad,
        estado="abierta",
        categoria=data.categoria,
        creador_id=auth["user_id"]
    )
    
    db.add(incidencia)
    await db.commit()
    
    return {
        "id": incidencia.id, "tenant_id": incidencia.tenant_id, "titulo": incidencia.titulo,
        "descripcion": incidencia.descripcion, "ubicacion": incidencia.ubicacion,
        "prioridad": incidencia.prioridad, "estado": incidencia.estado, "categoria": incidencia.categoria,
        "creador_id": incidencia.creador_id, "notas": incidencia.notas,
        "created_at": incidencia.created_at.isoformat() if incidencia.created_at else None
    }

@api_router.patch("/incidencias/{incidencia_id}")
async def update_incidencia(incidencia_id: str, updates: Dict[str, Any], auth: Dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Update incidencia"""
    result = await db.execute(
        select(IncidenciaModel).where(
            and_(IncidenciaModel.id == incidencia_id, IncidenciaModel.tenant_id == auth["tenant_id"])
        )
    )
    incidencia = result.scalar_one_or_none()
    if not incidencia:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada")
    
    for key, value in updates.items():
        if hasattr(incidencia, key) and key not in ["id", "tenant_id", "created_at"]:
            setattr(incidencia, key, value)
    
    incidencia.updated_at = datetime.now(timezone.utc)
    if updates.get("estado") == "cerrada":
        incidencia.closed_at = datetime.now(timezone.utc)
        incidencia.cerrada_por_id = auth["user_id"]
    
    await db.commit()
    
    return {
        "id": incidencia.id, "tenant_id": incidencia.tenant_id, "titulo": incidencia.titulo,
        "descripcion": incidencia.descripcion, "ubicacion": incidencia.ubicacion,
        "prioridad": incidencia.prioridad, "estado": incidencia.estado, "categoria": incidencia.categoria,
        "notas": incidencia.notas, "updated_at": incidencia.updated_at.isoformat() if incidencia.updated_at else None
    }

# ============================================================
# COMUNICADOS ENDPOINTS
# ============================================================

@api_router.get("/comunicados")
async def get_comunicados(auth: Dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get comunicados filtered by tenant"""
    result = await db.execute(
        select(ComunicadoModel)
        .where(ComunicadoModel.tenant_id == auth["tenant_id"])
        .order_by(ComunicadoModel.created_at.desc())
    )
    comunicados = result.scalars().all()
    
    return {"comunicados": [
        {"id": c.id, "tenant_id": c.tenant_id, "titulo": c.titulo, "mensaje": c.mensaje,
         "canal": c.canal, "destinatarios_count": c.destinatarios_count, "estado": c.estado,
         "enviado_at": c.enviado_at.isoformat() if c.enviado_at else None,
         "created_at": c.created_at.isoformat() if c.created_at else None}
        for c in comunicados
    ]}

@api_router.post("/comunicados")
async def create_comunicado(data: ComunicadoCreate, auth: Dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Create comunicado"""
    comunicado = ComunicadoModel(
        id=str(uuid.uuid4()),
        tenant_id=auth["tenant_id"],
        titulo=data.titulo,
        mensaje=data.mensaje,
        canal=data.canal
    )
    
    db.add(comunicado)
    await db.commit()
    
    return {
        "id": comunicado.id, "tenant_id": comunicado.tenant_id, "titulo": comunicado.titulo,
        "mensaje": comunicado.mensaje, "canal": comunicado.canal, "destinatarios_count": 0,
        "estado": "borrador", "created_at": comunicado.created_at.isoformat() if comunicado.created_at else None
    }

@api_router.post("/comunicados/{comunicado_id}/send")
async def send_comunicado(comunicado_id: str, auth: Dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Send comunicado"""
    result = await db.execute(
        select(ComunicadoModel).where(
            and_(ComunicadoModel.id == comunicado_id, ComunicadoModel.tenant_id == auth["tenant_id"])
        )
    )
    comunicado = result.scalar_one_or_none()
    if not comunicado:
        raise HTTPException(status_code=404, detail="Comunicado no encontrado")
    
    await asyncio.sleep(1)
    
    comunicado.estado = "enviado"
    comunicado.destinatarios_count = 150 + (hash(comunicado_id) % 200)
    comunicado.enviado_at = datetime.now(timezone.utc)
    await db.commit()
    
    return {
        "id": comunicado.id, "titulo": comunicado.titulo, "estado": comunicado.estado,
        "destinatarios_count": comunicado.destinatarios_count,
        "enviado_at": comunicado.enviado_at.isoformat()
    }

# ============================================================
# KPIs ENDPOINT
# ============================================================

@api_router.get("/kpis")
async def get_kpis(auth: Dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get KPIs for tenant"""
    tenant_id = auth["tenant_id"]
    
    hoy = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    hace_7_dias = hoy - timedelta(days=7)
    
    # Llamadas hoy
    result = await db.execute(
        select(func.count()).select_from(LlamadaModel).where(
            and_(LlamadaModel.tenant_id == tenant_id, LlamadaModel.fecha >= hoy)
        )
    )
    llamadas_hoy = result.scalar()
    
    # Llamadas semana
    result = await db.execute(
        select(func.count()).select_from(LlamadaModel).where(
            and_(LlamadaModel.tenant_id == tenant_id, LlamadaModel.fecha >= hace_7_dias)
        )
    )
    llamadas_semana = result.scalar()
    
    # Incidencias abiertas
    result = await db.execute(
        select(func.count()).select_from(IncidenciaModel).where(
            and_(IncidenciaModel.tenant_id == tenant_id, IncidenciaModel.estado != "cerrada")
        )
    )
    incidencias_abiertas = result.scalar()
    
    # Incidencias cerradas semana
    result = await db.execute(
        select(func.count()).select_from(IncidenciaModel).where(
            and_(IncidenciaModel.tenant_id == tenant_id, IncidenciaModel.closed_at >= hace_7_dias)
        )
    )
    incidencias_cerradas = result.scalar()
    
    # Comunicados semana
    result = await db.execute(
        select(func.count()).select_from(ComunicadoModel).where(
            and_(ComunicadoModel.tenant_id == tenant_id,
                 ComunicadoModel.estado == "enviado",
                 ComunicadoModel.enviado_at >= hace_7_dias)
        )
    )
    comunicados_semana = result.scalar()
    
    return {
        "llamadas_hoy": llamadas_hoy,
        "llamadas_semana": llamadas_semana,
        "incidencias_abiertas": incidencias_abiertas,
        "incidencias_cerradas_semana": incidencias_cerradas,
        "comunicados_enviados_semana": comunicados_semana,
        "satisfaccion_ia": 98
    }

# ============================================================
# ONYX CHAT
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
async def onyx_chat(request: OnyxChatRequest, auth: Optional[Dict] = Depends(get_optional_user)):
    """Onyx chat proxy with mock fallback"""
    last_message = ""
    for msg in reversed(request.messages):
        if msg.role == "user":
            last_message = msg.content
            break
    
    await asyncio.sleep(0.5)
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
    logger.info("Starting up with PostgreSQL...")
    await seed_database()

@app.on_event("shutdown")
async def shutdown_db_client():
    await engine.dispose()
