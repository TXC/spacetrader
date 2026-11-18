import { AccessoryType } from '../Accessory.ts';
import { AlertActionType, AlertViewController } from '../alerts.ts';
import {
  KILL_PIRATE_SCORE,
  KILL_POLICE_SCORE,
  KILL_TRADER_SCORE,
  PoliceRecordScore,
  ReputationScore,
} from '../Commander.ts';
import { ShipModelType } from '../Ship.ts';
import {
  Difficulty,
  DragonflyQuestStatus,
  MonsterQuestStatus,
  ReactorQuestStatus,
  ScarabQuestStatus,
} from '../SolarSystem.types.ts';
import { ensureBool, ensureInteger, ensureNumber, ensureType } from '../ensure.ts';
import { pLog } from '../probes.ts';
import type { Commander } from '../Commander.ts';
import type { Opponent } from '../Opponent.ts';
import { runtime } from '../runtime.ts';
import { captainFor } from './captains.ts';
import {
  EncounterMode,
  EncounterType,
  isAttackEncounter,
  isEncounterWith,
  isFleeEncounter,
  isSurrenderEncounter,
} from './types.ts';
import type { EncounterController } from '../EncounterController.ts';

// One round of a fight: both sides fire, then someone is destroyed or gets away, or the
// opponent thinks again and the fight goes on. `completionBlock` is told whether it does.
export function fightRound(
  encounter: EncounterController,
  commanderFlees: boolean,
  completionBlock: (fightContinues: boolean) => void
): void {
  ensureBool(commanderFlees);

  const opponentHull = encounter._opponent.ship.hull;
  ensureInteger(opponentHull);
  const commanderHull = encounter._game.commander.ship.hull;
  ensureInteger(commanderHull);
  const { commanderGotHit, opponentGotHit } = exchangeFire(encounter, commanderFlees);

  if (someoneIsDestroyed(encounter, completionBlock)) return;
  if (someoneEscapes(encounter, commanderFlees, commanderGotHit, completionBlock)) return;

  const prevType = encounter._type;

  opponentReconsiders(encounter, opponentHull, commanderHull);

  ensureInteger(encounter._type);

  leaveAutoModeIfChanged(encounter, prevType);
  describeRound(encounter, prevType, commanderFlees, commanderGotHit, opponentGotHit);

  completionBlock(true);
}

function exchangeFire(encounter: EncounterController, commanderFlees: boolean) {
  let commanderGotHit = false;

  if (
    isAttackEncounter(encounter._type) ||
    encounter._type === EncounterType.PostMarieCelestePoliceEncounter
  ) {
    commanderGotHit = executeAttack(
      encounter,
      encounter._opponent,
      encounter._game.commander,
      commanderFlees
    );
  }

  let opponentGotHit = false;

  if (!commanderFlees) {
    opponentGotHit = executeAttack(
      encounter,
      encounter._game.commander,
      encounter._opponent,
      isFleeEncounter(encounter._type)
    );
  }

  return { commanderGotHit, opponentGotHit };
}

function someoneIsDestroyed(
  encounter: EncounterController,
  completionBlock: (fightContinues: boolean) => void
): boolean {
  if (encounter._game.commander.ship.hull <= 0 && encounter._opponent.ship.hull <= 0) {
    bothDestroyed(encounter);
    return true;
  } else if (encounter._opponent.ship.hull <= 0) {
    opponentDestroyed(encounter, completionBlock);
    return true;
  } else if (encounter._game.commander.ship.hull <= 0) {
    commanderDestroyed(encounter);
    return true;
  }

  return false;
}

function bothDestroyed(encounter: EncounterController): void {
  if (encounter._game.commander.hasEscapePod) {
    performPodEscape(encounter);
    return;
  } else {
    const alertString = 'You and your opponent have managed to destroy each other.';
    const aC = new AlertViewController(alertString);

    aC.addAction('Dismiss', AlertActionType.Default, () => {
      encounter.listener.destroyed();
    });

    encounter._presentAlertController(aC);

    return;
  }
}

