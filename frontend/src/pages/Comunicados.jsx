import { useState, useEffect } from 'react';
import { useTenantStore, useDataStore } from '@/stores/useTenantStore';
import { formatDateTime, STATUS_COLORS, generateId, cn } from '@/lib/utils';
import { 
  Plus, Search, Mail, MessageSquare, Send, Clock, Users, 
  Eye, CheckCircle, AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSearchParams } from 'react-router-dom';

const canalIcons = {
  whatsapp: MessageSquare,
  email: Mail,
  ambos: Send
};

const canalColors = {
  whatsapp: 'text-green-400 bg-green-500/20',
  email: 'text-blue-400 bg-blue-500/20',
  ambos: 'text-purple-400 bg-purple-500/20'
};

function ComunicadoCard({ comunicado, onClick }) {
  const Icon = canalIcons[comunicado.canal] || Send;
  const colorClass = canalColors[comunicado.canal];

  return (
    <div
      data-testid={`comunicado-card-${comunicado.id}`}
      onClick={onClick}
      className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-800/50 transition-all hover:shadow-lg hover:shadow-black/20"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2 rounded-lg", colorClass)}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={cn(
          "px-2 py-0.5 rounded text-xs font-medium",
          STATUS_COLORS[comunicado.estado]?.badge || 'bg-slate-500/20 text-slate-400'
        )}>
          {comunicado.estado}
        </span>
      </div>

      <h4 className="text-sm font-semibold text-white mb-2 line-clamp-1">{comunicado.titulo}</h4>
      <p className="text-xs text-slate-400 line-clamp-2 mb-3">{comunicado.mensaje}</p>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {comunicado.destinatarios_count} destinatarios
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {comunicado.enviado_at ? formatDateTime(comunicado.enviado_at) : 'Borrador'}
        </span>
      </div>
    </div>
  );
}

