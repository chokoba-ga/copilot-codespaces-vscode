import { Minus, Plus } from 'lucide-react';

export function QuantityStepper({
  value,
  onChange,
  max,
  min = 0,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  min?: number;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-neutral-100 p-1 dark:bg-neutral-800">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-600 shadow-sm disabled:opacity-30 dark:bg-neutral-700 dark:text-neutral-200"
        aria-label="減らす"
      >
        <Minus size={15} />
      </button>
      <span className="w-8 text-center text-[15px] font-black tabular-nums text-neutral-800 dark:text-neutral-100">
        {value}
      </span>
      <button
        onClick={() => onChange(max != null ? Math.min(max, value + 1) : value + 1)}
        disabled={max != null && value >= max}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-600 shadow-sm disabled:opacity-30 dark:bg-neutral-700 dark:text-neutral-200"
        aria-label="増やす"
      >
        <Plus size={15} />
      </button>
    </div>
  );
}
