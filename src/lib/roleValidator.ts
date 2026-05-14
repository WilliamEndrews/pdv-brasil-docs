// src/lib/roleValidator.ts
import { UserRole } from "@/types/user";

export const getRoleFromId = (id: string): UserRole | null => {
  if (!id.startsWith("PDV-")) return null;

  if (id.includes("-ADMIN-")) return "admin";
  if (id.includes("-GER-")) return "gerente";
  if (id.includes("-OP-")) return "operador";
  if (id.includes("-CX-")) return "caixa";

  return null;
};