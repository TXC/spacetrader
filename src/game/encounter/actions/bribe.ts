import { AlertActionType, AlertViewController } from '../../alerts.ts';
import { Difficulty, ReactorQuestStatus, WildQuestStatus } from '../../SolarSystem.types.ts';
import { ensureInteger } from '../../ensure.ts';
import { pLog } from '../../probes.ts';
import { EncounterType } from '../types.ts';
import type { EncounterController } from '../../EncounterController.ts';

// The commander offers the police money. Returns whether the automatic action may repeat
// afterwards.
export function bribe(encounter: EncounterController): boolean {
  let cantBribeAlertString = null;
  if (encounter._type === EncounterType.PostMarieCelestePoliceEncounter) {
    cantBribeAlertString =
      "We'd love to take your money, but Space Command already knows you've got illegal goods onboard.";
  } else if (encounter._game.commander.currentSystem.politics.bribeWillingness <= 0) {
    cantBribeAlertString = `The incorruptible police of ${encounter._game.commander.currentSystem.name} cannot be bribed.`;
  }

  if (cantBribeAlertString) {
    const aC = new AlertViewController(cantBribeAlertString);
    aC.addAction('Dismiss', AlertActionType.Default, null);

    encounter._presentAlertController(aC);
    return false;
  }

  if (encounter._safeToSubmit()) {
    const alertString =
      'Are you sure you want to bribe the police? You are not carrying illegal goods, so you have nothing to fear!';

    const aC = new AlertViewController(alertString);

    aC.addAction('Yes, I still want to', AlertActionType.Destructive, () => {
      offerBribe(encounter);
    });

    aC.addAction("Ok, I won't", AlertActionType.Cancel, null);

    encounter._presentAlertController(aC);
  } else {
    offerBribe(encounter);
  }
  return true;
}

function offerBribe(encounter: EncounterController): void {
  const bribe = bribePrice(encounter);

  if (encounter._game.commander.credits < bribe) {
    const alertString = "You don't have enough cash for a bribe.";

    const aC = new AlertViewController(alertString);
    aC.addAction('Dismiss', AlertActionType.Default, null);

    encounter._presentAlertController(aC);
  } else {
    const alertString = `These police officers are willing to forego inspection for $${bribe}.`;

    const aC = new AlertViewController(alertString);

    aC.addAction('Offer bribe', AlertActionType.Default, () => {
      encounter._game.commander.setCredits(encounter._game.commander.credits - bribe);
      encounter.listener.continues(false);
    });

    aC.addAction('Forget it', AlertActionType.Cancel, null);

    encounter._presentAlertController(aC);
  }
}

function bribePrice(encounter: EncounterController): number {
  let bribe =
    encounter._game.commander.netWorth() /
    ((10 + 5 * (Difficulty.Absurd - encounter._game.difficulty)) *
      encounter._game.commander.currentSystem.politics.bribeWillingness);

  bribe = Math.ceil(bribe / 100) * 100; // round up to the next 100
  ensureInteger(bribe);

  if (
    encounter._game.wildStatus === WildQuestStatus.OnBoard ||
    (encounter._game.reactorStatus > ReactorQuestStatus.Open &&
      encounter._game.reactorStatus < ReactorQuestStatus.ClosedTooLate)
  ) {
    pLog.log(126);
    bribe *= encounter._game.difficulty <= Difficulty.Normal ? 2 : 3;
  }

  bribe = Math.max(100, Math.min(bribe, 10000));
  ensureInteger(bribe);

  return bribe;
}
