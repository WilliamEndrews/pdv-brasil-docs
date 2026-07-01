// src/components/CustomerDisplay.tsx
// Tela Secundária para o Cliente - Responsiva e Atualização em Tempo Real

import React, { useEffect, useState } from 'react';
import { useCaixaStore } from '@/store/caixaStore';
import { useConfig } from '@/store/configStore';
import { motion, AnimatePresence } from 'framer-motion';

const CustomerDisplay = () => {
  const { configuracao } = useConfig();
  const { itens, total, showPaymentSummary, selectedMethod, pagamentosParciais, cashReceived } = useCaixaStore();
  const [localItens, setLocalItens] = useState(itens);
  const [localTotal, setLocalTotal] = useState(total);
  const [localShowPaymentSummary, setLocalShowPaymentSummary] = useState(showPaymentSummary);
  const [localSelectedMethod, setLocalSelectedMethod] = useState(selectedMethod);
  const [localPagamentosParciais, setLocalPagamentosParciais] = useState(pagamentosParciais);
  const [localCashReceived, setLocalCashReceived] = useState(cashReceived);

  // Sincronização em tempo real usando eventos de storage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pdv-caixa') {
        try {
          const newState = JSON.parse(e.newValue || '{}');
          // O estado está direto em newState, não em newState.state
          setLocalItens(newState.state?.itens || newState.itens || []);
          setLocalTotal(newState.state?.total || newState.total || 0);
          setLocalShowPaymentSummary(newState.state?.showPaymentSummary ?? newState.showPaymentSummary ?? false);
          setLocalSelectedMethod(newState.state?.selectedMethod ?? newState.selectedMethod ?? null);
          setLocalPagamentosParciais(newState.state?.pagamentosParciais ?? newState.pagamentosParciais ?? []);
          setLocalCashReceived(newState.state?.cashReceived ?? newState.cashReceived ?? 0);
        } catch (err) {
          console.error('Erro ao sincronizar:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Atualiza o estado local quando o estado do store muda
  useEffect(() => {
    setLocalItens(itens);
    setLocalTotal(total);
    setLocalShowPaymentSummary(showPaymentSummary);
    setLocalSelectedMethod(selectedMethod);
    setLocalPagamentosParciais(pagamentosParciais);
    setLocalCashReceived(cashReceived);
  }, [itens, total, showPaymentSummary, selectedMethod, pagamentosParciais, cashReceived]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getPaymentMethodName = (method: string) => {
    const names = {
      dinheiro: 'Dinheiro',
      cartao: 'Cartão',
      pix: 'PIX'
    };
    return names[method as keyof typeof names] || method;
  };

  const totalPagamentosParciais = localPagamentosParciais.reduce((sum, p) => sum + p.valor, 0);
  const restantePagar = localTotal - totalPagamentosParciais;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 text-white flex flex-col overflow-hidden">
      
      {/* Header */}
      <header className="border-b border-white/10 bg-black/90 py-6 px-6 {configu-8cao.nomeEmpre a}:px-12 flex items-center justify-center">
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter">PDV Brasil</h1>
      </header>

      <div className="flex-1 flex flex-col p-6 lg:p-12">
        
        {/* Total Grande - Responsivo */}
        <div className="text-center mb-6 lg:mb-8">
          <p className="text-emerald-400 text-lg lg:text-2xl font-medium tracking-widest mb-2 lg:mb-4">
            TOTAL A PAGAR
          </p>
          <motion.p 
            className="text-5xl md:text-6xl lg:text-8xl font-black tracking-[-4px] leading-none"
            key={localTotal}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            {formatCurrency(localTotal || 0)}
          </motion.p>
        </div>

        {/* Layout Lado a Lado: Itens e Pagamentos */}
        <div className={`flex-1 flex gap-6 ${localShowPaymentSummary && localPagamentosParciais.length > 0 ? 'flex-row' : 'flex-col'}`}>
          
          {/* Lista de Itens - Responsiva */}
          <div className={`${localShowPaymentSummary && localPagamentosParciais.length > 0 ? 'flex-1' : 'flex-1'} bg-white/5 backdrop-blur-xl rounded-3xl p-4 lg:p-6 border border-white/10 overflow-auto`}>
            <AnimatePresence mode="popLayout">
              {localItens.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/40">
                  <div className="text-5xl lg:text-6xl mb-4 opacity-30">🛍️</div>
                  <p className="text-xl lg:text-2xl font-light">Aguardando itens...</p>
                </div>
              ) : (
                <div className="space-y-4 lg:space-y-6">
                  {localItens.map((item, index) => (
                    <motion.div 
                      key={item.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-4 last:border-none"
                    >
                      <div className="flex-1 mb-2 sm:mb-0">
                        <p className="text-lg lg:text-xl font-medium">{item.nome}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm lg:text-base text-white/70">
                          {item.quantidade} × {formatCurrency(item.precoVenda)}
                        </p>
                        <p className="text-xl lg:text-2xl font-bold text-emerald-400">
                          {formatCurrency(item.precoVenda * item.quantidade)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Seção de Pagamentos - Apenas quando modal está aberto */}
          <AnimatePresence>
            {localShowPaymentSummary && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: '50%' }}
                exit={{ opacity: 0, width: 0 }}
                className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 backdrop-blur-xl rounded-3xl p-4 lg:p-6 border border-emerald-500/30 overflow-auto"
              >
                <h2 className="text-xl lg:text-2xl font-bold text-emerald-400 mb-4 text-center">
                  Pagamento em Andamento
                </h2>

                {/* Forma de Pagamento Selecionada */}
                {localSelectedMethod && (
                  <div className="mb-4 text-center">
                    <p className="text-sm text-white/70 mb-1">Forma de Pagamento</p>
                    <p className="text-2xl lg:text-3xl font-bold text-white">
                      {getPaymentMethodName(localSelectedMethod)}
                    </p>
                  </div>
                )}

                {/* Pagamentos Parciais */}
                {localPagamentosParciais.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-white/70 mb-2">Pagamentos Adicionados</p>
                    <div className="space-y-2">
                      {localPagamentosParciais.map((pagamento, index) => (
                        <div key={index} className="flex justify-between items-center bg-white/10 rounded-xl p-2">
                          <span className="text-base font-medium">{getPaymentMethodName(pagamento.forma)}</span>
                          <span className="text-lg font-bold text-emerald-400">{formatCurrency(pagamento.valor)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/20">
                      <span className="text-sm text-white/70">Total Pago</span>
                      <span className="text-xl font-bold text-emerald-400">{formatCurrency(totalPagamentosParciais)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-white/70">Restante</span>
                      <span className="text-xl font-bold text-amber-400">{formatCurrency(Math.max(0, restantePagar))}</span>
                    </div>
                  </div>
                )}

                {/* Troco para Dinheiro */}
                {localSelectedMethod === 'dinheiro' && localCashReceived > 0 && restantePagar < 0 && (
                  <div className="text-center">
                    <p className="text-sm text-white/70 mb-1">Troco</p>
                    <p className="text-3xl lg:text-4xl font-bold text-emerald-400">
                      {formatCurrency(Math.abs(restantePagar))}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 lg:py-10 text-center border-t border-white/10 bg-black/40">
        <p className="text-lg lg:text-xl text-white/60">Obrigado pela sua preferência! Volte sempre.</p>
      </footer>
    </div>
  );
};

export default CustomerDisplay;