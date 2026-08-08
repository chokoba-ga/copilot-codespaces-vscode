import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LogOut, Moon, Sun, Monitor } from 'lucide-react';
import type { EventDoc } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { Badge } from '@/components/common';

const THEME_ICON = { light: Sun, dark: Moon, system: Monitor } as const;

export function TopBar({ event, backTo = '/events' }: { event?: EventDoc | null; backTo?: string }) {
  const navigate = useNavigate();
  const appUser = useAuthStore((s) => s.appUser);
  const signOut = useAuthStore((s) => s.signOut);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const ThemeIcon = THEME_ICON[theme];

  const cycleTheme = () => {
    const order: (typeof theme)[] = ['system', 'light', 'dark'];
    setTheme(order[(order.indexOf(theme) + 1) % order.length]);
  };

  return (
    <header className="safe-top sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-neutral-100 bg-white/95 px-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
      <button
        onClick={() => navigate(backTo)}
        aria-label="戻る"
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        <ChevronLeft size={22} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-black text-neutral-900 dark:text-neutral-50">
          {event?.name ?? 'Event POS'}
        </p>
        {appUser && (
          <p className="truncate text-[11px] font-semibold text-neutral-400">
            {appUser.displayName} ・ {roleLabel(appUser.role)}
          </p>
        )}
      </div>
      <button
        onClick={cycleTheme}
        aria-label="テーマ切替"
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        <ThemeIcon size={18} />
      </button>
      <button
        onClick={() => void signOut()}
        aria-label="ログアウト"
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        <LogOut size={18} />
      </button>
    </header>
  );
}

function roleLabel(role: string) {
  return role === 'admin' ? '管理者' : role === 'staff' ? 'スタッフ' : '閲覧者';
}

export function RoleBadge({ role }: { role: string }) {
  const tone = role === 'admin' ? 'brand' : role === 'staff' ? 'info' : 'neutral';
  return <Badge tone={tone}>{roleLabel(role)}</Badge>;
}
