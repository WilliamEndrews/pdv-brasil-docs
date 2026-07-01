// src/pages/PontoProdutividade.tsx
// Relatório de Produtividade - PDV Brasil
// Versão: 1.0

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePontoStore } from '@/store/pontoStore';
import { useAuth } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  ArrowLeft,
  Download,
  Calendar,
  Users,
  Clock,
  Award,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PontoProdutividade = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { colaboradores, calcularHorasTrabalhadas, getRankingPontuacao } = usePontoStore();
  
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());

  const ranking = getRankingPontuacao(mesSelecionado, anoSelecionado);

  const exportarRelatorio = () => {
    const csv = [
      ['Colaborador', 'Dias Trabalhados', 'Horas Totais', 'Horas Extras', 'Atrasos', 'Saídas Antecipadas', 'Pontuação'],
      ...ranking.map(r => [
        r.colaboradorNome,
        r.diasTrabalhados,
        r.horasTotais.toFixed(1),
        r.horasExtras.toFixed(1),
        r.atrasos,
        r.saidasAntecipadas,
        r.pontuacao
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `produtividade_${mesSelecionado + 1}_${anoSelecionado}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Relatório de Produtividade
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Análise detalhada de desempenho por colaborador
          </p>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 flex flex-wrap gap-4 items-center"
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <select
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(Number(e.target.value))}
              className="h-10 px-3 py-2 border border-input bg-background rounded-md"
            >
              {meses.map((mes, index) => (
                <option key={index} value={index}>{mes}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <select
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(Number(e.target.value))}
              className="h-10 px-3 py-2 border border-input bg-background rounded-md"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(ano => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
          </div>
          <Button onClick={exportarRelatorio} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </motion.div>

        {/* KPIs Globais */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Total Colaboradores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-700 dark:text-blue-400">
                {colaboradores.length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horas Extras Totais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-400">
                {ranking.reduce((acc, r) => acc + r.horasExtras, 0).toFixed(1)}h
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-500 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Pontuação Média
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-amber-700 dark:text-amber-400">
                {ranking.length > 0 ? Math.round(ranking.reduce((acc, r) => acc + r.pontuacao, 0) / ranking.length) : 0}
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-purple-700 dark:text-purple-400 flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Performer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
                {ranking[0]?.colaboradorNome || '-'}
              </p>
              <p className="text-sm text-purple-600 dark:text-purple-300">
                {ranking[0]?.pontuacao || 0} pontos
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabela Detalhada */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Detalhamento por Colaborador
              </CardTitle>
              <CardDescription>
                {meses[mesSelecionado]} de {anoSelecionado}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">#</th>
                      <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">Colaborador</th>
                      <th className="text-center py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">Dias</th>
                      <th className="text-center py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">Horas Totais</th>
                      <th className="text-center py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">Horas Extras</th>
                      <th className="text-center py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">Atrasos</th>
                      <th className="text-center py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">Saídas Antecipadas</th>
                      <th className="text-center py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">Pontuação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((item, index) => (
                      <motion.tr
                        key={item.colaboradorId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        className={`border-b border-slate-100 dark:border-slate-800 ${
                          index === 0 ? 'bg-yellow-50 dark:bg-yellow-950' :
                          index === 1 ? 'bg-slate-50 dark:bg-slate-900' :
                          index === 2 ? 'bg-orange-50 dark:bg-orange-950' :
                          ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-slate-400 text-white' :
                            index === 2 ? 'bg-orange-500 text-white' :
                            'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {item.colaboradorNome}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-700 dark:text-slate-300">
                          {item.diasTrabalhados}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-700 dark:text-slate-300">
                          {item.horasTotais.toFixed(1)}h
                        </td>
                        <td className="py-3 px-4 text-center text-blue-600 dark:text-blue-400 font-semibold">
                          {item.horasExtras.toFixed(1)}h
                        </td>
                        <td className="py-3 px-4 text-center text-red-600 dark:text-red-400">
                          {item.atrasos}
                        </td>
                        <td className="py-3 px-4 text-center text-red-600 dark:text-red-400">
                          {item.saidasAntecipadas}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            item.pontuacao >= 500 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100' :
                            item.pontuacao >= 300 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                          }`}>
                            {item.pontuacao}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PontoProdutividade;
