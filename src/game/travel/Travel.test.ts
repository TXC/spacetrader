import { expect, test, vi } from 'vitest';
import { tripFor } from '../../tests/support/encounters.ts';
import { newGame } from '../../tests/support/newGame.ts';

test('a trip started twice is made once', () => {
  const game = newGame();
  game.commander.travelClicksRemaining = 0;
  const arrival = vi.spyOn(game, 'handleArrival');
  const { travel } = tripFor(game);

  travel.start();
  travel.start();

  expect(arrival).toHaveBeenCalledTimes(1);
});

test('stopping an old progress watcher leaves the new one watching', () => {
  const { travel } = tripFor(newGame());
  const older = vi.fn();
  const newer = vi.fn();
  const stopOlder = travel.watchProgress(older);
  travel.watchProgress(newer);

  stopOlder();
  travel._setProgress(0.5);

  expect(newer).toHaveBeenCalledWith(0.5);
  expect(older).not.toHaveBeenCalled();
});
