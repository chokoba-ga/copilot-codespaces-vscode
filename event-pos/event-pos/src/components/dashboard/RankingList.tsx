import type { DashboardStats } from '@/types';
import { Card, Badge } from '@/components/common';
import { formatYen } from '@/lib/utils';
import { Trophy, AlertTriangle, Ban } from 'lucide-react';

export function RankingList({ ranking }: { ranking: DashboardStats['ranking'] }) {
  return (
    <Card className="p-4">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-black text-neutral-700 dark:text-neutral-200">
        <Trophy size={15} className="text-amber-500" /> 人気商品ランキング
      </p>
      {ranking.length === 0 ? (
        <p className="py-6 text-center text-xs font-semibold text-neutral-400">まだデータがありません</p>
      ) : (
        <ol className="space-y-2.5">
          {ranking.map((r, i) => (
            <li key={r.productId} className="flex items-center gap-3">
              <span
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                  i === 0
                    ? 'bg-amber-400 text-amber-900'
                    : i === 1
                      ? 'bg-neutral-300 text-neutral-700'
                      : i === 2
                        ? 'bg-orange-300 text-orange-900'
                        : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800'
                }`}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-neutral-700 dark:text-neutral-200">
                {r.name}
              </span>
              <span className="flex-shrink-0 text-xs font-bold text-neutral-400">{r.qty}個</span>
              <span className="flex-shrink-0 text-[13px] font-black text-neutral-800 dark:text-neutral-100">
                {formatYen(r.revenue)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export function StockAlerts({
  lowStock,
  soldOut,
}: {
  lowStock: DashboardStats['lowStock'];
  soldOut: DashboardStats['soldOut'];
}) {
  if (lowStock.length === 0 && soldOut.length === 0) return null;
  return (
    <Card className="p-4">
      <p className="mb-3 text-sm font-black text-neutral-700 dark:text-neutral-200">在庫アラート</p>
      <div className="space-y-2">
        {soldOut.map((p) => (
          <div key={p.id} className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[13px] font-bold text-neutral-600 dark:text-neutral-300">
              <Ban size={14} className="text-red-500" /> {p.name}
            </span>
            <Badge tone="danger">売切</Badge>
          </div>
        ))}
        {lowStock.map((p) => (
          <div key={p.id} className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[13px] font-bold text-neutral-600 dark:text-neutral-300">
              <AlertTriangle size={14} className="text-amber-500" /> {p.name}
            </span>
            <Badge tone="warn">残{p.currentStock}個</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
