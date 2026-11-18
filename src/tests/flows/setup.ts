// Set-up and clean-up shared by every browser test. vite.config.ts runs it before each
// test file.
import { afterEach, beforeAll } from 'vitest';
import { AlertViewController } from '../../game/alerts.ts';
import { runtime } from '../../game/runtime.ts';
import { DebugMode } from '../../game/Utilities.ts';
import { unmountAll } from './harness.ts';

// An error thrown inside a click handler goes to the window, not to the test that clicked.
// Keep it and fail that test.
let handlerError: unknown = null;

beforeAll(() => {
  document.body.insertAdjacentHTML(
    'beforeend',
    '<div id="game"></div><div id="cheats" hidden></div>'
  );
  runtime.debugMode = DebugMode.Assert;
  window.addEventListener('error', event => {
    handlerError ??= event.error ?? event.message;
  });
});

afterEach(() => {
  let error: unknown;
  try {
    unmountAll();
    document.getElementById('game')!.innerHTML = '';
    AlertViewController.clearAlerts();
  } finally {
    // Read after the clean-up, so an error from unmounting fails this test, not the next.
    error = handlerError;
    handlerError = null;
  }
  if (error) throw error;
});
