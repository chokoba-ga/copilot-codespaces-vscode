import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { EventDoc } from '@/types';
import { useSalesStore } from '@/stores/salesStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { SearchInput, EmptyState } from '@/components/common';
import { HistoryFilters, type HistoryFilterState } from '@/components/history/HistoryFilters';
import { SaleHistoryRow } from '@/components/history/SaleHistoryRow';
import { History } from 'lucide-react';

export function HistoryPage() {
  const { event } = useOutletContext<{ event: EventDoc | null }>();
  const sales = useSalesStore((s) => s.sales);
  const categories = useCatalogStore((s) => s.categories);

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<HistoryFilterState>({
    dayId: 'all',
    categoryId: 'all',
    status: 'all',
    sort: 'newest',
  });

  const filtered = useMemo(() => {
    let list = sales.slice();

    if (filters.dayId !== 'all') list = list.filter((s) => s.dayId === filters.dayId);
    if (filters.categoryId !== 'all') {
      list = list.filter((s) => s.items.some((i) => i.categoryId === filters.categoryId));
    }
    if (filters.status === 'normal') list = list.filter((s) => s.kind === 'sale' && !s.isCancelled && !s.isRefunded);
    if (filters.status === 'loss') list = list.filter((s) => s.kind === 'loss');
    if (filters.status === 'cancelled') list = list.filter((s) => s.isCancelled);
    if (filters.status === 'refunded') list = list.filter((s) => s.isRefunded);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.items.some((i) => i.productName.toLowerCase().includes(q)) ||
          s.staffName.toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => {
      switch (filters.sort) {
        case 'oldest':
          return a.createdAt - b.createdAt;
        case 'amount_desc':
          return b.total - a.total;
        case 'amount_asc':
          return a.total - b.total;
        default:
          return b.createdAt - a.createdAt;
      }
    });

    return list;
  }, [sales, filters, search]);

  if (!event) return null;

  return (
    <div className="space-y-3 px-4 pb-8 pt-3">
      <SearchInput value={search} onChange={setSearch} placeholder="商品名・担当者で検索" />
      <HistoryFilters days={event.days} categories={categories} value={filters} onChange={setFilters} />

      <p className="text-xs font-bold text-neutral-400">{filtered.length}件</p>

      {filtered.length === 0 ? (
        <EmptyState icon={<History size={26} />} title="該当する履歴がありません" />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((sale) => (
            <SaleHistoryRow key={sale.id} sale={sale} />
          ))}
        </div>
      )}
    </div>
  );
}
