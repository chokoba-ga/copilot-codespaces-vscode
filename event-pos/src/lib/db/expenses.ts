import { supabase } from '@/lib/supabase';
import { subscribeTable } from './subscribe';
import { writeAuditLog } from './auditLog';
import { enqueueOutbox, registerOutboxHandler } from '@/lib/offline/outbox';
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
    eventId,
    cacheKey: `expenses:${eventId}`,
    fromRow,
    orderBy: { column: 'created_at', ascending: false },
    onData,
  });
}

function isLikelyOffline(error: unknown): boolean {
  const msg = (error as { message?: string })?.message ?? String(error);
  return /fetch|network|failed to fetch|offline/i.test(msg);
}

interface UpsertExpensePayload {
  id: string;
  eventId: string;
  dayId: string | null;
  date: string;
  amount: number;
  category: ExpenseDoc['category'];
  description: string;
  staffUid: string;
  staffName: string;
  note: string;
  createdAt: number;
  isNew: boolean;
}

export async function upsertExpense(
  eventId: string,
  expense: Partial<ExpenseDoc> & Pick<ExpenseDoc, 'date' | 'amount' | 'category' | 'description'>,
  actor: { uid: string; name: string },
): Promise<string> {
  const isNew = !expense.id;
  const id = expense.id ?? generateId();
  const now = Date.now();
  const payload: UpsertExpensePayload = {
    id,
    eventId,
    dayId: expense.dayId ?? null,
    date: expense.date,
    amount: expense.amount,
    category: expense.category,
    description: expense.description,
    staffUid: expense.staffUid ?? actor.uid,
    staffName: expense.staffName ?? actor.name,
    note: expense.note ?? '',
    createdAt: expense.createdAt ?? now,
    isNew,
  };

  try {
    await callUpsertExpense(payload);
  } catch (e) {
    if (isLikelyOffline(e)) {
      await enqueueOutbox('createExpense', payload);
      return id;
    }
    throw e;
  }

  await writeAuditLog({
    eventId,
    action: isNew ? 'expense.create' : 'expense.update',
    targetId: id,
    actorUid: actor.uid,
    actorName: actor.name,
    detail: `支出「${expense.description}」（${expense.amount}円）を${isNew ? '登録' : '更新'}`,
  });
  return id;
}

async function callUpsertExpense(payload: UpsertExpensePayload): Promise<void> {
  const { error } = await supabase.from('expenses').upsert({
    id: payload.id,
    event_id: payload.eventId,
    day_id: payload.dayId,
    date: payload.date,
    amount: payload.amount,
    category: payload.category,
    description: payload.description,
    staff_uid: payload.staffUid,
    staff_name: payload.staffName,
    note: payload.note,
    created_at: payload.createdAt,
    updated_at: Date.now(),
  });
  if (error) throw new Error(error.message);
}

registerOutboxHandler('createExpense', async (payload) => {
  await callUpsertExpense(payload as UpsertExpensePayload);
});

export async function deleteExpense(
  eventId: string,
  expenseId: string,
  description: string,
  actor: { uid: string; name: string },
): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    eventId,
    action: 'expense.delete',
    targetId: expenseId,
    actorUid: actor.uid,
    actorName: actor.name,
    detail: `支出「${description}」を削除`,
  });
}
