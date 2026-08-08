import { supabase } from '@/lib/supabase';
import { subscribeTable, pushLocalUpdate } from './subscribe';
import { readCache } from '@/lib/offline/cache';
import { enqueueOutbox, registerOutboxHandler } from '@/lib/offline/outbox';
import type { CartLine, ProductDoc, SaleDoc, SaleItem } from '@/types';
import { generateId } from '@/lib/utils';

function fromRow(row: Record<string, unknown>): SaleDoc {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    dayId: row.day_id as string,
    kind: row.kind as SaleDoc['kind'],
    items: (row.items as SaleItem[]) ?? [],
    total: Number(row.total),
    receivedAmount: row.received_amount == null ? null : Number(row.received_amount),
    changeAmount: row.change_amount == null ? null : Number(row.change_amount),
    staffUid: row.staff_uid as string,
    staffName: row.staff_name as string,
    isCancelled: Boolean(row.is_cancelled),
    cancelledAt: row.cancelled_at == null ? null : Number(row.cancelled_at),
    cancelledBy: (row.cancelled_by as string) ?? null,
    cancelReason: (row.cancel_reason as string) ?? null,
    isRefunded: Boolean(row.is_refunded),
    refundedAt: row.refunded_at == null ? null : Number(row.refunded_at),
    refundedBy: (row.refunded_by as string) ?? null,
    refundReason: (row.refund_reason as string) ?? null,
    note: (row.note as string) ?? '',
    createdAt: Number(row.created_at),
  };
}

export function subscribeSales(eventId: string, onData: (items: SaleDoc[]) => void): () => void {
  return subscribeTable({
    table: 'sales',
    filter: `event_id=eq.${eventId}`,
    cacheKey: `sales:${eventId}`,
    onData,
    fetch: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(fromRow);
    },
  });
}

interface RpcSaleItem {
  productId: string;
  quantity: number;
}
interface SubmitSalePayload {
  p_event_id: string;
  p_day_id: string;
  p_kind: 'sale' | 'loss';
  p_items: RpcSaleItem[];
  p_received_amount: number | null;
  p_note: string;
}

function isLikelyOffline(error: unknown): boolean {
  if (!navigator.onLine) return true;
  const message = (error as { message?: string })?.message ?? '';
  return /fetch|network|failed to fetch|timeout/i.test(message);
}

/**
 * 会計・ロス登録を行う。
 * オンライン時は Postgres の submit_sale 関数（1トランザクションで在庫チェック＋減算＋記録）を呼ぶ。
 * オフライン時は端末内のキャッシュを使って楽観的に処理し、画面には即座に反映した上で、
 * 再接続後に自動的にサーバーへ再送する（IndexedDBの outbox キューを使用）。
 */
export async function submitSale(params: {
  eventId: string;
  dayId: string;
  kind: 'sale' | 'loss';
  lines: CartLine[];
  receivedAmount: number | null;
  staffUid: string;
  staffName: string;
  note?: string;
}): Promise<string> {
  if (params.lines.length === 0) throw new Error('カートが空です');

  const payload: SubmitSalePayload = {
    p_event_id: params.eventId,
    p_day_id: params.dayId,
    p_kind: params.kind,
    p_items: params.lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
    p_received_amount: params.receivedAmount,
    p_note: params.note ?? '',
  };

  if (!navigator.onLine) {
    return submitSaleOffline(params, payload);
  }

  const { data, error } = await supabase.rpc('submit_sale', payload);
  if (error) {
    if (isLikelyOffline(error)) return submitSaleOffline(params, payload);
    throw new Error(error.message);
  }
  return (data as { id: string }).id;
}

async function submitSaleOffline(
  params: { eventId: string; dayId: string; kind: 'sale' | 'loss'; lines: CartLine[]; receivedAmount: number | null; staffUid: string; staffName: string },
  payload: SubmitSalePayload,
): Promise<string> {
  const products = (await readCache<ProductDoc[]>(`products:${params.eventId}`)) ?? [];
  const productMap = new Map(products.map((p) => [p.id, p]));

  const items: SaleItem[] = [];
  for (const line of params.lines) {
    const product = productMap.get(line.product.id);
    if (!product) throw new Error(`商品が見つかりません（オフライン中）: ${line.product.name}`);
    if (product.currentStock < line.quantity) {
      throw new Error(`在庫が不足しています: ${product.name}（残り${product.currentStock}個）`);
    }
    items.push({
      productId: product.id,
      productName: product.name,
      categoryId: product.categoryId,
      unitPrice: product.price,
      quantity: line.quantity,
      subtotal: params.kind === 'loss' ? 0 : product.price * line.quantity,
    });
  }

  const updatedProducts = products.map((p) => {
    const line = params.lines.find((l) => l.product.id === p.id);
    return line ? { ...p, currentStock: p.currentStock - line.quantity } : p;
  });
  await pushLocalUpdate(`products:${params.eventId}`, updatedProducts);

  const total = items.reduce((s, i) => s + i.subtotal, 0);
  const saleId = generateId();
  const sale: SaleDoc = {
    id: saleId,
    eventId: params.eventId,
    dayId: params.dayId,
    kind: params.kind,
    items,
    total,
    receivedAmount: params.kind === 'sale' ? params.receivedAmount : null,
    changeAmount:
      params.kind === 'sale' && params.receivedAmount != null && params.receivedAmount >= total
        ? params.receivedAmount - total
        : null,
    staffUid: params.staffUid,
    staffName: params.staffName,
    isCancelled: false,
    cancelledAt: null,
    cancelledBy: null,
    cancelReason: null,
    isRefunded: false,
    refundedAt: null,
    refundedBy: null,
    refundReason: null,
    note: '',
    createdAt: Date.now(),
  };

  const existingSales = (await readCache<SaleDoc[]>(`sales:${params.eventId}`)) ?? [];
  await pushLocalUpdate(`sales:${params.eventId}`, [sale, ...existingSales]);

  await enqueueOutbox('submitSale', payload);
  return saleId;
}

// オンライン復帰時にキューを実際にサーバーへ再送するハンドラーを登録
registerOutboxHandler('submitSale', async (rawPayload) => {
  const { error } = await supabase.rpc('submit_sale', rawPayload as SubmitSalePayload);
  if (error) throw new Error(error.message);
});

/** 会計の取消（管理者のみ）。オフライン時は実行できない（要ネット接続）。
 *  監査ログはサーバー側の cancel_sale 関数内で記録される。 */
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

/** 返金の記録（管理者のみ）。オフライン時は実行できない（要ネット接続）。
 *  監査ログはサーバー側の refund_sale 関数内で記録される。 */
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
