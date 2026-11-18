import type { ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { onTestFinished } from 'vitest';

// Draws a React element into a new element on the page, at once. Both are removed when
// the test finishes, whether it passed or failed.
export function render(element: ReactNode) {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  onTestFinished(() => {
    flushSync(() => root.unmount());
    host.remove();
  });
  flushSync(() => root.render(element));
  return { host, root };
}