function opponentDestroyed(
  encounter: EncounterController,
  completionBlock: (fightContinues: boolean) => void
): void {
  let getBounty = false;
  let alertString = 'You have destroyed your opponent.';
  if (
    isEncounterWith(encounter._type, 'Pirate') &&
    encounter._opponent.ship.type !== ShipModelType.Mantis &&
    encounter._game.commander.policeRecordScore >= PoliceRecordScore.Dubious
  ) {
    pLog.log(54);
    getBounty = true;
    alertString = `You earned a bounty of $${encounter._opponent.ship.bountyForEnemyShipWithOpponent(encounter._opponent)}.`;
  }

  const attemptScoop = recordTheKill(encounter, getBounty);

  encounter._game.commander.reputationScore += 1 + Math.floor(encounter._opponent.ship.type / 2);

  const aC = new AlertViewController(alertString);

  aC.addAction('Dismiss', AlertActionType.Default, () => {
    if (attemptScoop) {
      encounter._scoopWithCompletion(() => {
        completionBlock(false);
      });
    } else {
      completionBlock(false);
    }
  });

  encounter._presentAlertController(aC);
  return;
}

// Counts the kill for the kind of opponent. Returns whether its cargo may drift by.
function recordTheKill(encounter: EncounterController, getBounty: boolean): boolean {
  let attemptScoop = false;

  if (isEncounterWith(encounter._type, 'Police')) {
    encounter._game.commander.policeKills++;
    encounter._game.commander.policeRecordScore += KILL_POLICE_SCORE;
  } else if (isEncounterWith(encounter._type, 'Pirate')) {
    if (encounter._opponent.ship.type !== ShipModelType.Mantis) {
      if (getBounty) {
        const bounty = encounter._opponent.ship.bountyForEnemyShipWithOpponent(encounter._opponent);
        encounter._game.commander.credits += bounty;
      }
      encounter._game.commander.policeRecordScore += KILL_PIRATE_SCORE;

      attemptScoop = true;
    }
    encounter._game.commander.pirateKills++;
  } else if (isEncounterWith(encounter._type, 'Trader')) {
    encounter._game.commander.traderKills++;
    encounter._game.commander.policeRecordScore += KILL_TRADER_SCORE;

    attemptScoop = true;
  } else if (isEncounterWith(encounter._type, 'FamousCaptain')) {
    encounter._game.commander.reputationScore = Math.max(
      encounter._game.commander.reputationScore + 100,
      ReputationScore.Dangerous
    );
    encounter._game.replaceNewsContainingString(
      captainFor(encounter._type).name,
      captainFor(encounter._type).destroyNews
    );
  } else if (isEncounterWith(encounter._type, 'Scarab')) {
    encounter._game.commander.pirateKills++;
    encounter._game.commander.policeRecordScore += KILL_PIRATE_SCORE;

    encounter._game.scarabStatus = ScarabQuestStatus.ScarabDestroyed;
    pLog.log(166);
  } else if (isEncounterWith(encounter._type, 'Monster')) {
    encounter._game.commander.pirateKills++;
    encounter._game.commander.policeRecordScore += KILL_PIRATE_SCORE;

    encounter._game.monsterStatus = MonsterQuestStatus.ClosedMonsterDestroyed;
  } else if (isEncounterWith(encounter._type, 'Dragonfly')) {
    encounter._game.commander.pirateKills++;
    encounter._game.commander.policeRecordScore += KILL_PIRATE_SCORE;

    encounter._game.dragonflyStatus = DragonflyQuestStatus.ClosedDragonflyDestroyed;
  }

  return attemptScoop;
}

function commanderDestroyed(encounter: EncounterController): void {
  encounter.listener.hullChanged();

  if (encounter._game.commander.hasEscapePod) {
    performPodEscape(encounter);
    return;
  } else {
    const alertString = 'Your ship has been destroyed by your opponent.';
    const aC = new AlertViewController(alertString);

    aC.addAction('Dismiss', AlertActionType.Default, () => {
      pLog.log(65);
      encounter.listener.destroyed();
    });

    encounter._presentAlertController(aC);
    return;
  }
}

function performPodEscape(encounter: EncounterController): void {
  encounter.listener.destroyed();
}

function someoneEscapes(
  encounter: EncounterController,
  commanderFlees: boolean,
  commanderGotHit: boolean,
  completionBlock: (fightContinues: boolean) => void
): boolean {
  if (commanderFlees) {
    return commanderEscapes(encounter, commanderGotHit, completionBlock);
  } else if (isSurrenderEncounter(encounter._type) || isFleeEncounter(encounter._type)) {
    return opponentEscapes(encounter, completionBlock);
  }

  return false;
}

