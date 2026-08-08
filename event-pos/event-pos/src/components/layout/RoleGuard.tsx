import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';

/**
 * 指定ロールを持つユーザーにのみ children を表示する。
 * 例: <RoleGuard roles={['admin']}>削除ボタン</RoleGuard>
 */
export function RoleGuard({ roles, children, fallback = null }: { roles: UserRole[]; children: ReactNode; fallback?: ReactNode }) {
  const hasRole = useAuthStore((s) => s.hasRole);
  return hasRole(...roles) ? <>{children}</> : <>{fallback}</>;
}
