// src/services/bancoService.ts
// Serviço de Integração com APIs de Bancos - PDV Brasil
// Integração para pagamentos de folha de pagamento, TED/PIX e conciliação
// Versão: 1.0

export interface Banco {
  codigo: string;
  nome: string;
  ispb: string;
}

export interface ContaBancaria {
  banco: string;
  agencia: string;
  conta: string;
  tipo: 'corrente' | 'poupanca';
  pix?: {
    chave: string;
    tipo: 'cpf' | 'email' | 'telefone' | 'chave_aleatoria';
  };
}

export interface PagamentoFolha {
  colaboradorId: string;
  colaboradorNome: string;
  cpf: string;
  conta: ContaBancaria;
  valor: number;
  descricao: string;
  dataPagamento: string;
}

export interface TransacaoBancaria {
  id: string;
  tipo: 'pix' | 'ted' | 'boleto';
  valor: number;
  status: 'pendente' | 'processando' | 'concluido' | 'falhou';
  dataCriacao: string;
  dataConclusao?: string;
  codigoAutenticacao?: string;
  recibo?: string;
}

export interface ConfiguracaoBanco {
  apiKey: string;
  apiSecret: string;
  ambiente: 'sandbox' | 'producao';
}

/**
 * Lista de bancos brasileiros cadastrados no BCB
 */
const BANCOS_BRASILEIROS: Banco[] = [
  { codigo: '001', nome: 'Banco do Brasil S.A.', ispb: '00000000' },
  { codigo: '033', nome: 'Banco Santander (Brasil) S.A.', ispb: '90400888' },
  { codigo: '104', nome: 'Caixa Econômica Federal', ispb: '00360305' },
  { codigo: '237', nome: 'Banco Bradesco S.A.', ispb: '60746948' },
  { codigo: '341', nome: 'Itaú Unibanco S.A.', ispb: '60701190' },
  { codigo: '260', nome: 'Nu Pagamentos S.A. (Nubank)', ispb: '18236120' },
  { codigo: '336', nome: 'Banco C6 S.A. (C6 Bank)', ispb: '33479023' },
  { codigo: '077', nome: 'Banco Inter S.A.', ispb: '00416960' },
  { codigo: '380', nome: 'PicPay Serviços S.A.', ispb: '18185660' },
  { codigo: '290', nome: 'PagSeguro Internet S.A.', ispb: '16956888' },
];

class BancoService {
  private configuracao: ConfiguracaoBanco | null = null;
  private transacoes: TransacaoBancaria[] = [];

  /**
   * Configura as credenciais da API bancária
   */
  configurar(config: ConfiguracaoBanco): void {
    this.configuracao = config;
  }

  /**
   * Retorna lista de bancos brasileiros
   */
  listarBancos(): Banco[] {
    return BANCOS_BRASILEIROS;
  }

  /**
   * Busca banco por código
   */
  buscarBancoPorCodigo(codigo: string): Banco | undefined {
    return BANCOS_BRASILEIROS.find(b => b.codigo === codigo);
  }

