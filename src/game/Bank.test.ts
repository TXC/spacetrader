import { beforeEach, expect, test } from 'vitest';
import { borrow, borrowable, payBack, steps, toggleInsurance } from './Bank.ts';
import { Commander } from './Commander.ts';
import { Game } from './Game.ts';
import { GameRand } from './GameRand.ts';
import { runtime } from './runtime.ts';
import { DebugMode } from './ensure.ts';

let game: Game;

beforeEach(() => {
  runtime.debugMode = DebugMode.Assert;
  runtime.gameRand = new GameRand(1);
  const commander = new Commander('Tester', 5, 5, 5, 5);
  commander.setReserveMoney(true);
  commander.setDifficulty(2);
  game = new Game(2, commander);
});

test('steps offers a small, a medium and the full amount', () => {
  expect(steps(1000)).toEqual({ tiny: 20, medium: 100, max: 1000 });
  expect(steps(40)).toEqual({ tiny: 5, medium: 10, max: 40 });
});

test('borrowing more than allowed borrows exactly what is allowed', () => {
  const allowed = borrowable(game.commander);
  const credits = game.commander.credits;

  borrow(game, allowed + 5000);

  expect(game.commander.debt).toBe(allowed);
  expect(game.commander.credits).toBe(credits + allowed);
  expect(borrowable(game.commander)).toBe(0);
});

test('paying back more than the cash on hand pays exactly the cash', () => {
  borrow(game, 500);
  game.commander.credits = 200;

  payBack(game, 500);

  expect(game.commander.credits).toBe(0);
  expect(game.commander.debt).toBe(300);
});

test('insurance is refused without an escape pod', () => {
  expect(toggleInsurance(game)).toBe('needsEscapePod');
  expect(game.commander.hasInsurance).toBe(false);
});

test('insurance is bought with an escape pod, and cancelling resets the no-claim days', () => {
  game.commander.hasEscapePod = true;
  expect(toggleInsurance(game)).toBe('ok');
  expect(game.commander.hasInsurance).toBe(true);

  game.commander.noClaim = 12;
  expect(toggleInsurance(game)).toBe('ok');
  expect(game.commander.hasInsurance).toBe(false);
  expect(game.commander.noClaim).toBe(0);
});
