import { useEffect } from 'react';
import { attachCatalog } from '@/stores/catalogStore';
import { attachSales } from '@/stores/salesStore';
import { attachExpenses } from '@/stores/expenseStore';
import { useEventStore } from '@/stores/eventStore';

/**
 * イベント詳細配下の画面で呼び出す。
 * eventId が変わるたびに商品・売上・支出の購読を張り替え、離脱時に解除する。
 */
export function useEventData(eventId: string | undefined) {
  const setCurrentEventId = useEventStore((s) => s.setCurrentEventId);

  useEffect(() => {
    if (!eventId) return;
    setCurrentEventId(eventId);
    const unsubCatalog = attachCatalog(eventId);
    const unsubSales = attachSales(eventId);
    const unsubExpenses = attachExpenses(eventId);
    return () => {
      unsubCatalog();
      unsubSales();
      unsubExpenses();
      setCurrentEventId(null);
    };
  }, [eventId, setCurrentEventId]);
}
