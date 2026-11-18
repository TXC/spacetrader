import type { Game } from '../Game.ts';
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

  alerts.push(...ejected(travel._game));
  alerts.push(...leftBehind(travel._game));
  alerts.push(...insurancePays(travel._game));
  alerts.push(...podBecomesAFlea(travel._game));

  travel._promptForStrings(alerts, () => {
    travel._done('arrived');
  });
}

function ejected(game: Game): string[] {
  const alerts: string[] = [];

  let reactorStr = '';
  if (
    game.reactorStatus > ReactorQuestStatus.Open &&
    game.reactorStatus < ReactorQuestStatus.ClosedTooLate
  ) {
    reactorStr =
      ' The destruction of your ship is made much more spectacular by the added explosion of the Ion Reactor.';
    game.reactorStatus = ReactorQuestStatus.ClosedTooLate;
    pLog.log(160);
  }

  alerts.push(
    `Just before the final demise of your ship, your escape pod gets activated and ejects you.${reactorStr} After a few days, the Space Corps picks you up and drops you off at a nearby space port.`
  );

  return alerts;
}

// What the pod could not take, and the passengers the Space Corps takes away.
function leftBehind(game: Game): string[] {
  const alerts: string[] = [];

  if (game.japoriQuestStatus === JaporiQuestStatus.HasMedicine) {
    game.japoriQuestStatus = JaporiQuestStatus.Open;
    alerts.push(
      'The antidote for the Japori system was destroyed with your ship. Fortunately, they probably have some new antidote in the system where you originally got it.'
    );
  }

  if (game.commander.artifactOnBoard) {
    game.commander.artifactOnBoard = false;
    alerts.push(
      "You couldn't take the artifact with you in the escape pod, so now it's lost in the wreckage. The aliens will probably pick it up there."
    );
  }

  if (game.jarekStatus === JarekQuestStatus.OnBoard) {
    alerts.push('The Space Corps decides to give ambassador Jarek a lift home to Devidia.');
    game.jarekStatus = JarekQuestStatus.Closed;
  }

  if (game.wildStatus === WildQuestStatus.OnBoard) {
    alerts.push('Jonathan Wild is arrested, and taken away to stand trial.');
    game.wildStatus = WildQuestStatus.Closed;
    game.commander.ship.removeCrewMemberWithName('Jonathan Wild');
    game.addBreakingNewsItem('Notorious Criminal Jonathan Wild Arrested!');
    game.commander.policeRecordScore = game.commander.policeRecordScore + CAUGHT_WITH_WILD_SCORE;
    pLog.log(31);
  }

  if (game.commander.ship.tribbles > 0) {
    alerts.push('Your tribbles all died in the explosion.');
    game.commander.ship.tribbles = 0;
  }

  return alerts;
}

function insurancePays(game: Game): string[] {
  const alerts: string[] = [];

  if (game.commander.hasInsurance) {
    const shipValue = game.commander.ship.shipValuationForInsurance(true);
    game.commander.credits = game.commander.credits + shipValue;
    alerts.push(
      `Since your ship was insured, the bank pays you $${shipValue}, the total value of the destroyed ship.`
    );
    pLog.log(32);
  }

  game.commander.hasInsurance = false;
  game.commander.noClaim = 0;
  game.commander.hasEscapePod = false;

  return alerts;
}

function podBecomesAFlea(game: Game): string[] {
  const alerts: string[] = [];

  alerts.push('In 3 days and with $500, you manage to convert your pod into a Flea.');

  let credits = game.commander.credits;
  credits -= 500;
  if (credits < 0) {
    game.commander.debt = game.commander.debt - credits;
    credits = 0;
    pLog.log(33);
  }
  game.commander.credits = credits;

  game.timePassed(3);

  const ship = new Ship(ShipModelType.Flea, game.difficulty);
  game.commander.ship = ship;

  return alerts;
}
