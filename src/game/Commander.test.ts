import { expect, test } from 'vitest';
import { newGame } from '../tests/support/newGame.ts';
import {
  MAX_SKILL_LEVEL,
  PoliceRecordScore,
  policeRecordName,
  reputationName,
} from './Commander.ts';
import type { Commander } from './Commander.ts';
import { Ship, ShipModelType } from './Ship.ts';
import { Difficulty } from './SolarSystem.types.ts';

const { Dubious, Clean, Lawful } = PoliceRecordScore;

// A commander whose net worth, ship and credits less debt, is exactly this.
function worth(netWorth: number, record: number = Clean): Commander {
  const { commander } = newGame();
  commander.policeRecordScore = record;
  commander.credits += netWorth - commander.netWorth();
  return commander;
}

test.each([
  ['a clean record and little worth', Clean, 8_500, 1_000],
  ['a clean record', Clean, 100_000, 10_000],
  ['a clean record, rounded down to 500', Clean, 104_999, 10_000],
  ['a lawful record', Lawful, 100_000, 10_000],
  ['a clean record and great worth', Clean, 1_000_000, 25_000],
  ['a dubious record', Dubious, 1_000_000, 500],
])('the bank lends a tenth of the net worth to %s: %i worth, %i loan', (_, record, net, loan) => {
  expect(worth(net, record).maxLoan()).toBe(loan);
});

// A Gnat is insured at three quarters of its price, $7,500; a Flea at $1,500.
test.each([
  ['a Gnat', ShipModelType.Gnat, 0, 18],
  ['a Gnat', ShipModelType.Gnat, 50, 9],
  ['a Gnat', ShipModelType.Gnat, 90, 1],
  ['a Gnat', ShipModelType.Gnat, 200, 1],
  ['a Flea', ShipModelType.Flea, 0, 3],
  ['a Flea', ShipModelType.Flea, 90, 1],
])('insurance for %s after %i days without a claim costs $%i a day', (_, model, days, price) => {
  const { commander } = newGame();
  commander.ship = Ship.create(model, Difficulty.Normal);
  commander.noClaim = days;

  expect(commander.insurancePrice()).toBe(price);
});

test.each([
  ['nothing is held back without the option', false, 1000],
  ['the daily insurance is held back', true, 1000 - 18],
])('of the credits, %s', (_, reserve, spendable) => {
  const { commander } = newGame();
  commander.hasInsurance = true;
  commander.reserveMoney = reserve;

  expect(commander.spendingMoney()).toBe(spendable);
});

test.each([
  ['no debt costs nothing', 0, 500, 0, 500],
  ['a tenth of the debt is paid from the credits', 1000, 500, 1000, 400],
  ['the smallest interest is 1', 5, 10, 5, 9],
  ['what the credits cannot pay is added to the debt', 1000, 30, 1070, 0],
  ['credits of exactly the interest pay it all', 1000, 100, 1000, 0],
])('interest: %s', (_, debt, credits, debtAfter, creditsAfter) => {
  const { commander } = newGame();
  commander.debt = debt;
  commander.credits = credits;

  commander.payInterest();

  expect([commander.debt, commander.credits]).toEqual([debtAfter, creditsAfter]);
});

test.each([
  ['a good record fades on every third day', 10, Difficulty.Normal, 3, 9],
  ['a good record holds on other days', 10, Difficulty.Normal, 4, 10],
  ['a criminal record mends every day at Normal', -30, Difficulty.Normal, 7, -29],
  ['a criminal record mends at Hard on every third day', -30, Difficulty.Hard, 6, -29],
  ['a criminal record holds at Hard on other days', -30, Difficulty.Hard, 7, -30],
  ['a dubious record stays as it is', -5, Difficulty.Normal, 3, -5],
])('as a day passes, %s', (_, record, difficulty, day, after) => {
  const { commander } = newGame(difficulty);
  commander.policeRecordScore = record;
  commander.days = day - 1;

  commander.timePassed(1);

  expect(commander.policeRecordScore).toBe(after);
});

test('a commander at the top of every skill can learn nothing more', () => {
  const { commander } = newGame();
  commander.pilot = commander.fighter = commander.trader = commander.engineer = MAX_SKILL_LEVEL;

  expect(commander.increaseSkillRandomly()).toBeNull();
  expect(commander.pilot + commander.fighter + commander.trader).toBe(3 * MAX_SKILL_LEVEL);
});

test.each([
  [-100, 'Psycho'],
  [-70, 'Villain'],
  [-30, 'Criminal'],
  [-10, 'Crook'],
  [-5, 'Dubious'],
  [0, 'Clean'],
  [5, 'Lawful'],
  [10, 'Trusted'],
  [25, 'Liked'],
  [75, 'Hero'],
])('a police record of %i is called %s', (score, name) => {
  expect(policeRecordName(score)).toBe(name);
});

test.each([
  [0, 'Harmless'],
  [10, 'Mostly Harmless'],
  [20, 'Poor'],
  [40, 'Average'],
  [80, 'Above Average'],
  [150, 'Competent'],
  [300, 'Dangerous'],
  [600, 'Deadly'],
  [1500, 'Elite'],
])('a reputation of %i is called %s', (score, name) => {
  expect(reputationName(score)).toBe(name);
});
