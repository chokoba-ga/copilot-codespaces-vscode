import type { EventDay } from '@/types';
import { cx, formatDateJp } from '@/lib/utils';

/**
 * レジ画面・ダッシュボード・履歴・支出画面で共通して使う「イベント日」選択タブ。
 * `includeAll` を true にすると「全日程」タブも表示する（集計画面向け）。
 */
export function DaySelector({
  days,
  value,
  onChange,
  includeAll,
}: {
  days: EventDay[];
  value: string;
  onChange: (dayId: string) => void;
  includeAll?: boolean;
}) {
  const sorted = [...days].sort((a, b) => a.order - b.order);
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {includeAll && (
        <Tab label="全日程" active={value === 'all'} onClick={() => onChange('all')} />
      )}
      {sorted.map((day) => (
        <Tab
          key={day.id}
          label={day.label}
          sub={formatDateJp(day.date)}
          active={value === day.id}
          onClick={() => onChange(day.id)}
        />
      ))}
    </div>
  );
}

function Tab({
  label,
  sub,
  active,
  onClick,
}: {
  label: string;
  sub?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'flex-shrink-0 rounded-2xl px-3.5 py-2 text-left transition-colors',
        active
          ? 'bg-brand-600 text-white shadow-soft'
          : 'bg-white text-neutral-500 border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400',
      )}
    >
      <span className="block text-[13px] font-black leading-none">{label}</span>
      {sub && (
        <span className={cx('mt-0.5 block text-[10px] font-bold', active ? 'text-white/80' : 'text-neutral-400')}>
          {sub}
        </span>
      )}
    </button>
  );
}

/** 現在時刻から最も近いイベント日のIDを推定する（レジ画面の初期選択に使用） */
export function guessCurrentDayId(days: EventDay[]): string {
  if (days.length === 0) return '';
  const todayMs = new Date().setHours(0, 0, 0, 0);
  const sorted = [...days].sort((a, b) => a.order - b.order);
  const exact = sorted.find((d) => new Date(d.date).setHours(0, 0, 0, 0) === todayMs);
  if (exact) return exact.id;
  // 一致する日がなければ、直近の未来日、なければ最終日を返す
  const future = sorted.find((d) => new Date(d.date).setHours(0, 0, 0, 0) >= todayMs);
  return (future ?? sorted[sorted.length - 1]).id;
}
