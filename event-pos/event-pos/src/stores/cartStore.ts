import { create } from 'zustand';
import type { CartLine, ProductDoc } from '@/types';

interface CartState {
  lines: Record<string, CartLine>; // productId -> line
  add: (product: ProductDoc) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  totalQuantity: () => number;
  totalAmount: () => number;
  linesArray: () => CartLine[];
}

export const useCartStore = create<CartState>((set, get) => ({
  lines: {},

  add: (product) =>
    set((s) => {
      const existing = s.lines[product.id];
      const nextQty = Math.min((existing?.quantity ?? 0) + 1, product.currentStock);
      if (nextQty <= 0) return s;
      return { lines: { ...s.lines, [product.id]: { product, quantity: nextQty } } };
    }),

  setQuantity: (productId, quantity) =>
    set((s) => {
      const existing = s.lines[productId];
      if (!existing) return s;
      if (quantity <= 0) {
        const { [productId]: _removed, ...rest } = s.lines;
        return { lines: rest };
      }
      const clamped = Math.min(quantity, existing.product.currentStock);
      return { lines: { ...s.lines, [productId]: { ...existing, quantity: clamped } } };
    }),

  remove: (productId) =>
    set((s) => {
      const { [productId]: _removed, ...rest } = s.lines;
      return { lines: rest };
    }),

  clear: () => set({ lines: {} }),

  totalQuantity: () => Object.values(get().lines).reduce((s, l) => s + l.quantity, 0),
  totalAmount: () =>
    Object.values(get().lines).reduce((s, l) => s + l.product.price * l.quantity, 0),
  linesArray: () => Object.values(get().lines),
}));
