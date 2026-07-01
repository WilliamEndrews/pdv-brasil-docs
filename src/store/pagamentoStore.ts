// src/store/pagamentoStore.ts
// Módulo de Pagamentos com Cartão - PDV Brasil
// Suporte a InfinitePay, TAF (Stone/Cielo/Rede) e Fallback Manual
// Última atualização: 27/05/2026

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";

// ==================== INTERFACES ====================

/**
 * Tipo de terminal de pagamento
 */
export type TipoTerminal = 'infinitepay' | 'stone' | 'cielo' | 'rede' | 'manual';

/**
 * Tipo de transação de cartão
 */
export type TipoTransacao = 'credito' | 'debito' | 'credito_parcelado';

/**
 * Bandeiras de cartão suportadas
 */
export type BandeiraCartao = 'visa' | 'mastercard' | 'elo' | 'hipercard' | 'amex' | 'discover' | 'outros';

/**
 * Status da transação de cartão
 */
export type StatusTransacao = 'aguardando' | 'aprovado' | 'recusado' | 'erro' | 'cancelado';

/**
 * Dados da transação de cartão
 */
export interface TransacaoCartao {
  id: string;
  vendaId: string;
  valor: number;
  tipo: TipoTransacao;
  terminal: TipoTerminal;
  bandeira?: BandeiraCartao;
  parcelas?: number;
  nsu?: string; // Número Sequencial Único
  autorizacao?: string; // Código de autorização
  ultimos4Digitos?: string;
  status: StatusTransacao;
  dataHora: string;
  clienteNome?: string;
  clienteCpf?: string;
  mensagem?: string;
  deepLink?: string; // Para InfinitePay
}

/**
 * Configuração do terminal
 */
export interface ConfiguracaoTerminal {
  tipo: TipoTerminal;
  ativo: boolean;
  merchantId?: string; // ID do estabelecimento
  merchantKey?: string; // Chave do estabelecimento
  deviceId?: string; // ID do dispositivo físico
  ambiente: 'teste' | 'producao';
}

/**
 * Estado do pagamento com cartão
 */
interface PagamentoState {
  // Transações
  transacoes: TransacaoCartao[];
  transacaoAtual: TransacaoCartao | null;
  
  // Configurações
  terminais: ConfiguracaoTerminal[];
  terminalSelecionado: TipoTerminal;
  
  // Estados da UI
  processando: boolean;
  modoManual: boolean;
  
  // Dados da empresa (White Label)
  empresaNome: string;
  empresaLogo?: string;
  empresaCnpj?: string;
  
  // Ações
  selecionarTerminal: (tipo: TipoTerminal) => void;
  iniciarTransacao: (vendaId: string, valor: number, tipo: TipoTransacao, parcelas?: number) => void;
  processarInfinitePay: (valor: number) => Promise<void>;
  processarTerminalTAF: (dados: {
    nsu: string;
    autorizacao: string;
    bandeira: BandeiraCartao;
    ultimos4Digitos: string;
  }) => Promise<void>;
  processarManual: (dados: {
    nsu: string;
    ultimos4Digitos: string;
    bandeira: BandeiraCartao;
  }) => Promise<void>;
  cancelarTransacao: () => void;
  atualizarStatus: (id: string, status: StatusTransacao, mensagem?: string) => void;
  getTransacoesPorVenda: (vendaId: string) => TransacaoCartao[];
  getTransacoesPorPeriodo: (inicio: Date, fim: Date) => TransacaoCartao[];
  configurarTerminal: (config: ConfiguracaoTerminal) => void;
  setEmpresaConfig: (nome: string, logo?: string, cnpj?: string) => void;
  gerarDeepLinkInfinitePay: (valor: number, vendaId: string) => string;
  imprimirComprovante: (transacao: TransacaoCartao) => void;
  limparTransacaoAtual: () => void;
}

// ==================== STORE ====================

