// src/store/caixaStore.ts (VERSÃO 7.0 - SINCRONIZAÇÃO EM TEMPO REAL)
// Última atualização: 22/05/2026
// Mudanças principais:
// - Customer Display usa eventos de storage para sincronização em tempo real
// - Suporte a apresentações de produto com fator de conversão automático

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEstoqueStore, Produto } from "./estoqueStore";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";

export interface Item extends Produto {
  quantidade: number;
  unidadeMedida?: string; // Nova: unidade de medida usada na venda (ex: CX, FD, UN)
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
  apresentacaoEncontrada: { fatorConversao: number; tipo: string } | null; // Nova: guarda apresentação encontrada
  // Estados de pagamento para sincronização com CustomerDisplay
  showPaymentSummary: boolean;
  selectedMethod: 'dinheiro' | 'cartao' | 'pix' | null;
  pagamentosParciais: Array<{ forma: 'dinheiro' | 'cartao' | 'pix'; valor: number }>;
  cashReceived: number;

  adicionarItem: (item: Produto, unidadeMedida?: string, quantidade?: number) => void;
  removerItem: (id: string) => void;
  atualizarQuantidade: (id: string, qtd: number, unidadeMedida?: string) => void;
  aplicarDesconto: (valor: number) => void;
  finalizarVenda: (metodoPagamento?: 'dinheiro' | 'cartao' | 'pix' | 'outros') => void;
  limparCarrinho: () => void;
  toggleStatusCaixa: () => void;
  buscarProduto: (termo: string) => void;
  // Novas funções para sincronização de pagamento
  setShowPaymentSummary: (show: boolean) => void;
  setSelectedMethod: (method: 'dinheiro' | 'cartao' | 'pix' | null) => void;
  setPagamentosParciais: (pagamentos: Array<{ forma: 'dinheiro' | 'cartao' | 'pix'; valor: number }>) => void;
  setCashReceived: (value: number) => void;
  
  // Funções para métricas do dashboard
  getVendasHoje: () => number;
  getProdutosVendidosHoje: () => number;
  getPedidosHoje: () => number;
  getTicketMedioHoje: () => number;
  getMetricasDashboard: () => { vendasHoje: number; produtosVendidos: number; pedidos: number; ticketMedio: number };
  
  // Funções para relatórios detalhados
  getVendasPorPeriodo: (dataInicio: string, dataFim: string) => Venda[];
  getVendasPorMetodoPagamento: (periodo?: { inicio: string; fim: string }) => Record<string, { total: number; quantidade: number }>;
  getProdutosMaisVendidos: (dataInicio: string, dataFim: string, limite?: number) => Array<{ produtoId: string; produtoNome: string; quantidade: number; total: number }>;
  getVendasDiarias: (dias: number) => Array<{ data: string; total: number; pedidos: number }>;
  getRelatorioCompleto: (periodo: { inicio: string; fim: string }) => {
    vendasTotais: number;
    pedidos: number;
    ticketMedio: number;
    porMetodo: Record<string, { total: number; quantidade: number; percentual: number }>;
    produtosTop: Array<{ produtoNome: string; quantidade: number; total: number }>;
    vendasDiarias: Array<{ data: string; total: number; pedidos: number }>;
  };
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
      apresentacaoEncontrada: null,
      // Estados de pagamento
      showPaymentSummary: false,
      selectedMethod: null,
      pagamentosParciais: [],
      cashReceived: 0,

