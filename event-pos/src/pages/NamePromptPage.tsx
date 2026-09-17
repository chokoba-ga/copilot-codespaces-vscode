import { useState, type FormEvent } from 'react';
import { ReceiptText } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button, TextField } from '@/components/common';
import { StaffQuickPicker } from '@/components/settings/StaffQuickPicker';

export function NamePromptPage() {
  const setDisplayName = useAuthStore((s) => s.setDisplayName);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e?: FormEvent, overrideName?: string) => {
    e?.preventDefault();
    const target = (overrideName ?? name).trim();
    if (!target) return;
    setSubmitting(true);
    try {
      await setDisplayName(target);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-white px-6 dark:from-neutral-950 dark:to-neutral-950">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-brand-600 text-white shadow-[var(--shadow-soft-lg)]">
          <ReceiptText size={30} />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-black text-neutral-900 dark:text-neutral-50">Event POS</h1>
          <p className="text-sm font-semibold text-neutral-400">学校イベント専用の会計アプリ</p>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-5">
        <StaffQuickPicker onPick={(n) => void handleSubmit(undefined, n)} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            label="あなたの名前（またはニックネーム）"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例）田中"
            hint="会計・支出の記録に「担当者」として表示されます。ログイン用のパスワードは不要です。"
            required
          />
          <Button type="submit" size="xl" fullWidth loading={submitting} disabled={!name.trim()}>
            はじめる
          </Button>
        </form>
      </div>
    </div>
  );
}
