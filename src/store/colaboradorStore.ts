// src/store/colaboradorStore.ts
// Store Compartilhado de Colaboradores - PDV Brasil
// Integração entre módulo de colaboradores e sistema de ponto
// Versão: 1.0

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserRole } from "@/types/user";

export interface Colaborador {
  id: string;
  nome: string;
  email: string;
  pin: string;
  role: UserRole;
  dataAdmissao: string;
  status: 'ativo' | 'inativo';
  ultimoIP?: string;
  ultimoAcesso?: string;
  // Campos específicos do sistema de ponto
  turnoInicio?: string; // Ex: "08:00"
  turnoFim?: string; // Ex: "17:00"
  foto?: string; // Foto base64 para reconhecimento facial
  cargo?: string; // Cargo descritivo (ex: "Caixa Sênior")
  pontosAcumulados?: number; // Pontuação para promoções
  nivelGamificacao?: number; // Nível no sistema de gamificação
  badges?: string[]; // Badges conquistados
}

interface ColaboradorState {
  colaboradores: Colaborador[];
  addColaborador: (colaborador: Omit<Colaborador, 'id'>) => void;
  updateColaborador: (id: string, colaborador: Partial<Colaborador>) => void;
  deleteColaborador: (id: string) => void;
  toggleStatus: (id: string) => void;
  getColaboradorById: (id: string) => Colaborador | undefined;
  getColaboradoresAtivos: () => Colaborador[];
  adicionarPontos: (id: string, pontos: number) => void;
  adicionarBadge: (id: string, badge: string) => void;
}

const mockColaboradores: Colaborador[] = [
  { 
    id: "1", 
    nome: "Guilherme Endrews", 
    email: "admin@pdv.com", 
    pin: "123", 
    role: "admin", 
    dataAdmissao: "2025-01-10", 
    status: "ativo", 
    ultimoIP: "179.190.XXX.XXX",
    cargo: "Administrador Geral",
    turnoInicio: "08:00",
    turnoFim: "17:00",
    pontosAcumulados: 0,
    nivelGamificacao: 1,
    badges: []
  },
  { 
    id: "2", 
    nome: "Maria Silva", 
    email: "gerente@pdv.com", 
    pin: "456", 
    role: "gerente", 
    dataAdmissao: "2025-02-05", 
    status: "ativo",
    cargo: "Gerente de Loja",
    turnoInicio: "08:00",
    turnoFim: "17:00",
    pontosAcumulados: 150,
    nivelGamificacao: 2,
    badges: ["Mês Perfeito"]
  },
  { 
    id: "3", 
    nome: "João Santos", 
    email: "caixa@pdv.com", 
    pin: "789", 
    role: "caixa", 
    dataAdmissao: "2025-03-15", 
    status: "ativo",
    cargo: "Caixa Sênior",
    turnoInicio: "08:00",
    turnoFim: "17:00",
    pontosAcumulados: 320,
    nivelGamificacao: 3,
    badges: ["Mês Perfeito", "Rei das Horas Extras"]
  },
  { 
    id: "4", 
    nome: "Ana Costa", 
    email: "estoque@pdv.com", 
    pin: "012", 
    role: "estoque", 
    dataAdmissao: "2025-04-01", 
    status: "ativo",
    cargo: "Auxiliar de Estoque",
    turnoInicio: "09:00",
    turnoFim: "18:00",
    pontosAcumulados: 85,
    nivelGamificacao: 1,
    badges: []
  },
  { 
    id: "5", 
    nome: "Pedro Oliveira", 
    email: "caixa2@pdv.com", 
    pin: "345", 
    role: "caixa", 
    dataAdmissao: "2025-04-15", 
    status: "ativo",
    cargo: "Caixa Júnior",
    turnoInicio: "13:00",
    turnoFim: "22:00",
    pontosAcumulados: 45,
    nivelGamificacao: 1,
    badges: []
  },
];

export const useColaboradorStore = create<ColaboradorState>()(
  persist(
    (set, get) => ({
      colaboradores: mockColaboradores,

      addColaborador: (colaborador) => set((state) => ({
        colaboradores: [
          ...state.colaboradores,
          {
            ...colaborador,
            id: `col-${Date.now()}`,
            pontosAcumulados: colaborador.pontosAcumulados || 0,
            nivelGamificacao: colaborador.nivelGamificacao || 1,
            badges: colaborador.badges || [],
          }
        ]
      })),

      updateColaborador: (id, colaborador) => set((state) => ({
        colaboradores: state.colaboradores.map((c) =>
          c.id === id ? { ...c, ...colaborador } : c
        )
      })),

      deleteColaborador: (id) => set((state) => ({
        colaboradores: state.colaboradores.filter((c) => c.id !== id)
      })),

      toggleStatus: (id) => set((state) => ({
        colaboradores: state.colaboradores.map((c) =>
          c.id === id ? { ...c, status: c.status === 'ativo' ? 'inativo' : 'ativo' } : c
        )
      })),

      getColaboradorById: (id) => {
        return get().colaboradores.find((c) => c.id === id);
      },

      getColaboradoresAtivos: () => {
        return get().colaboradores.filter((c) => c.status === 'ativo');
      },

      adicionarPontos: (id, pontos) => set((state) => ({
        colaboradores: state.colaboradores.map((c) =>
          c.id === id 
            ? { 
                ...c, 
                pontosAcumulados: (c.pontosAcumulados || 0) + pontos,
                // Atualizar nível baseado em pontos
                nivelGamificacao: Math.floor(((c.pontosAcumulados || 0) + pontos) / 100) + 1
              } 
            : c
        )
      })),

      adicionarBadge: (id, badge) => set((state) => ({
        colaboradores: state.colaboradores.map((c) =>
          c.id === id 
            ? { 
                ...c, 
                badges: [...(c.badges || []), badge].filter((b, i, a) => a.indexOf(b) === i) // Remove duplicatas
              } 
            : c
        )
      })),
    }),
    {
      name: "pdv-colaboradores",
    }
  )
);
