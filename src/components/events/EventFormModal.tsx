import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { EventDay, EventDoc } from '@/types';
import { Modal, Button, TextField, TextAreaField } from '@/components/common';
import { generateId } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; days: EventDay[] }) => Promise<void>;
  initial?: EventDoc | null;
}

function newDay(order: number): EventDay {
  const d = new Date();
  d.setDate(d.getDate() + order);
  return {
    id: generateId(),
    label: `${order + 1}日目`,
    date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    order,
  };
}

export function EventFormModal({ open, onClose, onSubmit, initial }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState<EventDay[]>([newDay(0)]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setDescription(initial.description);
      setDays(initial.days.length ? initial.days : [newDay(0)]);
    } else {
      setName('');
      setDescription('');
      setDays([newDay(0)]);
    }
  }, [open, initial]);

  const addDay = () => setDays((d) => [...d, newDay(d.length)]);
  const removeDay = (id: string) => setDays((d) => d.filter((x) => x.id !== id).map((x, i) => ({ ...x, order: i })));
  const updateDay = (id: string, patch: Partial<EventDay>) =>
    setDays((d) => d.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const handleSubmit = async () => {
    if (!name.trim() || days.length === 0) return;
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim(), days });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'イベントを編集' : '新しいイベントを作成'}>
      <div className="space-y-5">
        <TextField
          label="イベント名"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例）第75回工業祭"
        />
        <TextAreaField
          label="説明（任意）"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="イベントの概要やメモ"
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13px] font-bold text-neutral-600 dark:text-neutral-300">
              開催日程（1〜自由な日数）
            </span>
            <button
              onClick={addDay}
              className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-300"
            >
              <Plus size={14} /> 日を追加
            </button>
          </div>
          <div className="space-y-2">
            {days.map((day, i) => (
              <div
                key={day.id}
                className="flex items-center gap-2 rounded-2xl border border-neutral-200 p-2.5 dark:border-neutral-700"
              >
                <span className="w-14 flex-shrink-0 text-center text-xs font-black text-neutral-400">
                  Day{i + 1}
                </span>
                <input
                  value={day.label}
                  onChange={(e) => updateDay(day.id, { label: e.target.value })}
                  placeholder="表示名（例：1日目）"
                  className="h-10 w-24 flex-shrink-0 rounded-xl border border-neutral-200 px-2.5 text-sm font-semibold focus:border-brand-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                />
                <input
                  type="date"
                  value={day.date}
                  onChange={(e) => updateDay(day.id, { date: e.target.value })}
                  className="h-10 flex-1 rounded-xl border border-neutral-200 px-2.5 text-sm font-semibold focus:border-brand-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                />
                {days.length > 1 && (
                  <button
                    onClick={() => removeDay(day.id)}
                    aria-label="この日を削除"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <Button fullWidth size="lg" onClick={handleSubmit} loading={submitting} disabled={!name.trim()}>
          {initial ? '保存する' : '作成する'}
        </Button>
      </div>
    </Modal>
  );
}
