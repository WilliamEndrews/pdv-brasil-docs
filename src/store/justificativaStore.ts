// src/store/justificativaStore.ts
// Sistema de Justificativas - PDV Brasil
// Fluxo de aprovação de justificativas para atrasos/saídas antecipadas
// Versão: 1.0

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TipoJustificativa = 'atraso' | 'saida_antecipada' | 'falta' | 'outro';

export interface Justificativa {
  id: string;
  colaboradorId: string;
  colaboradorNome: string;
  tipo: TipoJustificativa;
  data: string;
  motivo: string;
  evidencia?: string; // URL ou descrição de evidência
  status: 'pendente' | 'aprovado' | 'rejeitado';
  solicitadoEm: string;
  solicitadoPor?: string;
  aprovadoPor?: string;
  aprovadoEm?: string;
  rejeitadoPor?: string;
  rejeitadoEm?: string;
  comentarioAprovacao?: string;
  comentarioRejeicao?: string;
}

interface JustificativaState {
  justificativas: Justificativa[];
  solicitarJustificativa: (justificativa: Omit<Justificativa, 'id' | 'status' | 'solicitadoEm'>) => void;
  aprovarJustificativa: (id: string, aprovadorId: string, comentario?: string) => void;
  rejeitarJustificativa: (id: string, rejeitadorId: string, comentario?: string) => void;
  getJustificativasPorColaborador: (colaboradorId: string) => Justificativa[];
  getJustificativasPorStatus: (status: Justificativa['status']) => Justificativa[];
  getJustificativasPendentes: () => Justificativa[];
}

export const useJustificativaStore = create<JustificativaState>()(
  persist(
    (set, get) => ({
      justificativas: [],

      solicitarJustificativa: (justificativa) => set((state) => ({
        justificativas: [
          ...state.justificativas,
          {
            ...justificativa,
            id: `just-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: 'pendente',
            solicitadoEm: new Date().toISOString(),
          },
        ],
      })),

      aprovarJustificativa: (id, aprovadorId, comentario) => set((state) => ({
        justificativas: state.justificativas.map((j) =>
          j.id === id
            ? {
                ...j,
                status: 'aprovado',
                aprovadoPor: aprovadorId,
                aprovadoEm: new Date().toISOString(),
                comentarioAprovacao: comentario,
              }
            : j
        ),
      })),

      rejeitarJustificativa: (id, rejeitadorId, comentario) => set((state) => ({
        justificativas: state.justificativas.map((j) =>
          j.id === id
            ? {
                ...j,
                status: 'rejeitado',
                rejeitadoPor: rejeitadorId,
                rejeitadoEm: new Date().toISOString(),
                comentarioRejeicao: comentario,
              }
            : j
        ),
      })),

      getJustificativasPorColaborador: (colaboradorId) => {
        return get().justificativas.filter((j) => j.colaboradorId === colaboradorId);
      },

      getJustificativasPorStatus: (status) => {
        return get().justificativas.filter((j) => j.status === status);
      },

      getJustificativasPendentes: () => {
        return get().justificativas.filter((j) => j.status === 'pendente');
      },
    }),
    {
      name: "pdv-justificativas",
    }
  )
);
