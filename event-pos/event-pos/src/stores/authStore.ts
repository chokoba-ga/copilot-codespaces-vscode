import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getUserWithRetry, getUser } from '@/lib/db/users';
import type { AppUser, UserRole } from '@/types';

interface AuthState {
  authUser: User | null;
  appUser: AppUser | null;
  status: 'loading' | 'signed-out' | 'signed-in';
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAppUser: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  authUser: null,
  appUser: null,
  status: 'loading',
  error: null,

  signIn: async (email, password) => {
    set({ error: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ error: mapAuthError(error.message) });
      throw error;
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ authUser: null, appUser: null, status: 'signed-out' });
  },

  refreshAppUser: async () => {
    const uid = get().authUser?.id;
    if (!uid) return;
    const appUser = await getUser(uid);
    set({ appUser });
  },

  hasRole: (...roles) => {
    const role = get().appUser?.role;
    return role != null && roles.includes(role);
  },
}));

/**
 * Supabase Auth のセッション状態を監視し、profiles テーブルの情報と同期する。
 * プロフィール行自体はDB側のトリガーで自動作成されるため、ここでは取得のみ行う。
 */
export function initAuthListener(): () => void {
  const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
    const authUser = session?.user ?? null;
    if (!authUser) {
      useAuthStore.setState({ authUser: null, appUser: null, status: 'signed-out' });
      return;
    }
    useAuthStore.setState({ authUser, status: 'loading' });
    try {
      const appUser = await getUserWithRetry(authUser.id);
      useAuthStore.setState({ appUser, status: 'signed-in' });
    } catch (e) {
      console.error('[auth] failed to load profile', e);
      // オフライン時などはキャッシュのままログイン状態を維持する
      useAuthStore.setState({ status: 'signed-in' });
    }
  });
  return () => sub.subscription.unsubscribe();
}

function mapAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'メールアドレスまたはパスワードが間違っています。';
  if (/rate limit/i.test(message)) return '試行回数が多すぎます。しばらくしてから再度お試しください。';
  if (/network/i.test(message)) return '通信エラーが発生しました。ネット接続をご確認ください。';
  return 'ログインに失敗しました。もう一度お試しください。';
}
