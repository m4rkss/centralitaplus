import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Helper: XHR-based POST that bypasses fetch interception from dev overlay
function xhrPost(url, body) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, data });
      } catch {
        resolve({ ok: false, status: xhr.status, data: { detail: 'Error de conexión' } });
      }
    };
    xhr.onerror = () => reject(new Error('Error de red'));
    xhr.send(JSON.stringify(body));
  });
}

// Helper: XHR-based GET
function xhrGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, data });
      } catch {
        resolve({ ok: false, status: xhr.status, data: {} });
      }
    };
    xhr.onerror = () => reject(new Error('Error de red'));
    xhr.send();
  });
}

// Auth store
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login
      login: async (email, password, tenantId = null) => {
        set({ isLoading: true, error: null });
        
        try {
          const { ok, data } = await xhrPost(`${BACKEND_URL}/api/auth/login`, {
            email, password, tenant_id: tenantId
          });

          if (!ok) {
            throw new Error(data.detail || 'Error de autenticación');
          }
          
          set({
            user: data.user,
            token: data.access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          return data;
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.message,
            isAuthenticated: false 
          });
          throw error;
        }
      },

      // Logout
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        });
      },

      // Verify token
      verifyToken: async () => {
        const token = get().token;
        if (!token) {
          set({ isAuthenticated: false });
          return false;
        }

        try {
          const { ok, data } = await xhrGet(`${BACKEND_URL}/api/auth/me`, {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          });

          if (!ok) {
            set({ user: null, token: null, isAuthenticated: false });
            return false;
          }

          set({ user: data, isAuthenticated: true });
          return true;
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false });
          return false;
        }
      },

      // Get auth headers
      getAuthHeaders: () => {
        const token = get().token;
        return token ? { 'Authorization': `Bearer ${token}` } : {};
      },

      // Clear error
      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

// Tenant store
export const useTenantStore = create(
  persist(
    (set, get) => ({
      currentTenant: null,
      subdomain: 'santa-gadea',
      isLoading: false,

      // Get tenant from URL
      getTenantFromURL: () => {
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        
        // santagadea.centralitaia.com -> santa-gadea
        if (parts.length >= 3 && !['www', 'api'].includes(parts[0])) {
          const subdomainMap = {
            'santagadea': 'santa-gadea',
            'santa-gadea': 'santa-gadea',
            'demo': 'demo'
          };
          return subdomainMap[parts[0]] || 'santa-gadea';
        }
        
        // Query param fallback
        const urlParams = new URLSearchParams(window.location.search);
        const tenantParam = urlParams.get('tenant');
        if (tenantParam) return tenantParam;
        
        return 'santa-gadea';
      },

      // Initialize tenant
      initTenant: async () => {
        set({ isLoading: true });
        const subdomain = get().getTenantFromURL();
        
        try {
          const response = await fetch(`${BACKEND_URL}/api/tenant`, {
            headers: { 'X-Tenant-ID': subdomain }
          });
          
          if (response.ok) {
            const tenant = await response.json();
            set({ 
              currentTenant: tenant, 
              subdomain: tenant.id,
              isLoading: false 
            });
            
            // Apply primary color
            if (tenant.primary_color) {
              document.documentElement.style.setProperty('--primary-color', tenant.primary_color);
            }
            
            return tenant;
          }
        } catch (error) {
          console.error('Failed to fetch tenant:', error);
        }
        
        // Default tenant
        const defaultTenant = {
          id: 'santa-gadea',
          subdomain: 'santagadea',
          nombre: 'Ayuntamiento de Santa Gadea del Cid',
          primary_color: '#1e3a5f'
        };
        
        set({ 
          currentTenant: defaultTenant, 
          subdomain: 'santa-gadea',
          isLoading: false 
        });
        
        return defaultTenant;
      },

      setTenant: (tenant) => set({ currentTenant: tenant, subdomain: tenant.id })
    }),
    {
      name: 'tenant-storage',
      partialize: (state) => ({ subdomain: state.subdomain }),
    }
  )
);

