import { useMemo, useState } from 'react';
import type { ProductCategoryDoc, ProductDoc } from '@/types';
import { cx, formatYen } from '@/lib/utils';
import { SearchInput } from '@/components/common';
import { useCartStore } from '@/stores/cartStore';
import { ImageOff } from 'lucide-react';

export function ProductGrid({
  products,
  categories,
}: {
  products: ProductDoc[];
  categories: ProductCategoryDoc[];
}) {
  const [categoryId, setCategoryId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const lines = useCartStore((s) => s.lines);
  const add = useCartStore((s) => s.add);

  const activeProducts = useMemo(() => products.filter((p) => p.isActive), [products]);
  const filtered = useMemo(() => {
    return activeProducts.filter((p) => {
      if (categoryId !== 'all' && p.categoryId !== categoryId) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [activeProducts, categoryId, search]);

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-3 px-4 pt-3">
      <SearchInput value={search} onChange={setSearch} placeholder="商品を検索" />

      {sortedCategories.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryPill label="すべて" active={categoryId === 'all'} onClick={() => setCategoryId('all')} />
          {sortedCategories.map((c) => (
            <CategoryPill
              key={c.id}
              label={c.name}
              active={categoryId === c.id}
              onClick={() => setCategoryId(c.id)}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm font-semibold text-neutral-400">
          {activeProducts.length === 0 ? '商品が登録されていません' : '該当する商品がありません'}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 pb-4">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              inCart={lines[product.id]?.quantity ?? 0}
              onTap={() => add(product)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'flex-shrink-0 rounded-full px-4 py-1.5 text-[13px] font-bold transition-colors',
        active
          ? 'bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900'
          : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
      )}
    >
      {label}
    </button>
  );
}

function ProductCard({ product, inCart, onTap }: { product: ProductDoc; inCart: number; onTap: () => void }) {
  const soldOut = product.currentStock <= 0;
  const low = !soldOut && product.currentStock <= 5;

  return (
    <button
      onClick={onTap}
      disabled={soldOut}
      className={cx(
        'relative flex flex-col overflow-hidden rounded-[20px] border text-left transition-all active:scale-[0.96]',
        'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 shadow-soft',
        soldOut && 'opacity-50',
      )}
    >
      {inCart > 0 && (
        <span className="absolute right-2 top-2 z-10 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-black text-white shadow">
          {inCart}
        </span>
      )}
      <div className="flex aspect-[4/3] items-center justify-center bg-neutral-50 dark:bg-neutral-800">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <ImageOff size={26} className="text-neutral-300 dark:text-neutral-600" />
        )}
        {soldOut && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-black text-white">
            完売
          </span>
        )}
      </div>
      <div className="p-2.5">
        <p className="truncate text-[14px] font-bold text-neutral-800 dark:text-neutral-100">{product.name}</p>
        <div className="mt-0.5 flex items-center justify-between">
          <span className="text-[15px] font-black text-brand-700 dark:text-brand-400">
            {formatYen(product.price)}
          </span>
          {!soldOut && (
            <span className={cx('text-[10px] font-bold', low ? 'text-amber-500' : 'text-neutral-300')}>
              残{product.currentStock}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
