import { offlineDb } from './db';
import type { OutboxEntry } from './db';
import { generateId } from '@/lib/utils';

type OutboxHandler = (payload: unknown) => Promise<void>;

const handlers: Partial<Record<OutboxEntry['kind'], OutboxHandler>> = {};

/**
 * 各データ層（sales.ts, expenses.ts）が、実際にオンライン時に行う処理を
 * 起動時に登録しておく。循環importを避けるための登録パターン。
 */
export function registerOutboxHandler(kind: OutboxEntry['kind'], handler: OutboxHandler): void {
  handlers[kind] = handler;
}

export async function enqueueOutbox(kind: OutboxEntry['kind'], payload: unknown): Promise<void> {
  await offlineDb.outbox.put({ id: generateId(), kind, payload, createdAt: Date.now() });
}

export async function pendingOutboxCount(): Promise<number> {
  try {
    return await offlineDb.outbox.count();
  } catch {
    return 0;
  }
}

let flushing = false;

/**
 * オンライン復帰時に呼び出す。キューを古い順に1件ずつ確実に再送する
 * （並び順を保つため、Promise.allではなく直列に処理する）。
 */
export async function flushOutbox(onFlushed?: () => void): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    const entries = await offlineDb.outbox.orderBy('createdAt').toArray();
    for (const entry of entries) {
      const handler = handlers[entry.kind];
      if (!handler) continue;
      try {
        await handler(entry.payload);
        await offlineDb.outbox.delete(entry.id);
        onFlushed?.();
      } catch (e) {
        console.error('[outbox] failed to replay entry, will retry later', entry, e);
        // 1件失敗したら、順序を保つためそれ以降はいったん中断し次回オンライン時に再試行
        break;
      }
    }
  } finally {
    flushing = false;
  }
}
