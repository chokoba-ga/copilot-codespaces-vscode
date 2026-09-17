import { useMemo, useState } from 'react';
import { Plus, PartyPopper } from 'lucide-react';
import { useEventStore } from '@/stores/eventStore';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { createEvent, updateEvent, deleteEvent, duplicateEvent } from '@/lib/db/events';
import type { EventDoc } from '@/types';
import { Button, EmptyState, FullScreenSpinner, ConfirmDialog } from '@/components/common';
import { RoleGuard, OfflineBanner, TopBar } from '@/components/layout';
import { EventCard } from '@/components/events/EventCard';
import { EventFormModal } from '@/components/events/EventFormModal';
import { DuplicateEventModal } from '@/components/events/DuplicateEventModal';

export function EventListPage() {
  const events = useEventStore((s) => s.events);
  const loaded = useEventStore((s) => s.loaded);
  const appUser = useAuthStore((s) => s.appUser);
  const showToast = useUiStore((s) => s.showToast);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EventDoc | null>(null);
  const [dupTarget, setDupTarget] = useState<EventDoc | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sorted = useMemo(() => [...events].sort((a, b) => b.updatedAt - a.updatedAt), [events]);

  if (!appUser) return <FullScreenSpinner label="ユーザー情報を読み込み中…" />;

  const actor = { uid: appUser.uid, name: appUser.displayName };

  const handleCreateOrUpdate = async (data: { name: string; description: string; days: EventDoc['days'] }) => {
    try {
      if (editTarget) {
        await updateEvent(editTarget.id, data, actor);
        showToast('イベントを更新しました', 'success');
      } else {
        await createEvent({ ...data, actorUid: actor.uid, actorName: actor.name });
        showToast('イベントを作成しました', 'success');
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : '保存に失敗しました', 'error');
      throw e;
    }
  };

  const handleDuplicate = async (newName: string) => {
    if (!dupTarget) return;
    try {
      await duplicateEvent(dupTarget.id, newName, actor);
      showToast('イベントを複製しました', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : '複製に失敗しました', 'error');
      throw e;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEvent(deleteTarget.id, actor);
      showToast('イベントを削除しました', 'success');
      setDeleteTarget(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : '削除に失敗しました', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto flex h-dvh max-w-lg flex-col bg-neutral-50 dark:bg-neutral-950">
      <OfflineBanner />
      <TopBar backTo="/events" />

      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-black text-neutral-900 dark:text-neutral-50">イベント一覧</h1>
          <RoleGuard roles={['admin']}>
            <Button
              size="sm"
              onClick={() => {
                setEditTarget(null);
                setFormOpen(true);
              }}
            >
              <Plus size={16} /> 新規作成
            </Button>
          </RoleGuard>
        </div>

        {!loaded ? (
          <FullScreenSpinner label="読み込み中…" />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={<PartyPopper size={26} />}
            title="イベントがまだありません"
            description="工業祭・文化祭・体育祭など、行事ごとにイベントを作成して会計を管理できます。"
            action={
              <RoleGuard roles={['admin']}>
                <Button className="mt-2" onClick={() => setFormOpen(true)}>
                  <Plus size={16} /> 最初のイベントを作成
                </Button>
              </RoleGuard>
            }
          />
        ) : (
          <div className="space-y-3">
            {sorted.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={() => {
                  setEditTarget(event);
                  setFormOpen(true);
                }}
                onDuplicate={() => setDupTarget(event)}
                onDelete={() => setDeleteTarget(event)}
              />
            ))}
          </div>
        )}
      </main>

      <EventFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initial={editTarget}
      />
      <DuplicateEventModal
        open={Boolean(dupTarget)}
        source={dupTarget}
        onClose={() => setDupTarget(null)}
        onSubmit={handleDuplicate}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="イベントを削除しますか？"
        description={`「${deleteTarget?.name}」を削除します。売上・支出などのデータは保持されますが、一覧には表示されなくなります。`}
        danger
        confirmLabel="削除する"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
