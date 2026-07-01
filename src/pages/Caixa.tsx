// src/pages/Caixa.tsx
// VERSÃO FINAL ESTÁVEL - AUTOCOMPLETE LIMPO (COMO GOOGLE) + VALIDAÇÃO DE ESTOQUE
// Última atualização: 13/05/2026

import React, { useState, useEffect, useRef } from "react";
import { useCaixaStore } from "@/store/caixaStore";
import { useAuth } from "@/store/authStore";
import { useEstoqueStore, Produto } from "@/store/estoqueStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import { 
  ShoppingCart, Scan, Trash2, Plus, Minus, CreditCard, DollarSign,
  X, Search, ArrowLeft, CheckCircle2, Banknote, Wallet, AlertCircle, Monitor 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { QRCodeSVG } from "qrcode.react";
import { ScannerButton } from "@/components/ScannerButton";
import { CalculatorInput } from "@/components/ui/CalculatorInput";
import PagamentoCartao from "@/components/PagamentoCartao";
import { usePagamentoStore } from "@/store/pagamentoStore";
import { decodificarBarcodeBalanca } from "@/utils/barcodeDecoder";

interface CaixaProps {
  companyName?: string;
  companyLogo?: string;
}

interface ProdutoBase {
  id: string;
  nome: string;
  precoVenda: number;
  codigoBarras?: string;
}

