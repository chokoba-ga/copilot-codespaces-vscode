import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Pencil, Moon, Sun, Monitor } from 'lucide-react';
import type { EventDoc } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { Badge, Modal, Button, TextField } from '@/components/common';
import { StaffQuickPicker } from '@/components/settings/StaffQuickPicker';

const THEME_ICON = { light: Sun, dark: Moon, system: Monitor } as const;

export function TopBar({ event, backTo = '/events' }: { event?: EventDoc | null; backTo?: string }) {
  const navigate = useNavigate();
  const appUser = useAuthStore((s) => s.appUser);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const ThemeIcon = THEME_ICON[theme];
  const [editOpen, setEditOpen] = useState(false);

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
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-1 truncate text-[11px] font-semibold text-neutral-400"
          >
            {appUser.displayName || '名前未設定'} ・ {roleLabel(appUser.role)}
            <Pencil size={10} className="flex-shrink-0" />
          </button>
        )}
      </div>
      <button
        onClick={cycleTheme}
        aria-label="テーマ切替"
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        <ThemeIcon size={18} />
      </button>
      <EditNameModal open={editOpen} onClose={() => setEditOpen(false)} />
    </header>
  );
}

function EditNameModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const appUser = useAuthStore((s) => s.appUser);
  const setDisplayName = useAuthStore((s) => s.setDisplayName);
  const [name, setName] = useState(appUser?.displayName ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (value?: string) => {
    const target = (value ?? name).trim();
    if (!target) return;
    setSaving(true);
    try {
      await setDisplayName(target);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="名前を変更" sheet={false} maxWidthClass="max-w-sm">
      <div className="space-y-4">
        <StaffQuickPicker onPick={(n) => void handleSave(n)} />
        <TextField
          label="または自由に入力"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <Button fullWidth onClick={() => void handleSave()} loading={saving} disabled={!name.trim()}>
          保存する
        </Button>
      </div>
    </Modal>
  );
}

function roleLabel(role: string) {
  return role === 'admin' ? '管理者' : role === 'staff' ? 'スタッフ' : '閲覧者';
}

export function RoleBadge({ role }: { role: string }) {
  const tone = role === 'admin' ? 'brand' : role === 'staff' ? 'info' : 'neutral';
  return <Badge tone={tone}>{roleLabel(role)}</Badge>;
}
