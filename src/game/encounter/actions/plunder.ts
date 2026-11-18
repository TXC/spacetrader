import { AlertActionType, AlertViewController } from '../../alerts.ts';
import { PLUNDER_PIRATE_SCORE, PLUNDER_TRADER_SCORE } from '../../Commander.ts';
import { Plunder } from '../../Plunder.ts';
import { EncounterType, isEncounterWith } from '../types.ts';
import type { Encounter } from '../Encounter.ts';

// The commander boards the other ship to take its cargo. Returns whether the automatic
// action may repeat afterwards.
export function plunder(encounter: Encounter): boolean {
  if (encounter._type === EncounterType.MarieCelesteEncounter) {
    const alertString =
      "The Marie Celeste is completely abandoned and drifting through space. The ship's log is unremarkable except for a tribble infestation a few months ago shortly after visiting Lowry. The crew's quarters are in good shape, with no signs of struggle. Other than being abandoned, the ship is completely normal. By Intergalactic Salvage Law, you can claim the remaining cargo. Do you wish to?";

    const aC = new AlertViewController(alertString);

    aC.addAction('Yes, take cargo', AlertActionType.Default, () => {
      openPlunder(encounter);
    });

    aC.addAction('Leave it', AlertActionType.Cancel, () => {
      encounter.listener.continues(false);
    });

    encounter._presentAlertController(aC);

    return false;
  } else if (isEncounterWith(encounter._type, 'Trader')) {
    encounter._game.commander.policeRecordScore =
      encounter._game.commander.policeRecordScore + PLUNDER_TRADER_SCORE;
  } else {
    encounter._game.commander.policeRecordScore =
      encounter._game.commander.policeRecordScore + PLUNDER_PIRATE_SCORE;
  }

  openPlunder(encounter);
  return true;
}

function openPlunder(encounter: Encounter): void {
  const plunderLabel = encounter._type === EncounterType.MarieCelesteEncounter ? 'Take' : 'Plunder';

  const plunderVC = new Plunder(encounter._game, encounter._opponent, plunderLabel);
  plunderVC.delegate = encounter;
  plunderVC.presentView();
}
