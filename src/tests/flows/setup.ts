// Set-up and clean-up shared by every browser test. vite.config.ts runs it before each
// test file.
import { afterAll, afterEach, beforeAll, expect, type RunnerTestSuite } from 'vitest';
import { AlertViewController } from '../../game/alerts.ts';
import { runtime } from '../../game/runtime.ts';
import { DebugMode, pLog } from '../../game/Utilities.ts';
import { unmountAll } from './harness.ts';
import knownMissing from './probes.json';

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

// ---- coverage probes ---------------------------------------------------------------------

// probes.json lists, for each flow test file, the probes (`pLog.log(n)` in the rules) that
// the file does not reach. A file fails when it stops reaching a probe, and when it reaches
// a new one: then update its list.
function allPassed(suite: RunnerTestSuite): boolean {
  return suite.tasks.every(task =>
    task.type === 'suite' ? allPassed(task) : task.result?.state === 'pass'
  );
}

// A hook that runs after all tests is not told its file in a way lint accepts, so keep it
// from the tests.
let file: RunnerTestSuite | undefined;
afterEach(({ task }) => {
  file = task.file;
});

afterAll(() => {
  const known = file && (knownMissing as Record<string, number[]>)[file.name];
  // A run of only some of the tests, or with a failed test, reaches fewer probes; a stress
  // test with another seed reaches other ones.
  if (!file || !known || !allPassed(file) || import.meta.env.STRESS_SEED) return;
  const missing = pLog.missingProbes();
  const noLongerReached = missing.filter(probe => !known.includes(probe));
  const newlyReached = known.filter(probe => !missing.includes(probe));
  expect({ noLongerReached, newlyReached }).toEqual({ noLongerReached: [], newlyReached: [] });
});
