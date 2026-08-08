import { supabase } from '@/lib/supabase';
import { subscribeTable, pushLocalUpdate } from './subscribe';
import { readCache } from '@/lib/offline/cache';
import { enqueueOutbox, registerOutboxHandler } from '@/lib/offline/outbox';
import { writeAuditLog } from './auditLog';
import type { ExpenseDoc } from '@/types';
import { generateId } from '@/lib/utils';

function fromRow(row: Record<string, unknown>): ExpenseDoc {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    dayId: (row.day_id as string) ?? null,
    date: row.date as string,
    amount: Number(row.amount),
    category: row.category as ExpenseDoc['category'],
    description: row.description as string,
    staffUid: row.staff_uid as string,
    staffName: row.staff_name as string,
    note: (row.note as string) ?? '',
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export function subscribeExpenses(eventId: string, onData: (items: ExpenseDoc[]) => void): () => void {
  return subscribeTable({
    table: 'expenses',
    filter: `event_id=eq.${eventId}`,
    cacheKey: `expenses:${eventId}`,
    onData,
    fetch: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(fromRow);
    },
  });
}

type NewExpenseInput = Partial<ExpenseDoc> & Pick<ExpenseDoc, 'date' | 'amount' | 'category' | 'description'>;

function isLikelyOffline(error: unknown): boolean {
  if (!navigator.onLine) return true;
  const message = (error as { message?: string })?.message ?? '';
  return /fetch|network|failed to fetch|timeout/i.test(message);
}

export async function upsertExpense(
  eventId: string,
  expense: NewExpenseInput,
  actor: { uid: string; name: string },
): Promise<string> {
  // 編集の場合は接続が必要（新規登録のみオフライン対応）
  if (expense.id) {
    const { error } = await supabase
      .from('expenses')
      .update({
        date: expense.date,
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        note: expense.note ?? '',
        day_id: expense.dayId ?? null,
        updated_at: Date.now(),
      })
      .eq('id', expense.id);
    if (error) throw new Error(isLikelyOffline(error) ? 'オフラインのため編集できません。ネット接続後にお試しください。' : error.message);
    await writeAuditLog({
      eventId,
      action: 'expense.update',
      targetId: expense.id,
      actorUid: actor.uid,
      actorName: actor.name,
      detail: `支出「${expense.description}」（${expense.amount}円）を更新`,
    });
    return expense.id;
  }

  const row = {
    event_id: eventId,
    day_id: expense.dayId ?? null,
    date: expense.date,
    amount: expense.amount,
    category: expense.category,
    description: expense.description,
    staff_uid: actor.uid,
    staff_name: actor.name,
    note: expense.note ?? '',
  };

  if (!navigator.onLine) {
    return createExpenseOffline(eventId, row);
  }

  const { data, error } = await supabase.from('expenses').insert(row).select('id').single();
  if (error) {
    if (isLikelyOffline(error)) return createExpenseOffline(eventId, row);
    throw new Error(error.message);
  }
  await writeAuditLog({
    eventId,
    action: 'expense.create',
    targetId: data.id,
    actorUid: actor.uid,
    actorName: actor.name,
    detail: `支出「${expense.description}」（${expense.amount}円）を登録`,
  });
  return data.id;
}

async function createExpenseOffline(eventId: string, row: Record<string, unknown>): Promise<string> {
  const id = generateId();
  const now = Date.now();
  const optimistic: ExpenseDoc = {
    id,
    eventId,
    dayId: (row.day_id as string) ?? null,
    date: row.date as string,
    amount: row.amount as number,
    category: row.category as ExpenseDoc['category'],
    description: row.description as string,
    staffUid: row.staff_uid as string,
    staffName: row.staff_name as string,
    note: (row.note as string) ?? '',
    createdAt: now,
    updatedAt: now,
  };
  const existing = (await readCache<ExpenseDoc[]>(`expenses:${eventId}`)) ?? [];
  await pushLocalUpdate(`expenses:${eventId}`, [optimistic, ...existing]);
  await enqueueOutbox('createExpense', row);
  return id;
}

registerOutboxHandler('createExpense', async (payload) => {
  const { error } = await supabase.from('expenses').insert(payload as Record<string, unknown>);
  if (error) throw new Error(error.message);
});

export async function deleteExpense(
  eventId: string,
  expenseId: string,
  description: string,
  actor: { uid: string; name: string },
): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
  if (error) throw new Error(isLikelyOffline(error) ? 'オフラインのため削除できません。ネット接続後にお試しください。' : error.message);
  await writeAuditLog({
    eventId,
    action: 'expense.delete',
    targetId: expenseId,
    actorUid: actor.uid,
    actorName: actor.name,
    detail: `支出「${description}」を削除`,
  });
}
