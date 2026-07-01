// src/store/collaboratorsStore.ts
// Store de Gerenciamento de Colaboradores - Completo e Tipado

import { create } from "zustand";
import { User, UserRole } from "@/types/user";
import { generateCollaboratorId } from "@/lib/idGenerator";

interface Collaborator extends User {
  status: "active" | "inactive";
  createdAt: string;
  photo?: string;
}

interface CollaboratorsState {
  collaborators: Collaborator[];
  add: (data: Omit<Collaborator, "id" | "createdAt">) => void;
  update: (id: string, data: Partial<Collaborator>) => void;
  remove: (id: string) => void;
  toggleStatus: (id: string) => void;
}

// Prefixos para geração de IDs por role
const rolePrefix: Record<UserRole, string> = {
  admin: 'ADM',
  gerente: 'GER',
  caixa: 'CAI',
  estoque: 'EST',
  relatorios: 'REL',
  operador: 'OPE',
  visualizador: 'VIS'
};

export const useCollaborators = create<CollaboratorsState>((set) => ({
  collaborators: [
    {
      id: "PDV-ADMIN-000001",
      name: "Guilherme Endrews",
      email: "admin@pdv.com",
      role: "admin",
      photo: "https://i.pravatar.cc/150?img=1",
      status: "active",
      createdAt: "2025-10-01",
    },
    {
      id: "PDV-GER-000001",
      name: "Maria Silva",
      email: "gerente@pdv.com",
      role: "gerente",
      photo: "https://i.pravatar.cc/150?img=2",
      status: "active",
      createdAt: "2025-10-05",
    },
  ],

  add: (data) =>
    set((state) => {
      const id = generateCollaboratorId(data.role);
      const newCollab: Collaborator = {
        ...data,
        id,
        createdAt: new Date().toISOString().split("T")[0],
      };
      return { collaborators: [...state.collaborators, newCollab] };
    }),

  update: (id, data) =>
    set((state) => ({
      collaborators: state.collaborators.map((c) =>
        c.id === id ? { ...c, ...data } : c
      ),
    })),

  remove: (id) =>
    set((state) => ({
      collaborators: state.collaborators.filter((c) => c.id !== id),
    })),

  toggleStatus: (id) =>
    set((state) => ({
      collaborators: state.collaborators.map((c) =>
        c.id === id
          ? { ...c, status: c.status === "active" ? "inactive" : "active" }
          : c
      ),
    })),
}));