// src/services/biometriaService.ts
// Serviço de Integração com Relógios Biométricos - PDV Brasil
// Integração para registro de ponto via biometria (digital, facial, reconhecimento)
// Versão: 1.0

export interface DispositivoBiometrico {
  id: string;
  nome: string;
  tipo: 'digital' | 'facial' | 'reconhecimento';
  modelo: string;
  fabricante: string;
  enderecoIP: string;
  porta: number;
  status: 'online' | 'offline' | 'erro';
  ultimaSincronizacao?: string;
}

export interface TemplateBiometrico {
  colaboradorId: string;
  colaboradorNome: string;
  tipo: 'digital' | 'facial';
  dados: string; // Dados criptografados do template
  qualidade: number; // 0-100
  dataCadastro: string;
}

export interface RegistroBiometrico {
  id: string;
  dispositivoId: string;
  colaboradorId: string;
  colaboradorNome: string;
  tipo: 'digital' | 'facial' | 'reconhecimento';
  dataHora: string;
  confianca: number; // 0-100
  status: 'valido' | 'invalido' | 'suspeito';
  foto?: string; // Base64 para reconhecimento facial
}

export interface ConfiguracaoBiometria {
  limiarConfianca: number; // 0-100
  exigirFoto: boolean;
  exigirGeolocalizacao: boolean;
  tentativasMaximas: number;
}

class BiometriaService {
  private dispositivos: DispositivoBiometrico[] = [];
  private templates: TemplateBiometrico[] = [];
  private registros: RegistroBiometrico[] = [];
  private configuracao: ConfiguracaoBiometria = {
    limiarConfianca: 80,
    exigirFoto: true,
    exigirGeolocalizacao: true,
    tentativasMaximas: 3,
  };

  /**
   * Configura parâmetros de biometria
   */
  configurar(config: Partial<ConfiguracaoBiometria>): void {
    this.configuracao = { ...this.configuracao, ...config };
  }

  /**
   * Adiciona um dispositivo biométrico
   */
  adicionarDispositivo(dispositivo: Omit<DispositivoBiometrico, 'status'>): void {
    const novoDispositivo: DispositivoBiometrico = {
      ...dispositivo,
      status: 'offline',
    };
    this.dispositivos.push(novoDispositivo);
  }

