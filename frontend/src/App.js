import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Layout } from "@/components/layout";
import { Dashboard, Llamadas, Incidencias, Comunicados, Chatbot, Configuracion } from "@/pages";
import { ChatDock } from "@/components/chatbot";
import { Toaster } from "sonner";

// Wrapper to conditionally show ChatDock
function ChatDockWrapper() {
  const location = useLocation();
  // Hide ChatDock on the chatbot page to avoid overlap
  if (location.pathname === '/chatbot') return null;
  return <ChatDock />;
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="llamadas" element={<Llamadas />} />
            <Route path="incidencias" element={<Incidencias />} />
            <Route path="comunicados" element={<Comunicados />} />
            <Route path="chatbot" element={<Chatbot />} />
            <Route path="configuracion" element={<Configuracion />} />
          </Route>
        </Routes>
        
        {/* Global Chat Dock - hidden on chatbot page */}
        <ChatDockWrapper />
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
