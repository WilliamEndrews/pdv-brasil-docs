// src/pages/Estoque.tsx (VERSÃO 3.0 - LIMPA E FOCADA)

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { Produto } from "@/store/estoqueStore";
import { ProdutosTab } from "@/components/estoque/ProdutosTab";
// import { FornecedoresTab } from "@/components/estoque/FornecedoresTab"; // 1. REMOVIDO
import { UnidadesTab } from "@/components/estoque/UnidadesTab";
import { MovimentacoesTable } from "@/components/estoque/MovimentacoesTable";
import { CurvaABCReport } from "@/components/estoque/CurvaABCReport";
import ProductForm from "@/components/estoque/ProductForm";

const Estoque = () => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [produtoParaEditar, setProdutoParaEditar] = useState<Produto | null>(null);

  const handleOpenFormModal = (produto?: Produto) => {
    setProdutoParaEditar(produto || null);
    setIsFormModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Estoque</h1>
          <p className="text-muted-foreground">Controle total sobre seus produtos, fornecedores e movimentações.</p>
        </div>
        <Button onClick={() => handleOpenFormModal()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Produto
        </Button>
      </div>

      {/* 2. ATUALIZADO PARA 4 COLUNAS */}
      <Tabs defaultValue="produtos" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="movimentacoes">Histórico</TabsTrigger>
          <TabsTrigger value="unidades">Unidades</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="produtos">
          <ProdutosTab onEdit={handleOpenFormModal} />
        </TabsContent>
        <TabsContent value="movimentacoes">
          <MovimentacoesTable />
        </TabsContent>
        {/* 3. CONTEÚDO DA ABA REMOVIDO */}
        <TabsContent value="unidades">
          <UnidadesTab />
        </TabsContent>
        <TabsContent value="relatorios">
          <CurvaABCReport />
        </TabsContent>
      </Tabs>

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{produtoParaEditar ? "Editar Produto" : "Adicionar Novo Produto"}</DialogTitle>
          </DialogHeader>
          <ProductForm
            produtoParaEditar={produtoParaEditar}
            onSuccess={() => setIsFormModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Estoque;
