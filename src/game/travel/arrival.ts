import { AlertActionType, AlertViewController } from '../alerts.ts';
import { GameEndStatus } from '../Game.ts';
import { MAX_TRIBBLES } from '../Ship.ts';
import type { Game } from '../Game.ts';
import { ReactorQuestStatus } from '../SolarSystem.types.ts';
import { TradeItemType } from '../TradeItem.types.ts';
import { ensureInteger } from '../ensure.ts';
import { pLog } from '../probes.ts';
import { runtime } from '../runtime.ts';
import { podEscape } from './podEscape.ts';
import type { Travel } from './Travel.ts';

// The trip is over: the reactor, the tribbles, repairs and purchases, and the messages
// about them. `eventLoopInitialClicks` is how far from the destination this pass started.
export function arrive(travel: Travel, eventLoopInitialClicks: number): void {
  travel._game.handleArrival();

  travel._setProgress(1);
  travel.setEncounterController(null);

  const alertStrings = [];

  alertStrings.push(
    eventLoopInitialClicks >= travel._startClicksRemaining
      ? 'After an uneventful trip, you arrive at your destination.'
      : 'You arrive at your destination.'
  );

  alertStrings.push(...debtWarning(travel._game));

  const reactorAlerts = reactorOnArrival(travel);
  if (!reactorAlerts) return;
  alertStrings.push(...reactorAlerts);

  alertStrings.push(...tribblesOnArrival(travel._game));
  repairOnArrival(travel._game);
  const failString = purchasesOnArrival(travel._game);

  showArrival(travel, alertStrings, failString);
}

function debtWarning(game: Game): string[] {
  const alertStrings: string[] = [];

  if (game.commander.debt >= 75000) {
    alertStrings.push(
      'Your debt is getting too large. Reduce it quickly or your ship will be put on a chain!'
    );
  } else if (game.commander.debt > 0 && game.remindLoans && game.commander.days % 5 === 0) {
    alertStrings.push(`You have a debt of $${game.commander.debt}.`);
  }

  return alertStrings;
}

// The reactor's warnings as its fuel runs out. Returns null when it has exploded: then the
// trip ends with the escape pod or the commander's death, and the rest of the arrival is
// skipped.
function reactorOnArrival(travel: Travel): string[] | null {
  const alertStrings: string[] = [];

  switch (travel._game.reactorStatus) {
    case 2:
      alertStrings.push(
        "The reactor was unstable to begin with. Now, it seems that it's rapidly consuming fuel -- half a bay in just one day! It is not clear what will happen if it runs out but you have no reason to suspect it will be anything good."
      );
      pLog.log(152);
      break;
    case 16:
      alertStrings.push(
        "The Ion Reactor is emitting a shrill whine, and it's shaking. The display indicates that it is suffering from fuel starvation."
      );
      pLog.log(153);
      break;
    case 18:
      alertStrings.push(
        'The Ion Reactor is smoking and making loud noises. The display warns that the core is close to the melting temperature.'
      );
      pLog.log(154);
      break;
    case ReactorQuestStatus.DaysRemaining._1: {
      reactorExplodes(travel);

      return null;
    }
  }

  return alertStrings;
}

function reactorExplodes(travel: Travel): void {
  travel._game.reactorStatus = ReactorQuestStatus.ClosedTooLate;

  const alerts = [];

  alerts.push(
    'Just as you approach the docking bay, the reactor explodes into a huge radioactive fireball!'
  );
  if (!travel._game.commander.hasEscapePod) {
    alerts.push('You are destroyed along with your ship as a result of the explosion.');
  }

  travel._promptForStrings(alerts, () => {
    if (travel._game.commander.hasEscapePod) {
      podEscape(travel);
      pLog.log(155);
    } else {
      travel._done(GameEndStatus.Killed);
      pLog.log(156);
    }
  });
}

