import { EncounterType } from '../encounter/types.ts';
import { Opponent } from '../opponent/Opponent.ts';
import type { OpponentType } from '../opponent/Opponent.ts';
import type { Game } from '../Game.ts';
import type { Meeting } from './Travel.ts';

// The ships of the quests. Each attacks, unless it cannot see the commander's ship.

export function scarabMeeting(game: Game, opponentType: OpponentType): Meeting {
  let encounterType: EncounterType;
  const opponent = Opponent.generateOpponentWithType(opponentType, game);
  encounterType = EncounterType.ScarabAttack;

  if (
    game.commander.ship.shipOwnedByCommanderIsCloakedToOpponent(
      game.commander,
      opponent,
      game.difficulty
    )
  ) {
    encounterType = EncounterType.ScarabIgnore;
  }

  return { encounterType, opponent };
}

export function dragonflyMeeting(game: Game, opponentType: OpponentType): Meeting {
  let encounterType: EncounterType;
  const opponent = Opponent.generateOpponentWithType(opponentType, game);
  encounterType = EncounterType.DragonflyAttack;

  if (
    game.commander.ship.shipOwnedByCommanderIsCloakedToOpponent(
      game.commander,
      opponent,
      game.difficulty
    )
  ) {
    encounterType = EncounterType.DragonflyIgnore;
  }

  return { encounterType, opponent };
}

export function monsterMeeting(game: Game, opponentType: OpponentType): Meeting {
  let encounterType: EncounterType;
  const opponent = Opponent.generateOpponentWithType(opponentType, game);
  encounterType = EncounterType.MonsterAttack;

  if (
    game.commander.ship.shipOwnedByCommanderIsCloakedToOpponent(
      game.commander,
      opponent,
      game.difficulty
    )
  ) {
    encounterType = EncounterType.MonsterIgnore;
  }

  return { encounterType, opponent };
}
