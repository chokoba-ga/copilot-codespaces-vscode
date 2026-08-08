import { useMemo, useState } from 'react';
import { Trash2, Banknote } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { submitSale } from '@/lib/db/sales';
import { formatYen } from '@/lib/utils';
import { Modal, Button } from '@/components/common';
import { QuantityStepper } from './QuantityStepper';

const QUICK_CASH = [1000, 2000, 5000, 10000];

export function CheckoutSheet({
  open,
  onClose,
  eventId,
  dayId,
}: {
  open: boolean;
  onClose: () => void;
  eventId: string;
  dayId: string;
}) {
  const lines = useCartStore((s) => s.linesArray());
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const totalAmount = useCartStore((s) => s.totalAmount());
  const appUser = useAuthStore((s) => s.appUser);
  const showToast = useUiStore((s) => s.showToast);

  const [received, setReceived] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  const change = useMemo(() => {
    if (received === '' || received < totalAmount) return null;
    return received - totalAmount;
  }, [received, totalAmount]);

  const handleConfirm = async () => {
    if (!appUser || lines.length === 0 || !dayId) return;
    setSubmitting(true);
    try {
      await submitSale({
        eventId,
        dayId,
        kind: 'sale',
        lines,
        receivedAmount: received === '' ? null : received,
        staffUid: appUser.uid,
        staffName: appUser.displayName,
      });
      showToast('会計が完了しました', 'success');
      clear();
      setReceived('');
      onClose();
    } catch (e) {
      showToast(e instanceof Error ? e.message : '会計に失敗しました', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="会計">
      <div className="space-y-5">
        <div className="space-y-2.5">
          {lines.map((line) => (
            <div key={line.product.id} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-neutral-800 dark:text-neutral-100">
                  {line.product.name}
                </p>
                <p className="text-xs font-semibold text-neutral-400">{formatYen(line.product.price)}</p>
              </div>
              <QuantityStepper
                value={line.quantity}
                max={line.quantity + line.product.currentStock}
                onChange={(v) => setQuantity(line.product.id, v)}
              />
              <button
                onClick={() => remove(line.product.id)}
                aria-label="削除"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-neutral-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-dashed border-neutral-200 pt-4 dark:border-neutral-700">
          <span className="text-[15px] font-bold text-neutral-500">合計</span>
          <span className="text-2xl font-black text-neutral-900 dark:text-neutral-50">
            {formatYen(totalAmount)}
          </span>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-neutral-600 dark:text-neutral-300">
            <Banknote size={15} /> お預かり金額（任意）
          </p>
          <div className="mb-2 grid grid-cols-4 gap-2">
            {QUICK_CASH.map((v) => (
              <button
                key={v}
                onClick={() => setReceived(v)}
                className="rounded-xl bg-neutral-100 py-2 text-xs font-black text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
              >
                {v.toLocaleString()}
              </button>
            ))}
          </div>
          <input
            type="number"
            inputMode="numeric"
            value={received}
            onChange={(e) => setReceived(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="ちょうど（未入力でも会計できます）"
            className="h-11 w-full rounded-2xl border border-neutral-200 px-3.5 text-[15px] font-bold focus:border-brand-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
          />
          {change != null && (
            <p className="mt-2 text-right text-[15px] font-black text-brand-600">
              おつり {formatYen(change)}
            </p>
          )}
        </div>

        <Button
          fullWidth
          size="xl"
          onClick={handleConfirm}
          loading={submitting}
          disabled={lines.length === 0}
        >
          会計を確定する
        </Button>
      </div>
    </Modal>
  );
}
