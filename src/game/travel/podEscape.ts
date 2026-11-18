import { CAUGHT_WITH_WILD_SCORE } from '../Commander.ts';
import { Ship, ShipModelType } from '../Ship.ts';
import {
  JaporiQuestStatus,
  JarekQuestStatus,
  ReactorQuestStatus,
  WildQuestStatus,
} from '../SolarSystem.types.ts';
import { pLog } from '../probes.ts';
import type { Travel } from './Travel.ts';

// The ship is lost and the escape pod carries the commander to the destination: what the
// pod could not take is gone, the insurance pays, and the pod becomes a Flea.
export function podEscape(travel: Travel): void {
  const alerts = [];

  let reactorStr = '';
  if (
    travel._game.reactorStatus > ReactorQuestStatus.Open &&
    travel._game.reactorStatus < ReactorQuestStatus.ClosedTooLate
  ) {
    reactorStr =
      ' The destruction of your ship is made much more spectacular by the added explosion of the Ion Reactor.';
    travel._game.reactorStatus = ReactorQuestStatus.ClosedTooLate;
    pLog.log(160);
  }

  alerts.push(
    `Just before the final demise of your ship, your escape pod gets activated and ejects you.${reactorStr} After a few days, the Space Corps picks you up and drops you off at a nearby space port.`
  );

  if (travel._game.japoriQuestStatus === JaporiQuestStatus.HasMedicine) {
    travel._game.japoriQuestStatus = JaporiQuestStatus.Open;
    alerts.push(
      'The antidote for the Japori system was destroyed with your ship. Fortunately, they probably have some new antidote in the system where you originally got it.'
    );
  }

  if (travel._game.commander.artifactOnBoard) {
    travel._game.commander.artifactOnBoard = false;
    alerts.push(
      "You couldn't take the artifact with you in the escape pod, so now it's lost in the wreckage. The aliens will probably pick it up there."
    );
  }

  if (travel._game.jarekStatus === JarekQuestStatus.OnBoard) {
    alerts.push('The Space Corps decides to give ambassador Jarek a lift home to Devidia.');
    travel._game.jarekStatus = JarekQuestStatus.Closed;
  }

  if (travel._game.wildStatus === WildQuestStatus.OnBoard) {
    alerts.push('Jonathan Wild is arrested, and taken away to stand trial.');
    travel._game.wildStatus = WildQuestStatus.Closed;
    travel._game.commander.ship.removeCrewMemberWithName('Jonathan Wild');
    travel._game.addBreakingNewsItem('Notorious Criminal Jonathan Wild Arrested!');
    travel._game.commander.policeRecordScore =
      travel._game.commander.policeRecordScore + CAUGHT_WITH_WILD_SCORE;
    pLog.log(31);
  }

  if (travel._game.commander.ship.tribbles > 0) {
    alerts.push('Your tribbles all died in the explosion.');
    travel._game.commander.ship.tribbles = 0;
  }

  if (travel._game.commander.hasInsurance) {
    const shipValue = travel._game.commander.ship.shipValuationForInsurance(true);
    travel._game.commander.credits = travel._game.commander.credits + shipValue;
    alerts.push(
      `Since your ship was insured, the bank pays you $${shipValue}, the total value of the destroyed ship.`
    );
    pLog.log(32);
  }

  travel._game.commander.hasInsurance = false;
  travel._game.commander.noClaim = 0;
  travel._game.commander.hasEscapePod = false;

  alerts.push('In 3 days and with $500, you manage to convert your pod into a Flea.');

  let credits = travel._game.commander.credits;
  credits -= 500;
  if (credits < 0) {
    travel._game.commander.debt = travel._game.commander.debt - credits;
    credits = 0;
    pLog.log(33);
  }
  travel._game.commander.credits = credits;

  travel._game.timePassed(3);

  const ship = new Ship(ShipModelType.Flea, travel._game.difficulty);
  travel._game.commander.ship = ship;

  travel._promptForStrings(alerts, () => {
    travel._done('arrived');
  });
}
