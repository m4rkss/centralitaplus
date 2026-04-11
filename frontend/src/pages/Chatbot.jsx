import { useTenantStore } from '@/stores/useTenantStore';
import { API_URL } from '@/config';
import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  MessageSquare, ExternalLink, FileUp, Send, Bot, User, 
  Paperclip, Loader2, Sparkles, Trash2, RefreshCw
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

// Mock responses
const getMockResponse = (message) => {
  const lower = message.toLowerCase();
  
  if (lower.includes('fiesta') || lower.includes('agosto') || lower.includes('patronal')) {
    return `Las **Fiestas Patronales de Santa Gadea del Cid** se celebran del **14 al 17 de agosto**.

📅 **Programa:**
- **14 ago**: Pregón y verbena inaugural
- **15 ago**: Misa solemne, procesión, comida popular
- **16 ago**: Actividades infantiles, concursos
- **17 ago**: Encierro, toros, clausura

📍 **Ubicación**: Plaza Mayor

📄 *Programa completo disponible en PDF en el Ayuntamiento.*`;
  }
  
  if (lower.includes('horario') || lower.includes('hora') || lower.includes('abierto')) {
    return `🏛️ **Ayuntamiento de Santa Gadea del Cid**

⏰ **Horarios:**
- Lunes a Viernes: 9:00 - 14:00
- Tardes (Mar/Jue): 17:00 - 19:00

📞 947 58 XX XX
📧 ayuntamiento@santagadea.es`;
  }
  
  if (lower.includes('piscina') || lower.includes('nadar') || lower.includes('bañar')) {
    return `🏊 **Piscina Municipal**

📅 Temporada: 15 jun - 15 sep
⏰ Horario: 11:00 - 20:00

💰 **Precios:**
- Adultos: 3€
- Niños (4-12): 1.50€
- Menores 4 años: Gratis`;
  }
  
  return `¡Hola! Soy el asistente del **Ayuntamiento de Santa Gadea del Cid** 🏛️

Puedo ayudarte con:
• 📅 Fiestas patronales (14-17 agosto)
• ⏰ Horarios del Ayuntamiento
• 🏊 Piscina municipal
• 🚨 Reportar incidencias

¿En qué puedo ayudarte?`;
};

// Typing indicator
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-2">
      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

