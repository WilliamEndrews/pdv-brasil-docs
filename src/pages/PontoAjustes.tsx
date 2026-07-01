// src/pages/PontoAjustes.tsx
// Tela de Aprovação de Ajustes de Ponto - PDV Brasil
// Versão: 1.0

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePontoStore } from '@/store/pontoStore';
import { useAuth } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PontoAjustes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    ajustesPendentes, 
    solicitarAjuste, 
    aprovarAjuste, 
    rejeitarAjuste,
    colaboradores
  } = usePontoStore();
  
  const [colaboradorId, setColaboradorId] = useState('');
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada');
  const [dataOriginal, setDataOriginal] = useState('');
  const [dataProposta, setDataProposta] = useState('');
  const [motivo, setMotivo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendente' | 'aprovado' | 'rejeitado'>('pendente');
  const [comentarioAprovacao, setComentarioAprovacao] = useState('');
  const [comentarioRejeicao, setComentarioRejeicao] = useState('');
  const [ajusteSelecionado, setAjusteSelecionado] = useState<string | null>(null);

  const handleSubmitSolicitacao = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!colaboradorId || !dataOriginal || !dataProposta || !motivo) {
      toast.error('Preencha todos os campos');
      return;
    }

    const colaborador = colaboradores.find(c => c.id === colaboradorId);
    if (!colaborador) {
      toast.error('Colaborador não encontrado');
      return;
    }

    solicitarAjuste({
      colaboradorId,
      colaboradorNome: colaborador.nome,
      dataOriginal,
      dataProposta,
      tipo,
      motivo,
      solicitadoPor: user?.id,
    });

    toast.success('Solicitação de ajuste enviada com sucesso!');
    setColaboradorId('');
    setDataOriginal('');
    setDataProposta('');
    setMotivo('');
  };

  const handleAprovar = () => {
    if (ajusteSelecionado && user?.id) {
      aprovarAjuste(ajusteSelecionado, user.id, comentarioAprovacao);
      toast.success('Ajuste aprovado com sucesso!');
      setAjusteSelecionado(null);
      setComentarioAprovacao('');
    }
  };

  const handleRejeitar = () => {
    if (ajusteSelecionado && user?.id) {
      rejeitarAjuste(ajusteSelecionado, user.id, comentarioRejeicao);
      toast.success('Ajuste rejeitado com sucesso!');
      setAjusteSelecionado(null);
      setComentarioRejeicao('');
    }
  };

  const ajustesFiltrados = ajustesPendentes.filter(a => 
    filtroStatus === 'todos' ? true : a.status === filtroStatus
  );

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
            Ajustes de Ponto
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Solicite ou aprove correções de registro de ponto
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
                  <Clock className="h-5 w-5" />
                  Solicitar Ajuste
                </CardTitle>
                <CardDescription>
                  Solicite correção de registro de ponto
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
                          {colab.nome} - {colab.cargo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="tipo">Tipo de Registro</Label>
                    <select
                      id="tipo"
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value as 'entrada' | 'saida')}
                      className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
                    >
                      <option value="entrada">Entrada</option>
                      <option value="saida">Saída</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="dataOriginal">Data/Hora Original</Label>
                    <Input
                      id="dataOriginal"
                      type="datetime-local"
                      value={dataOriginal}
                      onChange={(e) => setDataOriginal(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="dataProposta">Data/Hora Proposta</Label>
                    <Input
                      id="dataProposta"
                      type="datetime-local"
                      value={dataProposta}
                      onChange={(e) => setDataProposta(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="motivo">Motivo</Label>
                    <Textarea
                      id="motivo"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Explique o motivo do ajuste..."
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Enviar Solicitação
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Lista de Ajustes */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Histórico de Ajustes
                </CardTitle>
                <CardDescription className="flex items-center justify-between">
                  <span>Total: {ajustesFiltrados.length}</span>
                  <div className="flex gap-2">
                    <Button
                      variant={filtroStatus === 'pendente' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFiltroStatus('pendente')}
                    >
                      Pendentes ({ajustesPendentes.filter(a => a.status === 'pendente').length})
                    </Button>
                    <Button
                      variant={filtroStatus === 'aprovado' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFiltroStatus('aprovado')}
                    >
                      Aprovados ({ajustesPendentes.filter(a => a.status === 'aprovado').length})
                    </Button>
                    <Button
                      variant={filtroStatus === 'rejeitado' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFiltroStatus('rejeitado')}
                    >
                      Rejeitados ({ajustesPendentes.filter(a => a.status === 'rejeitado').length})
                    </Button>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {ajustesFiltrados.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">
                      Nenhum ajuste encontrado
                    </p>
                  ) : (
                    ajustesFiltrados.map((ajuste) => (
                      <motion.div
                        key={ajuste.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg border ${
                          ajuste.status === 'pendente' ? 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700' :
                          ajuste.status === 'aprovado' ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-700' :
                          'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {ajuste.colaboradorNome}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {ajuste.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ajuste.status === 'pendente' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100' :
                            ajuste.status === 'aprovado' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                          }`}>
                            {ajuste.status === 'pendente' ? 'Pendente' : ajuste.status === 'aprovado' ? 'Aprovado' : 'Rejeitado'}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm mb-3">
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Original:</span>
                            <span className="text-red-600 dark:text-red-400">
                              {new Date(ajuste.dataOriginal).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Proposta:</span>
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {new Date(ajuste.dataProposta).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <div className="mt-2">
                            <span className="text-slate-600 dark:text-slate-400">Motivo:</span>
                            <p className="text-slate-900 dark:text-white mt-1">
                              {ajuste.motivo}
                            </p>
                          </div>
                        </div>

                        {ajuste.status !== 'pendente' && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                              {ajuste.status === 'aprovado' ? 'Aprovado por' : 'Rejeitado por'}: {ajuste.aprovadoPor || ajuste.rejeitadoPor}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Em: {new Date(ajuste.aprovadoEm || ajuste.rejeitadoEm || '').toLocaleString('pt-BR')}
                            </p>
                            {(ajuste.comentarioAprovacao || ajuste.comentarioRejeicao) && (
                              <p className="text-xs text-slate-900 dark:text-white mt-2 italic">
                                "{ajuste.comentarioAprovacao || ajuste.comentarioRejeicao}"
                              </p>
                            )}
                          </div>
                        )}

                        {ajuste.status === 'pendente' && (
                          <div className="mt-3">
                            {ajusteSelecionado === ajuste.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  placeholder={ajusteSelecionado ? "Comentário de aprovação..." : "Comentário de rejeição..."}
                                  value={comentarioAprovacao || comentarioRejeicao}
                                  onChange={(e) => {
                                    if (ajusteSelecionado) {
                                      setComentarioAprovacao(e.target.value);
                                    }
                                  }}
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
                                      setAjusteSelecionado(null);
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
                                  onClick={() => setAjusteSelecionado(ajuste.id)}
                                  size="sm"
                                  className="flex-1"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Aprovar
                                </Button>
                                <Button
                                  onClick={() => {
                                    setAjusteSelecionado(ajuste.id);
                                    setComentarioRejeicao(comentarioRejeicao);
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

export default PontoAjustes;