// Tribbles die of the reactor's radiation, or eat narcotics or food, and then they breed.
function tribblesOnArrival(game: Game): string[] {
  const alertStrings: string[] = [];

  let foodOnBoard = false;
  let currentTribbles = game.commander.ship.tribbles;
  ensureInteger(currentTribbles);

  const previousTribbles = currentTribbles;
  const reactorStatus =
    game.reactorStatus > ReactorQuestStatus.Open &&
    game.reactorStatus < ReactorQuestStatus.ClosedTooLate;

  if (currentTribbles > 0 && reactorStatus) {
    currentTribbles = Math.floor(currentTribbles / 2);
    if (currentTribbles < 10) {
      currentTribbles = 0;
      alertStrings.push(
        'The radiation from the Ion Reactor is deadly to Tribbles. All of the Tribbles on board your ship have died.'
      );
    } else {
      alertStrings.push(
        'The radiation from the Ion Reactor seems to be deadly to Tribbles. Half the Tribbles on board died.'
      );
    }
    pLog.log(157);
  } else if (
    currentTribbles > 0 &&
    game.commander.ship.tradeItemQuantityForType(TradeItemType.Narcotics) > 0
  ) {
    currentTribbles = 1 + runtime.gameRand.randomIntBelow(3);
    const amountNarcotics = game.commander.ship.tradeItemQuantityForType(TradeItemType.Narcotics);
    const consumedNarcotics = Math.min(1 + runtime.gameRand.randomIntBelow(3), amountNarcotics);
    game.commander.ship.soldQuantity(consumedNarcotics, TradeItemType.Narcotics);
    game.commander.ship.boughtQuantity(consumedNarcotics, TradeItemType.Furs, 0);
    alertStrings.push(
      'You find that, instead of narcotics, some of your cargo bays contain only dead tribbles!'
    );
    pLog.log(158);
  } else if (
    currentTribbles > 0 &&
    game.commander.ship.tradeItemQuantityForType(TradeItemType.Food) > 0
  ) {
    const amountFood = game.commander.ship.tradeItemQuantityForType(TradeItemType.Food);
    currentTribbles += 100 + runtime.gameRand.randomIntBelow(amountFood * 100);
    const foodConsumed = runtime.gameRand.randomIntBelow(amountFood);
    game.commander.ship.soldQuantity(foodConsumed, TradeItemType.Food);
    foodOnBoard = true;
    alertStrings.push(
      'You find that, instead of food, some of your cargo bays contain only tribbles!'
    );
    pLog.log(159);
  }

  if (currentTribbles > 0 && currentTribbles < MAX_TRIBBLES) {
    currentTribbles +=
      1 + runtime.gameRand.randomIntBelow(Math.max(1, currentTribbles / (foodOnBoard ? 1 : 2)));
  }

  currentTribbles = Math.min(currentTribbles, MAX_TRIBBLES);
  ensureInteger(currentTribbles);
  game.commander.ship.tribbles = currentTribbles;

  if (
    (previousTribbles < 100 && currentTribbles >= 100) ||
    (previousTribbles < 1000 && currentTribbles >= 1000) ||
    (previousTribbles < 10000 && currentTribbles >= 10000) ||
    (previousTribbles < 50000 && currentTribbles >= 50000)
  ) {
    alertStrings.push(
      `Excuse me, but do you realize you have ${currentTribbles >= MAX_TRIBBLES ? 'a dangerous number of' : currentTribbles} tribbles on board your ship?`
    );
  }

  game.tribbleMessage = false;

  return alertStrings;
}

function repairOnArrival(game: Game): void {
  const engineerSkill = game.commander.ship.crewEngineerSkillIncludingCommander(game.commander);
  const repairAmount = runtime.gameRand.randomIntBelow(engineerSkill);
  game.commander.ship.repairHullByAmount(repairAmount);
}

// Buys fuel and repairs if the commander's options ask for it. Returns what could not be
// paid for, as words for a message, or '' when nothing is missing.
function purchasesOnArrival(game: Game): string {
  let failString = '';
  if (game.autoFuel) {
    pLog.log(37);
    game.commander.attemptPurchaseOfFuel(game.commander.ship.fuelTankCapacity());
    if (game.commander.ship.fuelTankCapacity() !== game.commander.ship.fuel) {
      failString += 'full tanks';
    }
  }

  if (game.autoRepairs) {
    pLog.log(38);
    game.commander.attemptPurchaseOfRepairs(game.commander.ship.maximumHullStrength());
    if (game.commander.ship.maximumHullStrength() !== game.commander.ship.hull) {
      failString += `${failString.length > 0 ? ' or ' : ''}full hull repairs`;
    }
  }

  return failString;
}

function showArrival(travel: Travel, alertStrings: string[], failString: string): void {
  travel._promptForStrings(alertStrings, () => {
    travel._done('arrived');

    if (failString.length > 0) {
      const aC = new AlertViewController(`You don't have enough money to buy ${failString}.`);

      aC.addAction('Darn', AlertActionType.Default, null);

      aC.presentView();
    }
  });
}
