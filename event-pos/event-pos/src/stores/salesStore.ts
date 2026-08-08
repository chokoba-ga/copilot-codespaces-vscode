import { create } from 'zustand';
import { subscribeSales } from '@/lib/db/sales';
import type { SaleDoc } from '@/types';

interface SalesState {
  eventId: string | null;
  sales: SaleDoc[];
  loaded: boolean;
}

let unsub: (() => void) | null = null;

export const useSalesStore = create<SalesState>(() => ({
  eventId: null,
  sales: [],
  loaded: false,
}));

export function attachSales(eventId: string): () => void {
  unsub?.();
  useSalesStore.setState({ eventId, sales: [], loaded: false });
  unsub = subscribeSales(eventId, (sales) => {
    useSalesStore.setState({ sales, loaded: true });
  });
  return unsub;
}
