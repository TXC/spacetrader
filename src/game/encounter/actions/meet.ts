import { AccessoryType } from '../../Accessory.ts';
import { AlertActionType, AlertViewController } from '../../alerts.ts';
import { MAX_SKILL_LEVEL } from '../../Commander.ts';
import { Difficulty } from '../../SolarSystem.types.ts';
import { captainFor } from '../captains.ts';
import { EncounterType } from '../types.ts';
import type { Encounter } from '../Encounter.ts';

// The commander meets a famous captain. Returns whether the automatic action may repeat
// afterwards.
export function meet(encounter: Encounter): boolean {
  const alertString = captainFor(encounter._type).prompt;

  const aC = new AlertViewController(alertString);

  aC.addAction('Yes, trade!', AlertActionType.Default, () => {
    learnFromCaptain(encounter);
  });

  aC.addAction('No thanks!', AlertActionType.Cancel, () => {
    encounter.listener.continues(false);
  });

  encounter._presentAlertController(aC);
  return true;
}

function learnFromCaptain(encounter: Encounter): void {
  if (encounter._type === EncounterType.FamousCaptainAhabEncounter) {
    encounter._game.commander.ship.removeAccessoryOfType(AccessoryType.ShieldReflective);
    encounter._game.commander.pilot = Math.min(
      MAX_SKILL_LEVEL,
      encounter._game.commander.pilot + (encounter._game.difficulty < Difficulty.Hard ? 2 : 1)
    );
  } else if (encounter._type === EncounterType.FamousCaptainConradEncounter) {
    encounter._game.commander.ship.removeAccessoryOfType(AccessoryType.WeaponMilitaryLaser);
    encounter._game.commander.engineer = Math.min(
      MAX_SKILL_LEVEL,
      encounter._game.commander.engineer + (encounter._game.difficulty < Difficulty.Hard ? 2 : 1)
    );
  } else if (encounter._type === EncounterType.FamousCaptainHuieEncounter) {
    encounter._game.commander.ship.removeAccessoryOfType(AccessoryType.WeaponMilitaryLaser);
    encounter._game.commander.trader = Math.min(
      MAX_SKILL_LEVEL,
      encounter._game.commander.trader + (encounter._game.difficulty < Difficulty.Hard ? 2 : 1)
    );
  }

  const trainStr =
    'After a few hours of training with a top expert, you feel your abilities have improved significantly.';
  const aC2 = new AlertViewController(trainStr);

  aC2.addAction('Dismiss', AlertActionType.Default, () => {
    encounter.listener.continues(false);
  });

  encounter._presentAlertController(aC2);
}
