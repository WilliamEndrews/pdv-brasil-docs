// src/pages/PontoEscalas.tsx
// Sistema de Escalas - PDV Brasil
// Gestão de escalas semanais com detecção de conflitos
// Versão: 1.0

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useEscalaStore, DiaSemana } from '@/store/escalaStore';
import { usePontoStore } from '@/store/pontoStore';
import { useColaboradorStore } from '@/store/colaboradorStore';
import { useAuth } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Plus,
  Save,
  Users,
  Shield,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PontoEscalas = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { colaboradores } = useColaboradorStore();
  const { 
    escalas, 
    conflitos, 
    adicionarEscala, 
    getEscalaAtual,
    limparConflitos 
  } = useEscalaStore();
  
  // Funções do pontoStore expandido para conformidade legal
  const {
    gerarEscalaSemanalAutomatica,
    criarEscalaConfig,
    getAlertasLegais,
    verificarConformidadeLegal,
  } = usePontoStore();

  const [semanaInicio, setSemanaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [itensEscala, setItensEscala] = useState<Array<{
    colaboradorId: string;
    dia: DiaSemana;
    turnoInicio: string;
    turnoFim: string;
    tipo: 'trabalho' | 'folga';
  }>>([]);
  const [alertasConformidade, setAlertasConformidade] = useState<any[]>([]);
  const [mostrarConformidade, setMostrarConformidade] = useState(false);
  const [tipoEscala, setTipoEscala] = useState<'5x2' | '6x1' | '12x36'>('5x2');

  const diasSemana: DiaSemana[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

  const adicionarItemEscala = () => {
    setItensEscala([
      ...itensEscala,
      {
        colaboradorId: '',
        dia: 'segunda',
        turnoInicio: '08:00',
        turnoFim: '17:00',
        tipo: 'trabalho',
      },
    ]);
  };

  const atualizarItemEscala = (index: number, campo: string, valor: any) => {
    const novosItens = [...itensEscala];
    novosItens[index] = { ...novosItens[index], [campo]: valor };
    setItensEscala(novosItens);
  };

  const removerItemEscala = (index: number) => {
    setItensEscala(itensEscala.filter((_, i) => i !== index));
  };

  const handleSalvar = () => {
    if (itensEscala.length === 0) {
      toast.error('Adicione pelo menos um item à escala');
      return;
    }

    const escala = {
      semanaInicio,
      itens: itensEscala.map((item, index) => ({
        ...item,
        id: `item-${Date.now()}-${index}`,
        colaboradorNome: colaboradores.find((c) => c.id === item.colaboradorId)?.nome || '',
      })),
    };

    adicionarEscala(escala);
    
    // Criar configuração de escala no pontoStore para conformidade legal
    const diasTrabalhoArray: DiaSemana[] = tipoEscala === '5x2' 
      ? ['segunda', 'terca', 'quarta', 'quinta', 'sexta']
      : tipoEscala === '6x1'
      ? ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
      : ['segunda', 'quarta', 'sexta'];
    
    criarEscalaConfig({
      colaboradorId: user?.id || '',
      tipo: tipoEscala,
      dataInicio: semanaInicio,
      diasTrabalho: diasTrabalhoArray,
      diasFolga: tipoEscala === '5x2' 
        ? ['domingo', 'sabado']
        : tipoEscala === '6x1'
        ? ['domingo']
        : ['terca', 'quinta', 'domingo'],
      turnoInicio: '08:00',
      turnoFim: '17:00',
      intervaloMinutos: 60,
      horasSemanais: tipoEscala === '5x2' ? 40 : tipoEscala === '6x1' ? 44 : 36,
      ativa: true,
    });

    // Verificar conformidade legal
    const alertas = getAlertasLegais(user?.id || '', false);
    setAlertasConformidade(alertas);
    
    if (alertas.length > 0) {
      setMostrarConformidade(true);
      toast.warning('Escala salva, mas há alertas de conformidade legal');
    } else {
      toast.success('Escala salva com sucesso!');
    }
    
    setItensEscala([]);
    limparConflitos();
  };

  const escalaAtual = getEscalaAtual();

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
            Gerenciamento de Escalas
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Configure escalas semanais com detecção de conflitos
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário de Escala */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Nova Escala
                </CardTitle>
                <CardDescription>
                  Configure a escala semanal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Semana Início</Label>
                  <Input
                    type="date"
                    value={semanaInicio}
                    onChange={(e) => setSemanaInicio(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Tipo de Escala (Conformidade Legal)</Label>
                  <Select value={tipoEscala} onValueChange={(value: any) => setTipoEscala(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5x2">5x2 (40h semanais) - Recomendado pela nova lei</SelectItem>
                      <SelectItem value="6x1">6x1 (44h semanais) - Será proibido em 2026</SelectItem>
                      <SelectItem value="12x36">12x36 (36h semanais) - Plantonistas</SelectItem>
                    </SelectContent>
                  </Select>
                  {tipoEscala === '6x1' && (
                    <Alert className="mt-2 border-red-500 bg-red-50 dark:bg-red-950">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <AlertDescription className="text-red-700 dark:text-red-300">
                        ⚠️ A escala 6x1 será proibida em 2026. Considere migrar para 5x2.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Itens da Escala</Label>
                    <Button onClick={adicionarItemEscala} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>

                  {itensEscala.map((item, index) => (
                    <Card key={index} className="p-3">
                      <div className="space-y-2">
                        <Select
                          value={item.colaboradorId}
                          onValueChange={(value) => atualizarItemEscala(index, 'colaboradorId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Colaborador" />
                          </SelectTrigger>
                          <SelectContent>
                            {colaboradores.map((colab) => (
                              <SelectItem key={colab.id} value={colab.id}>
                                {colab.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={item.dia}
                          onValueChange={(value) => atualizarItemEscala(index, 'dia', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Dia" />
                          </SelectTrigger>
                          <SelectContent>
                            {diasSemana.map((dia) => (
                              <SelectItem key={dia} value={dia}>
                                {dia.charAt(0).toUpperCase() + dia.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={item.tipo}
                          onValueChange={(value) => atualizarItemEscala(index, 'tipo', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="trabalho">Trabalho</SelectItem>
                            <SelectItem value="folga">Folga</SelectItem>
                          </SelectContent>
                        </Select>

                        {item.tipo === 'trabalho' && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Início</Label>
                              <Input
                                type="time"
                                value={item.turnoInicio}
                                onChange={(e) => atualizarItemEscala(index, 'turnoInicio', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Fim</Label>
                              <Input
                                type="time"
                                value={item.turnoFim}
                                onChange={(e) => atualizarItemEscala(index, 'turnoFim', e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={() => removerItemEscala(index)}
                          size="sm"
                          variant="destructive"
                          className="w-full"
                        >
                          Remover
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                <Button onClick={handleSalvar} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Escala
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Conflitos e Escala Atual */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Alertas de Conformidade Legal */}
            {mostrarConformidade && alertasConformidade.length > 0 && (
              <Card className="border-orange-500 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                    <Shield className="h-5 w-5" />
                    Alertas de Conformidade Legal
                  </CardTitle>
                  <CardDescription className="text-orange-600 dark:text-orange-300">
                    {alertasConformidade.length} alerta(s) de possível violação trabalhista
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {alertasConformidade.map((alerta, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className={`p-3 rounded-lg border ${
                          alerta.severidade === 'critica'
                            ? 'bg-white dark:bg-slate-900 border-red-300 dark:border-red-700'
                            : alerta.severidade === 'alta'
                            ? 'bg-white dark:bg-slate-900 border-orange-300 dark:border-orange-700'
                            : 'bg-white dark:bg-slate-900 border-yellow-300 dark:border-yellow-700'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 mt-1 text-orange-600 dark:text-orange-400" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {alerta.tipo.replace(/_/g, ' ').toUpperCase()}
                              </span>
                              <Badge variant={alerta.severidade === 'critica' ? 'destructive' : 'secondary'} className="text-xs">
                                {alerta.severidade.toUpperCase()}
                              </Badge>
                            </div>
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {alerta.descricao}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMostrarConformidade(false)}
                    className="mt-4"
                  >
                    Fechar Alertas
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Conflitos */}
            {conflitos.length > 0 && (
              <Card className="border-red-500 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    Conflitos Detectados
                  </CardTitle>
                  <CardDescription className="text-red-600 dark:text-red-300">
                    {conflitos.length} problema(s) encontrado(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {conflitos.map((conflito, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className={`p-3 rounded-lg border ${
                          conflito.tipo === 'conflito' 
                            ? 'bg-white dark:bg-slate-900 border-red-300 dark:border-red-700' 
                            : 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {conflito.tipo === 'conflito' ? (
                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          )}
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {conflito.mensagem}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Escala Atual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Escala da Semana Atual
                </CardTitle>
                <CardDescription>
                  {escalaAtual ? `Iniciada em ${new Date(escalaAtual.semanaInicio).toLocaleDateString('pt-BR')}` : 'Nenhuma escala configurada para esta semana'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {escalaAtual ? (
                  <div className="space-y-3">
                    {diasSemana.map((dia) => {
                      const itensDia = escalaAtual.itens.filter((i) => i.dia === dia);
                      return (
                        <div key={dia} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                          <h4 className="font-semibold mb-2 capitalize">{dia}</h4>
                          {itensDia.length === 0 ? (
                            <p className="text-sm text-slate-500">Nenhum item</p>
                          ) : (
                            <div className="space-y-1">
                              {itensDia.map((item) => (
                                <div key={item.id} className="flex justify-between items-center text-sm">
                                  <span className="text-slate-700 dark:text-slate-300">
                                    {item.colaboradorNome}
                                  </span>
                                  {item.tipo === 'trabalho' ? (
                                    <span className="text-blue-600 dark:text-blue-400">
                                      {item.turnoInicio} - {item.turnoFim}
                                    </span>
                                  ) : (
                                    <span className="text-green-600 dark:text-green-400 font-semibold">
                                      FOLGA
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-8">
                    Configure uma escala para esta semana
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PontoEscalas;
