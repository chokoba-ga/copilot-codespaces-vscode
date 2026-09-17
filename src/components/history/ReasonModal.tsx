import { useState } from 'react';
import { Modal, Button } from '@/components/common';

export function ReasonModal({
  open,
  title,
  onClose,
  onSubmit,
  submitting,
  danger,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  submitting?: boolean;
  danger?: boolean;
}) {
  const [reason, setReason] = useState('');

  return (
    <Modal open={open} onClose={onClose} title={title} sheet={false} maxWidthClass="max-w-sm">
      <div className="space-y-4">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="理由（例：商品の押し間違い）"
          className="h-24 w-full resize-none rounded-2xl border border-neutral-200 px-3.5 py-2.5 text-sm font-medium focus:border-brand-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
        />
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={submitting}>
            キャンセル
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} fullWidth loading={submitting} onClick={() => void onSubmit(reason)}>
            実行する
          </Button>
        </div>
      </div>
    </Modal>
  );
}
