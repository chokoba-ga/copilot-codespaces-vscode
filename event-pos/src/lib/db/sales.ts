import { supabase } from '@/lib/supabase';
import { subscribeTable } from './subscribe';
import { enqueueOutbox, registerOutboxHandler } from '@/lib/offline/outbox';
import type { CartLine, SaleDoc, SaleItem } from '@/types';

function fromRow(row: Record<string, unknown>): SaleDoc {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    dayId: row.day_id as string,
    kind: row.kind as SaleDoc['kind'],
    items: (row.items as SaleItem[]) ?? [],
    total: Number(row.total),
    receivedAmount: row.received_amount != null ? Number(row.received_amount) : null,
    changeAmount: row.change_amount != null ? Number(row.change_amount) : null,
    staffUid: row.staff_uid as string,
    staffName: row.staff_name as string,
    isCancelled: Boolean(row.is_cancelled),
    cancelledAt: row.cancelled_at != null ? Number(row.cancelled_at) : null,
    cancelledBy: (row.cancelled_by as string) ?? null,
    cancelReason: (row.cancel_reason as string) ?? null,
    isRefunded: Boolean(row.is_refunded),
    refundedAt: row.refunded_at != null ? Number(row.refunded_at) : null,
    refundedBy: (row.refunded_by as string) ?? null,
    refundReason: (row.refund_reason as string) ?? null,
    note: (row.note as string) ?? '',
    createdAt: Number(row.created_at),
  };
}

export function subscribeSales(eventId: string, onData: (items: SaleDoc[]) => void): () => void {
  return subscribeTable({
    table: 'sales',
    eventId,
    cacheKey: `sales:${eventId}`,
    fromRow,
    orderBy: { column: 'created_at', ascending: false },
    onData,
  });
}

function isLikelyOffline(error: unknown): boolean {
  const msg = (error as { message?: string })?.message ?? String(error);
  return /fetch|network|failed to fetch|offline/i.test(msg);
}

interface SubmitSalePayload {
  eventId: string;
  dayId: string;
  kind: 'sale' | 'loss';
  items: { productId: string; productName: string; categoryId: string | null; unitPrice: number; quantity: number }[];
  receivedAmount: number | null;
  staffUid: string;
  staffName: string;
  note?: string;
}

export async function submitSale(params: {
  eventId: string;
  dayId: string;
  kind: 'sale' | 'loss';
  lines: CartLine[];
  receivedAmount: number | null;
  staffUid: string;
  staffName: string;
  note?: string;
}): Promise<void> {
  if (params.lines.length === 0) throw new Error('カートが空です');

  const payload: SubmitSalePayload = {
    eventId: params.eventId,
    dayId: params.dayId,
    kind: params.kind,
    items: params.lines.map((l) => ({
      productId: l.product.id,
      productName: l.product.name,
      categoryId: l.product.categoryId,
      unitPrice: l.product.price,
      quantity: l.quantity,
    })),
    receivedAmount: params.receivedAmount,
    staffUid: params.staffUid,
    staffName: params.staffName,
    note: params.note,
  };

  try {
    await callSubmitSaleRpc(payload);
  } catch (e) {
    if (isLikelyOffline(e)) {
      await enqueueOutbox('submitSale', payload);
      return;
    }
    throw e;
  }
}

async function callSubmitSaleRpc(payload: SubmitSalePayload): Promise<void> {
  const { error } = await supabase.rpc('submit_sale', {
    p_event_id: payload.eventId,
    p_day_id: payload.dayId,
    p_kind: payload.kind,
    p_items: payload.items,
    p_received_amount: payload.receivedAmount,
    p_note: payload.note ?? '',
  });
  if (error) throw new Error(error.message);
}

registerOutboxHandler('submitSale', async (payload) => {
  await callSubmitSaleRpc(payload as SubmitSalePayload);
});

export async function cancelSale(
  eventId: string,
  saleId: string,
  actor: { uid: string; name: string },
  reason: string,
): Promise<void> {
  void eventId;
  void actor;
  const { error } = await supabase.rpc('cancel_sale', { p_sale_id: saleId, p_reason: reason });
  if (error) {
    if (isLikelyOffline(error)) {
      throw new Error('オフラインのため取消できません。ネット接続後にもう一度お試しください。');
    }
    throw new Error(error.message);
  }
}

export async function refundSale(
  eventId: string,
  saleId: string,
  actor: { uid: string; name: string },
  reason: string,
): Promise<void> {
  void eventId;
  void actor;
  const { error } = await supabase.rpc('refund_sale', { p_sale_id: saleId, p_reason: reason });
  if (error) {
    if (isLikelyOffline(error)) {
      throw new Error('オフラインのため返金処理できません。ネット接続後にもう一度お試しください。');
    }
    throw new Error(error.message);
  }
}
