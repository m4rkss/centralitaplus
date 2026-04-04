import { useTenantStore } from '@/stores/useTenantStore';
import { TENANTS } from '@/data/mockSantaGadea';
import { Building2, Palette, Database, Bell, Users, Shield, Save } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from 'react';

export default function Configuracion() {
  const { currentTenant, setTenant, subdomain } = useTenantStore();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div data-testid="configuracion-page" className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Configuración</h2>
          <p className="text-sm text-slate-400">Gestiona la configuración de tu centralita</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          {saved ? '¡Guardado!' : 'Guardar cambios'}
        </button>
      </div>

      {/* Secciones */}
      <div className="space-y-6">
        {/* Tenant */}
        <section className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Organización</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Nombre</Label>
              <Input
                value={currentTenant?.nombre || ''}
                disabled
                className="mt-1 bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Subdominio</Label>
              <Input
                value={subdomain}
                disabled
                className="mt-1 bg-slate-800 border-slate-700 text-white"
              />
            </div>
            
            {/* Cambiar tenant (para demo) */}
            <div className="md:col-span-2">
              <Label className="text-slate-300">Cambiar Tenant (Demo)</Label>
              <Select value={subdomain} onValueChange={setTenant}>
                <SelectTrigger className="mt-1 w-64 bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {Object.entries(TENANTS).map(([key, tenant]) => (
                    <SelectItem key={key} value={key} className="text-white">
                      {tenant.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">Solo para demostración multi-tenant</p>
            </div>
          </div>
        </section>

        {/* Apariencia */}
        <section className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Apariencia</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Color primario</Label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="color"
                  value={currentTenant?.primaryColor || '#6366f1'}
                  className="w-12 h-10 rounded cursor-pointer bg-transparent border-0"
                  disabled
                />
                <Input
                  value={currentTenant?.primaryColor || '#6366f1'}
                  disabled
                  className="w-32 bg-slate-800 border-slate-700 text-white font-mono"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Integraciones */}
        <section className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Integraciones</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-white">Vapi Voice AI</p>
                <p className="text-xs text-slate-400">Llamadas entrantes con IA</p>
              </div>
              <Switch checked={currentTenant?.config?.vapi_enabled} disabled />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-white">Retell AI</p>
                <p className="text-xs text-slate-400">Agente de voz alternativo</p>
              </div>
              <Switch checked={currentTenant?.config?.retell_enabled} disabled />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-white">Onyx RAG</p>
                <p className="text-xs text-slate-400">Chatbot con documentos</p>
              </div>
              <Switch checked={!!currentTenant?.config?.onyx_workspace_id} disabled />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-white">n8n Workflows</p>
                <p className="text-xs text-slate-400">Automatización de comunicados</p>
              </div>
              <Switch checked={!!currentTenant?.config?.n8n_webhook_url} disabled />
            </div>
          </div>
        </section>

        {/* Notificaciones */}
        <section className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Notificaciones</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Email de incidencias</p>
                <p className="text-xs text-slate-400">Recibir alertas de nuevas incidencias</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Resumen diario</p>
                <p className="text-xs text-slate-400">Informe automático cada mañana</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Llamadas en revisión</p>
                <p className="text-xs text-slate-400">Alertar cuando hay llamadas para revisar</p>
              </div>
              <Switch />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
