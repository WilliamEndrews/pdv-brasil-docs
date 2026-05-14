// src/components/estoque/CurvaABCReport.tsx

import * as React from 'react';
import { useEstoqueStore, Produto, Movimentacao } from '@/store/estoqueStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Interface para os dados processados
interface ABCItem {
  produtoId: string;
  nome: string;
  faturamento: number;
  percentual: number;
  percentualAcumulado: number;
  curva: 'A' | 'B' | 'C';
}

const getCurvaClass = (curva: 'A' | 'B' | 'C') => {
    switch (curva) {
        case 'A': return 'bg-green-500 text-white';
        case 'B': return 'bg-yellow-500 text-white';
        case 'C': return 'bg-red-500 text-white';
    }
}

export function CurvaABCReport() {
  const { produtos, movimentacoes } = useEstoqueStore();

  const dadosABC: ABCItem[] = React.useMemo(() => {
    // 1. Calcular faturamento por produto
    const faturamentoPorProduto = produtos.map(produto => {
      const vendas = movimentacoes.filter(m => m.produtoId === produto.id && m.tipo === 'venda');
      const faturamento = vendas.reduce((acc, venda) => acc + (venda.quantidade * produto.precoVenda), 0);
      return { produtoId: produto.id, nome: produto.nome, faturamento };
    });

    // 2. Calcular faturamento total
    const faturamentoTotal = faturamentoPorProduto.reduce((acc, p) => acc + p.faturamento, 0);
    if (faturamentoTotal === 0) return [];

    // 3. Ordenar e calcular percentuais
    const produtosOrdenados = faturamentoPorProduto
      .filter(p => p.faturamento > 0)
      .sort((a, b) => b.faturamento - a.faturamento);

    let percentualAcumulado = 0;
    const resultadoFinal = produtosOrdenados.map(p => {
      const percentual = (p.faturamento / faturamentoTotal) * 100;
      percentualAcumulado += percentual;
      
      let curva: 'A' | 'B' | 'C';
      if (percentualAcumulado <= 80) {
        curva = 'A';
      } else if (percentualAcumulado <= 95) {
        curva = 'B';
      } else {
        curva = 'C';
      }
      
      return { ...p, percentual, percentualAcumulado, curva };
    });

    return resultadoFinal;
  }, [produtos, movimentacoes]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gráfico de Curva ABC</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dadosABC} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" tick={{ fontSize: 12 }} interval={0} angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="faturamento" fill="#8884d8" name="Faturamento por Produto" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tabela de Classificação ABC</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curva</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">% do Total</TableHead>
                <TableHead className="text-right">% Acumulado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dadosABC.map(item => (
                <TableRow key={item.produtoId}>
                  <TableCell>
                    <Badge className={getCurvaClass(item.curva)}>{item.curva}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{item.nome}</TableCell>
                  <TableCell className="text-right">R$ {item.faturamento.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{item.percentual.toFixed(2)}%</TableCell>
                  <TableCell className="text-right">{item.percentualAcumulado.toFixed(2)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
