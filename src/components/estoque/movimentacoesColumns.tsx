// src/components/estoque/movimentacoesColumns.tsx

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Movimentacao, TipoMovimentacao } from "@/store/estoqueStore";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, ArrowRight, Package, ShoppingCart, Trash2, Wrench } from "lucide-react";

const tipoMovimentacaoMap: Record<TipoMovimentacao, { label: string; className: string; icon: React.ElementType }> = {
  venda: { label: "Venda", className: "bg-red-100 text-red-800", icon: ShoppingCart },
  entrada_manual: { label: "Entrada de Lote", className: "bg-green-100 text-green-800", icon: ArrowDown },
  saida_perda: { label: "Perda", className: "bg-orange-100 text-orange-800", icon: Trash2 },
  saida_ajuste: { label: "Ajuste (Saída)", className: "bg-yellow-100 text-yellow-800", icon: Wrench },
  entrada_ajuste: { label: "Ajuste (Entrada)", className: "bg-blue-100 text-blue-800", icon: Wrench },
  importacao: { label: "Importação", className: "bg-purple-100 text-purple-800", icon: Package },
  transferencia: { label: "Transferência", className: "bg-indigo-100 text-indigo-800", icon: ArrowRight },
};

export const movimentacoesColumns: ColumnDef<Movimentacao>[] = [
  {
    accessorKey: "data",
    header: "Data",
    cell: ({ row }) => format(new Date(row.getValue("data")), "dd/MM/yyyy HH:mm"),
  },
  {
    accessorKey: "produtoNome",
    header: "Produto",
  },
  {
    accessorKey: "tipo",
    header: "Tipo",
    cell: ({ row }) => {
      const tipo = row.getValue("tipo") as TipoMovimentacao;
      const { label, className, icon: Icon } = tipoMovimentacaoMap[tipo] || { label: "Desconhecido", className: "", icon: Wrench };
      return (
        <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium w-fit ${className}`}>
          <Icon className="h-3 w-3" />
          {label}
        </div>
      );
    },
  },
  {
    accessorKey: "quantidade",
    header: "Quantidade",
    cell: ({ row }) => {
        const tipo = row.original.tipo;
        const quantidade = row.getValue("quantidade") as number;
        const isSaida = tipo.startsWith('saida') || tipo === 'venda';
        return (
            <span className={isSaida ? 'text-red-600' : 'text-green-600'}>
                {isSaida ? '-' : '+'} {quantidade}
            </span>
        );
    }
  },
  {
    accessorKey: "observacao",
    header: "Observação",
  },
];
