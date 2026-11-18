import { AlertActionType, AlertViewController } from '../../alerts.ts';
import { PoliceRecordScore } from '../../Commander.ts';
import { OpponentType } from '../../opponent/Opponent.ts';
import { WildQuestStatus, reactorAboard } from '../../SolarSystem.types.ts';
import { TradeItemType, NO_TRADE_ITEM } from '../../TradeItem.types.ts';
import { ensureBool, ensureInteger } from '../../ensure.ts';
import { pLog } from '../../probes.ts';
import { EncounterType, isEncounterWith } from '../types.ts';
import { arrest } from '../arrest.ts';
import type { Encounter } from '../Encounter.ts';

// Whether the opponent accepts a surrender, what the commander is asked first, and what
// then happens.
type Terms = {
  surrenderAllowed: boolean;
  surrenderPrompt: string | null;
  surrenderBlock: (() => void) | null;
};

// The commander gives up. Returns whether the automatic action may repeat afterwards.
export function surrender(encounter: Encounter): boolean {
  const { surrenderAllowed, surrenderPrompt, surrenderBlock } = surrenderTerms(encounter);

  ensureBool(surrenderAllowed);

  if (surrenderAllowed) {
    if (surrenderPrompt) {
      const aC = new AlertViewController(surrenderPrompt);

      aC.addAction('Surrender', AlertActionType.Destructive, () => {
        if (surrenderBlock) {
          surrenderBlock();
        }
      });

      aC.addAction('Cancel', AlertActionType.Cancel, null);

      encounter._presentAlertController(aC);
    } else if (surrenderBlock) {
      surrenderBlock();
    }
  } else {
    const aC = new AlertViewController(surrenderPrompt!);

    aC.addAction('Dismiss', AlertActionType.Default, null);

    encounter._presentAlertController(aC);

    return false;
  }
  return true;
}

function surrenderTerms(encounter: Encounter): Terms {
  if (encounter._opponent.type === OpponentType.Mantis) {
    return alienTerms(encounter);
  } else if (
    isEncounterWith(encounter._type, 'Police') ||
    encounter._type === EncounterType.PostMarieCelestePoliceEncounter
  ) {
    return policeTerms(encounter);
  }

  return {
    surrenderAllowed: true,
    surrenderPrompt: null,
    surrenderBlock: () => surrenderToPirates(encounter),
  };
}

function alienTerms(encounter: Encounter): Terms {
  let surrenderAllowed: boolean;
  let surrenderPrompt: string;
  let surrenderBlock: (() => void) | null = null;

  if (encounter._game.commander.artifactOnBoard) {
    surrenderAllowed = true;
    surrenderPrompt =
      'If you surrender to the aliens, they will steal the artifact. Are you sure you wish to do that?';
    surrenderBlock = () => giveUpArtifact(encounter);
  } else {
    surrenderAllowed = false;
    surrenderPrompt = 'Surrender? Ha! We want your HEAD!';
  }

  return { surrenderAllowed, surrenderPrompt, surrenderBlock };
}

function giveUpArtifact(encounter: Encounter): void {
  pLog.log(55);
  encounter._game.commander.artifactOnBoard = false;

  const artifactStolenString =
    "The aliens have taken the artifact from you. Well, it's rightfully theirs, so you probably shouldn't complain. You won't receive any reward from Professor Berger, though.";

  const aC = new AlertViewController(artifactStolenString);
  aC.addAction('Dismiss', AlertActionType.Default, () => {
    encounter.listener.continues(false);
  });

  encounter._presentAlertController(aC);
}

function policeTerms(encounter: Encounter): Terms {
  let surrenderAllowed: boolean;
  let surrenderPrompt = null;
  let surrenderBlock = null;

  if (
    encounter._type !== EncounterType.PostMarieCelestePoliceEncounter &&
    encounter._game.commander.policeRecordScore <= PoliceRecordScore.Psycho
  ) {
    pLog.log(56);
    surrenderAllowed = false;
    surrenderPrompt = 'Surrender? Ha! We want your HEAD!';
  } else {
    surrenderAllowed = true;

    const hasReactor = reactorAboard(encounter._game.reactorStatus);
    const hasWild = encounter._game.wildStatus === WildQuestStatus.OnBoard;
    if (
      encounter._type !== EncounterType.PostMarieCelestePoliceEncounter ||
      hasReactor ||
      hasWild
    ) {
      let extraString = hasReactor ? ' Additionally, the police will destroy the Ion Reactor.' : '';
      if (hasWild) {
        extraString += ' Wild will be arrested, too.';
      }

      surrenderPrompt = `If you surrender, you will spend some time in prison and will have to pay a hefty fine.${extraString} Are you sure you want to do that?`;
      surrenderBlock = () => {
        pLog.log(57);
        arrest(encounter);
      };
    } else {
      surrenderBlock = () => yieldToCustoms(encounter);
    }
  }

  return { surrenderAllowed, surrenderPrompt, surrenderBlock };
}

