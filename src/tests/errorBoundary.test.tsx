import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { expect, onTestFinished, test, vi } from 'vitest';
import { ErrorBoundary } from '../ui/ErrorBoundary.tsx';
import { textOf } from './support/page.ts';

function Broken(): never {
  throw new Error('This screen cannot be drawn.');
}

test('when a screen fails to draw, a message and a reload button are shown', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host, { onCaughtError: () => {} });
  onTestFinished(() => {
    root.unmount();
    host.remove();
  });

  flushSync(() =>
    root.render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>
    )
  );

  expect(textOf(host.querySelector('[role="alert"] p'))).toBe(
    'Something went wrong. Reload the page to continue from your last saved game.'
  );
  expect(textOf(host.querySelector('button'))).toBe('Reload');
});