  /**
   * Valida CPF (algoritmo oficial)
   */
  validarCPF(cpf: string): boolean {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    let soma = 0;
    let resto;

    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }

    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }

    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;

    return true;
  }

  /**
   * Valida chave PIX
   */
  validarChavePix(chave: string, tipo: string): boolean {
    switch (tipo) {
      case 'cpf':
        return this.validarCPF(chave);
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(chave);
      case 'telefone':
        return /^(\+?55)?(\d{2})?(\d{9})$/.test(chave.replace(/\D/g, ''));
      case 'chave_aleatoria':
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chave);
      default:
        return false;
    }
  }

  /**
   * Processa pagamento via PIX
   */
  async processarPIX(
    chaveDestino: string,
    valor: number,
    descricao: string
  ): Promise<TransacaoBancaria> {
    if (!this.configuracao) {
      throw new Error('Configuração bancária não definida');
    }

    const transacao: TransacaoBancaria = {
      id: `pix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tipo: 'pix',
      valor,
      status: 'pendente',
      dataCriacao: new Date().toISOString(),
    };

    try {
      // Simular chamada à API do banco
      transacao.status = 'processando';
      this.transacoes.push(transacao);

      // Em produção, aqui seria a chamada real à API
      await this.simularProcessamento();

      transacao.status = 'concluido';
      transacao.dataConclusao = new Date().toISOString();
      transacao.codigoAutenticacao = this.gerarCodigoAutenticacao();
      transacao.recibo = `REC-${Date.now()}`;

      return transacao;
    } catch (error) {
      transacao.status = 'falhou';
      throw error;
    }
  }

  /**
   * Processa TED (Transferência Eletrônica Disponível)
   */
  async processarTED(
    contaDestino: ContaBancaria,
    valor: number,
    descricao: string
  ): Promise<TransacaoBancaria> {
    if (!this.configuracao) {
      throw new Error('Configuração bancária não definida');
    }

    if (valor > 5000) {
      throw new Error('Valor acima do limite para TED semanal');
    }

    const transacao: TransacaoBancaria = {
      id: `ted-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tipo: 'ted',
      valor,
      status: 'pendente',
      dataCriacao: new Date().toISOString(),
    };

    try {
      transacao.status = 'processando';
      this.transacoes.push(transacao);

      await this.simularProcessamento();

      transacao.status = 'concluido';
      transacao.dataConclusao = new Date().toISOString();
      transacao.codigoAutenticacao = this.gerarCodigoAutenticacao();
      transacao.recibo = `TED-${Date.now()}`;

      return transacao;
    } catch (error) {
      transacao.status = 'falhou';
      throw error;
    }
  }

  /**
   * Processa lote de pagamentos de folha
   */
  async processarFolhaPagamento(
    pagamentos: PagamentoFolha[]
  ): Promise<TransacaoBancaria[]> {
    if (!this.configuracao) {
      throw new Error('Configuração bancária não definida');
    }

    const transacoes: TransacaoBancaria[] = [];

    for (const pagamento of pagamentos) {
      try {
        const transacao = await this.processarPIX(
          pagamento.conta.pix?.chave || '',
          pagamento.valor,
          pagamento.descricao
        );
        transacoes.push(transacao);
      } catch (error) {
        console.error(`Erro ao processar pagamento para ${pagamento.colaboradorNome}:`, error);
      }
    }

    return transacoes;
  }

  /**
   * Consulta status de uma transação
   */
  consultarTransacao(id: string): TransacaoBancaria | undefined {
    return this.transacoes.find(t => t.id === id);
  }

  /**
   * Retorna histórico de transações
   */
  listarTransacoes(): TransacaoBancaria[] {
    return this.transacoes;
  }

  /**
   * Gera código de autenticação para transação
   */
  private gerarCodigoAutenticacao(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /**
   * Simula processamento assíncrono (em produção, seria chamada real à API)
   */
  private async simularProcessamento(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 2000));
  }

  /**
   * Cancela uma transação pendente
   */
  cancelarTransacao(id: string): boolean {
    const transacao = this.transacoes.find(t => t.id === id);
    if (transacao && transacao.status === 'pendente') {
      transacao.status = 'falhou';
      return true;
    }
    return false;
  }

  /**
   * Retorna estatísticas de transações
   */
  getEstatisticas(): {
    total: number;
    concluidas: number;
    pendentes: number;
    falhas: number;
    valorTotal: number;
  } {
    return {
      total: this.transacoes.length,
      concluidas: this.transacoes.filter(t => t.status === 'concluido').length,
      pendentes: this.transacoes.filter(t => t.status === 'pendente').length,
      falhas: this.transacoes.filter(t => t.status === 'falhou').length,
      valorTotal: this.transacoes
        .filter(t => t.status === 'concluido')
        .reduce((acc, t) => acc + t.valor, 0),
    };
  }
}

// Exportar instância singleton
export const bancoService = new BancoService();

// Hook React para usar o serviço
export function useBancoService() {
  return {
    configurar: bancoService.configurar.bind(bancoService),
    listarBancos: bancoService.listarBancos.bind(bancoService),
    buscarBancoPorCodigo: bancoService.buscarBancoPorCodigo.bind(bancoService),
    validarCPF: bancoService.validarCPF.bind(bancoService),
    validarChavePix: bancoService.validarChavePix.bind(bancoService),
    processarPIX: bancoService.processarPIX.bind(bancoService),
    processarTED: bancoService.processarTED.bind(bancoService),
    processarFolhaPagamento: bancoService.processarFolhaPagamento.bind(bancoService),
    consultarTransacao: bancoService.consultarTransacao.bind(bancoService),
    listarTransacoes: bancoService.listarTransacoes.bind(bancoService),
    cancelarTransacao: bancoService.cancelarTransacao.bind(bancoService),
    getEstatisticas: bancoService.getEstatisticas.bind(bancoService),
  };
}
