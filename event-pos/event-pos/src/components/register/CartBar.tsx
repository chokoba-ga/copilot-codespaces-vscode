import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { formatYen } from '@/lib/utils';

export function CartBar({ onOpen }: { onOpen: () => void }) {
  const totalQuantity = useCartStore((s) => s.totalQuantity());
  const totalAmount = useCartStore((s) => s.totalAmount());

  if (totalQuantity === 0) return null;

  return (
    <div className="sticky bottom-0 z-30 px-4 pb-3 pt-2">
      <button
        onClick={onOpen}
        className="flex w-full items-center gap-3 rounded-[22px] bg-neutral-900 px-4 py-3.5 text-white shadow-[var(--shadow-soft-lg)] active:scale-[0.98] dark:bg-brand-600"
      >
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/15">
          <ShoppingCart size={18} />
        </span>
        <span className="flex-1 text-left">
          <span className="block text-[11px] font-bold text-white/70">{totalQuantity}点 選択中</span>
          <span className="block text-[15px] font-black">{formatYen(totalAmount)}</span>
        </span>
        <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-neutral-900">
          会計へ
        </span>
      </button>
    </div>
  );
}
