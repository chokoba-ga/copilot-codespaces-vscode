import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { EventDoc } from '@/types';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { DaySelector, StatCard } from '@/components/common';
import { HourlyChart } from '@/components/dashboard/HourlyChart';
import { CategoryChart } from '@/components/dashboard/CategoryChart';
import { DailyChart } from '@/components/dashboard/DailyChart';
import { RankingList, StockAlerts } from '@/components/dashboard/RankingList';
import { formatPercent, formatYen } from '@/lib/utils';

export function DashboardPage() {
  const { event } = useOutletContext<{ event: EventDoc | null }>();
  const [dayFilter, setDayFilter] = useState<string>('all');
  const stats = useDashboardStats(event, dayFilter);

  if (!event) return null;

  return (
    <div className="space-y-4 px-4 pb-8 pt-3">
      {event.days.length > 1 && (
        <DaySelector days={event.days} value={dayFilter} onChange={setDayFilter} includeAll />
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="本日の売上" value={formatYen(stats.todaySales)} />
        <StatCard label="全売上" value={formatYen(stats.totalSales)} tone="positive" />
        <StatCard label="総支出" value={formatYen(stats.totalExpense)} />
        <StatCard
          label="利益"
          value={formatYen(stats.profit)}
          sub={`利益率 ${formatPercent(stats.profitRate)}`}
          tone={stats.profit >= 0 ? 'positive' : 'negative'}
        />
      </div>

      {stats.subsidyAmount !== 0 && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="補助費・初期資金" value={formatYen(stats.subsidyAmount)} />
          <StatCard
            label="手元資金の目安"
            value={formatYen(stats.cashBalance)}
            sub="補助費 + 売上 − 支出"
            tone={stats.cashBalance >= 0 ? 'positive' : 'negative'}
          />
        </div>
      )}

      <StatCard label="販売点数" value={`${stats.itemsSold}点`} />

      <StockAlerts lowStock={stats.lowStock} soldOut={stats.soldOut} />
      <RankingList ranking={stats.ranking} />
      <CategoryChart data={stats.byCategory} />
      <HourlyChart data={stats.byHour} />
      <DailyChart data={stats.byDay} />
    </div>
  );
}
