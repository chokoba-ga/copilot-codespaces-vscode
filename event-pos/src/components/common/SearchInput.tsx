import { Search, X } from 'lucide-react';

export function SearchInput({
  value,
  onChange,
  placeholder = '検索',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search
        size={18}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-neutral-200 bg-white pl-10 pr-9 text-[15px] font-medium text-neutral-800 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:ring-brand-900/30"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="クリア"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-500"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
