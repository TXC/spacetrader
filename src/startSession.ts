import { ActionLogger } from './game/ActionLogger.ts';
import { GameRand } from './game/GameRand.ts';
import { runtime } from './game/runtime.ts';
import { Session } from './game/session.ts';
import { browserStorage } from './game/storage.ts';
import { DebugMode } from './game/debug.ts';

// Debug mode is asked for in the address, as in /?debug. It shows the debug panel and
// reports errors in the rules as alerts.
export function debugModeFor(search: string): DebugMode {
  return new URLSearchParams(search).has('debug') ? DebugMode.Alert : DebugMode.Disabled;
}

// Sets up what the game needs and starts it, loading a saved game if there is one.
// Call once, before anything is drawn.
export function startSession(): Session {
  const randSeed = Date.now();
  runtime.debugMode = debugModeFor(location.search);
  runtime.gameRand = new GameRand(randSeed);
  runtime.actionLog = new ActionLogger(randSeed);
  runtime.stLocalStorage = browserStorage();
  const session = new Session();
  session.start();
  return session;
}
