import { create } from 'zustand';
import { subscribeProducts, subscribeCategories } from '@/lib/db/products';
import type { ProductCategoryDoc, ProductDoc } from '@/types';

interface CatalogState {
  eventId: string | null;
  products: ProductDoc[];
  categories: ProductCategoryDoc[];
  loaded: boolean;
}

let unsubProducts: (() => void) | null = null;
let unsubCategories: (() => void) | null = null;

export const useCatalogStore = create<CatalogState>(() => ({
  eventId: null,
  products: [],
  categories: [],
  loaded: false,
}));

export function attachCatalog(eventId: string): () => void {
  unsubProducts?.();
  unsubCategories?.();
  useCatalogStore.setState({ eventId, products: [], categories: [], loaded: false });

  unsubProducts = subscribeProducts(eventId, (products) => {
    useCatalogStore.setState({ products, loaded: true });
  });
  unsubCategories = subscribeCategories(eventId, (categories) => {
    useCatalogStore.setState({ categories });
  });

  return () => {
    unsubProducts?.();
    unsubCategories?.();
  };
}
