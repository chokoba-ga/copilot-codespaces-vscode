import { offlineDb } from './db';

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const entry = await offlineDb.cache.get(key);
    return (entry?.data as T) ?? null;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    await offlineDb.cache.put({ key, data, updatedAt: Date.now() });
  } catch {
    // キャッシュ書き込みの失敗はアプリの致命的エラーにしない
  }
}
