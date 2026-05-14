// src/components/estoque/MovimentacaoForm.tsx

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEstoqueStore, movimentacaoFormSchema, MovimentacaoFormData } from "@/store/estoqueStore";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface MovimentacaoFormProps {
  onSuccess: () => void;
}

export function MovimentacaoForm({ onSuccess }: MovimentacaoFormProps) {
 const produtos = useEstoqueStore(state => state.produtos);
const registrarMovimentacaoManual = useEstoqueStore(state => state.registrarMovimentacaoManual);

  const form = useForm<MovimentacaoFormData>({
    resolver: zodResolver(movimentacaoFormSchema),
    defaultValues: {
      produtoId: "",
      tipo: "saida_perda",
      quantidade: 0,
      observacao: "",
    },
  });

  function onSubmit(values: MovimentacaoFormData) {
    try {
      registrarMovimentacaoManual(values);
      toast.success("Movimentação registrada com sucesso!");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="produtoId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Produto</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto a ser movimentado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {produtos.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Movimentação</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="saida_perda">Saída por Perda/Quebra</SelectItem>
                  <SelectItem value="saida_ajuste">Ajuste de Inventário (Saída)</SelectItem>
                  <SelectItem value="entrada_ajuste">Ajuste de Inventário (Entrada)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantidade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade (em unidades)</FormLabel>
              <FormControl><Input type="number" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="observacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observação (Opcional)</FormLabel>
              <FormControl><Input placeholder="Ex: Produto avariado na prateleira" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">Registrar Movimentação</Button>
      </form>
    </Form>
  );
}