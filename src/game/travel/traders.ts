import { PoliceRecordScore, ReputationScore } from '../Commander.ts';
import { EncounterType } from '../encounter/types.ts';
import { Opponent } from '../opponent/Opponent.ts';
import type { Game } from '../Game.ts';
import { runtime } from '../runtime.ts';
import type { Meeting } from './Travel.ts';

export const CHANCE_OF_TRADE_IN_ORBIT = 100;

// Whether the commander's options hide this meeting with a trader: "ignore traders" hides
// those that flee or ignore, "ignore trade in orbit" hides offers to buy or sell.
export function hiddenByOptions(encounterType: number, game: Game): boolean {
  const { TraderFlee, TraderIgnore, TraderSell, TraderBuy } = EncounterType;
  const passesBy = encounterType === TraderFlee || encounterType === TraderIgnore;
  const offersTrade = encounterType === TraderSell || encounterType === TraderBuy;
  return (passesBy && game.alwaysIgnoreTraders) || (offersTrade && game.alwaysIgnoreTradeInOrbit);
}

// A trader is met: it passes by, flees from a criminal, or offers to buy or sell.
export function traderMeeting(game: Game, opponentType: number): Meeting {
  let encounterType: EncounterType;
  const opponent = Opponent.generateOpponentWithType(opponentType, game);
  encounterType = traderReaction(game, opponent);
  encounterType = withTradeOffer(game, opponent, encounterType);

  if (opponent.ship.shipOwnedByCommanderIsCloakedToOpponent(opponent, game.commander)) {
    encounterType = EncounterType.None;
  } else if (hiddenByOptions(encounterType, game)) {
    encounterType = EncounterType.None;
  }

  return { encounterType, opponent };
}

function traderReaction(game: Game, opponent: Opponent): EncounterType {
  let encounterType: EncounterType;
  encounterType = EncounterType.TraderIgnore;

  if (game.commander.ship.shipOwnedByCommanderIsCloakedToOpponent(game.commander, opponent)) {
    encounterType = EncounterType.TraderIgnore;
  } else if (game.commander.policeRecordScore <= PoliceRecordScore.Criminal) {
    // Traders flee from sketchy commanders
    if (
      runtime.gameRand.randomIntBelow(ReputationScore.Elite) <=
      Math.floor((game.commander.reputationScore * 10) / (1 + opponent.ship.type))
    ) {
      if (opponent.ship.shipOwnedByCommanderIsCloakedToOpponent(opponent, game.commander)) {
        encounterType = EncounterType.TraderIgnore;
      } else {
        encounterType = EncounterType.TraderFlee;
      }
    }
  }

  return encounterType;
}

// A trader that passes by sometimes offers to sell, or to buy.
function withTradeOffer(
  game: Game,
  opponent: Opponent,
  encounterType: EncounterType
): EncounterType {
  if (
    encounterType === EncounterType.TraderIgnore &&
    runtime.gameRand.randomIntBelow(1000) < CHANCE_OF_TRADE_IN_ORBIT
  ) {
    if (
      game.commander.ship.freeCargoBays() > 0 &&
      opponent.ship.hasTradeableItemsForSystem(
        game.commander.currentSystem,
        game.commander.policeRecordScore < PoliceRecordScore.Dubious
      )
    ) {
      encounterType = EncounterType.TraderSell;
    } else if (
      game.commander.ship.hasTradeableItemsForSystem(
        game.commander.currentSystem,
        game.commander.policeRecordScore < PoliceRecordScore.Dubious
      )
    ) {
      encounterType = EncounterType.TraderBuy;
    }
  }

  return encounterType;
}
