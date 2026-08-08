import Dexie, { type Table } from 'dexie';

export interface CacheEntry {
  key: string;
  data: unknown;
  updatedAt: number;
}

/** オフライン中に発生した書き込みを、再接続後に再送するためのキュー */
export interface OutboxEntry {
  id: string;
  kind: 'submitSale' | 'createExpense';
  payload: unknown;
  createdAt: number;
}

class OfflineDatabase extends Dexie {
  cache!: Table<CacheEntry, string>;
  outbox!: Table<OutboxEntry, string>;

  constructor() {
    super('event-pos-offline');
    this.version(1).stores({
      cache: 'key',
      outbox: 'id, createdAt',
    });
  }
}

export const offlineDb = new OfflineDatabase();
