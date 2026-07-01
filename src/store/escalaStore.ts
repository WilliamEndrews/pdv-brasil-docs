// src/store/escalaStore.ts
// Sistema de Escalas - PDV Brasil
// Gestão de escalas semanais com detecção de conflitos
// Versão: 1.0

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DiaSemana = 'domingo' | 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado';

export interface EscalaItem {
  id: string;
  colaboradorId: string;
  colaboradorNome: string;
  dia: DiaSemana;
  turnoInicio: string;
  turnoFim: string;
  tipo: 'trabalho' | 'folga';
}

export interface Escala {
  id: string;
  semanaInicio: string; // Data de início da semana (ISO string)
  itens: EscalaItem[];
}

interface EscalaState {
  escalas: Escala[];
  conflitos: { mensagem: string; tipo: 'conflito' | 'aviso' }[];
  adicionarEscala: (escala: Omit<Escala, 'id'>) => void;
  atualizarEscala: (id: string, escala: Partial<Escala>) => void;
  removerEscala: (id: string) => void;
  getEscalaPorSemana: (dataInicio: string) => Escala | undefined;
  getEscalaAtual: () => Escala | undefined;
  detectarConflitos: (escala: Escala) => void;
  limparConflitos: () => void;
}

export const useEscalaStore = create<EscalaState>()(
  persist(
    (set, get) => ({
      escalas: [],
      conflitos: [],

      adicionarEscala: (escala) => {
        const novaEscala: Escala = {
          ...escala,
          id: `escala-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        
        // Detectar conflitos
        get().detectarConflitos(novaEscala);
        
        set((state) => ({
          escalas: [...state.escalas, novaEscala],
        }));
      },

      atualizarEscala: (id, escala) => set((state) => {
        const escalasAtualizadas = state.escalas.map((e) =>
          e.id === id ? { ...e, ...escala } : e
        );
        
        // Detectar conflitos na escala atualizada
        const escalaAtualizada = escalasAtualizadas.find((e) => e.id === id);
        if (escalaAtualizada) {
          get().detectarConflitos(escalaAtualizada);
        }
        
        return { escalas: escalasAtualizadas };
      }),

      removerEscala: (id) => set((state) => ({
        escalas: state.escalas.filter((e) => e.id !== id),
      })),

      getEscalaPorSemana: (dataInicio) => {
        return get().escalas.find((e) => e.semanaInicio === dataInicio);
      },

      getEscalaAtual: () => {
        const hoje = new Date();
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay()); // Domingo da semana atual
        inicioSemana.setHours(0, 0, 0, 0);
        
        const dataInicio = inicioSemana.toISOString();
        return get().getEscalaPorSemana(dataInicio);
      },

      detectarConflitos: (escala) => {
        const conflitos: { mensagem: string; tipo: 'conflito' | 'aviso' }[] = [];
        
        // Agrupar itens por dia
        const itensPorDia: Record<string, EscalaItem[]> = {};
        escala.itens.forEach((item) => {
          if (!itensPorDia[item.dia]) {
            itensPorDia[item.dia] = [];
          }
          itensPorDia[item.dia].push(item);
        });

        // Verificar conflitos de horário no mesmo dia
        Object.keys(itensPorDia).forEach((dia) => {
          const itens = itensPorDia[dia];
          const itensTrabalho = itens.filter((i) => i.tipo === 'trabalho');
          
          for (let i = 0; i < itensTrabalho.length; i++) {
            for (let j = i + 1; j < itensTrabalho.length; j++) {
              const item1 = itensTrabalho[i];
              const item2 = itensTrabalho[j];
              
              const inicio1 = parseInt(item1.turnoInicio.replace(':', ''));
              const fim1 = parseInt(item1.turnoFim.replace(':', ''));
              const inicio2 = parseInt(item2.turnoInicio.replace(':', ''));
              const fim2 = parseInt(item2.turnoFim.replace(':', ''));
              
              // Verificar sobreposição de horários
              if (
                inicio1 < fim2 &&
                fim1 > inicio2
              ) {
                conflitos.push({
                  mensagem: `Conflito de horário em ${dia}: ${item1.colaboradorNome} e ${item2.colaboradorNome} têm turnos sobrepostos`,
                  tipo: 'conflito',
                });
              }
            }
          }
        });

        // Verificar colaboradores sem folga na semana
        const colaboradoresComFolga = new Set(
          escala.itens.filter((i) => i.tipo === 'folga').map((i) => i.colaboradorId)
        );
        
        const colaboradoresUnicos = new Set(
          escala.itens.map((i) => i.colaboradorId)
        );
        
        colaboradoresUnicos.forEach((colabId) => {
          if (!colaboradoresComFolga.has(colabId)) {
            const colaborador = escala.itens.find((i) => i.colaboradorId === colabId);
            if (colaborador) {
              conflitos.push({
                mensagem: `Aviso: ${colaborador.colaboradorNome} não tem folga na semana`,
                tipo: 'aviso',
              });
            }
          }
        });

        set({ conflitos });
      },

      limparConflitos: () => set({ conflitos: [] }),
    }),
    {
      name: "pdv-escalas",
    }
  )
);
