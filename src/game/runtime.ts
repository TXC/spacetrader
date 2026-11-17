import type { GameRand } from './GameRand.ts';
import type { ActionLogger } from './ActionLogger.ts';
import type { MockLocalStorage } from './Utilities.ts';

// The old pages kept these as globals; the host fills them in before the game starts,
// so the object starts empty.
export const runtime = {} as {
  gameRand: GameRand;
  actionLog: ActionLogger;
  stLocalStorage: Storage | MockLocalStorage;
  debugMode: number;
};