export default function Comunicados() {
  const { subdomain } = useTenantStore();
  const { getComunicados, addComunicado, updateComunicado } = useDataStore();
  const comunicados = getComunicados(subdomain);
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedComunicado, setSelectedComunicado] = useState(null);
  const [sending, setSending] = useState(false);

  const [newComunicado, setNewComunicado] = useState({
    titulo: '',
    mensaje: '',
    canal: 'whatsapp'
  });

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setShowNewForm(true);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const filteredComunicados = comunicados.filter(c => 
    c.titulo.toLowerCase().includes(search.toLowerCase()) ||
    c.mensaje.toLowerCase().includes(search.toLowerCase())
  );

  const handleSendComunicado = async () => {
    if (!newComunicado.titulo || !newComunicado.mensaje) return;
    
    setSending(true);
    
    // Simular envío a n8n (mock)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const comunicado = {
      id: generateId('com'),
      tenant_id: subdomain,
      ...newComunicado,
      destinatarios_count: Math.floor(Math.random() * 300) + 100,
      estado: 'enviado',
      enviado_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    
    addComunicado(subdomain, comunicado);
    setSending(false);
    setShowNewForm(false);
    setNewComunicado({ titulo: '', mensaje: '', canal: 'whatsapp' });
  };

  const handleSaveDraft = () => {
    if (!newComunicado.titulo) return;
    
    const comunicado = {
      id: generateId('com'),
      tenant_id: subdomain,
      ...newComunicado,
      destinatarios_count: 0,
      estado: 'borrador',
      enviado_at: null,
      created_at: new Date().toISOString()
    };
    
    addComunicado(subdomain, comunicado);
    setShowNewForm(false);
    setNewComunicado({ titulo: '', mensaje: '', canal: 'whatsapp' });
  };

  return (
    <div data-testid="comunicados-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            data-testid="search-comunicados"
            placeholder="Buscar comunicados..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-64 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>

        <button
          data-testid="new-comunicado-btn"
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Comunicado
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
          <p className="text-2xl font-bold text-white">
            {comunicados.filter(c => c.estado === 'enviado').length}
          </p>
          <p className="text-sm text-slate-400">Enviados</p>
        </div>
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
          <p className="text-2xl font-bold text-white">
            {comunicados.reduce((sum, c) => sum + (c.estado === 'enviado' ? c.destinatarios_count : 0), 0)}
          </p>
          <p className="text-sm text-slate-400">Destinatarios alcanzados</p>
        </div>
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
          <p className="text-2xl font-bold text-white">
            {comunicados.filter(c => c.estado === 'borrador').length}
          </p>
          <p className="text-sm text-slate-400">Borradores</p>
        </div>
      </div>

      {/* Lista de comunicados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredComunicados.map(comunicado => (
          <ComunicadoCard
            key={comunicado.id}
            comunicado={comunicado}
            onClick={() => setSelectedComunicado(comunicado)}
          />
        ))}
        
        {filteredComunicados.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Send className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No hay comunicados</p>
            <button
              onClick={() => setShowNewForm(true)}
              className="mt-4 text-sm text-blue-400 hover:text-blue-300"
            >
              Crear el primero
            </button>
          </div>
        )}
      </div>

      {/* Modal Nuevo Comunicado */}
      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Nuevo Comunicado</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Título *</Label>
              <Input
                data-testid="input-titulo-comunicado"
                value={newComunicado.titulo}
                onChange={(e) => setNewComunicado(prev => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ej: Aviso corte de agua"
                className="mt-1 bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-300">Canal de envío *</Label>
              <div className="flex gap-2 mt-2">
                {['whatsapp', 'email', 'ambos'].map(canal => {
                  const Icon = canalIcons[canal];
                  const isSelected = newComunicado.canal === canal;
                  return (
                    <button
                      key={canal}
                      onClick={() => setNewComunicado(prev => ({ ...prev, canal }))}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all",
                        isSelected 
                          ? "bg-slate-700 border-slate-600 text-white" 
                          : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {canal.charAt(0).toUpperCase() + canal.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Mensaje *</Label>
              <Textarea
                data-testid="input-mensaje-comunicado"
                value={newComunicado.mensaje}
                onChange={(e) => setNewComunicado(prev => ({ ...prev, mensaje: e.target.value }))}
                placeholder="Escribe el mensaje para los ciudadanos..."
                rows={5}
                className="mt-1 bg-slate-800 border-slate-700 text-white resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">{newComunicado.mensaje.length}/500 caracteres</p>
            </div>

            {/* Preview */}
            {newComunicado.mensaje && (
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Vista previa
                </p>
                <div className={cn(
                  "p-3 rounded-lg text-sm",
                  newComunicado.canal === 'whatsapp' ? 'bg-green-900/30 text-green-100' : 
                  newComunicado.canal === 'email' ? 'bg-blue-900/30 text-blue-100' : 
                  'bg-purple-900/30 text-purple-100'
                )}>
                  <p className="font-semibold mb-1">{newComunicado.titulo || 'Título del comunicado'}</p>
                  <p className="text-xs opacity-80">{newComunicado.mensaje}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveDraft}
                disabled={!newComunicado.titulo}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 text-white rounded-lg text-sm transition-colors"
              >
                Guardar borrador
              </button>
              <button
                data-testid="send-comunicado"
                onClick={handleSendComunicado}
                disabled={!newComunicado.titulo || !newComunicado.mensaje || sending}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Detalle Comunicado */}
      <Dialog open={!!selectedComunicado} onOpenChange={() => setSelectedComunicado(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Detalle del Comunicado</DialogTitle>
          </DialogHeader>
          
          {selectedComunicado && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={cn("p-2 rounded-lg", canalColors[selectedComunicado.canal])}>
                  {(() => {
                    const Icon = canalIcons[selectedComunicado.canal];
                    return <Icon className="w-5 h-5" />;
                  })()}
                </span>
                <span className={cn(
                  "px-2 py-1 rounded text-xs font-medium",
                  STATUS_COLORS[selectedComunicado.estado]?.badge
                )}>
                  {selectedComunicado.estado}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-white">{selectedComunicado.titulo}</h3>
              
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedComunicado.mensaje}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Destinatarios</p>
                  <p className="text-lg font-semibold text-white">{selectedComunicado.destinatarios_count}</p>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Canal</p>
                  <p className="text-sm text-white capitalize">{selectedComunicado.canal}</p>
                </div>
              </div>

              <div className="text-xs text-slate-500 pt-2 border-t border-slate-800">
                <p>Creado: {formatDateTime(selectedComunicado.created_at)}</p>
                {selectedComunicado.enviado_at && (
                  <p>Enviado: {formatDateTime(selectedComunicado.enviado_at)}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
