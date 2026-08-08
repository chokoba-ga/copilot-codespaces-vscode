import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';
import { cx } from '@/lib/utils';

const iconByKind = {
  success: <CheckCircle2 size={18} className="text-emerald-500" />,
  error: <XCircle size={18} className="text-red-500" />,
  info: <Info size={18} className="text-sky-500" />,
};

export function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),12px)] z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cx(
            'pointer-events-auto flex w-full max-w-sm items-center gap-2 rounded-2xl border px-4 py-3',
            'bg-white/95 backdrop-blur shadow-[var(--shadow-soft-lg)] animate-fade-in dark:bg-neutral-900/95',
            'border-neutral-100 dark:border-neutral-800',
          )}
        >
          {iconByKind[t.kind]}
          <p className="flex-1 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            {t.message}
          </p>
          <button
            onClick={() => dismissToast(t.id)}
            className="text-neutral-300 hover:text-neutral-500"
            aria-label="閉じる"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
