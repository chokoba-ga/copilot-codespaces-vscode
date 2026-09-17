import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getUserWithRetry, getUser, updateDisplayName } from '@/lib/db/users';
import type { AppUser, UserRole } from '@/types';

interface AuthState {
  authUser: User | null;
  appUser: AppUser | null;
  status: 'loading' | 'signed-out' | 'signed-in';
  error: string | null;
  refreshAppUser: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  setDisplayName: (name: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  authUser: null,
  appUser: null,
  status: 'loading',
  error: null,

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

  setDisplayName: async (name) => {
    const uid = get().authUser?.id;
    if (!uid || !name.trim()) return;
    await updateDisplayName(uid, name.trim());
    set((s) => (s.appUser ? { appUser: { ...s.appUser, displayName: name.trim() } } : s));
  },
}));

/**
 * ログイン画面なしで使えるようにするため、セッションが無い場合は自動的に
 * 匿名サインインを行う。同時に複数回呼ばれても匿名アカウントが二重に
 * 作られないようガードする（実際に発生した不具合の再発防止）。
 */
let signingInAnonymously = false;

async function trySignInAnonymously(): Promise<void> {
  if (signingInAnonymously) return;
  signingInAnonymously = true;
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) return;

    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('[auth] anonymous sign-in failed', error);
      useAuthStore.setState({
        status: 'signed-out',
        error:
          'サーバーに接続できませんでした。Supabaseで「Allow anonymous sign-ins」が有効か、通信環境をご確認ください。',
      });
    }
  } finally {
    signingInAnonymously = false;
  }
}

export function initAuthListener(): () => void {
  const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
    const authUser = session?.user ?? null;
    if (!authUser) {
      useAuthStore.setState({ authUser: null, appUser: null, status: 'loading' });
      void trySignInAnonymously();
      return;
    }
    useAuthStore.setState({ authUser, status: 'loading' });
    try {
      const appUser = await getUserWithRetry(authUser.id);
      if (!appUser) {
        // セッションはあるがprofile行が無い（手動削除など）場合、
        // 永久に読み込み中になってしまうのを防ぐため、サインアウトして作り直す。
        console.warn('[auth] profile not found for existing session, recreating session');
        await supabase.auth.signOut();
        return;
      }
      useAuthStore.setState({ appUser, status: 'signed-in' });
    } catch (e) {
      console.error('[auth] failed to load profile', e);
      useAuthStore.setState({ status: 'signed-in' });
    }
  });
  return () => sub.subscription.unsubscribe();
}
