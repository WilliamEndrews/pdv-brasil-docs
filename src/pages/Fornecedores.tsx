// src/pages/Fornecedores.tsx (NOVA PÁGINA DEDICADA)

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEstoqueStore, fornecedorFormSchema, NovoFornecedorData, Fornecedor } from '@/store/estoqueStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

const FornecedoresPage = () => {
  const fornecedores = useEstoqueStore(state => state.fornecedores);
  const adicionarFornecedor = useEstoqueStore(state => state.adicionarFornecedor);
  const editarFornecedor = useEstoqueStore(state => state.editarFornecedor);
  const excluirFornecedor = useEstoqueStore(state => state.excluirFornecedor);
  const [fornecedorEmEdicao, setFornecedorEmEdicao] = useState<Fornecedor | null>(null);

  const form = useForm<NovoFornecedorData>({
    resolver: zodResolver(fornecedorFormSchema),
    defaultValues: { nome: '', cnpj: '', contato: '' },
  });

  useEffect(() => {
    if (fornecedorEmEdicao) {
      form.reset({
        nome: fornecedorEmEdicao.nome,
        cnpj: fornecedorEmEdicao.cnpj || '',
        contato: fornecedorEmEdicao.contato || '',
      });
    } else {
      form.reset({ nome: '', cnpj: '', contato: '' });
    }
  }, [fornecedorEmEdicao, form]);

  function onSubmit(data: NovoFornecedorData) {
    if (fornecedorEmEdicao) {
      editarFornecedor(fornecedorEmEdicao.id, data);
      toast.success("Fornecedor atualizado com sucesso!");
      setFornecedorEmEdicao(null);
    } else {
      adicionarFornecedor(data);
      toast.success("Fornecedor adicionado com sucesso!");
    }
    form.reset({ nome: '', cnpj: '', contato: '' });
  }

  const handleEdit = (fornecedor: Fornecedor) => {
    setFornecedorEmEdicao(fornecedor);
  };

  const handleCancelEdit = () => {
    setFornecedorEmEdicao(null);
  };

  const handleDelete = (fornecedorId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este fornecedor?")) {
      excluirFornecedor(fornecedorId);
      toast.error("Fornecedor excluído.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Gestão de Fornecedores</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{fornecedorEmEdicao ? "Editar Fornecedor" : "Adicionar Novo Fornecedor"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="nome" render={({ field }) => ( <FormItem> <FormLabel>Nome</FormLabel> <FormControl><Input placeholder="Nome do Fornecedor" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="cnpj" render={({ field }) => ( <FormItem> <FormLabel>CNPJ (Opcional)</FormLabel> <FormControl><Input placeholder="00.000.000/0000-00" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="contato" render={({ field }) => ( <FormItem> <FormLabel>Contato (Opcional)</FormLabel> <FormControl><Input placeholder="Telefone ou E-mail" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <div className="flex gap-2 pt-2">
                  {fornecedorEmEdicao && <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancelar</Button>}
                  <Button type="submit" className="flex-1">
                    {fornecedorEmEdicao ? <Edit className="w-4 h-4 mr-2" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                    {fornecedorEmEdicao ? "Salvar Alterações" : "Adicionar"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fornecedores Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[60vh] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fornecedores.length > 0 ? (
                    fornecedores.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.nome}</TableCell>
                        <TableCell>{f.cnpj}</TableCell>
                        <TableCell>{f.contato}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(f)}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(f.id)}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">Nenhum fornecedor cadastrado.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default FornecedoresPage;