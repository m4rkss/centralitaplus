import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TENANTS, LLAMADAS_MOCK, INCIDENCIAS_MOCK, COMUNICADOS_MOCK } from '@/data/mockSantaGadea';

// Detectar tenant desde URL
const getTenantFromURL = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // santagadea.centralitaia.com → santagadea
  if (parts.length >= 3 && parts[0] !== 'www') {
    const subdomain = parts[0];
    // Si el subdominio existe en TENANTS, usarlo
    if (TENANTS[subdomain]) {
      return subdomain;
    }
  }
  
  // Para desarrollo local o preview, usar query param ?tenant=santagadea
  const urlParams = new URLSearchParams(window.location.search);
  const tenantParam = urlParams.get('tenant');
  if (tenantParam && TENANTS[tenantParam]) {
    return tenantParam;
  }
  
  // Default a Santa Gadea para demo (incluye preview.emergentagent.com)
  return 'santagadea';
};

export const useTenantStore = create(
  persist(
    (set, get) => ({
      // Estado
      currentTenant: null,
      subdomain: getTenantFromURL(),
      
      // Inicializar tenant
      initTenant: () => {
        const subdomain = getTenantFromURL();
        const tenant = TENANTS[subdomain] || TENANTS.demo;
        set({ currentTenant: tenant, subdomain });
        
        // Aplicar color primario al CSS
        document.documentElement.style.setProperty('--primary-color', tenant.primaryColor);
      },
      
      // Cambiar tenant (para admin)
      setTenant: (subdomain) => {
        const tenant = TENANTS[subdomain];
        if (tenant) {
          set({ currentTenant: tenant, subdomain });
          document.documentElement.style.setProperty('--primary-color', tenant.primaryColor);
        }
      },
      
      // Getters
      getTenant: () => get().currentTenant,
      getSubdomain: () => get().subdomain,
    }),
    {
      name: 'tenant-storage',
      partialize: (state) => ({ subdomain: state.subdomain }),
    }
  )
);

// Store para datos (llamadas, incidencias, comunicados)
export const useDataStore = create(
  persist(
    (set, get) => ({
      // Datos iniciales desde mock
      llamadas: {},
      incidencias: {},
      comunicados: {},
      initialized: false,

      // Inicializar datos
      initData: (subdomain) => {
        if (get().initialized) return;
        
        set({
          llamadas: { ...LLAMADAS_MOCK },
          incidencias: { ...INCIDENCIAS_MOCK },
          comunicados: { ...COMUNICADOS_MOCK },
          initialized: true
        });
      },

      // === LLAMADAS ===
      getLlamadas: (subdomain) => {
        return get().llamadas[subdomain] || LLAMADAS_MOCK[subdomain] || [];
      },

      // === INCIDENCIAS ===
      getIncidencias: (subdomain) => {
        return get().incidencias[subdomain] || INCIDENCIAS_MOCK[subdomain] || [];
      },

      addIncidencia: (subdomain, incidencia) => {
        const current = get().incidencias[subdomain] || [];
        set({
          incidencias: {
            ...get().incidencias,
            [subdomain]: [incidencia, ...current]
          }
        });
      },

      updateIncidencia: (subdomain, id, updates) => {
        const current = get().incidencias[subdomain] || [];
        set({
          incidencias: {
            ...get().incidencias,
            [subdomain]: current.map(inc => 
              inc.id === id ? { ...inc, ...updates, updated_at: new Date().toISOString() } : inc
            )
          }
        });
      },

      deleteIncidencia: (subdomain, id) => {
        const current = get().incidencias[subdomain] || [];
        set({
          incidencias: {
            ...get().incidencias,
            [subdomain]: current.filter(inc => inc.id !== id)
          }
        });
      },

      addNotaIncidencia: (subdomain, incidenciaId, nota) => {
        const current = get().incidencias[subdomain] || [];
        set({
          incidencias: {
            ...get().incidencias,
            [subdomain]: current.map(inc => 
              inc.id === incidenciaId 
                ? { 
                    ...inc, 
                    notas: [...inc.notas, nota],
                    updated_at: new Date().toISOString()
                  } 
                : inc
            )
          }
        });
      },

      // === COMUNICADOS ===
      getComunicados: (subdomain) => {
        return get().comunicados[subdomain] || COMUNICADOS_MOCK[subdomain] || [];
      },

      addComunicado: (subdomain, comunicado) => {
        const current = get().comunicados[subdomain] || [];
        set({
          comunicados: {
            ...get().comunicados,
            [subdomain]: [comunicado, ...current]
          }
        });
      },

      updateComunicado: (subdomain, id, updates) => {
        const current = get().comunicados[subdomain] || [];
        set({
          comunicados: {
            ...get().comunicados,
            [subdomain]: current.map(com => 
              com.id === id ? { ...com, ...updates } : com
            )
          }
        });
      },

      // Reset para testing
      resetData: () => {
        set({
          llamadas: { ...LLAMADAS_MOCK },
          incidencias: { ...INCIDENCIAS_MOCK },
          comunicados: { ...COMUNICADOS_MOCK },
          initialized: true
        });
      }
    }),
    {
      name: 'centralita-data-storage',
    }
  )
);
