import { StrictMode, act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, onTestFinished, test } from 'vitest';
import App from '../App.tsx';
import { startSession } from '../startSession.ts';

// React draws twice in development. The game must still start once, and the game on the
// page must be the one that answers a click.
test('App starts one game under StrictMode, and it responds', async () => {
  localStorage.clear();
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  onTestFinished(() => {
    root.unmount();
    host.remove();
    localStorage.clear();
  });
  const session = startSession();
  await act(async () => {
    root.render(
      <StrictMode>
        <App session={session} />
      </StrictMode>
    );
  });
  expect(document.querySelectorAll('#game').length).toBe(1);
  expect(document.querySelectorAll('#newCommanderDiv').length).toBe(1);

  document.getElementById('createCommander')!.click();

  expect(document.querySelectorAll('#systemLandingDiv').length).toBe(1);
  expect(document.getElementById('system-info-welcome')!.textContent).toMatch(/^Welcome to /);
  expect(Object.keys(JSON.parse(localStorage.getItem('games')!)).length).toBe(1);
});
