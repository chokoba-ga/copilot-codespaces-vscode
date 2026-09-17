import { useState } from 'react';
import type { ProductDoc } from '@/types';
import { Modal, Button, SelectField } from '@/components/common';
import { QuantityStepper } from './QuantityStepper';
import { submitSale } from '@/lib/db/sales';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

export function LossModal({
  open,
  onClose,
  eventId,
  dayId,
  products,
}: {
  open: boolean;
  onClose: () => void;
  eventId: string;
  dayId: string;
  products: ProductDoc[];
}) {
  const active = products.filter((p) => p.isActive && p.currentStock > 0);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const appUser = useAuthStore((s) => s.appUser);
  const showToast = useUiStore((s) => s.showToast);

  const selected = active.find((p) => p.id === productId) ?? active[0];

  const handleSubmit = async () => {
    if (!selected || !appUser || !dayId) return;
    setSubmitting(true);
    try {
      await submitSale({
        eventId,
        dayId,
        kind: 'loss',
        lines: [{ product: selected, quantity }],
        receivedAmount: null,
        staffUid: appUser.uid,
        staffName: appUser.displayName,
        note: 'ロス・試食登録',
      });
      showToast('ロス・試食を登録しました', 'success');
      setQuantity(1);
      onClose();
    } catch (e) {
      showToast(e instanceof Error ? e.message : '登録に失敗しました', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="ロス・試食を登録" sheet={false} maxWidthClass="max-w-sm">
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          売上に計上せず、在庫だけを減らします。試食・破損・配布などに使用してください。
        </p>
        {active.length === 0 ? (
          <p className="text-sm font-bold text-neutral-400">在庫のある商品がありません</p>
        ) : (
          <>
            <SelectField
              label="商品"
              value={selected?.id}
              onChange={(e) => {
                setProductId(e.target.value);
                setQuantity(1);
              }}
            >
              {active.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}（残{p.currentStock}）
                </option>
              ))}
            </SelectField>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-neutral-600 dark:text-neutral-300">数量</span>
              <QuantityStepper value={quantity} onChange={setQuantity} min={1} max={selected?.currentStock ?? 1} />
            </div>
            <Button fullWidth size="lg" variant="danger" onClick={handleSubmit} loading={submitting}>
              ロス・試食として登録
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
