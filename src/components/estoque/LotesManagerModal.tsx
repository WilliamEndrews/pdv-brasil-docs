// src/components/estoque/LotesManagerModal.tsx (VERSÃO 2.2 - HOOKS CORRIGIDOS)
// Última atualização: 25/01/2026
// Mudanças:
// - Todos os hooks (useForm, useWatch, useMemo, useEffect) movidos para o TOPO do componente
// - Resolvido o erro "Rendered more hooks than during the previous render"
// - Reatividade instantânea mantida (setor, estoque, tabela, badges)
// - Tela branca resolvida

import React, { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEstoqueStore, loteFormSchema, NovoLoteData, Produto, Lote } from '@/store/estoqueStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, SplitSquareHorizontal, Warehouse, Store } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface LotesManagerModalProps {
  produto: Produto | null;
  open: boolean;
  onClose: () => void;
}

export function LotesManagerModal({ produto, open, onClose }: LotesManagerModalProps) {
  // ==================== HOOKS - SEMPRE NO TOPO ====================
  const adicionarLote = useEstoqueStore(state => state.adicionarLote);
  const excluirLote = useEstoqueStore(state => state.excluirLote);
  const editarProduto = useEstoqueStore(state => state.editarProduto);
  const fornecedores = useEstoqueStore(state => state.fornecedores);

  // Produto mais atualizado do store (com comparação incluindo setor)
  const produtoAtual = useEstoqueStore(
    (state) => state.produtos.find(p => p.id === produto?.id),
    (a, b) => a?.id === b?.id &&
              a?.lotes.length === b?.lotes.length &&
              a?.lotes.reduce((acc, l) => acc + l.quantidade, 0) === b?.lotes.reduce((acc, l) => acc + l.quantidade, 0) &&
              a?.setor === b?.setor
  );

  const form = useForm<NovoLoteData>({
    resolver: zodResolver(loteFormSchema),
    defaultValues: {
      quantidadeTotal: 0,
      quantidadeDeposito: 0,
      quantidadeLoja: 0,
      precoCusto: 0,
      dataValidade: '',
      dataEntrada: new Date().toISOString().split('T')[0],
      numeroLoteFornecedor: '',
      fornecedorId: '',
      statusQualidade: 'aprovado',
      observacoes: '',
    },
  });

  const qtdDep = useWatch({ control: form.control, name: 'quantidadeDeposito' }) || 0;
  const qtdLoja = useWatch({ control: form.control, name: 'quantidadeLoja' }) || 0;

  React.useEffect(() => {
    const total = qtdDep + qtdLoja;
    form.setValue('quantidadeTotal', total, { shouldValidate: true });
  }, [qtdDep, qtdLoja, form]);

  // Chave dinâmica para forçar re-render da tabela quando o produto mudar
  const tableKey = useMemo(() => {
    return `${produtoAtual?.id ?? ''}-${produtoAtual?.setor ?? 'outros'}-${produtoAtual?.lotes.length ?? 0}-${produtoAtual?.lotes.reduce((acc, l) => acc + l.quantidade, 0) ?? 0}`;
  }, [produtoAtual]);

  // ==================== RENDERIZAÇÃO ====================
  if (!produtoAtual) return null;

  const handleSubmitLote = (data: NovoLoteData) => {
    adicionarLote(produtoAtual.id, data);
    toast.success(`Lote adicionado com sucesso ao produto ${produtoAtual.nome}!`);
    form.reset();
  };

  const handleExcluirLote = (loteId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este lote? Esta ação não pode ser desfeita.')) {
      excluirLote(produtoAtual.id, loteId);
      toast.success('Lote excluído com sucesso!');
    }
  };

  const handleSetorChange = (novoSetor: string) => {
    editarProduto(produtoAtual.id, { setor: novoSetor as any });
    toast.success(`Setor atualizado para ${novoSetor}`);
  };

  const estoqueLoja = produtoAtual.lotes.reduce((acc, l) => acc + (l.inventario.find(i => i.localId === 'loja')?.quantidade || 0), 0);
  const estoqueDeposito = produtoAtual.lotes.reduce((acc, l) => acc + (l.inventario.find(i => i.localId === 'deposito')?.quantidade || 0), 0);

  const somaStatus = qtdDep + qtdLoja === form.watch('quantidadeTotal') 
    ? 'correct' 
    : qtdDep + qtdLoja < form.watch('quantidadeTotal') 
      ? 'incomplete' 
      : 'exceeded';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b bg-muted/50">
          <DialogTitle>Lotes do Produto: {produtoAtual.nome}</DialogTitle>
        </DialogHeader>

        {/* Select de setor */}
        <div className="px-6 py-3 border-b bg-muted/30">
          <Label htmlFor="setor-select">Setor do Produto</Label>
          <Select 
            value={produtoAtual.setor ?? 'outros'} 
            onValueChange={handleSetorChange}
          >
            <SelectTrigger id="setor-select" className="w-full md:w-[300px] mt-1.5">
              <SelectValue placeholder="Selecione o setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eletronicos">Eletrônicos</SelectItem>
              <SelectItem value="alimentos">Alimentos</SelectItem>
              <SelectItem value="moda">Moda</SelectItem>
              <SelectItem value="outros">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Resumo de estoque */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 bg-muted rounded-lg border shadow-sm">
              <p className="text-sm text-muted-foreground">Estoque Loja</p>
              <p className="text-3xl font-bold">{estoqueLoja}</p>
            </div>
            <div className="p-6 bg-muted rounded-lg border shadow-sm">
              <p className="text-sm text-muted-foreground">Estoque Depósito</p>
              <p className="text-3xl font-bold">{estoqueDeposito}</p>
            </div>
          </div>

          {/* Lista de lotes */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Lotes Existentes</h3>
            {produtoAtual.lotes.length === 0 ? (
              <p className="text-muted-foreground italic">Nenhum lote cadastrado ainda.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border" key={tableKey}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">ID</TableHead>
                      <TableHead>Data Entrada</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Qtd. Depósito</TableHead>
                      <TableHead>Qtd. Loja</TableHead>
                      <TableHead>Preço Custo</TableHead>
                      <TableHead>Nº Lote Fornecedor</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Local Inicial</TableHead>
                      <TableHead>Status Qualidade</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead className="w-16 text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtoAtual.lotes.map(lote => {
                      const qtdDep = lote.inventario.find(i => i.localId === 'deposito')?.quantidade || 0;
                      const qtdLoja = lote.inventario.find(i => i.localId === 'loja')?.quantidade || 0;
                      const fornecedor = fornecedores.find(f => f.id === lote.fornecedorId)?.nome || '-';
                      const isDividido = lote.localizacaoInicial === 'dividido';

                      return (
                        <TableRow key={lote.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-mono text-xs">{lote.id.substring(0, 8)}</TableCell>
                          <TableCell>{format(new Date(lote.dataEntrada), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                          <TableCell>{format(new Date(lote.dataValidade), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                          <TableCell>{qtdDep}</TableCell>
                          <TableCell>{qtdLoja}</TableCell>
                          <TableCell>R$ {lote.precoCusto.toFixed(2)}</TableCell>
                          <TableCell>{lote.numeroLoteFornecedor || '-'}</TableCell>
                          <TableCell>{fornecedor}</TableCell>
                          <TableCell className="flex items-center gap-2">
                            {isDividido ? (
                              <SplitSquareHorizontal className="h-4 w-4 text-purple-600" />
                            ) : lote.localizacaoInicial === 'deposito' ? (
                              <Warehouse className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Store className="h-4 w-4 text-green-600" />
                            )}
                            <span className="capitalize">{lote.localizacaoInicial || '-'}</span>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={lote.statusQualidade === 'aprovado' ? "secondary" : "destructive"}
                              className={cn(
                                "border",
                                lote.statusQualidade === 'aprovado' 
                                  ? "bg-green-100 text-green-800 border-green-300" 
                                  : lote.statusQualidade === 'pendente' 
                                    ? "bg-yellow-100 text-yellow-800 border-yellow-300" 
                                    : "bg-red-100 text-red-800 border-red-300"
                              )}
                            >
                              {lote.statusQualidade.charAt(0).toUpperCase() + lote.statusQualidade.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{lote.observacoes || '-'}</TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleExcluirLote(lote.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Formulário de novo lote */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Adicionar Novo Lote</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmitLote)} className="space-y-6">
                {/* Quantidade Total */}
                <FormField
                  control={form.control}
                  name="quantidadeTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade Total do Lote</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          readOnly
                          className={cn(
                            "bg-gray-50 font-medium cursor-default text-center",
                            "transition-all duration-200",
                            somaStatus === 'correct' && "border-green-500 ring-1 ring-green-500/30",
                            somaStatus === 'incomplete' && "border-yellow-500 ring-1 ring-yellow-500/30",
                            somaStatus === 'exceeded' && "border-red-500 ring-1 ring-red-500/30"
                          )}
                          value={field.value || 0}
                          onChange={() => {}}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Divisão Depósito + Loja */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="quantidadeDeposito"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade para Depósito</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantidadeLoja"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade para Loja</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Preço de Custo */}
                <FormField
                  control={form.control}
                  name="precoCusto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Custo (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          {...field} 
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Datas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="dataEntrada"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Entrada</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dataValidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Validade</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Fornecedor */}
                <FormField
                  control={form.control}
                  name="fornecedorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornecedor (opcional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um fornecedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fornecedores.map(f => (
                            <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status Qualidade */}
                <FormField
                  control={form.control}
                  name="statusQualidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status de Qualidade</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="aprovado">Aprovado</SelectItem>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="rejeitado">Rejeitado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Observações */}
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Lote inspecionado, temperatura 5°C" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button type="submit">Adicionar Lote</Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}