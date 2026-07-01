// src/pages/Relatorios.tsx
// Página de Relatórios Detalhados - PDV Brasil
// Sistema completo de relatórios com dados reais e integração total
// @version 2.0 - Integração com dados reais do caixaStore
// @author Guilherme Endrews

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCaixaStore } from '@/store/caixaStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Package,
  ShoppingBag,
  Calendar,
  Download,
  BarChart3,
  PieChart,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const Relatorios = () => {
  const navigate = useNavigate();
  const {
    getRelatorioCompleto,
    getVendasDiarias,
    historico,
  } = useCaixaStore();

  const [periodo, setPeriodo] = useState<'hoje' | '7dias' | '30dias' | 'personalizado'>('7dias');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [relatorio, setRelatorio] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  // Configurar período padrão
  useEffect(() => {
    const hoje = new Date();
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(hoje.getDate() - 6);
    
    setDataInicio(seteDiasAtras.toISOString().split('T')[0]);
    setDataFim(hoje.toISOString().split('T')[0]);
    setMounted(true);
  }, []);

  // Atualizar relatório quando período mudar
  useEffect(() => {
    if (!mounted || !dataInicio || !dataFim) return;

    const periodoObj = { inicio: dataInicio, fim: dataFim };
    const dados = getRelatorioCompleto(periodoObj);
    setRelatorio(dados);
  }, [dataInicio, dataFim, mounted, historico]);

  // Handler para mudança de período
  const handlePeriodoChange = (novoPeriodo: 'hoje' | '7dias' | '30dias' | 'personalizado') => {
    setPeriodo(novoPeriodo);
    const hoje = new Date();

    switch (novoPeriodo) {
      case 'hoje':
        setDataInicio(hoje.toISOString().split('T')[0]);
        setDataFim(hoje.toISOString().split('T')[0]);
        break;
      case '7dias':
        const seteDiasAtras = new Date();
        seteDiasAtras.setDate(hoje.getDate() - 6);
        setDataInicio(seteDiasAtras.toISOString().split('T')[0]);
        setDataFim(hoje.toISOString().split('T')[0]);
        break;
      case '30dias':
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(hoje.getDate() - 29);
        setDataInicio(trintaDiasAtras.toISOString().split('T')[0]);
        setDataFim(hoje.toISOString().split('T')[0]);
        break;
      case 'personalizado':
        // Mantém as datas atuais
        break;
    }
  };

  // Exportar relatório
  const exportarRelatorio = () => {
    if (!relatorio) return;

    const csvContent = [
      ['Métrica', 'Valor'].join(','),
      ['Vendas Totais', `R$ ${relatorio.vendasTotais.toFixed(2)}`].join(','),
      ['Pedidos', relatorio.pedidos].join(','),
      ['Ticket Médio', `R$ ${relatorio.ticketMedio.toFixed(2)}`].join(','),
      '',
      ['Método de Pagamento', 'Total', 'Quantidade', 'Percentual'].join(','),
      ...Object.entries(relatorio.porMetodo).map(([metodo, dados]: any) => [
        metodo,
        `R$ ${dados.total.toFixed(2)}`,
        dados.quantidade,
        `${dados.percentual.toFixed(1)}%`
      ].join(',')),
      '',
      ['Produto', 'Quantidade', 'Total'].join(','),
      ...relatorio.produtosTop.map((p: any) => [
        p.produtoNome,
        p.quantidade,
        `R$ ${p.total.toFixed(2)}`
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-${dataInicio}-${dataFim}.csv`;
    link.click();
    toast.success('Relatório exportado com sucesso!');
  };

  // Formatar data
  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Formatar moeda
  const formatarMoeda = (valor: number) => {
    return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (!mounted || !relatorio) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

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
            <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              Relatórios
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Análises detalhadas e métricas de vendas
            </p>
          </div>
          <Button onClick={exportarRelatorio} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </motion.div>

        {/* Filtros de Período */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Período do Relatório
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Período Predefinido</Label>
                  <Select value={periodo} onValueChange={handlePeriodoChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hoje">Hoje</SelectItem>
                      <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                      <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                      <SelectItem value="personalizado">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    disabled={periodo !== 'personalizado'}
                  />
                </div>
                <div>
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    disabled={periodo !== 'personalizado'}
                  />
                </div>
                <div className="flex items-end">
                  <div className="text-sm text-muted-foreground">
                    {formatarData(dataInicio)} a {formatarData(dataFim)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cards de Resumo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6"
        >
          <Card className="border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Vendas Totais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                {formatarMoeda(relatorio.vendasTotais)}
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-300">
                Período selecionado
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                {relatorio.pedidos}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Total de vendas
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-purple-700 dark:text-purple-400 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Ticket Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                {formatarMoeda(relatorio.ticketMedio)}
              </p>
              <p className="text-sm text-purple-600 dark:text-purple-300">
                Valor médio por pedido
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-700 dark:text-orange-400 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produtos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">
                {relatorio.produtosTop.length}
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-300">
                Top produtos vendidos
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs de Relatórios */}
        <Tabs defaultValue="vendas" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="vendas" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Vendas Diárias
            </TabsTrigger>
            <TabsTrigger value="metodos" className="gap-2">
              <PieChart className="h-4 w-4" />
              Métodos Pagamento
            </TabsTrigger>
            <TabsTrigger value="produtos" className="gap-2">
              <Package className="h-4 w-4" />
              Produtos Top
            </TabsTrigger>
            <TabsTrigger value="detalhes" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Detalhes
            </TabsTrigger>
          </TabsList>

          {/* Tab: Vendas Diárias */}
          <TabsContent value="vendas">
            <Card>
              <CardHeader>
                <CardTitle>Vendas Diárias</CardTitle>
                <CardDescription>Evolução de vendas ao longo do período</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {relatorio.vendasDiarias.map((dia: any, index: number) => {
                      const maxValor = Math.max(...relatorio.vendasDiarias.map((d: any) => d.total));
                      const porcentagem = maxValor > 0 ? (dia.total / maxValor) * 100 : 0;
                      
                      return (
                        <motion.div
                          key={dia.data}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="space-y-2"
                        >
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {formatarData(dia.data)}
                            </span>
                            <div className="flex gap-4">
                              <span className="text-slate-600 dark:text-slate-400">
                                {dia.pedidos} pedidos
                              </span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatarMoeda(dia.total)}
                              </span>
                            </div>
                          </div>
                          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${porcentagem}%` }}
                              transition={{ duration: 0.5, delay: index * 0.05 }}
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Métodos de Pagamento */}
          <TabsContent value="metodos">
            <Card>
              <CardHeader>
                <CardTitle>Vendas por Método de Pagamento</CardTitle>
                <CardDescription>Distribuição de vendas por forma de pagamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(relatorio.porMetodo).map(([metodo, dados]: [string, any]) => {
                    const metodoIcon = {
                      dinheiro: Banknote,
                      cartao: CreditCard,
                      pix: Smartphone,
                      outros: Package,
                    }[metodo] || Package;

                    const MetodoIcon = metodoIcon;

                    return (
                      <motion.div
                        key={metodo}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-primary/10 text-primary">
                              <MetodoIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-white capitalize">
                                {metodo}
                              </h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {dados.quantidade} transações
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-sm">
                            {dados.percentual.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${dados.percentual}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                          />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Total</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatarMoeda(dados.total)}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}

                  {Object.keys(relatorio.porMetodo).length === 0 && (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                      Nenhuma venda registrada neste período
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Produtos Top */}
          <TabsContent value="produtos">
            <Card>
              <CardHeader>
                <CardTitle>Produtos Mais Vendidos</CardTitle>
                <CardDescription>Top 5 produtos por quantidade</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {relatorio.produtosTop.map((produto: any, index: number) => {
                    const maxQuantidade = Math.max(...relatorio.produtosTop.map((p: any) => p.quantidade));
                    const porcentagem = maxQuantidade > 0 ? (produto.quantidade / maxQuantidade) * 100 : 0;

                    return (
                      <motion.div
                        key={produto.produtoId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              index === 0 ? 'bg-yellow-500 text-white' :
                              index === 1 ? 'bg-slate-400 text-white' :
                              index === 2 ? 'bg-orange-500 text-white' :
                              'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-white">
                                {produto.produtoNome}
                              </h4>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                              {produto.quantidade}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">unidades</p>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${porcentagem}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                          />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Faturamento</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {formatarMoeda(produto.total)}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}

                  {relatorio.produtosTop.length === 0 && (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                      Nenhum produto vendido neste período
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Detalhes */}
          <TabsContent value="detalhes">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Período</CardTitle>
                <CardDescription>Informações resumidas do período selecionado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Período</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {formatarData(dataInicio)} a {formatarData(dataFim)}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Média Diária</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {formatarMoeda(relatorio.vendasTotais / relatorio.vendasDiarias.length)}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Métodos de Pagamento</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(relatorio.porMetodo).map(([metodo, dados]: [string, any]) => (
                        <div key={metodo}>
                          <p className="text-xs text-slate-600 dark:text-slate-400 capitalize">{metodo}</p>
                          <p className="text-lg font-semibold text-slate-900 dark:text-white">
                            {formatarMoeda(dados.total)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            {dados.quantidade} vendas
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Resumo</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Vendas Totais</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formatarMoeda(relatorio.vendasTotais)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Pedidos</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {relatorio.pedidos}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Ticket Médio</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formatarMoeda(relatorio.ticketMedio)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Produtos Diferentes</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {relatorio.produtosTop.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Relatorios;
