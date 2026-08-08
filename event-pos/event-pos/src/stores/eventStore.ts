import { create } from 'zustand';
import { subscribeEvents } from '@/lib/db/events';
import type { EventDoc } from '@/types';

interface EventState {
  events: EventDoc[];
  loaded: boolean;
  currentEventId: string | null;
  setCurrentEventId: (id: string | null) => void;
  currentEvent: () => EventDoc | null;
}

let unsubscribe: (() => void) | null = null;

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  loaded: false,
  currentEventId: null,
  setCurrentEventId: (id) => set({ currentEventId: id }),
  currentEvent: () => get().events.find((e) => e.id === get().currentEventId) ?? null,
}));

export function initEventListener(): () => void {
  unsubscribe?.();
  unsubscribe = subscribeEvents((events) => {
    useEventStore.setState({ events, loaded: true });
  });
  return unsubscribe;
}
