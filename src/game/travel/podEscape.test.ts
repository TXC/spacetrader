import { expect, test } from 'vitest';
import { dismissAll, tripFor } from '../../tests/support/encounters.ts';
import { newGame } from '../../tests/support/newGame.ts';
import type { Game } from '../Game.ts';
import { ShipModelType } from '../Ship.ts';
import { JaporiQuestStatus, JarekQuestStatus } from '../SolarSystem.types.ts';
import { podEscape } from './podEscape.ts';

// The ship is lost and the pod carries the commander on. Returns the messages shown.
function escape(game: Game): string[] {
  const { travel, done } = tripFor(game);
  podEscape(travel);
  const messages = dismissAll();
  expect(done).toHaveBeenCalledWith('arrived');
  expect(game.commander.ship.type).toBe(ShipModelType.Flea);
  return messages;
}

test.each([
  [
    'the Japori antidote is lost',
    (game: Game) => (game.japoriQuestStatus = JaporiQuestStatus.HasMedicine),
    'The antidote for the Japori system was destroyed with your ship. Fortunately, they probably have some new antidote in the system where you originally got it.',
    (game: Game) => expect(game.japoriQuestStatus).toBe(JaporiQuestStatus.Open),
  ],
  [
    'the artifact is lost',
    (game: Game) => (game.commander.artifactOnBoard = true),
    "You couldn't take the artifact with you in the escape pod, so now it's lost in the wreckage. The aliens will probably pick it up there.",
    (game: Game) => expect(game.commander.artifactOnBoard).toBe(false),
  ],
  [
    'Jarek is taken home',
    (game: Game) => (game.jarekStatus = JarekQuestStatus.OnBoard),
    'The Space Corps decides to give ambassador Jarek a lift home to Devidia.',
    (game: Game) => expect(game.jarekStatus).toBe(JarekQuestStatus.Closed),
  ],
  [
    'the tribbles die',
    (game: Game) => (game.commander.ship.tribbles = 50),
    'Your tribbles all died in the explosion.',
    (game: Game) => expect(game.commander.ship.tribbles).toBe(0),
  ],
])('in the escape pod, %s', (_, setUp, message, check) => {
  const game = newGame();
  setUp(game);

  expect(escape(game)).toContain(message);
  check(game);
});

test('in the escape pod, nothing is lost that was not aboard', () => {
  const messages = escape(newGame());

  expect(messages).toHaveLength(2); // ejected, and the pod made into a Flea
});
