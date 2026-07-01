// src/store/authStore.ts (VERSÃO 4.0 - TIPOS CENTRALIZADOS EM types/user.ts)
// Última atualização: 16/05/2026
// Mudanças:
// - Tipos User e UserRole agora importados de src/types/user.ts (única fonte de verdade)
// - hasPermission e hasAnyPermission mais claros e seguros
// - Comentários completos em português

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, UserRole } from "@/types/user";
import { useEmpresaStore } from "./empresaStore";

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

      login: async (identifier: string, pin: string) => {
        await new Promise((r) => setTimeout(r, 600));

        // Tentar login com mock users (colaboradores)
        const foundUser = mockUsers[identifier];
        if (foundUser && pin === "123") {
          set({ user: foundUser, isLoading: false });
          return true;
        }

        // Tentar login com empresas cadastradas
        const empresaStore = useEmpresaStore.getState();
        let empresa = empresaStore.getEmpresaPorEmail(identifier);
        
        if (!empresa) {
          empresa = empresaStore.getEmpresaPorCNPJ(identifier);
        }
        
        if (!empresa) {
          empresa = empresaStore.getEmpresaPorNomeAcesso(identifier);
        }

        if (empresa) {
          // Criar usuário admin para a empresa
          const adminUser: User = {
            id: empresa.id,
            name: empresa.nome,
            email: empresa.email,
            role: "admin",
          };
          set({ user: adminUser, isLoading: false });
          empresaStore.setEmpresaAtual(empresa);
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