function commanderEscapes(
  encounter: EncounterController,
  commanderGotHit: boolean,
  completionBlock: (fightContinues: boolean) => void
): boolean {
  let escapeString = null;
  if (encounter._game.difficulty === Difficulty.Beginner) {
    escapeString = "You've managed to escape your opponent.";
  } else if (
    2 *
      (runtime.gameRand.randomIntBelow(7) +
        Math.floor(
          encounter._game.commander.ship.crewPilotSkillIncludingCommander(
            encounter._game.commander
          ) / 3
        )) >=
    runtime.gameRand.randomIntBelow(
      encounter._opponent.ship.crewPilotSkillIncludingCommander(encounter._opponent) *
        (2 + encounter._game.difficulty)
    )
  ) {
    escapeString = "You've managed to escape your opponent.";
    if (commanderGotHit) {
      escapeString = 'You got hit but still managed to escape.';
    }
  }

  if (escapeString) {
    if (isEncounterWith(encounter._type, 'Monster')) {
      encounter._game.monsterHull = encounter._opponent.ship.hull;
      ensureInteger(encounter._game.monsterHull);
      pLog.log(143);
    }

    const aC = new AlertViewController(escapeString);

    aC.addAction('Dismiss', AlertActionType.Default, () => {
      completionBlock(false);
    });

    encounter._presentAlertController(aC);

    return true;
  }

  return false;
}

function opponentEscapes(
  encounter: EncounterController,
  completionBlock: (fightContinues: boolean) => void
): boolean {
  if (
    4 *
      runtime.gameRand.randomIntBelow(
        encounter._game.commander.ship.crewPilotSkillIncludingCommander(encounter._game.commander)
      ) <=
    2 *
      runtime.gameRand.randomIntBelow(
        7 +
          Math.floor(
            encounter._opponent.ship.crewPilotSkillIncludingCommander(encounter._opponent) / 3
          )
      )
  ) {
    const alertString = 'Your opponent has managed to escape.';

    const aC = new AlertViewController(alertString);

    aC.addAction('Dismiss', AlertActionType.Default, () => {
      completionBlock(false);
    });

    encounter._presentAlertController(aC);

    return true;
  }

  return false;
}

// A damaged opponent may turn to flee or give up.
function opponentReconsiders(
  encounter: EncounterController,
  opponentHull: number,
  commanderHull: number
): void {
  if (encounter._opponent.ship.hull < opponentHull) {
    if (isEncounterWith(encounter._type, 'Police')) {
      policeReconsider(encounter, opponentHull, commanderHull);
    } else if (isEncounterWith(encounter._type, 'Pirate')) {
      pirateReconsiders(encounter, opponentHull, commanderHull);
    } else if (isEncounterWith(encounter._type, 'Trader')) {
      traderReconsiders(encounter, opponentHull, commanderHull);
    } else if (encounter._type === EncounterType.PostMarieCelestePoliceEncounter) {
      encounter._type = EncounterType.PoliceAttack;
    }
  }
}

function policeReconsider(
  encounter: EncounterController,
  opponentHull: number,
  commanderHull: number
): void {
  if (encounter._opponent.ship.hull < opponentHull / 2) {
    if (encounter._game.commander.ship.hull < commanderHull / 2) {
      encounter._type =
        runtime.gameRand.randomIntBelow(10) > 5 ? EncounterType.PoliceFlee : encounter._type;
    } else {
      encounter._type = EncounterType.PoliceFlee;
    }
  }
}

function pirateReconsiders(
  encounter: EncounterController,
  opponentHull: number,
  commanderHull: number
): void {
  if (encounter._opponent.ship.hull < (2 * opponentHull) / 3) {
    if (encounter._game.commander.ship.hull < (2 * commanderHull) / 3) {
      encounter._type =
        runtime.gameRand.randomIntBelow(10) > 3 ? EncounterType.PirateFlee : encounter._type;
    } else {
      encounter._type =
        runtime.gameRand.randomIntBelow(10) > 8 &&
        encounter._opponent.ship.type <= ShipModelType.Best
          ? EncounterType.PirateSurrender
          : EncounterType.PirateFlee;
    }
  }
}

