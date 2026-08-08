import { supabase } from '@/lib/supabase';
import { subscribeTable } from './subscribe';
import type { AppUser, UserRole } from '@/types';

function fromRow(row: Record<string, unknown>): AppUser {
  return {
    uid: row.id as string,
    email: row.email as string,
    displayName: row.display_name as string,
    role: row.role as UserRole,
    createdAt: Number(row.created_at),
  };
}

/**
 * プロフィール行は、アカウント作成（Supabase Authでの新規ユーザー登録）と同時に
 * データベース側のトリガーが自動作成する（常に role: 'viewer' で作成される）。
 * そのため、クライアント側で作成処理を行う必要はない。
 */
export async function getUser(uid: string): Promise<AppUser | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
  if (error || !data) return null;
  return fromRow(data);
}

/** アカウント作成直後はトリガー実行に一瞬のタイムラグがありうるため、軽くリトライする */
export async function getUserWithRetry(uid: string, attempts = 3): Promise<AppUser | null> {
  for (let i = 0; i < attempts; i++) {
    const user = await getUser(uid);
    if (user) return user;
    await new Promise((r) => setTimeout(r, 400));
  }
  return null;
}

export function subscribeUsers(onData: (users: AppUser[]) => void): () => void {
  return subscribeTable({
    table: 'profiles',
    filter: '',
    cacheKey: 'profiles',
    onData,
    fetch: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(fromRow);
    },
  });
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', uid);
  if (error) throw new Error(error.message);
}

export async function updateDisplayName(uid: string, displayName: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ display_name: displayName }).eq('id', uid);
  if (error) throw new Error(error.message);
}
