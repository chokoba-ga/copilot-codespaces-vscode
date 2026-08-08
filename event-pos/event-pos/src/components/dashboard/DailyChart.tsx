import { Bar } from 'react-chartjs-2';
import '@/lib/chartSetup';
import type { DashboardStats } from '@/types';
import { Card } from '@/components/common';

export function DailyChart({ data }: { data: DashboardStats['byDay'] }) {
  if (data.length <= 1) return null;
  return (
    <Card className="p-4">
      <p className="mb-3 text-sm font-black text-neutral-700 dark:text-neutral-200">日別売上</p>
      <div className="h-40">
        <Bar
          data={{
            labels: data.map((d) => d.label),
            datasets: [
              {
                data: data.map((d) => d.revenue),
                backgroundColor: '#6366f1',
                borderRadius: 8,
                maxBarThickness: 44,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { font: { size: 10 } } }, x: { ticks: { font: { size: 11 } } } },
          }}
        />
      </div>
    </Card>
  );
}
