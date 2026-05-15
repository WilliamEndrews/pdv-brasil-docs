// src/types/user.ts
export type UserRole = 
  | 'admin' 
  | 'gerente' 
  | 'caixa' 
  | 'estoque' 
  | 'relatorios' 
  | 'operador'
  | 'visualizador';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}