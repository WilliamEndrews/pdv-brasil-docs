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

// Interface expandida para Unidade de Medida (baseada em WK, TOTVS, SAP)
export interface UnidadeMedida {
  id: string;
  abreviatura: string;        // Ex: UN, CX, FD, DZ, KG, LT, M
  descricao: string;          // Ex: Unidade, Caixa, Fardo, Dúzia, Quilograma, Litro, Metro
  codigoIN359?: string;       // Código fiscal para NFC-e (opcional)
  grandeza?: 'comprimento' | 'massa' | 'volume' | 'unidade';
  tipoValor: 'inteiro' | 'decimal2' | 'decimal4';
  ativo: boolean;
}

// Conversão de unidade específica por produto
export interface ConversaoUnidade {
  id: string;
  produtoId: string;
  unidadeOrigem: string;      // Ex: FD (Fardo)
  unidadeDestino: string;     // Ex: UN (Unidade)
  fatorMultiplicador: number; // Ex: 6 (1 fardo = 6 unidades)
  fatorConversao: number;     // Ex: 0.1667 (1 unidade = 0.1667 fardos)
}

// Apresentação de produto (múltiplos códigos de barras para o mesmo produto)
export interface ApresentacaoProduto {
  id: string;
  produtoId: string;
  codigoBarras: string;
  tipo: string;           // Ex: UN, FD, CX, DZ (unidade, fardo, caixa, dúzia)
  fatorConversao: number; // Ex: 1 (unidade), 27 (fardo), 12 (caixa)
  ativo: boolean;
  dataCriacao: string;
}

// Legado: manter para compatibilidade
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
  unidadeMedidaEntrada?: string; // Nova: unidade usada na entrada (ex: FD)
  quantidadeUnidades?: number; // Nova: quantidade convertida para unidades base
}
export interface Produto {
  id: string;
  nome: string;
  precoVenda: number;
  estoqueMinimo: number;
  fornecedorId?: string;
  codigoBarras?: string;
  lotes: Lote[];
  unidadesDeMedida: UnidadeDeMedida[]; // Legado: manter para compatibilidade
  unidadeMedidaPadrao: string; // Nova: unidade base para controle (ex: UN)
  conversoes: ConversaoUnidade[]; // Nova: conversões disponíveis para este produto
  apresentacoes?: ApresentacaoProduto[]; // Nova: múltiplos códigos de barras para o mesmo produto
  setor?: 'eletronicos' | 'alimentos' | 'moda' | 'outros';  // OPCIONAL para compatibilidade com dados antigos
  precoPorQuilo?: number; // Preço por quilo para produtos pesados (balança)
  vendidoPorPeso?: boolean; // Indica se o produto é vendido por peso (balança)
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
  precoPorQuilo: z.coerce.number().positive("O preço por quilo deve ser maior que zero.").optional(),
  vendidoPorPeso: z.boolean().default(false).optional(),
});
export type NovoProdutoData = z.infer<typeof productFormSchema>;

