// src/components/estoque/UnidadesDeMedidaManager.tsx (COMPLETO E VERIFICADO)

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEstoqueStore, Produto } from '@/store/estoqueStore';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { PlusCircle, Trash2 } from 'lucide-react';

// Schema para uma única unidade de medida
const unidadeSchema = z.object({
  id: z.string(),
  nome: z.string().min(1, "Nome é obrigatório"),
  sigla: z.string().min(1, "Sigla é obrigatória"),
  fatorConversao: z.coerce.number().positive("Fator deve ser > 0"),
});

// Schema para o formulário que contém a lista de unidades
const formSchema = z.object({
  unidades: z.array(unidadeSchema),
});

type FormValues = z.infer<typeof formSchema>;

interface UnidadesDeMedidaManagerProps {
  produto: Produto;
  onSuccess: () => void;
}

export function UnidadesDeMedidaManager({ produto, onSuccess }: UnidadesDeMedidaManagerProps) {
 const editarProduto = useEstoqueStore(state => state.editarProduto);

// ... resto igual

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unidades: produto.unidadesDeMedida || [{ id: 'temp-id', nome: 'Unidade', sigla: 'UN', fatorConversao: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "unidades",
  });

  function onSubmit(data: FormValues) {
    // Garante que a primeira unidade (base) não pode ser removida ou ter fator != 1
    if (data.unidades.length === 0 || data.unidades[0].fatorConversao !== 1) {
        toast.error("A primeira unidade (base) deve ter fator de conversão 1 e não pode ser removida.");
        return;
    }

    const produtoAtualizado = { ...produto, unidadesDeMedida: data.unidades };
    editarProduto(produto.id, produtoAtualizado as any); // Usamos 'as any' pois a ação espera NovoProdutoData, mas aqui estamos atualizando um campo específico
    toast.success("Unidades de medida atualizadas!");
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-start p-3 border rounded-lg">
              <div className="col-span-5">
                <FormField
                  control={form.control}
                  name={`unidades.${index}.nome`}
                  render={({ field }) => (
                    <FormItem>
                      {index === 0 && <FormLabel>Nome</FormLabel>}
                      <FormControl><Input placeholder="Ex: Caixa" {...field} disabled={index === 0} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-2">
                 <FormField
                  control={form.control}
                  name={`unidades.${index}.sigla`}
                  render={({ field }) => (
                    <FormItem>
                      {index === 0 && <FormLabel>Sigla</FormLabel>}
                      <FormControl><Input placeholder="CX" {...field} disabled={index === 0} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-3">
                 <FormField
                  control={form.control}
                  name={`unidades.${index}.fatorConversao`}
                  render={({ field }) => (
                    <FormItem>
                      {index === 0 && <FormLabel>Fator</FormLabel>}
                      <FormControl><Input type="number" placeholder="12" {...field} disabled={index === 0} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-2 flex items-center pt-8">
                {index > 0 && (
                  <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => append({ id: `new-${Date.now()}`, nome: '', sigla: '', fatorConversao: 0 })}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Unidade
        </Button>

        <Button type="submit" className="w-full">Salvar Unidades</Button>
      </form>
    </Form>
  );
}