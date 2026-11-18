import { PoliceRecordScore, ReputationScore } from '../Commander.ts';
import { EncounterType } from '../encounter/types.ts';
import { Opponent } from '../Opponent.ts';
import type { Game } from '../Game.ts';
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
    encounterType = policeReaction(travel._game, opponent);
  }

  return { encounterType, opponent };
}

// How the police take the commander, by the police record.
function policeReaction(game: Game, opponent: Opponent): EncounterType {
  let encounterType: EncounterType;
  encounterType = EncounterType.PoliceIgnore;
  const policeHaveWeapons = opponent.ship.weapons.length > 0;

  if (game.commander.ship.shipOwnedByCommanderIsCloakedToOpponent(game.commander, opponent)) {
    encounterType = EncounterType.PoliceIgnore;
  } else if (game.commander.policeRecordScore < PoliceRecordScore.Dubious) {
    encounterType = policeMeetCriminal(game, opponent, policeHaveWeapons);
  } else if (
    game.commander.policeRecordScore >= PoliceRecordScore.Dubious &&
    game.commander.policeRecordScore < PoliceRecordScore.Clean &&
    !game.commander.inspected
  ) {
    // If your reputation is dubious, the police will inspect you
    encounterType = EncounterType.PoliceInspection;
    game.commander.inspected = true;
  } else if (game.commander.policeRecordScore < PoliceRecordScore.Lawful) {
    // Clean record, infrequent inspections
    if (runtime.gameRand.randomIntBelow(12 - game.difficulty) < 1 && !game.commander.inspected) {
      encounterType = EncounterType.PoliceInspection;
      game.commander.inspected = true;
    }
  } else {
    // Lawful trader, very infrequent inspections
    if (runtime.gameRand.randomIntBelow(40) === 1 && !game.commander.inspected) {
      encounterType = EncounterType.PoliceInspection;
      game.commander.inspected = true;
    }
  }

  encounterType = unlessCommanderIsWeaker(game, opponent, encounterType, policeHaveWeapons);

  return unlessUnseenOrIgnored(game, opponent, encounterType);
}

function policeMeetCriminal(
  game: Game,
  opponent: Opponent,
  policeHaveWeapons: boolean
): EncounterType {
  let encounterType: EncounterType;

  // If you're a criminal, the police will try to attack
  if (!policeHaveWeapons) {
    if (opponent.ship.shipOwnedByCommanderIsCloakedToOpponent(opponent, game.commander)) {
      encounterType = EncounterType.PoliceIgnore;
    } else {
      encounterType = EncounterType.PoliceFlee;
    }
  } else if (game.commander.reputationScore < ReputationScore.Average) {
    encounterType = EncounterType.PoliceAttack;
  } else if (
    runtime.gameRand.randomIntBelow(ReputationScore.Elite) >
    Math.floor(game.commander.reputationScore / (1 + opponent.ship.type))
  ) {
    encounterType = EncounterType.PoliceAttack;
  } else if (opponent.ship.shipOwnedByCommanderIsCloakedToOpponent(opponent, game.commander)) {
    encounterType = EncounterType.PoliceIgnore;
  } else {
    encounterType = EncounterType.PoliceFlee;
  }

  return encounterType;
}

function unlessCommanderIsWeaker(
  game: Game,
  opponent: Opponent,
  encounterType: EncounterType,
  policeHaveWeapons: boolean
): EncounterType {
  // Police aren't intimidated if your ship is weaker
  if (encounterType === EncounterType.PoliceFlee && opponent.ship.type > game.commander.ship.type) {
    if (policeHaveWeapons && game.commander.policeRecordScore < PoliceRecordScore.Dubious) {
      encounterType = EncounterType.PoliceAttack;
    } else {
      encounterType = EncounterType.PoliceInspection;
    }
  }

  return encounterType;
}

// Police that would pass by are not met at all when they cannot be seen, or when the
// commander's options say to ignore them.
function unlessUnseenOrIgnored(
  game: Game,
  opponent: Opponent,
  encounterType: EncounterType
): EncounterType {
  const noConfrontation =
    encounterType === EncounterType.PoliceFlee || encounterType === EncounterType.PoliceIgnore;

  if (
    noConfrontation &&
    opponent.ship.shipOwnedByCommanderIsCloakedToOpponent(opponent, game.commander)
  ) {
    encounterType = EncounterType.None;
  } else if (noConfrontation && game.alwaysIgnorePolice) {
    encounterType = EncounterType.None;
  }

  return encounterType;
}
