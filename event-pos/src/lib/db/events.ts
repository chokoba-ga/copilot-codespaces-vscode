import { supabase } from '@/lib/supabase';
import { readCache, writeCache } from '@/lib/offline/cache';
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
    settings: normalizeSettings(row.settings as Partial<EventSettings> | null),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    createdBy: row.created_by as string,
    archived: Boolean(row.archived),
  };
}

/** 古いイベントデータ（subsidyAmount未設定など）でも壊れないように補完する */
function normalizeSettings(settings: Partial<EventSettings> | null): EventSettings {
  return { ...defaultEventSettings(), ...(settings ?? {}) };
}

const CACHE_KEY = 'events:list';

export function subscribeEvents(onData: (events: EventDoc[]) => void): () => void {
  let cancelled = false;

  void readCache<Record<string, unknown>[]>(CACHE_KEY).then((cached) => {
    if (cancelled || !cached) return;
    onData(cached.map(fromRow));
  });

  const fetchAll = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('archived', false)
      .order('updated_at', { ascending: false });
    if (error) {
      console.error('[subscribeEvents] fetch error', error);
      return;
    }
    if (cancelled || !data) return;
    void writeCache(CACHE_KEY, data);
    onData(data.map(fromRow));
  };

  void fetchAll();

  const channel = supabase
    .channel('events:all')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => void fetchAll())
    .subscribe();

  return () => {
    cancelled = true;
    void supabase.removeChannel(channel);
  };
}

export const defaultEventSettings = (): EventSettings => ({
  taxIncluded: true,
  organizationName: '',
  representativeName: '',
  lowStockThreshold: 5,
  themeColor: 'brand',
  subsidyAmount: 0,
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
  const now = Date.now();
  const { data, error } = await supabase
    .from('events')
    .insert({
      name: params.name,
      description: params.description,
      status: 'planning',
      days: params.days,
      settings: defaultEventSettings(),
      created_at: now,
      updated_at: now,
      created_by: params.actorUid,
      archived: false,
    })
    .select('id')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'イベントの作成に失敗しました');

  await writeAuditLog({
    eventId: data.id,
    action: 'event.create',
    targetId: data.id,
    actorUid: params.actorUid,
    actorName: params.actorName,
    detail: `イベント「${params.name}」を作成`,
  });
  return data.id as string;
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
  if (error) throw new Error(error.message);

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
  if (error) throw new Error(error.message);

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
  const { data: source, error: srcError } = await supabase
    .from('events')
    .select('*')
    .eq('id', sourceEventId)
    .single();
  if (srcError || !source) throw new Error('複製元のイベントが見つかりません');

  const now = Date.now();
  const { data: newEvent, error: insError } = await supabase
    .from('events')
    .insert({
      name: newName,
      description: source.description,
      status: 'planning',
      days: (source.days as EventDay[]).map((d) => ({ ...d, id: generateId() })),
      settings: normalizeSettings(source.settings),
      created_at: now,
      updated_at: now,
      created_by: actor.uid,
      archived: false,
    })
    .select('id')
    .single();
  if (insError || !newEvent) throw new Error(insError?.message ?? '複製に失敗しました');
  const newEventId = newEvent.id as string;

  const { data: categories } = await supabase.from('categories').select('*').eq('event_id', sourceEventId);
  const catIdMap = new Map<string, string>();
  for (const c of categories ?? []) {
    const newId = generateId();
    catIdMap.set(c.id as string, newId);
    await supabase.from('categories').insert({
      id: newId,
      event_id: newEventId,
      name: c.name,
      order: c.order,
      color: c.color,
      created_at: Date.now(),
    });
  }

  const { data: products } = await supabase.from('products').select('*').eq('event_id', sourceEventId);
  for (const p of products ?? []) {
    await supabase.from('products').insert({
      event_id: newEventId,
      name: p.name,
      category_id: p.category_id ? (catIdMap.get(p.category_id as string) ?? null) : null,
      price: p.price,
      cost: p.cost,
      initial_stock: p.initial_stock,
      current_stock: p.initial_stock,
      description: p.description,
      image_url: p.image_url,
      order: p.order,
      is_active: p.is_active,
      created_at: Date.now(),
      updated_at: Date.now(),
    });
  }

  await writeAuditLog({
    eventId: newEventId,
    action: 'event.duplicate',
    targetId: newEventId,
    actorUid: actor.uid,
    actorName: actor.name,
    detail: `「${source.name}」から複製して作成`,
  });

  return newEventId;
}
