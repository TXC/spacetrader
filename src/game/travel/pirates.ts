import { ReputationScore } from '../Commander.ts';
import { EncounterType } from '../encounter/types.ts';
import { Opponent, OpponentType } from '../opponent/Opponent.ts';
import { ShipModelType } from '../Ship.ts';
import type { Game } from '../Game.ts';
import { runtime } from '../runtime.ts';
import type { Meeting } from './Travel.ts';

// Pirates or the Mantis are met. The Mantis always attack; pirates mostly do, but flee
// from a commander of high reputation in a ship as large as theirs.
export function pirateMeeting(game: Game, opponentType: OpponentType): Meeting {
  let encounterType: EncounterType;
  const opponent = Opponent.generateOpponentWithType(opponentType, game);

  if (opponentType === OpponentType.Mantis) {
    encounterType = EncounterType.PirateAttack;
  } else if (
    game.commander.ship.shipOwnedByCommanderIsCloakedToOpponent(
      game.commander,
      opponent,
      game.difficulty
    )
  ) {
    encounterType = EncounterType.PirateIgnore;
  } else if (
    opponent.ship.type >= ShipModelType.Grasshopper ||
    opponent.ship.type > game.commander.ship.type ||
    runtime.gameRand.randomIntBelow(ReputationScore.Elite) >
      Math.floor((game.commander.reputationScore * 4) / (1 + opponent.ship.type))
  ) {
    // Pirates mostly attack but will flee if commander's reputation is too high
    encounterType = EncounterType.PirateAttack;
  } else {
    encounterType = EncounterType.PirateFlee;
  }

  const noConfrontation =
    encounterType === EncounterType.PirateFlee || encounterType === EncounterType.PirateIgnore;

  // If this isn't a confrontation and we can't see the pirate, skip the encounter
  if (
    noConfrontation &&
    opponent.ship.shipOwnedByCommanderIsCloakedToOpponent(opponent, game.commander, game.difficulty)
  ) {
    encounterType = EncounterType.None;
  } else if (noConfrontation && game.alwaysIgnorePirates) {
    encounterType = EncounterType.None;
  }

  return { encounterType, opponent };
}
