// src/components/estoque/ProdutosTab.tsx (VERSÃO 4.8 - REATIVIDADE GLOBAL ULTRA-ROBUSTA PARA TRANSFERÊNCIA)
// Última atualização: 27/04/2026
// Mudanças focadas na transferência depósito → loja:
// - Equality function refinada: compara inventário item por item (localId + quantidade) — captura exatamente a redistribuição
// - tableKey com hash ainda mais completo (inclui serialização explícita do inventário)
// - useMemo agressivo em produtosFiltrados e tableKey para garantir detecção instantânea
// - Mesma robustez aplicada em todas as tabs
// - Mantidas todas as funcionalidades anteriores (filtros, gráficos, hotkeys, modais, alertas)
// - Sem polling, sem loops — atualização instantânea via Zustand + React keys

import { useState, useEffect, useMemo } from "react";
import { DataTable } from "@/components/ui/data-table";
import { useEstoqueStore, Produto } from "@/store/estoqueStore";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LotesManagerModal } from "./LotesManagerModal";
import { TransferModal } from "./TransferModal";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useHotkeys } from 'react-hotkeys-hook';

interface ProdutosTabProps {
  onEdit: (produto: Produto) => void;
}

// Equality function ULTRA-ROBUSTA para transferência
// Compara: id, quantidade total do lote, e inventário detalhado (deposito + loja)
const produtosEquality = (prev: Produto[], next: Produto[]) => {
  if (prev.length !== next.length) return false;

  return prev.every((p, i) => {
    const n = next[i];
    if (!n || p.id !== n.id) return false;

    // Número de lotes mudou?
    if (p.lotes.length !== n.lotes.length) return false;

    // Estoque total do produto mudou?
    const prevTotal = p.lotes.reduce((acc, l) => acc + l.quantidade, 0);
    const nextTotal = n.lotes.reduce((acc, l) => acc + l.quantidade, 0);
    if (prevTotal !== nextTotal) return false;

    // Comparação detalhada do inventário (essencial para transferência)
    return p.lotes.every((lotePrev, j) => {
      const loteNext = n.lotes[j];
      if (!loteNext) return false;

      // Mesma quantidade de locais no inventário?
      if (lotePrev.inventario.length !== loteNext.inventario.length) return false;

      // Compara cada entrada de inventário (deposito/loja)
      return lotePrev.inventario.every((invPrev, k) => {
        const invNext = loteNext.inventario[k];
        return invNext &&
               invPrev.localId === invNext.localId &&
               invPrev.quantidade === invNext.quantidade;
      });
    });
  });
};

