// src/pages/Estoque.tsx (VERSÃO 3.0 - LIMPA E FOCADA)

import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlusCircle, Scan } from "lucide-react";
import { Produto } from "@/store/estoqueStore";
import { useEstoqueStore } from "@/store/estoqueStore";
import { ProdutosTab } from "@/components/estoque/ProdutosTab";
// import { FornecedoresTab } from "@/components/estoque/FornecedoresTab"; // 1. REMOVIDO
import { UnidadesTab } from "@/components/estoque/UnidadesTab";
import { MovimentacoesTable } from "@/components/estoque/MovimentacoesTable";
import { CurvaABCReport } from "@/components/estoque/CurvaABCReport";
import ProductForm from "@/components/estoque/ProductForm";
import { ScannerButton } from "@/components/ScannerButton";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { decodificarBarcodeBalanca } from "@/utils/barcodeDecoder";

const Estoque = () => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [produtoParaEditar, setProdutoParaEditar] = useState<Produto | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const produtos = useEstoqueStore(state => state.produtos);
  
  // Scanner USB de código de barras (teclado)
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(0);
  const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [codigoBarrasEscaneado, setCodigoBarrasEscaneado] = useState<string>('');

  const handleOpenFormModal = (produto?: Produto, codigoBarras?: string) => {
    setProdutoParaEditar(produto || null);
    setCodigoBarrasEscaneado(codigoBarras || '');
    setIsFormModalOpen(true);
  };

  // Lógica do scanner USB de código de barras (teclado)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      
      // Ignorar teclas de controle (Ctrl, Alt, etc.)
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      
      // Se for ENTER, processar o buffer como código de barras
      if (e.key === 'Enter') {
        if (barcodeBuffer.length > 0 && barcodeBuffer.length < 50) {
          // É um código de barras válido
          e.preventDefault();
          
          // Verifica se é um código de balança (começa com 2 e tem 13 dígitos)
          const dadosBalanca = decodificarBarcodeBalanca(barcodeBuffer);
          
          if (dadosBalanca.isValid) {
            // É um código de balança → busca produto pelo código interno
            const produto = produtos.find(p => 
              p.codigoBarras === dadosBalanca.produtoCodigo || 
              p.apresentacoes?.some(a => a.codigoBarras === dadosBalanca.produtoCodigo)
            );
            
            if (produto) {
              toast.success(`Produto de balança: ${produto.nome} - Valor: R$ ${dadosBalanca.valorTotal.toFixed(2)}`);
              // Aqui você pode adicionar lógica para adicionar ao carrinho ou estoque
              // Por enquanto, apenas informamos
            } else {
              toast.warning(`Código de balança ${dadosBalanca.produtoCodigo} não encontrado no sistema. Valor: R$ ${dadosBalanca.valorTotal.toFixed(2)}`);
            }
          } else {
            // É um código de barras normal → busca produto pelo código
            const produto = produtos.find(p => 
              p.codigoBarras === barcodeBuffer || 
              p.apresentacoes?.some(a => a.codigoBarras === barcodeBuffer)
            );
            
            if (produto) {
              // Produto existe → abrir modal de EDITAR
              toast.success(`Produto encontrado: ${produto.nome}`);
              handleOpenFormModal(produto);
            } else {
              // Produto não existe → abrir modal de ADICIONAR com código preenchido
              toast.info(`Código ${barcodeBuffer} não encontrado. Criando novo produto.`);
              handleOpenFormModal(undefined, barcodeBuffer);
            }
          }
          
          setBarcodeBuffer('');
        }
        return;
      }
      
      // Se for um caractere válido (número ou letra), adicionar ao buffer
      if (e.key.length === 1) {
        // Se passou muito tempo desde a última tecla, limpar o buffer
        if (currentTime - lastKeyTime > 100) {
          setBarcodeBuffer('');
        }
        
        setBarcodeBuffer(prev => prev + e.key);
        setLastKeyTime(currentTime);
        
        // Limpar o buffer após 100ms sem atividade
        if (barcodeTimeoutRef.current) {
          clearTimeout(barcodeTimeoutRef.current);
        }
        barcodeTimeoutRef.current = setTimeout(() => {
          setBarcodeBuffer('');
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (barcodeTimeoutRef.current) {
        clearTimeout(barcodeTimeoutRef.current);
      }
    };
  }, [barcodeBuffer, lastKeyTime, produtos]);

  // Lógica do scanner para estoque
  const startCamera = async () => {
    try {
      const element = document.getElementById('reader-estoque');
      if (!element) {
        toast.error('Elemento da câmera não encontrado');
        return;
      }

      const scanner = new Html5Qrcode("reader-estoque");
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Busca produto pelo código de barras
          const produto = produtos.find(p => 
            p.codigoBarras === decodedText || 
            p.apresentacoes?.some(a => a.codigoBarras === decodedText)
          );
          
          if (produto) {
            toast.success(`Produto encontrado: ${produto.nome}`);
            handleOpenFormModal(produto);
          } else {
            toast.info(`Código ${decodedText} não encontrado. Criando novo produto.`);
            // Cria um produto temporário com o código de barras preenchido
            const novoProduto: Partial<Produto> = {
              id: '',
              nome: '',
              precoVenda: 0,
              estoqueMinimo: 0,
              codigoBarras: decodedText,
              lotes: [],
              unidadesDeMedida: [],
              unidadeMedidaPadrao: 'UN',
              conversoes: []
            };
            handleOpenFormModal(novoProduto as Produto);
          }
          
          setShowScanner(false);
          setCameraActive(false);
        },
        (error) => {
          // Erros são normais durante a leitura, ignorar
        }
      );
      
      scannerRef.current = scanner;
      setCameraActive(true);
      toast.success('Câmera iniciada com sucesso');
    } catch (error) {
      console.error('Erro ao iniciar câmera:', error);
      toast.error('Erro ao acessar a câmera. Verifique as permissões.');
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
        setCameraActive(false);
      } catch (error) {
        console.error('Erro ao parar câmera:', error);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
            codigoBarrasEscaneado={codigoBarrasEscaneado}
            onSuccess={() => {
              setIsFormModalOpen(false);
              setCodigoBarrasEscaneado('');
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Scanner de Código de Barras */}
      <Dialog open={showScanner} onOpenChange={(open) => {
        if (!open) {
          stopCamera();
        }
        setShowScanner(open);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Scanner de Código de Barras</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div id="reader-estoque" className="w-full min-h-[300px] bg-black rounded-lg"></div>
            {!cameraActive && (
              <Button onClick={startCamera} className="w-full h-14 text-lg font-bold">
                <Scan className="mr-2 h-5 w-5" />
                Iniciar Câmera
              </Button>
            )}
            {cameraActive && (
              <Button onClick={stopCamera} variant="outline" className="w-full h-14 text-lg font-bold">
                Parar Câmera
              </Button>
            )}
            <p className="text-sm text-muted-foreground text-center">
              Clique em "Iniciar Câmera" para começar a escanear
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Botão Flutuante do Scanner */}
      <ScannerButton onClick={() => setShowScanner(true)} label="Abrir Scanner" />
    </div>
  );
};

export default Estoque;
