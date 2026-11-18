// Every button of an encounter, and what it does.
import type { EncounterController } from '../../EncounterController.ts';
import type { ActionName } from '../types.ts';
import { attack, autoAttack } from './attack.ts';
import { bribe } from './bribe.ts';
import { drink } from './drink.ts';
import { autoFlee, flee } from './flee.ts';
import { ignore } from './ignore.ts';
import { interrupt } from './interrupt.ts';
import { meet } from './meet.ts';
import { plunder } from './plunder.ts';
import { submit } from './submit.ts';
import { surrender } from './surrender.ts';
import { trade } from './trade.ts';

// An action returns whether the encounter's common ending runs after it: the step that
// repeats an automatic action. It returns false when it only asked the commander a
// question, or was turned down, or has run that ending itself.
export type EncounterAction = (encounter: EncounterController) => boolean;

export const ACTIONS: Record<ActionName, EncounterAction> = {
  Attack: attack,
  'Auto-Attack': autoAttack,
  Flee: flee,
  'Auto-Flee': autoFlee,
  Ignore: ignore,
  Trade: trade,
  Surrender: surrender,
  Yield: surrender,
  Bribe: bribe,
  Submit: submit,
  Plunder: plunder,
  Board: plunder,
  Meet: meet,
  Drink: drink,
  Interrupt: interrupt,
};
