import { create } from 'zustand';
import { generateId } from '@/lib/utils';

export type ToastKind = 'success' | 'error' | 'info';
export interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
}

interface UiState {
  toasts: Toast[];
  showToast: (message: string, kind?: ToastKind) => void;
  dismissToast: (id: string) => void;

  isOnline: boolean;
  setOnline: (v: boolean) => void;

  theme: 'light' | 'dark' | 'system';
  setTheme: (t: 'light' | 'dark' | 'system') => void;
}

const THEME_KEY = 'event-pos:theme';

export const useUiStore = create<UiState>((set, get) => ({
  toasts: [],
  showToast: (message, kind = 'info') => {
    const id = generateId();
    set((s) => ({ toasts: [...s.toasts, { id, kind, message }] }));
    setTimeout(() => get().dismissToast(id), 3200);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  setOnline: (v) => set({ isOnline: v }),

  theme: (typeof localStorage !== 'undefined' &&
    (localStorage.getItem(THEME_KEY) as UiState['theme'])) || 'system',
  setTheme: (t) => {
    set({ theme: t });
    if (typeof localStorage !== 'undefined') localStorage.setItem(THEME_KEY, t);
    applyTheme(t);
  },
}));

export function applyTheme(theme: 'light' | 'dark' | 'system') {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', Boolean(isDark));
}

export function initOnlineListener(): () => void {
  const on = () => useUiStore.setState({ isOnline: true });
  const off = () => useUiStore.setState({ isOnline: false });
  window.addEventListener('online', on);
  window.addEventListener('offline', off);
  return () => {
    window.removeEventListener('online', on);
    window.removeEventListener('offline', off);
  };
}
