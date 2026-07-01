// src/store/bonusStore.ts
// Sistema de Bônus - PDV Brasil
// Integrado com sistema de ponto para cálculo automático de bônus mensal
// Versão: 1.0

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Bonus {
  id: string;
  colaboradorId: string;
  colaboradorNome: string;
  mes: number;
  ano: number;
  horasExtras: number;
  valorHoraExtra: number; // Valor por hora extra
  valorBonus: number;
  status: 'pendente' | 'aprovado' | 'pago';
  aprovadoPor?: string;
  aprovadoEm?: string;
  pagoEm?: string;
}

interface BonusState {
  bonuses: Bonus[];
  valorHoraExtraPadrao: number; // Valor padrão por hora extra
  configuracaoBonus: {
    multiplicadorHoraExtra: number; // Multiplicador para horas extras (ex: 1.5x)
  };
  calcularBonusMensal: (colaboradorId: string, colaboradorNome: string, horasExtras: number, mes: number, ano: number) => void;
  aprovarBonus: (id: string, aprovadorId: string) => void;
  marcarComoPago: (id: string) => void;
  getBonusPorColaborador: (colaboradorId: string) => Bonus[];
  getBonusPorPeriodo: (mes: number, ano: number) => Bonus[];
  atualizarConfiguracao: (config: Partial<BonusState['configuracaoBonus']>) => void;
  setValorHoraExtraPadrao: (valor: number) => void;
}

export const useBonusStore = create<BonusState>()(
  persist(
    (set, get) => ({
      bonuses: [],
      valorHoraExtraPadrao: 15.00, // R$ 15,00 por hora extra padrão
      configuracaoBonus: {
        multiplicadorHoraExtra: 1.5,
        bonusAssiduidao: 100.00,
        bonusPontualidade: 50.00,
      },

      calcularBonusMensal: (colaboradorId, colaboradorNome, horasExtras, mes, ano) => {
        const { valorHoraExtraPadrao, configuracaoBonus } = get();
        
        // Calcular valor do bônus
        const valorBonus = horasExtras * valorHoraExtraPadrao * configuracaoBonus.multiplicadorHoraExtra;
        
        // Verificar se já existe bônus para este colaborador no período
        const bonusExistente = get().bonuses.find(
          b => b.colaboradorId === colaboradorId && b.mes === mes && b.ano === ano
        );

        if (bonusExistente) {
          // Atualizar bônus existente
          set((state) => ({
            bonuses: state.bonuses.map((b) =>
              b.id === bonusExistente.id
                ? { ...b, horasExtras, valorBonus }
                : b
            ),
          }));
        } else {
          // Criar novo bônus
          const novoBonus: Bonus = {
            id: `bonus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            colaboradorId,
            colaboradorNome,
            mes,
            ano,
            horasExtras,
            valorHoraExtra: valorHoraExtraPadrao,
            valorBonus,
            status: 'pendente',
          };
          
          set((state) => ({
            bonuses: [...state.bonuses, novoBonus],
          }));
        }
      },

      aprovarBonus: (id, aprovadorId) => set((state) => ({
        bonuses: state.bonuses.map((b) =>
          b.id === id
            ? { 
                ...b, 
                status: 'aprovado' as const,
                aprovadoPor: aprovadorId,
                aprovadoEm: new Date().toISOString(),
              }
            : b
        ),
      })),

      marcarComoPago: (id) => set((state) => ({
        bonuses: state.bonuses.map((b) =>
          b.id === id
            ? { ...b, status: 'pago' as const, pagoEm: new Date().toISOString() }
            : b
        ),
      })),

      getBonusPorColaborador: (colaboradorId) => {
        return get().bonuses.filter((b) => b.colaboradorId === colaboradorId);
      },

      getBonusPorPeriodo: (mes, ano) => {
        return get().bonuses.filter((b) => b.mes === mes && b.ano === ano);
      },

      atualizarConfiguracao: (config) => set((state) => ({
        configuracaoBonus: { ...state.configuracaoBonus, ...config },
      })),

      setValorHoraExtraPadrao: (valor) => set({
        valorHoraExtraPadrao: valor,
      }),
    }),
    {
      name: "pdv-bonus",
    }
  )
);
