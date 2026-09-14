import { NavLink, useParams } from 'react-router-dom';
import { ShoppingCart, LayoutDashboard, History, Wallet, Settings } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cx } from '@/lib/utils';

const ALL_ITEMS = [
  { key: 'register', label: 'レジ', icon: ShoppingCart, path: '', roles: ['admin', 'staff'] },
  { key: 'dashboard', label: 'ダッシュボード', icon: LayoutDashboard, path: 'dashboard', roles: ['admin', 'staff', 'viewer'] },
  { key: 'history', label: '履歴', icon: History, path: 'history', roles: ['admin', 'staff', 'viewer'] },
  { key: 'expenses', label: '支出', icon: Wallet, path: 'expenses', roles: ['admin', 'staff', 'viewer'] },
  { key: 'settings', label: '設定', icon: Settings, path: 'settings', roles: ['admin'] },
] as const;

export function BottomNav() {
  const { eventId } = useParams();
  const hasRole = useAuthStore((s) => s.hasRole);
  const items = ALL_ITEMS.filter((item) => hasRole(...item.roles));

  return (
    <nav className="safe-bottom sticky bottom-0 z-40 border-t border-neutral-100 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
      <div
        className="mx-auto grid max-w-lg"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => (
          <NavLink
            key={item.key}
            to={`/events/${eventId}${item.path ? `/${item.path}` : ''}`}
            end={item.path === ''}
            className={({ isActive }) =>
              cx(
                'flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold transition-colors',
                isActive ? 'text-brand-600' : 'text-neutral-400',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
