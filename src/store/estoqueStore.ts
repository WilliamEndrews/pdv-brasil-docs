// src/store/estoqueStore.ts (VERSÃO 15.11 - TRANSFERÊNCIA ROBUSTA E REATIVA)
// Última atualização: 27/04/2026
// Mudanças principais focadas na transferência:
// - transferirParaLoja agora cria cópias profundas explícitas do produto, lote e inventário (garante reatividade instantânea no ProdutosTab)
// - Validação de quantidade reforçada
// - Registro de movimentação mantido
// - Todas as ações críticas terminam com recriação explícita de arrays (força detecção pela equality function do ProdutosTab)
// - Comentários completos em português

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import * as z from 'zod';

// ==========================================================================
// TIPOS E INTERFACES
// ==========================================================================
export interface Fornecedor { id: string; nome: string; cnpj?: string; contato?: string; }
export interface UnidadeDeMedida { id: string; nome: string; sigla: string; fatorConversao: number; }
export interface InventarioItem { localId: 'loja' | 'deposito'; quantidade: number; }
export interface Lote { 
  id: string; 
  produtoId: string; 
  quantidade: number;
  dataValidade: string; 
  precoCusto: number; 
  dataEntrada: string; 
  numeroLoteFornecedor?: string; 
  inventario: InventarioItem[]; 
  fornecedorId?: string;
  localizacaoInicial?: 'deposito' | 'loja' | 'dividido';
  statusQualidade: 'aprovado' | 'rejeitado' | 'pendente';
  observacoes?: string;
}
export interface Produto { 
  id: string; 
  nome: string; 
  precoVenda: number; 
  estoqueMinimo: number; 
  fornecedorId?: string; 
  codigoBarras?: string; 
  lotes: Lote[]; 
  unidadesDeMedida: UnidadeDeMedida[]; 
  setor?: 'eletronicos' | 'alimentos' | 'moda' | 'outros';  // OPCIONAL para compatibilidade com dados antigos
}
export type TipoMovimentacao = 'venda' | 'entrada_manual' | 'saida_perda' | 'saida_ajuste' | 'entrada_ajuste' | 'importacao' | 'transferencia';
export interface Movimentacao { 
  id: string; 
  produtoId: string; 
  produtoNome: string; 
  tipo: TipoMovimentacao; 
  quantidade: number; 
  data: string; 
  observacao?: string; 
}

// ==========================================================================
// SCHEMAS DE VALIDAÇÃO (ZOD)
// ==========================================================================
export const productFormSchema = z.object({ 
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."), 
  precoVenda: z.coerce.number().positive("O preço deve ser maior que zero."), 
  estoqueMinimo: z.coerce.number().int().nonnegative("O estoque mínimo não pode ser negativo."), 
  fornecedorId: z.string().optional(), 
  codigoBarras: z.string().optional(), 
  setor: z.enum(['eletronicos', 'alimentos', 'moda', 'outros']).default('outros'), 
});
export type NovoProdutoData = z.infer<typeof productFormSchema>;

export const loteFormSchema = z.object({ 
  quantidadeTotal: z.coerce.number().int().positive("Quantidade total deve ser maior que zero."),
  quantidadeDeposito: z.coerce.number().int().nonnegative("Quantidade no depósito não pode ser negativa."),
  quantidadeLoja: z.coerce.number().int().nonnegative("Quantidade na loja não pode ser negativa."),
  precoCusto: z.coerce.number().nonnegative("O custo não pode ser negativo."), 
  dataValidade: z.string().refine((val) => val && !isNaN(Date.parse(val)), { message: "Data inválida." }), 
  dataEntrada: z.string().refine((val) => val && !isNaN(Date.parse(val)), { message: "Data inválida." }), 
  numeroLoteFornecedor: z.string().optional(), 
  fornecedorId: z.string().optional(),
  statusQualidade: z.enum(['aprovado', 'rejeitado', 'pendente']).default('aprovado'),
  observacoes: z.string().optional(),
}).refine((data) => data.quantidadeDeposito + data.quantidadeLoja === data.quantidadeTotal, {
  message: "A soma de Depósito + Loja deve ser igual à quantidade total",
  path: ["quantidadeLoja"],
});
export type NovoLoteData = z.infer<typeof loteFormSchema>;

