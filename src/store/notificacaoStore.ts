// src/store/notificacaoStore.ts
// Sistema de Notificações Push - PDV Brasil
// Versão: 1.0

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TipoNotificacao = 
  | 'atraso_recorrente' 
  | 'multiplos_atrasos'
  | 'fraude_detectada'
  | 'ajuste_pendente'
  | 'badge_conquistado'
  | 'bonal_recebido'
  | 'escala_conflito'
  | 'justificativa_aprovada'
  | 'justificativa_rejeitada';

export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  data: string;
  lida: boolean;
  colaboradorId?: string;
  colaboradorNome?: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
}

interface NotificacaoState {
  notificacoes: Notificacao[];
  naoLidas: number;
  adicionarNotificacao: (notificacao: Omit<Notificacao, 'id' | 'data' | 'lida'>) => void;
  marcarComoLida: (id: string) => void;
  marcarTodasComoLidas: () => void;
  limparNotificacoes: () => void;
  removerNotificacao: (id: string) => void;
  getNotificacoesPorTipo: (tipo: TipoNotificacao) => Notificacao[];
  getNotificacoesPorPrioridade: (prioridade: 'alta' | 'urgente') => Notificacao[];
}

export const useNotificacaoStore = create<NotificacaoState>()(
  persist(
    (set, get) => ({
      notificacoes: [],
      naoLidas: 0,

      adicionarNotificacao: (notificacao) => set((state) => {
        const nova: Notificacao = {
          ...notificacao,
          id: `not-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          data: new Date().toISOString(),
          lida: false,
        };
        
        // Reproduzir som de notificação (opcional)
        if (typeof window !== 'undefined' && 'AudioContext' in window) {
          try {
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.1;
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
          } catch (e) {
            // Ignorar erros de áudio
          }
        }

        // Solicitar permissão para notificações do navegador
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(notificacao.titulo, {
            body: notificacao.mensagem,
            icon: '/favicon.ico',
            tag: nova.id,
            requireInteraction: notificacao.prioridade === 'urgente',
          });
        }

        return {
          notificacoes: [nova, ...state.notificacoes].slice(0, 50), // Manter apenas as últimas 50
          naoLidas: state.naoLidas + 1,
        };
      }),

      marcarComoLida: (id) => set((state) => ({
        notificacoes: state.notificacoes.map((n) =>
          n.id === id ? { ...n, lida: true } : n
        ),
        naoLidas: Math.max(0, state.naoLidas - 1),
      })),

      marcarTodasComoLidas: () => set((state) => ({
        notificacoes: state.notificacoes.map((n) => ({ ...n, lida: true })),
        naoLidas: 0,
      })),

      limparNotificacoes: () => set({
        notificacoes: [],
        naoLidas: 0,
      }),

      removerNotificacao: (id) => set((state) => {
        const notificacao = state.notificacoes.find((n) => n.id === id);
        return {
          notificacoes: state.notificacoes.filter((n) => n.id !== id),
          naoLidas: notificacao && !notificacao.lida ? Math.max(0, state.naoLidas - 1) : state.naoLidas,
        };
      }),

      getNotificacoesPorTipo: (tipo) => {
        return get().notificacoes.filter((n) => n.tipo === tipo);
      },

      getNotificacoesPorPrioridade: (prioridade) => {
        return get().notificacoes.filter((n) => n.prioridade === prioridade);
      },
    }),
    {
      name: "pdv-notificacoes",
    }
  )
);

// Hook para solicitar permissão de notificações
export const solicitarPermissaoNotificacoes = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};
