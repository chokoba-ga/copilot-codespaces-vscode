import { create } from 'zustand';
import { subscribeExpenses } from '@/lib/db/expenses';
import type { ExpenseDoc } from '@/types';

interface ExpenseState {
  eventId: string | null;
  expenses: ExpenseDoc[];
  loaded: boolean;
}

let unsub: (() => void) | null = null;

export const useExpenseStore = create<ExpenseState>(() => ({
  eventId: null,
  expenses: [],
  loaded: false,
}));

export function attachExpenses(eventId: string): () => void {
  unsub?.();
  useExpenseStore.setState({ eventId, expenses: [], loaded: false });
  unsub = subscribeExpenses(eventId, (expenses) => {
    useExpenseStore.setState({ expenses, loaded: true });
  });
  return unsub;
}
