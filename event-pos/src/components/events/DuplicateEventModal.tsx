import { useEffect, useState } from 'react';
import { Modal, Button, TextField } from '@/components/common';
import type { EventDoc } from '@/types';

export function DuplicateEventModal({
  open,
  onClose,
  onSubmit,
  source,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (newName: string) => Promise<void>;
  source: EventDoc | null;
}) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && source) setName(`${source.name}のコピー`);
  }, [open, source]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(name.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="イベントを複製" sheet={false} maxWidthClass="max-w-sm">
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          商品・カテゴリー・設定のみコピーされます。売上・支出・履歴はコピーされません。
        </p>
        <TextField label="新しいイベント名" required value={name} onChange={(e) => setName(e.target.value)} />
        <Button fullWidth size="lg" onClick={handleSubmit} loading={submitting} disabled={!name.trim()}>
          複製を作成
        </Button>
      </div>
    </Modal>
  );
}
