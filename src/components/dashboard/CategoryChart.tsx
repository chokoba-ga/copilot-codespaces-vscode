import { Doughnut } from 'react-chartjs-2';
import '@/lib/chartSetup';
import type { DashboardStats } from '@/types';
import { Card } from '@/components/common';
import { formatYen } from '@/lib/utils';

const PALETTE = ['#22a866', '#6366f1', '#f59e0b', '#ec4899', '#0ea5e9', '#8b5cf6', '#ef4444', '#14b8a6'];

export function CategoryChart({ data }: { data: DashboardStats['byCategory'] }) {
  const filtered = data.filter((d) => d.revenue > 0);

  return (
    <Card className="p-4">
      <p className="mb-3 text-sm font-black text-neutral-700 dark:text-neutral-200">カテゴリー別売上</p>
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-xs font-semibold text-neutral-400">まだデータがありません</p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="h-32 w-32 flex-shrink-0">
            <Doughnut
              data={{
                labels: filtered.map((d) => d.name),
                datasets: [{ data: filtered.map((d) => d.revenue), backgroundColor: PALETTE, borderWidth: 0 }],
              }}
              options={{ plugins: { legend: { display: false } }, cutout: '65%' }}
            />
          </div>
          <ul className="min-w-0 flex-1 space-y-1.5">
            {filtered.slice(0, 6).map((d, i) => (
              <li key={d.categoryId} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                <span className="min-w-0 flex-1 truncate font-bold text-neutral-600 dark:text-neutral-300">{d.name}</span>
                <span className="flex-shrink-0 font-black text-neutral-800 dark:text-neutral-100">{formatYen(d.revenue)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
