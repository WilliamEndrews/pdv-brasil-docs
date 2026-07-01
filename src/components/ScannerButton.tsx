import React from 'react';
import { Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScannerButtonProps {
  onClick: () => void;
  label?: string;
}

export function ScannerButton({ onClick, label = "Scanner" }: ScannerButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-2xl z-50 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
      title={label}
    >
      <Scan className="w-8 h-8" />
    </Button>
  );
}
