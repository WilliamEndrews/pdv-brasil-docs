// src/lib/idGenerator.ts
// Gera ID único no formato: PDV-ADMIN-000001
// Contadores mantidos em memória (futuro: banco)

type RolePrefix = {
  admin: "ADMIN";
  gerente: "GER";
  operador: "OP";
  caixa: "CX";
};

const prefix: RolePrefix = {
  admin: "ADMIN",
  gerente: "GER",
  operador: "OP",
  caixa: "CX",
};

// Contadores (em produção: salvar no banco)
const counters: Record<keyof RolePrefix, number> = {
  admin: 0,
  gerente: 0,
  operador: 0,
  caixa: 0,
};

export const generateCollaboratorId = (role: keyof RolePrefix): string => {
  counters[role]++;
  const padded = counters[role].toString().padStart(6, "0");
  return `PDV-${prefix[role]}-${padded}`;
};