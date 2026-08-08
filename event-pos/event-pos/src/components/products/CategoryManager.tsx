import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { ProductCategoryDoc } from '@/types';
import { upsertCategory, deleteCategory } from '@/lib/db/products';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

export function CategoryManager({ eventId, categories }: { eventId: string; categories: ProductCategoryDoc[] }) {
  const [newName, setNewName] = useState('');
  const appUser = useAuthStore((s) => s.appUser);
  const showToast = useUiStore((s) => s.showToast);

  const handleAdd = async () => {
    if (!newName.trim() || !appUser) return;
    try {
      await upsertCategory(
        eventId,
        { name: newName.trim(), order: categories.length },
        { uid: appUser.uid, name: appUser.displayName },
      );
      setNewName('');
    } catch (e) {
      showToast(e instanceof Error ? e.message : '追加に失敗しました', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(eventId, id);
    } catch (e) {
      showToast(e instanceof Error ? e.message : '削除に失敗しました', 'error');
    }
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {categories.map((c) => (
          <span
            key={c.id}
            className="flex items-center gap-1.5 rounded-full bg-neutral-100 py-1.5 pl-3 pr-1.5 text-xs font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
          >
            {c.name}
            <button
              onClick={() => handleDelete(c.id)}
              aria-label={`${c.name}を削除`}
              className="flex h-5 w-5 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="新しいカテゴリー名"
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
    </div>
  );
}
