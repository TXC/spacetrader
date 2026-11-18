import { AlertActionType, AlertViewController } from '../alerts.ts';
import { PoliceRecordScore } from '../Commander.ts';
import { Ship, ShipModelType } from '../Ship.ts';
import {
  REACTOR_BAY_COUNT,
  REACTOR_MAX_FUEL,
  JaporiQuestStatus,
  JarekQuestStatus,
  ReactorQuestStatus,
  WildQuestStatus,
} from '../SolarSystem.types.ts';
import { TradeItemType, FAKE_QUEST_CARGO, FAKE_QUEST_CARGO_REACTOR } from '../TradeItem.types.ts';
import { ensureInteger } from '../ensure.ts';
import { pLog } from '../probes.ts';
import type { Encounter } from './Encounter.ts';

// The commander is arrested: a fine, time in prison, and whatever the police take.
export function arrest(encounter: Encounter): void {
  const fine = arrestFine(encounter);

  const imprisonment = Math.max(30, -encounter._game.commander.policeRecordScore);
  ensureInteger(imprisonment);

  let alertString = `You are arrested and taken to the space station where you are brought before a court of law.\nYou are sentenced to ${imprisonment} days in prison and a fine of $${fine}.`;

  alertString += loseGoodsInsuranceAndCrew(encounter);
  alertString += closeQuests(encounter);

  encounter._game.handleArrival();
  encounter._game.timePassed(imprisonment);

  alertString += payFineAndDebt(encounter, fine);

  for (let i = 0; i < imprisonment; i++) {
    encounter._game.commander.payInterest();
  }

  const aC = new AlertViewController(alertString);

  aC.addAction('Dismiss', AlertActionType.Default, () => {
    encounter.listener.arrested();
  });

  encounter._presentAlertController(aC);
}

function arrestFine(encounter: Encounter): number {
  let fine =
    (1 +
      Math.floor(
        (encounter._game.commander.netWorth() *
          // A good record counts as zero, which leaves the smallest fine.
          Math.max(0, Math.min(80, -encounter._game.commander.policeRecordScore))) /
          100 /
          500
      )) *
    500;
  ensureInteger(fine);

  if (encounter._game.wildStatus === WildQuestStatus.OnBoard) {
    fine = Math.floor(fine * 1.05);
  }

  return fine;
}

// Each of these returns what it adds to the court's message.
function loseGoodsInsuranceAndCrew(encounter: Encounter): string {
  let alertString = '';

  const numNarcotics = encounter._game.commander.ship.tradeItemQuantityForType(
    TradeItemType.Narcotics
  );
  const numFirearms = encounter._game.commander.ship.tradeItemQuantityForType(
    TradeItemType.Firearms
  );
  if (numFirearms > 0 || numNarcotics > 0) {
    alertString += '\nThe police impounded all of the illegal goods you had on board.';
    encounter._game.commander.ship.soldQuantity(numNarcotics, TradeItemType.Narcotics);
    encounter._game.commander.ship.soldQuantity(numFirearms, TradeItemType.Firearms);
  }

  if (encounter._game.commander.hasInsurance) {
    alertString +=
      "\nSince you can't pay your insurance while you're in prison, your insurance contract has been voided.";
    encounter._game.commander.hasInsurance = false;
    encounter._game.commander.noClaim = 0;
  }

  if (encounter._game.commander.ship.crewCount() > 0) {
    if (encounter._game.commander.ship.crew.filter(x => !x.forQuest).length > 0) {
      alertString += '\nYour hired mercenaries have left.';
      pLog.log(141);
    }
    encounter._game.commander.ship.removeAllCrewMembers();
  }

  return alertString;
}

function closeQuests(encounter: Encounter): string {
  let alertString = '';

  if (encounter._game.japoriQuestStatus === JaporiQuestStatus.HasMedicine) {
    alertString +=
      '\nThe Space Corps removed the antidote for Japori from your ship and delivered it, fulfilling your assignment.';
    encounter._game.japoriQuestStatus = JaporiQuestStatus.Closed;
    encounter._game.commander.ship.soldQuantity(10, FAKE_QUEST_CARGO);
  }

  if (
    encounter._game.reactorStatus > ReactorQuestStatus.Open &&
    encounter._game.reactorStatus < ReactorQuestStatus.ClosedTooLate
  ) {
    alertString +=
      "\nThe police confiscated the Ion Reactor as evidence of your dealings with unsavory characters. The bad news is that you've lost the Ion Reactor. The good news is that you no longer have to worry about managing its depleting fuel store.";
    encounter._game.reactorStatus = ReactorQuestStatus.ClosedTooLate;
    encounter._game.commander.ship.soldQuantity(
      REACTOR_BAY_COUNT + REACTOR_MAX_FUEL,
      FAKE_QUEST_CARGO_REACTOR
    );
    pLog.log(164);
  }

  if (encounter._game.jarekStatus === JarekQuestStatus.OnBoard) {
    alertString += '\nThe Space Corps decides to give Ambassador Jarek a lift home to Devidia.';
    encounter._game.jarekStatus = JarekQuestStatus.Closed;
    pLog.log(140);
  }

  if (encounter._game.wildStatus === WildQuestStatus.OnBoard) {
    alertString += '\nJonathan Wild is arrested and taken away to stand trial.';
    encounter._game.wildStatus = WildQuestStatus.Closed;
    encounter._game.addBreakingNewsItem('Notorious Criminal Jonathan Wild Arrested!');
    pLog.log(127);
  }

  return alertString;
}

function payFineAndDebt(encounter: Encounter, fine: number): string {
  let alertString = '';

  let credits = encounter._game.commander.credits;
  if (credits >= fine) {
    credits = credits - fine;
  } else {
    pLog.log(42);
    credits += encounter._game.commander.cargoAndShipValuationForInsurance(true);
    credits = Math.max(credits - fine, 0);

    alertString +=
      '\nTo pay your fine, your ship had to be sold at auction. The police have given you a second-hand Flea so you can continue your travels.';

    const ship = Ship.createFromPreviousShip(ShipModelType.Flea, encounter._game.commander.ship);
    encounter._game.commander.ship = ship;
  }

  encounter._game.commander.policeRecordScore = PoliceRecordScore.Dubious;

  let debt = encounter._game.commander.debt;
  if (debt > 0) {
    if (credits >= debt) {
      credits -= debt;
      debt = 0;
    } else {
      debt -= credits;
      credits = 0;
    }
  }

  encounter._game.commander.credits = credits;
  encounter._game.commander.debt = debt;

  return alertString;
}
