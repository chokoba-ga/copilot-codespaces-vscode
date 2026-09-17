import { useEffect, useState } from 'react';
import { Plus, X, Users } from 'lucide-react';
import type { StaffRosterMember } from '@/types';
import { subscribeStaffRoster, addStaffRosterMember, deleteStaffRosterMember } from '@/lib/db/staffRoster';
import { useUiStore } from '@/stores/uiStore';
import { Card } from '@/components/common';

export function StaffRosterManager() {
  const [members, setMembers] = useState<StaffRosterMember[]>([]);
  const [newName, setNewName] = useState('');
  const showToast = useUiStore((s) => s.showToast);

  useEffect(() => subscribeStaffRoster(setMembers), []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await addStaffRosterMember(newName.trim(), members.length);
      setNewName('');
    } catch (e) {
      showToast(e instanceof Error ? e.message : '追加に失敗しました', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteStaffRosterMember(id);
    } catch (e) {
      showToast(e instanceof Error ? e.message : '削除に失敗しました', 'error');
    }
  };

  return (
    <Card className="p-4">
      <p className="mb-1 flex items-center gap-1.5 text-sm font-black text-neutral-700 dark:text-neutral-200">
        <Users size={15} /> よく使う名前の登録
      </p>
      <p className="mb-3 text-xs font-semibold text-neutral-400">
        ここに登録しておくと、名前入力の画面でタップするだけで名乗れるようになります（毎回入力する手間を省けます）。
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        {members.map((m) => (
          <span
            key={m.id}
            className="flex items-center gap-1.5 rounded-full bg-neutral-100 py-1.5 pl-3 pr-1.5 text-xs font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
          >
            {m.name}
            <button
              onClick={() => handleDelete(m.id)}
              aria-label={`${m.name}を削除`}
              className="flex h-5 w-5 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        {members.length === 0 && <p className="text-xs text-neutral-400">まだ登録がありません</p>}
      </div>
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="名前を入力（例：田中）"
          className="h-10 flex-1 rounded-xl border border-neutral-200 px-3 text-sm font-semibold focus:border-brand-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          onClick={handleAdd}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white"
          aria-label="追加"
        >
          <Plus size={17} />
        </button>
      </div>
    </Card>
  );
}
