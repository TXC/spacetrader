// Flow tests: each replays a recorded play session by clicking the recorded elements, then
// checks what the player sees and what the game holds. Converted from the original
// project's UnitTests.js; the recordings and expected values are unchanged.
import { test } from 'vitest';
import { GameRand } from '../../game/GameRand.ts';
import { addToOrderedSet } from '../../game/opponent/build.ts';
import { ShipModelType } from '../../game/Ship.ts';
import { assertEqualArrays } from './harness.ts';

// GameRand

test('randomInt', () => {
  const r = new GameRand(1);
  //              0  1  2  3  4  5  6  7  8  9 10 11
  const observed = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const expected = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0];
  for (let i = 0; i < 100; ++i) {
    const v = r.randomInt(0, 10);
    observed[v] = 1;
  }

  assertEqualArrays(observed, expected);
});

test('addToOrderedSet', () => {
  const arr = [ShipModelType.Flea, ShipModelType.Firefly];
  addToOrderedSet(arr, ShipModelType.Flea);
  addToOrderedSet(arr, ShipModelType.Gnat);
  addToOrderedSet(arr, ShipModelType.Firefly);
  addToOrderedSet(arr, ShipModelType.Beetle);
  assertEqualArrays(arr, [
    ShipModelType.Flea,
    ShipModelType.Firefly,
    ShipModelType.Gnat,
    ShipModelType.Beetle,
  ]);
});
