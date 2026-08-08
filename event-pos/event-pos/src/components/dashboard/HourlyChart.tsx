import { Bar } from 'react-chartjs-2';
import '@/lib/chartSetup';
import type { DashboardStats } from '@/types';
import { Card } from '@/components/common';

export function HourlyChart({ data }: { data: DashboardStats['byHour'] }) {
  const hasData = data.some((d) => d.revenue > 0);

  return (
    <Card className="p-4">
      <p className="mb-3 text-sm font-black text-neutral-700 dark:text-neutral-200">時間帯別売上</p>
      {!hasData ? (
        <p className="py-8 text-center text-xs font-semibold text-neutral-400">まだデータがありません</p>
      ) : (
        <div className="h-48">
          <Bar
            data={{
              labels: data.map((d) => `${d.hour}時`),
              datasets: [
                {
                  data: data.map((d) => d.revenue),
                  backgroundColor: '#22a866',
                  borderRadius: 6,
                  maxBarThickness: 28,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, ticks: { font: { size: 10 } } },
                x: { ticks: { font: { size: 10 } } },
              },
            }}
          />
        </div>
      )}
    </Card>
  );
}
