// src/store/caixaStore.ts (VERSÃO 6.0 - ABATIMENTO CENTRALIZADO E CORRIGIDO)
// Última atualização: 26/04/2026
// Mudanças principais:
// - Abatimento de estoque agora acontece APENAS neste arquivo (finalizarVenda)
// - Removida a duplicação que causava desconto em dobro no estoque
// - finalizaVenda agora recebe o método de pagamento como parâmetro (mais flexível)
// - finalizarPix foi removido (use finalizarVenda('pix') no lugar)
// - Todos os comentários em português
// - Mantida total compatibilidade com o estoqueStore e tipos existentes

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEstoqueStore, Produto } from "./estoqueStore";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";

export interface Item extends Produto {
  quantidade: number;
}

interface Venda {
  id: string;
  itens: Item[];
  total: number;
  data: string;
  metodoPagamento?: 'dinheiro' | 'cartao' | 'pix' | 'outros';
}

interface CaixaState {
  itens: Item[];
  subtotal: number;
  desconto: number;
  total: number;
  statusCaixa: "livre" | "ocupado" | "fechado";
  ultimoItem: Item | null;
  sugestoes: Produto[];
  historico: Venda[];

  adicionarItem: (item: Produto) => void;
  removerItem: (id: string) => void;
  atualizarQuantidade: (id: string, qtd: number) => void;
  aplicarDesconto: (valor: number) => void;
  finalizarVenda: (metodoPagamento?: 'dinheiro' | 'cartao' | 'pix' | 'outros') => void;
  limparCarrinho: () => void;
  toggleStatusCaixa: () => void;
  buscarProduto: (termo: string) => void;
}

export const useCaixaStore = create<CaixaState>()(
  persist(
    (set, get) => ({
      itens: [],
      subtotal: 0,
      desconto: 0,
      total: 0,
      statusCaixa: "livre",
      ultimoItem: null,
      sugestoes: [],
      historico: [],

      // Adiciona item ao carrinho (ou incrementa quantidade se já existir)
      adicionarItem: (produto) => set((state) => {
        const itemExistente = state.itens.find(i => i.id === produto.id);
        if (itemExistente) {
          return {
            itens: state.itens.map(i =>
              i.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i
            ),
            subtotal: state.subtotal + produto.precoVenda,
            total: state.subtotal + produto.precoVenda - state.desconto,
            ultimoItem: { ...produto, quantidade: itemExistente.quantidade + 1 }
          };
        } else {
          const novoItem = { ...produto, quantidade: 1 };
          return {
            itens: [...state.itens, novoItem],
            subtotal: state.subtotal + produto.precoVenda,
            total: state.subtotal + produto.precoVenda - state.desconto,
            ultimoItem: novoItem
          };
        }
      }),

      // Remove um item completamente do carrinho
      removerItem: (id) => set((state) => {
        const item = state.itens.find(i => i.id === id);
        if (!item) return state;
        return {
          itens: state.itens.filter(i => i.id !== id),
          subtotal: state.subtotal - (item.precoVenda * item.quantidade),
          total: state.subtotal - (item.precoVenda * item.quantidade) - state.desconto,
          ultimoItem: null
        };
      }),

      // Atualiza a quantidade de um item específico
      atualizarQuantidade: (id, qtd) => set((state) => {
        const item = state.itens.find(i => i.id === id);
        if (!item) return state;
        const diferenca = (qtd - item.quantidade) * item.precoVenda;
        return {
          itens: state.itens.map(i => i.id === id ? { ...i, quantidade: qtd } : i),
          subtotal: state.subtotal + diferenca,
          total: state.subtotal + diferenca - state.desconto,
          ultimoItem: qtd > 0 ? { ...item, quantidade: qtd } : null
        };
      }),

      // Aplica desconto no total da venda
      aplicarDesconto: (valor) => set((state) => ({
        desconto: valor,
        total: state.subtotal - valor
      })),

      // FINALIZAR VENDA - ABATIMENTO DE ESTOQUE ACONTECE APENAS AQUI
      finalizarVenda: (metodoPagamento: 'dinheiro' | 'cartao' | 'pix' | 'outros' = 'dinheiro') => {
        const { itens, total } = get();
        if (itens.length === 0) return;
        // Limpa sugestões após finalizar venda
        set({ sugestoes: [] });

        // Abate o estoque APENAS UMA VEZ (evita duplicação)
        const itensParaAbater = itens.map(item => ({
          produtoId: item.id,
          quantidade: item.quantidade
        }));

        useEstoqueStore.getState().abaterEstoqueVenda(itensParaAbater);

        // Registra a venda no histórico
        const novaVenda: Venda = {
          id: uuidv4(),
          itens,
          total,
          data: new Date().toISOString(),
          metodoPagamento
        };

        set((state) => ({
          historico: [novaVenda, ...state.historico],
          itens: [],
          subtotal: 0,
          desconto: 0,
          total: 0,
          statusCaixa: "livre",
          ultimoItem: null
        }));

        toast.success(`Venda finalizada com sucesso! (Método: ${metodoPagamento})`);
      },

      // Limpa todo o carrinho
      limparCarrinho: () => set({
        itens: [],
        subtotal: 0,
        desconto: 0,
        total: 0,
        statusCaixa: "livre",
        ultimoItem: null
      }),

      // Alterna o status do caixa (livre/fechado)
      toggleStatusCaixa: () => set((state) => ({
        statusCaixa: state.statusCaixa === "livre" ? "fechado" : "livre"
      })),

      // Busca produtos para sugestão enquanto digita
      buscarProduto: (termo) => {
        const produtosDoEstoque = useEstoqueStore.getState().produtos;
        const sugestoesFiltradas = produtosDoEstoque.filter(p =>
          p.nome.toLowerCase().includes(termo.toLowerCase()) ||
          p.codigoBarras?.includes(termo)
        );
        set({ sugestoes: sugestoesFiltradas.slice(0, 5) });
      }
    }),
    { name: "pdv-caixa" }
  )
);