export const loteFormSchema = z.object({
  quantidadeTotal: z.coerce.number().int().positive("Quantidade total deve ser maior que zero."),
  quantidadeDeposito: z.coerce.number().int().nonnegative("Quantidade no depósito não pode ser negativa."),
  quantidadeLoja: z.coerce.number().int().nonnegative("Quantidade na loja não pode ser negativa."),
  precoCusto: z.coerce.number().nonnegative("O custo não pode ser negativo."),
  margemLucro: z.coerce.number().min(0, "Margem deve ser maior ou igual a 0.").max(100, "Margem não pode exceder 100%.").default(0).optional(),
  atualizarPrecoVenda: z.boolean().default(false).optional(),
  unidadeMedidaEntrada: z.string().default('UN').optional(),
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

export const conversaoUnidadeSchema = z.object({
  unidadeOrigem: z.string().min(1, "Unidade de origem é obrigatória"),
  unidadeDestino: z.string().min(1, "Unidade de destino é obrigatória"),
  fatorMultiplicador: z.coerce.number().positive("Fator deve ser maior que zero"),
  fatorConversao: z.coerce.number().positive("Fator deve ser maior que zero"),
});
export type NovaConversaoData = z.infer<typeof conversaoUnidadeSchema>;

export const movimentacaoFormSchema = z.object({
  produtoId: z.string().min(1, "Selecione um produto"),
  tipo: z.enum(["entrada_ajuste", "saida_ajuste", "saida_perda"]),
  quantidade: z.number().positive("Quantidade deve ser maior que zero"),
  unidadeMedida: z.string().default('UN').optional(),
  observacao: z.string().optional(),
});
export type MovimentacaoFormData = z.infer<typeof movimentacaoFormSchema>;

// Schema para apresentação de produto
export const apresentacaoSchema = z.object({
  codigoBarras: z.string().min(1, "Código de barras é obrigatório"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  fatorConversao: z.coerce.number().positive("Fator deve ser maior que zero"),
});
export type NovaApresentacaoData = z.infer<typeof apresentacaoSchema>;

// ==========================================================================
// FUNÇÕES UTILITÁRIAS
// ==========================================================================

/**
 * Converte quantidade de uma unidade para a unidade padrão do produto
 * @param produto Produto com conversões configuradas
 * @param quantidade Quantidade na unidade de origem
 * @param unidadeOrigem Unidade de origem
 * @returns Quantidade convertida para a unidade padrão
 */
export const converterQuantidadeParaPadrao = (
  produto: Produto,
  quantidade: number,
  unidadeOrigem: string
): number => {
  // Se a unidade de origem já é a padrão, retorna a quantidade
  if (unidadeOrigem === produto.unidadeMedidaPadrao) {
    return quantidade;
  }

  // Conversão especial entre KG e G (intrínseca ao sistema)
  if (unidadeOrigem === 'KG' && produto.unidadeMedidaPadrao === 'G') {
    return quantidade * 1000; // 1 KG = 1000 G
  }
  if (unidadeOrigem === 'G' && produto.unidadeMedidaPadrao === 'KG') {
    return quantidade / 1000; // 1000 G = 1 KG
  }

  // Conversão em cadeia: KG → G → UN (para produtos pesados)
  if (unidadeOrigem === 'KG' && produto.unidadeMedidaPadrao === 'UN') {
    // Primeiro converte KG para G
    const quantidadeG = quantidade * 1000;
    // Depois busca conversão de G para UN
    const conversaoGParaUN = produto.conversoes?.find(
      c => c.unidadeOrigem === 'G' && c.unidadeDestino === 'UN'
    );
    if (conversaoGParaUN) {
      return quantidadeG / conversaoGParaUN.fatorMultiplicador;
    }
  }

  // Conversão em cadeia: UN → G → KG
  if (unidadeOrigem === 'UN' && produto.unidadeMedidaPadrao === 'KG') {
    // Primeiro busca conversão de UN para G
    const conversaoUNParaG = produto.conversoes?.find(
      c => c.unidadeOrigem === 'UN' && c.unidadeDestino === 'G'
    );
    if (conversaoUNParaG) {
      const quantidadeG = quantidade * conversaoUNParaG.fatorMultiplicador;
      // Depois converte G para KG
      return quantidadeG / 1000;
    }
  }

  // Busca conversão configurada
  const conversao = produto.conversoes?.find(
    c => c.unidadeOrigem === unidadeOrigem && c.unidadeDestino === produto.unidadeMedidaPadrao
  );

  if (conversao) {
    return quantidade * conversao.fatorMultiplicador;
  }

  // Se não houver conversão, assume 1:1
  return quantidade;
};

// ==========================================================================
// INTERFACE DO ESTADO
// ==========================================================================
interface EstoqueState {
  produtos: Produto[];
  fornecedores: Fornecedor[];
  movimentacoes: Movimentacao[];
  unidadesMedida: UnidadeMedida[]; // Nova: lista global de unidades de medida

  // CRUD para Unidades de Medida
  adicionarUnidadeMedida: (unidade: Omit<UnidadeMedida, 'id'>) => void;
  editarUnidadeMedida: (id: string, unidade: Partial<UnidadeMedida>) => void;
  excluirUnidadeMedida: (id: string) => void;
  getUnidadeMedidaPorAbreviatura: (abreviatura: string) => UnidadeMedida | undefined;

  // CRUD para Conversões de Unidade por Produto
  adicionarConversaoUnidade: (produtoId: string, conversao: Omit<ConversaoUnidade, 'id' | 'produtoId'>) => void;
  removerConversaoUnidade: (produtoId: string, conversaoId: string) => void;
  getConversoesProduto: (produtoId: string) => ConversaoUnidade[];

  // CRUD para Apresentações de Produto (múltiplos códigos de barras)
  adicionarApresentacao: (produtoId: string, apresentacao: Omit<ApresentacaoProduto, 'id' | 'produtoId' | 'dataCriacao'>) => void;
  removerApresentacao: (produtoId: string, apresentacaoId: string) => void;
  getApresentacoesProduto: (produtoId: string) => ApresentacaoProduto[];
  buscarApresentacaoPorCodigo: (codigo: string) => { apresentacao: ApresentacaoProduto; produto: Produto } | null;

  adicionarNovoProduto: (data: NovoProdutoData) => void;
  adicionarLote: (produtoId: string, data: NovoLoteData) => void;
  adicionarFornecedor: (data: NovoFornecedorData) => void;
  editarFornecedor: (fornecedorId: string, data: NovoFornecedorData) => void;
  excluirFornecedor: (fornecedorId: string) => void;
  transferirParaLoja: (produtoId: string, loteId: string, quantidade: number, unidadeMedida?: string) => boolean;
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
      unidadesMedida: [
        // Unidades pré-cadastradas padrão (baseadas em WK, TOTVS)
        { id: 'un', abreviatura: 'UN', descricao: 'Unidade', codigoIN359: 'UN', grandeza: 'unidade', tipoValor: 'inteiro', ativo: true },
        { id: 'cx', abreviatura: 'CX', descricao: 'Caixa', codigoIN359: 'CX', grandeza: 'unidade', tipoValor: 'inteiro', ativo: true },
        { id: 'fd', abreviatura: 'FD', descricao: 'Fardo', grandeza: 'unidade', tipoValor: 'inteiro', ativo: true },
        { id: 'dz', abreviatura: 'DZ', descricao: 'Dúzia', codigoIN359: 'DZ', grandeza: 'unidade', tipoValor: 'inteiro', ativo: true },
        { id: 'kg', abreviatura: 'KG', descricao: 'Quilograma', codigoIN359: 'KG', grandeza: 'massa', tipoValor: 'decimal2', ativo: true },
        { id: 'g', abreviatura: 'G', descricao: 'Grama', codigoIN359: 'GR', grandeza: 'massa', tipoValor: 'decimal4', ativo: true },
        { id: 'lt', abreviatura: 'LT', descricao: 'Litro', codigoIN359: 'LT', grandeza: 'volume', tipoValor: 'decimal2', ativo: true },
        { id: 'm', abreviatura: 'M', descricao: 'Metro', codigoIN359: 'M', grandeza: 'comprimento', tipoValor: 'decimal2', ativo: true },
      ],

      // CRUD para Unidades de Medida
      adicionarUnidadeMedida: (unidade) => {
        set((state) => {
          const novaUnidade: UnidadeMedida = {
            id: uuidv4(),
            ...unidade,
          };
          state.unidadesMedida = [...state.unidadesMedida, novaUnidade];
        });
      },

      editarUnidadeMedida: (id, unidadeAtualizada) => {
        set((state) => {
          const index = state.unidadesMedida.findIndex(u => u.id === id);
          if (index !== -1) {
            state.unidadesMedida[index] = { ...state.unidadesMedida[index], ...unidadeAtualizada };
          }
        });
      },

      excluirUnidadeMedida: (id) => {
        set((state) => {
          state.unidadesMedida = state.unidadesMedida.filter(u => u.id !== id);
        });
      },

      getUnidadeMedidaPorAbreviatura: (abreviatura) => {
        return get().unidadesMedida.find(u => u.abreviatura === abreviatura && u.ativo);
      },

      // CRUD para Conversões de Unidade por Produto
      adicionarConversaoUnidade: (produtoId, conversao) => {
        set((state) => {
          const produtoIndex = state.produtos.findIndex(p => p.id === produtoId);
          if (produtoIndex === -1) return;

          const novaConversao: ConversaoUnidade = {
            id: uuidv4(),
            produtoId,
            ...conversao,
          };

          // Garantir que o array conversoes exista
          if (!state.produtos[produtoIndex].conversoes) {
            state.produtos[produtoIndex].conversoes = [];
          }

          state.produtos[produtoIndex].conversoes = [
            ...state.produtos[produtoIndex].conversoes,
            novaConversao,
          ];
        });
      },

      removerConversaoUnidade: (produtoId, conversaoId) => {
        set((state) => {
          const produtoIndex = state.produtos.findIndex(p => p.id === produtoId);
          if (produtoIndex === -1) return;

          state.produtos[produtoIndex].conversoes = state.produtos[produtoIndex].conversoes.filter(
            c => c.id !== conversaoId
          );
        });
      },

      getConversoesProduto: (produtoId) => {
        const produto = get().produtos.find(p => p.id === produtoId);
        return produto?.conversoes || [];
      },

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
            unidadeMedidaPadrao: 'UN',
            conversoes: [],
            setor: data.setor,
            precoPorQuilo: data.precoPorQuilo,
            vendidoPorPeso: data.vendidoPorPeso,
          };
          state.produtos = [...state.produtos, novoProduto];
        });
      },

      adicionarLote: (produtoId, data) => {
        set((state) => {
          const produtoIndex = state.produtos.findIndex(p => p.id === produtoId);
          if (produtoIndex === -1) return;

          const produto = { ...state.produtos[produtoIndex] };

          let fatorConversao = 1;

          // Conversão em cadeia: KG → G → UN
          if (data.unidadeMedidaEntrada === 'KG' && produto.unidadeMedidaPadrao === 'UN') {
            const conversaoGParaUN = produto.conversoes?.find(
              c => c.unidadeOrigem === 'G' && c.unidadeDestino === 'UN'
            );
            if (conversaoGParaUN) {
              // KG → G → UN: 1 KG = 1000 G, e 4000 G = 1 UN
              // Portanto, 1 KG = 1000/4000 = 0.25 UN
              fatorConversao = 1000 / conversaoGParaUN.fatorMultiplicador;
            }
          }
          // Conversão em cadeia inversa: UN → G → KG
          else if (data.unidadeMedidaEntrada === 'UN' && produto.unidadeMedidaPadrao === 'KG') {
            const conversaoUNParaG = produto.conversoes?.find(
              c => c.unidadeOrigem === 'UN' && c.unidadeDestino === 'G'
            );
            if (conversaoUNParaG) {
              // UN → G → KG: 1 UN = 4000 G, e 1000 G = 1 KG
              // Portanto, 1 UN = 4000/1000 = 4 KG
              fatorConversao = conversaoUNParaG.fatorMultiplicador / 1000;
            }
          }
          // Conversão direta
          else {
            const conversao = produto.conversoes.find(
              c => c.unidadeOrigem === data.unidadeMedidaEntrada && c.unidadeDestino === produto.unidadeMedidaPadrao
            );
            fatorConversao = conversao ? conversao.fatorMultiplicador : 1;
          }

          console.log('DEBUG adicionarLote:');
          console.log('Unidade de entrada:', data.unidadeMedidaEntrada);
          console.log('Unidade padrão:', produto.unidadeMedidaPadrao);
          console.log('Fator de conversão:', fatorConversao);
          console.log('Quantidade total (entrada):', data.quantidadeTotal);
          console.log('Quantidade convertida (padrão):', data.quantidadeTotal * fatorConversao);

          // Converter quantidades do inventário para unidade padrão
          const inventario: InventarioItem[] = [];
          if (data.quantidadeDeposito > 0) {
            inventario.push({ 
              localId: 'deposito', 
              quantidade: data.quantidadeDeposito * fatorConversao 
            });
          }
          if (data.quantidadeLoja > 0) {
            inventario.push({ 
              localId: 'loja', 
              quantidade: data.quantidadeLoja * fatorConversao 
            });
          }

          // Calcular quantidade em unidades base baseada na conversão
          const quantidadeUnidades = data.quantidadeTotal * fatorConversao;

          const novoLote: Lote = {
            id: uuidv4(),
            produtoId,
            quantidade: quantidadeUnidades, // Armazenar em unidades padrão
            precoCusto: data.precoCusto,
            dataValidade: data.dataValidade,
            dataEntrada: data.dataEntrada,
            numeroLoteFornecedor: data.numeroLoteFornecedor,
            inventario,
            fornecedorId: data.fornecedorId,
            localizacaoInicial: data.quantidadeDeposito > 0 && data.quantidadeLoja > 0 ? 'dividido' : data.quantidadeDeposito > 0 ? 'deposito' : 'loja',
            statusQualidade: data.statusQualidade,
            observacoes: data.observacoes,
            unidadeMedidaEntrada: data.unidadeMedidaEntrada,
            quantidadeUnidades,
          };

          produto.lotes = [...produto.lotes, novoLote];

          // Atualizar preço de venda se solicitado e margem fornecida
          if (data.atualizarPrecoVenda && data.margemLucro !== undefined && data.margemLucro > 0) {
            const precoVendaCalculado = data.precoCusto * (1 + data.margemLucro / 100);
            produto.precoVenda = Math.round(precoVendaCalculado * 100) / 100; // Arredondar para 2 casas decimais
          }

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
      transferirParaLoja: (produtoId: string, loteId: string, quantidade: number, unidadeMedida?: string): boolean => {
        let sucesso = false;

        set((state) => {
          const produtoIndex = state.produtos.findIndex(p => p.id === produtoId);
          if (produtoIndex === -1) return;

          // Cópia profunda do produto inteiro (garante que mudanças aninhadas sejam detectadas)
          const produto = JSON.parse(JSON.stringify(state.produtos[produtoIndex])) as Produto;

          // Converter quantidade para unidade padrão se necessário
          const unidadeMedidaSelecionada = unidadeMedida || produto.unidadeMedidaPadrao;
          const quantidadeConvertida = converterQuantidadeParaPadrao(produto, quantidade, unidadeMedidaSelecionada);

          const loteIndex = produto.lotes.findIndex(l => l.id === loteId);
          if (loteIndex === -1) return;

          const lote = produto.lotes[loteIndex];

          // Encontra o item no depósito
          const itemDepositoIndex = lote.inventario.findIndex(i => i.localId === 'deposito');
          if (itemDepositoIndex === -1 || lote.inventario[itemDepositoIndex].quantidade < quantidadeConvertida) {
            return; // quantidade insuficiente no depósito
          }

          // Realiza a transferência
          lote.inventario[itemDepositoIndex].quantidade -= quantidadeConvertida;

          // Atualiza ou cria item na loja
          const itemLojaIndex = lote.inventario.findIndex(i => i.localId === 'loja');
          if (itemLojaIndex !== -1) {
            lote.inventario[itemLojaIndex].quantidade += quantidadeConvertida;
          } else {
            lote.inventario.push({ localId: 'loja', quantidade: quantidadeConvertida });
          }

          // Atualiza o lote com novo array de inventario
          produto.lotes[loteIndex] = {
            ...lote,
            inventario: [...lote.inventario]
          };

          // Registra a movimentação
          state.movimentacoes.unshift({
            id: uuidv4(),
            produtoId: produtoId,
            produtoNome: produto.nome,
            tipo: 'transferencia',
            quantidade: quantidadeConvertida,
            data: new Date().toISOString()
          });

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
          
          // Converter quantidade para unidade padrão se necessário
          const unidadeMedida = data.unidadeMedida || produto.unidadeMedidaPadrao;
          const quantidadeConvertida = converterQuantidadeParaPadrao(produto, data.quantidade, unidadeMedida);

          const lotePrincipal = produto.lotes[0];
          if (lotePrincipal) {
            const loteIndex = produto.lotes.findIndex(l => l.id === lotePrincipal.id);
            const itemLojaIndex = lotePrincipal.inventario.findIndex(i => i.localId === 'loja');

            if (itemLojaIndex !== -1) {
              if (data.tipo.startsWith('saida_') && lotePrincipal.inventario[itemLojaIndex].quantidade < quantidadeConvertida) {
                throw new Error("Estoque insuficiente na loja");
              }
              if (data.tipo.startsWith('saida_')) {
                lotePrincipal.inventario[itemLojaIndex].quantidade -= quantidadeConvertida;
              } else {
                lotePrincipal.inventario[itemLojaIndex].quantidade += quantidadeConvertida;
              }
              produto.lotes[loteIndex] = { ...lotePrincipal, inventario: [...lotePrincipal.inventario] };
            }
          }

          state.movimentacoes.unshift({
            id: uuidv4(),
            produtoId: data.produtoId,
            produtoNome: produto.nome,
            tipo: data.tipo,
            quantidade: quantidadeConvertida,
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
            unidadeMedidaPadrao: 'UN',
            conversoes: [],
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

      // CRUD para Apresentações de Produto
      adicionarApresentacao: (produtoId: string, apresentacao: Omit<ApresentacaoProduto, 'id' | 'produtoId' | 'dataCriacao'>) => {
        set((state) => {
          const produtoIndex = state.produtos.findIndex(p => p.id === produtoId);
          if (produtoIndex === -1) return;

          const produto = { ...state.produtos[produtoIndex] };
          if (!produto.apresentacoes) {
            produto.apresentacoes = [];
          }

          const novaApresentacao: ApresentacaoProduto = {
            id: uuidv4(),
            produtoId,
            ...apresentacao,
            ativo: true,
            dataCriacao: new Date().toISOString()
          };

          produto.apresentacoes = [...produto.apresentacoes, novaApresentacao];

          state.produtos = [
            ...state.produtos.slice(0, produtoIndex),
            produto,
            ...state.produtos.slice(produtoIndex + 1)
          ];
        });
      },

      removerApresentacao: (produtoId: string, apresentacaoId: string) => {
        set((state) => {
          const produtoIndex = state.produtos.findIndex(p => p.id === produtoId);
          if (produtoIndex === -1) return;

          const produto = { ...state.produtos[produtoIndex] };
          if (!produto.apresentacoes) return;

          produto.apresentacoes = produto.apresentacoes.filter(a => a.id !== apresentacaoId);

          state.produtos = [
            ...state.produtos.slice(0, produtoIndex),
            produto,
            ...state.produtos.slice(produtoIndex + 1)
          ];
        });
      },

      getApresentacoesProduto: (produtoId: string) => {
        const state = get();
        const produto = state.produtos.find(p => p.id === produtoId);
        return produto?.apresentacoes || [];
      },

      buscarApresentacaoPorCodigo: (codigo: string) => {
        const state = get();
        for (const produto of state.produtos) {
          if (produto.apresentacoes) {
            const apresentacao = produto.apresentacoes.find(
              a => a.codigoBarras === codigo && a.ativo
            );
            if (apresentacao) {
              return { apresentacao, produto };
            }
          }
        }
        return null;
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
      onRehydrateStorage: () => (state) => {
        // Garante que a unidade G exista após carregar do localStorage
        if (state && state.unidadesMedida) {
          const hasGrama = state.unidadesMedida.some(u => u.abreviatura === 'G');
          if (!hasGrama) {
            state.unidadesMedida.push({
              id: 'g',
              abreviatura: 'G',
              descricao: 'Grama',
              codigoIN359: 'GR',
              grandeza: 'massa',
              tipoValor: 'decimal4',
              ativo: true
            });
          }
        }
      },
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