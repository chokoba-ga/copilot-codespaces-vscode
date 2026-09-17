import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import type { EventDoc } from '@/types';
import { useCatalogStore } from '@/stores/catalogStore';
import { useCartStore } from '@/stores/cartStore';
import { ProductGrid } from '@/components/register/ProductGrid';
import { CartBar } from '@/components/register/CartBar';
import { CheckoutSheet } from '@/components/register/CheckoutSheet';
import { LossModal } from '@/components/register/LossModal';
import { RegisterDaySelector } from '@/components/register/RegisterDaySelector';
import { guessCurrentDayId, EmptyState } from '@/components/common';

export function RegisterPage() {
  const { event } = useOutletContext<{ event: EventDoc | null }>();
  const products = useCatalogStore((s) => s.products);
  const categories = useCatalogStore((s) => s.categories);
  const cartCount = useCartStore((s) => s.totalQuantity());
  const clearCart = useCartStore((s) => s.clear);

  const [dayId, setDayId] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [lossOpen, setLossOpen] = useState(false);

  useEffect(() => {
    if (event) setDayId((prev) => prev || guessCurrentDayId(event.days));
  }, [event]);

  if (!event) return null;

  if (event.days.length === 0) {
    return (
      <EmptyState
        title="開催日程が未設定です"
        description="「設定」タブから開催日を登録すると、レジ画面が使えるようになります。"
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between gap-2">
          <RegisterDaySelector days={event.days} value={dayId} onChange={setDayId} />
          <div className="flex flex-shrink-0 items-center gap-1.5">
            {cartCount > 0 && (
              <button
                onClick={clearCart}
                aria-label="カートを空にする"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={() => setLossOpen(true)}
              className="flex-shrink-0 whitespace-nowrap rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
            >
              ロス・試食
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ProductGrid products={products} categories={categories} />
      </div>

      <CartBar onOpen={() => setCheckoutOpen(true)} />

      <CheckoutSheet open={checkoutOpen} onClose={() => setCheckoutOpen(false)} eventId={event.id} dayId={dayId} />
      <LossModal open={lossOpen} onClose={() => setLossOpen(false)} eventId={event.id} dayId={dayId} products={products} />
    </div>
  );
}
