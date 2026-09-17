import { useState } from 'react';
import { Lock } from 'lucide-react';
import type { EventDay } from '@/types';
import { cx, formatDateJp, todayStr, compareDateStr } from '@/lib/utils';
import { ConfirmDialog } from '@/components/common';

/**
 * レジ画面専用の日程選択タブ。
 * ・未来の日付はまだ利用できない（タップ不可・鍵アイコン表示）
 * ・今日の日付はそのまま選べる
 * ・過去の日付を選ぼうとすると「これは過去の会計です」の確認を挟む
 *   （集計・履歴・PDF画面では日付を問わず自由に見られるよう、このガードは
 *   レジ画面だけに適用している）
 */
export function RegisterDaySelector({
  days,
  value,
  onChange,
}: {
  days: EventDay[];
  value: string;
  onChange: (dayId: string) => void;
}) {
  const [confirmDay, setConfirmDay] = useState<EventDay | null>(null);
  const today = todayStr();
  const sorted = [...days].sort((a, b) => a.order - b.order);

  const handleTap = (day: EventDay) => {
    const cmp = compareDateStr(day.date, today);
    if (cmp > 0) return; // 未来日はボタン自体を無効化しているためここには来ない
    if (cmp < 0) {
      setConfirmDay(day);
      return;
    }
    onChange(day.id);
  };

  const isYesterday = (dateStr: string) => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return dateStr === y;
  };

  return (
    <>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sorted.map((day) => {
          const cmp = compareDateStr(day.date, today);
          const isFuture = cmp > 0;
          const active = value === day.id;
          return (
            <button
              key={day.id}
              disabled={isFuture}
              onClick={() => handleTap(day)}
              className={cx(
                'flex-shrink-0 rounded-2xl px-3.5 py-2 text-left transition-colors',
                isFuture && 'opacity-40',
                active
                  ? 'bg-brand-600 text-white shadow-soft'
                  : 'bg-white text-neutral-500 border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400',
              )}
            >
              <span className="flex items-center gap-1 text-[13px] font-black leading-none">
                {day.label}
                {isFuture && <Lock size={10} />}
              </span>
              <span className={cx('mt-0.5 block text-[10px] font-bold', active ? 'text-white/80' : 'text-neutral-400')}>
                {isFuture ? 'まだ利用できません' : formatDateJp(day.date)}
              </span>
            </button>
          );
        })}
      </div>

      <ConfirmDialog
        open={confirmDay != null}
        title={`これは${confirmDay && isYesterday(confirmDay.date) ? '昨日' : '過去'}の会計です`}
        description={
          confirmDay
            ? `「${confirmDay.label}」（${formatDateJp(confirmDay.date)}）として会計を記録します。日付を間違えていないか確認してください。`
            : ''
        }
        confirmLabel="この日で記録する"
        onConfirm={() => {
          if (confirmDay) onChange(confirmDay.id);
          setConfirmDay(null);
        }}
        onCancel={() => setConfirmDay(null)}
      />
    </>
  );
}