function traderReconsiders(
  encounter: EncounterController,
  opponentHull: number,
  commanderHull: number
): void {
  if (encounter._opponent.ship.hull < (2 * opponentHull) / 3) {
    encounter._type =
      runtime.gameRand.randomIntBelow(10) > 3
        ? EncounterType.TraderSurrender
        : EncounterType.TraderFlee;
  } else if (encounter._opponent.ship.hull < (9 * opponentHull) / 10) {
    if (encounter._game.commander.ship.hull < (2 * commanderHull) / 3) {
      // If you get damaged a lot, the trader keeps attacking
      encounter._type =
        runtime.gameRand.randomIntBelow(10) > 7 ? EncounterType.TraderFlee : encounter._type;
    } else if (encounter._game.commander.ship.hull < (9 * commanderHull) / 10) {
      encounter._type =
        runtime.gameRand.randomIntBelow(10) > 3 ? EncounterType.TraderFlee : encounter._type;
    } else {
      encounter._type = EncounterType.TraderFlee;
    }
  }
}

function leaveAutoModeIfChanged(encounter: EncounterController, prevType: number): void {
  if (prevType !== encounter._type) {
    if (
      !isFleeEncounter(encounter._type) &&
      encounter._encounterMode === EncounterMode.AutoAttack
    ) {
      encounter._encounterMode = EncounterMode.Manual;
    } else if (encounter._encounterMode === EncounterMode.AutoFlee) {
      encounter._encounterMode = EncounterMode.Manual;
    }
  }
}

// Writes what happened in this round, for the encounter's text.
function describeRound(
  encounter: EncounterController,
  prevType: number,
  commanderFlees: boolean,
  commanderGotHit: boolean,
  opponentGotHit: boolean
): void {
  encounter._encounterActionUpdate = '';

  const shipString = shipNoun(encounter, prevType);

  let delimit = '';
  if (commanderGotHit) {
    encounter._encounterActionUpdate += `The ${shipString} hits you.`;
    delimit = '\n';
  }

  if (!isFleeEncounter(prevType) && !commanderGotHit) {
    encounter._encounterActionUpdate += `${delimit}The ${shipString} missed you.`;
    delimit = '\n';
  }

  if (opponentGotHit) {
    encounter._encounterActionUpdate += `${delimit}You hit the ${shipString}.`;
    delimit = '\n';
  }

  if (!commanderFlees && !opponentGotHit) {
    const hasWeapons = encounter._game.commander.ship.weapons.length > 0;
    if (hasWeapons) {
      encounter._encounterActionUpdate += `${delimit}You missed the ${shipString}.`;
    } else {
      encounter._encounterActionUpdate += `${delimit}You have no weapons!`;
    }
    delimit = '\n';
  }

  if (isFleeEncounter(prevType)) {
    encounter._encounterActionUpdate += `${delimit}The ${shipString} didn't get away.`;
    delimit = '\n';
  }

  if (commanderFlees) {
    encounter._encounterActionUpdate += `${delimit}The ${shipString} is still following you.`;
  }
}

function shipNoun(encounter: EncounterController, prevType: number): string | null {
  let shipString = null;

  if (isEncounterWith(prevType, 'Police')) {
    shipString = 'police ship';
  } else if (isEncounterWith(prevType, 'Pirate')) {
    shipString =
      encounter._opponent.ship.type === ShipModelType.Mantis ? 'alien ship' : 'pirate ship';
  } else if (isEncounterWith(prevType, 'Trader')) {
    shipString = 'trader ship';
  } else if (isEncounterWith(prevType, 'FamousCaptain')) {
    shipString = 'captain';
  } else if (isEncounterWith(prevType, 'Scarab')) {
    shipString = 'Scarab';
  } else if (isEncounterWith(prevType, 'Monster')) {
    shipString = 'monster';
  } else if (isEncounterWith(prevType, 'Dragonfly')) {
    shipString = 'Dragonfly';
  }

  return shipString;
}

