import { useState } from 'react';
import type { SaleDoc } from '@/types';
import { Card, Badge, Button } from '@/components/common';
import { RoleGuard } from '@/components/layout';
import { formatDateTime, formatYen } from '@/lib/utils';
import { cancelSale, refundSale } from '@/lib/db/sales';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { ReasonModal } from './ReasonModal';

export function SaleHistoryRow({ sale }: { sale: SaleDoc }) {
  const appUser = useAuthStore((s) => s.appUser);
  const showToast = useUiStore((s) => s.showToast);
  const [modal, setModal] = useState<'cancel' | 'refund' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleReasonSubmit = async (reason: string) => {
    if (!appUser) return;
    setSubmitting(true);
    const actor = { uid: appUser.uid, name: appUser.displayName };
    try {
      if (modal === 'cancel') {
        await cancelSale(sale.eventId, sale.id, actor, reason);
        showToast('会計を取消しました', 'success');
      } else if (modal === 'refund') {
        await refundSale(sale.eventId, sale.id, actor, reason);
        showToast('返金処理を記録しました', 'success');
      }
      setModal(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : '処理に失敗しました', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-neutral-400">{formatDateTime(sale.createdAt)}</span>
            {sale.kind === 'loss' && <Badge tone="warn">ロス・試食</Badge>}
            {sale.isCancelled && <Badge tone="danger">取消済み</Badge>}
            {sale.isRefunded && <Badge tone="info">返金済み</Badge>}
          </div>
          <p className="text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
            {sale.items.map((i) => `${i.productName}×${i.quantity}`).join('、')}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-neutral-400">担当: {sale.staffName}</p>
        </div>
        <span className="flex-shrink-0 text-lg font-black text-neutral-900 dark:text-neutral-50">{formatYen(sale.total)}</span>
      </div>

      {sale.kind === 'sale' && !sale.isCancelled && (
        <RoleGuard roles={['admin']}>
          <div className="mt-2.5 flex gap-2 border-t border-neutral-100 pt-2.5 dark:border-neutral-800">
            <Button size="sm" variant="ghost" onClick={() => setModal('cancel')}>
              取消する
            </Button>
            {!sale.isRefunded && (
              <Button size="sm" variant="ghost" onClick={() => setModal('refund')}>
                返金する
              </Button>
            )}
          </div>
        </RoleGuard>
      )}

      <ReasonModal
        open={modal != null}
        title={modal === 'cancel' ? '会計を取消しますか？' : '返金として記録しますか？'}
        onClose={() => setModal(null)}
        onSubmit={handleReasonSubmit}
        submitting={submitting}
        danger={modal === 'cancel'}
      />
    </Card>
  );
}
