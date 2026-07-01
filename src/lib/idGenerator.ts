// src/lib/idGenerator.ts
// Gera ID único no formato: PDV-ADMIN-000001
// Contadores mantidos em memória (futuro: banco)
// Tipos centralizados em src/types/user.ts

import { UserRole } from "@/types/user";

const rolePrefix: Record<UserRole, string> = {
  admin: "ADMIN",
  gerente: "GER",
  caixa: "CAI",
  estoque: "EST",
  relatorios: "REL",
  operador: "OPE",
  visualizador: "VIS"
};

// Contadores (em produção: salvar no banco)
const counters: Record<UserRole, number> = {
  admin: 0,
  gerente: 0,
  caixa: 0,
  estoque: 0,
  relatorios: 0,
  operador: 0,
  visualizador: 0
};

export const generateCollaboratorId = (role: UserRole): string => {
  counters[role]++;
  const padded = counters[role].toString().padStart(6, "0");
  return `PDV-${rolePrefix[role]}-${padded}`;
};