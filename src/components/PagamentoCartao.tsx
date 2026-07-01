// src/components/PagamentoCartao.tsx
// Componente de Pagamento com Cartão - PDV Brasil
// Suporte a InfinitePay, TAF (Stone/Cielo/Rede) e Fallback Manual
// Última atualização: 27/05/2026

import React, { useState, useEffect } from "react";
import { usePagamentoStore, TipoTerminal, TipoTransacao, BandeiraCartao } from "@/store/pagamentoStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  Smartphone, 
  Printer, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  ChevronRight,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface PagamentoCartaoProps {
  vendaId: string;
  valor: number;
  onConfirmar: (transacaoId: string) => void;
  onCancelar: () => void;
}

const PagamentoCartao: React.FC<PagamentoCartaoProps> = ({
  vendaId,
  valor,
  onConfirmar,
  onCancelar
}) => {
  const {
    transacaoAtual,
    terminalSelecionado,
    terminais,
    processando,
    modoManual,
    empresaNome,
    selecionarTerminal,
    iniciarTransacao,
    processarInfinitePay,
    processarTerminalTAF,
    processarManual,
    cancelarTransacao,
    imprimirComprovante,
    limparTransacaoAtual
  } = usePagamentoStore();

  // Estados locais para formulários
  const [tipoTransacao, setTipoTransacao] = useState<TipoTransacao>('credito');
  const [parcelas, setParcelas] = useState(1);
  const [nsu, setNsu] = useState('');
  const [autorizacao, setAutorizacao] = useState('');
  const [bandeira, setBandeira] = useState<BandeiraCartao>('visa');
  const [ultimos4Digitos, setUltimos4Digitos] = useState('');
  const [contadorTimer, setContadorTimer] = useState(0);

  // Timer para InfinitePay
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (transacaoAtual?.terminal === 'infinitepay' && transacaoAtual?.status === 'aguardando' && !processando) {
      interval = setInterval(() => {
        setContadorTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [transacaoAtual?.terminal, transacaoAtual?.status, processando]);

  // Limpa transação ao desmontar o componente
  useEffect(() => {
    return () => {
      limparTransacaoAtual();
    };
  }, [limparTransacaoAtual]);

  // Formata valor para exibição
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Inicia transação com InfinitePay
  const handleIniciarInfinitePay = () => {
    iniciarTransacao(vendaId, valor, tipoTransacao, parcelas > 1 ? parcelas : undefined);
    
    // Abre o deep link (simulado em modo teste)
    if (transacaoAtual?.deepLink) {
      window.open(transacaoAtual.deepLink, '_blank');
    }
  };

  // Processa pagamento via InfinitePay
  const handleProcessarInfinitePay = async () => {
    await processarInfinitePay(valor);
  };

  // Processa pagamento via Terminal TAF
  const handleProcessarTAF = async () => {
    if (!nsu || !autorizacao || !ultimos4Digitos) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    await processarTerminalTAF({ nsu, autorizacao, bandeira, ultimos4Digitos });
  };

  // Processa pagamento manual
  const handleProcessarManual = async () => {
    if (!nsu || !ultimos4Digitos) {
      toast.error('Preencha NSU e últimos 4 dígitos');
      return;
    }
    await processarManual({ nsu, ultimos4Digitos, bandeira });
  };

  // Confirma transação aprovada
  const handleConfirmar = () => {
    if (transacaoAtual?.status === 'aprovado' && transacaoAtual?.id) {
      onConfirmar(transacaoAtual.id);
      limparTransacaoAtual();
    }
  };

  // Cancela transação
  const handleCancelar = () => {
    cancelarTransacao();
    onCancelar();
  };

  // Renderiza ícone da bandeira
  const renderBandeiraIcon = (bandeira: BandeiraCartao) => {
    const cores: Record<BandeiraCartao, string> = {
      visa: 'text-blue-600',
      mastercard: 'text-orange-600',
      elo: 'text-red-600',
      hipercard: 'text-purple-600',
      amex: 'text-blue-800',
      discover: 'text-orange-800',
      outros: 'text-gray-600'
    };
    return (
      <Badge className={cores[bandeira]}>
        {bandeira.toUpperCase()}
      </Badge>
    );
  };

  // Renderiza status da transação
  const renderStatus = () => {
    if (!transacaoAtual) return null;

    const statusConfig = {
      aguardando: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', text: 'Aguardando' },
      aprovado: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', text: 'Aprovado' },
      recusado: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', text: 'Recusado' },
      erro: { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50', text: 'Erro' },
      cancelado: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-50', text: 'Cancelado' }
    };

    const config = statusConfig[transacaoAtual.status];
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-2 p-4 rounded-lg ${config.bg}`}>
        <Icon className={`h-5 w-5 ${config.color}`} />
        <span className={`font-semibold ${config.color}`}>{config.text}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Seletor de Terminal */}
      {!transacaoAtual && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Selecione o Terminal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* InfinitePay */}
              <Button
                variant={terminalSelecionado === 'infinitepay' ? 'default' : 'outline'}
                className="h-24 flex-col gap-2"
                onClick={() => selecionarTerminal('infinitepay')}
              >
                <Smartphone className="h-8 w-8" />
                <span className="font-semibold">InfinitePay</span>
                <span className="text-xs opacity-70">Celular como Maquininha</span>
                <Badge variant="secondary" className="text-xs">Modo Teste</Badge>
              </Button>

              {/* Stone */}
              <Button
                variant={terminalSelecionado === 'stone' ? 'default' : 'outline'}
                className="h-24 flex-col gap-2"
                onClick={() => selecionarTerminal('stone')}
                disabled={!terminais.find(t => t.tipo === 'stone')?.ativo}
              >
                <CreditCard className="h-8 w-8" />
                <span className="font-semibold">Stone</span>
                <span className="text-xs opacity-70">Terminal TAF</span>
              </Button>

              {/* Cielo */}
              <Button
                variant={terminalSelecionado === 'cielo' ? 'default' : 'outline'}
                className="h-24 flex-col gap-2"
                onClick={() => selecionarTerminal('cielo')}
                disabled={!terminais.find(t => t.tipo === 'cielo')?.ativo}
              >
                <CreditCard className="h-8 w-8" />
                <span className="font-semibold">Cielo</span>
                <span className="text-xs opacity-70">Terminal TAF</span>
              </Button>

              {/* Rede */}
              <Button
                variant={terminalSelecionado === 'rede' ? 'default' : 'outline'}
                className="h-24 flex-col gap-2"
                onClick={() => selecionarTerminal('rede')}
                disabled={!terminais.find(t => t.tipo === 'rede')?.ativo}
              >
                <CreditCard className="h-8 w-8" />
                <span className="font-semibold">Rede</span>
                <span className="text-xs opacity-70">Terminal TAF</span>
              </Button>

              {/* Manual */}
              <Button
                variant={terminalSelecionado === 'manual' ? 'default' : 'outline'}
                className="h-24 flex-col gap-2"
                onClick={() => selecionarTerminal('manual')}
              >
                <CreditCard className="h-8 w-8" />
                <span className="font-semibold">Manual</span>
                <span className="text-xs opacity-70">NSU + 4 Dígitos</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuração da Transação */}
      {terminalSelecionado && !transacaoAtual && (
        <Card>
          <CardHeader>
            <CardTitle>Configurar Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Valor a pagar</p>
              <p className="text-4xl font-bold text-primary">{formatCurrency(valor)}</p>
            </div>

            <div>
              <Label>Tipo de Transação</Label>
              <Select value={tipoTransacao} onValueChange={(value: TipoTransacao) => setTipoTransacao(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credito">Crédito à Vista</SelectItem>
                  <SelectItem value="debito">Débito</SelectItem>
                  <SelectItem value="credito_parcelado">Crédito Parcelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tipoTransacao === 'credito_parcelado' && (
              <div>
                <Label>Número de Parcelas</Label>
                <Select value={parcelas.toString()} onValueChange={(value) => setParcelas(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n}x</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleCancelar} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleIniciarInfinitePay} className="flex-1">
                Iniciar Pagamento
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* InfinitePay - Aguardando */}
      {transacaoAtual?.terminal === 'infinitepay' && transacaoAtual?.status === 'aguardando' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              InfinitePay - Aguardando Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderStatus()}

            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <Smartphone className="h-16 w-16 mx-auto mb-4 text-blue-600" />
              <p className="text-lg font-semibold mb-2">Aguardando confirmação no app</p>
              <p className="text-sm text-muted-foreground mb-4">
                O app InfinitePay foi aberto. Complete o pagamento no seu celular.
              </p>
              <Badge variant="secondary" className="text-lg">
                {Math.floor(contadorTimer / 60)}:{(contadorTimer % 60).toString().padStart(2, '0')}
              </Badge>
            </div>

            <Button
              onClick={handleProcessarInfinitePay}
              className="w-full h-14"
              disabled={processando}
            >
              {processando ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Verificar Pagamento
                </>
              )}
            </Button>

            <Separator />

            <Button
              onClick={() => selecionarTerminal('manual')}
              variant="outline"
              className="w-full"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Fallback: Digitar Manualmente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Terminal TAF */}
      {transacaoAtual?.terminal !== 'infinitepay' && transacaoAtual?.terminal !== 'manual' && transacaoAtual?.status === 'aguardando' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {terminalSelecionado.toUpperCase()} - Terminal TAF
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderStatus()}

            <div className="space-y-4">
              <div>
                <Label>NSU *</Label>
                <Input
                  value={nsu}
                  onChange={(e) => setNsu(e.target.value)}
                  placeholder="Digite o NSU do terminal"
                />
              </div>

              <div>
                <Label>Código de Autorização *</Label>
                <Input
                  value={autorizacao}
                  onChange={(e) => setAutorizacao(e.target.value)}
                  placeholder="Digite o código de autorização"
                />
              </div>

              <div>
                <Label>Bandeira do Cartão *</Label>
                <Select value={bandeira} onValueChange={(value: BandeiraCartao) => setBandeira(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="mastercard">Mastercard</SelectItem>
                    <SelectItem value="elo">Elo</SelectItem>
                    <SelectItem value="hipercard">Hipercard</SelectItem>
                    <SelectItem value="amex">American Express</SelectItem>
                    <SelectItem value="discover">Discover</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Últimos 4 Dígitos *</Label>
                <Input
                  value={ultimos4Digitos}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setUltimos4Digitos(value);
                  }}
                  placeholder="****"
                  maxLength={4}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCancelar} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleProcessarTAF}
                className="flex-1"
                disabled={processando}
              >
                {processando ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirmar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual - Fallback */}
      {transacaoAtual?.terminal === 'manual' && transacaoAtual?.status === 'aguardando' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pagamento Manual (Fallback)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderStatus()}

            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Modo de Contingência:</strong> Use esta opção quando a maquininha não estiver disponível.
                Digite os dados do comprovante fisicamente.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>NSU *</Label>
                <Input
                  value={nsu}
                  onChange={(e) => setNsu(e.target.value)}
                  placeholder="Digite o NSU do comprovante"
                />
              </div>

              <div>
                <Label>Bandeira do Cartão *</Label>
                <Select value={bandeira} onValueChange={(value: BandeiraCartao) => setBandeira(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="mastercard">Mastercard</SelectItem>
                    <SelectItem value="elo">Elo</SelectItem>
                    <SelectItem value="hipercard">Hipercard</SelectItem>
                    <SelectItem value="amex">American Express</SelectItem>
                    <SelectItem value="discover">Discover</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Últimos 4 Dígitos *</Label>
                <Input
                  value={ultimos4Digitos}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setUltimos4Digitos(value);
                  }}
                  placeholder="****"
                  maxLength={4}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCancelar} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleProcessarManual}
                className="flex-1"
                disabled={processando}
              >
                {processando ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Registrar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transação Aprovada */}
      {transacaoAtual?.status === 'aprovado' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-6 w-6" />
                Pagamento Aprovado!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderStatus()}

              <div className="bg-green-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-bold">{formatCurrency(transacaoAtual.valor)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Terminal:</span>
                  <span className="font-semibold">{transacaoAtual.terminal.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-semibold">{transacaoAtual.tipo.toUpperCase()}</span>
                </div>
                {transacaoAtual.parcelas && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Parcelas:</span>
                    <span className="font-semibold">{transacaoAtual.parcelas}x</span>
                  </div>
                )}
                {transacaoAtual.bandeira && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bandeira:</span>
                    {renderBandeiraIcon(transacaoAtual.bandeira)}
                  </div>
                )}
                {transacaoAtual.nsu && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NSU:</span>
                    <span className="font-mono">{transacaoAtual.nsu}</span>
                  </div>
                )}
                {transacaoAtual.autorizacao && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Autorização:</span>
                    <span className="font-mono">{transacaoAtual.autorizacao}</span>
                  </div>
                )}
                {transacaoAtual.ultimos4Digitos && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cartão:</span>
                    <span className="font-mono">**** **** **** {transacaoAtual.ultimos4Digitos}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => imprimirComprovante(transacaoAtual)}
                  variant="outline"
                  className="flex-1"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir Comprovante
                </Button>
                <Button
                  onClick={handleConfirmar}
                  className="flex-1"
                >
                  <ChevronRight className="mr-2 h-4 w-4" />
                  Finalizar Venda
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Transação Recusada/Erro */}
      {(transacaoAtual?.status === 'recusado' || transacaoAtual?.status === 'erro') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <XCircle className="h-6 w-6" />
                Pagamento {transacaoAtual.status === 'recusado' ? 'Recusado' : 'Erro'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderStatus()}

              {transacaoAtual.mensagem && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-red-800">{transacaoAtual.mensagem}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    limparTransacaoAtual();
                    setNsu('');
                    setAutorizacao('');
                    setUltimos4Digitos('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Tentar Novamente
                </Button>
                <Button
                  onClick={handleCancelar}
                  variant="destructive"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Informações da empresa (White Label) */}
      <div className="text-center text-sm text-muted-foreground">
        <p>{empresaNome}</p>
        <p className="text-xs">Pagamento seguro e processado com sucesso</p>
      </div>
    </div>
  );
};

export default PagamentoCartao;
