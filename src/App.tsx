import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// RH Module - Colaboradores
import Colaboradores from "./pages/rh/Colaboradores";
import NovoColaborador from "./pages/rh/NovoColaborador";
import EditarColaborador from "./pages/rh/EditarColaborador";
import PerfilColaborador from "./pages/rh/PerfilColaborador";

// RH Module - Férias
import Ferias from "./pages/rh/Ferias";
import SolicitarFerias from "./pages/rh/SolicitarFerias";
import DetalhesFerias from "./pages/rh/DetalhesFerias";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Placeholder routes for future modules */}
            <Route
              path="/rh/colaboradores"
              element={
                <ProtectedRoute>
                  <Colaboradores />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rh/colaboradores/novo"
              element={
                <ProtectedRoute>
                  <NovoColaborador />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rh/colaboradores/:id"
              element={
                <ProtectedRoute>
                  <PerfilColaborador />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rh/colaboradores/:id/editar"
              element={
                <ProtectedRoute>
                  <EditarColaborador />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rh/ferias"
              element={
                <ProtectedRoute>
                  <Ferias />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rh/ferias/solicitar"
              element={
                <ProtectedRoute>
                  <SolicitarFerias />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rh/ferias/:id"
              element={
                <ProtectedRoute>
                  <DetalhesFerias />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rh/*"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financeiro/*"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/desenvolvimento/*"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/suporte/*"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/comercial/*"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracoes/*"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
