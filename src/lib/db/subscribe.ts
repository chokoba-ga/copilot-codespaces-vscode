import { supabase } from '@/lib/supabase';
import { readCache, writeCache } from '@/lib/offline/cache';

export function subscribeTable<T>(params: {
  table: string;
  eventId: string;
  cacheKey: string;
  fromRow: (row: Record<string, unknown>) => T;
  onData: (items: T[]) => void;
  orderBy?: { column: string; ascending?: boolean };
}): () => void {
  const { table, eventId, cacheKey, fromRow, onData, orderBy } = params;
  let cancelled = false;

  void readCache<Record<string, unknown>[]>(cacheKey).then((cached) => {
    if (cancelled || !cached) return;
    onData(cached.map(fromRow));
  });

  const fetchAll = async () => {
    let query = supabase.from(table).select('*').eq('event_id', eventId);
    if (orderBy) query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
    const { data, error } = await query;
    if (error) {
      console.error(`[subscribeTable:${table}] fetch error`, error);
      return;
    }
    if (cancelled || !data) return;
    void writeCache(cacheKey, data);
    onData(data.map(fromRow));
  };

  void fetchAll();

  const channel = supabase
    .channel(`${table}:${eventId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table, filter: `event_id=eq.${eventId}` },
      () => void fetchAll(),
    )
    .subscribe();

  return () => {
    cancelled = true;
    void supabase.removeChannel(channel);
  };
}
