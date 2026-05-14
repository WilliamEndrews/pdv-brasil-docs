// src/store/fornecedorStore.ts

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj?: string;
  contato?: string;
}

interface FornecedorState {
  fornecedores: Fornecedor[];
  acoes: {
    adicionarFornecedor: (data: Omit<Fornecedor, 'id'>) => void;
  };
}

export const useFornecedorStore = create<FornecedorState>((set) => ({
  fornecedores: [
    { id: 'forn-1', nome: 'Distribuidora de Bebidas Central', cnpj: '11.222.333/0001-44' },
    { id: 'forn-2', nome: 'Doces & Cia Atacadista', cnpj: '44.555.666/0001-77' },
  ],
  acoes: {
    adicionarFornecedor: (data) => set((state) => ({
      fornecedores: [...state.fornecedores, { ...data, id: `forn-${uuidv4()}` }],
    })),
  },
}));
