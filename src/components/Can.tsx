// src/components/Can.tsx
import { useAuth, UserRole } from "@/store/authStore";
import { ReactNode } from "react";

interface CanProps {
  children: ReactNode;
  roles: UserRole | UserRole[];
  fallback?: ReactNode;
}

export function Can({ children, roles, fallback = null }: CanProps) {
  const { hasPermission } = useAuth();

  if (hasPermission(roles)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}