// src/pages/Fila.tsx
// Página de Fila de Clientes - PDV Brasil
// @version 1.0

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Users,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  Trash2,
} from 'lucide-react';

interface ClienteFila {
  id: string;
  nome: string;
  telefone?: string;
  status: 'aguardando' | 'atendendo' | 'finalizado';
  horaChegada: string;
  tempoEspera: number;
}

const Fila = () => {
  const navigate = useNavigate();
  const [fila, setFila] = useState<ClienteFila[]>([]);
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');

  useEffect(() => {
    // Carregar fila do localStorage
    const filaSalva = localStorage.getItem('pdv-fila');
    if (filaSalva) {
      setFila(JSON.parse(filaSalva));
    }
  }, []);

  useEffect(() => {
    // Salvar fila no localStorage
    localStorage.setItem('pdv-fila', JSON.stringify(fila));
  }, [fila]);

  // Atualizar tempo de espera a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setFila(filaAtual => 
        filaAtual.map(cliente => ({
          ...cliente,
          tempoEspera: Math.floor((Date.now() - new Date(cliente.horaChegada).getTime()) / 60000)
        }))
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const adicionarCliente = () => {
    if (!nomeCliente.trim()) {
      toast.error('Nome do cliente é obrigatório');
      return;
    }

    const novoCliente: ClienteFila = {
      id: Date.now().toString(),
      nome: nomeCliente,
      telefone: telefoneCliente || undefined,
      status: 'aguardando',
      horaChegada: new Date().toISOString(),
      tempoEspera: 0,
    };

    setFila([...fila, novoCliente]);
    setNomeCliente('');
    setTelefoneCliente('');
    toast.success('Cliente adicionado à fila');
  };

  const atualizarStatus = (id: string, novoStatus: ClienteFila['status']) => {
    setFila(fila.map(cliente => 
      cliente.id === id ? { ...cliente, status: novoStatus } : cliente
    ));
    toast.success('Status atualizado');
  };

  const removerCliente = (id: string) => {
    setFila(fila.filter(cliente => cliente.id !== id));
    toast.success('Cliente removido da fila');
  };

  const getStatusIcon = (status: ClienteFila['status']) => {
    switch (status) {
      case 'aguardando':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'atendendo':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'finalizado':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: ClienteFila['status']) => {
    switch (status) {
      case 'aguardando':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      case 'atendendo':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
      case 'finalizado':
        return 'border-green-500 bg-green-50 dark:bg-green-950';
      default:
        return '';
    }
  };

  const filaFiltrada = fila.filter(c => c.status !== 'finalizado');
  const filaFinalizada = fila.filter(c => c.status === 'finalizado');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Fila de Clientes
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Gerencie a fila de espera
          </p>
        </motion.div>

        {/* Adicionar Cliente */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Nome do cliente"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && adicionarCliente()}
              />
              <Input
                placeholder="Telefone (opcional)"
                value={telefoneCliente}
                onChange={(e) => setTelefoneCliente(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && adicionarCliente()}
              />
              <Button onClick={adicionarCliente}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Aguardando</p>
                  <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">
                    {filaFiltrada.filter(c => c.status === 'aguardando').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Em Atendimento</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                    {filaFiltrada.filter(c => c.status === 'atendendo').length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500 bg-green-50 dark:bg-green-950">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Finalizados</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                    {filaFinalizada.length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista da Fila */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Fila Ativa ({filaFiltrada.length})
          </h2>
          {filaFiltrada.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-slate-500 dark:text-slate-400">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nenhum cliente na fila</p>
              </CardContent>
            </Card>
          ) : (
            filaFiltrada.map((cliente, index) => (
              <motion.div
                key={cliente.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`border-2 ${getStatusColor(cliente.status)}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                            {cliente.nome}
                          </h3>
                          {cliente.telefone && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {cliente.telefone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {new Date(cliente.horaChegada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            {cliente.tempoEspera} min espera
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(cliente.status)}
                          {cliente.status === 'aguardando' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => atualizarStatus(cliente.id, 'atendendo')}
                            >
                              Atender
                            </Button>
                          )}
                          {cliente.status === 'atendendo' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => atualizarStatus(cliente.id, 'finalizado')}
                            >
                              Finalizar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removerCliente(cliente.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Finalizados */}
        {filaFinalizada.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Finalizados Hoje ({filaFinalizada.length})
            </h2>
            <div className="space-y-2">
              {filaFinalizada.map((cliente) => (
                <Card key={cliente.id} className="border-green-500 bg-green-50 dark:bg-green-950 opacity-60">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {cliente.nome}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {new Date(cliente.horaChegada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removerCliente(cliente.id)}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Fila;
