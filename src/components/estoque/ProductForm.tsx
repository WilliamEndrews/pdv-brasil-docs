// src/components/estoque/ProductForm.tsx (VERSÃO 16.3 - EDIÇÃO + ADIÇÃO DIFERENCIADAS)
// Última atualização: 16/01/2026
// Correção definitiva:
// - Agora diferencia edição de adição no onSubmit
// - Usa editarProduto quando há produtoParaEditar
// - Usa adicionarNovoProduto quando é novo
// - Preço em reais direto (sem ×100 /100)
// - Título do botão dinâmico

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEstoqueStore, productFormSchema, NovoProdutoData, Produto } from '@/store/estoqueStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalculatorInput } from '@/components/ui/CalculatorInput';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface ProductFormProps {
  produtoParaEditar?: Produto | null;
  onSuccess: () => void;
}

export default function ProductForm({ produtoParaEditar, onSuccess }: ProductFormProps) {
  const adicionarNovoProduto = useEstoqueStore(state => state.adicionarNovoProduto);
  const editarProduto = useEstoqueStore(state => state.editarProduto); // ← Adicionado aqui!
  const fornecedores = useEstoqueStore(state => state.fornecedores);

  const form = useForm<NovoProdutoData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      nome: '',
      precoVenda: 0,
      estoqueMinimo: 0,
      fornecedorId: '',
      codigoBarras: ''
    },
  });

  useEffect(() => {
    if (produtoParaEditar) {
      form.reset({
        nome: produtoParaEditar.nome,
        precoVenda: produtoParaEditar.precoVenda,           // Direto em reais
        estoqueMinimo: produtoParaEditar.estoqueMinimo,
        fornecedorId: produtoParaEditar.fornecedorId || '',
        codigoBarras: produtoParaEditar.codigoBarras || ''
      });
    } else {
      form.reset({
        nome: '',
        precoVenda: 0,
        estoqueMinimo: 0,
        fornecedorId: '',
        codigoBarras: ''
      });
    }
  }, [produtoParaEditar, form]);

  function onSubmit(data: NovoProdutoData) {
    if (produtoParaEditar) {
      // É EDIÇÃO → sobrescreve o produto existente
      editarProduto(produtoParaEditar.id, data);
      toast.success(`Produto "${data.nome}" atualizado com sucesso!`);
    } else {
      // É ADIÇÃO → cria novo produto
      adicionarNovoProduto(data);
      toast.success(`Produto "${data.nome}" adicionado com sucesso!`);
    }
    
    onSuccess(); // Fecha modal ou limpa form
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Produto</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Coca-Cola 2L" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="setor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Setor do Produto</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
            <SelectTrigger>
            <SelectValue placeholder="Selecione o setor" />
          </SelectTrigger>
           </FormControl>
          <SelectContent>
          <SelectItem value="eletronicos">Eletrônicos</SelectItem>
          <SelectItem value="alimentos">Alimentos</SelectItem>
          <SelectItem value="moda">Moda</SelectItem>
          <SelectItem value="outros">Outros</SelectItem>
           </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
        />
        
        <FormField
          control={form.control}
          name="precoVenda"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço de Venda (R$)</FormLabel>
              <FormControl>
                <CalculatorInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="10,00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="estoqueMinimo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estoque Mínimo</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Controller
          control={form.control}
          name="fornecedorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fornecedor (Opcional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {fornecedores.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="codigoBarras"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código de Barras (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Leia o código de barras" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {produtoParaEditar ? 'Atualizar Produto' : 'Adicionar Produto'}
        </Button>
      </form>
    </Form>
  );
}