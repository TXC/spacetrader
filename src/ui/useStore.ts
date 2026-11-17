import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { session } from '../game/session.ts';
import { Store } from '../game/Store.ts';

// The recorded tests click and read the page on the next line, so a change must be drawn
// before changed() returns.
Store.flush = flushSync;

// Redraws the component whenever the store changes.
export function useStore<T extends Store>(store: T): T {
  useSyncExternalStore(store.subscribe, () => store.version);
  return store;
}

export function useSession() {
  return useStore(session);
}