// Data store with API integration
export const useDataStore = create((set, get) => ({
  llamadas: [],
  incidencias: [],
  comunicados: [],
  kpis: null,
  chartData: [],
  isLoading: false,
  error: null,

  // Fetch llamadas
  fetchLlamadas: async () => {
    const { getAuthHeaders } = useAuthStore.getState();
    const { subdomain } = useTenantStore.getState();
    
    set({ isLoading: true });
    try {
      const response = await fetch(`${BACKEND_URL}/api/llamadas`, {
        headers: {
          ...getAuthHeaders(),
          'X-Tenant-ID': subdomain
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        set({ llamadas: data.llamadas, isLoading: false });
        return data.llamadas;
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
    return [];
  },

  // Fetch incidencias
  fetchIncidencias: async () => {
    const { getAuthHeaders } = useAuthStore.getState();
    const { subdomain } = useTenantStore.getState();
    
    set({ isLoading: true });
    try {
      const response = await fetch(`${BACKEND_URL}/api/incidencias`, {
        headers: {
          ...getAuthHeaders(),
          'X-Tenant-ID': subdomain
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        set({ incidencias: data.incidencias, isLoading: false });
        return data.incidencias;
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
    return [];
  },

  // Create incidencia
  createIncidencia: async (incidencia) => {
    const { getAuthHeaders } = useAuthStore.getState();
    const { subdomain } = useTenantStore.getState();
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/incidencias`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
          'X-Tenant-ID': subdomain
        },
        body: JSON.stringify(incidencia)
      });
      
      if (response.ok) {
        const created = await response.json();
        set(state => ({ incidencias: [created, ...state.incidencias] }));
        return created;
      }
    } catch (error) {
      set({ error: error.message });
    }
    return null;
  },

  // Update incidencia
  updateIncidencia: async (id, updates) => {
    const { getAuthHeaders } = useAuthStore.getState();
    const { subdomain } = useTenantStore.getState();
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/incidencias/${id}`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
          'X-Tenant-ID': subdomain
        },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        const updated = await response.json();
        set(state => ({
          incidencias: state.incidencias.map(i => i.id === id ? updated : i)
        }));
        return updated;
      }
    } catch (error) {
      set({ error: error.message });
    }
    return null;
  },

  // Fetch comunicados
  fetchComunicados: async () => {
    const { getAuthHeaders } = useAuthStore.getState();
    const { subdomain } = useTenantStore.getState();
    
    set({ isLoading: true });
    try {
      const response = await fetch(`${BACKEND_URL}/api/comunicados`, {
        headers: {
          ...getAuthHeaders(),
          'X-Tenant-ID': subdomain
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        set({ comunicados: data.comunicados, isLoading: false });
        return data.comunicados;
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
    return [];
  },

  // Create comunicado
  createComunicado: async (comunicado) => {
    const { getAuthHeaders } = useAuthStore.getState();
    const { subdomain } = useTenantStore.getState();
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/comunicados`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
          'X-Tenant-ID': subdomain
        },
        body: JSON.stringify(comunicado)
      });
      
      if (response.ok) {
        const created = await response.json();
        set(state => ({ comunicados: [created, ...state.comunicados] }));
        return created;
      }
    } catch (error) {
      set({ error: error.message });
    }
    return null;
  },

  // Send comunicado
  sendComunicado: async (id) => {
    const { getAuthHeaders } = useAuthStore.getState();
    const { subdomain } = useTenantStore.getState();
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/comunicados/${id}/send`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'X-Tenant-ID': subdomain
        }
      });
      
      if (response.ok) {
        const updated = await response.json();
        set(state => ({
          comunicados: state.comunicados.map(c => c.id === id ? updated : c)
        }));
        return updated;
      }
    } catch (error) {
      set({ error: error.message });
    }
    return null;
  },

  // Fetch KPIs
  fetchKPIs: async () => {
    const { getAuthHeaders } = useAuthStore.getState();
    const { subdomain } = useTenantStore.getState();
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/kpis`, {
        headers: {
          ...getAuthHeaders(),
          'X-Tenant-ID': subdomain
        }
      });
      
      if (response.ok) {
        const kpis = await response.json();
        set({ kpis });
        return kpis;
      }
    } catch (error) {
      set({ error: error.message });
    }
    return null;
  },

  // Fetch chart data
  fetchChartData: async () => {
    const { getAuthHeaders } = useAuthStore.getState();
    const { subdomain } = useTenantStore.getState();
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/llamadas/chart`, {
        headers: {
          ...getAuthHeaders(),
          'X-Tenant-ID': subdomain
        }
      });
      
      if (response.ok) {
        const chartData = await response.json();
        set({ chartData });
        return chartData;
      }
    } catch (error) {
      set({ error: error.message });
    }
    return [];
  },

  // Clear data on logout
  clearData: () => set({
    llamadas: [],
    incidencias: [],
    comunicados: [],
    kpis: null,
    chartData: [],
    error: null
  })
}));
