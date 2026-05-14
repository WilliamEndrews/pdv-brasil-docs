// src/components/estoque/CalculatorInput.tsx (VERSÃO 3.5 - COM EXPORTAÇÃO CORRIGIDA)

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CalculatorInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
}

// [A CORREÇÃO] - A palavra 'export' foi adicionada aqui, criando uma exportação nomeada.
export function CalculatorInput({ value, onChange, placeholder, className }: CalculatorInputProps) {
  const [displayValue, setDisplayValue] = React.useState('R$ 0,00');
  const [digits, setDigits] = React.useState('');

  React.useEffect(() => {
    const initialValue = value || 0;
    const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(initialValue);
    setDisplayValue(formatted);
    setDigits(Math.round(initialValue * 100).toString());
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.key >= '0' && e.key <= '9') {
      updateValue(digits + e.key);
    }
    if (e.key === 'Backspace') {
      updateValue(digits.slice(0, -1));
    }
    if (e.key === 'Delete' || e.key === 'Clear') {
      updateValue('');
    }
  };

  const updateValue = (newDigits: string) => {
    if (newDigits.length > 12) return;
    setDigits(newDigits);
    const numericValue = parseInt(newDigits || '0', 10) / 100;
    const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericValue);
    setDisplayValue(formatted);
    onChange(numericValue);
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex h-10 w-full items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {displayValue}
    </div>
  );
}
