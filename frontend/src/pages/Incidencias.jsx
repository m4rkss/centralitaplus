import { useState, useEffect } from 'react';
import { useTenantStore, useDataStore } from '@/stores/useTenantStore';
import { formatRelativeTime, formatDateTime, PRIORITY_COLORS, STATUS_COLORS, generateId, cn } from '@/lib/utils';
import { CATEGORIAS, PRIORIDADES, ESTADOS_INCIDENCIA } from '@/types/schemas';
import { 
  Plus, Search, Filter, Lightbulb, Construction, Droplets, 
  Trash2, HelpCircle, X, MapPin, User, Clock, MessageSquare, Send
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSearchParams } from 'react-router-dom';

const categoryIcons = {
  alumbrado: Lightbulb,
  vias_publicas: Construction,
  agua: Droplets,
  limpieza: Trash2,
  otros: HelpCircle
};

function IncidenciaCard({ incidencia, onClick }) {
  const Icon = categoryIcons[incidencia.categoria] || HelpCircle;
  const priorityColors = PRIORITY_COLORS[incidencia.prioridad];
  const statusColors = STATUS_COLORS[incidencia.estado];

  return (
    <div
      data-testid={`incidencia-card-${incidencia.id}`}
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20",
        priorityColors.bg,
        priorityColors.border
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={cn("px-2 py-0.5 rounded text-xs font-semibold uppercase", priorityColors.badge)}>
          {incidencia.prioridad}
        </span>
        <span className={cn("px-2 py-0.5 rounded text-xs", statusColors.badge)}>
          {incidencia.estado.replace('_', ' ')}
        </span>
      </div>

      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", priorityColors.bg)}>
          <Icon className={cn("w-5 h-5", priorityColors.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white truncate">{incidencia.titulo}</h4>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" />
            {incidencia.ubicacion}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700/50">
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatRelativeTime(incidencia.created_at)}
        </p>
        {incidencia.notas.length > 0 && (
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {incidencia.notas.length}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Incidencias() {
  const { subdomain } = useTenantStore();
  const { incidencias, fetchIncidencias, createIncidencia, updateIncidencia, isLoading } = useDataStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [filterPrioridad, setFilterPrioridad] = useState('todas');
  const [filterEstado, setFilterEstado] = useState('todas');
  const [selectedIncidencia, setSelectedIncidencia] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newNota, setNewNota] = useState('');

  const [newIncidencia, setNewIncidencia] = useState({
    titulo: '',
    descripcion: '',
    ubicacion: '',
    categoria: 'otros',
    prioridad: 'media',
    reportado_por: ''
  });

  // Fetch incidencias on mount
  useEffect(() => {
    fetchIncidencias();
  }, [fetchIncidencias]);

  // Check if we should open new form from URL param
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setShowNewForm(true);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  // Filtrar
  const filteredIncidencias = incidencias.filter(i => {
    const matchSearch = i.titulo.toLowerCase().includes(search.toLowerCase()) ||
                       i.ubicacion.toLowerCase().includes(search.toLowerCase());
    const matchPrioridad = filterPrioridad === 'todas' || i.prioridad === filterPrioridad;
    const matchEstado = filterEstado === 'todas' || i.estado === filterEstado;
    return matchSearch && matchPrioridad && matchEstado;
  });

  // Agrupar por prioridad
  const incidenciasPorPrioridad = {
    alta: filteredIncidencias.filter(i => i.prioridad === 'alta' && i.estado !== 'cerrada'),
    media: filteredIncidencias.filter(i => i.prioridad === 'media' && i.estado !== 'cerrada'),
    baja: filteredIncidencias.filter(i => i.prioridad === 'baja' && i.estado !== 'cerrada'),
    cerradas: filteredIncidencias.filter(i => i.estado === 'cerrada')
  };

  const handleCreateIncidencia = async () => {
    const incidenciaData = {
      titulo: newIncidencia.titulo,
      descripcion: newIncidencia.descripcion,
      ubicacion: newIncidencia.ubicacion,
      categoria: newIncidencia.categoria,
      prioridad: newIncidencia.prioridad
    };
    
    await createIncidencia(incidenciaData);
    setShowNewForm(false);
    setNewIncidencia({
      titulo: '',
      descripcion: '',
      ubicacion: '',
      categoria: 'otros',
      prioridad: 'media',
      reportado_por: ''
    });
  };

  const handleAddNota = async () => {
    if (!newNota.trim() || !selectedIncidencia) return;
    
    // For now, just close the modal since we don't have note functionality in the store
    setNewNota('');
    setSelectedIncidencia(null);
  };

  const handleChangeEstado = (nuevoEstado) => {
    if (!selectedIncidencia) return;
    
    const updates = {
      estado: nuevoEstado,
      closed_at: nuevoEstado === 'cerrada' ? new Date().toISOString() : null
    };
    
    updateIncidencia(subdomain, selectedIncidencia.id, updates);
    setSelectedIncidencia({ ...selectedIncidencia, ...updates });
  };

  return (
    <div data-testid="incidencias-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              data-testid="search-incidencias"
              placeholder="Buscar incidencias..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <Select value={filterPrioridad} onValueChange={setFilterPrioridad}>
            <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="todas" className="text-white">Todas</SelectItem>
              {PRIORIDADES.map(p => (
                <SelectItem key={p.value} value={p.value} className="text-white">{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="todas" className="text-white">Todos</SelectItem>
              {ESTADOS_INCIDENCIA.map(e => (
                <SelectItem key={e.value} value={e.value} className="text-white">{e.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          data-testid="new-incidencia-btn"
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Incidencia
        </button>
      </div>

      {/* Grid de incidencias por prioridad */}
      <div className="space-y-6">
        {incidenciasPorPrioridad.alta.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Alta Prioridad ({incidenciasPorPrioridad.alta.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incidenciasPorPrioridad.alta.map(inc => (
                <IncidenciaCard 
                  key={inc.id} 
                  incidencia={inc} 
                  onClick={() => setSelectedIncidencia(inc)}
                />
              ))}
            </div>
          </div>
        )}

        {incidenciasPorPrioridad.media.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Media Prioridad ({incidenciasPorPrioridad.media.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incidenciasPorPrioridad.media.map(inc => (
                <IncidenciaCard 
                  key={inc.id} 
                  incidencia={inc} 
                  onClick={() => setSelectedIncidencia(inc)}
                />
              ))}
            </div>
          </div>
        )}

        {incidenciasPorPrioridad.baja.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Baja Prioridad ({incidenciasPorPrioridad.baja.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incidenciasPorPrioridad.baja.map(inc => (
                <IncidenciaCard 
                  key={inc.id} 
                  incidencia={inc} 
                  onClick={() => setSelectedIncidencia(inc)}
                />
              ))}
            </div>
          </div>
        )}

        {incidenciasPorPrioridad.cerradas.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              Cerradas ({incidenciasPorPrioridad.cerradas.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incidenciasPorPrioridad.cerradas.slice(0, 6).map(inc => (
                <IncidenciaCard 
                  key={inc.id} 
                  incidencia={inc} 
                  onClick={() => setSelectedIncidencia(inc)}
                />
              ))}
            </div>
          </div>
        )}

        {filteredIncidencias.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No hay incidencias que mostrar</p>
          </div>
        )}
      </div>

      {/* Modal Nueva Incidencia */}
      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Nueva Incidencia</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Título *</Label>
              <Input
                data-testid="input-titulo"
                value={newIncidencia.titulo}
                onChange={(e) => setNewIncidencia(prev => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ej: Farola fundida en..."
                className="mt-1 bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Categoría *</Label>
                <Select 
                  value={newIncidencia.categoria} 
                  onValueChange={(v) => setNewIncidencia(prev => ({ ...prev, categoria: v }))}
                >
                  <SelectTrigger className="mt-1 bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {CATEGORIAS.map(c => (
                      <SelectItem key={c.value} value={c.value} className="text-white">{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Prioridad *</Label>
                <Select 
                  value={newIncidencia.prioridad} 
                  onValueChange={(v) => setNewIncidencia(prev => ({ ...prev, prioridad: v }))}
                >
                  <SelectTrigger className="mt-1 bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {PRIORIDADES.map(p => (
                      <SelectItem key={p.value} value={p.value} className="text-white">{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Ubicación *</Label>
              <Input
                data-testid="input-ubicacion"
                value={newIncidencia.ubicacion}
                onChange={(e) => setNewIncidencia(prev => ({ ...prev, ubicacion: e.target.value }))}
                placeholder="Ej: Plaza Mayor, junto al banco"
                className="mt-1 bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-300">Descripción</Label>
              <Textarea
                data-testid="input-descripcion"
                value={newIncidencia.descripcion}
                onChange={(e) => setNewIncidencia(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Detalle de la incidencia..."
                rows={3}
                className="mt-1 bg-slate-800 border-slate-700 text-white resize-none"
              />
            </div>

            <div>
              <Label className="text-slate-300">Reportado por</Label>
              <Input
                value={newIncidencia.reportado_por}
                onChange={(e) => setNewIncidencia(prev => ({ ...prev, reportado_por: e.target.value }))}
                placeholder="Nombre del ciudadano (opcional)"
                className="mt-1 bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowNewForm(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                data-testid="submit-incidencia"
                onClick={handleCreateIncidencia}
                disabled={!newIncidencia.titulo || !newIncidencia.ubicacion}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                Crear Incidencia
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Detalle Incidencia */}
      <Dialog open={!!selectedIncidencia} onOpenChange={() => setSelectedIncidencia(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Detalle de Incidencia</DialogTitle>
          </DialogHeader>
          
          {selectedIncidencia && (
            <div className="space-y-4">
              {/* Header con badges */}
              <div className="flex items-center gap-2">
                <span className={cn("px-2 py-1 rounded text-xs font-semibold uppercase", PRIORITY_COLORS[selectedIncidencia.prioridad].badge)}>
                  {selectedIncidencia.prioridad}
                </span>
                <span className={cn("px-2 py-1 rounded text-xs", STATUS_COLORS[selectedIncidencia.estado].badge)}>
                  {selectedIncidencia.estado.replace('_', ' ')}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-white">{selectedIncidencia.titulo}</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Ubicación
                  </p>
                  <p className="text-sm text-white">{selectedIncidencia.ubicacion}</p>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3" /> Reportado por
                  </p>
                  <p className="text-sm text-white">{selectedIncidencia.reportado_por || 'Anónimo'}</p>
                </div>
              </div>

              <div className="bg-slate-800/50 p-3 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Descripción</p>
                <p className="text-sm text-slate-300">{selectedIncidencia.descripcion || 'Sin descripción'}</p>
              </div>

              {/* Cambiar estado */}
              <div className="flex gap-2">
                <Label className="text-slate-300 self-center">Estado:</Label>
                <Select value={selectedIncidencia.estado} onValueChange={handleChangeEstado}>
                  <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {ESTADOS_INCIDENCIA.map(e => (
                      <SelectItem key={e.value} value={e.value} className="text-white">{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notas */}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Notas ({selectedIncidencia.notas.length})</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedIncidencia.notas.map(nota => (
                    <div key={nota.id} className="bg-slate-800/50 p-3 rounded-lg">
                      <p className="text-sm text-slate-300">{nota.texto}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {nota.autor} · {formatDateTime(nota.fecha)}
                      </p>
                    </div>
                  ))}
                  {selectedIncidencia.notas.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-2">Sin notas</p>
                  )}
                </div>

                {/* Añadir nota */}
                <div className="flex gap-2 mt-3">
                  <Input
                    value={newNota}
                    onChange={(e) => setNewNota(e.target.value)}
                    placeholder="Añadir una nota..."
                    className="bg-slate-800 border-slate-700 text-white"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddNota()}
                  />
                  <button
                    onClick={handleAddNota}
                    disabled={!newNota.trim()}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Timestamps */}
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-800">
                <p>Creada: {formatDateTime(selectedIncidencia.created_at)}</p>
                <p>Actualizada: {formatDateTime(selectedIncidencia.updated_at)}</p>
                {selectedIncidencia.closed_at && (
                  <p>Cerrada: {formatDateTime(selectedIncidencia.closed_at)}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
