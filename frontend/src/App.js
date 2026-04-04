import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth";
import { ChatDock } from "@/components/chatbot";
import { Toaster } from "sonner";
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load pages
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Llamadas = lazy(() => import("@/pages/Llamadas"));
const Incidencias = lazy(() => import("@/pages/Incidencias"));
const Comunicados = lazy(() => import("@/pages/Comunicados"));
const Chatbot = lazy(() => import("@/pages/Chatbot"));
const Configuracion = lazy(() => import("@/pages/Configuracion"));

// Loading component
function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );
}

// ChatDock wrapper - hide on login and chatbot pages
function ChatDockWrapper() {
  const location = useLocation();
  if (location.pathname === '/login' || location.pathname === '/chatbot') return null;
  return <ChatDock />;
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="llamadas" element={<Llamadas />} />
              <Route path="incidencias" element={<Incidencias />} />
              <Route path="comunicados" element={<Comunicados />} />
              <Route path="chatbot" element={<Chatbot />} />
              <Route path="configuracion" element={<Configuracion />} />
            </Route>
            
            {/* Catch all - redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          
          {/* Global Chat Dock */}
          <ChatDockWrapper />
        </Suspense>
      </BrowserRouter>
      <Toaster 
        position="top-right" 
        theme="dark"
        toastOptions={{
          style: {
            background: '#1e293b',
            border: '1px solid #334155',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}

export default App;