// Message bubble - responsive
function MessageBubble({ message, isUser }) {
  return (
    <div 
      className={cn(
        "flex gap-2 sm:gap-3 mb-3 sm:mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className={cn(
        "w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0",
        isUser ? "bg-blue-600" : "bg-gradient-to-br from-emerald-500 to-teal-600"
      )}>
        <AvatarFallback className="bg-transparent">
          {isUser ? (
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          ) : (
            <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          )}
        </AvatarFallback>
      </Avatar>

      <div 
        className={cn(
          "max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3",
          isUser 
            ? "bg-blue-600 text-white rounded-br-sm" 
            : "bg-slate-800 text-slate-100 rounded-bl-sm"
        )}
      >
        {isUser ? (
          <p className="text-sm sm:text-base break-words">{message.content}</p>
        ) : (
          <div className="text-sm sm:text-base prose prose-invert prose-sm max-w-none break-words">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                em: ({ children }) => <em className="text-slate-300">{children}</em>,
                h3: ({ children }) => <h3 className="font-semibold text-white mt-3 mb-2">{children}</h3>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        <p className={cn(
          "text-[10px] sm:text-xs mt-2",
          isUser ? "text-blue-200" : "text-slate-500"
        )}>
          {new Date(message.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          {message.source && <span className="ml-2 opacity-60">• {message.source}</span>}
        </p>
      </div>
    </div>
  );
}

// Native Chat component - fully responsive
function NativeChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/onyx-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: data.response || getMockResponse(userMessage.content),
        timestamp: new Date().toISOString(),
        source: data.source
      }]);
    } catch (error) {
      await new Promise(r => setTimeout(r, 600));
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: getMockResponse(userMessage.content),
        timestamp: new Date().toISOString(),
        source: 'mock'
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

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
        id: Date.now(),
        role: 'user',
        content: `📎 ${file.name}`,
        timestamp: new Date().toISOString()
      }]);
      
      setIsLoading(true);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'assistant',
          content: `Documento **${file.name}** recibido. En producción se indexaría en Onyx para consultas RAG.`,
          timestamp: new Date().toISOString()
        }]);
        setIsLoading(false);
      }, 800);
    }
  };

  const suggestions = ['¿Cuándo son las fiestas?', 'Horarios Ayuntamiento', 'Info piscina'];

  return (
    <div className="flex flex-col h-full bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white">Chat Nativo RAG</h3>
            <p className="text-xs text-emerald-400">Proxy → Onyx Cloud API</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.txt" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="w-8 h-8 sm:w-9 sm:h-9 text-slate-400 hover:text-white"
          >
            <FileUp className="w-4 h-4" />
          </Button>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMessages([])}
              className="w-8 h-8 sm:w-9 sm:h-9 text-slate-400 hover:text-white"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 px-3 sm:px-4 py-3 sm:py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-8 sm:py-12 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Asistente RAG Nativo</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto mb-6">
              Consulta información del Ayuntamiento de Santa Gadea del Cid
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isUser={msg.role === 'user'} />
        ))}
        
        {isLoading && (
          <div className="flex gap-2 sm:gap-3 mb-3 animate-in fade-in">
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-teal-600">
              <AvatarFallback className="bg-transparent">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3">
              <TypingIndicator />
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 sm:w-10 sm:h-10 text-slate-400 hover:text-white flex-shrink-0 sm:hidden"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Escribe tu consulta..."
            className="flex-1 h-10 sm:h-11 bg-slate-800 border-slate-700 text-white text-sm sm:text-base placeholder:text-slate-500 rounded-xl"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 sm:w-11 sm:h-11 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 rounded-xl flex-shrink-0"
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Iframe component
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

// Main page component
export default function Chatbot() {
  const { currentTenant } = useTenantStore();
  const onyxUrl = `https://cloud.onyx.app/chat/${currentTenant?.config?.onyx_workspace_id || 'demo'}`;

  return (
    <div data-testid="chatbot-page" className="h-[calc(100vh-theme(spacing.32))] flex flex-col">
      <Tabs defaultValue="native" className="flex-1 flex flex-col">
        {/* Header - responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-600/20">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white">Chatbot Asistente</h2>
              <p className="text-xs text-slate-400">RAG sobre documentos municipales</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <TabsList className="bg-slate-800 border border-slate-700">
              <TabsTrigger 
                value="native" 
                className="text-xs sm:text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                <span className="hidden xs:inline">Chat</span> Nativo
              </TabsTrigger>
              <TabsTrigger 
                value="iframe" 
                className="text-xs sm:text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400"
              >
                <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                Iframe
              </TabsTrigger>
            </TabsList>
            
            <a
              href={onyxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs sm:text-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir Onyx
            </a>
          </div>
        </div>

        {/* Content */}
        <TabsContent value="native" className="flex-1 mt-0 min-h-0">
          <NativeChat />
        </TabsContent>
        
        <TabsContent value="iframe" className="flex-1 mt-0 min-h-0">
          <OnyxIframe />
        </TabsContent>
      </Tabs>

      {/* Footer - responsive */}
      <div className="flex flex-col xs:flex-row items-center justify-between text-[10px] sm:text-xs text-slate-500 mt-3 gap-1">
        <p>Workspace: {currentTenant?.config?.onyx_workspace_id || 'demo'}</p>
        <p className="hidden sm:block">API: /api/onyx-chat → Onyx Cloud (mock fallback)</p>
      </div>
    </div>
  );
}
