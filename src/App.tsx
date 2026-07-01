// src/App.tsx (VERSÃO ATUALIZADA - COM FORNECEDORES)
// Última atualização: 27/04/2026
// Mudanças:
// - Adicionada rota /fornecedores protegida (admin + gerente)
// - Mantida a página principal (Index) para admin
// - Rotas organizadas e protegidas por role

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/store/ProtectedRoute";
import ThemeProvider from "@/components/ThemeProvider";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Index from "@/pages/Index";           // Dashboard principal
import Caixa from "@/pages/Caixa";
import Estoque from "@/pages/Estoque";
import CustomerDisplay from "@/components/CustomerDisplay";
import Colaboradores from "@/pages/Colaboradores";
import Fornecedores from "@/pages/Fornecedores";   // ← Adicionado
import Ponto from "@/pages/Ponto";                   // ← Adicionado
import PontoGerencial from "@/pages/PontoGerencial"; // ← Adicionado
import PontoConfiguracoes from "@/pages/PontoConfiguracoes"; // ← Adicionado
import PontoAjustes from "@/pages/PontoAjustes"; // ← Adicionado
import PontoProdutividade from "@/pages/PontoProdutividade"; // ← Adicionado
import PontoEscalas from "@/pages/PontoEscalas"; // ← Adicionado
import PontoJustificativas from "@/pages/PontoJustificativas"; // ← Adicionado
import RelatorioFolhaPagamento from "@/pages/RelatorioFolhaPagamento"; // ← Adicionado
import Relatorios from "@/pages/Relatorios"; // ← Adicionado
import Settings from "@/pages/Settings"; // ← Adicionado
import Fila from "@/pages/Fila"; // ← Adicionado
import Clientes from "@/pages/Clientes"; // ← Adicionado

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Rota pública */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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

        {/* Bater Ponto - Adicionado agora */}
        <Route 
          path="/ponto" 
          element={
            <ProtectedRoute allowedRoles={['gerente', 'caixa', 'estoque']}>
              <Ponto />
            </ProtectedRoute>
          } 
        />

        {/* Dashboard Gerencial de Ponto - Adicionado agora */}
        <Route 
          path="/ponto-gerencial" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'gerente']}>
              <PontoGerencial />
            </ProtectedRoute>
          } 
        />

        {/* Configurações de Ponto - Adicionado agora */}
        <Route 
          path="/ponto-configuracoes" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PontoConfiguracoes />
            </ProtectedRoute>
          } 
        />

        {/* Ajustes de Ponto - Adicionado agora */}
        <Route 
          path="/ponto-ajustes" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'gerente']}>
              <PontoAjustes />
            </ProtectedRoute>
          } 
        />

        {/* Produtividade de Ponto - Adicionado agora */}
        <Route 
          path="/ponto-produtividade" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'gerente']}>
              <PontoProdutividade />
            </ProtectedRoute>
          } 
        />

        {/* Escalas de Ponto - Adicionado agora */}
        <Route 
          path="/ponto-escalas" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'gerente']}>
              <PontoEscalas />
            </ProtectedRoute>
          } 
        />

        {/* Justificativas de Ponto - Adicionado agora */}
        <Route 
          path="/ponto-justificativas" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'gerente']}>
              <PontoJustificativas />
            </ProtectedRoute>
          } 
        />

        {/* Relatório de Folha de Pagamento - Adicionado agora */}
        <Route 
          path="/relatorio-folha-pagamento" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'gerente']}>
              <RelatorioFolhaPagamento />
            </ProtectedRoute>
          } 
        />

        {/* Relatórios Gerais - Adicionado agora */}
        <Route 
          path="/relatorios" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'gerente', 'relatorios']}>
              <Relatorios />
            </ProtectedRoute>
          } 
        />

        {/* Configurações do Sistema - Adicionado agora */}
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Settings />
            </ProtectedRoute>
          } 
        />

        {/* Fila de Clientes - Adicionado agora */}
        <Route 
          path="/fila" 
          element={
            <ProtectedRoute>
              <Fila />
            </ProtectedRoute>
          } 
        />

        {/* Gestão de Clientes - Adicionado agora */}
        <Route 
          path="/clientes" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'gerente', 'caixa']}>
              <Clientes />
            </ProtectedRoute>
          } 
        />

        {/* Rota padrão - Qualquer coisa inválida vai para login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
    </ThemeProvider>
  );
}

export default App;