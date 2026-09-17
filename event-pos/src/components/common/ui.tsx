import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/utils';
import { Loader2, Inbox } from 'lucide-react';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        'rounded-[var(--radius-card)] bg-white dark:bg-neutral-900',
        'border border-neutral-100 dark:border-neutral-800 shadow-[var(--shadow-soft)]',
        className,
      )}
      {...rest}
    />
  );
}

type BadgeTone = 'neutral' | 'brand' | 'warn' | 'danger' | 'info';
const badgeTone: Record<BadgeTone, string> = {
  neutral: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
  warn: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  info: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
};

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap',
        badgeTone[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ size = 24, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={cx('animate-spin text-brand-600', className)} />;
}

export function FullScreenSpinner({ label }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-3 text-neutral-400">
      <Spinner size={32} />
      {label && <p className="text-sm font-medium">{label}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
        {icon ?? <Inbox size={26} />}
      </div>
      <p className="font-bold text-neutral-700 dark:text-neutral-200">{title}</p>
      {description && (
        <p className="max-w-xs text-sm text-neutral-400 dark:text-neutral-500">{description}</p>
      )}
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'neutral' | 'positive' | 'negative';
}) {
  const valueTone =
    tone === 'positive'
      ? 'text-brand-600 dark:text-brand-400'
      : tone === 'negative'
        ? 'text-red-600 dark:text-red-400'
        : 'text-neutral-900 dark:text-neutral-50';
  return (
    <Card className="p-4">
      <p className="text-xs font-bold text-neutral-400">{label}</p>
      <p className={cx('mt-1.5 text-2xl font-black tabular-nums', valueTone)}>{value}</p>
      {sub && <p className="mt-1 text-xs font-medium text-neutral-400">{sub}</p>}
    </Card>
  );
}