// One side fires at the other. Returns whether it hit.
function executeAttack(
  encounter: EncounterController,
  attacker: Commander | Opponent,
  defender: Commander | Opponent,
  defenderIsFleeing: boolean
): boolean {
  ensureType(attacker, 'object');
  ensureType(defender, 'object');
  ensureBool(defenderIsFleeing);

  const commanderUnderAttack = defender === encounter._game.commander;

  if (
    encounter._game.difficulty === Difficulty.Beginner &&
    commanderUnderAttack &&
    defenderIsFleeing
  ) {
    return false; // Escape unharmed
  }

  if (defenderDodges(attacker, defender, defenderIsFleeing)) {
    return false;
  }

  // Ensure we truncate to integer wherever this factor is used
  const ATTACK_SCALE =
    (100 + 2 * attacker.ship.crewEngineerSkillIncludingCommander(attacker)) / 100;
  ensureNumber(ATTACK_SCALE);

  const damage = weaponDamage(attacker, defender, ATTACK_SCALE);

  ensureInteger(damage);
  if (damage <= 0) {
    return false;
  }

  damageDefender(encounter, defender, damage, commanderUnderAttack);

  return true;
}

function defenderDodges(
  attacker: Commander | Opponent,
  defender: Commander | Opponent,
  defenderIsFleeing: boolean
): boolean {
  const attackDiceRoll = runtime.gameRand.randomIntBelow(
    attacker.ship.crewFighterSkillIncludingCommander(attacker) + defender.ship.model.size
  );
  ensureInteger(attackDiceRoll);

  const dodgeDiceRoll =
    (defenderIsFleeing ? 2 : 1) *
    runtime.gameRand.randomIntBelow(
      5 + Math.floor(defender.ship.crewPilotSkillIncludingCommander(defender) / 2)
    );
  ensureInteger(dodgeDiceRoll);

  return attackDiceRoll < dodgeDiceRoll;
}

function weaponDamage(
  attacker: Commander | Opponent,
  defender: Commander | Opponent,
  ATTACK_SCALE: number
): number {
  let damage: number;
  if (attacker.ship.weapons.length <= 0) {
    damage = 0;
  } else if (defender.ship.type === ShipModelType.Scarab) {
    const pulsePower = attacker.ship.weaponPowerBetweenMinMaxInclusive(
      AccessoryType.WeaponPulseLaser,
      AccessoryType.WeaponPulseLaser
    );
    ensureInteger(pulsePower);

    const morganPower = attacker.ship.weaponPowerBetweenMinMaxInclusive(
      AccessoryType.WeaponMorgansLaser,
      AccessoryType.WeaponMorgansLaser
    );
    ensureInteger(morganPower);

    if (pulsePower + morganPower <= 0) {
      damage = 0;
      pLog.log(167);
    } else {
      damage = runtime.gameRand.randomIntBelow((pulsePower + morganPower) * ATTACK_SCALE);
      pLog.log(168);
    }
  } else {
    const weaponPower = attacker.ship.weaponPowerBetweenMinMaxInclusive(
      AccessoryType.WeaponFirst,
      AccessoryType.WeaponLast
    );
    ensureInteger(weaponPower);

    damage = runtime.gameRand.randomIntBelow(weaponPower * ATTACK_SCALE);
  }

  return damage;
}

function damageDefender(
  encounter: EncounterController,
  defender: Commander | Opponent,
  damage: number,
  commanderUnderAttack: boolean
): void {
  // Reactor weakens our hull and shields
  if (
    commanderUnderAttack &&
    encounter._game.reactorStatus > ReactorQuestStatus.Open &&
    encounter._game.reactorStatus < ReactorQuestStatus.ClosedTooLate
  ) {
    damage *= Math.floor(
      1 +
        (encounter._game.difficulty + 1) *
          (encounter._game.difficulty < Difficulty.Normal ? 0.25 : 0.33)
    );
  }

  ensureInteger(damage);
  damage = defender.ship.damageShieldsByAmount(damage);
  ensureInteger(damage);

  if (damage > 0) {
    damage -= runtime.gameRand.randomIntBelow(
      defender.ship.crewEngineerSkillIncludingCommander(defender)
    );
    damage = Math.max(1, damage);

    // Our ship will survive at least 2 shots on Normal, 3 on Easy, 4 on Beginner, etc. Opponents survive at least 2.
    const scaleFactor = commanderUnderAttack
      ? Math.max(1, Difficulty.Absurd - encounter._game.difficulty)
      : 2;
    ensureInteger(scaleFactor);

    damage = Math.min(damage, Math.floor(defender.ship.maximumHullStrength() / scaleFactor));

    ensureInteger(damage);

    defender.ship.damageHullByAmount(damage);
  }
}
