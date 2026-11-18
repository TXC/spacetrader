import { afterEach, expect, test, vi } from 'vitest';
import { runtime } from '../game/runtime.ts';
import { runReplayLog } from './flows/harness.ts';
import { button, encounterBox, textOf } from './support/page.ts';

afterEach(() => vi.useRealTimers());

// A recording runs the rounds of an auto-attack at once. In real play they come 1.5
// seconds apart, from a timer and not from a click, and the screen must follow.
test('in real play, each auto-attack round updates the screen without a click', () => {
  const log =
    '{"idLog":["createCommander","Warp"],"eventNameLog":["click","click"],"gameRandSeed":1734746929683}';
  const replay = runReplayLog(log);
  replay.replayEvent('warpBlastOff');
  replay.replayEvent('ecButton_Attack');
  replay.replayEvent('alertButton_Attack');
  vi.useFakeTimers();
  runtime.actionLog.replayInProgress = false;

  document.getElementById('ecButton_Auto_Attack')!.click();
  const afterFirstRound = textOf(encounterBox());
  const draws = runtime.gameRand._numInvocations;
  expect(button('Interrupt')).not.toBeNull();

  vi.advanceTimersByTime(1500);

  expect(runtime.gameRand._numInvocations).toBeGreaterThan(draws);
  expect(textOf(encounterBox())).not.toBe(afterFirstRound);
});
