import { AlertActionType, AlertViewController } from '../../alerts.ts';
import {
  ATTACK_POLICE_SCORE,
  ATTACK_TRADER_SCORE,
  PoliceRecordScore,
  ReputationScore,
} from '../../Commander.ts';
import { pLog } from '../../probes.ts';
import { runtime } from '../../runtime.ts';
import { fightRound } from '../fight.ts';
import { captainFor } from '../captains.ts';
import {
  EncounterMode,
  EncounterType,
  famousCaptainAttackType,
  isAttackEncounter,
  isEncounterWith,
  isOneOf,
} from '../types.ts';
import type { Encounter } from '../Encounter.ts';

// The commander attacks. Returns whether the automatic action may repeat afterwards.
export function attack(encounter: Encounter): boolean {
  if (encounter._safeToSubmit()) {
    const alertString =
      "Are you sure you want to attack? You're not carrying illegal goods so it should be safe to submit.";

    const aC = new AlertViewController(alertString);
    aC.addAction("Ok, I won't.", AlertActionType.Default, null);

    aC.addAction('Attack', AlertActionType.Destructive, () => {
      performAttack(encounter);
    });

    encounter._presentAlertController(aC);
    return false;
  }

  performAttack(encounter);
  return true;
}

export function autoAttack(encounter: Encounter): boolean {
  encounter._encounterMode = EncounterMode.AutoAttack;
  encounter.performAction('Attack');
  pLog.log(50);
  return false;
}

function performAttack(encounter: Encounter): void {
  if (
    isEncounterWith(encounter._type, 'Police') ||
    encounter._type === EncounterType.PostMarieCelestePoliceEncounter
  ) {
    attackPolice(encounter);
    return;
  } else if (isEncounterWith(encounter._type, 'Pirate')) {
    if (encounter._type === EncounterType.PirateIgnore) {
      encounter._type = EncounterType.PirateAttack;
    }
  } else if (isEncounterWith(encounter._type, 'Trader')) {
    attackTrader(encounter);
    return;
  } else if (isEncounterWith(encounter._type, 'FamousCaptain')) {
    attackCaptain(encounter);
    return;
  } else if (isEncounterWith(encounter._type, 'Scarab')) {
    if (encounter._type === EncounterType.ScarabIgnore) {
      encounter._type = EncounterType.ScarabAttack;
    }
  } else if (isEncounterWith(encounter._type, 'Monster')) {
    if (encounter._type === EncounterType.MonsterIgnore) {
      encounter._type = EncounterType.MonsterAttack;
    }
  } else if (isEncounterWith(encounter._type, 'Dragonfly')) {
    if (encounter._type === EncounterType.DragonflyIgnore) {
      encounter._type = EncounterType.DragonflyAttack;
    }
  }

  fight(encounter);
}

function attackPolice(encounter: Encounter): void {
  if (encounter._game.commander.policeRecordScore > PoliceRecordScore.Criminal) {
    const alertString =
      'Are you sure you wish to attack the police? This will turn you into a criminal!';

    const aC = new AlertViewController(alertString);
    aC.addAction("Ok, I won't.", AlertActionType.Default, null);

    aC.addAction('Attack', AlertActionType.Destructive, () => {
      fightPolice(encounter);
    });

    encounter._presentAlertController(aC);

    return;
  }

  fightPolice(encounter);
}

function fightPolice(encounter: Encounter): void {
  if (encounter._game.commander.policeRecordScore > PoliceRecordScore.Criminal) {
    encounter._game.commander.policeRecordScore = PoliceRecordScore.Criminal;
  }

  encounter._game.commander.policeRecordScore =
    encounter._game.commander.policeRecordScore + ATTACK_POLICE_SCORE;

  if (encounter._type !== EncounterType.PoliceFlee) {
    encounter._type = EncounterType.PoliceAttack;
  }

  fight(encounter);
}

function attackTrader(encounter: Encounter): void {
  if (
    isOneOf(
      encounter._type,
      EncounterType.TraderIgnore,
      EncounterType.TraderBuy,
      EncounterType.TraderSell
    )
  ) {
    if (encounter._game.commander.policeRecordScore >= PoliceRecordScore.Clean) {
      const alertString =
        'Are you sure you wish to attack the trader? This will make the police suspicious of you!';

      const aC = new AlertViewController(alertString);
      aC.addAction("Ok, I won't.", AlertActionType.Default, null);

      aC.addAction('Attack', AlertActionType.Destructive, () => {
        encounter._game.commander.policeRecordScore = PoliceRecordScore.Dubious;

        fightTrader(encounter);
      });

      encounter._presentAlertController(aC);

      return;
    } else {
      encounter._game.commander.policeRecordScore =
        encounter._game.commander.policeRecordScore + ATTACK_TRADER_SCORE;
    }
  }

  fightTrader(encounter);
}

function fightTrader(encounter: Encounter): void {
  if (encounter._type !== EncounterType.TraderFlee) {
    if (encounter._opponent.ship.weapons.length <= 0) {
      encounter._type = EncounterType.TraderFlee;
    } else if (
      runtime.gameRand.randomIntBelow(ReputationScore.Elite) <=
      (encounter._game.commander.reputationScore * 10) / (1 + encounter._opponent.ship.type)
    ) {
      encounter._type = EncounterType.TraderFlee;
    } else {
      encounter._type = EncounterType.TraderAttack;
    }
  }

  fight(encounter);
}

function attackCaptain(encounter: Encounter): void {
  if (!isAttackEncounter(encounter._type)) {
    const alertString =
      'Famous captains get famous by, among other things, destroying everyone who attacks them. Do you really want to attack?';

    const aC = new AlertViewController(alertString);
    aC.addAction("Ok, I won't.", AlertActionType.Default, null);

    aC.addAction('Attack', AlertActionType.Destructive, () => {
      pLog.log(104);
      let policeScore = encounter._game.commander.policeRecordScore;
      policeScore = Math.min(policeScore, PoliceRecordScore.Villain) + ATTACK_TRADER_SCORE;
      encounter._game.commander.policeRecordScore = policeScore;

      encounter._game.addBreakingNewsItem(captainFor(encounter._type).attackNews);

      fightCaptain(encounter);
    });

    encounter._presentAlertController(aC);
    return;
  }

  fightCaptain(encounter);
}

function fightCaptain(encounter: Encounter): void {
  encounter._type = famousCaptainAttackType(encounter._type);
  fight(encounter);
}

function fight(encounter: Encounter): void {
  fightRound(encounter, false, fightContinues => {
    fightContinues = fightContinues && encounter._game.commander.ship.hull > 0;
    encounter.listener.continues(fightContinues);
  });
}
