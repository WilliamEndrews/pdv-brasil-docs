// src/components/estoque/QuantidadeTooltip.tsx
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Produto, converterQuantidadeParaPadrao } from '@/store/estoqueStore';

interface QuantidadeTooltipProps {
  produto: Produto;
  quantidade: number;
  children: React.ReactNode;
}

/**
 * Calcula a representação da quantidade em diferentes unidades
 */
export const calcularConversoes = (produto: Produto, quantidade: number) => {
  const conversoes: { unidade: string; valor: number }[] = [];
  const unidadePadrao = produto.unidadeMedidaPadrao || 'UN';

  console.log('=== DEBUG calcularConversoes ===');
  console.log('Unidade padrão:', unidadePadrao);
  console.log('Quantidade:', quantidade);
  console.log('Conversões configuradas:', produto.conversoes);

  // Adiciona sempre a unidade padrão
  conversoes.push({
    unidade: unidadePadrao,
    valor: quantidade,
  });

  // Conversão especial em cadeia: KG → G → UN (para produtos pesados)
  if (unidadePadrao === 'KG') {
    const conversaoGParaUN = produto.conversoes?.find(
      c => c.unidadeOrigem === 'G' && c.unidadeDestino === 'UN'
    );
    if (conversaoGParaUN) {
      const quantidadeG = quantidade * 1000;
      const quantidadeUN = quantidadeG / conversaoGParaUN.fatorMultiplicador;
      conversoes.push({
        unidade: 'G',
        valor: quantidadeG,
      });
      conversoes.push({
        unidade: 'UN',
        valor: quantidadeUN,
      });
      console.log('Conversão em cadeia KG → G → UN:', quantidade, 'KG →', quantidadeG, 'G →', quantidadeUN, 'UN');
    }
  }

  // Conversão especial em cadeia inversa: UN → G → KG
  if (unidadePadrao === 'UN') {
    const conversaoGParaUN = produto.conversoes?.find(
      c => c.unidadeOrigem === 'G' && c.unidadeDestino === 'UN'
    );
    if (conversaoGParaUN) {
      const quantidadeG = quantidade * conversaoGParaUN.fatorMultiplicador;
      const quantidadeKG = quantidadeG / 1000;
      conversoes.push({
        unidade: 'G',
        valor: quantidadeG,
      });
      conversoes.push({
        unidade: 'KG',
        valor: quantidadeKG,
      });
      console.log('Conversão em cadeia UN → G → KG (inversa):', quantidade, 'UN →', quantidadeG, 'G →', quantidadeKG, 'KG');
    }
  }

  // Calcula conversões para cada unidade configurada (lógica genérica)
  // Mas ignora conversões que já foram calculadas pela conversão em cadeia
  if (produto.conversoes && produto.conversoes.length > 0) {
    produto.conversoes.forEach(conversao => {
      // Ignora conversões KG → G e G → UN se já foram calculadas pela conversão em cadeia
      if ((conversao.unidadeOrigem === 'KG' && conversao.unidadeDestino === 'G') ||
          (conversao.unidadeOrigem === 'G' && conversao.unidadeDestino === 'UN')) {
        return;
      }

      // Se a conversão vai da unidade padrão para outra
      if (conversao.unidadeOrigem === unidadePadrao) {
        const valorNoDestino = quantidade * conversao.fatorMultiplicador;
        conversoes.push({
          unidade: conversao.unidadeDestino,
          valor: valorNoDestino,
        });
      }
      // Se a conversão vai para a unidade padrão, calculamos o inverso
      else if (conversao.unidadeDestino === unidadePadrao) {
        const valorNaOrigem = quantidade / conversao.fatorMultiplicador;
        if (valorNaOrigem >= 1 || (valorNaOrigem > 0 && valorNaOrigem < 1)) {
          conversoes.push({
            unidade: conversao.unidadeOrigem,
            valor: valorNaOrigem,
          });
        }
      }
    });
  }

  // Remove duplicatas de unidades (mantém a última conversão calculada)
  const conversoesUnicas = conversoes.filter((item, index, self) =>
    index === self.findIndex((t) => t.unidade === item.unidade)
  );

  console.log('Conversões finais (sem duplicatas):', conversoesUnicas);
  console.log('=== FIM DEBUG ===');

  return conversoesUnicas;
};

/**
 * Formata o valor para exibição (arredonda para 2 casas decimais se necessário)
 */
const formatarValor = (valor: number): string => {
  if (Number.isInteger(valor)) {
    return valor.toString();
  }
  return valor.toFixed(2);
};

export function QuantidadeTooltip({ produto, quantidade, children }: QuantidadeTooltipProps) {
  const conversoes = calcularConversoes(produto, quantidade);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help border-b border-dotted border-muted-foreground hover:border-foreground transition-colors">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="bg-popover text-popover-foreground">
          <div className="space-y-1">
            <p className="font-semibold text-sm mb-2">Conversões:</p>
            {conversoes.map((conv, index) => (
              <div key={index} className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{conv.unidade}:</span>
                <span className="font-medium">{formatarValor(conv.valor)}</span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
