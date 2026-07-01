// src/store/pontoStore.ts
// Sistema de Controle de Ponto - PDV Brasil
// Versão: 1.0

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useColaboradorStore, Colaborador } from "./colaboradorStore";
import { useNotificacaoStore } from "./notificacaoStore";

export interface RegistroPonto {
  id: string;
  colaboradorId: string;
  colaboradorNome: string;
  tipo: 'entrada' | 'saida';
  dataHora: string;
  latitude?: number;
  longitude?: number;
  metodo: 'facial' | 'pin' | 'qr' | 'manual';
  foto?: string;
  deviceId: string;
  sincronizado: boolean;
  alertaFraude?: {
    tipo: 'mesmo_dispositivo' | 'mesma_localizacao' | 'tempo_insuficiente';
    descricao: string;
  };
}

export interface AjustePonto {
  id: string;
  colaboradorId: string;
  colaboradorNome: string;
  dataOriginal: string;
  dataProposta: string;
  tipo: 'entrada' | 'saida';
  motivo: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  solicitadoEm: string;
  solicitadoPor?: string;
  aprovadoPor?: string;
  aprovadoEm?: string;
  rejeitadoPor?: string;
  rejeitadoEm?: string;
  comentarioAprovacao?: string;
  comentarioRejeicao?: string;
}

export interface HorasTrabalhadas {
  colaboradorId: string;
  colaboradorNome: string;
  mes: number;
  ano: number;
  horasTotais: number;
  horasExtras: number;
  horasNormais: number;
  diasTrabalhados: number;
  atrasos: number;
  saidasAntecipadas: number;
  pontuacao: number; // Para promoções
}

// ==================== NOVAS INTERFACES PARA GESTÃO DE ESCALA ====================

/**
 * Tipos de escala de trabalho
 */
export type TipoEscala = '5x2' | '6x1' | '12x36' | 'personalizada';

/**
 * Dia da semana para escalas
 */
export type DiaSemana = 'domingo' | 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado';

/**
 * Status do dia na escala
 */
export type StatusDia = 'trabalho' | 'folga' | 'feriado' | 'compensacao';

/**
 * Configuração de escala de um colaborador
 */
export interface EscalaConfig {
  id: string;
  colaboradorId: string;
  tipo: TipoEscala;
  dataInicio: string;
  dataFim?: string;
  diasTrabalho: DiaSemana[];
  diasFolga: DiaSemana[];
  turnoInicio: string; // HH:MM
  turnoFim: string; // HH:MM
  intervaloMinutos: number; // Intervalo intrajornada em minutos
  horasSemanais: number; // Meta de horas semanais (padrão: 40)
  ativa: boolean;
}

/**
 * Registro de escala diária
 */
export interface EscalaDiaria {
  id: string;
  colaboradorId: string;
  data: string;
  status: StatusDia;
  turnoInicio: string;
  turnoFim: string;
  horasPrevistas: number;
  observacao?: string;
}

/**
 * Registro de banco de horas
 */
export interface BancoHoras {
  id: string;
  colaboradorId: string;
  colaboradorNome: string;
  periodo: string; // Formato: "MM/YYYY"
  saldoHoras: number; // Positivo = horas a favor, Negativo = horas a compensar
  horasCreditadas: number;
  horasDebitadas: number;
  ultimaAtualizacao: string;
}

/**
 * Movimentação no banco de horas
 */
export interface MovimentacaoBancoHoras {
  id: string;
  colaboradorId: string;
  tipo: 'credito' | 'debito';
  horas: number;
  motivo: string;
  data: string;
  referenciaId?: string; // ID do registro de ponto ou ajuste
}

/**
 * Alerta de conformidade legal
 */
export type TipoAlertaLegal = 
  | 'extrapolacao_horas_semanais' 
  | 'intervalo_intrajornada_violado'
  | 'intervalo_interjornada_violado'
  | 'folga_nao_concedida'
  | 'banco_horas_negativo'
  | 'escala_6x1_detectada';

export interface AlertaLegal {
  id: string;
  colaboradorId: string;
  colaboradorNome: string;
  tipo: TipoAlertaLegal;
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
  descricao: string;
  data: string;
  dataReferencia: string;
  resolvido: boolean;
  resolvidoEm?: string;
  resolvidoPor?: string;
}

/**
 * Sugestão de escala otimizada
 */
export interface SugestaoEscala {
  colaboradorId: string;
  colaboradorNome: string;
  tipoEscalaSugerida: TipoEscala;
  motivo: string;
  impactoHoras: number;
  impactoFolgas: number;
  dataValidade: string;
}

