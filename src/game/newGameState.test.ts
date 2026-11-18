import { expect, test } from 'vitest';
import { newGame } from '../tests/support/newGame.ts';
import { runtime } from './runtime.ts';
import { Difficulty } from './SolarSystem.types.ts';
import pinned from './newGameState.json';

// What a new game holds, and how many random numbers making it took. newGameState.json
// holds the values from before the model classes were rebuilt; a difference means a new
// game is no longer the same galaxy for the same seed.
async function newGameFingerprint(difficulty: Difficulty) {
  const game = newGame(difficulty);
  // Left out: lastSave is the time of day, and uniqueID is random without a seed.
  const state = { ...game.toState(), lastSave: undefined, uniqueID: undefined };
  const bytes = new TextEncoder().encode(JSON.stringify(state));
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  const sha256 = Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('');
  return { sha256, draws: runtime.gameRand._numInvocations };
}

test.each(Object.entries(Difficulty))(
  'a new %s game is the same as before',
  async (name, difficulty) => {
    expect(await newGameFingerprint(difficulty)).toEqual(pinned[name as keyof typeof pinned]);
  }
);
