import { useEffect, useState } from 'react';
import type { AppUser, UserRole } from '@/types';
import { subscribeUsers, updateUserRole } from '@/lib/db/users';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { Card } from '@/components/common';

const ROLE_LABEL: Record<UserRole, string> = { admin: '管理者', staff: 'スタッフ', viewer: '閲覧者' };

export function StaffManager() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const currentUid = useAuthStore((s) => s.authUser?.id);
  const showToast = useUiStore((s) => s.showToast);

  useEffect(() => subscribeUsers(setUsers), []);

  const handleChangeRole = async (uid: string, role: UserRole) => {
    try {
      await updateUserRole(uid, role);
      showToast('権限を変更しました', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : '変更に失敗しました', 'error');
    }
  };

  return (
    <Card className="p-4">
      <p className="mb-1 text-sm font-black text-neutral-700 dark:text-neutral-200">メンバー・権限管理</p>
      <p className="mb-3 text-xs font-semibold text-neutral-400">
        管理者：すべて操作可能／スタッフ：販売・支出登録・履歴閲覧／閲覧者：閲覧のみ
      </p>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.uid} className="flex items-center gap-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-neutral-700 dark:text-neutral-200">
                {u.displayName}
                {u.uid === currentUid && <span className="ml-1 text-[11px] text-neutral-400">（自分）</span>}
              </p>
              <p className="truncate text-xs text-neutral-400">{u.email}</p>
            </div>
            <select
              value={u.role}
              onChange={(e) => handleChangeRole(u.uid, e.target.value as UserRole)}
              disabled={u.uid === currentUid}
              className="h-9 rounded-xl border border-neutral-200 bg-white px-2.5 text-xs font-bold disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-900"
            >
              {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </Card>
  );
}
