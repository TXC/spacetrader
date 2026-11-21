import { expect, onTestFinished, test, vi } from 'vitest';
import { ActionLogger } from '../game/ActionLogger.ts';
import { DebugMode } from '../game/debug.ts';
import { runtime } from '../game/runtime.ts';
import { Session } from '../game/session.ts';
import { debugModeFor } from '../startSession.ts';
import { DebugPanel } from '../ui/DebugPanel.tsx';
import { runReplayLog } from './flows/harness.ts';
import { render } from './support/render.tsx';

test('debug mode is on only when the address asks for it', () => {
  expect(debugModeFor('')).toBe(DebugMode.Disabled);
  expect(debugModeFor('?other=1')).toBe(DebugMode.Disabled);
  expect(debugModeFor('?debug')).toBe(DebugMode.Alert);
});

test('the debug panel shows the action log as it grows, and copies it', () => {
  const log = '{"idLog":["createCommander"],"eventNameLog":["click"],"gameRandSeed":1733543535142}';
  const { session } = runReplayLog(log);
  document.getElementById('cheats')!.remove();
  onTestFinished(() =>
    document.body.insertAdjacentHTML('beforeend', '<div id="cheats" class="hidden"></div>')
  );
  const copied = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  const { host } = render(<DebugPanel />, session);

  expect(host.querySelector('#cheats')).toBeNull();
  host.querySelector<HTMLElement>('#showCheats')!.click();
  host.querySelector<HTMLElement>('#cheat_freeMoney')!.click();

  expect(session.game!.commander.credits).toBe(1000000);
  const shown = host.querySelector('#debugLog')!.textContent;
  expect(JSON.parse(shown).idLog).toEqual(['createCommander', 'cheat_freeMoney']);

  host.querySelector<HTMLElement>('#copyActionLog')!.click();
  expect(copied).toHaveBeenCalledWith(shown);
});

test('shows the game state when asked', () => {
  const log = '{"idLog":["createCommander"],"eventNameLog":["click"],"gameRandSeed":1733543535142}';
  const { session } = runReplayLog(log);
  const { host } = render(<DebugPanel />, session);
  expect(host.querySelector('#gameState')).toBeNull();

  host.querySelector<HTMLElement>('#showGameState')!.click();

  const names = [...host.querySelectorAll('#gameState summary')].map(name => name.textContent);
  expect(names[0]).toBe('game');
});

test('says when there is no game yet', () => {
  runtime.actionLog = new ActionLogger(1);
  const { host } = render(<DebugPanel />, new Session());

  host.querySelector<HTMLElement>('#showGameState')!.click();

  expect(host.querySelector('#gameState')!.textContent).toBe('No game yet.');
});
