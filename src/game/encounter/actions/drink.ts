import { AlertActionType, AlertViewController } from '../../alerts.ts';
import { Difficulty } from '../../SolarSystem.types.ts';
import { pLog } from '../../probes.ts';
import { EncounterType } from '../types.ts';
import type { Encounter } from '../Encounter.ts';

// The commander is offered a bottle of tonic. Returns whether the automatic action may
// repeat afterwards.
export function drink(encounter: Encounter): boolean {
  let alertString: string;
  let consumedString = null;
  let drinkAction = null;

  if (encounter._type === EncounterType.BottleGood) {
    alertString =
      'This concoction has been extremely hard to find since the elusive Captain Marmoset left on a mission to the heart of a comet. In the old days, this stuff went for thousands of credits a bottle since people reported significant gains in their abilities after quaffing a bottle. Would you like to drink it?';
    consumedString =
      "Mmmmm. Captain Marmoset's Amazing Skill Tonic not only fills you with energy, but tastes like a fine single-malt. You feel a slight tingling in your fingertips.";
    drinkAction = () => drinkGoodTonic(encounter);
  } else {
    alertString =
      'This concoction has been extremely hard to find since the elusive Captain Marmoset left on a mission to the heart of a comet. The "best used by" date stamped on the bottle has become illegible. The tonic might still be good. Then again, it\'s not clear what happens when the Tonic breaks down...';
    consumedString =
      "While you don't know what it was supposed to taste like, you get the feeling that this dose of tonic was a bit off. This bottle tasted very strange, like slightly salty red wine. You feel a bit dizzy and your teeth itch for a while.";
    drinkAction = () => drinkOldTonic(encounter);
  }

  const aC = new AlertViewController(alertString);

  aC.addAction('Yes, drink it', AlertActionType.Default, () => {
    pLog.log(108);
    drinkAction();

    const aC2 = new AlertViewController(consumedString);

    aC2.addAction('Dismiss', AlertActionType.Default, () => {
      encounter.listener.continues(false);
    });

    encounter._presentAlertController(aC2);
  });

  aC.addAction("I'll pass", AlertActionType.Cancel, () => {
    pLog.log(107);
    encounter.listener.continues(false);
  });

  encounter._presentAlertController(aC);
  return true;
}

function drinkGoodTonic(encounter: Encounter): void {
  pLog.log(105);
  encounter._game.commander.increaseSkillRandomly();
  if (encounter._game.difficulty < Difficulty.Hard) {
    encounter._game.commander.increaseSkillRandomly();
  }
}

function drinkOldTonic(encounter: Encounter): void {
  pLog.log(106);
  encounter._game.commander.drinkOldTonic(encounter._game.difficulty);
}