interface PontoState {
  registros: RegistroPonto[];
  colaboradores: Colaborador[];
  lojaLat: number;
  lojaLng: number;
  raioMetros: number;
  usuarioAtual: Colaborador | null;
  dentroGeofence: boolean;
  ajustesPendentes: AjustePonto[];
  horasTrabalhadas: HorasTrabalhadas[];
  alertasFraude: any[];
  
  // ==================== NOVOS CAMPOS PARA GESTÃO DE ESCALA ====================
  escalasConfig: EscalaConfig[];
  escalasDiarias: EscalaDiaria[];
  bancoHoras: BancoHoras[];
  movimentacoesBancoHoras: MovimentacaoBancoHoras[];
  alertasLegais: AlertaLegal[];
  sugestoesEscala: SugestaoEscala[];
  
  // ==================== FUNÇÕES EXISTENTES ====================
  adicionarRegistro: (registro: Omit<RegistroPonto, 'id' | 'sincronizado'>) => void;
  removerRegistro: (id: string) => void;
  sincronizarRegistros: () => Promise<void>;
  verificarGeofence: (lat: number, lng: number) => boolean;
  setUsuarioAtual: (colaborador: Colaborador | null) => void;
  setDentroGeofence: (dentro: boolean) => void;
  setConfiguracaoGeofence: (lat: number, lng: number, raio: number) => void;
  getRegistrosHoje: (colaboradorId?: string) => RegistroPonto[];
  getRelatorioMensal: (mes: number, ano: number) => RegistroPonto[];
  solicitarAjuste: (ajuste: Omit<AjustePonto, 'id' | 'status' | 'solicitadoEm'>) => void;
  aprovarAjuste: (id: string, aprovadorId: string, comentario?: string) => void;
  rejeitarAjuste: (id: string, rejeitadorId: string, comentario?: string) => void;
  calcularHorasTrabalhadas: (colaboradorId: string, mes: number, ano: number) => HorasTrabalhadas;
  getRankingPontuacao: (mes: number, ano: number) => HorasTrabalhadas[];
  detectarFraude: (registro: Omit<RegistroPonto, 'id' | 'sincronizado'>) => boolean;
  
  // ==================== NOVAS FUNÇÕES PARA GESTÃO DE ESCALA ====================
  // Gestão de Escalas
  criarEscalaConfig: (config: Omit<EscalaConfig, 'id'>) => void;
  atualizarEscalaConfig: (id: string, config: Partial<EscalaConfig>) => void;
  removerEscalaConfig: (id: string) => void;
  getEscalaConfig: (colaboradorId: string) => EscalaConfig | null;
  getEscalaAtiva: (colaboradorId: string, data?: string) => EscalaConfig | null;
  
  // Gestão de Escalas Diárias
  criarEscalaDiaria: (escala: Omit<EscalaDiaria, 'id'>) => void;
  atualizarEscalaDiaria: (id: string, escala: Partial<EscalaDiaria>) => void;
  removerEscalaDiaria: (id: string) => void;
  getEscalaSemanal: (colaboradorId: string, dataInicio: string) => EscalaDiaria[];
  gerarEscalaSemanalAutomatica: (colaboradorId: string, dataInicio: string) => EscalaDiaria[];
  
  // Gestão de Banco de Horas
  criarBancoHoras: (banco: Omit<BancoHoras, 'id' | 'ultimaAtualizacao'>) => void;
  atualizarBancoHoras: (colaboradorId: string, periodo: string, horas: number) => void;
  getBancoHoras: (colaboradorId: string, periodo: string) => BancoHoras | null;
  adicionarMovimentacaoBancoHoras: (movimentacao: Omit<MovimentacaoBancoHoras, 'id'>) => void;
  calcularSaldoBancoHoras: (colaboradorId: string, periodo: string) => number;
  
  // Gestão de Alertas Legais
  criarAlertaLegal: (alerta: Omit<AlertaLegal, 'id' | 'resolvido'>) => void;
  resolverAlertaLegal: (id: string, resolvidoPor: string) => void;
  getAlertasLegais: (colaboradorId?: string, resolvido?: boolean) => AlertaLegal[];
  verificarConformidadeLegal: (colaboradorId: string, mes: number, ano: number) => AlertaLegal[];
  
  // Sugestões de Escala
  gerarSugestoesEscala: (colaboradorId: string) => SugestaoEscala[];
  aplicarSugestaoEscala: (colaboradorId: string, sugestao: SugestaoEscala) => void;
  
