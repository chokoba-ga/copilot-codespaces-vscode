import { supabase } from '@/lib/supabase';
import { subscribeTable } from './subscribe';
import { writeAuditLog } from './auditLog';
import type { EventDay, EventDoc, EventSettings } from '@/types';
import { generateId } from '@/lib/utils';

function fromRow(row: Record<string, unknown>): EventDoc {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? '',
    status: row.status as EventDoc['status'],
    days: (row.days as EventDay[]) ?? [],
    settings: (row.settings as EventSettings) ?? defaultEventSettings(),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    createdBy: row.created_by as string,
    archived: Boolean(row.archived),
  };
}

export function subscribeEvents(onData: (events: EventDoc[]) => void): () => void {
  return subscribeTable({
    table: 'events',
    filter: 'archived=eq.false',
    cacheKey: 'events',
    onData,
    fetch: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('archived', false)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(fromRow);
    },
  });
}

export const defaultEventSettings = (): EventSettings => ({
  taxIncluded: true,
  organizationName: '',
  representativeName: '',
  lowStockThreshold: 5,
  themeColor: 'brand',
});

export function makeDay(order: number, label?: string): EventDay {
  const today = new Date();
  today.setDate(today.getDate() + order);
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return { id: generateId(), label: label ?? `${order + 1}日目`, date: dateStr, order };
}

export async function createEvent(params: {
  name: string;
  description: string;
  days: EventDay[];
  actorUid: string;
  actorName: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      name: params.name,
      description: params.description,
      status: 'planning',
      days: params.days,
      settings: defaultEventSettings(),
      created_by: params.actorUid,
    })
    .select('id')
    .single();
  if (error) throw error;

  await writeAuditLog({
    eventId: data.id,
    action: 'event.create',
    targetId: data.id,
    actorUid: params.actorUid,
    actorName: params.actorName,
    detail: `イベント「${params.name}」を作成`,
  });
  return data.id;
}

export async function updateEvent(
  eventId: string,
  patch: Partial<Pick<EventDoc, 'name' | 'description' | 'status' | 'days' | 'settings'>>,
  actor: { uid: string; name: string },
): Promise<void> {
  const row: Record<string, unknown> = { updated_at: Date.now() };
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.days !== undefined) row.days = patch.days;
  if (patch.settings !== undefined) row.settings = patch.settings;

  const { error } = await supabase.from('events').update(row).eq('id', eventId);
  if (error) throw error;

  await writeAuditLog({
    eventId,
    action: 'event.update',
    targetId: eventId,
    actorUid: actor.uid,
    actorName: actor.name,
    detail: 'イベント情報を更新',
  });
}

export async function deleteEvent(eventId: string, actor: { uid: string; name: string }): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update({ archived: true, updated_at: Date.now() })
    .eq('id', eventId);
  if (error) throw error;

  await writeAuditLog({
    eventId,
    action: 'event.delete',
    targetId: eventId,
    actorUid: actor.uid,
    actorName: actor.name,
    detail: 'イベントを削除（アーカイブ）',
  });
}

/** イベント複製：商品・カテゴリー・設定のみコピーし、売上・支出・履歴はコピーしない。 */
export async function duplicateEvent(
  sourceEventId: string,
  newName: string,
  actor: { uid: string; name: string },
): Promise<string> {
  const { data: source, error: sourceErr } = await supabase
    .from('events')
    .select('*')
    .eq('id', sourceEventId)
    .single();
  if (sourceErr || !source) throw new Error('複製元のイベントが見つかりません');
  const src = fromRow(source);

  const { data: created, error: createErr } = await supabase
    .from('events')
    .insert({
      name: newName,
      description: src.description,
      status: 'planning',
      days: src.days.map((d) => ({ ...d, id: generateId() })),
      settings: src.settings,
      created_by: actor.uid,
    })
    .select('id')
    .single();
  if (createErr) throw createErr;
  const newEventId = created.id as string;

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('*').eq('event_id', sourceEventId),
    supabase.from('products').select('*').eq('event_id', sourceEventId),
  ]);

  const categoryIdMap = new Map<string, string>();
  for (const c of categories ?? []) {
    const { data: newCat, error } = await supabase
      .from('categories')
      .insert({ event_id: newEventId, name: c.name, order: c.order, color: c.color })
      .select('id')
      .single();
    if (!error && newCat) categoryIdMap.set(c.id as string, newCat.id as string);
  }

  for (const p of products ?? []) {
    await supabase.from('products').insert({
      event_id: newEventId,
      category_id: p.category_id ? (categoryIdMap.get(p.category_id as string) ?? null) : null,
      name: p.name,
      price: p.price,
      cost: p.cost,
      initial_stock: p.initial_stock,
      current_stock: p.initial_stock, // 在庫はリセット
      description: p.description,
      image_url: p.image_url,
      order: p.order,
      is_active: p.is_active,
    });
  }

  await writeAuditLog({
    eventId: newEventId,
    action: 'event.duplicate',
    targetId: newEventId,
    actorUid: actor.uid,
    actorName: actor.name,
    detail: `「${src.name}」から複製して作成`,
  });

  return newEventId;
}
