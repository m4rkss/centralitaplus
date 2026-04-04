from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import httpx
import json
import asyncio


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Onyx Chat Models
class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class OnyxChatRequest(BaseModel):
    messages: List[ChatMessage]
    project_id: Optional[str] = None

# Mock responses for Santa Gadea del Cid
SANTA_GADEA_MOCK_DATA = {
    "fiestas": {
        "keywords": ["fiesta", "fiestas", "patronal", "patronales", "agosto", "celebr"],
        "response": """Las **Fiestas Patronales de Santa Gadea del Cid** se celebran del **14 al 17 de agosto** cada año.

### Programa habitual:
- **14 de agosto**: Pregón de fiestas y verbena de inauguración
- **15 de agosto**: Misa solemne en honor a la Virgen, procesión y comida popular en la Plaza Mayor
- **16 de agosto**: Actividades infantiles por la mañana, concursos tradicionales y verbena nocturna
- **17 de agosto**: Encierro tradicional, espectáculo taurino y clausura de fiestas

**Ubicación principal**: Plaza Mayor de Santa Gadea del Cid

Para más información y programa actualizado, contacte con el Ayuntamiento."""
    },
    "horarios": {
        "keywords": ["horario", "abierto", "hora", "atencion", "oficina"],
        "response": """**Horarios del Ayuntamiento de Santa Gadea del Cid:**

📍 **Dirección**: Plaza Mayor, 1 - 09219 Santa Gadea del Cid (Burgos)

🕐 **Horario de atención al público**:
- **Lunes a Viernes**: 9:00 - 14:00
- **Tardes (Martes y Jueves)**: 17:00 - 19:00

📞 **Teléfono**: 947 58 XX XX
📧 **Email**: ayuntamiento@santagadea.es

**Servicios disponibles**:
- Registro de documentos
- Empadronamiento
- Licencias y permisos
- Información general"""
    },
    "piscina": {
        "keywords": ["piscina", "bañar", "nadar", "verano", "municipal"],
        "response": """**Piscina Municipal de Santa Gadea del Cid** 🏊

📅 **Temporada**: 15 de junio - 15 de septiembre
🕐 **Horario**: 11:00 - 20:00 (todos los días)

💰 **Precios 2026**:
| Categoría | Precio |
|-----------|--------|
| Adultos | 3€ |
| Niños (4-12 años) | 1.50€ |
| Menores de 4 años | Gratis |
| Bono 10 baños | 25€ |
| Abono temporada | 50€ |

📍 **Ubicación**: Zona deportiva municipal

**Reservas**: A través de la centralita IA o presencialmente en el Ayuntamiento.

*La piscina cuenta con socorrista, vestuarios y zona de césped.*"""
    },
    "incidencias": {
        "keywords": ["incidencia", "averia", "problema", "reportar", "farola", "agua", "bache"],
        "response": """**Cómo reportar una incidencia en Santa Gadea del Cid** 🚨

Puede reportar incidencias de varias formas:

1. **Centralita IA** (24/7): Llame y describa el problema
2. **Presencial**: En el Ayuntamiento en horario de oficina  
3. **Email**: incidencias@santagadea.es

**Tipos de incidencias más comunes**:
- 💡 Alumbrado público (farolas fundidas)
- 🚰 Agua (fugas, presión baja)
- 🛣️ Vías públicas (baches, señalización)
- 🗑️ Limpieza (contenedores, recogida)

**Tiempo de respuesta**:
- Urgentes: 24-48 horas
- Normales: 3-5 días laborables

Su incidencia será registrada y recibirá seguimiento."""
    },
    "default": {
        "keywords": [],
        "response": """¡Hola! Soy el asistente virtual del **Ayuntamiento de Santa Gadea del Cid** 🏛️

Puedo ayudarle con información sobre:

- 📅 **Fiestas patronales** (14-17 de agosto)
- 🕐 **Horarios** del Ayuntamiento
- 🏊 **Piscina municipal** y otras instalaciones
- 🚨 **Cómo reportar incidencias**
- 📋 **Trámites administrativos**
- 🏛️ **Historia y patrimonio** del municipio

**¿En qué puedo ayudarle hoy?**

_Escriba su consulta y haré lo posible por asistirle._"""
    }
}

def get_mock_response(message: str) -> str:
    """Get mock response based on message keywords"""
    message_lower = message.lower()
    
    for category, data in SANTA_GADEA_MOCK_DATA.items():
        if category == "default":
            continue
        for keyword in data["keywords"]:
            if keyword in message_lower:
                return data["response"]
    
    return SANTA_GADEA_MOCK_DATA["default"]["response"]

# Onyx API Configuration
ONYX_API_URL = os.environ.get("ONYX_API_URL", "https://cloud.onyx.app/api/v1")
ONYX_API_KEY = os.environ.get("ONYX_API_KEY", "")
ONYX_PROJECT_ID = os.environ.get("ONYX_PROJECT_ID", "")

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Onyx Chat Proxy Endpoint
@api_router.post("/onyx-chat")
async def onyx_chat(request: OnyxChatRequest):
    """
    Proxy endpoint for Onyx Cloud Chat API.
    Falls back to mock responses if API is unavailable or not configured.
    """
    logger.info(f"Received chat request with {len(request.messages)} messages")
    
    # Get the last user message for mock fallback
    last_user_message = ""
    for msg in reversed(request.messages):
        if msg.role == "user":
            last_user_message = msg.content
            break
    
    # Check if Onyx API is configured
    if not ONYX_API_KEY or not ONYX_PROJECT_ID:
        logger.info("Onyx API not configured, using mock response")
        return {
            "response": get_mock_response(last_user_message),
            "source": "mock",
            "project_id": None
        }
    
    # Try to call Onyx API
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Format messages for Onyx API
            onyx_messages = [
                {"role": msg.role, "content": msg.content}
                for msg in request.messages
            ]
            
            response = await client.post(
                f"{ONYX_API_URL}/chat/{ONYX_PROJECT_ID}",
                headers={
                    "Authorization": f"Bearer {ONYX_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "messages": onyx_messages,
                    "stream": False
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "response": data.get("response", data.get("message", data.get("content", ""))),
                    "source": "onyx",
                    "project_id": ONYX_PROJECT_ID
                }
            else:
                logger.warning(f"Onyx API returned status {response.status_code}")
                raise HTTPException(status_code=response.status_code, detail="Onyx API error")
                
    except httpx.TimeoutException:
        logger.warning("Onyx API timeout, using mock response")
    except httpx.RequestError as e:
        logger.warning(f"Onyx API request error: {e}")
    except Exception as e:
        logger.warning(f"Onyx API error: {e}")
    
    # Fallback to mock response
    return {
        "response": get_mock_response(last_user_message),
        "source": "mock_fallback",
        "project_id": None
    }

# Streaming version (optional, for future use)
@api_router.post("/onyx-chat/stream")
async def onyx_chat_stream(request: OnyxChatRequest):
    """
    Streaming version of Onyx chat proxy.
    Returns Server-Sent Events for real-time responses.
    """
    async def generate():
        # Get mock response (streaming simulation)
        last_user_message = ""
        for msg in reversed(request.messages):
            if msg.role == "user":
                last_user_message = msg.content
                break
        
        response = get_mock_response(last_user_message)
        
        # Stream word by word
        words = response.split()
        for i, word in enumerate(words):
            chunk = word + (" " if i < len(words) - 1 else "")
            yield f"data: {json.dumps({'content': chunk, 'done': False})}\n\n"
            await asyncio.sleep(0.05)  # Small delay for streaming effect
        
        yield f"data: {json.dumps({'content': '', 'done': True})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()