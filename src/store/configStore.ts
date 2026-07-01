// src/store/configStore.ts
// Store de Configurações do Sistema - PDV Brasil
// Gerenciamento de configurações white label e sistema
// @version 1.0

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ConfiguracaoSistema {
  // White Label
  nomeEmpresa: string;
  logoUrl?: string;
  logoBase64?: string;
  corPrimaria: string;
  corSecundaria: string;
  
  // Informações da Empresa
  cnpj?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  site?: string;
  
  // Configurações do Sistema
  tema: 'light' | 'dark' | 'system';
  idioma: 'pt-BR' | 'en-US' | 'es-ES';
  moeda: 'BRL' | 'USD' | 'EUR';
  
  // Configurações de Caixa
  permitirVendaSemEstoque: boolean;
  exigirCpfParaNotaFiscal: boolean;
  limiteValorVenda: number;
  bloquearFechamentoVendasPendentes: boolean;
  
  // Configurações de Ponto
  permitirAjustePonto: boolean;
  exigirFotoParaPonto: boolean;
  toleranciaAtrasoMinutos: number;
  
  // Configurações de Impressoras
  impressoras: {
    fiscal: {
      habilitado: boolean;
      modelo: string;
      porta: string;
      velocidade: number;
    };
    naoFiscal: {
      habilitado: boolean;
      modelo: string;
      porta: string;
      formatoPapel: '58mm' | '80mm';
      copiasPorVenda: number;
    };
    balanca: {
      habilitado: boolean;
      modelo: string;
      porta: string;
      velocidade: number;
    };
  };
  
  // Configurações de Pagamentos
  pagamentos: {
    formaPagamentoPadrao: string;
    formasPagamento: Array<{
      id: string;
      nome: string;
      ativo: boolean;
      taxa: number;
      exigeTroco: boolean;
    }>;
    trocoAutomatico: boolean;
  };
  
  // Configurações de Nota Fiscal
  notaFiscal: {
    nfe: {
      habilitado: boolean;
      ambiente: 'homologacao' | 'producao';
      serie: string;
      numeroInicial: number;
    };
    nfce: {
      habilitado: boolean;
      ambiente: 'homologacao' | 'producao';
      csc: string;
      cscId: string;
    };
    certificadoDigital: {
      arquivo: string;
      senha: string;
    };
  };
  
  // Configurações de Tributos
  tributos: {
    regimeTributario: 'simples' | 'lucro_presumido' | 'lucro_real';
    icms: {
      aliquota: number;
      baseCalculo: string;
    };
    iss: {
      aliquota: number;
      municipio: string;
    };
  };
  
  // Configurações de TEF
  tef: {
    habilitado: boolean;
    adquirente: string;
    terminalId: string;
    estabelecimento: string;
    maquininhas: Array<{
      id: string;
      nome: string;
      modelo: string;
      porta: string;
      ativo: boolean;
    }>;
  };
  
  // Configurações de Pix
  pix: {
    habilitado: boolean;
    chavePix: string;
    tipoChave: 'cpf' | 'email' | 'telefone' | 'aleatoria';
    qrCodeBase64?: string;
    banco: string;
    beneficiario: string;
    cidade: string;
  };
}

interface ConfigState {
  configuracao: ConfiguracaoSistema;
  atualizarConfiguracao: (config: Partial<ConfiguracaoSistema>) => void;
  resetarConfiguracao: () => void;
  getConfiguracao: () => ConfiguracaoSistema;
}

const configuracaoPadrao: ConfiguracaoSistema = {
  nomeEmpresa: "PDV Brasil",
  corPrimaria: "#6366f1",
  corSecundaria: "#8b5cf6",
  tema: 'system',
  idioma: 'pt-BR',
  moeda: 'BRL',
  permitirVendaSemEstoque: false,
  exigirCpfParaNotaFiscal: false,
  limiteValorVenda: 10000,
  bloquearFechamentoVendasPendentes: true,
  permitirAjustePonto: true,
  exigirFotoParaPonto: false,
  toleranciaAtrasoMinutos: 15,
  impressoras: {
    fiscal: {
      habilitado: false,
      modelo: '',
      porta: '',
      velocidade: 9600,
    },
    naoFiscal: {
      habilitado: false,
      modelo: '',
      porta: '',
      formatoPapel: '58mm',
      copiasPorVenda: 1,
    },
    balanca: {
      habilitado: false,
      modelo: '',
      porta: '',
      velocidade: 9600,
    },
  },
  pagamentos: {
    formaPagamentoPadrao: 'dinheiro',
    formasPagamento: [
      { id: 'dinheiro', nome: 'Dinheiro', ativo: true, taxa: 0, exigeTroco: true },
      { id: 'credito', nome: 'Crédito', ativo: true, taxa: 0, exigeTroco: false },
      { id: 'debito', nome: 'Débito', ativo: true, taxa: 0, exigeTroco: false },
      { id: 'pix', nome: 'PIX', ativo: true, taxa: 0, exigeTroco: false },
    ],
    trocoAutomatico: true,
  },
  notaFiscal: {
    nfe: {
      habilitado: false,
      ambiente: 'homologacao',
      serie: '1',
      numeroInicial: 1,
    },
    nfce: {
      habilitado: false,
      ambiente: 'homologacao',
      csc: '',
      cscId: '',
    },
    certificadoDigital: {
      arquivo: '',
      senha: '',
    },
  },
  tributos: {
    regimeTributario: 'simples',
    icms: {
      aliquota: 17,
      baseCalculo: 'valor_total',
    },
    iss: {
      aliquota: 5,
      municipio: '',
    },
  },
  tef: {
    habilitado: false,
    adquirente: '',
    terminalId: '',
    estabelecimento: '',
    maquininhas: [],
  },
  pix: {
    habilitado: false,
    chavePix: '',
    tipoChave: 'cpf',
    qrCodeBase64: '',
    banco: '',
    beneficiario: '',
    cidade: '',
  },
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      configuracao: configuracaoPadrao,

      atualizarConfiguracao: (novaConfig) => {
        set((state) => ({
          configuracao: { ...state.configuracao, ...novaConfig }
        }));
      },

      resetarConfiguracao: () => {
        set({ configuracao: configuracaoPadrao });
      },

      getConfiguracao: () => {
        return get().configuracao;
      },
    }),
    {
      name: "pdv-config",
    }
  )
);

// Hook React para usar o store
export function useConfig() {
  return useConfigStore((state) => ({
    configuracao: state.configuracao,
    atualizarConfiguracao: state.atualizarConfiguracao,
    resetarConfiguracao: state.resetarConfiguracao,
  }));
}

// Função para sincronizar dados da empresa com configurações
export function sincronizarEmpresaComConfiguracao(empresa: any) {
  const store = useConfigStore.getState();
  store.atualizarConfiguracao({
    nomeEmpresa: empresa.nome,
    cnpj: empresa.cnpj,
    telefone: empresa.telefone,
    endereco: empresa.endereco,
    email: empresa.email,
    site: empresa.site,
  });
}
