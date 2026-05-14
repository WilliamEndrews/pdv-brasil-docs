// src/components/OperatorBadge.tsx
import { UserRole } from "@/store/authStore";

interface OperatorBadgeProps {
  name: string;
  role: UserRole;        // ← Alterado para aceitar todos os roles
}

export default function OperatorBadge({ name, role }: OperatorBadgeProps) {
  const roleLabels: Record<UserRole, string> = {
    admin: "Administrador",
    gerente: "Gerente",
    caixa: "Caixa",
    estoque: "Estoque",
    relatorios: "Relatórios",
    visualizador: "Visualizador",
  };

  return (
    <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full border">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      <span className="font-medium">{name}</span>
      <span className="text-xs text-muted-foreground px-2.5 py-0.5 bg-muted rounded-full">
        {roleLabels[role] || role}
      </span>
    </div>
  );
}