import { useTenantStore } from '@/stores/useTenantStore';
import { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, ExternalLink, FileUp, FileDown, RefreshCw, 
  Send, Bot, User, Paperclip, Loader2, Sparkles
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Mock responses for Santa Gadea
const getMockResponse = (message) => {
  const lower = message.toLowerCase();
  
  if (lower.includes('fiesta') || lower.includes('agosto') || lower.includes('patronal')) {
    return `Las **Fiestas Patronales de Santa Gadea del Cid** se celebran del **14 al 17 de agosto** cada año.

### Programa habitual:
- **14 de agosto**: Pregón de fiestas y verbena de inauguración
- **15 de agosto**: Misa solemne, procesión y comida popular
- **16 de agosto**: Actividades infantiles, concursos y verbena
- **17 de agosto**: Encierro tradicional, toros y clausura

Para más información, contacte con el Ayuntamiento.`;
  }
  
  if (lower.includes('horario') || lower.includes('abierto') || lower.includes('hora')) {
    return `**Horarios del Ayuntamiento de Santa Gadea del Cid:**

- **Lunes a Viernes**: 9:00 - 14:00
- **Tardes (Martes y Jueves)**: 17:00 - 19:00

📞 **Teléfono**: 947 58 XX XX
📧 **Email**: ayuntamiento@santagadea.es`;
  }
  
  if (lower.includes('piscina') || lower.includes('bañar') || lower.includes('nadar')) {
    return `**Piscina Municipal de Santa Gadea del Cid** 🏊

- **Temporada**: 15 de junio - 15 de septiembre
- **Horario**: 11:00 - 20:00
- **Precios**: Adultos 3€, Niños 1.50€, Menores 4 años gratis

**Reservas**: Llamar al Ayuntamiento o usar la centralita IA.`;
  }
  
  return `¡Hola! Soy el asistente del **Ayuntamiento de Santa Gadea del Cid** 🏛️

Puedo ayudarle con:
- 📅 Fiestas patronales (14-17 agosto)
- 🕐 Horarios del Ayuntamiento
- 🏊 Piscina municipal
- 🚨 Reportar incidencias

¿En qué puedo ayudarle?`;
};

function MessageBubble({ message, isUser }) {
  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
        isUser ? "bg-blue-600" : "bg-gradient-to-br from-emerald-500 to-teal-600"
      )}>
        {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
      </div>
      <div className={cn(
        "max-w-[70%] rounded-2xl px-4 py-3",
        isUser 
          ? "bg-blue-600 text-white rounded-br-sm" 
          : "bg-slate-800 text-slate-100 rounded-bl-sm"
      )}>
        {isUser ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <div className="text-sm prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                h3: ({ children }) => <h3 className="font-semibold text-white mt-3 mb-2">{children}</h3>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        <p className={cn(
          "text-[10px] mt-2",
          isUser ? "text-blue-200" : "text-slate-500"
        )}>
          {new Date(message.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

function NativeChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/onyx-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || getMockResponse(input),
        timestamp: new Date().toISOString(),
        source: data.source
      }]);
    } catch (error) {
      console.log('Using mock response');
      await new Promise(r => setTimeout(r, 600));
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: getMockResponse(input),
        timestamp: new Date().toISOString(),
        source: 'mock'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMessages(prev => [...prev, {
        role: 'user',
        content: `📎 Documento: ${file.name}`,
        timestamp: new Date().toISOString()
      }]);
      
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `He recibido **${file.name}**. En integración completa con Onyx, este documento se indexaría para consultas RAG.`,
          timestamp: new Date().toISOString()
        }]);
      }, 800);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50 rounded-xl border border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Chat Nativo RAG</h3>
            <p className="text-xs text-emerald-400">Proxy → Onyx Cloud API</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.txt" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Subir documento"
          >
            <FileUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center">
              <Bot className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Asistente RAG Nativo</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              Consulta información del Ayuntamiento de Santa Gadea del Cid usando el proxy a Onyx Cloud
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {['¿Cuándo son las fiestas?', '¿Horario del Ayuntamiento?', 'Información piscina'].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} isUser={msg.role === 'user'} />
        ))}
        
        {isLoading && (
          <div className="flex gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span className="text-sm text-slate-400">Consultando Onyx...</span>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu consulta..."
            className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function OnyxIframe() {
  const { currentTenant } = useTenantStore();
  const [loading, setLoading] = useState(true);
  
  const onyxUrl = currentTenant?.config?.onyx_workspace_id 
    ? `https://cloud.onyx.app/chat/${currentTenant.config.onyx_workspace_id}`
    : 'https://cloud.onyx.app/widget';

  return (
    <div className="relative h-full bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-sm text-slate-400">Cargando Onyx Cloud...</p>
          </div>
        </div>
      )}
      
      <iframe
        src={onyxUrl}
        className="w-full h-full border-0"
        title="Chatbot Onyx"
        onLoad={() => setLoading(false)}
        allow="microphone; clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
    </div>
  );
}

export default function Chatbot() {
  const { currentTenant } = useTenantStore();
  const onyxUrl = `https://cloud.onyx.app/chat/${currentTenant?.config?.onyx_workspace_id || 'demo'}`;

  return (
    <div data-testid="chatbot-page" className="h-[calc(100vh-theme(spacing.32))]">
      <Tabs defaultValue="native" className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-600/20">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Chatbot Asistente</h2>
              <p className="text-xs text-slate-400">RAG sobre documentos municipales</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <TabsList className="bg-slate-800 border border-slate-700">
              <TabsTrigger value="native" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400">
                <Sparkles className="w-4 h-4 mr-2" />
                Chat Nativo
              </TabsTrigger>
              <TabsTrigger value="iframe" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">
                <ExternalLink className="w-4 h-4 mr-2" />
                Iframe Onyx
              </TabsTrigger>
            </TabsList>
            
            <a
              href={onyxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir Onyx
            </a>
          </div>
        </div>

        {/* Content */}
        <TabsContent value="native" className="flex-1 mt-0">
          <NativeChat />
        </TabsContent>
        
        <TabsContent value="iframe" className="flex-1 mt-0">
          <OnyxIframe />
        </TabsContent>
      </Tabs>

      {/* Footer info */}
      <div className="flex items-center justify-between text-xs text-slate-500 mt-4">
        <p>Workspace: {currentTenant?.config?.onyx_workspace_id || 'demo'}</p>
        <p>API: /api/onyx-chat → Onyx Cloud (mock fallback activo)</p>
      </div>
    </div>
  );
}