const Caixa = ({ companyName = "PDV Brasil", companyLogo }: CaixaProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { limparTransacaoAtual } = usePagamentoStore();

  // ==================== ZUSTAND STORES ====================
  const { 
    itens, 
    subtotal, 
    desconto, 
    total, 
    statusCaixa, 
    sugestoes,
    apresentacaoEncontrada,
    adicionarItem, 
    removerItem, 
    atualizarQuantidade, 
    limparCarrinho, 
    finalizarVenda, 
    buscarProduto 
  } = useCaixaStore();

  const { getEstoquePorLocal, produtos, unidadesMedida } = useEstoqueStore();

  // ==================== ESTADOS LOCAIS ====================
  const [searchTerm, setSearchTerm] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [showQuantidadePopup, setShowQuantidadePopup] = useState(false);
  const [produtoPendente, setProdutoPendente] = useState<ProdutoBase | null>(null);
  const [quantidadeInput, setQuantidadeInput] = useState("1");
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string>("UN");
  const [showContingenciaModal, setShowContingenciaModal] = useState(false);
  const [nfePendentes, setNfePendentes] = useState<Array<{ chave: string; data: string; xml: string }>>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [abaPagamentoAtiva, setAbaPagamentoAtiva] = useState<'resumo' | 'cartao'>('resumo');
  
  // Scanner USB de código de barras (teclado)
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(0);
  const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Usar estados do store para sincronização com CustomerDisplay
  const { 
    showPaymentSummary,
    selectedMethod,
    pagamentosParciais,
    cashReceived,
    setShowPaymentSummary,
    setSelectedMethod,
    setPagamentosParciais,
    setCashReceived
  } = useCaixaStore();

  const searchRef = useRef<HTMLInputElement>(null);
  const quantidadeInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const calculatorInputRef = useRef<HTMLDivElement>(null);

  // ==================== LIMPEZA ====================
  const resetarBusca = () => {
    setSearchTerm('');
    buscarProduto('');
    useCaixaStore.setState({ sugestoes: [] });
  };

  const resetarTudoAposVenda = () => {
    limparCarrinho();
    setSelectedMethod('dinheiro');
    setCashReceived(0);
    setPagamentosParciais([]);
  };

  const adicionarPagamentoParcial = (forma: 'dinheiro' | 'cartao' | 'pix', valor: number) => {
    const novoPagamento = { forma, valor };
    setPagamentosParciais([...pagamentosParciais, novoPagamento]);
    setCashReceived(0);
  };

  const removerPagamentoParcial = (index: number) => {
    const novosPagamentos = pagamentosParciais.filter((_, i) => i !== index);
    setPagamentosParciais(novosPagamentos);
  };

  const totalPagamentosParciais = pagamentosParciais.reduce((acc, p) => acc + p.valor, 0);
  const restantePagar = total - totalPagamentosParciais;

  // Limpeza ao abrir o Caixa
  useEffect(() => {
    resetarBusca();
    if (itens.length > 0) {
      limparCarrinho();
    }
  }, []);

  // Autocomplete em tempo real
  useEffect(() => {
    buscarProduto(searchTerm);
    setSelectedIndex(-1); // Resetar seleção quando o termo muda
  }, [searchTerm]);

  // Handler para navegação por teclado nas sugestões
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const sugestoesLength = sugestoes.length;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % sugestoesLength);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + sugestoesLength) % sugestoesLength);
    } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < sugestoesLength) {
      e.preventDefault();
      const produtoSelecionado = sugestoes[selectedIndex];
      handleAdicionarComQuantidade(produtoSelecionado);
      resetarBusca();
    }
  };

  // Handler para selecionar produto
  const handleSelectProduto = (produto: ProdutoBase) => {
    handleAdicionarComQuantidade(produto);
    resetarBusca();
  };

  // ==================== SCANNER DE CÓDIGO DE BARRAS ====================
  const startCamera = async () => {
    try {
      const element = document.getElementById('reader');
      if (!element) {
        toast.error('Elemento da câmera não encontrado');
        return;
      }

      const scanner = new Html5Qrcode("reader");
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          toast.success(`Código lido: ${decodedText}`);
          setSearchTerm(decodedText);
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

  // ==================== LÓGICA DO SCANNER USB DE CÓDIGO DE BARRAS ====================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      
      // Ignorar teclas de controle (Ctrl, Alt, etc.)
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      
      // Verifica se um input está focado
      const isInputFocused = document.activeElement?.tagName === 'INPUT' || 
                             document.activeElement?.tagName === 'TEXTAREA';
      
      // Se for ENTER, processar o buffer como código de barras
      if (e.key === 'Enter' && !isInputFocused) {
        if (barcodeBuffer.length > 0 && barcodeBuffer.length < 50) {
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
              
              // Adiciona ao carrinho com o valor da balança
              const produtoComValorBalanca = { ...produto, precoVenda: dadosBalanca.valorTotal };
              adicionarItem(produtoComValorBalanca, 'KG', 1);
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
              adicionarItem(produto, produto.unidadeMedidaPadrao, 1);
              toast.success(`Produto adicionado: ${produto.nome}`);
            } else {
              toast.error(`Código ${barcodeBuffer} não encontrado no sistema`);
            }
          }
          
          setBarcodeBuffer('');
        }
        return;
      }
      
      // Se for um caractere válido (número ou letra), adicionar ao buffer
      if (e.key.length === 1 && !isInputFocused) {
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
  }, [barcodeBuffer, lastKeyTime, adicionarItem]);

  // ==================== ATALHOS NATIVOS (SIMPLES E DIRETO) ====================
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      console.log('Tecla pressionada:', e.key, 'Code:', e.code, 'Target:', document.activeElement?.tagName);
      
      // Verifica se um input está focado
      const isInputFocused = document.activeElement?.tagName === 'INPUT' || 
                             document.activeElement?.tagName === 'TEXTAREA';
      
      // F1 - Focar na busca (sempre funciona)
      if (e.key === 'F1') {
        e.preventDefault();
        console.log('F1 - Focar busca');
        searchRef.current?.focus();
        return;
      }
      
      // F3 - Abrir scanner (só fora de inputs)
      if (e.key === 'F3' && !isInputFocused) {
        e.preventDefault();
        console.log('F3 - Abrir scanner');
        setShowScanner(true);
        return;
      }
      
      // F5 - Limpar carrinho (só fora de inputs)
      if (e.key === 'F5' && !isInputFocused) {
        e.preventDefault();
        console.log('F5 - Limpar carrinho');
        limparCarrinho();
        return;
      }
      
      // F7 - Abrir Customer Display (só fora de inputs)
      if (e.key === 'F7' && !isInputFocused) {
        e.preventDefault();
        console.log('F7 - Abrir Customer Display');
        openCustomerDisplay();
        return;
      }
      
      // / - Dinheiro (só fora de inputs)
      if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        console.log('/ - Dinheiro');
        openPaymentSummary('dinheiro');
        return;
      }
      
      // * - Cartão (só fora de inputs)
      if (e.key === '*' && !isInputFocused) {
        e.preventDefault();
        console.log('* - Cartão');
        openPaymentSummary('cartao', 'cartao');
        return;
      }
      
      // - - PIX (só fora de inputs)
      if (e.key === '-' && !isInputFocused) {
        e.preventDefault();
        console.log('- - PIX');
        openPaymentSummary('pix');
        return;
      }
      
      // ESC - Fechar modais (sempre funciona)
      if (e.key === 'Escape') {
        console.log('ESC - Fechar modais');
        setShowScanner(false);
        setShowPaymentSummary(false);
        setShowContingenciaModal(false);
        if (showQuantidadePopup) {
          setShowQuantidadePopup(false);
          setProdutoPendente(null);
          setUnidadeSelecionada('UN');
        }
        return;
      }
      
      // Enter no modal de pagamento - Confirmar
      if (e.key === 'Enter' && showPaymentSummary && !isInputFocused) {
        e.preventDefault();
        console.log('Enter - Confirmar pagamento');
        if (selectedMethod === 'dinheiro' && cashReceived < total) {
          toast.error('Valor recebido insuficiente');
          return;
        }
        confirmarPagamento();
        return;
      }
      
      // Seta para baixo/cima e Enter no campo de busca - delega para o handler local
      if (isInputFocused && searchRef.current === document.activeElement) {
        // O handler onKeyDown no input já cuida disso
        return;
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [showPaymentSummary, selectedMethod, cashReceived, total, showQuantidadePopup, showScanner, showContingenciaModal]);

  // ==================== VALIDAÇÃO DE ESTOQUE ====================
  const temEstoqueDisponivel = (produtoId: string, qtd: number): boolean => {
    const estoqueLoja = getEstoquePorLocal(produtoId, 'loja');
    return estoqueLoja >= qtd;
  };

  // ==================== PAGAMENTO ====================
  const openPaymentSummary = (method: 'dinheiro' | 'cartao' | 'pix', abaInicial: 'resumo' | 'cartao' = 'resumo') => {
    if (itens.length === 0) return toast.error("Carrinho vazio!");
    setSelectedMethod(method);
    setCashReceived(0);
    setAbaPagamentoAtiva(abaInicial);
    setShowPaymentSummary(true);
  };

  const confirmarPagamento = () => {
    if (!selectedMethod) return;

    finalizarVenda(selectedMethod);
    resetarTudoAposVenda();

    toast.success(`Venda finalizada com sucesso via ${selectedMethod.toUpperCase()}!`);
  };

  const confirmarPagamentoCartao = (transacaoId: string) => {
    finalizarVenda('cartao');
    resetarTudoAposVenda();
    setShowPaymentSummary(false);
    setAbaPagamentoAtiva('resumo');

    toast.success(`Venda finalizada com sucesso via CARTÃO!`);
  };

  const calculateChange = () => Math.max(0, cashReceived - total);

  // ==================== CONTINGÊNCIA ====================
  const carregarPendentes = () => {
    // Carrega NFe pendentes do localStorage ou API
    const pendentes = localStorage.getItem('nfePendentes');
    if (pendentes) {
      setNfePendentes(JSON.parse(pendentes));
    } else {
      setNfePendentes([]);
    }
  };

  // ==================== QUANTIDADE COM VALIDAÇÃO ====================
  const handleAdicionarComQuantidade = (produto: ProdutoBase) => {
    setProdutoPendente(produto);
    setQuantidadeInput("1");
    
    // Se há uma apresentação encontrada, configura automaticamente a unidade
    if (apresentacaoEncontrada) {
      setUnidadeSelecionada(apresentacaoEncontrada.tipo);
      // Limpa a apresentação encontrada após usar
      useCaixaStore.setState({ apresentacaoEncontrada: null });
    } else {
      setUnidadeSelecionada("UN");
    }
    
    setShowQuantidadePopup(true);
    setTimeout(() => quantidadeInputRef.current?.focus(), 100);
  };

  const confirmarQuantidade = () => {
    if (!produtoPendente) return;
    const qtd = parseInt(quantidadeInput) || 1;
    if (qtd < 1) return toast.error("Quantidade inválida!");

    // Busca o produto completo para obter as conversões
    const produtos = useEstoqueStore.getState().produtos;
    const produto = produtos.find(p => p.id === produtoPendente.id);
    
    // Converte a quantidade baseada na unidade selecionada
    let quantidadeConvertida = qtd;
    if (produto && unidadeSelecionada !== produto.unidadeMedidaPadrao) {
      const conversao = produto.conversoes?.find(
        c => c.unidadeOrigem === unidadeSelecionada && c.unidadeDestino === produto.unidadeMedidaPadrao
      );
      if (conversao) {
        // Se adicionou 1 fardo, converte para 10 unidades
        quantidadeConvertida = qtd * conversao.fatorMultiplicador;
      }
    }

    // Verifica o estoque usando a quantidade convertida (em unidades padrão)
    const estoqueDisponivel = getEstoquePorLocal(produtoPendente.id, 'loja');
    if (estoqueDisponivel < quantidadeConvertida) {
      // Calcula quantas unidades na unidade selecionada estão disponíveis
      let disponivelNaUnidadeSelecionada = estoqueDisponivel;
      if (produto && unidadeSelecionada !== produto.unidadeMedidaPadrao) {
        const conversao = produto.conversoes?.find(
          c => c.unidadeOrigem === unidadeSelecionada && c.unidadeDestino === produto.unidadeMedidaPadrao
        );
        if (conversao) {
          disponivelNaUnidadeSelecionada = Math.floor(estoqueDisponivel / conversao.fatorMultiplicador);
        }
      }
      return toast.error(`Estoque insuficiente! Apenas ${disponivelNaUnidadeSelecionada} ${unidadeSelecionada} disponível.`);
    }

    const produtoParaAdicionar = {
      ...produtoPendente,
      estoqueMinimo: 0,
      lotes: [],
      unidadesDeMedida: [{ id: "un-default", nome: "Unidade", sigla: "un", fatorConversao: 1 }],
      setor: 'outros' as any,
    } as Produto;

    // Passa a quantidade convertida e a unidade padrão para o carrinho
    adicionarItem(produtoParaAdicionar, produto?.unidadeMedidaPadrao || 'UN', quantidadeConvertida);

    toast.success(`${qtd} × ${produtoPendente.nome} (${unidadeSelecionada}) adicionado(s)!`);
    setShowQuantidadePopup(false);
    setProdutoPendente(null);
    setUnidadeSelecionada("UN");
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // ==================== TELA DO CLIENTE ====================
  const openCustomerDisplay = () => {
    window.open('/customer-display', 'customerDisplay', 'width=1100,height=700,menubar=no,toolbar=no,location=no,status=no,resizable=yes');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header White Label */}
      <header className="border-b bg-card p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {companyLogo && <img src={companyLogo} alt={companyName} className="h-11 object-contain" />}
          <div>
            <h1 className="text-2xl font-bold">{companyName}</h1>
            <p className="text-sm text-muted-foreground">Caixa • {user?.name || "Operador"}</p>
          </div>
        </div>
        <Badge 
          variant={statusCaixa === "ocupado" ? "secondary" : statusCaixa === "fechado" ? "destructive" : "default"}
          className={statusCaixa === "ocupado" ? "bg-orange-500 text-white" : statusCaixa === "livre" ? "bg-green-500 text-white" : ""}
        >
          {statusCaixa.toUpperCase()}
        </Badge>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Área de Busca + Autocomplete */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="p-4">
              <div className="relative">
                <Search className="absolute left-4 top-4 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    buscarProduto(e.target.value);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Buscar produto ou código de barras... (F1)"
                  className="pl-12 h-12 text-lg"
                />
              </div>

              {/* Autocomplete - Só aparece enquanto digita */}
              {searchTerm.length > 0 && sugestoes.length > 0 && (
                <div className="mt-3 max-h-80 overflow-auto space-y-1 border rounded-lg bg-card">
                  {sugestoes.map((produto, index) => (
                    <div
                      key={produto.id}
                      onClick={() => handleSelectProduto(produto as ProdutoBase)}
                      className={`p-3 rounded-lg cursor-pointer flex justify-between items-center ${
                        index === selectedIndex ? 'bg-accent' : 'hover:bg-accent'
                      }`}
                    >
                      <div>
                        <p className="font-medium">{produto.nome}</p>
                        {produto.codigoBarras && <p className="text-xs text-muted-foreground">{produto.codigoBarras}</p>}
                      </div>
                      <p className="font-bold">{formatCurrency(produto.precoVenda)}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Carrinho Completo */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Carrinho ({itens.length})
                </h2>
                {itens.length > 0 && (
                  <Button variant="destructive" size="sm" onClick={limparCarrinho}>
                    Limpar Carrinho
                  </Button>
                )}
              </div>

              <ScrollArea className="h-[460px] pr-2">
                {itens.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Carrinho vazio</p>
                ) : (
                  itens.map((item) => (
                    <div key={item.id} className="p-4 bg-muted rounded-lg mb-3">
                      <div className="flex justify-between items-center gap-4">
                        <div className="flex-1">
                          <p className="font-medium">{item.nome}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(item.precoVenda)} un.</p>
                          {item.unidadeMedida && item.unidadeMedida !== 'UN' && (
                            <Badge variant="secondary" className="mt-1">{item.unidadeMedida}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => atualizarQuantidade(item.id, item.quantidade - 1)}>-</Button>
                          <span className="w-12 text-center font-bold">{item.quantidade}</span>
                          <Button size="sm" variant="outline" onClick={() => atualizarQuantidade(item.id, item.quantidade + 1)}>+</Button>
                        </div>
                        <p className="font-bold w-28 text-right">{formatCurrency(item.precoVenda * item.quantidade)}</p>
                        <Button variant="ghost" size="icon" onClick={() => removerItem(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card className="p-6 sticky top-6">
              <div className="space-y-4 text-lg">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                {desconto > 0 && <div className="flex justify-between text-emerald-600"><span>Desconto</span><span>-{formatCurrency(desconto)}</span></div>}
                <Separator />
                <div className="flex justify-between text-3xl font-bold"><span>Total</span><span>{formatCurrency(total)}</span></div>
              </div>

              <div className="grid grid-cols-1 gap-3 mt-8">
                <Button 
                  size="lg" 
                  className="h-16" 
                  onClick={() => openPaymentSummary('dinheiro')} 
                  disabled={itens.length === 0}
                  aria-keyshortcuts="/"
                >
                  💵 Dinheiro (/)
                </Button>
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="h-16" 
                  onClick={() => openPaymentSummary('cartao', 'cartao')} 
                  disabled={itens.length === 0}
                  aria-keyshortcuts="*"
                >
                  💳 Cartão (*)
                </Button>
                <Button 
                  size="lg" 
                  className="h-16 bg-blue-600 hover:bg-blue-700" 
                  onClick={() => openPaymentSummary('pix')} 
                  disabled={itens.length === 0}
                  aria-keyshortcuts="-"
                >
                  📱 PIX (-)
                </Button>

                <Button onClick={openCustomerDisplay} variant="outline" className="h-14 mt-4">
                  <Monitor className="mr-2" /> Abrir Tela para o Cliente (F7)
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Botões Flutuantes */}
      <Button
        onClick={() => { carregarPendentes(); setShowContingenciaModal(true); }}
        className="fixed bottom-6 left-6 z-50 shadow-xl bg-orange-600 hover:bg-orange-700"
        size="lg"
      >
        <AlertCircle className="mr-2 h-5 w-5" />
        Contingência ({nfePendentes.length})
      </Button>

      {/* Modal de Pagamento */}
      <Dialog open={showPaymentSummary} onOpenChange={(open) => {
        if (!open) {
          setShowPaymentSummary(false);
          setAbaPagamentoAtiva('resumo');
          limparTransacaoAtual(); // Limpa transação ao fechar modal
        }
      }}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-hidden"
          onKeyDown={(e) => {
            // Se estiver no modal de pagamento e digitar um número, vai para campo de valor
            if (showPaymentSummary && e.key >= '0' && e.key <= '9') {
              const activeElement = document.activeElement as HTMLElement;
              const isCalculatorInput = activeElement?.hasAttribute('data-calculator-input');
              
              // Se não estiver no calculator input, move o foco
              if (!isCalculatorInput && calculatorInputRef.current && abaPagamentoAtiva === 'resumo') {
                e.preventDefault();
                calculatorInputRef.current.focus();
              }
            }
            
            // + do numpad para adicionar pagamento parcial
            if (e.key === '+' || e.key === 'NumpadAdd') {
              if (cashReceived > 0 && restantePagar > 0 && abaPagamentoAtiva === 'resumo') {
                e.preventDefault();
                adicionarPagamentoParcial(selectedMethod, cashReceived);
              }
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Pagamento</DialogTitle>
          </DialogHeader>
          
          {/* Abas do Modal */}
          <div className="flex gap-2 border-b pb-2 mb-4">
            <Button
              variant={abaPagamentoAtiva === 'resumo' ? 'default' : 'ghost'}
              onClick={() => {
                setAbaPagamentoAtiva('resumo');
                limparTransacaoAtual(); // Limpa transação ao mudar para resumo
              }}
              className="flex-1"
            >
              Resumo
            </Button>
            <Button
              variant={abaPagamentoAtiva === 'cartao' ? 'default' : 'ghost'}
              onClick={() => setAbaPagamentoAtiva('cartao')}
              className="flex-1"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Cartão
            </Button>
          </div>

          {/* Conteúdo da Aba Resumo */}
          {abaPagamentoAtiva === 'resumo' && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6 py-4">
              <div className="text-center">
                <p className="text-muted-foreground">Total a pagar</p>
                <p className="text-5xl font-black text-primary">{formatCurrency(total)}</p>
              </div>

              {pagamentosParciais.length > 0 && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Pagamentos Adicionados:</p>
                  {pagamentosParciais.map((pagamento, index) => (
                    <div key={index} className="flex justify-between items-center py-1">
                      <span className="text-sm">
                        {pagamento.forma === 'dinheiro' ? '💵 Dinheiro' : pagamento.forma === 'cartao' ? '💳 Cartão' : '📱 PIX'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{formatCurrency(pagamento.valor)}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removerPagamentoParcial(index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                    <span>Total Pago:</span>
                    <span className="text-green-600">{formatCurrency(totalPagamentosParciais)}</span>
                  </div>
                  {restantePagar > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Restante:</span>
                      <span>{formatCurrency(restantePagar)}</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Forma de Pagamento {restantePagar > 0 ? `(Restante: ${formatCurrency(restantePagar)})` : ''}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    data-payment-button
                    variant={selectedMethod === 'dinheiro' ? 'default' : 'outline'}
                    onClick={() => setSelectedMethod('dinheiro')}
                    className="h-14"
                  >
                    <span className="text-xs">/</span>
                    <span className="ml-1">Dinheiro</span>
                  </Button>
                  <Button
                    data-payment-button
                    variant={selectedMethod === 'cartao' ? 'default' : 'outline'}
                    onClick={() => setAbaPagamentoAtiva('cartao')}
                    className="h-14"
                  >
                    <span className="text-xs">*</span>
                    <span className="ml-1">Cartão</span>
                  </Button>
                  <Button
                    data-payment-button
                    variant={selectedMethod === 'pix' ? 'default' : 'outline'}
                    onClick={() => setSelectedMethod('pix')}
                    className="h-14"
                  >
                    <span className="text-xs">-</span>
                    <span className="ml-1">PIX</span>
                  </Button>
                </div>
              </div>

              {selectedMethod === 'dinheiro' && (
                <div>
                  <Label className="text-lg">Valor Recebido (R$)</Label>
                  <CalculatorInput
                    data-calculator-input
                    ref={calculatorInputRef}
                    value={cashReceived}
                    onChange={setCashReceived}
                    className="text-5xl font-bold text-center h-20 mt-2"
                  />
                  <p className="text-sm text-green-600 mt-2">
                    Troco: {formatCurrency(Math.max(0, cashReceived - restantePagar))}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dica: Digite apenas números (ex: 150 para R$ 1,50)
                  </p>
                  {restantePagar > 0 && cashReceived > 0 && (
                    <Button
                      onClick={() => adicionarPagamentoParcial('dinheiro', cashReceived)}
                      className="w-full mt-2"
                    >
                      + Adicionar Pagamento Parcial
                    </Button>
                  )}
                </div>
              )}

              {selectedMethod === 'pix' && (
                <div>
                  <Label className="text-lg">Valor do PIX (R$)</Label>
                  <CalculatorInput
                    data-calculator-input
                    value={cashReceived || restantePagar}
                    onChange={setCashReceived}
                    className="text-5xl font-bold text-center h-20 mt-2"
                  />
                  <div className="flex justify-center bg-white p-8 rounded-xl mt-4">
                    <QRCodeSVG value={`PIX-${Date.now()}-${cashReceived || restantePagar}`} size={220} />
                  </div>
                  {restantePagar > 0 && cashReceived > 0 && (
                    <Button
                      onClick={() => adicionarPagamentoParcial('pix', cashReceived)}
                      className="w-full mt-2"
                    >
                      + Adicionar Pagamento Parcial
                    </Button>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                {pagamentosParciais.length > 0 ? (
                  <Button onClick={confirmarPagamento} className="flex-1 h-14 text-lg font-bold">
                    Finalizar Venda (Enter)
                  </Button>
                ) : (
                  <>
                    <Button onClick={confirmarPagamento} className="flex-1 h-14 text-lg font-bold">
                      Confirmar Pagamento (Enter)
                    </Button>
                    {restantePagar < total && (
                      <Button
                        onClick={() => {
                          if (cashReceived > 0) {
                            adicionarPagamentoParcial(selectedMethod, cashReceived);
                          }
                        }}
                        variant="outline"
                        className="h-14 text-lg font-bold"
                      >
                        + Adicionar Forma
                      </Button>
                    )}
                  </>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Atalhos: /=Dinheiro, *=Cartão, -=PIX, +=Adicionar Pagamento, Enter=Confirmar, ESC=Cancelar
              </p>
            </div>
            </ScrollArea>
          )}

          {/* Conteúdo da Aba Cartão */}
          {abaPagamentoAtiva === 'cartao' && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <PagamentoCartao
                vendaId={`venda-${Date.now()}`}
                valor={restantePagar > 0 ? restantePagar : total}
                onConfirmar={confirmarPagamentoCartao}
                onCancelar={() => {
                  setShowPaymentSummary(false);
                  setAbaPagamentoAtiva('resumo');
                }}
              />
            </ScrollArea>
          )}
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
            <div id="reader" className="w-full min-h-[300px] bg-black rounded-lg"></div>
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
              Pressione ESC para fechar ou clique em "Iniciar Câmera" para começar
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Popup de Quantidade */}
      <AnimatePresence>
        {showQuantidadePopup && produtoPendente && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]"
          >
            <Card className="w-full max-w-md p-8">
              <h3 className="text-2xl font-semibold mb-6 text-center">{produtoPendente.nome}</h3>
              <Input
                ref={quantidadeInputRef}
                type="number"
                value={quantidadeInput}
                onChange={(e) => setQuantidadeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmarQuantidade()}
                className="text-5xl text-center font-bold"
              />
              <div className="mt-6">
                <Label>Unidade de Medida</Label>
                <div className="mt-2 p-4 bg-muted rounded-lg border-2 border-primary">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      {unidadesMedida.find(u => u.abreviatura === unidadeSelecionada)?.descricao || unidadeSelecionada} 
                      <span className="text-lg"> ({unidadeSelecionada})</span>
                    </span>
                    <kbd className="px-2 py-1 bg-background border rounded text-sm font-mono">
                      F8
                    </kbd>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Pressione F8 para alternar entre unidades disponíveis
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <Button onClick={confirmarQuantidade} className="flex-1 h-14">Confirmar</Button>
                <Button variant="outline" onClick={() => { setShowQuantidadePopup(false); setProdutoPendente(null); setUnidadeSelecionada("UN"); }} className="flex-1 h-14">Cancelar</Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão Flutuante do Scanner */}
      <ScannerButton onClick={() => setShowScanner(true)} label="Abrir Scanner (F3)" />
    </div>
  );
};
// ==================== FUNÇÕES AUXILIARES ====================
const printDANFEContingencia = (xml: string, chave: string, companyName: string = "PDV Brasil") => {
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(`
      <html><head><title>CONTINGÊNCIA - ${companyName}</title></head>
      <body style="padding:20px; font-family:Arial; border:3px solid red;">
        <h2 style="color:red;">EMITIDA EM CONTINGÊNCIA - ${companyName}</h2>
        <pre style="background:#fff0f0;padding:15px;font-size:11px;white-space:pre-wrap;">${escapeHtml(xml)}</pre>
        <p><strong>Chave:</strong> ${chave}</p>
        <button onclick="window.print()">Imprimir DANFE</button>
      </body></html>
    `);
    win.document.close();
  }
};

const escapeHtml = (unsafe: string) => unsafe
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;");

export default Caixa;