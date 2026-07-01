// src/services/offlineSync.ts
// Sistema de Sincronização Offline - PDV Brasil
// Service Worker e gerenciamento de sincronização para funcionamento offline
// Versão: 1.0

export interface SyncItem {
  id: string;
  tipo: 'registro_ponto' | 'escala' | 'banco_horas' | 'alerta';
  dados: any;
  status: 'pendente' | 'sincronizando' | 'concluido' | 'falhou';
  tentativas: number;
  dataCriacao: string;
  ultimaTentativa?: string;
  erro?: string;
}

export interface SyncStatus {
  online: boolean;
  itensPendentes: number;
  itensSincronizando: number;
  ultimaSincronizacao?: string;
  totalSincronizado: number;
}

class OfflineSyncService {
  private filaSincronizacao: SyncItem[] = [];
  private online: boolean = true;
  private sincronizando: boolean = false;
  private listeners: ((status: SyncStatus) => void)[] = [];

  constructor() {
    this.inicializar();
  }

  /**
   * Inicializa o serviço de sincronização
   */
  private inicializar(): void {
    // Verificar status de conexão
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.online = true;
        this.notificarListeners();
        this.processarFila();
      });

      window.addEventListener('offline', () => {
        this.online = false;
        this.notificarListeners();
      });

      this.online = navigator.onLine;
    }

    // Carregar fila persistida
    this.carregarFilaPersistida();
  }

  /**
   * Adiciona item à fila de sincronização
   */
  adicionarItemFila(tipo: SyncItem['tipo'], dados: any): string {
    const item: SyncItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tipo,
      dados,
      status: 'pendente',
      tentativas: 0,
      dataCriacao: new Date().toISOString(),
    };

    this.filaSincronizacao.push(item);
    this.persistirFila();
    this.notificarListeners();

    // Se online, tentar sincronizar imediatamente
    if (this.online && !this.sincronizando) {
      this.processarFila();
    }

    return item.id;
  }

  /**
   * Processa a fila de sincronização
   */
  private async processarFila(): Promise<void> {
    if (this.sincronizando || !this.online) {
      return;
    }

    this.sincronizando = true;
    this.notificarListeners();

    const itensPendentes = this.filaSincronizacao.filter(
      i => i.status === 'pendente' || i.status === 'falhou'
    );

    for (const item of itensPendentes) {
      if (!this.online) break;

      try {
        await this.sincronizarItem(item);
      } catch (error) {
        console.error(`Erro ao sincronizar item ${item.id}:`, error);
      }
    }

    this.sincronizando = false;
    this.notificarListeners();
  }

  /**
   * Sincroniza um item individual
   */
  private async sincronizarItem(item: SyncItem): Promise<void> {
    item.status = 'sincronizando';
    item.tentativas++;
    item.ultimaTentativa = new Date().toISOString();
    this.persistirFila();
    this.notificarListeners();

    try {
      // Simular chamada à API
      await this.enviarParaAPI(item);

      item.status = 'concluido';
      this.removerItemFila(item.id);
    } catch (error) {
      item.status = 'falhou';
      item.erro = error instanceof Error ? error.message : 'Erro desconhecido';

      // Se excedeu tentativas máximas, mantém como falha
      if (item.tentativas >= 5) {
        console.error(`Item ${item.id} falhou após ${item.tentativas} tentativas`);
      }

      this.persistirFila();
    }

    this.notificarListeners();
  }

  /**
   * Envia item para API (simulado)
   */
  private async enviarParaAPI(item: SyncItem): Promise<void> {
    // Simular latência de rede
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simular 95% de sucesso
    if (Math.random() > 0.05) {
      return;
    }

    throw new Error('Erro de conexão com servidor');
  }

  /**
   * Remove item da fila
   */
  private removerItemFila(id: string): void {
    const index = this.filaSincronizacao.findIndex(i => i.id === id);
    if (index !== -1) {
      this.filaSincronizacao.splice(index, 1);
      this.persistirFila();
    }
  }

  /**
   * Persiste fila no localStorage
   */
  private persistirFila(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pdv-sync-fila', JSON.stringify(this.filaSincronizacao));
    }
  }

  /**
   * Carrega fila do localStorage
   */
  private carregarFilaPersistida(): void {
    if (typeof localStorage !== 'undefined') {
      const filaSalva = localStorage.getItem('pdv-sync-fila');
      if (filaSalva) {
        try {
          this.filaSincronizacao = JSON.parse(filaSalva);
        } catch (error) {
          console.error('Erro ao carregar fila de sincronização:', error);
        }
      }
    }
  }

  /**
   * Registra listener para mudanças de status
   */
  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.listeners.push(callback);
    callback(this.getStatus());

    // Retorna função para remover listener
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notifica todos os listeners
   */
  private notificarListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }

  /**
   * Retorna status atual de sincronização
   */
  getStatus(): SyncStatus {
    return {
      online: this.online,
      itensPendentes: this.filaSincronizacao.filter(i => i.status === 'pendente').length,
      itensSincronizando: this.filaSincronizacao.filter(i => i.status === 'sincronizando').length,
      ultimaSincronizacao: this.filaSincronizacao
        .filter(i => i.status === 'concluido')
        .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())[0]
        ?.dataCriacao,
      totalSincronizado: this.filaSincronizacao.filter(i => i.status === 'concluido').length,
    };
  }

  /**
   * Força sincronização manual
   */
  forcarSincronizacao(): Promise<void> {
    return this.processarFila();
  }

  /**
   * Limpa itens concluídos da fila
   */
  limparConcluidos(): void {
    this.filaSincronizacao = this.filaSincronizacao.filter(i => i.status !== 'concluido');
    this.persistirFila();
    this.notificarListeners();
  }

  /**
   * Retorna todos os itens da fila
   */
  listarFila(): SyncItem[] {
    return this.filaSincronizacao;
  }

  /**
   * Remove item específico da fila
   */
  removerItem(id: string): boolean {
    const index = this.filaSincronizacao.findIndex(i => i.id === id);
    if (index !== -1) {
      this.filaSincronizacao.splice(index, 1);
      this.persistirFila();
      this.notificarListeners();
      return true;
    }
    return false;
  }

  /**
   * Reenvia item falhado
   */
  reenviarItem(id: string): void {
    const item = this.filaSincronizacao.find(i => i.id === id);
    if (item) {
      item.status = 'pendente';
      item.tentativas = 0;
      item.erro = undefined;
      this.persistirFila();
      this.notificarListeners();

      if (this.online && !this.sincronizando) {
        this.processarFila();
      }
    }
  }

  /**
   * Limpa toda a fila
   */
  limparFila(): void {
    this.filaSincronizacao = [];
    this.persistirFila();
    this.notificarListeners();
  }

  /**
   * Retorna estatísticas detalhadas
   */
  getEstatisticas(): {
    total: number;
    pendentes: number;
    sincronizando: number;
    concluidos: number;
    falhados: number;
    porTipo: Record<string, number>;
  } {
    const porTipo: Record<string, number> = {};

    this.filaSincronizacao.forEach(item => {
      porTipo[item.tipo] = (porTipo[item.tipo] || 0) + 1;
    });

    return {
      total: this.filaSincronizacao.length,
      pendentes: this.filaSincronizacao.filter(i => i.status === 'pendente').length,
      sincronizando: this.filaSincronizacao.filter(i => i.status === 'sincronizando').length,
      concluidos: this.filaSincronizacao.filter(i => i.status === 'concluido').length,
      falhados: this.filaSincronizacao.filter(i => i.status === 'falhou').length,
      porTipo,
    };
  }
}

// Exportar instância singleton
export const offlineSyncService = new OfflineSyncService();

// Hook React para usar o serviço
export function useOfflineSync() {
  const [status, setStatus] = React.useState<SyncStatus>(offlineSyncService.getStatus());

  React.useEffect(() => {
    const unsubscribe = offlineSyncService.onStatusChange(setStatus);
    return unsubscribe;
  }, []);

  return {
    status,
    adicionarItemFila: offlineSyncService.adicionarItemFila.bind(offlineSyncService),
    forcarSincronizacao: offlineSyncService.forcarSincronizacao.bind(offlineSyncService),
    limparConcluidos: offlineSyncService.limparConcluidos.bind(offlineSyncService),
    listarFila: offlineSyncService.listarFila.bind(offlineSyncService),
    removerItem: offlineSyncService.removerItem.bind(offlineSyncService),
    reenviarItem: offlineSyncService.reenviarItem.bind(offlineSyncService),
    limparFila: offlineSyncService.limparFila.bind(offlineSyncService),
    getEstatisticas: offlineSyncService.getEstatisticas.bind(offlineSyncService),
  };
}

// Import React para o hook (no topo do arquivo seria melhor, mas funciona aqui)
import React from 'react';