      // Adiciona item ao carrinho (ou incrementa quantidade se já existir)
      adicionarItem: (produto, unidadeMedida?: string, quantidade = 1) => set((state) => {
        const itemExistente = state.itens.find(i => i.id === produto.id);
        if (itemExistente) {
          return {
            itens: state.itens.map(i =>
              i.id === produto.id ? { ...i, quantidade: i.quantidade + quantidade, unidadeMedida } : i
            ),
            subtotal: state.subtotal + (produto.precoVenda * quantidade),
            total: state.subtotal + (produto.precoVenda * quantidade) - state.desconto,
            ultimoItem: { ...produto, quantidade: itemExistente.quantidade + quantidade, unidadeMedida },
            statusCaixa: "ocupado"
          };
        } else {
          return {
            itens: [...state.itens, { ...produto, quantidade, unidadeMedida }],
            subtotal: state.subtotal + (produto.precoVenda * quantidade),
            total: state.subtotal + (produto.precoVenda * quantidade) - state.desconto,
            ultimoItem: { ...produto, quantidade, unidadeMedida },
            statusCaixa: "ocupado"
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
      atualizarQuantidade: (id, qtd, unidadeMedida?: string) => set((state) => {
        const item = state.itens.find(i => i.id === id);
        if (!item) return state;
        
        const estoqueStore = useEstoqueStore.getState();
        const produtoCompleto = estoqueStore.produtos.find(p => p.id === item.id);
        
        // Calcula o preço baseado na unidade de medida
        let precoUnitario = item.precoVenda;
        if (produtoCompleto && unidadeMedida && unidadeMedida !== produtoCompleto.unidadeMedidaPadrao) {
          const conversao = produtoCompleto.conversoes?.find(
            c => c.unidadeOrigem === unidadeMedida && c.unidadeDestino === produtoCompleto.unidadeMedidaPadrao
          );
          if (conversao) {
            precoUnitario = item.precoVenda * conversao.fatorMultiplicador;
          }
        }
        
        const diferenca = (qtd - item.quantidade) * precoUnitario;
        return {
          itens: state.itens.map(i => i.id === id ? { ...i, quantidade: qtd, unidadeMedida } : i),
          subtotal: state.subtotal + diferenca,
          total: state.subtotal + diferenca - state.desconto,
          ultimoItem: qtd > 0 ? { ...item, quantidade: qtd, unidadeMedida } : null
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
        // Converte quantidade baseada na unidade de medida
        const estoqueStore = useEstoqueStore.getState();
        const itensParaAbater = itens.map(item => {
          const produto = estoqueStore.produtos.find(p => p.id === item.id);
          if (!produto || !item.unidadeMedida || item.unidadeMedida === produto.unidadeMedidaPadrao) {
            return {
              produtoId: item.id,
              quantidade: item.quantidade
            };
          }

          // Busca conversão configurada para o produto
          const conversao = produto.conversoes.find(
            c => c.unidadeOrigem === item.unidadeMedida && c.unidadeDestino === produto.unidadeMedidaPadrao
          );

          if (conversao) {
            return {
              produtoId: item.id,
              quantidade: item.quantidade * conversao.fatorMultiplicador
            };
          }

          // Se não houver conversão, assume 1:1
          return {
            produtoId: item.id,
            quantidade: item.quantidade
          };
        });

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

      // Busca produtos para sugestão enquanto digita (extensão para suportar apresentações)
      buscarProduto: (termo) => {
        // Não buscar se o termo for muito curto (menos de 2 caracteres)
        if (termo.length < 2) {
          set({ sugestoes: [], apresentacaoEncontrada: null });
          return;
        }

        const estoqueStore = useEstoqueStore.getState();
        
        // Primeiro verifica se é uma apresentação de código de barras
        const apresentacao = estoqueStore.buscarApresentacaoPorCodigo(termo);
        if (apresentacao) {
          // Se for apresentação, retorna o produto correspondente e guarda a apresentação
          set({ 
            sugestoes: [apresentacao.produto],
            apresentacaoEncontrada: { fatorConversao: apresentacao.apresentacao.fatorConversao, tipo: apresentacao.apresentacao.tipo }
          });
          return;
        }
        
        // Se não for apresentação, segue o fluxo normal e limpa a apresentação
        const produtosDoEstoque = estoqueStore.produtos;
        const sugestoesFiltradas = produtosDoEstoque.filter(p =>
          p.nome.toLowerCase().includes(termo.toLowerCase()) ||
          p.codigoBarras?.includes(termo)
        );
        set({ 
          sugestoes: sugestoesFiltradas.slice(0, 5),
          apresentacaoEncontrada: null
        });
      },

      // Funções para sincronização de pagamento
      setShowPaymentSummary: (show) => set({ showPaymentSummary: show }),
      setSelectedMethod: (method) => set({ selectedMethod: method }),
      setPagamentosParciais: (pagamentos) => set({ pagamentosParciais: pagamentos }),
      setCashReceived: (value) => set({ cashReceived: value }),
      
      // Funções para métricas do dashboard
      getVendasHoje: () => {
        const { historico } = get();
        const hoje = new Date();
        const inicioDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        
        const vendasHoje = historico.filter(venda => {
          const dataVenda = new Date(venda.data);
          return dataVenda >= inicioDoDia;
        });
        
        return vendasHoje.reduce((total, venda) => total + venda.total, 0);
      },
      
      getProdutosVendidosHoje: () => {
        const { historico } = get();
        const hoje = new Date();
        const inicioDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        
        const vendasHoje = historico.filter(venda => {
          const dataVenda = new Date(venda.data);
          return dataVenda >= inicioDoDia;
        });
        
        return vendasHoje.reduce((total, venda) => {
          return total + venda.itens.reduce((soma, item) => soma + item.quantidade, 0);
        }, 0);
      },
      
      getPedidosHoje: () => {
        const { historico } = get();
        const hoje = new Date();
        const inicioDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        
        return historico.filter(venda => {
          const dataVenda = new Date(venda.data);
          return dataVenda >= inicioDoDia;
        }).length;
      },
      
      getTicketMedioHoje: () => {
        const { historico } = get();
        const hoje = new Date();
        const inicioDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        
        const vendasHoje = historico.filter(venda => {
          const dataVenda = new Date(venda.data);
          return dataVenda >= inicioDoDia;
        });
        
        if (vendasHoje.length === 0) return 0;
        
        const totalVendas = vendasHoje.reduce((total, venda) => total + venda.total, 0);
        return totalVendas / vendasHoje.length;
      },
      
      getMetricasDashboard: () => {
        const state = get();
        return {
          vendasHoje: state.getVendasHoje(),
          produtosVendidos: state.getProdutosVendidosHoje(),
          pedidos: state.getPedidosHoje(),
          ticketMedio: state.getTicketMedioHoje(),
        };
      },
      
      // Funções para relatórios detalhados
      getVendasPorPeriodo: (dataInicio: string, dataFim: string) => {
        const { historico } = get();
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);
        
        return historico.filter(venda => {
          const dataVenda = new Date(venda.data);
          return dataVenda >= inicio && dataVenda <= fim;
        });
      },
      
      getVendasPorMetodoPagamento: (periodo?: { inicio: string; fim: string }) => {
        const { historico } = get();
        let vendasFiltradas = historico;
        
        if (periodo) {
          vendasFiltradas = historico.filter(venda => {
            const dataVenda = new Date(venda.data);
            const inicio = new Date(periodo.inicio);
            const fim = new Date(periodo.fim);
            return dataVenda >= inicio && dataVenda <= fim;
          });
        }
        
        const porMetodo: Record<string, { total: number; quantidade: number }> = {};
        
        vendasFiltradas.forEach(venda => {
          const metodo = venda.metodoPagamento || 'outros';
          if (!porMetodo[metodo]) {
            porMetodo[metodo] = { total: 0, quantidade: 0 };
          }
          porMetodo[metodo].total += venda.total;
          porMetodo[metodo].quantidade += 1;
        });
        
        return porMetodo;
      },
      
      getProdutosMaisVendidos: (dataInicio: string, dataFim: string, limite = 10) => {
        const vendas = get().getVendasPorPeriodo(dataInicio, dataFim);
        const produtosMap: Record<string, { produtoId: string; produtoNome: string; quantidade: number; total: number }> = {};
        
        vendas.forEach(venda => {
          venda.itens.forEach(item => {
            if (!produtosMap[item.id]) {
              produtosMap[item.id] = {
                produtoId: item.id,
                produtoNome: item.nome,
                quantidade: 0,
                total: 0,
              };
            }
            produtosMap[item.id].quantidade += item.quantidade;
            produtosMap[item.id].total += item.precoVenda * item.quantidade;
          });
        });
        
        return Object.values(produtosMap)
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, limite);
      },
      
      getVendasDiarias: (dias: number) => {
        const { historico } = get();
        const vendasDiarias: Array<{ data: string; total: number; pedidos: number }> = [];
        
        for (let i = dias - 1; i >= 0; i--) {
          const data = new Date();
          data.setDate(data.getDate() - i);
          const inicioDoDia = new Date(data.getFullYear(), data.getMonth(), data.getDate());
          const fimDoDia = new Date(data.getFullYear(), data.getMonth(), data.getDate() + 1);
          
          const vendasDoDia = historico.filter(venda => {
            const dataVenda = new Date(venda.data);
            return dataVenda >= inicioDoDia && dataVenda < fimDoDia;
          });
          
          vendasDiarias.push({
            data: data.toISOString().split('T')[0],
            total: vendasDoDia.reduce((sum, v) => sum + v.total, 0),
            pedidos: vendasDoDia.length,
          });
        }
        
        return vendasDiarias;
      },
      
      getRelatorioCompleto: (periodo: { inicio: string; fim: string }) => {
        const vendas = get().getVendasPorPeriodo(periodo.inicio, periodo.fim);
        const vendasTotais = vendas.reduce((sum, v) => sum + v.total, 0);
        const pedidos = vendas.length;
        const ticketMedio = pedidos > 0 ? vendasTotais / pedidos : 0;
        
        const porMetodoRaw = get().getVendasPorMetodoPagamento(periodo);
        const totalVendas = Object.values(porMetodoRaw).reduce((sum, m) => sum + m.total, 0);
        
        const porMetodo = Object.entries(porMetodoRaw).reduce((acc, [metodo, dados]) => {
          acc[metodo] = {
            ...dados,
            percentual: totalVendas > 0 ? (dados.total / totalVendas) * 100 : 0,
          };
          return acc;
        }, {} as Record<string, { total: number; quantidade: number; percentual: number }>);
        
        const produtosTop = get().getProdutosMaisVendidos(periodo.inicio, periodo.fim, 5);
        const vendasDiarias = get().getVendasDiarias(7);
        
        return {
          vendasTotais,
          pedidos,
          ticketMedio,
          porMetodo,
          produtosTop,
          vendasDiarias,
        };
      },
    }),
    { name: "pdv-caixa" }
  )
);