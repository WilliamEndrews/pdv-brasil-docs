// src/components/estoque/columns.tsx (VERSÃO ATUALIZADA - CRUD FUNCIONAL)
// Última atualização: 15/01/2026
// Mudanças principais:
// - Botão "Excluir" agora chama a ação real do store (excluirProduto)
// - Adicionada confirmação + toast de sucesso
// - Mantida compatibilidade com onEdit, onAddLote e onTransfer

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Produto, useEstoqueStore } from "@/store/estoqueStore";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const getEstoqueLoja = (produto: Produto) => {
  return produto.lotes.reduce((total, lote) => {
    const item = lote.inventario.find(i => i.localId === 'loja');
    return total + (item ? item.quantidade : 0);
  }, 0);
};

const getEstoqueDeposito = (produto: Produto) => {
  return produto.lotes.reduce((total, lote) => {
    const item = lote.inventario.find(i => i.localId === 'deposito');
    return total + (item ? item.quantidade : 0);
  }, 0);
};

export const columns = (
  onEdit: (produto: Produto) => void,
  onAddLote: (produto: Produto) => void,
  onTransfer: (produto: Produto) => void
): ColumnDef<Produto>[] => [
  {
    accessorKey: "nome",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Nome
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    id: "estoqueLoja",
    header: "Estoque Loja",
    cell: ({ row }) => getEstoqueLoja(row.original),
  },
  {
    id: "estoqueDeposito",
    header: "Estoque Depósito",
    cell: ({ row }) => getEstoqueDeposito(row.original),
  },
  {
    accessorKey: "precoVenda",
    header: () => <div className="text-right">Preço Venda</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("precoVenda"));
      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "estoqueMinimo",
    header: "Est. Mínimo",
  },
  {
  accessorKey: "setor",
  header: "Setor",
  cell: ({ row }) => {
    const setor = row.original.setor ?? 'outros';  // ← Fallback seguro
    return <Badge variant="secondary">{setor.toUpperCase()}</Badge>;
  },
  filterFn: 'equalsString',
},
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const estoqueLoja = getEstoqueLoja(row.original);
      if (estoqueLoja <= 0) {
        return <Badge variant="destructive">Sem Estoque</Badge>;
      }
      if (estoqueLoja <= row.original.estoqueMinimo) {
        return <Badge variant="secondary" className="bg-yellow-400 text-black">Estoque Baixo</Badge>;
      }
      return <Badge variant="secondary">Em Estoque</Badge>;
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const produto = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            
            {/* Botão Editar */}
            <DropdownMenuItem onClick={() => onEdit(produto)}>
              Editar Produto
            </DropdownMenuItem>

            {/* Botão + Lote */}
            <DropdownMenuItem onClick={() => onAddLote(produto)}>
              Ver/Adicionar Lotes
            </DropdownMenuItem>

            {/* Botão Transferir */}
            <DropdownMenuItem onClick={() => onTransfer(produto)}>
              Transferir para Loja
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Botão Excluir - AGORA FUNCIONAL */}
            <DropdownMenuItem 
              className="text-red-600 focus:bg-red-50 cursor-pointer"
              onClick={() => {
                if (window.confirm(`Tem certeza que deseja excluir o produto "${produto.nome}"?`)) {
                  useEstoqueStore.getState().excluirProduto(produto.id);
                  toast.success(`Produto "${produto.nome}" excluído com sucesso!`);
                }
              }}
            >
              Excluir Produto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];