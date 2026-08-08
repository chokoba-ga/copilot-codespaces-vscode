import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Wallet } from 'lucide-react';
import type { EventDoc, ExpenseDoc } from '@/types';
import { useExpenseStore } from '@/stores/expenseStore';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { upsertExpense, deleteExpense } from '@/lib/db/expenses';
import { Button, SearchInput, EmptyState, StatCard, ConfirmDialog } from '@/components/common';
import { RoleGuard } from '@/components/layout';
import { ExpenseFormModal } from '@/components/expenses/ExpenseFormModal';
import { ExpenseTable } from '@/components/expenses/ExpenseTable';
import { formatYen } from '@/lib/utils';

export function ExpensesPage() {
  const { event } = useOutletContext<{ event: EventDoc | null }>();
  const expenses = useExpenseStore((s) => s.expenses);
  const appUser = useAuthStore((s) => s.appUser);
  const showToast = useUiStore((s) => s.showToast);

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExpenseDoc | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses
      .filter((e) => !q || e.description.toLowerCase().includes(q) || e.category.includes(q))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [expenses, search]);

  const total = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  if (!event || !appUser) return null;
  const actor = { uid: appUser.uid, name: appUser.displayName };

  const handleSubmit = async (data: Parameters<typeof upsertExpense>[1]) => {
    try {
      await upsertExpense(event.id, { ...data, id: editTarget?.id }, actor);
      showToast(editTarget ? '支出を更新しました' : '支出を登録しました', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : '保存に失敗しました', 'error');
      throw e;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteExpense(event.id, deleteTarget.id, deleteTarget.description, actor);
      showToast('支出を削除しました', 'success');
      setDeleteTarget(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : '削除に失敗しました', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3 px-4 pb-8 pt-3">
      <StatCard label="総支出" value={formatYen(total)} />

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="内容・カテゴリで検索" />
        </div>
        <RoleGuard roles={['admin', 'staff']}>
          <Button
            size="sm"
            onClick={() => {
              setEditTarget(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} /> 登録
          </Button>
        </RoleGuard>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Wallet size={26} />} title="支出の記録がありません" />
      ) : (
        <ExpenseTable
          expenses={filtered}
          onEdit={(e) => {
            setEditTarget(e);
            setFormOpen(true);
          }}
          onDelete={setDeleteTarget}
        />
      )}

      <ExpenseFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initial={editTarget}
        days={event.days}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="支出を削除しますか？"
        description={`「${deleteTarget?.description}」を削除します。この操作は取り消せません。`}
        danger
        confirmLabel="削除する"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
