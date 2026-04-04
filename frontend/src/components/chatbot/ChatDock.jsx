import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Minimize2, Maximize2, Send, Paperclip, Loader2, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Mock responses for Santa Gadea when API is unavailable
const MOCK_RESPONSES = {
  fiestas: `Las **Fiestas Patronales de Santa Gadea del Cid** se celebran del **14 al 17 de agosto** cada año.

### Programa habitual:
- **14 de agosto**: Pregón de fiestas y verbena de inauguración
- **15 de agosto**: Misa solemne, procesión y comida popular
- **16 de agosto**: Actividades infantiles, concursos y verbena
- **17 de agosto**: Encierro tradicional, toros y clausura

Para más información, contacte con el Ayuntamiento.`,
  
  horarios: `**Horarios del Ayuntamiento de Santa Gadea del Cid:**

- **Lunes a Viernes**: 9:00 - 14:00
- **Tardes (Martes y Jueves)**: 17:00 - 19:00

**Teléfono**: 947 XX XX XX
**Email**: ayuntamiento@santagadea.es`,

  piscina: `**Piscina Municipal de Santa Gadea del Cid**

- **Temporada**: 15 de junio - 15 de septiembre
- **Horario**: 11:00 - 20:00
- **Precios**:
  - Adultos: 3€
  - Niños (4-12 años): 1.50€
  - Menores de 4 años: Gratis
  - Bono 10 baños: 25€

**Reservas**: Llamar al Ayuntamiento o usar la centralita IA.`,

  default: `Gracias por su consulta. Como asistente del **Ayuntamiento de Santa Gadea del Cid**, puedo ayudarle con:

- 📅 Información sobre fiestas y eventos
- 🏛️ Horarios y servicios municipales  
- 🏊 Reservas de instalaciones (piscina, pabellón)
- 📋 Trámites administrativos
- 🚨 Reportar incidencias

¿En qué puedo ayudarle hoy?`
};

function getMockResponse(message) {
  const lower = message.toLowerCase();
  if (lower.includes('fiesta') || lower.includes('agosto') || lower.includes('patronal')) {
    return MOCK_RESPONSES.fiestas;
  }
  if (lower.includes('horario') || lower.includes('abierto') || lower.includes('hora')) {
    return MOCK_RESPONSES.horarios;
  }
  if (lower.includes('piscina') || lower.includes('bañar') || lower.includes('nadar')) {
    return MOCK_RESPONSES.piscina;
  }
  return MOCK_RESPONSES.default;
}

function MessageBubble({ message, isUser }) {
  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isUser ? "bg-blue-600" : "bg-gradient-to-br from-emerald-500 to-teal-600"
      )}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-2.5",
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
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
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
          "text-[10px] mt-1",
          isUser ? "text-blue-200" : "text-slate-500"
        )}>
          {new Date(message.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

function ChatWindow({ messages, isLoading, onSend, onFileUpload }) {
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div 
      className="flex flex-col h-full"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Messages */}
      <ScrollArea 
        ref={scrollRef}
        className="flex-1 p-4"
      >
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center">
              <Bot className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Asistente RAG - Onyx</h3>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">
              Consulta información del Ayuntamiento de Santa Gadea del Cid
            </p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} isUser={msg.role === 'user'} />
        ))}
        
        {isLoading && (
          <div className="flex gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span className="text-sm text-slate-400">Pensando...</span>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Adjuntar documento"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu consulta..."
            className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 text-center">
          Powered by Onyx RAG · Datos de Santa Gadea del Cid
        </p>
      </div>
    </div>
  );
}

export function ChatDock() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content) => {
    const userMessage = {
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Try real Onyx API first
      const response = await fetch(`${BACKEND_URL}/api/onyx-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error('API error');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || data.message || getMockResponse(content),
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.log('Using mock response:', error);
      // Fallback to mock response
      await new Promise(r => setTimeout(r, 800)); // Simulate delay
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: getMockResponse(content),
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    setMessages(prev => [...prev, {
      role: 'user',
      content: `📎 Documento adjunto: ${file.name}`,
      timestamp: new Date().toISOString()
    }]);

    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `He recibido el documento **${file.name}**. En una integración completa con Onyx, este documento se indexaría para consultas RAG.\n\nPor ahora, puedo responder preguntas sobre información general de Santa Gadea del Cid.`,
      timestamp: new Date().toISOString()
    }]);
    
    setIsLoading(false);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          data-testid="chat-toggle-btn"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all hover:scale-105 z-50"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          data-testid="chat-dock"
          className={cn(
            "fixed z-50 bg-slate-900 border border-slate-800 shadow-2xl shadow-black/50 flex flex-col transition-all duration-300",
            isExpanded 
              ? "inset-4 rounded-2xl" 
              : "bottom-6 right-6 w-96 h-[500px] rounded-2xl"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Asistente Onyx</h3>
                <p className="text-xs text-emerald-400">En línea</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          <ChatWindow 
            messages={messages}
            isLoading={isLoading}
            onSend={sendMessage}
            onFileUpload={handleFileUpload}
          />
        </div>
      )}
    </>
  );
}

export default ChatDock;
