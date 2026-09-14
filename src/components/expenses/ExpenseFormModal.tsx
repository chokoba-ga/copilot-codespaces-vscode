import { useEffect, useState } from 'react';
import type { EventDay, ExpenseCategory, ExpenseDoc } from '@/types';
import { EXPENSE_CATEGORIES } from '@/types';
import { Modal, Button, NumberField, SelectField, TextAreaField, TextField } from '@/components/common';
import { todayStr } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    date: string;
    amount: number;
    category: ExpenseCategory;
    description: string;
    note: string;
    dayId: string | null;
  }) => Promise<void>;
  initial?: ExpenseDoc | null;
  days: EventDay[];
}

export function ExpenseFormModal({ open, onClose, onSubmit, initial, days }: Props) {
  const [date, setDate] = useState(todayStr());
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<ExpenseCategory>('材料');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [dayId, setDayId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(initial?.date ?? todayStr());
    setAmount(initial?.amount ?? 0);
    setCategory(initial?.category ?? '材料');
    setDescription(initial?.description ?? '');
    setNote(initial?.note ?? '');
    setDayId(initial?.dayId ?? '');
  }, [open, initial]);

  const handleSubmit = async () => {
    if (!description.trim() || amount <= 0) return;
    setSubmitting(true);
    try {
      await onSubmit({ date, amount, category, description: description.trim(), note: note.trim(), dayId: dayId || null });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? '支出を編集' : '支出を登録'}>
      <div className="space-y-4">
        <TextField label="日付" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        <TextField
          label="内容"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="例）装飾用の折り紙・リボン"
        />
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="金額" required suffix="円" min={0} value={amount} onChange={setAmount} />
          <SelectField label="カテゴリ" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectField>
        </div>
        {days.length > 0 && (
          <SelectField label="イベント日（任意）" value={dayId} onChange={(e) => setDayId(e.target.value)}>
            <option value="">指定しない</option>
            {days.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </SelectField>
        )}
        <TextAreaField label="メモ（任意）" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button fullWidth size="lg" onClick={handleSubmit} loading={submitting} disabled={!description.trim() || amount <= 0}>
          保存する
        </Button>
      </div>
    </Modal>
  );
}
