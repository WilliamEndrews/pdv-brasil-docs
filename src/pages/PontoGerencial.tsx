// src/pages/PontoGerencial.tsx
// Dashboard Gerencial de Ponto - PDV Brasil
// Versão: 1.0

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePontoStore } from '@/store/pontoStore';
import { useAuth } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Calendar,
  ArrowLeft,
  Download,
  Settings,
  FileEdit,
  BarChart3,
  CalendarClock,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

const PontoGerencial = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { colaboradores, getRegistrosHoje, calcularHorasTrabalhadas, getRankingPontuacao, alertasFraude } = usePontoStore();
  
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [mostrarRanking, setMostrarRanking] = useState(true);
  const [mostrarGraficos, setMostrarGraficos] = useState(false);
  const [mostrarColaboradores, setMostrarColaboradores] = useState(false);
  const [mostrarListaRanking, setMostrarListaRanking] = useState(false);

  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  
  const ranking = getRankingPontuacao(mesAtual, anoAtual);

  // Dados para gráfico de presença ao longo do mês
  const dadosPresencaMensal = Array.from({ length: 30 }, (_, i) => {
    const dia = i + 1;
    const presencaDia = colaboradores.filter(c => {
      // Simulação de presença (em produção, usar dados reais)
      return Math.random() > 0.1; // 90% de chance de presença
    }).length;
    
    return {
      dia: `Dia ${dia}`,
      presentes: presencaDia,
      ausentes: colaboradores.length - presencaDia,
    };
  });

  // Dados para gráfico de horas extras por dia da semana
  const dadosHorasExtrasPorDia = [
    { dia: 'Segunda', horas: 12 },
    { dia: 'Terça', horas: 8 },
    { dia: 'Quarta', horas: 15 },
    { dia: 'Quinta', horas: 10 },
    { dia: 'Sexta', horas: 20 },
    { dia: 'Sábado', horas: 5 },
    { dia: 'Domingo', horas: 0 },
  ];

  // Dados para heatmap de horários de pico
  const dadosHorariosPico = Array.from({ length: 12 }, (_, i) => {
    const hora = 8 + i;
    return {
      horario: `${hora}:00`,
      entradas: Math.floor(Math.random() * 10) + 1,
    };
  });

  const colors = ['#10b981', '#ef4444'];

  // Calcular métricas
  const calcularMetricas = () => {
    const hoje = new Date().toDateString();
    const registrosHoje = colaboradores.map(colab => {
      const registros = getRegistrosHoje(colab.id);
      const ultimaEntrada = registros.filter((r) => r.tipo === 'entrada').pop();
      const ultimaSaida = registros.filter((r) => r.tipo === 'saida').pop();
      const estaPresente = ultimaEntrada && (!ultimaSaida || new Date(ultimaEntrada.dataHora) > new Date(ultimaSaida.dataHora));
      
      return {
        ...colab,
        estaPresente,
        entrada: ultimaEntrada?.dataHora,
        saida: ultimaSaida?.dataHora,
      };
    });

    const presentes = registrosHoje.filter(r => r.estaPresente);
    const ausentes = registrosHoje.filter(r => !r.estaPresente);
    const atrasados = registrosHoje.filter(r => {
      if (!r.entrada) return false;
      const horaEntrada = new Date(r.entrada).getHours();
      const horaTurno = parseInt(r.turnoInicio.split(':')[0]);
      return horaEntrada > horaTurno;
    });

    return { registrosHoje, presentes, ausentes, atrasados };
  };

  const { registrosHoje, presentes, ausentes, atrasados } = calcularMetricas();

  const exportarRelatorio = () => {
    const data = new Date().toLocaleDateString('pt-BR');
    const csvContent = [
      ['Nome', 'Cargo', 'Status', 'Entrada', 'Saída'].join(','),
      ...registrosHoje.map(r => [
        r.nome,
        r.cargo,
        r.estaPresente ? 'Presente' : 'Ausente',
        r.entrada ? new Date(r.entrada).toLocaleTimeString('pt-BR') : '-',
        r.saida ? new Date(r.saida).toLocaleTimeString('pt-BR') : '-',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-ponto-${data}.csv`;
    link.click();
    toast.success('Relatório exportado com sucesso!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              Dashboard de Ponto
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Visão geral em tempo real - {dataSelecionada.toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={mostrarRanking ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMostrarRanking(true)}
              className="gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Ranking
            </Button>
            <Button
              variant={!mostrarRanking ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMostrarRanking(false)}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Lista
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/ponto-ajustes')}
              className="gap-2"
            >
              <FileEdit className="h-4 w-4" />
              Ajustes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/ponto-produtividade')}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Produtividade
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/ponto-escalas')}
              className="gap-2"
            >
              <CalendarClock className="h-4 w-4" />
              Escalas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/ponto-justificativas')}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Justificativas
            </Button>
            {user?.role === 'admin' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/ponto-configuracoes')}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Configurações
              </Button>
            )}
            <Button onClick={exportarRelatorio} size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </motion.div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-400">
                  {colaboradores.length}
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-300">
                  Colaboradores
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Presentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-blue-700 dark:text-blue-400">
                  {presentes.length}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  No expediente
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-amber-500 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Atrasados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-amber-700 dark:text-amber-400">
                  {atrasados.length}
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-300">
                  Fora do horário
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-red-500 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Ausentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-red-700 dark:text-red-400">
                  {ausentes.length}
                </p>
                <p className="text-sm text-red-600 dark:text-red-300">
                  Não registraram
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Alertas de Fraude */}
        {alertasFraude.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mb-8"
          >
            <Card className="border-red-500 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  Alertas de Fraude Detectados
                </CardTitle>
                <CardDescription className="text-red-600 dark:text-red-300">
                  {alertasFraude.length} alerta(s) de possível fraude
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alertasFraude.map((alerta, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="p-3 bg-white dark:bg-slate-900 border border-red-300 dark:border-red-700 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <span className="font-semibold text-red-900 dark:text-red-100">
                          {alerta.tipo === 'mesmo_dispositivo' ? 'Mesmo Dispositivo' :
                           alerta.tipo === 'mesma_localizacao' ? 'Mesma Localização' :
                           'Tempo Insuficiente'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                        {alerta.descricao}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Botão para Expandir Gráficos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6 flex justify-center"
        >
          <Button
            variant="outline"
            size="lg"
            onClick={() => setMostrarGraficos(!mostrarGraficos)}
            className="flex items-center gap-2 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
          >
            {mostrarGraficos ? (
              <>
                <ChevronUp className="h-5 w-5" />
                Ocultar Gráficos de Tendência
              </>
            ) : (
              <>
                <ChevronDown className="h-5 w-5" />
                Ver Gráficos de Tendência
              </>
            )}
          </Button>
        </motion.div>

        {/* Gráficos de Tendência - Colapsáveis */}
        {mostrarGraficos && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Gráfico de Presença ao Longo do Mês */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Presença ao Longo do Mês
                </CardTitle>
                <CardDescription>
                  Comparativo de presentes x ausentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dadosPresencaMensal}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="presentes" stroke="#10b981" strokeWidth={2} name="Presentes" />
                    <Line type="monotone" dataKey="ausentes" stroke="#ef4444" strokeWidth={2} name="Ausentes" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Horas Extras por Dia da Semana */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horas Extras por Dia da Semana
                </CardTitle>
                <CardDescription>
                  Distribuição de horas extras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosHorasExtrasPorDia}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="horas" fill="#3b82f6" name="Horas Extras" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Heatmap de Horários de Pico - Full Width */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Horários de Pico de Entradas
                </CardTitle>
                <CardDescription>
                  Distribuição de entradas por horário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosHorariosPico}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="horario" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="entradas" fill="#8b5cf6" name="Entradas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Lista de Colaboradores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Status dos Colaboradores
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMostrarColaboradores(!mostrarColaboradores)}
                  className="h-8 w-8 p-0"
                >
                  {mostrarColaboradores ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CardTitle>
              <CardDescription>
                Visão detalhada de todos os colaboradores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mostrarColaboradores && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-3">
                {registrosHoje.map((colaborador, index) => (
                  <motion.div
                    key={colaborador.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      colaborador.estaPresente 
                        ? 'bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800' 
                        : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${
                        colaborador.estaPresente 
                          ? 'bg-emerald-100 dark:bg-emerald-900' 
                          : 'bg-slate-100 dark:bg-slate-800'
                      }`}>
                        <Users className={`h-6 w-6 ${
                          colaborador.estaPresente 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-slate-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {colaborador.nome}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {colaborador.cargo} • Turno: {colaborador.turnoInicio} - {colaborador.turnoFim}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        colaborador.estaPresente 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400' 
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {colaborador.estaPresente ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Presente
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-1" />
                            Ausente
                          </>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        {colaborador.entrada && (
                          <p>Entrada: {new Date(colaborador.entrada).toLocaleTimeString('pt-BR')}</p>
                        )}
                        {colaborador.saida && (
                          <p>Saída: {new Date(colaborador.saida).toLocaleTimeString('pt-BR')}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Ranking de Pontuação - Promoções */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Ranking de Pontuação - Promoções
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMostrarListaRanking(!mostrarListaRanking)}
                  className="h-8 w-8 p-0"
                >
                  {mostrarListaRanking ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CardTitle>
              <CardDescription>
                Classificação baseada em horas extras, assiduidade e pontualidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mostrarListaRanking && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-3">
                {ranking.map((item, index) => (
                  <motion.div
                    key={item.colaboradorId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    className={`p-4 rounded-lg ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-800 border-2 border-yellow-500' :
                      index === 1 ? 'bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 border-2 border-slate-400' :
                      index === 2 ? 'bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 border-2 border-orange-500' :
                      'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-slate-400 text-white' :
                          index === 2 ? 'bg-orange-500 text-white' :
                          'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{item.colaboradorNome}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {item.diasTrabalhados} dias • {item.horasExtras.toFixed(1)}h extras
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{item.pontuacao}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">pontos</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Horas totais:</span>
                        <span className="font-medium">{item.horasTotais.toFixed(1)}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Atrasos:</span>
                        <span className="font-medium text-red-600">{item.atrasos}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Horas normais:</span>
                        <span className="font-medium">{item.horasNormais.toFixed(1)}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Saídas antecipadas:</span>
                        <span className="font-medium text-red-600">{item.saidasAntecipadas}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PontoGerencial;