export const fornecedorFormSchema = z.object({ 
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."), 
  cnpj: z.string().optional(), 
  contato: z.string().optional(), 
});
export type NovoFornecedorData = z.infer<typeof fornecedorFormSchema>;

export const movimentacaoFormSchema = z.object({
  produtoId: z.string().min(1, "Selecione um produto"),
  tipo: z.enum(["entrada_ajuste", "saida_ajuste", "saida_perda"]),
  quantidade: z.number().positive("Quantidade deve ser maior que zero"),
  observacao: z.string().optional(),
});
export type MovimentacaoFormData = z.infer<typeof movimentacaoFormSchema>;

// ==========================================================================
// INTERFACE DO ESTADO
// ==========================================================================
interface EstoqueState {
  produtos: Produto[];
  fornecedores: Fornecedor[];
  movimentacoes: Movimentacao[];

  adicionarNovoProduto: (data: NovoProdutoData) => void;
  adicionarLote: (produtoId: string, data: NovoLoteData) => void;
  adicionarFornecedor: (data: NovoFornecedorData) => void;
  editarFornecedor: (fornecedorId: string, data: NovoFornecedorData) => void;
  excluirFornecedor: (fornecedorId: string) => void;
  transferirParaLoja: (produtoId: string, loteId: string, quantidade: number) => boolean;
  abaterEstoqueVenda: (carrinho: { produtoId: string; quantidade: number }[]) => void;
  registrarMovimentacaoManual: (data: MovimentacaoFormData) => void;
  importarEmMassa: (produtos: Array<{ nome: string; precoVenda: number; estoqueMinimo: number }>) => void;
  getEstoquePorLocal: (produtoId: string, local: 'deposito' | 'loja') => number;

  editarProduto: (produtoId: string, produtoAtualizado: Partial<Produto>) => void;
  excluirProduto: (produtoId: string) => void;
  excluirLote: (produtoId: string, loteId: string) => void;

  getRelatorioEstoque: () => { turnover: number; estoquePorSetor: Record<string, number>; };
  getAlertasEstoque: () => { baixoEstoque: Produto[]; expirando: Lote[]; };
}

