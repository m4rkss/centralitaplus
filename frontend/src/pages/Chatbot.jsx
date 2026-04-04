import { useTenantStore } from '@/stores/useTenantStore';
import { MessageSquare, ExternalLink, FileUp, FileDown, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function Chatbot() {
  const { currentTenant } = useTenantStore();
  const [loading, setLoading] = useState(true);
  
  // URL de Onyx Cloud - placeholder para el workspace del tenant
  const onyxUrl = currentTenant?.config?.onyx_workspace_id 
    ? `https://cloud.onyx.app/chat/${currentTenant.config.onyx_workspace_id}`
    : 'https://cloud.onyx.app/widget';

  return (
    <div data-testid="chatbot-page" className="space-y-4 h-[calc(100vh-theme(spacing.32))]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <MessageSquare className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Asistente RAG - Onyx</h2>
            <p className="text-xs text-slate-400">Consulta documentos del ayuntamiento</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
            <FileUp className="w-4 h-4" />
            Subir doc
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
            <FileDown className="w-4 h-4" />
            Descargar
          </button>
          <button 
            onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 500); }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <a
            href={onyxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir en Onyx
          </a>
        </div>
      </div>

      {/* Iframe Container */}
      <div className="relative flex-1 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden" style={{ height: 'calc(100% - 60px)' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-slate-400">Cargando Onyx Cloud...</p>
            </div>
          </div>
        )}
        
        <iframe
          data-testid="onyx-iframe"
          src={onyxUrl}
          className="w-full h-full border-0"
          title="Chatbot Onyx"
          onLoad={() => setLoading(false)}
          allow="microphone; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />

        {/* Fallback si el iframe no carga correctamente */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center opacity-0 hover:opacity-100 transition-opacity bg-slate-900/95 p-8 rounded-xl pointer-events-auto">
            <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Onyx Chatbot</h3>
            <p className="text-sm text-slate-400 mb-4 max-w-xs">
              El chatbot RAG de Onyx permite consultar documentos municipales usando inteligencia artificial.
            </p>
            <a
              href={onyxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir Onyx Cloud
            </a>
          </div>
        </div>
      </div>

      {/* Info footer */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <p>Workspace: {currentTenant?.config?.onyx_workspace_id || 'demo'}</p>
        <p>Powered by Onyx RAG</p>
      </div>
    </div>
  );
}
