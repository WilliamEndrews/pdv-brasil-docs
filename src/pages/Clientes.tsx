// src/pages/Clientes.tsx
// Página de Gestão de Clientes - PDV Brasil
// @version 1.0

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ArrowLeft,
  UserPlus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  cpf?: string;
  dataCadastro: string;
  totalCompras: number;
  ultimaCompra?: string;
}

const Clientes = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    endereco: '',
    cpf: '',
  });

  useEffect(() => {
    // Carregar clientes do localStorage
    const clientesSalvos = localStorage.getItem('pdv-clientes');
    if (clientesSalvos) {
      setClientes(JSON.parse(clientesSalvos));
    }
  }, []);

  useEffect(() => {
    // Salvar clientes no localStorage
    localStorage.setItem('pdv-clientes', JSON.stringify(clientes));
  }, [clientes]);

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(busca.toLowerCase()) ||
    cliente.telefone?.includes(busca) ||
    cliente.email?.toLowerCase().includes(busca)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error('Nome do cliente é obrigatório');
      return;
    }

    if (editando) {
      setClientes(clientes.map(c => 
        c.id === editando.id 
          ? { ...c, ...formData }
          : c
      ));
      toast.success('Cliente atualizado com sucesso');
      setEditando(null);
    } else {
      const novoCliente: Cliente = {
        id: Date.now().toString(),
        ...formData,
        dataCadastro: new Date().toISOString(),
        totalCompras: 0,
      };
      setClientes([...clientes, novoCliente]);
      toast.success('Cliente cadastrado com sucesso');
    }

    setFormData({ nome: '', telefone: '', email: '', endereco: '', cpf: '' });
    setDialogOpen(false);
  };

  const handleEditar = (cliente: Cliente) => {
    setEditando(cliente);
    setFormData({
      nome: cliente.nome,
      telefone: cliente.telefone || '',
      email: cliente.email || '',
      endereco: cliente.endereco || '',
      cpf: cliente.cpf || '',
    });
    setDialogOpen(true);
  };

  const handleExcluir = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      setClientes(clientes.filter(c => c.id !== id));
      toast.success('Cliente excluído com sucesso');
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditando(null);
    setFormData({ nome: '', telefone: '', email: '', endereco: '', cpf: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
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
              Gestão de Clientes
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Cadastre e gerencie seus clientes
            </p>
          </div>
        </motion.div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total de Clientes</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {clientes.length}
                  </p>
                </div>
                <UserPlus className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Cadastrados Hoje</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {clientes.filter(c => {
                      const hoje = new Date().toDateString();
                      return new Date(c.dataCadastro).toDateString() === hoje;
                    }).length}
                  </p>
                </div>
                <UserPlus className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Compras Totais</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    R$ {clientes.reduce((sum, c) => sum + c.totalCompras, 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
                <Phone className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Busca e Adicionar */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Buscar por nome, telefone ou email..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditando(null)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editando ? 'Editar Cliente' : 'Novo Cliente'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="cliente@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Rua, número, bairro, cidade"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editando ? 'Atualizar' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Clientes */}
        <Card>
          <CardHeader>
            <CardTitle>Clientes Cadastrados ({clientesFiltrados.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {clientesFiltrados.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nenhum cliente cadastrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clientesFiltrados.map((cliente, index) => (
                  <motion.div
                    key={cliente.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">
                              {cliente.nome}
                            </h3>
                            <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                              {cliente.telefone && (
                                <p className="flex items-center gap-2">
                                  <Phone className="w-4 h-4" />
                                  {cliente.telefone}
                                </p>
                              )}
                              {cliente.email && (
                                <p className="flex items-center gap-2">
                                  <Mail className="w-4 h-4" />
                                  {cliente.email}
                                </p>
                              )}
                              {cliente.endereco && (
                                <p className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  {cliente.endereco}
                                </p>
                              )}
                              {cliente.cpf && (
                                <p className="flex items-center gap-2">
                                  <span className="font-medium">CPF:</span>
                                  {cliente.cpf}
                                </p>
                              )}
                            </div>
                            <div className="mt-3 pt-3 border-t text-xs text-slate-500 dark:text-slate-500">
                              <p>Cadastrado em: {new Date(cliente.dataCadastro).toLocaleDateString('pt-BR')}</p>
                              {cliente.ultimaCompra && (
                                <p>Última compra: {new Date(cliente.ultimaCompra).toLocaleDateString('pt-BR')}</p>
                              )}
                              <p>Total de compras: R$ {cliente.totalCompras.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditar(cliente)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleExcluir(cliente.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Clientes;
