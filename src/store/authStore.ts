// src/store/authStore.ts (VERSÃO 3.2 - TIPOS CENTRALIZADOS)
// Última atualização: 27/04/2026
// Mudanças:
// - Tipos User e UserRole centralizados aqui (única fonte de verdade)
// - Removida dependência de src/types/user.ts
// - hasPermission e hasAnyPermission mais claros e seguros
// - Comentários completos em português

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ==================== TIPOS DE USUÁRIO E ROLES (ÚNICA FONTE) ====================
export type UserRole = 
  | 'admin'        // Acesso total ao sistema
  | 'gerente'      // Gerencia estoque, fornecedores, relatórios e equipe
  | 'caixa'        // Apenas tela de Caixa e finalização de vendas
  | 'estoque'      // Gestão completa de estoque, lotes e transferências
  | 'relatorios'   // Apenas visualização de relatórios e métricas
  | 'visualizador';// Acesso somente leitura (dashboards)

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  // photo?: string;   // pode ser adicionado futuramente
}

// ==========================================================================
// INTERFACE DO ESTADO
// ==========================================================================
interface AuthState {
  user: User | null;
  rememberDevice: boolean;
  isLoading: boolean;

  login: (email: string, pin: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
  hasAnyPermission: (requiredRoles: UserRole[]) => boolean;
  setRememberDevice: (value: boolean) => void;
}

const mockUsers: Record<string, User> = {
  "admin@pdv.com":    { id: "1", name: "Administrador",     email: "admin@pdv.com",    role: "admin" },
  "gerente@pdv.com":  { id: "2", name: "Gerente",           email: "gerente@pdv.com",  role: "gerente" },
  "caixa@pdv.com":    { id: "3", name: "Caixa",             email: "caixa@pdv.com",    role: "caixa" },
  "estoque@pdv.com":  { id: "4", name: "Logística",         email: "estoque@pdv.com",  role: "estoque" },
  "relatorios@pdv.com": { id: "5", name: "Relatórios",      email: "relatorios@pdv.com", role: "relatorios" },
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      rememberDevice: false,
      isLoading: true,

      login: async (email: string, pin: string) => {
        await new Promise((r) => setTimeout(r, 600));

        const foundUser = mockUsers[email];
        if (foundUser && pin === "123") {
          set({ user: foundUser, isLoading: false });
          return true;
        }

        set({ isLoading: false });
        return false;
      },

      logout: () => set({ user: null, isLoading: false }),

      hasPermission: (requiredRole: UserRole | UserRole[]) => {
        const user = get().user;
        if (!user) return false;
        if (user.role === 'admin') return true;

        if (Array.isArray(requiredRole)) {
          return requiredRole.includes(user.role);
        }
        return user.role === requiredRole;
      },

      hasAnyPermission: (requiredRoles: UserRole[]) => {
        const user = get().user;
        if (!user) return false;
        if (user.role === 'admin') return true;
        return requiredRoles.includes(user.role);
      },

      setRememberDevice: (value: boolean) => set({ rememberDevice: value }),
    }),
    {
      name: "pdv-auth-storage",
      partialize: (state) => ({
        user: state.rememberDevice ? state.user : null,
        rememberDevice: state.rememberDevice,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.isLoading = false;
      },
    }
  )
);