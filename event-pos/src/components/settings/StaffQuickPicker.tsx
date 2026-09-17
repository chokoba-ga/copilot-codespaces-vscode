import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import type { StaffRosterMember } from '@/types';
import { subscribeStaffRoster } from '@/lib/db/staffRoster';

/** 事前登録されたスタッフ名を一覧表示し、タップで選べるようにする */
export function StaffQuickPicker({ onPick }: { onPick: (name: string) => void }) {
  const [members, setMembers] = useState<StaffRosterMember[]>([]);

  useEffect(() => subscribeStaffRoster(setMembers), []);

  if (members.length === 0) return null;

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-neutral-600 dark:text-neutral-300">
        <Users size={14} /> 登録済みのメンバーから選ぶ
      </p>
      <div className="flex flex-wrap gap-2">
        {members.map((m) => (
          <button
            key={m.id}
            onClick={() => onPick(m.name)}
            className="rounded-full bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-300"
          >
            {m.name}
          </button>
        ))}
      </div>
    </div>
  );
}
