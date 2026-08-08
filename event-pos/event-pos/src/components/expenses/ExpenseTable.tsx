import type { ExpenseDoc } from '@/types';
import { Card, Badge } from '@/components/common';
import { RoleGuard } from '@/components/layout';
import { formatYen, formatDateJp } from '@/lib/utils';
import { Pencil, Trash2 } from 'lucide-react';

export function ExpenseTable({
  expenses,
  onEdit,
  onDelete,
}: {
  expenses: ExpenseDoc[];
  onEdit: (e: ExpenseDoc) => void;
  onDelete: (e: ExpenseDoc) => void;
}) {
  return (
    <div className="space-y-2.5">
      {expenses.map((e) => (
        <Card key={e.id} className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-1.5">
                <Badge tone="neutral">{e.category}</Badge>
                <span className="text-xs font-bold text-neutral-400">{formatDateJp(e.date)}</span>
              </div>
              <p className="truncate text-[14px] font-bold text-neutral-800 dark:text-neutral-100">
                {e.description}
              </p>
              {e.note && <p className="mt-0.5 text-xs text-neutral-400">{e.note}</p>}
              <p className="mt-0.5 text-xs font-semibold text-neutral-400">担当: {e.staffName}</p>
            </div>
            <span className="flex-shrink-0 text-lg font-black text-neutral-900 dark:text-neutral-50">
              -{formatYen(e.amount)}
            </span>
          </div>
          <RoleGuard roles={['admin', 'staff']}>
            <div className="mt-2.5 flex gap-2 border-t border-neutral-100 pt-2.5 dark:border-neutral-800">
              <button
                onClick={() => onEdit(e)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <Pencil size={13} /> 編集
              </button>
              <button
                onClick={() => onDelete(e)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 size={13} /> 削除
              </button>
            </div>
          </RoleGuard>
        </Card>
      ))}
    </div>
  );
}
