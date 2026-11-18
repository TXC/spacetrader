import type { ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { onTestFinished } from 'vitest';
import type { Session } from '../../game/session.ts';
import { SessionContext } from '../../ui/useStore.ts';

// Draws a React element into a new element on the page, at once. Both are removed when
// the test finishes, whether it passed or failed. A screen that reads the session is
// given one here; without one the element is drawn as it is, so a test can draw it again.
export function render(element: ReactNode, session?: Session) {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  onTestFinished(() => {
    flushSync(() => root.unmount());
    host.remove();
  });
  const page = session ? <SessionContext value={session}>{element}</SessionContext> : element;
  flushSync(() => root.render(page));
  return { host, root };
}
