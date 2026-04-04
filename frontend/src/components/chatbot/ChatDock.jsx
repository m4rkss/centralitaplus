import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  MessageSquare, X, Minus, Send, Paperclip, Loader2, 
  Bot, User, Trash2, Maximize2, Minimize2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Mock responses for Santa Gadea
const MOCK_RESPONSES = {
  fiestas: `Las **Fiestas Patronales de Santa Gadea del Cid** se celebran del **14 al 17 de agosto**.

📅 **Programa:**
- **14 ago**: Pregón y verbena inaugural
- **15 ago**: Misa solemne, procesión, comida popular
- **16 ago**: Actividades infantiles, concursos
- **17 ago**: Encierro, toros, clausura

📍 **Ubicación**: Plaza Mayor

📄 *Programa completo disponible en PDF en el Ayuntamiento.*`,
  
  horarios: `🏛️ **Ayuntamiento de Santa Gadea del Cid**

⏰ **Horarios:**
- Lunes a Viernes: 9:00 - 14:00
- Tardes (Mar/Jue): 17:00 - 19:00

📞 947 58 XX XX
📧 ayuntamiento@santagadea.es`,

  piscina: `🏊 **Piscina Municipal**

📅 Temporada: 15 jun - 15 sep
⏰ Horario: 11:00 - 20:00

💰 **Precios:**
- Adultos: 3€
- Niños (4-12): 1.50€
- Menores 4 años: Gratis
- Bono 10 baños: 25€`,

  default: `¡Hola! Soy el asistente del **Ayuntamiento de Santa Gadea del Cid** 🏛️

Puedo ayudarte con:
• 📅 Fiestas patronales (14-17 agosto)
• ⏰ Horarios del Ayuntamiento
• 🏊 Piscina municipal
• 🚨 Reportar incidencias

¿En qué puedo ayudarte?`
};

function getMockResponse(message) {
  const lower = message.toLowerCase();
  if (lower.includes('fiesta') || lower.includes('agosto') || lower.includes('patronal')) {
    return MOCK_RESPONSES.fiestas;
  }
  if (lower.includes('horario') || lower.includes('hora') || lower.includes('abierto')) {
    return MOCK_RESPONSES.horarios;
  }
  if (lower.includes('piscina') || lower.includes('nadar') || lower.includes('bañar')) {
    return MOCK_RESPONSES.piscina;
  }
  return MOCK_RESPONSES.default;
}

// Typing indicator animation
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-2">
      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

