import { supabase } from '@/lib/supabase';
import { readCache, writeCache } from '@/lib/offline/cache';

// cacheKey ごとに、現在アクティブな購読コールバックを保持しておき、
// オフライン時の楽観的更新（pushLocalUpdate）を即座にUIへ反映できるようにする。
const listeners = new Map<string, Set<(items: unknown[]) => void>>();

/**
 * オフライン時などにサーバーへ問い合わせず、ローカルの最新状態を直接
 * すべての購読者へ配信する（会計のオフライン楽観更新に使用）。
 */
export async function pushLocalUpdate<T>(cacheKey: string, items: T[]): Promise<void> {
  await writeCache(cacheKey, items);
  const set = listeners.get(cacheKey);
  set?.forEach((fn) => fn(items as unknown[]));
}

/**
 * テーブルの変更をリアルタイム購読し、変更があれば全件を再取得してコールバックに渡す。
 * Firestoreの onSnapshot ほど厳密な差分検知ではないが、学校イベント規模のデータ量
 * （数百〜数千件程度）であれば実用上十分高速かつ、実装がシンプルで壊れにくい。
 *
 * - 購読開始時、まずIndexedDBのキャッシュがあれば即座に表示する（オフライン対応）。
 * - 取得に成功するたびキャッシュを更新する。
 * - オフライン等で取得が失敗しても、直前のキャッシュ表示を維持する。
 */
export function subscribeTable<T>(params: {
  table: string;
  filter: string; // Supabase Realtimeのfilter文字列。例: `event_id=eq.${eventId}`。空文字なら全件対象。
  cacheKey: string;
  fetch: () => Promise<T[]>;
  onData: (items: T[]) => void;
}): () => void {
  let cancelled = false;

  const wrappedOnData = (items: unknown[]) => params.onData(items as T[]);
  if (!listeners.has(params.cacheKey)) listeners.set(params.cacheKey, new Set());
  listeners.get(params.cacheKey)!.add(wrappedOnData);

  void readCache<T[]>(params.cacheKey).then((cached) => {
    if (cached && !cancelled) params.onData(cached);
  });

  const refetch = async () => {
    try {
      const items = await params.fetch();
      if (cancelled) return;
      params.onData(items);
      void writeCache(params.cacheKey, items);
    } catch (e) {
      console.warn(`[subscribeTable:${params.table}] fetch failed (offline?)`, e);
    }
  };

  void refetch();

  const changeConfig: { event: '*'; schema: 'public'; table: string; filter?: string } = {
    event: '*',
    schema: 'public',
    table: params.table,
  };
  if (params.filter) changeConfig.filter = params.filter;

  const channel = supabase
    .channel(`rt:${params.table}:${params.filter || 'all'}`)
    .on('postgres_changes', changeConfig, () => void refetch())
    .subscribe();

  return () => {
    cancelled = true;
    listeners.get(params.cacheKey)?.delete(wrappedOnData);
    void supabase.removeChannel(channel);
  };
}
