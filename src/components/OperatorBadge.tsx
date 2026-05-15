// src/components/OperatorBadge.tsx
import React from 'react';
import { useAuth, UserRole } from '@/store/authStore';

interface OperatorBadgeProps {
  role: UserRole;
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  caixa: 'Caixa',
  estoque: 'Estoquista',
  relatorios: 'Relatórios',
  operador: 'Operador',        // ← Adicionado aqui
  visualizador: 'Visualizador'
};

const roleColors: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700',
  gerente: 'bg-purple-100 text-purple-700',
  caixa: 'bg-blue-100 text-blue-700',
  estoque: 'bg-amber-100 text-amber-700',
  relatorios: 'bg-emerald-100 text-emerald-700',
  operador: 'bg-gray-100 text-gray-700',
  visualizador: 'bg-slate-100 text-slate-700'
};

export default function OperatorBadge({ role }: OperatorBadgeProps) {
  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${roleColors[role]}`}>
      {roleLabels[role]}
    </div>
  );
}