function yieldToCustoms(encounter: Encounter): void {
  pLog.log(58);
  const numNarcotics = encounter._game.commander.ship.tradeItemQuantityForType(
    TradeItemType.Narcotics
  );
  const numFirearms = encounter._game.commander.ship.tradeItemQuantityForType(
    TradeItemType.Firearms
  );

  let yieldAlertString =
    'The Customs Police find nothing illegal in your cargo holds and apologize for the inconvenience.';

  if (numNarcotics + numFirearms > 0) {
    pLog.log(102);
    encounter._game.commander.policeRecordScore = Math.min(
      encounter._game.commander.policeRecordScore,
      PoliceRecordScore.Dubious
    );

    encounter._game.commander.ship.soldQuantity(numNarcotics, TradeItemType.Narcotics);
    encounter._game.commander.ship.soldQuantity(numFirearms, TradeItemType.Firearms);

    yieldAlertString =
      'The Customs Police confiscated all of your illegal cargo. For being cooperative, you avoided stronger fines or penalties.';
  }

  const aC = new AlertViewController(yieldAlertString);

  aC.addAction('Dismiss', AlertActionType.Default, () => {
    encounter.listener.continues(false);
  });

  encounter._presentAlertController(aC);
}

function surrenderToPirates(encounter: Encounter): void {
  const wildString = wildMeetsThePirates(encounter);

  let questString = '';
  if (reactorAboard(encounter._game.reactorStatus)) {
    questString =
      " They also poke around the Ion Reactor while trying to figure out if it's valuable. They finally conclude that the reactor is worthless, not to mention dangerous, and leave it on your ship.";
  }

  encounter._game.commander.raided = true;

  const totalCargo =
    encounter._game.commander.ship.totalCargoBays() -
    encounter._game.commander.ship.freeCargoBays();

  ensureInteger(totalCargo);

  if (totalCargo <= 0) {
    payBlackmail(encounter, questString, wildString);
  } else {
    loseCargo(encounter, questString, wildString);
  }
}

function wildMeetsThePirates(encounter: Encounter): string | null {
  let wildString = null;
  if (encounter._game.wildStatus === WildQuestStatus.OnBoard) {
    if (encounter._opponent.ship.model.mercenaryQuarters() > 0) {
      encounter._game.wildStatus = WildQuestStatus.Closed;
      encounter._game.commander.ship.removeCrewMemberWithName('Jonathan Wild');
      wildString =
        ' The pirate captain turns out to be an old associate of Jonathan Wild. He invites Wild to go to Kravat aboard the pirate ship. Wild accepts the offer and thanks you for the ride.';
    } else {
      wildString =
        ' The pirate captain turns out to be an old associate of Jonathan Wild. They talk about old times, and you get the feeling that Wild would switch ships if the Pirates had any quarters available.';
    }
  }

  return wildString;
}

function payBlackmail(encounter: Encounter, questString: string, wildString: string | null): void {
  const blackmail = Math.min(
    25000,
    Math.max(500, Math.floor(encounter._game.commander.netWorth() / 20))
  );
  ensureInteger(blackmail);

  let credits = encounter._game.commander.credits;
  let debt = encounter._game.commander.debt;
  if (credits >= blackmail) {
    credits -= blackmail;
  } else {
    debt += blackmail - credits;
    credits = 0;
  }
  pLog.log(59);
  encounter._game.commander.credits = credits;
  encounter._game.commander.debt = debt;

  const alertString = `The pirates are upset that they found no cargo on your ship. To save yourself, you have no choice but to pay them 5% of your current net worth.${questString}${wildString || ''}`;

  const aC = new AlertViewController(alertString);

  aC.addAction('Dismiss', AlertActionType.Default, () => {
    encounter.listener.continues(false);
  });

  encounter._presentAlertController(aC);
}

function loseCargo(encounter: Encounter, questString: string, wildString: string | null): void {
  let freePirateBays = encounter._opponent.ship.freeCargoBays();
  ensureInteger(freePirateBays);

  while (freePirateBays > 0) {
    const itemType = encounter._game.commander.ship.randomTradeableItem();
    if (itemType === NO_TRADE_ITEM) {
      break;
    }

    encounter._game.commander.ship.soldQuantity(1, itemType);
    freePirateBays--;
  }

  pLog.log(60);

  const alertString = `The pirates board your ship and transfer as much of your cargo to their own ship as their cargo bays can hold.${questString}${wildString || ''}`;

  const aC = new AlertViewController(alertString);

  aC.addAction('Dismiss', AlertActionType.Default, () => {
    encounter.listener.continues(false);
  });

  encounter._presentAlertController(aC);
}
