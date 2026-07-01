// src/pages/PontoJustificativas.tsx
// Sistema de Justificativas - PDV Brasil
// Fluxo de aprovação de justificativas para atrasos/saídas antecipadas
// Versão: 1.0

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useJustificativaStore, TipoJustificativa } from '@/store/justificativaStore';
import { useColaboradorStore } from '@/store/colaboradorStore';
import { useAuth } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  XCircle,
  Plus,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PontoJustificativas = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { colaboradores } = useColaboradorStore();
  const { 
    justificativas, 
    solicitarJustificativa, 
    aprovarJustificativa, 
    rejeitarJustificativa,
    getJustificativasPendentes 
  } = useJustificativaStore();

  const [colaboradorId, setColaboradorId] = useState('');
  const [tipo, setTipo] = useState<TipoJustificativa>('atraso');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [motivo, setMotivo] = useState('');
  const [evidencia, setEvidencia] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'pendente' | 'aprovado' | 'rejeitado'>('pendente');
  const [comentarioAprovacao, setComentarioAprovacao] = useState('');
  const [comentarioRejeicao, setComentarioRejeicao] = useState('');
  const [justificativaSelecionada, setJustificativaSelecionada] = useState<string | null>(null);

  const handleSubmitSolicitacao = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!colaboradorId || !data || !motivo) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const colaborador = colaboradores.find(c => c.id === colaboradorId);
    if (!colaborador) {
      toast.error('Colaborador não encontrado');
      return;
    }

    solicitarJustificativa({
      colaboradorId,
      colaboradorNome: colaborador.nome,
      tipo,
      data,
      motivo,
      evidencia,
      solicitadoPor: user?.id,
    });

    toast.success('Justificativa enviada com sucesso!');
    setColaboradorId('');
    setData(new Date().toISOString().split('T')[0]);
    setMotivo('');
    setEvidencia('');
  };

  const handleAprovar = () => {
    if (justificativaSelecionada && user?.id) {
      aprovarJustificativa(justificativaSelecionada, user.id, comentarioAprovacao);
      toast.success('Justificativa aprovada com sucesso!');
      setJustificativaSelecionada(null);
      setComentarioAprovacao('');
    }
  };

  const handleRejeitar = () => {
    if (justificativaSelecionada && user?.id) {
      rejeitarJustificativa(justificativaSelecionada, user.id, comentarioRejeicao);
      toast.success('Justificativa rejeitada com sucesso!');
      setJustificativaSelecionada(null);
      setComentarioRejeicao('');
    }
  };

  const justificativasFiltradas = justificativas.filter(j => 
    filtroStatus === 'todas' ? true : j.status === filtroStatus
  );

  const tiposJustificativa: TipoJustificativa[] = ['atraso', 'saida_antecipada', 'falta', 'outro'];

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
            Justificativas
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Solicite ou aprove justificativas para atrasos e saídas antecipadas
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário de Solicitação */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Solicitar Justificativa
                </CardTitle>
                <CardDescription>
                  Envie uma justificativa para ausência
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitSolicitacao} className="space-y-4">
                  <div>
                    <Label htmlFor="colaborador">Colaborador</Label>
                    <select
                      id="colaborador"
                      value={colaboradorId}
                      onChange={(e) => setColaboradorId(e.target.value)}
                      className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
                      required
                    >
                      <option value="">Selecione...</option>
                      {colaboradores.map((colab) => (
                        <option key={colab.id} value={colab.id}>
                          {colab.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="tipo">Tipo de Justificativa</Label>
                    <select
                      id="tipo"
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value as TipoJustificativa)}
                      className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
                    >
                      {tiposJustificativa.map((t) => (
                        <option key={t} value={t}>
                          {t === 'atraso' ? 'Atraso' : 
                           t === 'saida_antecipada' ? 'Saída Antecipada' :
                           t === 'falta' ? 'Falta' : 'Outro'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="data">Data</Label>
                    <Input
                      id="data"
                      type="date"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="motivo">Motivo</Label>
                    <Textarea
                      id="motivo"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Explique o motivo da justificativa..."
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="evidencia">Evidência (opcional)</Label>
                    <Input
                      id="evidencia"
                      value={evidencia}
                      onChange={(e) => setEvidencia(e.target.value)}
                      placeholder="URL ou descrição da evidência"
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Enviar Justificativa
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Lista de Justificativas */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Histórico de Justificativas
                </CardTitle>
                <CardDescription className="flex items-center justify-between">
                  <span>Total: {justificativasFiltradas.length}</span>
                  <div className="flex gap-2">
                    <Button
                      variant={filtroStatus === 'pendente' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFiltroStatus('pendente')}
                    >
                      Pendentes ({getJustificativasPendentes().length})
                    </Button>
                    <Button
                      variant={filtroStatus === 'aprovado' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFiltroStatus('aprovado')}
                    >
                      Aprovadas
                    </Button>
                    <Button
                      variant={filtroStatus === 'rejeitado' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFiltroStatus('rejeitado')}
                    >
                      Rejeitadas
                    </Button>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {justificativasFiltradas.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">
                      Nenhuma justificativa encontrada
                    </p>
                  ) : (
                    justificativasFiltradas.map((justificativa) => (
                      <motion.div
                        key={justificativa.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg border ${
                          justificativa.status === 'pendente' ? 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700' :
                          justificativa.status === 'aprovado' ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-700' :
                          'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {justificativa.colaboradorNome}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {justificativa.tipo === 'atraso' ? 'Atraso' :
                               justificativa.tipo === 'saida_antecipada' ? 'Saída Antecipada' :
                               justificativa.tipo === 'falta' ? 'Falta' : 'Outro'}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            justificativa.status === 'pendente' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100' :
                            justificativa.status === 'aprovado' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                          }`}>
                            {justificativa.status === 'pendente' ? 'Pendente' : justificativa.status === 'aprovado' ? 'Aprovado' : 'Rejeitado'}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm mb-3">
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Data:</span>
                            <span className="text-slate-900 dark:text-white">
                              {new Date(justificativa.data).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <div className="mt-2">
                            <span className="text-slate-600 dark:text-slate-400">Motivo:</span>
                            <p className="text-slate-900 dark:text-white mt-1">
                              {justificativa.motivo}
                            </p>
                          </div>
                          {justificativa.evidencia && (
                            <div className="mt-2">
                              <span className="text-slate-600 dark:text-slate-400">Evidência:</span>
                              <p className="text-slate-900 dark:text-white mt-1">
                                {justificativa.evidencia}
                              </p>
                            </div>
                          )}
                        </div>

                        {justificativa.status !== 'pendente' && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                              {justificativa.status === 'aprovado' ? 'Aprovado por' : 'Rejeitado por'}: {justificativa.aprovadoPor || justificativa.rejeitadoPor}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Em: {new Date(justificativa.aprovadoEm || justificativa.rejeitadoEm || '').toLocaleString('pt-BR')}
                            </p>
                            {(justificativa.comentarioAprovacao || justificativa.comentarioRejeicao) && (
                              <p className="text-xs text-slate-900 dark:text-white mt-2 italic">
                                "{justificativa.comentarioAprovacao || justificativa.comentarioRejeicao}"
                              </p>
                            )}
                          </div>
                        )}

                        {justificativa.status === 'pendente' && (
                          <div className="mt-3">
                            {justificativaSelecionada === justificativa.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  placeholder="Comentário de aprovação..."
                                  value={comentarioAprovacao}
                                  onChange={(e) => setComentarioAprovacao(e.target.value)}
                                  className="text-sm"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleAprovar}
                                    size="sm"
                                    className="flex-1"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Confirmar Aprovação
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setJustificativaSelecionada(null);
                                      setComentarioAprovacao('');
                                    }}
                                    size="sm"
                                    variant="outline"
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => setJustificativaSelecionada(justificativa.id)}
                                  size="sm"
                                  className="flex-1"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Aprovar
                                </Button>
                                <Button
                                  onClick={() => {
                                    setJustificativaSelecionada(justificativa.id);
                                  }}
                                  size="sm"
                                  variant="destructive"
                                  className="flex-1"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Rejeitar
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PontoJustificativas;