  // Funções de Conformidade Legal
  verificarIntervaloIntrajornada: (colaboradorId: string, data: string) => boolean;
  verificarIntervaloInterjornada: (colaboradorId: string, data1: string, data2: string) => boolean;
  verificarHorasSemanais: (colaboradorId: string, dataInicio: string) => { dentroLimite: boolean; horasTrabalhadas: number; };
  verificarFolgaSemanal: (colaboradorId: string, dataInicio: string) => { folgaConcedida: boolean; diaFolga: string | null };
}

export const usePontoStore = create<PontoState>()(
  persist(
    (set, get) => ({
      registros: [],
      colaboradores: useColaboradorStore.getState().colaboradores,
      lojaLat: -23.5505, // São Paulo (default)
      lojaLng: -46.6333,
      raioMetros: 100,
      usuarioAtual: null,
      dentroGeofence: true,
      ajustesPendentes: [],
      horasTrabalhadas: [],
      alertasFraude: [],
      
      // ==================== NOVOS CAMPOS INICIAIS ====================
      escalasConfig: [],
      escalasDiarias: [],
      bancoHoras: [],
      movimentacoesBancoHoras: [],
      alertasLegais: [],
      sugestoesEscala: [],

      adicionarRegistro: (registro) => set((state) => ({
        registros: [
          ...state.registros,
          {
            ...registro,
            id: crypto.randomUUID(),
            sincronizado: false,
          },
        ],
      })),

      removerRegistro: (id) => set((state) => ({
        registros: state.registros.filter((r) => r.id !== id),
      })),

      sincronizarRegistros: async () => {
        // Simulação de sincronização com servidor
        return new Promise((resolve) => {
          setTimeout(() => {
            set((state) => ({
              registros: state.registros.map((r) => ({ ...r, sincronizado: true })),
            }));
            resolve();
          }, 1000);
        });
      },

      verificarGeofence: (lat, lng) => {
        const { lojaLat, lojaLng, raioMetros } = get();
        const distancia = calcularDistancia(lat, lng, lojaLat, lojaLng);
        return distancia <= raioMetros;
      },

      setUsuarioAtual: (colaborador) => set({ usuarioAtual: colaborador }),
      setDentroGeofence: (dentro) => set({ dentroGeofence: dentro }),
      setConfiguracaoGeofence: (lat, lng, raio) => set({
        lojaLat: lat,
        lojaLng: lng,
        raioMetros: raio,
      }),

      getRegistrosHoje: (colaboradorId) => {
        const hoje = new Date().toDateString();
        const registros = get().registros.filter((r) => {
          const dataRegistro = new Date(r.dataHora).toDateString();
          return dataRegistro === hoje && (!colaboradorId || r.colaboradorId === colaboradorId);
        });
        return registros;
      },

      getRelatorioMensal: (mes, ano) => {
        const registros = get().registros.filter((r) => {
          const data = new Date(r.dataHora);
          return data.getMonth() === mes && data.getFullYear() === ano;
        });
        return registros;
      },

      solicitarAjuste: (ajuste) => set((state) => ({
        ajustesPendentes: [
          ...state.ajustesPendentes,
          {
            ...ajuste,
            id: crypto.randomUUID(),
            status: 'pendente',
            solicitadoEm: new Date().toISOString(),
          },
        ],
      })),

      aprovarAjuste: (id, aprovadorId, comentario) => set((state) => ({
        ajustesPendentes: state.ajustesPendentes.map((a) =>
          a.id === id
            ? { 
                ...a, 
                status: 'aprovado', 
                aprovadoPor: aprovadorId, 
                aprovadoEm: new Date().toISOString(),
                comentarioAprovacao: comentario
              }
            : a
        ),
      })),

      rejeitarAjuste: (id, rejeitadorId, comentario) => set((state) => ({
        ajustesPendentes: state.ajustesPendentes.map((a) =>
          a.id === id 
            ? { 
                ...a, 
                status: 'rejeitado', 
                rejeitadoPor: rejeitadorId, 
                rejeitadoEm: new Date().toISOString(),
                comentarioRejeicao: comentario
              } 
            : a
        ),
      })),

      calcularHorasTrabalhadas: (colaboradorId, mes, ano) => {
        const registros = get().getRelatorioMensal(mes, ano).filter(
          r => r.colaboradorId === colaboradorId
        );
        const colaborador = get().colaboradores.find(c => c.id === colaboradorId);
        
        let horasTotais = 0;
        let horasExtras = 0;
        let horasNormais = 0;
        let diasTrabalhados = 0;
        let atrasos = 0;
        let saidasAntecipadas = 0;
        const diasTrabalhadosSet = new Set<string>();

        const [turnoInicioH, turnoInicioM] = colaborador?.turnoInicio.split(':').map(Number) || [8, 0];
        const [turnoFimH, turnoFimM] = colaborador?.turnoFim.split(':').map(Number) || [17, 0];

        for (let i = 0; i < registros.length; i += 2) {
          const entrada = registros[i];
          const saida = registros[i + 1];

          if (entrada && saida) {
            const dataEntrada = new Date(entrada.dataHora);
            const dataSaida = new Date(saida.dataHora);
            const dataStr = dataEntrada.toDateString();
            
            if (!diasTrabalhadosSet.has(dataStr)) {
              diasTrabalhadosSet.add(dataStr);
              diasTrabalhados++;
            }

            // Verificar atraso
            if (dataEntrada.getHours() > turnoInicioH || 
                (dataEntrada.getHours() === turnoInicioH && dataEntrada.getMinutes() > turnoInicioM)) {
              atrasos++;
            }

            // Verificar saída antecipada
            if (dataSaida.getHours() < turnoFimH || 
                (dataSaida.getHours() === turnoFimH && dataSaida.getMinutes() < turnoFimM)) {
              saidasAntecipadas++;
            }

            const diferenca = dataSaida.getTime() - dataEntrada.getTime();
            const horasTrabalhadas = diferenca / (1000 * 60 * 60);
            horasTotais += horasTrabalhadas;

            // Horas normais = 8 horas por dia
            const horasNormaisDia = Math.min(horasTrabalhadas, 8);
            horasNormais += horasNormaisDia;

            // Horas extras = acima de 8 horas
            if (horasTrabalhadas > 8) {
              horasExtras += (horasTrabalhadas - 8);
            }
          }
        }

        // Calcular pontuação para promoções
        let pontuacao = 0;
        pontuacao += diasTrabalhados * 10; // 10 pontos por dia trabalhado
        pontuacao += horasExtras * 5; // 5 pontos por hora extra
        pontuacao -= atrasos * 3; // -3 pontos por atraso
        pontuacao -= saidasAntecipadas * 2; // -2 pontos por saída antecipada
        pontuacao = Math.max(0, pontuacao); // Pontuação não pode ser negativa

        return {
          colaboradorId,
          colaboradorNome: colaborador?.nome || '',
          mes,
          ano,
          horasTotais: Math.round(horasTotais * 100) / 100,
          horasExtras: Math.round(horasExtras * 100) / 100,
          horasNormais: Math.round(horasNormais * 100) / 100,
          diasTrabalhados,
          atrasos,
          saidasAntecipadas,
          pontuacao,
        };
      },

      getRankingPontuacao: (mes, ano) => {
        const colaboradores = get().colaboradores;
        const resultados = colaboradores.map(colab =>
          get().calcularHorasTrabalhadas(colab.id, mes, ano)
        );
        return resultados.sort((a, b) => b.pontuacao - a.pontuacao);
      },

      detectarFraude: (registro) => {
        const { registros } = get();
        const alertas: any[] = [];
        let temFraude = false;

        // Verificar mesmo dispositivo
        const registrosMesmoDispositivo = registros.filter(
          r => r.deviceId === registro.deviceId && r.colaboradorId !== registro.colaboradorId
        );
        if (registrosMesmoDispositivo.length > 0) {
          alertas.push({
            tipo: 'mesmo_dispositivo',
            descricao: 'Mesmo dispositivo utilizado por outro colaborador recentemente'
          });
          temFraude = true;
        }

        // Verificar mesma localização
        if (registro.latitude && registro.longitude) {
          const registrosMesmaLocalizacao = registros.filter(r => {
            if (!r.latitude || !r.longitude) return false;
            const distancia = calcularDistancia(
              registro.latitude,
              registro.longitude,
              r.latitude,
              r.longitude
            );
            return distancia < 5 && r.colaboradorId !== registro.colaboradorId;
          });
          if (registrosMesmaLocalizacao.length > 0) {
            alertas.push({
              tipo: 'mesma_localizacao',
              descricao: 'Mesma localização utilizada por outro colaborador'
            });
            temFraude = true;
          }
        }

        // Verificar tempo insuficiente entre registros
        const ultimosRegistros = registros
          .filter(r => r.colaboradorId === registro.colaboradorId)
          .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
          .slice(0, 5);

        if (ultimosRegistros.length > 0) {
          const ultimoRegistro = ultimosRegistros[0];
          const tempoEntreRegistros = new Date(registro.dataHora).getTime() - new Date(ultimoRegistro.dataHora).getTime();
          const minutosEntreRegistros = tempoEntreRegistros / (1000 * 60);
          
          if (minutosEntreRegistros < 2) {
            alertas.push({
              tipo: 'tempo_insuficiente',
              descricao: 'Tempo insuficiente entre registros (menos de 2 minutos)'
            });
            temFraude = true;
          }
        }

        if (alertas.length > 0) {
          set({ alertasFraude: [...get().alertasFraude, ...alertas] });
        }

        return temFraude;
      },

      // ==================== IMPLEMENTAÇÕES: GESTÃO DE ESCALAS ====================
      
      criarEscalaConfig: (config) => set((state) => ({
        escalasConfig: [...state.escalasConfig, { ...config, id: crypto.randomUUID() }]
      })),

      atualizarEscalaConfig: (id, config) => set((state) => ({
        escalasConfig: state.escalasConfig.map(e => e.id === id ? { ...e, ...config } : e)
      })),

      removerEscalaConfig: (id) => set((state) => ({
        escalasConfig: state.escalasConfig.filter(e => e.id !== id)
      })),

      getEscalaConfig: (colaboradorId) => {
        const { escalasConfig } = get();
        return escalasConfig.find(e => e.colaboradorId === colaboradorId && e.ativa) || null;
      },

      getEscalaAtiva: (colaboradorId, data) => {
        const { escalasConfig } = get();
        const dataRef = data ? new Date(data) : new Date();
        return escalasConfig.find(e => 
          e.colaboradorId === colaboradorId && 
          e.ativa &&
          new Date(e.dataInicio) <= dataRef &&
          (!e.dataFim || new Date(e.dataFim) >= dataRef)
        ) || null;
      },

      // ==================== IMPLEMENTAÇÕES: ESCALAS DIÁRIAS ====================
      
      criarEscalaDiaria: (escala) => set((state) => ({
        escalasDiarias: [...state.escalasDiarias, { ...escala, id: crypto.randomUUID() }]
      })),

      atualizarEscalaDiaria: (id, escala) => set((state) => ({
        escalasDiarias: state.escalasDiarias.map(e => e.id === id ? { ...e, ...escala } : e)
      })),

      removerEscalaDiaria: (id) => set((state) => ({
        escalasDiarias: state.escalasDiarias.filter(e => e.id !== id)
      })),

      getEscalaSemanal: (colaboradorId, dataInicio) => {
        const { escalasDiarias } = get();
        const inicio = new Date(dataInicio);
        const fim = new Date(inicio);
        fim.setDate(fim.getDate() + 7);
        
        return escalasDiarias.filter(e => 
          e.colaboradorId === colaboradorId &&
          new Date(e.data) >= inicio &&
          new Date(e.data) < fim
        );
      },

      gerarEscalaSemanalAutomatica: (colaboradorId, dataInicio) => {
        const escalaConfig = get().getEscalaAtiva(colaboradorId, dataInicio);
        if (!escalaConfig) return [];

        const escalasGeradas: EscalaDiaria[] = [];
        const inicio = new Date(dataInicio);
        const diaSemanaMap: Record<number, DiaSemana> = {
          0: 'domingo',
          1: 'segunda',
          2: 'terca',
          3: 'quarta',
          4: 'quinta',
          5: 'sexta',
          6: 'sabado'
        };

        for (let i = 0; i < 7; i++) {
          const data = new Date(inicio);
          data.setDate(data.getDate() + i);
          const diaSemana = diaSemanaMap[data.getDay()];
          
          const isDiaTrabalho = escalaConfig.diasTrabalho.includes(diaSemana);
          const [inicioH, inicioM] = escalaConfig.turnoInicio.split(':').map(Number);
          const [fimH, fimM] = escalaConfig.turnoFim.split(':').map(Number);
          
          const horasPrevistas = isDiaTrabalho 
            ? ((fimH * 60 + fimM) - (inicioH * 60 + inicioM) - escalaConfig.intervaloMinutos) / 60
            : 0;

          const escalaDiaria: EscalaDiaria = {
            id: crypto.randomUUID(),
            colaboradorId,
            data: data.toISOString().split('T')[0],
            status: isDiaTrabalho ? 'trabalho' : 'folga',
            turnoInicio: escalaConfig.turnoInicio,
            turnoFim: escalaConfig.turnoFim,
            horasPrevistas: Math.max(0, horasPrevistas)
          };

          escalasGeradas.push(escalaDiaria);
          get().criarEscalaDiaria(escalaDiaria);
        }

        return escalasGeradas;
      },

      // ==================== IMPLEMENTAÇÕES: BANCO DE HORAS ====================
      
      criarBancoHoras: (banco) => set((state) => ({
        bancoHoras: [...state.bancoHoras, { ...banco, id: crypto.randomUUID(), ultimaAtualizacao: new Date().toISOString() }]
      })),

      atualizarBancoHoras: (colaboradorId, periodo, horas) => set((state) => {
        const bancoExistente = state.bancoHoras.find(b => b.colaboradorId === colaboradorId && b.periodo === periodo);
        if (bancoExistente) {
          return {
            bancoHoras: state.bancoHoras.map(b => 
              b.colaboradorId === colaboradorId && b.periodo === periodo
                ? { ...b, saldoHoras: b.saldoHoras + horas, ultimaAtualizacao: new Date().toISOString() }
                : b
            )
          };
        }
        return {
          bancoHoras: [...state.bancoHoras, {
            id: crypto.randomUUID(),
            colaboradorId,
            colaboradorNome: state.colaboradores.find(c => c.id === colaboradorId)?.nome || '',
            periodo,
            saldoHoras: horas,
            horasCreditadas: horas > 0 ? horas : 0,
            horasDebitadas: horas < 0 ? Math.abs(horas) : 0,
            ultimaAtualizacao: new Date().toISOString()
          }]
        };
      }),

      getBancoHoras: (colaboradorId, periodo) => {
        const { bancoHoras } = get();
        return bancoHoras.find(b => b.colaboradorId === colaboradorId && b.periodo === periodo) || null;
      },

      adicionarMovimentacaoBancoHoras: (movimentacao) => set((state) => {
        const novaMovimentacao = { ...movimentacao, id: crypto.randomUUID() };
        const horas = movimentacao.tipo === 'credito' ? movimentacao.horas : -movimentacao.horas;
        const periodo = new Date(movimentacao.data).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }).replace(/\//g, '/');
        
        // Atualiza banco de horas
        const novoEstado = get();
        novoEstado.atualizarBancoHoras(movimentacao.colaboradorId, periodo, horas);
        
        return {
          movimentacoesBancoHoras: [...state.movimentacoesBancoHoras, novaMovimentacao]
        };
      }),

      calcularSaldoBancoHoras: (colaboradorId, periodo) => {
        const banco = get().getBancoHoras(colaboradorId, periodo);
        return banco?.saldoHoras || 0;
      },

      // ==================== IMPLEMENTAÇÕES: ALERTAS LEGAIS ====================
      
      criarAlertaLegal: (alerta) => set((state) => ({
        alertasLegais: [...state.alertasLegais, { ...alerta, id: crypto.randomUUID(), resolvido: false }]
      })),

      resolverAlertaLegal: (id, resolvidoPor) => set((state) => ({
        alertasLegais: state.alertasLegais.map(a => 
          a.id === id 
            ? { ...a, resolvido: true, resolvidoEm: new Date().toISOString(), resolvidoPor }
            : a
        )
      })),

      getAlertasLegais: (colaboradorId, resolvido) => {
        const { alertasLegais } = get();
        return alertasLegais.filter(a => {
          if (colaboradorId && a.colaboradorId !== colaboradorId) return false;
          if (resolvido !== undefined && a.resolvido !== resolvido) return false;
          return true;
        });
      },

      verificarConformidadeLegal: (colaboradorId, mes, ano) => {
        const { registros, colaboradores } = get();
        const colaborador = colaboradores.find(c => c.id === colaboradorId);
        if (!colaborador) return [];

        const alertas: AlertaLegal[] = [];
        const registrosMes = registros.filter(r => {
          const data = new Date(r.dataHora);
          return data.getMonth() === mes && data.getFullYear() === ano && r.colaboradorId === colaboradorId;
        });

        // Verificar intervalo intrajornada (mínimo 1h após 6h de trabalho)
        for (let i = 0; i < registrosMes.length - 1; i += 2) {
          const entrada = registrosMes[i];
          const saida = registrosMes[i + 1];
          if (entrada && saida) {
            const horasTrabalhadas = (new Date(saida.dataHora).getTime() - new Date(entrada.dataHora).getTime()) / (1000 * 60 * 60);
            if (horasTrabalhadas >= 6) {
              const proximaEntrada = registrosMes[i + 2];
              if (proximaEntrada) {
                const intervalo = (new Date(proximaEntrada.dataHora).getTime() - new Date(saida.dataHora).getTime()) / (1000 * 60 * 60);
                if (intervalo < 1) {
                  alertas.push({
                    id: crypto.randomUUID(),
                    colaboradorId,
                    colaboradorNome: colaborador.nome,
                    tipo: 'intervalo_intrajornada_violado',
                    severidade: 'alta',
                    descricao: `Intervalo intrajornada violado: ${intervalo.toFixed(2)}h (mínimo: 1h)`,
                    data: new Date().toISOString(),
                    dataReferencia: saida.dataHora,
                    resolvido: false
                  });
                }
              }
            }
          }
        }

        // Verificar intervalo interjornada (mínimo 11h entre jornadas)
        for (let i = 0; i < registrosMes.length - 1; i += 2) {
          const saida = registrosMes[i + 1];
          const proximaEntrada = registrosMes[i + 2];
          if (saida && proximaEntrada) {
            const intervalo = (new Date(proximaEntrada.dataHora).getTime() - new Date(saida.dataHora).getTime()) / (1000 * 60 * 60);
            if (intervalo < 11) {
              alertas.push({
                id: crypto.randomUUID(),
                colaboradorId,
                colaboradorNome: colaborador.nome,
                tipo: 'intervalo_interjornada_violado',
                severidade: 'critica',
                descricao: `Intervalo interjornada violado: ${intervalo.toFixed(2)}h (mínimo: 11h)`,
                data: new Date().toISOString(),
                dataReferencia: saida.dataHora,
                resolvido: false
              });
            }
          }
        }

        // Verificar horas semanais (máximo 44h, meta 40h)
        const horasTrabalhadas = get().calcularHorasTrabalhadas(colaboradorId, mes, ano);
        if (horasTrabalhadas.horasTotais > 44) {
          alertas.push({
            id: crypto.randomUUID(),
            colaboradorId,
            colaboradorNome: colaborador.nome,
            tipo: 'extrapolacao_horas_semanais',
            severidade: 'media',
            descricao: `Extrapolação de horas semanais: ${horasTrabalhadas.horasTotais.toFixed(2)}h (máximo: 44h)`,
            data: new Date().toISOString(),
            dataReferencia: new Date(ano, mes, 1).toISOString(),
            resolvido: false
          });
        }

        // Verificar banco de horas negativo
        const periodo = `${String(mes + 1).padStart(2, '0')}/${ano}`;
        const saldoBanco = get().calcularSaldoBancoHoras(colaboradorId, periodo);
        if (saldoBanco < 0) {
          alertas.push({
            id: crypto.randomUUID(),
            colaboradorId,
            colaboradorNome: colaborador.nome,
            tipo: 'banco_horas_negativo',
            severidade: 'media',
            descricao: `Banco de horas negativo: ${saldoBanco.toFixed(2)}h`,
            data: new Date().toISOString(),
            dataReferencia: new Date(ano, mes, 1).toISOString(),
            resolvido: false
          });
        }

        // Adicionar alertas ao store
        if (alertas.length > 0) {
          set((state) => ({ alertasLegais: [...state.alertasLegais, ...alertas] }));
        }

        return alertas;
      },

      // ==================== IMPLEMENTAÇÕES: SUGESTÕES DE ESCALA ====================
      
      gerarSugestoesEscala: (colaboradorId) => {
        const { colaboradores, escalasConfig, horasTrabalhadas } = get();
        const colaborador = colaboradores.find(c => c.id === colaboradorId);
        if (!colaborador) return [];

        const sugestoes: SugestaoEscala[] = [];
        const escalaAtual = get().getEscalaAtiva(colaboradorId);
        const mes = new Date().getMonth();
        const ano = new Date().getFullYear();
        const horas = horasTrabalhadas.find(h => h.colaboradorId === colaboradorId && h.mes === mes && h.ano === ano);

        // Sugestão 1: Se está em 6x1, sugerir 5x2
        if (escalaAtual?.tipo === '6x1') {
          sugestoes.push({
            colaboradorId,
            colaboradorNome: colaborador.nome,
            tipoEscalaSugerida: '5x2',
            motivo: 'Nova legislação trabalhista favorece escala 5x2 com limite de 40h semanais',
            impactoHoras: -8,
            impactoFolgas: 1,
            dataValidade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });
        }

        // Sugestão 2: Se extrapolou 44h, sugerir ajuste
        if (horas && horas.horasTotais > 44) {
          sugestoes.push({
            colaboradorId,
            colaboradorNome: colaborador.nome,
            tipoEscalaSugerida: escalaAtual?.tipo || '5x2',
            motivo: 'Extrapolação de horas semanais detectada. Ajustar escala para conformidade legal.',
            impactoHoras: horas.horasTotais - 44,
            impactoFolgas: 0,
            dataValidade: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          });
        }

        set({ sugestoesEscala: sugestoes });
        return sugestoes;
      },

      aplicarSugestaoEscala: (colaboradorId, sugestao) => {
        const { colaboradores } = get();
        const colaborador = colaboradores.find(c => c.id === colaboradorId);
        if (!colaborador) return;

        // Criar nova configuração de escala baseada na sugestão
        const novaConfig: Omit<EscalaConfig, 'id'> = {
          colaboradorId,
          tipo: sugestao.tipoEscalaSugerida,
          dataInicio: new Date().toISOString().split('T')[0],
          diasTrabalho: sugestao.tipoEscalaSugerida === '5x2' ? ['segunda', 'terca', 'quarta', 'quinta', 'sexta'] : ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
          diasFolga: sugestao.tipoEscalaSugerida === '5x2' ? ['sabado', 'domingo'] : ['domingo'],
          turnoInicio: '08:00',
          turnoFim: '17:00',
          intervaloMinutos: 60,
          horasSemanais: 40,
          ativa: true
        };

        get().criarEscalaConfig(novaConfig);
      },

      // ==================== IMPLEMENTAÇÕES: CONFORMIDADE LEGAL ====================
      
      verificarIntervaloIntrajornada: (colaboradorId, data) => {
        const { registros } = get();
        const registrosDia = registros.filter(r => {
          const dataRegistro = new Date(r.dataHora).toISOString().split('T')[0];
          return dataRegistro === data && r.colaboradorId === colaboradorId;
        });

        if (registrosDia.length < 2) return true;

        const entrada = new Date(registrosDia[0].dataHora);
        const saida = new Date(registrosDia[1].dataHora);
        const horasTrabalhadas = (saida.getTime() - entrada.getTime()) / (1000 * 60 * 60);

        if (horasTrabalhadas < 6) return true;

        const proximaEntrada = registrosDia[2] ? new Date(registrosDia[2].dataHora) : null;
        if (!proximaEntrada) return true;

        const intervalo = (proximaEntrada.getTime() - saida.getTime()) / (1000 * 60 * 60);
        return intervalo >= 1;
      },

      verificarIntervaloInterjornada: (colaboradorId, data1, data2) => {
        const { registros } = get();
        const saida1 = registros.find(r => 
          r.colaboradorId === colaboradorId && 
          r.tipo === 'saida' && 
          new Date(r.dataHora).toISOString().split('T')[0] === data1
        );
        const entrada2 = registros.find(r => 
          r.colaboradorId === colaboradorId && 
          r.tipo === 'entrada' && 
          new Date(r.dataHora).toISOString().split('T')[0] === data2
        );

        if (!saida1 || !entrada2) return true;

        const intervalo = (new Date(entrada2.dataHora).getTime() - new Date(saida1.dataHora).getTime()) / (1000 * 60 * 60);
        return intervalo >= 11;
      },

      verificarHorasSemanais: (colaboradorId, dataInicio) => {
        const { registros } = get();
        const inicio = new Date(dataInicio);
        const fim = new Date(inicio);
        fim.setDate(fim.getDate() + 7);

        const registrosSemana = registros.filter(r => {
          const data = new Date(r.dataHora);
          return data >= inicio && data < fim && r.colaboradorId === colaboradorId;
        });

        let horasTrabalhadas = 0;
        for (let i = 0; i < registrosSemana.length - 1; i += 2) {
          const entrada = registrosSemana[i];
          const saida = registrosSemana[i + 1];
          if (entrada && saida) {
            horasTrabalhadas += (new Date(saida.dataHora).getTime() - new Date(entrada.dataHora).getTime()) / (1000 * 60 * 60);
          }
        }

        return {
          dentroLimite: horasTrabalhadas <= 44,
          horasTrabalhadas: Math.round(horasTrabalhadas * 100) / 100
        };
      },

      verificarFolgaSemanal: (colaboradorId, dataInicio) => {
        const { escalasDiarias } = get();
        const inicio = new Date(dataInicio);
        const fim = new Date(inicio);
        fim.setDate(fim.getDate() + 7);

        const escalasSemana = escalasDiarias.filter(e => {
          const data = new Date(e.data);
          return data >= inicio && data < fim && e.colaboradorId === colaboradorId;
        });

        const folga = escalasSemana.find(e => e.status === 'folga');
        
        return {
          folgaConcedida: !!folga,
          diaFolga: folga?.data || null
        };
      },
    }),
    { name: "pdv-ponto" }
  )
);

// Função auxiliar para calcular distância entre dois pontos (fórmula de Haversine)
function calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Raio da Terra em metros
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