export const usePagamentoStore = create<PagamentoState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      transacoes: [],
      transacaoAtual: null,
      terminais: [
        {
          tipo: 'infinitepay',
          ativo: true,
          ambiente: 'teste'
        },
        {
          tipo: 'stone',
          ativo: false,
          ambiente: 'teste'
        },
        {
          tipo: 'cielo',
          ativo: false,
          ambiente: 'teste'
        },
        {
          tipo: 'rede',
          ativo: false,
          ambiente: 'teste'
        },
        {
          tipo: 'manual',
          ativo: true,
          ambiente: 'producao'
        }
      ],
      terminalSelecionado: 'infinitepay',
      processando: false,
      modoManual: false,
      empresaNome: 'PDV Brasil',
      empresaLogo: undefined,
      empresaCnpj: undefined,

      // ==================== AÇÕES ====================

      /**
       * Seleciona o terminal de pagamento
       */
      selecionarTerminal: (tipo: TipoTerminal) => {
        set({ terminalSelecionado: tipo, modoManual: tipo === 'manual' });
      },

      /**
       * Inicia uma nova transação de cartão
       */
      iniciarTransacao: (vendaId: string, valor: number, tipo: TipoTransacao, parcelas?: number) => {
        const terminal = get().terminalSelecionado;
        
        const novaTransacao: TransacaoCartao = {
          id: uuidv4(),
          vendaId,
          valor,
          tipo,
          terminal,
          parcelas,
          status: 'aguardando',
          dataHora: new Date().toISOString()
        };

        set({ transacaoAtual: novaTransacao, processando: true });

        // Se for InfinitePay, gera o deep link automaticamente
        if (terminal === 'infinitepay') {
          const deepLink = get().gerarDeepLinkInfinitePay(valor, vendaId);
          set(state => ({
            transacaoAtual: state.transacaoAtual ? { ...state.transacaoAtual, deepLink } : null
          }));
        }
      },

      /**
       * Gera Deep Link para InfinitePay (Modo Teste)
       */
      gerarDeepLinkInfinitePay: (valor: number, vendaId: string): string => {
        // Em produção, isso seria um deep link real do app InfinitePay
        // Para teste, usamos um link simulado
        const valorFormatado = valor.toFixed(2).replace('.', ',');
        const timestamp = Date.now();
        return `infinitepay://payment?amount=${valorFormatado}&orderId=${vendaId}&timestamp=${timestamp}&mode=test`;
      },

      /**
       * Processa pagamento via InfinitePay (Modo Teste)
       */
      processarInfinitePay: async (valor: number) => {
        const { transacaoAtual } = get();
        if (!transacaoAtual) return;

        set({ processando: true });

        try {
          // Simula processo de pagamento via InfinitePay
          // Em produção, isso abriria o app e aguardaria retorno
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Simula aprovação (em produção, viria do callback do app)
          set(state => ({
            transacaoAtual: state.transacaoAtual ? {
              ...state.transacaoAtual,
              status: 'aprovado',
              nsu: `NSU-${Date.now()}`,
              autorizacao: `AUTH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
              bandeira: 'visa',
              ultimos4Digitos: '1234',
              mensagem: 'Pagamento aprovado com sucesso'
            } : null,
            processando: false
          }));

          // Salva no histórico
          set(state => ({
            transacoes: state.transacaoAtual ? [state.transacaoAtual, ...state.transacoes] : state.transacoes
          }));

          toast.success('Pagamento via InfinitePay aprovado!');
        } catch (error) {
          set(state => ({
            transacaoAtual: state.transacaoAtual ? {
              ...state.transacaoAtual,
              status: 'erro',
              mensagem: 'Erro ao processar pagamento InfinitePay'
            } : null,
            processando: false
          }));
          toast.error('Erro ao processar pagamento InfinitePay');
        }
      },

      /**
       * Processa pagamento via Terminal TAF (Stone/Cielo/Rede)
       */
      processarTerminalTAF: async (dados: {
        nsu: string;
        autorizacao: string;
        bandeira: BandeiraCartao;
        ultimos4Digitos: string;
      }) => {
        const { transacaoAtual } = get();
        if (!transacaoAtual) return;

        set({ processando: true });

        try {
          // Simula comunicação com terminal TAF
          // Em produção, isso seria via SDK Bluetooth ou API
          await new Promise(resolve => setTimeout(resolve, 2000));

          set(state => ({
            transacaoAtual: state.transacaoAtual ? {
              ...state.transacaoAtual,
              status: 'aprovado',
              nsu: dados.nsu,
              autorizacao: dados.autorizacao,
              bandeira: dados.bandeira,
              ultimos4Digitos: dados.ultimos4Digitos,
              mensagem: 'Pagamento aprovado no terminal'
            } : null,
            processando: false
          }));

          // Salva no histórico
          set(state => ({
            transacoes: state.transacaoAtual ? [state.transacaoAtual, ...state.transacoes] : state.transacoes
          }));

          toast.success('Pagamento aprovado no terminal!');
        } catch (error) {
          set(state => ({
            transacaoAtual: state.transacaoAtual ? {
              ...state.transacaoAtual,
              status: 'erro',
              mensagem: 'Erro ao comunicar com terminal'
            } : null,
            processando: false
          }));
          toast.error('Erro ao comunicar com terminal');
        }
      },

      /**
       * Processa pagamento manual (Fallback)
       */
      processarManual: async (dados: {
        nsu: string;
        ultimos4Digitos: string;
        bandeira: BandeiraCartao;
      }) => {
        const { transacaoAtual } = get();
        if (!transacaoAtual) return;

        set({ processando: true });

        try {
          // Validação básica
          if (!dados.nsu || dados.nsu.length < 6) {
            throw new Error('NSU inválido');
          }
          if (!dados.ultimos4Digitos || dados.ultimos4Digitos.length !== 4) {
            throw new Error('Últimos 4 dígitos inválidos');
          }

          await new Promise(resolve => setTimeout(resolve, 1000));

          set(state => ({
            transacaoAtual: state.transacaoAtual ? {
              ...state.transacaoAtual,
              status: 'aprovado',
              nsu: dados.nsu,
              bandeira: dados.bandeira,
              ultimos4Digitos: dados.ultimos4Digitos,
              mensagem: 'Pagamento manual registrado'
            } : null,
            processando: false
          }));

          // Salva no histórico
          set(state => ({
            transacoes: state.transacaoAtual ? [state.transacaoAtual, ...state.transacoes] : state.transacoes
          }));

          toast.success('Pagamento manual registrado com sucesso!');
        } catch (error: any) {
          set(state => ({
            transacaoAtual: state.transacaoAtual ? {
              ...state.transacaoAtual,
              status: 'erro',
              mensagem: error.message || 'Erro ao registrar pagamento manual'
            } : null,
            processando: false
          }));
          toast.error(error.message || 'Erro ao registrar pagamento manual');
        }
      },

      /**
       * Cancela a transação atual
       */
      cancelarTransacao: () => {
        const { transacaoAtual } = get();
        if (!transacaoAtual) return;

        set(state => ({
          transacaoAtual: state.transacaoAtual ? {
            ...state.transacaoAtual,
            status: 'cancelado',
            mensagem: 'Transação cancelada pelo operador'
          } : null,
          processando: false
        }));

        toast.info('Transação cancelada');
      },

      /**
       * Atualiza o status de uma transação
       */
      atualizarStatus: (id: string, status: StatusTransacao, mensagem?: string) => {
        set(state => ({
          transacoes: state.transacoes.map(t =>
            t.id === id ? { ...t, status, mensagem } : t
          ),
          transacaoAtual: state.transacaoAtual?.id === id
            ? { ...state.transacaoAtual, status, mensagem }
            : state.transacaoAtual
        }));
      },

      /**
       * Busca transações por venda
       */
      getTransacoesPorVenda: (vendaId: string) => {
        return get().transacoes.filter(t => t.vendaId === vendaId);
      },

      /**
       * Busca transações por período
       */
      getTransacoesPorPeriodo: (inicio: Date, fim: Date) => {
        return get().transacoes.filter(t => {
          const data = new Date(t.dataHora);
          return data >= inicio && data <= fim;
        });
      },

      /**
       * Configura um terminal
       */
      configurarTerminal: (config: ConfiguracaoTerminal) => {
        set(state => ({
          terminais: state.terminais.map(t =>
            t.tipo === config.tipo ? { ...t, ...config } : t
          )
        }));
        toast.success(`Terminal ${config.tipo} configurado com sucesso`);
      },

      /**
       * Configura dados da empresa (White Label)
       */
      setEmpresaConfig: (nome: string, logo?: string, cnpj?: string) => {
        set({
          empresaNome: nome,
          empresaLogo: logo,
          empresaCnpj: cnpj
        });
      },

      /**
       * Imprime comprovante não-fiscal
       */
      imprimirComprovante: (transacao: TransacaoCartao) => {
        const { empresaNome, empresaLogo, empresaCnpj } = get();
        
        const valorFormatado = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(transacao.valor);

        const dataFormatada = new Date(transacao.dataHora).toLocaleString('pt-BR');

        const conteudo = `
          <html>
            <head>
              <title>Comprovante de Pagamento</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; max-width: 300px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                .logo { max-width: 100px; margin-bottom: 10px; }
                .info { margin-bottom: 10px; }
                .label { font-weight: bold; }
                .valor { font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; font-size: 12px; }
                .status { text-align: center; padding: 10px; border-radius: 5px; margin: 20px 0; }
                .status.aprovado { background-color: #d4edda; color: #155724; }
                .status.recusado { background-color: #f8d7da; color: #721c24; }
              </style>
            </head>
            <body>
              <div class="header">
                ${empresaLogo ? `<img src="${empresaLogo}" class="logo" alt="${empresaNome}" />` : ''}
                <h2>${empresaNome}</h2>
                ${empresaCnpj ? `<p>CNPJ: ${empresaCnpj}</p>` : ''}
                <p>COMPROVANTE DE PAGAMENTO</p>
              </div>
              
              <div class="status ${transacao.status}">
                ${transacao.status.toUpperCase()}
              </div>

              <div class="info">
                <span class="label">Data:</span> ${dataFormatada}
              </div>
              <div class="info">
                <span class="label">ID da Transação:</span> ${transacao.id}
              </div>
              <div class="info">
                <span class="label">Terminal:</span> ${transacao.terminal.toUpperCase()}
              </div>
              <div class="info">
                <span class="label">Tipo:</span> ${transacao.tipo.toUpperCase()}
              </div>
              ${transacao.parcelas ? `<div class="info"><span class="label">Parcelas:</span> ${transacao.parcelas}x</div>` : ''}
              ${transacao.bandeira ? `<div class="info"><span class="label">Bandeira:</span> ${transacao.bandeira.toUpperCase()}</div>` : ''}
              ${transacao.nsu ? `<div class="info"><span class="label">NSU:</span> ${transacao.nsu}</div>` : ''}
              ${transacao.autorizacao ? `<div class="info"><span class="label">Autorização:</span> ${transacao.autorizacao}</div>` : ''}
              ${transacao.ultimos4Digitos ? `<div class="info"><span class="label">Cartão:</span> **** **** **** ${transacao.ultimos4Digitos}</div>` : ''}

              <div class="valor">
                ${valorFormatado}
              </div>

              <div class="footer">
                <p>Documento não-fiscal</p>
                <p>Obrigado pela preferência!</p>
              </div>
            </body>
          </html>
        `;

        const win = window.open('', '_blank');
        if (win) {
          win.document.write(conteudo);
          win.document.close();
          win.print();
        }
      },

      /**
       * Limpa a transação atual
       */
      limparTransacaoAtual: () => {
        set({ transacaoAtual: null, processando: false, modoManual: false });
      }
    }),
    { name: "pdv-pagamento-cartao" }
  )
);
