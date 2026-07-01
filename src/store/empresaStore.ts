// src/store/empresaStore.ts
// Store de Cadastro de Empresas - PDV Brasil
// Gerenciamento de cadastro de empresas e integração com configurações
// @version 1.0

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Empresa {
  id: string;
  nome: string;
  email: string;
  cnpj?: string;
  nomeAcesso?: string; // Nome alternativo para login
  telefone?: string;
  endereco?: string;
  dataCadastro: string;
  ativa: boolean;
}

interface EmpresaState {
  empresa: Empresa | null;
  empresas: Empresa[];
  cadastrarEmpresa: (empresa: Omit<Empresa, 'id' | 'dataCadastro'>) => void;
  atualizarEmpresa: (id: string, dados: Partial<Empresa>) => void;
  getEmpresaPorEmail: (email: string) => Empresa | null;
  getEmpresaPorCNPJ: (cnpj: string) => Empresa | null;
  getEmpresaPorNomeAcesso: (nome: string) => Empresa | null;
  setEmpresaAtual: (empresa: Empresa) => void;
  limparEmpresaAtual: () => void;
}

export const useEmpresaStore = create<EmpresaState>()(
  persist(
    (set, get) => ({
      empresa: null,
      empresas: [],

      cadastrarEmpresa: (dados) => {
        const novaEmpresa: Empresa = {
          ...dados,
          id: Date.now().toString(),
          dataCadastro: new Date().toISOString(),
        };

        // Verificar se email já existe
        const emailExiste = get().empresas.find(e => e.email === dados.email);
        if (emailExiste) {
          throw new Error('Email já cadastrado');
        }

        // Verificar se CNPJ já existe
        if (dados.cnpj) {
          const cnpjExiste = get().empresas.find(e => e.cnpj === dados.cnpj);
          if (cnpjExiste) {
            throw new Error('CNPJ já cadastrado');
          }
        }

        // Verificar se nome de acesso já existe
        if (dados.nomeAcesso) {
          const nomeExiste = get().empresas.find(e => e.nomeAcesso === dados.nomeAcesso);
          if (nomeExiste) {
            throw new Error('Nome de acesso já cadastrado');
          }
        }

        set((state) => ({
          empresas: [...state.empresas, novaEmpresa],
          empresa: novaEmpresa,
        }));
      },

      atualizarEmpresa: (id, dados) => {
        set((state) => ({
          empresas: state.empresas.map((e) =>
            e.id === id ? { ...e, ...dados } : e
          ),
          empresa: state.empresa?.id === id ? { ...state.empresa, ...dados } : state.empresa,
        }));
      },

      getEmpresaPorEmail: (email) => {
        return get().empresas.find((e) => e.email === email) || null;
      },

      getEmpresaPorCNPJ: (cnpj) => {
        return get().empresas.find((e) => e.cnpj === cnpj) || null;
      },

      getEmpresaPorNomeAcesso: (nome) => {
        return get().empresas.find((e) => e.nomeAcesso === nome) || null;
      },

      setEmpresaAtual: (empresa) => {
        set({ empresa });
      },

      limparEmpresaAtual: () => {
        set({ empresa: null });
      },
    }),
    {
      name: "pdv-empresas",
    }
  )
);

// Hook React para usar o store
export function useEmpresa() {
  return useEmpresaStore((state) => ({
    empresa: state.empresa,
    empresas: state.empresas,
    cadastrarEmpresa: state.cadastrarEmpresa,
    atualizarEmpresa: state.atualizarEmpresa,
    getEmpresaPorEmail: state.getEmpresaPorEmail,
    getEmpresaPorCNPJ: state.getEmpresaPorCNPJ,
    getEmpresaPorNomeAcesso: state.getEmpresaPorNomeAcesso,
    setEmpresaAtual: state.setEmpresaAtual,
    limparEmpresaAtual: state.limparEmpresaAtual,
  }));
}