export function ProdutosTab({ onEdit }: ProdutosTabProps) {
  // Seletor com equality ultra-robusta
  const produtos = useEstoqueStore(
    (state) => state.produtos,
    produtosEquality
  );

  const excluirProduto = useEstoqueStore((state) => state.excluirProduto);
  const getRelatorioEstoque = useEstoqueStore((state) => state.getRelatorioEstoque);
  const getAlertasEstoque = useEstoqueStore((state) => state.getAlertasEstoque);

  // Estados dos modais
  const [lotesModalOpen, setLotesModalOpen] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [produtoParaTransferir, setProdutoParaTransferir] = useState<Produto | null>(null);

  // Filtros
  const [setorFiltro, setSetorFiltro] = useState<string>('todos');
  const [buscaFornecedor, setBuscaFornecedor] = useState<string>('');
  const [buscaValidade, setBuscaValidade] = useState<string>('');

  // Produtos filtrados (useMemo para evitar recálculo desnecessário)
  const produtosFiltrados = useMemo(() => {
    return produtos.filter(p => {
      const setorAtual = p.setor ?? 'outros';
      if (setorFiltro !== 'todos' && setorAtual !== setorFiltro) return false;
      if (buscaFornecedor && !p.fornecedorId?.includes(buscaFornecedor)) return false;
      if (buscaValidade && !p.lotes.some(l => l.dataValidade.includes(buscaValidade))) return false;
      return true;
    });
  }, [produtos, setorFiltro, buscaFornecedor, buscaValidade]);

  // Chave dinâmica ULTRA-ROBUSTA — força re-render imediato após transferência
  const tableKey = useMemo(() => {
    return produtosFiltrados
      .map(p => {
        const totalEstoque = p.lotes.reduce((acc, l) => acc + l.quantidade, 0);
        const inventarioHash = p.lotes
          .map(lote => 
            lote.inventario
              .map(inv => `${inv.localId}:${inv.quantidade}`)
              .sort() // ordena para consistência
              .join(',')
          )
          .join(';');
        return `${p.id}-${p.lotes.length}-${totalEstoque}-${inventarioHash}`;
      })
      .join('|');
  }, [produtosFiltrados]);

  // Atalhos de teclado
  useHotkeys('ctrl+f', () => {
    const filtroInput = document.getElementById('filtro-fornecedor');
    if (filtroInput) filtroInput.focus();
  });

  useHotkeys('ctrl+n', () => toast.info('Novo produto em breve!'));
  useHotkeys('esc', () => {
    setLotesModalOpen(false);
    setTransferModalOpen(false);
  });

  // Alertas automáticos
  useEffect(() => {
    const alertas = getAlertasEstoque();
    if (alertas.baixoEstoque.length > 0) {
      toast.warning(`Produtos com estoque baixo: ${alertas.baixoEstoque.map(p => p.nome).join(', ')}`);
    }
    if (alertas.expirando.length > 0) {
      toast.error(`Lotes expirando em breve: ${alertas.expirando.length}`);
    }
  }, [produtos, getAlertasEstoque]);

  const handleAddLote = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setLotesModalOpen(true);
  };

  const handleTransfer = (produto: Produto) => {
    setProdutoParaTransferir(produto);
    setTransferModalOpen(true);
  };

  const tableColumns = columns(onEdit, handleAddLote, handleTransfer);

  // Gráfico
  const relatorio = getRelatorioEstoque();
  const pieData = Object.entries(relatorio.estoquePorSetor).map(([setor, total]) => ({ 
    name: setor, 
    value: total 
  }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button>Importar Produtos (em breve)</Button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select value={setorFiltro} onValueChange={setSetorFiltro}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por Setor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Setores</SelectItem>
            <SelectItem value="eletronicos">Eletrônicos</SelectItem>
            <SelectItem value="alimentos">Alimentos</SelectItem>
            <SelectItem value="moda">Moda</SelectItem>
            <SelectItem value="outros">Outros</SelectItem>
          </SelectContent>
        </Select>

        <Input 
          id="filtro-fornecedor"
          placeholder="Buscar por Fornecedor ID"
          value={buscaFornecedor}
          onChange={(e) => setBuscaFornecedor(e.target.value)}
        />

        <Input 
          placeholder="Buscar por Validade (AAAA-MM-DD)"
          value={buscaValidade}
          onChange={(e) => setBuscaValidade(e.target.value)}
        />
      </div>

      {/* Tabs com chave dinâmica global */}
      <Tabs defaultValue="geral" className="space-y-4">
        <TabsList className="flex justify-start overflow-x-auto">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="eletronicos">Eletrônicos</TabsTrigger>
          <TabsTrigger value="alimentos">Alimentos</TabsTrigger>
          <TabsTrigger value="moda">Moda</TabsTrigger>
          <TabsTrigger value="outros">Outros</TabsTrigger>
        </TabsList>

        {['geral', 'eletronicos', 'alimentos', 'moda', 'outros'].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue}>
            <DataTable 
              columns={tableColumns} 
              data={
                tabValue === 'geral' 
                  ? produtosFiltrados 
                  : produtosFiltrados.filter(p => (p.setor ?? 'outros') === tabValue)
              } 
              key={tableKey}   // Chave robusta compartilhada — força atualização instantânea
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-muted rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Estoque por Setor</h3>
          <PieChart width={400} height={300}>
            <Pie data={pieData} cx={200} cy={150} labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>

        <div className="p-6 bg-muted rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Relatório Geral</h3>
          <p>Turnover Médio: {relatorio.turnover.toFixed(2)}</p>
        </div>
      </div>

      {/* Modais */}
      <LotesManagerModal
        produto={produtoSelecionado}
        open={lotesModalOpen}
        onClose={() => setLotesModalOpen(false)}
      />

      <TransferModal
        produto={produtoParaTransferir}
        open={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
      />
    </div>
  );
}