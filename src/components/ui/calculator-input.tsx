// src/components/ui/calculator-input.tsx (VERSÃO FINAL, TUDO À ESQUERDA)

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const formatValue = (value: number | null): string => {
  if (value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  const floatValue = value / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(floatValue);
};

export interface CalculatorInputProps {
  value: number | null;
  onValueChange: (value: number | null) => void;
  placeholder?: string;
  className?: string;
}

const CalculatorInput = React.forwardRef<HTMLInputElement, CalculatorInputProps>(
  ({ className, value, onValueChange, placeholder }, ref) => {
    
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.preventDefault();

      if (e.key >= '0' && e.key <= '9') {
        const digit = parseInt(e.key, 10);
        const newValue = (value || 0) * 10 + digit;
        onValueChange(newValue);
      }
      else if (e.key === 'Backspace') {
        const newValue = Math.floor((value || 0) / 10);
        onValueChange(newValue === 0 ? null : newValue);
      }
      else if (e.key === 'Delete' || e.key === 'Escape') {
        onValueChange(null);
      }
    };

    return (
      <div 
        className={cn("relative w-full h-10", className)}
        onClick={() => inputRef.current?.focus()}
      >
        {/* [A CORREÇÃO] - Classes de alinhamento removidas. Agora o padrão é à esquerda. */}
        <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
            {value === null || value === 0 ? (
                <span className="text-muted-foreground">{placeholder || 'R$ 0,00'}</span>
            ) : (
                <span className="text-sm">{formatValue(value)}</span>
            )}
        </div>

        <Input
          ref={inputRef}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 bg-transparent text-transparent caret-transparent border-input"
          {...(ref ? { ref } : {})}
        />
      </div>
    );
  }
);

CalculatorInput.displayName = 'CalculatorInput';

export { CalculatorInput };
