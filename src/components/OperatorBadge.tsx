// src/components/OperatorBadge.tsx
// Componente para exibir o cargo do usuário com badge colorido

import React from 'react';
import { UserRole } from '@/types/user';

interface OperatorBadgeProps {
  role: UserRole;
  name?: string;        // Opcional, caso queira mostrar o nome também
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  caixa: 'Caixa',
  estoque: 'Estoquista',
  relatorios: 'Relatórios',
  operador: 'Operador',
  visualizador: 'Visualizador'
};

const roleColors: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700 border-red-200',
  gerente: 'bg-purple-100 text-purple-700 border-purple-200',
  caixa: 'bg-blue-100 text-blue-700 border-blue-200',
  estoque: 'bg-amber-100 text-amber-700 border-amber-200',
  relatorios: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  operador: 'bg-gray-100 text-gray-700 border-gray-200',
  visualizador: 'bg-slate-100 text-slate-700 border-slate-200'
};

export default function OperatorBadge({ role, name }: OperatorBadgeProps) {
  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${roleColors[role]}`}>
      {roleLabels[role]}
      {name && <span className="ml-1.5 opacity-75">• {name}</span>}
    </div>
  );
}