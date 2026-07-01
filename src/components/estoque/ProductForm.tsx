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
import { ApresentacoesManager } from './ApresentacoesManager';
import { toast } from 'sonner';
import { useEffect, useState, useRef } from 'react';
import { Package } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface ProductFormProps {
  produtoParaEditar?: Produto | null;
  codigoBarrasEscaneado?: string;
  onSuccess: () => void;
}

export default function ProductForm({ produtoParaEditar, codigoBarrasEscaneado, onSuccess }: ProductFormProps) {
  const adicionarNovoProduto = useEstoqueStore(state => state.adicionarNovoProduto);
  const editarProduto = useEstoqueStore(state => state.editarProduto);
  const fornecedores = useEstoqueStore(state => state.fornecedores);
  const [showApresentacoesModal, setShowApresentacoesModal] = useState(false);

  // Refs para navegação por teclado
  const nomeRef = useRef<HTMLInputElement>(null);
  const setorRef = useRef<HTMLButtonElement>(null);
  const precoRef = useRef<HTMLInputElement>(null);
  const estoqueRef = useRef<HTMLInputElement>(null);
  const fornecedorRef = useRef<HTMLButtonElement>(null);
  const codigoBarrasRef = useRef<HTMLInputElement>(null);
  const botaoSubmitRef = useRef<HTMLButtonElement>(null);

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
        codigoBarras: produtoParaEditar.codigoBarras || '',
        setor: produtoParaEditar.setor || 'outros',
        precoPorQuilo: produtoParaEditar.precoPorQuilo,
        vendidoPorPeso: produtoParaEditar.vendidoPorPeso || false
      });
    } else {
      form.reset({
        nome: '',
        precoVenda: 0,
        estoqueMinimo: 0,
        fornecedorId: '',
        codigoBarras: codigoBarrasEscaneado || '',
        setor: 'outros',
        precoPorQuilo: undefined,
        vendidoPorPeso: false
      });
    }
  }, [produtoParaEditar, form, codigoBarrasEscaneado]);

  // Navegação por teclado com setas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const fields = [
        { ref: nomeRef, next: setorRef },
        { ref: setorRef, next: precoRef },
        { ref: precoRef, next: estoqueRef },
        { ref: estoqueRef, next: fornecedorRef },
        { ref: fornecedorRef, next: codigoBarrasRef },
        { ref: codigoBarrasRef, next: botaoSubmitRef },
        { ref: botaoSubmitRef, next: null }
      ];

      const currentIndex = fields.findIndex(f => f.ref.current === document.activeElement);

      // Seta para baixo → próximo campo
      if (e.key === 'ArrowDown' && currentIndex !== -1 && currentIndex < fields.length - 1) {
        e.preventDefault();
        fields[currentIndex].next?.current?.focus();
      } 
      // Seta para cima → campo anterior
      else if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        fields[currentIndex - 1].ref.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const moveToNextField = (currentRef: React.RefObject<HTMLElement>, nextRef: React.RefObject<HTMLElement>) => {
    nextRef.current?.focus();
  };

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
                <Input 
                  ref={nomeRef} 
                  placeholder="Ex: Coca-Cola 2L" 
                  {...field} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      moveToNextField(nomeRef, setorRef);
                    }
                  }}
                />
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
            <SelectTrigger 
              ref={setorRef}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  moveToNextField(setorRef, precoRef);
                }
              }}
            >
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
                  ref={precoRef}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="10,00"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      moveToNextField(precoRef, estoqueRef);
                    }
                  }}
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
                  ref={estoqueRef}
                  type="number"
                  {...field}
                  onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      moveToNextField(estoqueRef, fornecedorRef);
                    }
                  }}
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
                  <SelectTrigger 
                    ref={fornecedorRef}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        moveToNextField(fornecedorRef, codigoBarrasRef);
                      }
                    }}
                  >
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
                <Input 
                  ref={codigoBarrasRef} 
                  placeholder="Leia o código de barras" 
                  {...field}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      moveToNextField(codigoBarrasRef, botaoSubmitRef);
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vendidoPorPeso"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Vendido por peso (balança)</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Marque se este produto é vendido por peso (frios, carnes, etc.)
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {form.watch('vendidoPorPeso') && (
          <FormField
            control={form.control}
            name="precoPorQuilo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço por Quilo (R$)</FormLabel>
                <FormControl>
                  <CalculatorInput
                    value={field.value || 0}
                    onChange={field.onChange}
                    placeholder="30,00"
                  />
                </FormControl>
                <p className="text-sm text-muted-foreground">
                  Preço por quilo usado para cálculo em balanças
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Seção de Apresentações/Embalagens */}
        {produtoParaEditar && (
          <div className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowApresentacoesModal(true)}
            >
              <Package className="h-4 w-4 mr-2" />
              Gerenciar Apresentações/Embalagens
            </Button>
          </div>
        )}

        <Button type="submit" className="w-full" ref={botaoSubmitRef}>
          {produtoParaEditar ? 'Atualizar Produto' : 'Adicionar Produto'}
        </Button>
      </form>

      {/* Modal de Apresentações */}
      {produtoParaEditar && (
        <ApresentacoesManager
          produtoId={produtoParaEditar.id}
          produtoNome={produtoParaEditar.nome}
          open={showApresentacoesModal}
          onClose={() => setShowApresentacoesModal(false)}
        />
      )}
    </Form>
  );
}