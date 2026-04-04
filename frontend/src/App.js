import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout";
import { Dashboard, Llamadas, Incidencias, Comunicados, Chatbot, Configuracion } from "@/pages";
import { Toaster } from "sonner";

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
