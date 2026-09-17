import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';

export function RoleGuard({ roles, children, fallback = null }: { roles: UserRole[]; children: ReactNode; fallback?: ReactNode }) {
  const hasRole = useAuthStore((s) => s.hasRole);
  return hasRole(...roles) ? <>{children}</> : <>{fallback}</>;
}
