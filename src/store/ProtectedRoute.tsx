// src/components/ProtectedRoute.tsx ou src/store/ProtectedRoute.tsx
// VERSÃO FINAL - COM DEBUG E ADMIN SEMPRE COM ACESSO TOTAL
// Última atualização: 27/04/2026

import { useAuth, UserRole } from "@/store/authStore";
import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Debug temporário - remova depois que funcionar
  console.log("Usuário logado:", user.name, "Role:", user.role);

  // Se a rota tem restrição de roles
  if (allowedRoles && !hasPermission(allowedRoles)) {
    console.log(`Acesso negado. Role do usuário (${user.role}) não está em:`, allowedRoles);
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};