export const useEstoqueStore = create<EstoqueState>()(
  persist(
    immer((set, get) => ({
      produtos: [],
      fornecedores: [],
      movimentacoes: [],

      adicionarNovoProduto: (data) => {
        set((state) => {
          const novoProduto: Produto = { 
            id: uuidv4(), 
            nome: data.nome, 
            precoVenda: data.precoVenda, 
            estoqueMinimo: data.estoqueMinimo, 
            fornecedorId: data.fornecedorId, 
            codigoBarras: data.codigoBarras, 
            lotes: [], 
            unidadesDeMedida: [{ id: uuidv4(), nome: 'Unidade', sigla: 'UN', fatorConversao: 1 }], 
            setor: data.setor,
          };
          state.produtos = [...state.produtos, novoProduto];
        });
      },

      adicionarLote: (produtoId, data) => {
        set((state) => {
          const produtoIndex = state.produtos.findIndex(p => p.id === produtoId);
          if (produtoIndex === -1) return;

          const produto = { ...state.produtos[produtoIndex] };

          const inventario: InventarioItem[] = [];
          if (data.quantidadeDeposito > 0) inventario.push({ localId: 'deposito', quantidade: data.quantidadeDeposito });
          if (data.quantidadeLoja > 0) inventario.push({ localId: 'loja', quantidade: data.quantidadeLoja });

          const novoLote: Lote = { 
            id: uuidv4(), 
            produtoId, 
            quantidade: data.quantidadeTotal,
            precoCusto: data.precoCusto, 
            dataValidade: data.dataValidade, 
            dataEntrada: data.dataEntrada, 
            numeroLoteFornecedor: data.numeroLoteFornecedor, 
            inventario,
            fornecedorId: data.fornecedorId,
            localizacaoInicial: data.quantidadeDeposito > 0 && data.quantidadeLoja > 0 ? 'dividido' : data.quantidadeDeposito > 0 ? 'deposito' : 'loja',
            statusQualidade: data.statusQualidade,
            observacoes: data.observacoes,
          };

          produto.lotes = [...produto.lotes, novoLote];

          state.produtos = [
            ...state.produtos.slice(0, produtoIndex),
            produto,
            ...state.produtos.slice(produtoIndex + 1)
          ];
        });
      },

      adicionarFornecedor: (data) => {
        set((state) => {
          const novoFornecedor: Fornecedor = { id: uuidv4(), nome: data.nome, cnpj: data.cnpj, contato: data.contato };
          state.fornecedores = [...state.fornecedores, novoFornecedor];
        });
      },

      editarFornecedor: (fornecedorId, data) => {
        set((state) => {
          const index = state.fornecedores.findIndex(f => f.id === fornecedorId);
          if (index !== -1) {
            state.fornecedores[index] = { ...state.fornecedores[index], ...data };
          }
        });
      },

      excluirFornecedor: (fornecedorId) => {
        set((state) => {
          state.fornecedores = state.fornecedores.filter(f => f.id !== fornecedorId);
        });
      },

      // ====================== TRANSFERIR PARA LOJA - VERSÃO REFORÇADA ======================
      // Cópia profunda + recriação explícita do array para máxima reatividade
      transferirParaLoja: (produtoId: string, loteId: string, quantidade: number): boolean => {
        let sucesso = false;

        set((state) => {
          const produtoIndex = state.produtos.findIndex(p => p.id === produtoId);
          if (produtoIndex === -1) return;

          // Cópia profunda do produto inteiro (garante que mudanças aninhadas sejam detectadas)
          const produto = JSON.parse(JSON.stringify(state.produtos[produtoIndex])) as Produto;

          const loteIndex = produto.lotes.findIndex(l => l.id === loteId);
          if (loteIndex === -1) return;

          const lote = produto.lotes[loteIndex];

          // Encontra o item no depósito
          const itemDepositoIndex = lote.inventario.findIndex(i => i.localId === 'deposito');
          if (itemDepositoIndex === -1 || lote.inventario[itemDepositoIndex].quantidade < quantidade) {
            return; // quantidade insuficiente no depósito
          }

          // Realiza a transferência
          lote.inventario[itemDepositoIndex].quantidade -= quantidade;

          // Atualiza ou cria item na loja
          const itemLojaIndex = lote.inventario.findIndex(i => i.localId === 'loja');
          if (itemLojaIndex !== -1) {
            lote.inventario[itemLojaIndex].quantidade += quantidade;
          } else {
            lote.inventario.push({ localId: 'loja', quantidade });
          }

          // Atualiza o lote com novo array de inventario
          produto.lotes[loteIndex] = {
            ...lote,
            inventario: [...lote.inventario]
          };

          // Registra a movimentação
          state.movimentacoes.unshift({
            id: uuidv4(),
            produtoId: produto.id,
            produtoNome: produto.nome,
            tipo: 'transferencia',
            quantidade,
            data: new Date().toISOString(),
            observacao: `Transferência do lote ${lote.numeroLoteFornecedor || lote.id.substring(0, 8)} do depósito para a loja`
          });

          // Atualiza o array completo de produtos (força reatividade máxima no ProdutosTab)
          state.produtos = [
            ...state.produtos.slice(0, produtoIndex),
            produto,
            ...state.produtos.slice(produtoIndex + 1)
          ];

          sucesso = true;
        });

        return sucesso;
      },

      abaterEstoqueVenda: (carrinho) => {
        set((state) => {
          carrinho.forEach(itemVenda => {
            const produtoIndex = state.produtos.findIndex(p => p.id === itemVenda.produtoId);
            if (produtoIndex === -1) return;

            const produto = JSON.parse(JSON.stringify(state.produtos[produtoIndex])) as Produto;
            let quantidadeAbater = itemVenda.quantidade;

            const lotesOrdenados = produto.lotes
              .filter(l => (l.inventario.find(i => i.localId === 'loja')?.quantidade || 0) > 0)
              .sort((a, b) => new Date(a.dataValidade).getTime() - new Date(b.dataValidade).getTime()); // FEFO

            for (const lote of lotesOrdenados) {
              if (quantidadeAbater <= 0) break;
              const loteIndex = produto.lotes.findIndex(l => l.id === lote.id);
              const itemLojaIndex = lote.inventario.findIndex(i => i.localId === 'loja');

              if (itemLojaIndex !== -1 && lote.inventario[itemLojaIndex].quantidade > 0) {
                const abateDoLote = Math.min(quantidadeAbater, lote.inventario[itemLojaIndex].quantidade);
                lote.inventario[itemLojaIndex].quantidade -= abateDoLote;
                quantidadeAbater -= abateDoLote;

                produto.lotes[loteIndex] = { ...lote, inventario: [...lote.inventario] };

                state.movimentacoes.unshift({
                  id: uuidv4(),
                  produtoId: produto.id,
                  produtoNome: produto.nome,
                  tipo: 'venda',
                  quantidade: abateDoLote,
                  data: new Date().toISOString(),
                  observacao: `Venda do lote ${lote.numeroLoteFornecedor || lote.id.substring(0, 8)}`
                });
              }
            }

            state.produtos = [
              ...state.produtos.slice(0, produtoIndex),
              produto,
              ...state.produtos.slice(produtoIndex + 1)
            ];
          });
        });
      },

      registrarMovimentacaoManual: (data: MovimentacaoFormData) => {
        set((state) => {
          const produtoIndex = state.produtos.findIndex(p => p.id === data.produtoId);
          if (produtoIndex === -1) throw new Error("Produto não encontrado");

          const produto = JSON.parse(JSON.stringify(state.produtos[produtoIndex])) as Produto;
          const lotePrincipal = produto.lotes[0];
          if (lotePrincipal) {
            const loteIndex = produto.lotes.findIndex(l => l.id === lotePrincipal.id);
            const itemLojaIndex = lotePrincipal.inventario.findIndex(i => i.localId === 'loja');

            if (itemLojaIndex !== -1) {
              if (data.tipo.startsWith('saida_') && lotePrincipal.inventario[itemLojaIndex].quantidade < data.quantidade) {
                throw new Error("Estoque insuficiente na loja");
              }
              if (data.tipo.startsWith('saida_')) {
                lotePrincipal.inventario[itemLojaIndex].quantidade -= data.quantidade;
              } else {
                lotePrincipal.inventario[itemLojaIndex].quantidade += data.quantidade;
              }
              produto.lotes[loteIndex] = { ...lotePrincipal, inventario: [...lotePrincipal.inventario] };
            }
          }

          state.movimentacoes.unshift({
            id: uuidv4(),
            produtoId: data.produtoId,
            produtoNome: produto.nome,
            tipo: data.tipo,
            quantidade: data.quantidade,
            data: new Date().toISOString(),
            observacao: data.observacao
          });

          state.produtos = [
            ...state.produtos.slice(0, produtoIndex),
            produto,
            ...state.produtos.slice(produtoIndex + 1)
          ];
        });
      },

      importarEmMassa: (produtosNovos: Array<{ nome: string; precoVenda: number; estoqueMinimo: number }>) => {
        set((state) => {
          const novosProdutos: Produto[] = produtosNovos.map(p => ({
            id: uuidv4(),
            nome: p.nome,
            precoVenda: p.precoVenda,
            estoqueMinimo: p.estoqueMinimo,
            lotes: [],
            unidadesDeMedida: [{ id: uuidv4(), nome: 'Unidade', sigla: 'UN', fatorConversao: 1 }],
            setor: 'outros',
          }));
          state.produtos = [...state.produtos, ...novosProdutos];

          novosProdutos.forEach(prod => {
            state.movimentacoes.unshift({
              id: uuidv4(),
              produtoId: prod.id,
              produtoNome: prod.nome,
              tipo: 'importacao',
              quantidade: 0,
              data: new Date().toISOString(),
              observacao: 'Importação em massa'
            });
          });
        });
      },

      getEstoquePorLocal: (produtoId: string, local: 'deposito' | 'loja') => {
        const state = get();
        const produto = state.produtos.find(p => p.id === produtoId);
        if (!produto) return 0;

        let total = 0;
        for (const lote of produto.lotes) {
          const item = lote.inventario.find(i => i.localId === local);
          if (item) total += item.quantidade;
        }
        return total;
      },

      editarProduto: (produtoId: string, produtoAtualizado: Partial<Produto>) => {
        set((state) => {
          const index = state.produtos.findIndex(p => p.id === produtoId);
          if (index === -1) return;

          const produtoAtual = { ...state.produtos[index] };

          const produtoAtualizadoDeep = {
            ...produtoAtual,
            ...produtoAtualizado,
            lotes: produtoAtualizado.lotes ? [...produtoAtualizado.lotes] : produtoAtual.lotes,
            unidadesDeMedida: produtoAtualizado.unidadesDeMedida 
              ? [...produtoAtualizado.unidadesDeMedida] 
              : produtoAtual.unidadesDeMedida,
            setor: produtoAtualizado.setor ?? produtoAtual.setor,
          };

          state.produtos = [
            ...state.produtos.slice(0, index),
            produtoAtualizadoDeep,
            ...state.produtos.slice(index + 1)
          ];
        });
      },

      excluirProduto: (produtoId: string) => {
        set((state) => {
          state.produtos = state.produtos.filter(p => p.id !== produtoId);
          state.movimentacoes = state.movimentacoes.filter(m => m.produtoId !== produtoId);
        });
      },

      excluirLote: (produtoId: string, loteId: string) => {
        set((state) => {
          const produtoIndex = state.produtos.findIndex(p => p.id === produtoId);
          if (produtoIndex === -1) return;

          const produto = { ...state.produtos[produtoIndex] };
          produto.lotes = produto.lotes.filter(l => l.id !== loteId);

          state.produtos = [
            ...state.produtos.slice(0, produtoIndex),
            produto,
            ...state.produtos.slice(produtoIndex + 1)
          ];
        });
      },

      getRelatorioEstoque: () => {
        const state = get();
        const turnover = state.produtos.reduce((acc, p) => acc + p.lotes.reduce((sum, l) => sum + l.quantidade, 0), 0) / (state.produtos.length || 1);
        const estoquePorSetor = state.produtos.reduce((acc, p) => {
          const total = p.lotes.reduce((sum, l) => sum + l.quantidade, 0);
          const setorKey = p.setor ?? 'outros';
          acc[setorKey] = (acc[setorKey] || 0) + total;
          return acc;
        }, {} as Record<string, number>);
        return { turnover, estoquePorSetor };
      },

      getAlertasEstoque: () => {
        const state = get();
        const baixoEstoque = state.produtos.filter(p => {
          const total = p.lotes.reduce((sum, l) => sum + l.quantidade, 0);
          return total < p.estoqueMinimo && total > 0;
        });
        const expirando = state.produtos.flatMap(p => p.lotes.filter(l => {
          const validade = new Date(l.dataValidade);
          return validade < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && validade > new Date();
        }));
        return { baixoEstoque, expirando };
      },

    })),
    {
      name: 'pdv-estoque-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const { 
          adicionarNovoProduto, 
          adicionarLote, 
          adicionarFornecedor, 
          editarFornecedor, 
          excluirFornecedor, 
          transferirParaLoja, 
          abaterEstoqueVenda,
          registrarMovimentacaoManual,
          importarEmMassa,
          getEstoquePorLocal,
          editarProduto,
          excluirProduto,
          excluirLote,
          getRelatorioEstoque,
          getAlertasEstoque,
          ...rest 
        } = state;
        return rest;
      },
    }
  )
);