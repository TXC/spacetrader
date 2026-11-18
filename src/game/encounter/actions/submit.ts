import { AlertActionType, AlertViewController } from '../../alerts.ts';
import { TRAFFICKING_SCORE } from '../../Commander.ts';
import {
  REACTOR_BAY_COUNT,
  REACTOR_MAX_FUEL,
  Difficulty,
  ReactorQuestStatus,
  WildQuestStatus,
} from '../../SolarSystem.types.ts';
import { TradeItemType, FAKE_QUEST_CARGO_REACTOR } from '../../TradeItem.types.ts';
import { ensureInteger } from '../../ensure.ts';
import { EncounterType } from '../types.ts';
import { arrest } from '../arrest.ts';
import type { EncounterController } from '../../EncounterController.ts';

// The commander lets the police search the ship. Returns whether the automatic action may
// repeat afterwards.
export function submit(encounter: EncounterController): boolean {
  const submitBlock = () => submitToSearch(encounter);

  if (
    encounter._type === EncounterType.PoliceInspection &&
    (encounter._game.commander.ship.hasIllegalGoods() ||
      encounter._game.wildStatus === WildQuestStatus.OnBoard)
  ) {
    let alertString =
      'Are you sure you want to let the police search you? You are carrying illegal goods or crew!';
    if (encounter._game.wildStatus === WildQuestStatus.OnBoard) {
      alertString = `${alertString} You and Wild will be arrested!`;
    }

    const aC = new AlertViewController(alertString);

    aC.addAction('Yes, I still want to', AlertActionType.Destructive, () => {
      submitBlock();
    });

    aC.addAction('Nevermind!', AlertActionType.Cancel, null);

    encounter._presentAlertController(aC);
  } else {
    submitBlock();
  }
  return true;
}

// The police search the ship. In the order of the original game: contraband is
// confiscated and fined, then Wild means arrest, then the reactor is taken.
function submitToSearch(encounter: EncounterController): void {
  const { commander } = encounter._game;
  const wild = encounter._game.wildStatus === WildQuestStatus.OnBoard;
  const done = () => encounter.listener.continues(false);
  const afterCargo = () => {
    if (wild) arrest(encounter);
    else if (encounter._reactorAboard()) confiscateReactor(encounter, done);
    else done();
  };

  if (contraband(encounter) > 0) {
    encounter._notice(fineForContraband(encounter), afterCargo);
  } else if (!wild && !encounter._reactorAboard()) {
    commander.policeRecordScore = commander.policeRecordScore - TRAFFICKING_SCORE;
    encounter._notice(
      'The police find nothing illegal in your cargo holds and apologize for the inconvenience.',
      done
    );
  } else {
    afterCargo();
  }
}

function contraband(encounter: EncounterController): number {
  const { ship } = encounter._game.commander;
  return (
    ship.tradeItemQuantityForType(TradeItemType.Narcotics) +
    ship.tradeItemQuantityForType(TradeItemType.Firearms)
  );
}

// Takes the narcotics and firearms and fines the commander. Returns what the police say.
function fineForContraband(encounter: EncounterController): string {
  const { commander } = encounter._game;
  const { Narcotics, Firearms } = TradeItemType;
  commander.ship.soldQuantity(commander.ship.tradeItemQuantityForType(Narcotics), Narcotics);
  commander.ship.soldQuantity(commander.ship.tradeItemQuantityForType(Firearms), Firearms);

  let fine = commander.netWorth() / ((Difficulty.Absurd + 2 - encounter._game.difficulty) * 10);
  fine = Math.ceil(fine / 50) * 50; // Round up to the nearest 50
  fine = Math.max(100, Math.min(fine, 10000));
  ensureInteger(fine);

  const paid = Math.min(commander.credits, fine);
  commander.setCredits(commander.credits - paid);
  commander.debt = commander.debt + (fine - paid);
  commander.policeRecordScore = commander.policeRecordScore + TRAFFICKING_SCORE;
  return `The police discover illegal goods in your cargo holds. These goods are confiscated and you are fined $${fine}`;
}

function confiscateReactor(encounter: EncounterController, then: () => void): void {
  encounter._game.reactorStatus = ReactorQuestStatus.ClosedTooLate;
  encounter._game.commander.ship.soldQuantity(
    REACTOR_BAY_COUNT + REACTOR_MAX_FUEL,
    FAKE_QUEST_CARGO_REACTOR
  );
  encounter._notice(
    "The police confiscate the Ion Reactor as evidence of your dealings with unsavory characters. The bad news is that you've lost the Ion Reactor. The good news is that you no longer have to worry about managing its depleting fuel store.",
    then
  );
}
