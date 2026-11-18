import type { GameRand } from './GameRand.ts';
import type { ActionLogger } from './ActionLogger.ts';
import type { GameStorage } from './storage.ts';

// The old pages kept these as globals; the host fills them in before the game starts,
// so the object starts empty.
export const runtime = {} as {
  gameRand: GameRand;
  actionLog: ActionLogger;
  stLocalStorage: GameStorage;
  debugMode: number;
};
