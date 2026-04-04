import { Phone, AlertTriangle, Send, CheckCircle } from 'lucide-react';
import { KPICard, CallsChart, RecentActivity, QuickActions } from '@/components/dashboard';
import { useTenantStore, useDataStore } from '@/stores/useTenantStore';
import { LLAMADAS_MOCK, INCIDENCIAS_MOCK, COMUNICADOS_MOCK } from '@/data/mockSantaGadea';
import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from 'react-router-dom';
import { formatDateTime, formatDuration } from '@/lib/utils';

export default function Dashboard() {
  const { subdomain } = useTenantStore();
  const { getLlamadas, getIncidencias, getComunicados } = useDataStore();
  const navigate = useNavigate();
  
  const [kpiModal, setKpiModal] = useState({ open: false, type: null });
  
  // Usar datos del store o fallback a mock
  const llamadas = getLlamadas(subdomain).length > 0 ? getLlamadas(subdomain) : (LLAMADAS_MOCK[subdomain] || []);
  const incidencias = getIncidencias(subdomain).length > 0 ? getIncidencias(subdomain) : (INCIDENCIAS_MOCK[subdomain] || []);
  const comunicados = getComunicados(subdomain).length > 0 ? getComunicados(subdomain) : (COMUNICADOS_MOCK[subdomain] || []);

  // Calcular KPIs dinámicamente
  const kpis = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const hace7Dias = new Date(hoy);
    hace7Dias.setDate(hace7Dias.getDate() - 7);

    const llamadasHoy = llamadas.filter(l => new Date(l.fecha) >= hoy).length;
    const llamadasSemana = llamadas.filter(l => new Date(l.fecha) >= hace7Dias).length;
    const incidenciasAbiertas = incidencias.filter(i => i.estado !== 'cerrada').length;
    const incidenciasCerradasSemana = incidencias.filter(i => 
      i.closed_at && new Date(i.closed_at) >= hace7Dias
    ).length;
    const comunicadosEnviadosSemana = comunicados.filter(c => 
      c.enviado_at && new Date(c.enviado_at) >= hace7Dias
    ).length;

    return {
      llamadas_hoy: llamadasHoy,
      llamadas_semana: llamadasSemana,
      incidencias_abiertas: incidenciasAbiertas,
      incidencias_cerradas_semana: incidenciasCerradasSemana,
      comunicados_enviados_semana: comunicadosEnviadosSemana,
      satisfaccion_ia: 98
    };
  }, [llamadas, incidencias, comunicados]);

  // Calcular datos del gráfico
  const chartData = useMemo(() => {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const hoy = new Date();
    
    const datosGrafico = [];
    
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      fecha.setHours(0, 0, 0, 0);
      
      const siguienteDia = new Date(fecha);
      siguienteDia.setDate(siguienteDia.getDate() + 1);
      
      const llamadasDia = llamadas.filter(l => {
        const fechaLlamada = new Date(l.fecha);
        return fechaLlamada >= fecha && fechaLlamada < siguienteDia;
      });
      
      datosGrafico.push({
        dia: dias[fecha.getDay()],
        fecha: fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        llamadas: llamadasDia.length,
        vapi: llamadasDia.filter(l => l.proveedor === 'vapi').length,
        retell: llamadasDia.filter(l => l.proveedor === 'retell').length
      });
    }
    
    return datosGrafico;
  }, [llamadas]);

  const llamadasHoy = llamadas.filter(l => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return new Date(l.fecha) >= hoy;
  });

  const incidenciasAbiertas = incidencias.filter(i => i.estado !== 'cerrada');

  const handleKPIClick = (type) => {
    setKpiModal({ open: true, type });
  };

  return (
    <div data-testid="dashboard-page" className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          testId="kpi-llamadas-hoy"
          title="Llamadas Hoy"
          value={kpis.llamadas_hoy}
          subtitle={`${kpis.llamadas_semana} esta semana`}
          icon={Phone}
          color="blue"
          trend="up"
          trendValue="+12% vs ayer"
          onClick={() => handleKPIClick('llamadas')}
        />
        <KPICard
          testId="kpi-incidencias"
          title="Incidencias Abiertas"
          value={kpis.incidencias_abiertas}
          subtitle={`${kpis.incidencias_cerradas_semana} cerradas esta semana`}
          icon={AlertTriangle}
          color="amber"
          trend={kpis.incidencias_abiertas > 5 ? 'up' : 'down'}
          trendValue={kpis.incidencias_abiertas > 5 ? '+2 nuevas' : '-3 resueltas'}
          onClick={() => handleKPIClick('incidencias')}
        />
        <KPICard
          testId="kpi-comunicados"
          title="Comunicados Semana"
          value={kpis.comunicados_enviados_semana}
          subtitle="WhatsApp y Email"
          icon={Send}
          color="green"
          onClick={() => handleKPIClick('comunicados')}
        />
        <KPICard
          testId="kpi-satisfaccion"
          title="Satisfacción IA"
          value={`${kpis.satisfaccion_ia}%`}
          subtitle="Basado en resolución"
          icon={CheckCircle}
          color="purple"
          trend="up"
          trendValue="+2% este mes"
        />
      </div>

      {/* Chart y Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CallsChart data={chartData} />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity 
        llamadas={llamadas}
        incidencias={incidencias}
        comunicados={comunicados}
      />

      {/* KPI Detail Modal */}
      <Dialog open={kpiModal.open} onOpenChange={(open) => setKpiModal({ open, type: kpiModal.type })}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              {kpiModal.type === 'llamadas' && 'Llamadas de Hoy'}
              {kpiModal.type === 'incidencias' && 'Incidencias Abiertas'}
              {kpiModal.type === 'comunicados' && 'Comunicados Recientes'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {kpiModal.type === 'llamadas' && llamadasHoy.slice(0, 10).map(l => (
              <div 
                key={l.id}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 cursor-pointer"
                onClick={() => { setKpiModal({ open: false, type: null }); navigate('/llamadas'); }}
              >
                <div>
                  <p className="text-sm text-white">{l.descripcion}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(l.fecha)}</p>
                </div>
                <span className="text-xs text-slate-500">{formatDuration(l.duracion_segundos)}</span>
              </div>
            ))}
            
            {kpiModal.type === 'incidencias' && incidenciasAbiertas.map(i => (
              <div 
                key={i.id}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 cursor-pointer"
                onClick={() => { setKpiModal({ open: false, type: null }); navigate('/incidencias'); }}
              >
                <div>
                  <p className="text-sm text-white">{i.titulo}</p>
                  <p className="text-xs text-slate-400">{i.ubicacion}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  i.prioridad === 'alta' ? 'bg-red-500/20 text-red-400' :
                  i.prioridad === 'media' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {i.prioridad}
                </span>
              </div>
            ))}

            {kpiModal.type === 'comunicados' && comunicados.slice(0, 5).map(c => (
              <div 
                key={c.id}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 cursor-pointer"
                onClick={() => { setKpiModal({ open: false, type: null }); navigate('/comunicados'); }}
              >
                <div>
                  <p className="text-sm text-white">{c.titulo}</p>
                  <p className="text-xs text-slate-400">{c.destinatarios_count} destinatarios</p>
                </div>
                <span className="text-xs text-slate-500">{c.canal}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => { 
              setKpiModal({ open: false, type: null }); 
              navigate(`/${kpiModal.type}`); 
            }}
            className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Ver todos
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
