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
import Webcam from "react-webcam";
import { QRCodeSVG } from "qrcode.react";

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

  // ==================== ZUSTAND STORES ====================
  const { 
    itens, 
    subtotal, 
    desconto, 
    total, 
    statusCaixa, 
    sugestoes,
    adicionarItem, 
    removerItem, 
    atualizarQuantidade, 
    limparCarrinho, 
    finalizarVenda, 
    buscarProduto 
  } = useCaixaStore();

  const { getEstoquePorLocal } = useEstoqueStore();

  // ==================== ESTADOS LOCAIS ====================
  const [searchTerm, setSearchTerm] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [showPaymentSummary, setShowPaymentSummary] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'dinheiro' | 'cartao' | 'pix'>('dinheiro');
  const [cashReceived, setCashReceived] = useState(0);
  const [showQuantidadePopup, setShowQuantidadePopup] = useState(false);
  const [produtoPendente, setProdutoPendente] = useState<ProdutoBase | null>(null);
  const [quantidadeInput, setQuantidadeInput] = useState("1");
  const [showContingenciaModal, setShowContingenciaModal] = useState(false);
  const [nfePendentes, setNfePendentes] = useState<Array<{ chave: string; data: string; xml: string }>>([]);

  const searchRef = useRef<HTMLInputElement>(null);
  const quantidadeInputRef = useRef<HTMLInputElement>(null);

  // ==================== LIMPEZA ====================
  const resetarBusca = () => {
    setSearchTerm('');
    buscarProduto('');
    useCaixaStore.setState({ sugestoes: [] });
  };

  const resetarTudoAposVenda = () => {
    resetarBusca();
    setSelectedMethod('dinheiro');
    setCashReceived(0);
    setShowPaymentSummary(false);
  };

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
  }, [searchTerm]);

  // ==================== ATALHOS ====================
  useHotkeys("f1", () => searchRef.current?.focus());
  useHotkeys("f3", () => setShowScanner(true));
  useHotkeys("f5", () => limparCarrinho());
  useHotkeys("esc", () => {
    setShowScanner(false);
    setShowPaymentSummary(false);
    setShowContingenciaModal(false);
    if (showQuantidadePopup) {
      setShowQuantidadePopup(false);
      setProdutoPendente(null);
    }
  });

  // ==================== VALIDAÇÃO DE ESTOQUE ====================
  const temEstoqueDisponivel = (produtoId: string, qtd: number): boolean => {
    const estoqueLoja = getEstoquePorLocal(produtoId, 'loja');
    return estoqueLoja >= qtd;
  };

  // ==================== PAGAMENTO ====================
  const openPaymentSummary = (method: 'dinheiro' | 'cartao' | 'pix') => {
    if (itens.length === 0) return toast.error("Carrinho vazio!");
    setSelectedMethod(method);
    setCashReceived(0);
    setShowPaymentSummary(true);
  };

  const confirmarPagamento = () => {
    if (!selectedMethod) return;

    finalizarVenda(selectedMethod);
    resetarTudoAposVenda();

    toast.success(`Venda finalizada com sucesso via ${selectedMethod.toUpperCase()}!`);
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
    setShowQuantidadePopup(true);
    setTimeout(() => quantidadeInputRef.current?.focus(), 100);
  };

  const confirmarQuantidade = () => {
    if (!produtoPendente) return;
    const qtd = parseInt(quantidadeInput) || 1;
    if (qtd < 1) return toast.error("Quantidade inválida!");

    if (!temEstoqueDisponivel(produtoPendente.id, qtd)) {
      const disponivel = getEstoquePorLocal(produtoPendente.id, 'loja');
      return toast.error(`Estoque insuficiente! Apenas ${disponivel} unidade(s) disponível.`);
    }

    const produtoParaAdicionar = {
      ...produtoPendente,
      estoqueMinimo: 0,
      lotes: [],
      unidadesDeMedida: [{ id: "un-default", nome: "Unidade", sigla: "un", fatorConversao: 1 }],
      setor: 'outros' as any,
    } as Produto;

    for (let i = 0; i < qtd; i++) {
      adicionarItem(produtoParaAdicionar);
    }

    toast.success(`${qtd} × ${produtoPendente.nome} adicionado(s)!`);
    setShowQuantidadePopup(false);
    setProdutoPendente(null);
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
        <Badge variant="outline">{statusCaixa.toUpperCase()}</Badge>
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
                  placeholder="Buscar produto ou código de barras... (F1)"
                  className="pl-12 h-12 text-lg"
                />
              </div>

              {/* Autocomplete - Só aparece enquanto digita */}
              {searchTerm.length > 0 && sugestoes.length > 0 && (
                <div className="mt-3 max-h-80 overflow-auto space-y-1 border rounded-lg bg-card">
                  {sugestoes.map((produto) => (
                    <div
                      key={produto.id}
                      onClick={() => handleAdicionarComQuantidade(produto as ProdutoBase)}
                      className="p-3 hover:bg-accent rounded-lg cursor-pointer flex justify-between items-center"
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
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Carrinho vazio. Digite algo para buscar.
                  </div>
                ) : (
                  itens.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-4 border-b last:border-none">
                      <div className="flex-1">
                        <p className="font-medium">{item.nome}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => atualizarQuantidade(item.id, item.quantidade - 1)}>-</Button>
                          <span className="w-8 text-center font-medium">{item.quantidade}</span>
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

          {/* Totais e Ações */}
          <div className="lg:col-span-4">
            <Card className="p-6 sticky top-6">
              <div className="space-y-4 text-lg">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                {desconto > 0 && <div className="flex justify-between text-emerald-600"><span>Desconto</span><span>-{formatCurrency(desconto)}</span></div>}
                <Separator />
                <div className="flex justify-between text-3xl font-bold"><span>Total</span><span>{formatCurrency(total)}</span></div>
              </div>

              <div className="grid grid-cols-1 gap-3 mt-8">
                <Button size="lg" className="h-16" onClick={() => openPaymentSummary('dinheiro')} disabled={itens.length === 0}>
                  💵 Dinheiro
                </Button>
                <Button size="lg" variant="secondary" className="h-16" onClick={() => openPaymentSummary('cartao')} disabled={itens.length === 0}>
                  💳 Cartão
                </Button>
                <Button size="lg" className="h-16 bg-blue-600 hover:bg-blue-700" onClick={() => openPaymentSummary('pix')} disabled={itens.length === 0}>
                  📱 PIX
                </Button>

                <Button onClick={openCustomerDisplay} variant="outline" className="h-14 mt-4">
                  <Monitor className="mr-2" /> Abrir Tela para o Cliente
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
      <Dialog open={showPaymentSummary} onOpenChange={setShowPaymentSummary}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resumo do Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="text-center">
              <p className="text-muted-foreground">Total a pagar</p>
              <p className="text-5xl font-black text-primary">{formatCurrency(total)}</p>
            </div>

            <Select value={selectedMethod} onValueChange={(v) => setSelectedMethod(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
              </SelectContent>
            </Select>

            {selectedMethod === 'dinheiro' && (
              <div>
                <Label>Valor Recebido (R$)</Label>
                <Input
                  type="number"
                  value={cashReceived || ""}
                  onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                  className="text-3xl font-bold text-center"
                />
                <p className="text-sm text-green-600 mt-2">Troco: {formatCurrency(calculateChange())}</p>
              </div>
            )}

            {selectedMethod === 'pix' && (
              <div className="flex justify-center bg-white p-8 rounded-xl">
                <QRCodeSVG value={`PIX-${Date.now()}-${total}`} size={220} />
              </div>
            )}

            <Button onClick={confirmarPagamento} className="w-full h-14 text-lg font-bold">
              Confirmar Pagamento
            </Button>
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
              <div className="flex gap-3 mt-8">
                <Button onClick={confirmarQuantidade} className="flex-1 h-14">Confirmar</Button>
                <Button variant="outline" onClick={() => { setShowQuantidadePopup(false); setProdutoPendente(null); }} className="flex-1 h-14">Cancelar</Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
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