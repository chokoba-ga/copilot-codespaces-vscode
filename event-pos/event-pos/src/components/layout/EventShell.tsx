import { Outlet, useParams } from 'react-router-dom';
import { useEventStore } from '@/stores/eventStore';
import { useEventData } from '@/hooks/useEventData';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { OfflineBanner } from './OfflineBanner';
import { FullScreenSpinner } from '@/components/common';

export function EventShell() {
  const { eventId } = useParams<{ eventId: string }>();
  useEventData(eventId);
  const event = useEventStore((s) => s.currentEvent());
  const loaded = useEventStore((s) => s.loaded);

  return (
    <div className="mx-auto flex h-dvh max-w-lg flex-col bg-neutral-50 dark:bg-neutral-950">
      <OfflineBanner />
      <TopBar event={event} />
      <main className="flex-1 overflow-y-auto">
        {!loaded ? <FullScreenSpinner label="読み込み中…" /> : <Outlet context={{ event }} />}
      </main>
      <BottomNav />
    </div>
  );
}
