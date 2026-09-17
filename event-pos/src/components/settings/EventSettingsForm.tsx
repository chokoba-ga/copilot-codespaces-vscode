import { useEffect, useState } from 'react';
import type { EventDoc, EventSettings } from '@/types';
import { updateEvent } from '@/lib/db/events';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { Button, TextField, NumberField, Card } from '@/components/common';

export function EventSettingsForm({ event }: { event: EventDoc }) {
  const appUser = useAuthStore((s) => s.appUser);
  const showToast = useUiStore((s) => s.showToast);
  const [settings, setSettings] = useState<EventSettings>(event.settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => setSettings(event.settings), [event.settings]);

  const handleSave = async () => {
    if (!appUser) return;
    setSaving(true);
    try {
      await updateEvent(event.id, { settings }, { uid: appUser.uid, name: appUser.displayName });
      showToast('設定を保存しました', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : '保存に失敗しました', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="space-y-4 p-4">
      <p className="text-sm font-black text-neutral-700 dark:text-neutral-200">イベント設定</p>
      <TextField
        label="学校・団体名（PDFに記載）"
        value={settings.organizationName}
        onChange={(e) => setSettings((s) => ({ ...s, organizationName: e.target.value }))}
        placeholder="例）○○県立○○高等学校"
      />
      <TextField
        label="会計責任者名（PDFに記載）"
        value={settings.representativeName}
        onChange={(e) => setSettings((s) => ({ ...s, representativeName: e.target.value }))}
        placeholder="例）会計担当 山田太郎"
      />
      <NumberField
        label="補助費・初期資金"
        suffix="円"
        min={0}
        value={settings.subsidyAmount}
        onChange={(v) => setSettings((s) => ({ ...s, subsidyAmount: v }))}
        hint="学校から事前にもらった資金など。売上とは別にダッシュボード・PDFに表示されます"
      />
      <NumberField
        label="在庫不足とみなす残数"
        suffix="個以下"
        min={0}
        value={settings.lowStockThreshold}
        onChange={(v) => setSettings((s) => ({ ...s, lowStockThreshold: v }))}
        hint="ダッシュボードの「在庫アラート」に表示されるしきい値です"
      />
      <Button onClick={handleSave} loading={saving} size="md">
        設定を保存
      </Button>
    </Card>
  );
}
