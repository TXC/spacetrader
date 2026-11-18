import { policeRecordMultiplier } from '../Commander.ts';
import { OpponentType, OPPONENT_TYPE_COUNT } from '../opponent/Opponent.ts';
import { ShipModelType } from '../Ship.ts';
import {
  Difficulty,
  DragonflyQuestStatus,
  InvasionQuestStatus,
  MonsterQuestStatus,
  ScarabQuestStatus,
  SpecialEvent,
  WildQuestStatus,
} from '../SolarSystem.types.ts';
import { ensureInteger } from '../ensure.ts';
import { pLog } from '../probes.ts';
import { runtime } from '../runtime.ts';
import type { Travel } from './Travel.ts';

// The dice that pick the kind of opponent met at this click of the trip. Returns
// OPPONENT_TYPE_COUNT when no one is met.
export function whoIsMet(travel: Travel, currentClicks: number): number {
  let opponentType: number = OPPONENT_TYPE_COUNT;

  if (currentClicks === 1 && travel._needPostMarieCustomsPolice) {
    opponentType = OpponentType.Police;
  } else if (
    currentClicks === 1 &&
    travel._destination.name === 'Acamar' &&
    travel._game.monsterStatus === MonsterQuestStatus.MonsterExists
  ) {
    opponentType = OpponentType.Monster;
  } else if (
    currentClicks === 1 &&
    travel._destination.name === 'Zalkon' &&
    travel._game.dragonflyStatus === DragonflyQuestStatus.GoToZalkon
  ) {
    opponentType = OpponentType.Dragonfly;
  } else if (
    currentClicks === 20 &&
    travel._destination.specialEvent === SpecialEvent.ScarabDestroyed &&
    travel._game.scarabStatus === ScarabQuestStatus.ScarabExists &&
    travel._game.commander.arrivedViaWormhole
  ) {
    opponentType = OpponentType.Scarab;
    pLog.log(169);
  } else if (
    travel._destination.name === 'Gemulon' &&
    travel._game.invasionStatus === InvasionQuestStatus.ClosedTooLate
  ) {
    if (runtime.gameRand.randomIntBelow(10) > 4) {
      opponentType = OpponentType.Mantis;
    }
  } else {
    opponentType = ordinaryDice(travel);
  }

  return opponentType;
}

// On an ordinary click: pirates, police or a trader, as often as the destination's
// politics has them, or no one.
function ordinaryDice(travel: Travel): number {
  let opponentType: number;

  let encounterTest = runtime.gameRand.randomIntBelow(44 - 2 * travel._game.difficulty);

  // Fleas have half as many encounters
  if (travel._game.commander.ship.type === ShipModelType.Flea) {
    encounterTest *= 2;
  }

  ensureInteger(encounterTest);

  if (
    encounterTest < travel._destination.politics.occurrencePirates &&
    !travel._game.commander.raided
  ) {
    opponentType = OpponentType.Pirate;
  } else if (
    encounterTest <
    travel._destination.politics.occurrencePirates +
      travel._destination.politics.occurrencePolice *
        policeRecordMultiplier(travel._game.commander.policeRecordScore)
  ) {
    opponentType = OpponentType.Police;
  } else if (
    encounterTest <
    travel._destination.politics.occurrencePirates +
      travel._destination.politics.occurrencePolice *
        policeRecordMultiplier(travel._game.commander.policeRecordScore) +
      travel._destination.politics.occurrenceTraders
  ) {
    opponentType = OpponentType.Trader;
  } else {
    opponentType = policeAtKravat(travel);
  }

  ensureInteger(opponentType);

  if (opponentType >= OPPONENT_TYPE_COUNT) {
    if (travel._game.commander.artifactOnBoard && runtime.gameRand.randomIntBelow(20) <= 3) {
      opponentType = OpponentType.Mantis;
    }
  }

  return opponentType;
}

function policeAtKravat(travel: Travel): number {
  let opponentType: number = OPPONENT_TYPE_COUNT;

  // Welcome to Kravat, outlaw!
  if (
    travel._game.wildStatus === WildQuestStatus.OnBoard &&
    travel._destination.name === 'Kravat'
  ) {
    const diceRoll = runtime.gameRand.randomIntBelow(100);
    if (
      (travel._game.difficulty <= Difficulty.Easy && diceRoll < 25) ||
      (travel._game.difficulty === Difficulty.Normal && diceRoll < 33) ||
      (travel._game.difficulty > Difficulty.Normal && diceRoll < 50)
    ) {
      pLog.log(125);
      opponentType = OpponentType.Police;
    }
  }

  return opponentType;
}