// Message bubble component - responsive
function MessageBubble({ message, isUser }) {
  return (
    <div 
      className={cn(
        "flex gap-2 sm:gap-3 mb-3 sm:mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <Avatar className={cn(
        "w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0",
        isUser ? "bg-blue-600" : "bg-gradient-to-br from-emerald-500 to-teal-600"
      )}>
        <AvatarFallback className="bg-transparent">
          {isUser ? (
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          ) : (
            <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          )}
        </AvatarFallback>
      </Avatar>

      {/* Message content */}
      <div 
        className={cn(
          "max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5",
          isUser 
            ? "bg-blue-600 text-white rounded-br-sm" 
            : "bg-slate-800 text-slate-100 rounded-bl-sm"
        )}
      >
        {isUser ? (
          <p className="text-sm sm:text-sm break-words">{message.content}</p>
        ) : (
          <div className="text-sm sm:text-sm prose prose-invert prose-sm max-w-none break-words">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                em: ({ children }) => <em className="text-slate-300">{children}</em>,
                h3: ({ children }) => <h3 className="font-semibold text-white mt-2 mb-1">{children}</h3>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        <p className={cn(
          "text-[10px] mt-1.5",
          isUser ? "text-blue-200" : "text-slate-500"
        )}>
          {new Date(message.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

// Main ChatDock component - fully responsive
export function ChatDock() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Check if mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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
        id: Date.now(),
        role: 'assistant',
        content: data.response || getMockResponse(userMessage.content),
        timestamp: new Date().toISOString(),
        source: data.source
      }]);
    } catch (error) {
      console.log('Using mock response');
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

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle file upload
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

  // Clear chat
  const clearChat = () => {
    setMessages([]);
  };

  // Quick suggestions
  const suggestions = [
    '¿Cuándo son las fiestas?',
    'Horarios Ayuntamiento',
    'Info piscina'
  ];

  return (
    <>
      {/* Floating toggle button */}
      {!isOpen && (
        <button
          data-testid="chat-toggle-btn"
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed z-50 flex items-center justify-center transition-all duration-300",
            "bg-gradient-to-br from-emerald-500 to-teal-600",
            "hover:from-emerald-600 hover:to-teal-700 hover:scale-105",
            "text-white shadow-lg shadow-emerald-500/30",
            // Mobile: smaller, more bottom-right margin
            "bottom-4 right-4 w-12 h-12 rounded-full sm:bottom-6 sm:right-6 sm:w-14 sm:h-14"
          )}
          aria-label="Abrir chat"
        >
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
          {/* Notification dot */}
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && !isMinimized && (
        <div
          data-testid="chat-dock"
          className={cn(
            "fixed z-50 flex flex-col bg-slate-900 border border-slate-800 shadow-2xl shadow-black/50 transition-all duration-300",
            // Mobile: fullscreen
            isMobile || isFullscreen
              ? "inset-0 rounded-none"
              // Desktop: floating card
              : "bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100%-2rem)] sm:w-[400px] h-[500px] sm:h-[600px] max-h-[calc(100vh-2rem)] rounded-2xl"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Asistente Onyx</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <p className="text-xs text-emerald-400">En línea</p>
                </div>
              </div>
            </div>
            
            {/* Header actions */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {/* Clear chat */}
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearChat}
                  className="w-8 h-8 text-slate-400 hover:text-white hover:bg-slate-800"
                  title="Limpiar chat"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              
              {/* Fullscreen toggle (desktop only) */}
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="w-8 h-8 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </Button>
              )}
              
              {/* Minimize */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(true)}
                className="w-8 h-8 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <Minus className="w-4 h-4" />
              </Button>
              
              {/* Close */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setIsOpen(false); setIsFullscreen(false); }}
                className="w-8 h-8 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages area */}
          <ScrollArea ref={scrollRef} className="flex-1 px-3 sm:px-4 py-3 sm:py-4">
            {/* Empty state */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center mb-4">
                  <Bot className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">¡Hola! 👋</h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-[250px] mb-6">
                  Soy el asistente de Santa Gadea del Cid. ¿En qué puedo ayudarte?
                </p>
                
                {/* Quick suggestions */}
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-full transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Messages */}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isUser={msg.role === 'user'} />
            ))}
            
            {/* Typing indicator */}
            {isLoading && (
              <div className="flex gap-2 sm:gap-3 mb-3 animate-in fade-in">
                <Avatar className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-500 to-teal-600">
                  <AvatarFallback className="bg-transparent">
                    <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3">
                  <TypingIndicator />
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Input area */}
          <div className="flex-shrink-0 p-3 sm:p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              {/* File upload */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 sm:w-10 sm:h-10 text-slate-400 hover:text-white hover:bg-slate-800 flex-shrink-0"
                title="Adjuntar archivo"
              >
                <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              
              {/* Input */}
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                className="flex-1 h-9 sm:h-10 bg-slate-800 border-slate-700 text-white text-sm placeholder:text-slate-500 rounded-xl"
                disabled={isLoading}
              />
              
              {/* Send button */}
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 rounded-xl flex-shrink-0"
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>
            </div>
            
            {/* Footer */}
            <p className="text-[9px] sm:text-[10px] text-slate-500 mt-2 text-center">
              Powered by Onyx RAG • Santa Gadea del Cid
            </p>
          </div>
        </div>
      )}

      {/* Minimized state */}
      {isOpen && isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className={cn(
            "fixed z-50 flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5",
            "bg-slate-900 border border-slate-800 rounded-full",
            "shadow-lg shadow-black/30 transition-all hover:bg-slate-800",
            "bottom-4 right-4 sm:bottom-6 sm:right-6"
          )}
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs sm:text-sm text-white font-medium">Chat</span>
          {messages.length > 0 && (
            <span className="w-5 h-5 bg-emerald-500 rounded-full text-[10px] text-white flex items-center justify-center">
              {messages.length}
            </span>
          )}
          <X 
            className="w-4 h-4 text-slate-400 hover:text-white ml-1" 
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); setIsMinimized(false); }}
          />
        </button>
      )}
    </>
  );
}

export default ChatDock;
