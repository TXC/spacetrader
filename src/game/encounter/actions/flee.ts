import { AlertActionType, AlertViewController } from '../../alerts.ts';
import {
  ATTACK_POLICE_SCORE,
  FLEE_FROM_INSPECTION_SCORE,
  PoliceRecordScore,
} from '../../Commander.ts';
import { Difficulty } from '../../SolarSystem.types.ts';
import { pLog } from '../../probes.ts';
import { EncounterMode, EncounterType } from '../types.ts';
import { fightRound } from '../fight.ts';
import type { Encounter } from '../Encounter.ts';

// The commander flees. Returns whether the automatic action may repeat afterwards.
export function flee(encounter: Encounter): boolean {
  let alertString = null;
  if (encounter._safeToSubmit()) {
    alertString =
      "Are you sure you want to flee? You're not carrying illegal goods so it should be safe to submit.";
  } else if (encounter._type === EncounterType.PostMarieCelestePoliceEncounter) {
    alertString =
      'Are you sure you want to flee? The Customs Police know you have engaged in criminal activity and your police record will reflect this fact.';
  }

  if (alertString) {
    const aC = new AlertViewController(alertString);
    aC.addAction("Ok, I won't.", AlertActionType.Default, null);

    aC.addAction('Flee', AlertActionType.Destructive, () => {
      performFlee(encounter);
    });

    encounter._presentAlertController(aC);
    return false;
  }

  performFlee(encounter);
  return true;
}

export function autoFlee(encounter: Encounter): boolean {
  encounter._encounterMode = EncounterMode.AutoFlee;
  encounter.performAction('Flee');
  pLog.log(51);
  return false;
}

function performFlee(encounter: Encounter): void {
  if (encounter._type === EncounterType.PoliceInspection) {
    encounter._type = EncounterType.PoliceAttack;

    if (encounter._game.commander.policeRecordScore > PoliceRecordScore.Dubious) {
      encounter._game.commander.policeRecordScore =
        PoliceRecordScore.Dubious - (encounter._game.difficulty < Difficulty.Normal ? 0 : 1);
    } else {
      encounter._game.commander.policeRecordScore =
        encounter._game.commander.policeRecordScore + FLEE_FROM_INSPECTION_SCORE;
    }
  } else if (encounter._type === EncounterType.PostMarieCelestePoliceEncounter) {
    encounter._type = EncounterType.PoliceAttack;
    encounter._game.commander.policeRecordScore = Math.min(
      PoliceRecordScore.Criminal,
      encounter._game.commander.policeRecordScore + ATTACK_POLICE_SCORE
    );
  }

  fightRound(encounter, true, fightContinues => {
    fightContinues = fightContinues && encounter._game.commander.ship.hull > 0;
    encounter.listener.continues(fightContinues);
  });
}
