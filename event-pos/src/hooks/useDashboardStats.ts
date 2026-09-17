import { useMemo } from 'react';
import { useSalesStore } from '@/stores/salesStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { useCatalogStore } from '@/stores/catalogStore';
import type { DashboardStats, DayFilter, EventDoc } from '@/types';
import { todayStr, toDateStr } from '@/lib/utils';

export function useDashboardStats(event: EventDoc | null, dayFilter: DayFilter): DashboardStats {
  const sales = useSalesStore((s) => s.sales);
  const expenses = useExpenseStore((s) => s.expenses);
  const products = useCatalogStore((s) => s.products);
  const categories = useCatalogStore((s) => s.categories);

  return useMemo(() => {
    const validSales = sales.filter(
      (s) => !s.isCancelled && (dayFilter === 'all' || s.dayId === dayFilter),
    );
    const saleOnly = validSales.filter((s) => s.kind === 'sale');
    const validExpenses = expenses.filter(
      (e) => dayFilter === 'all' || e.dayId === dayFilter || e.dayId === null,
    );

    const today = todayStr();
    const todaySales = saleOnly
      .filter((s) => toDateStr(s.createdAt) === today)
      .reduce((sum, s) => sum + s.total, 0);

    const totalSales = saleOnly.reduce((sum, s) => sum + s.total, 0);
    const totalExpense = validExpenses.reduce((sum, e) => sum + e.amount, 0);
    const subsidyAmount = event?.settings.subsidyAmount ?? 0;

    const productMap = new Map(products.map((p) => [p.id, p]));
    let costOfGoods = 0;
    let itemsSold = 0;
    const rankingMap = new Map<string, { productId: string; name: string; qty: number; revenue: number }>();
    const categoryMap = new Map<string, { categoryId: string; name: string; revenue: number }>();
    const hourMap = new Map<number, number>();

    for (const sale of saleOnly) {
      const hour = new Date(sale.createdAt).getHours();
      hourMap.set(hour, (hourMap.get(hour) ?? 0) + sale.total);

      for (const item of sale.items) {
        itemsSold += item.quantity;
        const product = productMap.get(item.productId);
        if (product) costOfGoods += product.cost * item.quantity;

        const rank = rankingMap.get(item.productId) ?? {
          productId: item.productId,
          name: item.productName,
          qty: 0,
          revenue: 0,
        };
        rank.qty += item.quantity;
        rank.revenue += item.subtotal;
        rankingMap.set(item.productId, rank);

        const catId = item.categoryId ?? '__none__';
        const catName = categories.find((c) => c.id === item.categoryId)?.name ?? '未分類';
        const cat = categoryMap.get(catId) ?? { categoryId: catId, name: catName, revenue: 0 };
        cat.revenue += item.subtotal;
        categoryMap.set(catId, cat);
      }
    }

    const profit = totalSales - totalExpense - costOfGoods;
    const profitRate = totalSales > 0 ? (profit / totalSales) * 100 : 0;
    const cashBalance = subsidyAmount + totalSales - totalExpense;

    const byHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      revenue: hourMap.get(hour) ?? 0,
    })).filter((h, idx, arr) => {
      const activeHours = arr.filter((x) => x.revenue > 0).map((x) => x.hour);
      if (activeHours.length === 0) return h.hour >= 8 && h.hour <= 18;
      const min = Math.max(0, Math.min(...activeHours) - 1);
      const max = Math.min(23, Math.max(...activeHours) + 1);
      return idx >= min && idx <= max;
    });

    const byDay = (event?.days ?? []).map((d) => ({
      dayId: d.id,
      label: d.label,
      revenue: saleOnly.filter((s) => s.dayId === d.id).reduce((sum, s) => sum + s.total, 0),
    }));

    const lowStockThreshold = event?.settings.lowStockThreshold ?? 5;
    const activeProducts = products.filter((p) => p.isActive);
    const lowStock = activeProducts.filter(
      (p) => p.currentStock > 0 && p.currentStock <= lowStockThreshold,
    );
    const soldOut = activeProducts.filter((p) => p.currentStock <= 0);

    return {
      todaySales,
      totalSales,
      totalExpense,
      subsidyAmount,
      profit,
      profitRate,
      cashBalance,
      itemsSold,
      ranking: Array.from(rankingMap.values()).sort((a, b) => b.qty - a.qty).slice(0, 10),
      byCategory: Array.from(categoryMap.values()).sort((a, b) => b.revenue - a.revenue),
      byHour,
      byDay,
      lowStock,
      soldOut,
    } satisfies DashboardStats;
  }, [sales, expenses, products, categories, event, dayFilter]);
}
