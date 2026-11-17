// The bank's rules: loans and insurance.
import type { Commander } from './Commander.ts';
import type { Game } from './Game.ts';

export function borrowable(commander: Commander): number {
  return Math.max(0, commander.maxLoan() - commander.debt);
}

// The three amounts offered for borrowing, or for paying back, up to `max`.
export function steps(max: number) {
  const tiny = Math.max(5, Math.floor(max / 50));
  const medium = Math.max(2 * tiny, Math.floor(max / 10));
  return { tiny, medium, max };
}

export function borrow(game: Game, amount: number): void {
  const commander = game.commander;
  const actual = Math.min(borrowable(commander), amount);
  commander.credits = commander.credits + actual;
  commander.debt = commander.debt + actual;
  game.save();
}

export function payBack(game: Game, amount: number): void {
  const commander = game.commander;
  const actual = Math.min(amount, Math.min(commander.debt, commander.credits));
  commander.credits = commander.credits - actual;
  commander.debt = commander.debt - actual;
  game.save();
}

// Buys or cancels insurance. Buying is refused, and nothing saved, without an escape pod.
export function toggleInsurance(game: Game): 'ok' | 'needsEscapePod' {
  const commander = game.commander;
  if (!commander.hasInsurance && !commander.hasEscapePod) return 'needsEscapePod';
  if (commander.hasInsurance) commander.noClaim = 0;
  commander.hasInsurance = !commander.hasInsurance;
  game.save();
  return 'ok';
}

export function setRemindLoans(game: Game, remind: boolean): void {
  game.remindLoans = remind;
  game.save();
}
