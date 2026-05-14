// src/components/ui/currency-input.tsx (VERSÃO FINAL, INTELIGENTE E FUNCIONAL)

import * as React from 'react';
import { NumericFormat, type NumericFormatProps } from 'react-number-format';
import { Input } from '@/components/ui/input';

// A interface agora estende as props da biblioteca, nos dando controle total
interface CurrencyInputProps extends Omit<NumericFormatProps, 'customInput'> {
  // Não precisamos de props customizadas, vamos usar as da biblioteca
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (props, ref) => {
    return (
      <NumericFormat
        // Passa todas as props recebidas para o componente
        {...props}
        
        // Aqui está a mágica: dizemos para ele usar nosso <Input /> como base
        customInput={Input}
        
        // Passa a ref para o <Input /> interno
        getInputRef={ref}
        
        // Configurações de formatação para o padrão brasileiro
        thousandSeparator="."
        decimalSeparator=","
        prefix="R$ "
        decimalScale={2}
        fixedDecimalScale={true}
        allowNegative={false}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
