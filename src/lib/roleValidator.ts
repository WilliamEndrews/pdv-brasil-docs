// src/lib/roleValidator.ts
import { UserRole } from "@/types/user";

export const getRoleFromId = (id: string): UserRole | null => {
  if (!id.startsWith("PDV-")) return null;

  if (id.includes("-ADMIN-")) return "admin";
  if (id.includes("-GER-")) return "gerente";
  if (id.includes("-CAI-")) return "caixa";
  if (id.includes("-EST-")) return "estoque";
  if (id.includes("-REL-")) return "relatorios";
  if (id.includes("-OPE-")) return "operador";
  if (id.includes("-VIS-")) return "visualizador";

  return null;
};