  /**
   * Remove um dispositivo biométrico
   */
  removerDispositivo(id: string): boolean {
    const index = this.dispositivos.findIndex(d => d.id === id);
    if (index !== -1) {
      this.dispositivos.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Lista todos os dispositivos biométricos
   */
  listarDispositivos(): DispositivoBiometrico[] {
    return this.dispositivos;
  }

  /**
   * Busca dispositivo por ID
   */
  buscarDispositivo(id: string): DispositivoBiometrico | undefined {
    return this.dispositivos.find(d => d.id === id);
  }

  /**
   * Verifica status de um dispositivo
   */
  async verificarStatusDispositivo(id: string): Promise<'online' | 'offline' | 'erro'> {
    const dispositivo = this.dispositivos.find(d => d.id === id);
    if (!dispositivo) {
      throw new Error('Dispositivo não encontrado');
    }

    try {
      // Simular verificação de status via ping
      await this.simularPing(dispositivo.enderecoIP, dispositivo.porta);
      dispositivo.status = 'online';
      dispositivo.ultimaSincronizacao = new Date().toISOString();
      return 'online';
    } catch (error) {
      dispositivo.status = 'erro';
      return 'erro';
    }
  }

  /**
   * Cadastra template biométrico de um colaborador
   */
  async cadastrarTemplate(
    colaboradorId: string,
    colaboradorNome: string,
    tipo: 'digital' | 'facial',
    dados: string
  ): Promise<TemplateBiometrico> {
    // Validar qualidade dos dados (simulado)
    const qualidade = this.validarQualidadeDados(dados, tipo);
    if (qualidade < this.configuracao.limiarConfianca) {
      throw new Error(`Qualidade insuficiente: ${qualidade}% (mínimo: ${this.configuracao.limiarConfianca}%)`);
    }

    const template: TemplateBiometrico = {
      colaboradorId,
      colaboradorNome,
      tipo,
      dados: this.criptografarDados(dados),
      qualidade,
      dataCadastro: new Date().toISOString(),
    };

    this.templates.push(template);
    return template;
  }

  /**
   * Remove template biométrico
   */
  removerTemplate(colaboradorId: string, tipo: 'digital' | 'facial'): boolean {
    const index = this.templates.findIndex(
      t => t.colaboradorId === colaboradorId && t.tipo === tipo
    );
    if (index !== -1) {
      this.templates.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Busca template de um colaborador
   */
  buscarTemplate(colaboradorId: string, tipo: 'digital' | 'facial'): TemplateBiometrico | undefined {
    return this.templates.find(t => t.colaboradorId === colaboradorId && t.tipo === tipo);
  }

  /**
   * Lista todos os templates
   */
  listarTemplates(): TemplateBiometrico[] {
    return this.templates;
  }

  /**
   * Processa registro de ponto via biometria
   */
  async processarRegistroBiometrico(
    dispositivoId: string,
    tipo: 'digital' | 'facial' | 'reconhecimento',
    dadosCapturados: string,
    foto?: string
  ): Promise<RegistroBiometrico> {
    const dispositivo = this.dispositivos.find(d => d.id === dispositivoId);
    if (!dispositivo) {
      throw new Error('Dispositivo não encontrado');
    }

    if (dispositivo.status !== 'online') {
      throw new Error('Dispositivo offline');
    }

    // Buscar colaborador correspondente aos dados biométricos
    const colaborador = await this.identificarColaborador(dadosCapturados, tipo);
    if (!colaborador) {
      throw new Error('Colaborador não identificado');
    }

    // Calcular confiança da correspondência
    const confianca = this.calcularConfianca(dadosCapturados, colaborador.dados, tipo);

    const registro: RegistroBiometrico = {
      id: `bio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dispositivoId,
      colaboradorId: colaborador.colaboradorId,
      colaboradorNome: colaborador.colaboradorNome,
      tipo,
      dataHora: new Date().toISOString(),
      confianca,
      status: confianca >= this.configuracao.limiarConfianca ? 'valido' : 'suspeito',
      foto: tipo === 'facial' || tipo === 'reconhecimento' ? foto : undefined,
    };

    this.registros.push(registro);
    return registro;
  }

  /**
   * Identifica colaborador a partir de dados biométricos
   */
  private async identificarColaborador(
    dadosCapturados: string,
    tipo: 'digital' | 'facial' | 'reconhecimento'
  ): Promise<{ colaboradorId: string; colaboradorNome: string; dados: string } | null> {
    // Buscar templates do tipo correspondente
    const templates = this.templates.filter(t => t.tipo === tipo);

    for (const template of templates) {
      const dadosDescriptografados = this.descriptografarDados(template.dados);
      const correspondencia = this.verificarCorrespondencia(
        dadosCapturados,
        dadosDescriptografados,
        tipo
      );

      if (correspondencia) {
        return {
          colaboradorId: template.colaboradorId,
          colaboradorNome: template.colaboradorNome,
          dados: dadosDescriptografados,
        };
      }
    }

    return null;
  }

  /**
   * Verifica correspondência entre dados biométricos
   */
  private verificarCorrespondencia(
    dados1: string,
    dados2: string,
    tipo: 'digital' | 'facial' | 'reconhecimento'
  ): boolean {
    // Simulação simplificada - em produção usaria algoritmos reais
    const distância = this.calcularDistancia(dados1, dados2);
    return distância > 0.85; // 85% de similaridade
  }

  /**
   * Calcula confiança da correspondência
   */
  private calcularConfianca(
    dadosCapturados: string,
    dadosTemplate: string,
    tipo: 'digital' | 'facial' | 'reconhecimento'
  ): number {
    const distancia = this.calcularDistancia(dadosCapturados, dadosTemplate);
    return Math.round(distancia * 100);
  }

  /**
   * Calcula distância/similaridade entre dados biométricos (simulado)
   */
  private calcularDistancia(dados1: string, dados2: string): number {
    // Simulação - em produção usaria algoritmos específicos
    const hash1 = this.simpleHash(dados1);
    const hash2 = this.simpleHash(dados2);
    const diff = Math.abs(hash1 - hash2);
    return Math.max(0, 1 - diff / 1000000);
  }

  /**
   * Valida qualidade dos dados biométricos
   */
  private validarQualidadeDados(dados: string, tipo: 'digital' | 'facial'): number {
    // Simulação - em produção usaria algoritmos de qualidade
    const tamanho = dados.length;
    const qualidadeBase = Math.min(100, (tamanho / 1000) * 100);
    return Math.round(qualidadeBase + (Math.random() * 20 - 10));
  }

  /**
   * Criptografa dados biométricos
   */
  private criptografarDados(dados: string): string {
    // Simulação - em produção usaria criptografia real (AES-256)
    return btoa(dados + '|' + Date.now());
  }

  /**
   * Descriptografa dados biométricos
   */
  private descriptografarDados(dadosCriptografados: string): string {
    // Simulação - em produção usaria descriptografia real
    try {
      return atob(dadosCriptografados).split('|')[0];
    } catch {
      return dadosCriptografados;
    }
  }

  /**
   * Simula ping para dispositivo
   */
  private async simularPing(ip: string, porta: number): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simular 90% de sucesso
        if (Math.random() > 0.1) {
          resolve();
        } else {
          reject(new Error('Dispositivo não respondeu'));
        }
      }, 500);
    });
  }

  /**
   * Hash simples para simulação
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Lista registros biométricos
   */
  listarRegistros(filtro?: {
    colaboradorId?: string;
    dispositivoId?: string;
    dataInicio?: string;
    dataFim?: string;
  }): RegistroBiometrico[] {
    let registros = this.registros;

    if (filtro?.colaboradorId) {
      registros = registros.filter(r => r.colaboradorId === filtro.colaboradorId);
    }
    if (filtro?.dispositivoId) {
      registros = registros.filter(r => r.dispositivoId === filtro.dispositivoId);
    }
    if (filtro?.dataInicio) {
      registros = registros.filter(r => r.dataHora >= filtro.dataInicio!);
    }
    if (filtro?.dataFim) {
      registros = registros.filter(r => r.dataHora <= filtro.dataFim!);
    }

    return registros;
  }

  /**
   * Sincroniza dispositivos biométricos
   */
  async sincronizarDispositivos(): Promise<{ sucesso: number; falha: number }> {
    let sucesso = 0;
    let falha = 0;

    for (const dispositivo of this.dispositivos) {
      try {
        await this.verificarStatusDispositivo(dispositivo.id);
        sucesso++;
      } catch {
        falha++;
      }
    }

    return { sucesso, falha };
  }

  /**
   * Retorna estatísticas
   */
  getEstatisticas(): {
    dispositivosOnline: number;
    dispositivosOffline: number;
    totalTemplates: number;
    totalRegistros: number;
    registrosValidos: number;
    registrosSuspeitos: number;
  } {
    return {
      dispositivosOnline: this.dispositivos.filter(d => d.status === 'online').length,
      dispositivosOffline: this.dispositivos.filter(d => d.status === 'offline').length,
      totalTemplates: this.templates.length,
      totalRegistros: this.registros.length,
      registrosValidos: this.registros.filter(r => r.status === 'valido').length,
      registrosSuspeitos: this.registros.filter(r => r.status === 'suspeito').length,
    };
  }
}

// Exportar instância singleton
export const biometriaService = new BiometriaService();

// Hook React para usar o serviço
export function useBiometriaService() {
  return {
    configurar: biometriaService.configurar.bind(biometriaService),
    adicionarDispositivo: biometriaService.adicionarDispositivo.bind(biometriaService),
    removerDispositivo: biometriaService.removerDispositivo.bind(biometriaService),
    listarDispositivos: biometriaService.listarDispositivos.bind(biometriaService),
    buscarDispositivo: biometriaService.buscarDispositivo.bind(biometriaService),
    verificarStatusDispositivo: biometriaService.verificarStatusDispositivo.bind(biometriaService),
    cadastrarTemplate: biometriaService.cadastrarTemplate.bind(biometriaService),
    removerTemplate: biometriaService.removerTemplate.bind(biometriaService),
    buscarTemplate: biometriaService.buscarTemplate.bind(biometriaService),
    listarTemplates: biometriaService.listarTemplates.bind(biometriaService),
    processarRegistroBiometrico: biometriaService.processarRegistroBiometrico.bind(biometriaService),
    listarRegistros: biometriaService.listarRegistros.bind(biometriaService),
    sincronizarDispositivos: biometriaService.sincronizarDispositivos.bind(biometriaService),
    getEstatisticas: biometriaService.getEstatisticas.bind(biometriaService),
  };
}
