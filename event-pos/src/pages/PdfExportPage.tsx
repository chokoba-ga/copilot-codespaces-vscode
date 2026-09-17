import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileDown, FileText } from 'lucide-react';
import type { EventDoc } from '@/types';
import { useCatalogStore } from '@/stores/catalogStore';
import { useSalesStore } from '@/stores/salesStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { Button, Card, DaySelector } from '@/components/common';
import { downloadEventReport } from '@/lib/pdf/generateEventReport';

export function PdfExportPage() {
  const { event } = useOutletContext<{ event: EventDoc | null }>();
  const products = useCatalogStore((s) => s.products);
  const sales = useSalesStore((s) => s.sales);
  const expenses = useExpenseStore((s) => s.expenses);
  const appUser = useAuthStore((s) => s.appUser);
  const showToast = useUiStore((s) => s.showToast);

  const [dayFilter, setDayFilter] = useState('all');
  const [generating, setGenerating] = useState(false);

  if (!event || !appUser) return null;

  const handleDownload = async () => {
    setGenerating(true);
    try {
      await downloadEventReport({ event, products, sales, expenses, dayFilter, generatedByName: appUser.displayName });
      showToast('PDFを作成しました', 'success');
    } catch (e) {
      console.error(e);
      showToast('PDFの作成に失敗しました', 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4 px-4 pb-10 pt-3">
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-brand-50 text-brand-600 dark:bg-brand-900/30">
          <FileText size={30} />
        </div>
        <div>
          <h2 className="text-lg font-black text-neutral-900 dark:text-neutral-50">学校提出用PDF</h2>
          <p className="mt-1 max-w-xs text-sm font-medium text-neutral-400">
            イベント情報・売上・支出・利益・在庫などをまとめたA4サイズのPDFを作成します。
          </p>
        </div>
      </div>

      {event.days.length > 1 && (
        <Card className="p-4">
          <p className="mb-2 text-[13px] font-bold text-neutral-600 dark:text-neutral-300">対象日程</p>
          <DaySelector days={event.days} value={dayFilter} onChange={setDayFilter} includeAll />
        </Card>
      )}

      <Card className="space-y-2 p-4 text-[13px] font-semibold text-neutral-500 dark:text-neutral-400">
        <p>PDFに含まれる内容:</p>
        <ul className="ml-4 list-disc space-y-0.5">
          <li>イベント情報・開催日</li>
          <li>売上合計・支出合計・利益・利益率</li>
          <li>補助費・初期資金（設定している場合）</li>
          <li>商品別売上・商品別利益</li>
          <li>日別売上</li>
          <li>支出一覧</li>
          <li>売上履歴（全件）</li>
          <li>在庫一覧</li>
        </ul>
      </Card>

      <Button fullWidth size="xl" onClick={handleDownload} loading={generating}>
        <FileDown size={20} />
        PDFをダウンロード
      </Button>
    </div>
  );
}
