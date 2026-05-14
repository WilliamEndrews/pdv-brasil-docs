// src/App.tsx (VERSÃO ATUALIZADA - COM FORNECEDORES)
// Última atualização: 27/04/2026
// Mudanças:
// - Adicionada rota /fornecedores protegida (admin + gerente)
// - Mantida a página principal (Index) para admin
// - Rotas organizadas e protegidas por role

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/store/ProtectedRoute";

import Login from "@/pages/Login";
import Index from "@/pages/Index";           // Dashboard principal
import Caixa from "@/pages/Caixa";
import Estoque from "@/pages/Estoque";
import CustomerDisplay from "@/components/CustomerDisplay";
import Colaboradores from "@/pages/Colaboradores";
import Fornecedores from "@/pages/Fornecedores";   // ← Adicionado

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={<Login />} />
        {/* Rota PÚBLICA para o Display do Cliente */}
        <Route path="/customer-display" element={<CustomerDisplay />} />

        {/* Página Principal - Dashboard Geral (Admin) */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } 
        />

        {/* Caixa */}
        <Route 
          path="/caixa" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'gerente', 'caixa']}>
              <Caixa />
            </ProtectedRoute>
          } 
        />

        {/* Estoque */}
        <Route 
          path="/estoque" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'gerente', 'estoque']}>
              <Estoque />
            </ProtectedRoute>
          } 
        />

        {/* Colaboradores */}
        <Route 
          path="/colaboradores" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'gerente']}>
              <Colaboradores />
            </ProtectedRoute>
          } 
        />

        {/* Fornecedores - Adicionado agora */}
        <Route 
          path="/fornecedores" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'gerente']}>
              <Fornecedores />
            </ProtectedRoute>
          } 
        />
<Route 
  path="/customer-display" 
  element={
    <ProtectedRoute>
      <CustomerDisplay />
    </ProtectedRoute>
  } 
/>
        {/* Rota padrão - Qualquer coisa inválida vai para login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;