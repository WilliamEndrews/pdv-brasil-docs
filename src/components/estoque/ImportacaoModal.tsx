// src/components/estoque/ImportacaoModal.tsx (VERSÃO 2.0 - COM TIPO CORRIGIDO)

import { useState } from 'react';
import { useEstoqueStore } from '@/store/estoqueStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

interface ImportacaoModalProps {
  onSuccess: () => void;
}

export function ImportacaoModal({ onSuccess }: ImportacaoModalProps) {
  const importarEmMassa = useEstoqueStore(state => state.importarEmMassa);
// ... resto igual ao que você enviou
  const [texto, setTexto] = useState('');
  const [produtosPreview, setProdutosPreview] = useState<{ nome: string; precoVenda: number; estoqueMinimo: number }[]>([]);

  const handleProcessar = () => {
    if (!texto.trim()) {
      toast.error("A área de texto está vazia.");
      return;
    }
    const linhas = texto.trim().split('\n');
    const produtosProcessados = linhas.map(linha => {
      const [nome, preco, estoque] = linha.split('\t');
      const precoVenda = parseFloat(preco?.replace(',', '.') || '0');
      const estoqueMinimo = parseInt(estoque || '0', 10);

      // [A SOLUÇÃO] - Garante que o objeto criado tem o tipo correto
      if (nome && !isNaN(precoVenda) && !isNaN(estoqueMinimo)) {
        return { nome, precoVenda, estoqueMinimo };
      }
      return null;
    }).filter(Boolean) as { nome: string; precoVenda: number; estoqueMinimo: number }[];

    if (produtosProcessados.length === 0) {
      toast.error("Nenhum produto válido encontrado. Verifique o formato: Nome (tab) Preço (tab) Estoque Mínimo");
      return;
    }
    setProdutosPreview(produtosProcessados);
  };

  const handleConfirmarImportacao = () => {
    if (produtosPreview.length === 0) {
      toast.error("Nenhum produto para importar.");
      return;
    }
    importarEmMassa(produtosPreview);
    toast.success(`${produtosPreview.length} produtos importados com sucesso!`);
    onSuccess();
  };

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        Cole os dados da sua planilha (Excel, Google Sheets). Use o formato: <strong>Nome (coluna A), Preço de Venda (coluna B), Estoque Mínimo (coluna C)</strong>.
      </p>
      <Textarea
        placeholder="Suco de Uva 1L	8,99	10&#10;Biscoito Integral	4,50	20&#10;Sabão em Pó 1kg	15,00	5"
        rows={8}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      <Button onClick={handleProcessar} className="w-full mt-4">Processar Dados</Button>

      {produtosPreview.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold mb-2">Pré-visualização ({produtosPreview.length} produtos)</h3>
          <div className="max-h-60 overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Preço Venda</TableHead>
                  <TableHead>Est. Mínimo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtosPreview.map((prod, index) => (
                  <TableRow key={index}>
                    <TableCell>{prod.nome}</TableCell>
                    <TableCell>{prod.precoVenda.toFixed(2)}</TableCell>
                    <TableCell>{prod.estoqueMinimo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button onClick={handleConfirmarImportacao} className="w-full mt-4" variant="default">
            Confirmar e Importar {produtosPreview.length} Produtos
          </Button>
        </div>
      )}
    </div>
  );
}