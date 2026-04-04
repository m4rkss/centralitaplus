import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useEffect } from 'react';
import { useTenantStore, useDataStore } from '@/stores/useTenantStore';

export function Layout() {
  const { initTenant, subdomain } = useTenantStore();
  const { initData } = useDataStore();

  useEffect(() => {
    initTenant();
    initData(subdomain);
  }, [initTenant, initData, subdomain]);

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      
      {/* Main content area - adjusts for sidebar */}
      <div className="pl-64 transition-all duration-300">
        <Header />
        
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
