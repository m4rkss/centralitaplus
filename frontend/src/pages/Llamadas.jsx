import { useState, useMemo } from 'react';
import { useTenantStore, useDataStore } from '@/stores/useTenantStore';
import { formatDateTime, formatDuration, STATUS_COLORS } from '@/lib/utils';
import { Search, Filter, Download, Phone, ChevronLeft, ChevronRight, X, Play, Copy, CheckCircle } from 'lucide-react';
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
import { cn } from '@/lib/utils';

export default function Llamadas() {
  const { subdomain } = useTenantStore();
  const { getLlamadas } = useDataStore();
  const llamadas = getLlamadas(subdomain);

  const [search, setSearch] = useState('');
  const [filterProveedor, setFilterProveedor] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLlamada, setSelectedLlamada] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const itemsPerPage = 10;

  // Filtrar llamadas
  const filteredLlamadas = useMemo(() => {
    return llamadas.filter(l => {
      const matchSearch = l.descripcion.toLowerCase().includes(search.toLowerCase()) ||
                         l.telefono_origen?.includes(search);
      const matchProveedor = filterProveedor === 'todos' || l.proveedor === filterProveedor;
      const matchEstado = filterEstado === 'todos' || l.estado === filterEstado;
      return matchSearch && matchProveedor && matchEstado;
    });
  }, [llamadas, search, filterProveedor, filterEstado]);

  // Paginación
  const totalPages = Math.ceil(filteredLlamadas.length / itemsPerPage);
  const paginatedLlamadas = filteredLlamadas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCopyTranscription = () => {
    if (selectedLlamada?.transcripcion) {
      navigator.clipboard.writeText(selectedLlamada.transcripcion);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div data-testid="llamadas-page" className="space-y-6">
      {/* Header con filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              data-testid="search-llamadas"
              placeholder="Buscar llamadas..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-9 w-64 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Filtro proveedor */}
          <Select value={filterProveedor} onValueChange={(v) => { setFilterProveedor(v); setCurrentPage(1); }}>
            <SelectTrigger data-testid="filter-proveedor" className="w-32 bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Proveedor" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="todos" className="text-white">Todos</SelectItem>
              <SelectItem value="vapi" className="text-white">Vapi</SelectItem>
              <SelectItem value="retell" className="text-white">Retell</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro estado */}
          <Select value={filterEstado} onValueChange={(v) => { setFilterEstado(v); setCurrentPage(1); }}>
            <SelectTrigger data-testid="filter-estado" className="w-36 bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="todos" className="text-white">Todos</SelectItem>
              <SelectItem value="completada" className="text-white">Completada</SelectItem>
              <SelectItem value="revision" className="text-white">En Revisión</SelectItem>
              <SelectItem value="fallida" className="text-white">Fallida</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <button 
          data-testid="export-btn"
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Fecha/Hora</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Duración</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Descripción</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Proveedor</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {paginatedLlamadas.map((llamada) => (
                <tr 
                  key={llamada.id}
                  data-testid={`llamada-row-${llamada.id}`}
                  className="hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm text-white">{formatDateTime(llamada.fecha)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-300 font-mono">
                      {formatDuration(llamada.duracion_segundos)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-white truncate max-w-xs">{llamada.descripcion}</p>
                    {llamada.telefono_origen && (
                      <p className="text-xs text-slate-500">{llamada.telefono_origen}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-medium",
                      llamada.proveedor === 'vapi' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                    )}>
                      {llamada.proveedor.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-medium",
                      STATUS_COLORS[llamada.estado]?.badge || 'bg-slate-500/20 text-slate-400'
                    )}>
                      {llamada.estado === 'completada' ? '✓ OK' : 
                       llamada.estado === 'revision' ? '⚠ Rev' : '✗ Error'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      data-testid={`ver-llamada-${llamada.id}`}
                      onClick={() => setSelectedLlamada(llamada)}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
          <p className="text-sm text-slate-400">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredLlamadas.length)} de {filteredLlamadas.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-400">
              Pág {currentPage} de {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal detalle llamada */}
      <Dialog open={!!selectedLlamada} onOpenChange={() => setSelectedLlamada(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-400" />
              Detalle de Llamada
            </DialogTitle>
          </DialogHeader>
          
          {selectedLlamada && (
            <div className="space-y-4">
              {/* Info básica */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Fecha y Hora</p>
                  <p className="text-sm text-white">{formatDateTime(selectedLlamada.fecha)}</p>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Duración</p>
                  <p className="text-sm text-white font-mono">{formatDuration(selectedLlamada.duracion_segundos)}</p>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Proveedor</p>
                  <p className="text-sm text-white">{selectedLlamada.proveedor.toUpperCase()}</p>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Estado</p>
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    STATUS_COLORS[selectedLlamada.estado]?.badge
                  )}>
                    {selectedLlamada.estado}
                  </span>
                </div>
              </div>

              <div className="bg-slate-800/50 p-3 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Descripción</p>
                <p className="text-sm text-white">{selectedLlamada.descripcion}</p>
              </div>

              {selectedLlamada.telefono_origen && (
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Teléfono Origen</p>
                  <p className="text-sm text-white font-mono">{selectedLlamada.telefono_origen}</p>
                </div>
              )}

              {/* Transcripción */}
              {selectedLlamada.transcripcion ? (
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Transcripción</p>
                    <button
                      onClick={handleCopyTranscription}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">
                    {selectedLlamada.transcripcion}
                  </pre>
                </div>
              ) : (
                <div className="bg-slate-800/30 p-4 rounded-lg text-center">
                  <p className="text-sm text-slate-500">Transcripción no disponible</p>
                </div>
              )}

              {/* Audio (placeholder) */}
              <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                <button className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors">
                  <Play className="w-4 h-4 text-white" />
                </button>
                <div className="flex-1 h-1 bg-slate-700 rounded-full">
                  <div className="w-0 h-full bg-blue-500 rounded-full"></div>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {formatDuration(selectedLlamada.duracion_segundos)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
