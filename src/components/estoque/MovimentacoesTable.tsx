// src/components/estoque/MovimentacoesTable.tsx (COMPLETO E VERIFICADO)

import * as React from 'react';
import { useEstoqueStore, Movimentacao, TipoMovimentacao } from "@/store/estoqueStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const tipoMovimentacaoMap: Record<TipoMovimentacao, { label: string; className: string; }> = {
  venda: { label: 'Venda', className: 'bg-red-100 text-red-800' },
  entrada_manual: { label: 'Entrada (Lote)', className: 'bg-green-100 text-green-800' },
  saida_perda: { label: 'Saída (Perda)', className: 'bg-yellow-100 text-yellow-800' },
  saida_ajuste: { label: 'Saída (Ajuste)', className: 'bg-yellow-100 text-yellow-800' },
  entrada_ajuste: { label: 'Entrada (Ajuste)', className: 'bg-blue-100 text-blue-800' },
  importacao: { label: 'Importação', className: 'bg-purple-100 text-purple-800' },
  transferencia: { label: 'Transferência', className: 'bg-indigo-100 text-indigo-800' },
};

export function MovimentacoesTable() {
  const movimentacoes = useEstoqueStore(state => state.movimentacoes);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Quantidade</TableHead>
            <TableHead>Observação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movimentacoes.length > 0 ? (
            movimentacoes.map((mov) => (
              <TableRow key={mov.id}>
                <TableCell>{format(new Date(mov.data), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                <TableCell>{mov.produtoNome}</TableCell>
                <TableCell>
                  <Badge className={tipoMovimentacaoMap[mov.tipo].className}>
                    {tipoMovimentacaoMap[mov.tipo].label}
                  </Badge>
                </TableCell>
                <TableCell className={`text-right font-medium ${mov.tipo.startsWith('entrada') || mov.tipo === 'transferencia' ? 'text-green-600' : 'text-red-600'}`}>
                  {mov.tipo.startsWith('entrada') || mov.tipo === 'transferencia' ? `+${mov.quantidade}` : `-${mov.quantidade}`}
                </TableCell>
                <TableCell>{mov.observacao || 'N/A'}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                Nenhuma movimentação registrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
