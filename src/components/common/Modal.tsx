import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from '@/lib/utils';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  sheet?: boolean;
  maxWidthClass?: string;
}

export function Modal({ open, onClose, title, children, sheet = true, maxWidthClass = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cx(
          'relative w-full bg-white dark:bg-neutral-900 shadow-[var(--shadow-soft-lg)]',
          'max-h-[92vh] overflow-y-auto safe-bottom',
          sheet
            ? cx('rounded-t-[28px] sm:rounded-[28px] animate-sheet-up sm:animate-pop', maxWidthClass)
            : cx('m-4 rounded-[24px] animate-pop', maxWidthClass),
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-100 bg-white/90 px-5 py-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90">
          <h2 className="text-lg font-black text-neutral-900 dark:text-neutral-50">{title}</h2>
          <button
            onClick={onClose}
            aria-label="閉じる"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '実行する',
  cancelLabel = 'キャンセル',
  danger,
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} sheet={false} maxWidthClass="max-w-sm">
      <div className="space-y-5">
        {description && (
          <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">{description}</p>
        )}
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} fullWidth onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
