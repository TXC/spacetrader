import { createContext, useContext, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import type { Session } from '../game/session.ts';
import { Store } from '../game/Store.ts';

// The recorded tests click and read the page on the next line, so a change must be drawn
// before changed() returns.
Store.flush = flushSync;

// Redraws the component whenever the store changes.
export function useStore<T extends Store>(store: T): T {
  useSyncExternalStore(store.subscribe, () => store.version);
  return store;
}

// The session the page shows. App provides it, once.
export const SessionContext = createContext<Session | null>(null);

// The session, with a redraw whenever it changes.
export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('This part of the page was drawn without a session.');
  return useStore(session);
}
