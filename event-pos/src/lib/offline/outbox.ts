import { offlineDb, type OutboxEntry } from './db';
import { generateId } from '@/lib/utils';

type Handler = (payload: unknown) => Promise<void>;
const handlers = new Map<OutboxEntry['kind'], Handler>();

export function registerOutboxHandler(kind: OutboxEntry['kind'], handler: Handler): void {
  handlers.set(kind, handler);
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

export async function flushOutbox(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    const entries = await offlineDb.outbox.orderBy('createdAt').toArray();
    for (const entry of entries) {
      const handler = handlers.get(entry.kind);
      if (!handler) continue;
      try {
        await handler(entry.payload);
        await offlineDb.outbox.delete(entry.id);
      } catch (e) {
        console.error('[outbox] failed to flush entry, will retry later', entry, e);
        break;
      }
    }
  } finally {
    flushing = false;
  }
}
