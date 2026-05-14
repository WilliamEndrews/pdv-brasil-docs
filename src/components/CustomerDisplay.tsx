// src/components/CustomerDisplay.tsx
// Tela Secundária para o Cliente - Responsiva e Atualização em Tempo Real

import React from 'react';
import { useCaixaStore } from '@/store/caixaStore';
import { motion, AnimatePresence } from 'framer-motion';

const CustomerDisplay = () => {
  const { itens, total } = useCaixaStore();

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 text-white flex flex-col overflow-hidden">
      
      {/* Header */}
      <header className="border-b border-white/10 bg-black/90 py-6 px-6 lg:py-8 lg:px-12 flex items-center justify-center">
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter">PDV Brasil</h1>
      </header>

      <div className="flex-1 flex flex-col p-6 lg:p-12">
        
        {/* Total Grande - Responsivo */}
        <div className="text-center mb-8 lg:mb-12">
          <p className="text-emerald-400 text-lg lg:text-2xl font-medium tracking-widest mb-2 lg:mb-4">
            TOTAL A PAGAR
          </p>
          <motion.p 
            className="text-6xl md:text-7xl lg:text-[110px] font-black tracking-[-4px] leading-none"
            key={total}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            {formatCurrency(total || 0)}
          </motion.p>
        </div>

        {/* Lista de Itens - Responsiva */}
        <div className="flex-1 bg-white/5 backdrop-blur-xl rounded-3xl p-6 lg:p-10 border border-white/10 overflow-auto">
          <AnimatePresence mode="popLayout">
            {itens.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white/40">
                <div className="text-7xl lg:text-8xl mb-6 opacity-30">🛍️</div>
                <p className="text-2xl lg:text-3xl font-light">Aguardando itens...</p>
              </div>
            ) : (
              <div className="space-y-6 lg:space-y-8">
                {itens.map((item, index) => (
                  <motion.div 
                    key={item.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-6 last:border-none"
                  >
                    <div className="flex-1 mb-3 sm:mb-0">
                      <p className="text-xl lg:text-2xl font-medium">{item.nome}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base lg:text-lg text-white/70">
                        {item.quantidade} × {formatCurrency(item.precoVenda)}
                      </p>
                      <p className="text-2xl lg:text-3xl font-bold text-emerald-400">
                        {formatCurrency(item.precoVenda * item.quantidade)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
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