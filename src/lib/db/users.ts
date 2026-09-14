import { supabase } from '@/lib/supabase';
import type { AppUser, UserRole } from '@/types';

function fromRow(row: Record<string, unknown>): AppUser {
  return {
    uid: row.id as string,
    email: (row.email as string) ?? '',
    displayName: (row.display_name as string) ?? '',
    role: row.role as UserRole,
    createdAt: Number(row.created_at),
  };
}

/**
 * プロフィール行は、匿名サインインを含む新規セッション作成と同時に
 * データベース側のトリガーが自動作成する（ログイン不要版では role: 'admin' で作成される。
 * 設定は supabase/no-login-migration.sql を参照）。
 *
 * 「行が存在しない（本当に削除された等）」場合は null を返し、
 * 「通信エラー（オフライン等）」の場合は例外を投げて呼び出し側で区別できるようにする。
 */
export async function getUser(uid: string): Promise<AppUser | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return fromRow(data);
}

/**
 * アカウント作成直後はトリガー実行に一瞬のタイムラグがありうるため、
 * 「見つからない」場合のみ軽くリトライする。通信エラーは即座に投げる。
 */
export async function getUserWithRetry(uid: string, attempts = 3): Promise<AppUser | null> {
  for (let i = 0; i < attempts; i++) {
    const user = await getUser(uid);
    if (user) return user;
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 400));
  }
  return null;
}

export function subscribeUsers(onData: (users: AppUser[]) => void): () => void {
  let cancelled = false;

  const fetchAll = async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
    if (error) {
      console.error('[subscribeUsers] fetch error', error);
      return;
    }
    if (cancelled || !data) return;
    onData(data.map(fromRow));
  };

  void fetchAll();

  const channel = supabase
    .channel('profiles:all')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => void fetchAll())
    .subscribe();

  return () => {
    cancelled = true;
    void supabase.removeChannel(channel);
  };
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', uid);
  if (error) throw new Error(error.message);
}

export async function updateDisplayName(uid: string, displayName: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ display_name: displayName }).eq('id', uid);
  if (error) throw new Error(error.message);
}
