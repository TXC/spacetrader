import { PoliceRecordScore, ReputationScore } from '../Commander.ts';
import { EncounterType } from '../encounter/types.ts';
import { Opponent } from '../Opponent.ts';
import { runtime } from '../runtime.ts';
import type { Meeting, Travel } from './Travel.ts';

// The police are met: they ignore, flee from, inspect or attack the commander, by the
// police record. After the Marie Celeste was plundered, the customs police wait at the end.
export function policeMeeting(
  travel: Travel,
  opponentType: number,
  currentClicks: number
): Meeting {
  let encounterType: EncounterType;
  const opponent = Opponent.generateOpponentWithType(opponentType, travel._game);

  if (currentClicks === 1 && travel._needPostMarieCustomsPolice) {
    encounterType = EncounterType.PostMarieCelestePoliceEncounter;
    travel._needPostMarieCustomsPolice = false;
  } else {
    encounterType = EncounterType.PoliceIgnore;
    const policeHaveWeapons = opponent.ship.weapons.length > 0;

    if (
      travel._game.commander.ship.shipOwnedByCommanderIsCloakedToOpponent(
        travel._game.commander,
        opponent
      )
    ) {
      encounterType = EncounterType.PoliceIgnore;
    } else if (travel._game.commander.policeRecordScore < PoliceRecordScore.Dubious) {
      // If you're a criminal, the police will try to attack
      if (!policeHaveWeapons) {
        if (
          opponent.ship.shipOwnedByCommanderIsCloakedToOpponent(opponent, travel._game.commander)
        ) {
          encounterType = EncounterType.PoliceIgnore;
        } else {
          encounterType = EncounterType.PoliceFlee;
        }
      } else if (travel._game.commander.reputationScore < ReputationScore.Average) {
        encounterType = EncounterType.PoliceAttack;
      } else if (
        runtime.gameRand.randomIntBelow(ReputationScore.Elite) >
        Math.floor(travel._game.commander.reputationScore / (1 + opponent.ship.type))
      ) {
        encounterType = EncounterType.PoliceAttack;
      } else if (
        opponent.ship.shipOwnedByCommanderIsCloakedToOpponent(opponent, travel._game.commander)
      ) {
        encounterType = EncounterType.PoliceIgnore;
      } else {
        encounterType = EncounterType.PoliceFlee;
      }
    } else if (
      travel._game.commander.policeRecordScore >= PoliceRecordScore.Dubious &&
      travel._game.commander.policeRecordScore < PoliceRecordScore.Clean &&
      !travel._game.commander.inspected
    ) {
      // If your reputation is dubious, the police will inspect you
      encounterType = EncounterType.PoliceInspection;
      travel._game.commander.inspected = true;
    } else if (travel._game.commander.policeRecordScore < PoliceRecordScore.Lawful) {
      // Clean record, infrequent inspections
      if (
        runtime.gameRand.randomIntBelow(12 - travel._game.difficulty) < 1 &&
        !travel._game.commander.inspected
      ) {
        encounterType = EncounterType.PoliceInspection;
        travel._game.commander.inspected = true;
      }
    } else {
      // Lawful trader, very infrequent inspections
      if (runtime.gameRand.randomIntBelow(40) === 1 && !travel._game.commander.inspected) {
        encounterType = EncounterType.PoliceInspection;
        travel._game.commander.inspected = true;
      }
    }

    // Police aren't intimidated if your ship is weaker
    if (
      encounterType === EncounterType.PoliceFlee &&
      opponent.ship.type > travel._game.commander.ship.type
    ) {
      if (
        policeHaveWeapons &&
        travel._game.commander.policeRecordScore < PoliceRecordScore.Dubious
      ) {
        encounterType = EncounterType.PoliceAttack;
      } else {
        encounterType = EncounterType.PoliceInspection;
      }
    }

    const noConfrontation =
      encounterType === EncounterType.PoliceFlee || encounterType === EncounterType.PoliceIgnore;

    if (
      noConfrontation &&
      opponent.ship.shipOwnedByCommanderIsCloakedToOpponent(opponent, travel._game.commander)
    ) {
      encounterType = EncounterType.None;
    } else if (noConfrontation && travel._game.alwaysIgnorePolice) {
      encounterType = EncounterType.None;
    }
  }

  return { encounterType, opponent };
}
