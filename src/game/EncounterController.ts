import { AlertActionType, AlertViewController } from './alerts.ts';
import { PoliceRecordScore } from './Commander.ts';
import { Plunder } from './Plunder.ts';
import { Ship, ShipModelType } from './Ship.ts';
import {
  REACTOR_BAY_COUNT,
  REACTOR_MAX_FUEL,
  Difficulty,
  JaporiQuestStatus,
  JarekQuestStatus,
  ReactorQuestStatus,
  WildQuestStatus,
} from './SolarSystem.types.ts';
import { tradeItemForType } from './TradeItem.ts';
import {
  TradeItemType,
  FAKE_QUEST_CARGO,
  FAKE_QUEST_CARGO_REACTOR,
  TRADE_ITEM_COUNT,
} from './TradeItem.types.ts';
import { ensureBool, ensureInteger, ensureType } from './ensure.ts';
import { pLog } from './probes.ts';
import type { Game } from './Game.ts';
import type { Opponent } from './Opponent.ts';
import { runtime } from './runtime.ts';
import { ACTIONS } from './encounter/actions/index.ts';
import { captainFor } from './encounter/captains.ts';
import {
  EncounterMode,
  EncounterType,
  isAttackEncounter,
  isAutoMode,
  isEncounterWith,
  isFleeEncounter,
  isIgnoreEncounter,
  isOneOf,
} from './encounter/types.ts';
import type { ActionName, EncounterListener } from './encounter/types.ts';

export class EncounterController {
  declare _type: number;
  declare _game: Game;
  declare _opponent: Opponent;
  declare _encounterActionUpdate: string | null;
  declare _actionTaken: boolean;
  declare _encounterMode: number;
  declare _autoEncounterSession: number;
  declare listener: EncounterListener;

  constructor(type: number, game: Game, opponent: Opponent, listener: EncounterListener) {
    ensureInteger(type);
    ensureType(game, 'object');
    ensureType(opponent, 'object');

    this._type = type;
    this._game = game;
    this._opponent = opponent;
    this._encounterActionUpdate = null;
    this._actionTaken = false;
    this._encounterMode = 0;
    this._autoEncounterSession = 0;
    this.listener = listener;
  }

  get type() {
    return this._type;
  }

  _reactorAboard(): boolean {
    const status = this._game.reactorStatus;
    return status > ReactorQuestStatus.Open && status < ReactorQuestStatus.ClosedTooLate;
  }

  // Shows a message; the encounter goes on with `then` once it is dismissed.
  _notice(text: string, then: () => void): void {
    const alert = new AlertViewController(text);
    alert.addAction('Dismiss', AlertActionType.Default, then);
    this._presentAlertController(alert);
  }

  // At a police inspection with nothing to hide, submitting costs nothing. Attack, Flee and
  // Bribe all ask "are you sure?" in that case, and only then.
  _safeToSubmit(): boolean {
    return (
      this._type === EncounterType.PoliceInspection &&
      !this._game.commander.ship.hasIllegalGoods() &&
      this._game.wildStatus !== WildQuestStatus.OnBoard
    );
  }

  get opponent() {
    return this._opponent;
  }

  encounterText() {
    let text = '';

    const clicks = this._game.commander.travelClicksRemaining;
    text += `At ${clicks} click${clicks === 1 ? '' : 's'} from ${this._game.commander.currentSystem.name} you encounter`;

    if (isEncounterWith(this._type, 'Police')) {
      text += ' a police ';
    } else if (isEncounterWith(this._type, 'Pirate')) {
      if (this._opponent.ship.type === ShipModelType.Mantis) {
        text += ' an alien ';
      } else {
        text += ' a pirate ';
      }
    } else if (isEncounterWith(this._type, 'Trader')) {
      text += ' a trader ';
    } else if (isEncounterWith(this._type, 'Scarab') || isEncounterWith(this._type, 'Dragonfly')) {
      text += ' a stolen ';
    } else if (isEncounterWith(this._type, 'Monster')) {
      text += ' the terrifying ';
    }

    if (isEncounterWith(this._type, 'FamousCaptain')) {
      text += ` the famous Captain ${captainFor(this._type).name}.`;
    } else if (this._type === EncounterType.PostMarieCelestePoliceEncounter) {
      text += ' the Customs Police.';
    } else if (this._type === EncounterType.MarieCelesteEncounter) {
      text += ' a drifting ship.';
    } else if (this._type === EncounterType.BottleGood || this._type === EncounterType.BottleOld) {
      text += ' a floating bottle.';
    } else {
      text += `${this._opponent.ship.model.name}.`;
    }

    text += '\n\n';

    if (this._type === EncounterType.PoliceInspection) {
      text += 'The police summon you to submit to an inspection.';
    } else if (
      !this._actionTaken &&
      this._type === EncounterType.PoliceAttack &&
      this._game.commander.policeRecordScore > PoliceRecordScore.Criminal
    ) {
      text += 'The police hail that they want you to surrender.';
    } else if (isFleeEncounter(this._type)) {
      text += 'Your opponent is fleeing.';
    } else if (isAttackEncounter(this._type)) {
      text += 'Your opponent attacks.';
    } else if (isIgnoreEncounter(this._type)) {
      if (
        this._game.commander.ship.shipOwnedByCommanderIsCloakedToOpponent(
          this._game.commander,
          this._opponent
        )
      ) {
        text += "It doesn't notice you.";
      } else {
        text += 'It ignores you.';
      }
    } else if (this._type === EncounterType.TraderSell || this._type === EncounterType.TraderBuy) {
      text += 'You are hailed with an offer to trade goods.';
    } else if (
      this._type === EncounterType.TraderSurrender ||
      this._type === EncounterType.PirateSurrender
    ) {
      text += 'Your opponent hails to surrender to you.';
    } else if (isEncounterWith(this._type, 'FamousCaptain') && !isAttackEncounter(this._type)) {
      text += 'The captain requests a brief meeting with you.';
    } else if (this._type === EncounterType.MarieCelesteEncounter) {
      text += 'The Marie Celeste appears to be completely abandoned.';
    } else if (this._type === EncounterType.PostMarieCelestePoliceEncounter) {
      text +=
        'The police hail with a warning, "We know you removed illegal goods from the Marie Celeste. You must give them up at once!"';
    } else if (this._type === EncounterType.BottleGood || this._type === EncounterType.BottleOld) {
      text += "It appears to be a rare bottle of Captain Marmoset's Amazing Skill Tonic!";
    }

    if (this._encounterActionUpdate) {
      if (!text.endsWith('\n')) {
        text += '\n';
      }
      text += this._encounterActionUpdate;
    }

    return text;
  }

  encounterButtons(): ActionName[] {
    const buttons: ActionName[] = [];

    ensureInteger(this._encounterMode);

    if (isAutoMode(this._encounterMode)) {
      buttons.push('Interrupt');
    }

    if (this._type === EncounterType.PoliceInspection) {
      buttons.push('Attack', 'Flee', 'Submit', 'Bribe');
    } else if (
      isOneOf(
        this._type,
        EncounterType.PoliceFlee,
        EncounterType.TraderFlee,
        EncounterType.PirateFlee
      )
    ) {
      buttons.push('Attack', 'Ignore');
    } else if (
      isOneOf(
        this._type,
        EncounterType.PirateAttack,
        EncounterType.PoliceAttack,
        EncounterType.ScarabAttack
      )
    ) {
      buttons.push('Attack', 'Flee', 'Surrender');
    } else if (
      isOneOf(
        this._type,
        EncounterType.TraderAttack,
        EncounterType.MonsterAttack,
        EncounterType.DragonflyAttack
      ) ||
      (isEncounterWith(this._type, 'FamousCaptain') && isAttackEncounter(this._type))
    ) {
      buttons.push('Attack', 'Flee');
    } else if (
      isOneOf(
        this._type,
        EncounterType.TraderIgnore,
        EncounterType.PoliceIgnore,
        EncounterType.PirateIgnore,
        EncounterType.ScarabIgnore,
        EncounterType.MonsterIgnore,
        EncounterType.DragonflyIgnore
      )
    ) {
      buttons.push('Attack', 'Ignore');
    } else if (isOneOf(this._type, EncounterType.TraderSurrender, EncounterType.PirateSurrender)) {
      buttons.push('Attack', 'Plunder');
    } else if (isOneOf(this._type, EncounterType.TraderSell, EncounterType.TraderBuy)) {
      buttons.push('Attack', 'Ignore', 'Trade');
    } else if (isEncounterWith(this._type, 'FamousCaptain') && !isAttackEncounter(this._type)) {
      buttons.push('Attack', 'Ignore', 'Meet');
    } else if (this._type === EncounterType.PostMarieCelestePoliceEncounter) {
      buttons.push('Attack', 'Flee', 'Yield', 'Bribe');
    } else if (this._type === EncounterType.MarieCelesteEncounter) {
      buttons.push('Board', 'Ignore');
    } else if (isOneOf(this._type, EncounterType.BottleGood, EncounterType.BottleOld)) {
      buttons.push('Drink', 'Ignore');
    }

    const encounterClass = this.constructor as typeof EncounterController;
    encounterClass._addAutoFor('Attack', buttons);
    encounterClass._addAutoFor('Flee', buttons);

    encounterClass._pruneActionsFor(
      this._encounterMode === EncounterMode.AutoFlee
        ? 'Flee'
        : this._encounterMode === EncounterMode.AutoAttack
          ? 'Attack'
          : null,
      buttons
    );

    return buttons;
  }

  static _pruneActionsFor(toPrune: string | null, buttons: ActionName[]) {
    if (!toPrune) {
      return;
    }

    const toRemoveIndexes: number[] = [];
    buttons.forEach((label, idx) => {
      if (label.endsWith(toPrune)) {
        toRemoveIndexes.push(idx);
      }
    });

    for (let i = toRemoveIndexes.length - 1; i >= 0; i--) {
      buttons.splice(toRemoveIndexes[i], 1);
    }
  }

  static _addAutoFor(label: 'Attack' | 'Flee', buttons: ActionName[]) {
    let addIndex = -1;
    buttons.forEach((buttonLabel, idx) => {
      if (buttonLabel === label) {
        addIndex = idx;
      }
    });

    if (addIndex !== -1) {
      buttons.splice(addIndex + 1, 0, `Auto-${label}`);
    }
  }

  // The owner has let go of this encounter, so it is not told that the buttons changed.
  invalidate() {
    this._autoEncounterSession++;
    this._encounterMode = EncounterMode.Manual;
  }

  performAction(action: ActionName) {
    ensureType(action, 'string');
    ensureInteger(this._encounterMode);

    this._actionTaken = true;

    // End auto-encounters before the action is performed and our delegate is called to update the UI
    if (this._encounterMode === EncounterMode.AutoAttack && !action.endsWith('Attack')) {
      pLog.log(48);
      this._endAutoEncounters();
    } else if (this._encounterMode === EncounterMode.AutoFlee && !action.endsWith('Flee')) {
      pLog.log(49);
      this._endAutoEncounters();
    }

    if (!ACTIONS[action](this)) return;

    if (isAutoMode(this._encounterMode)) {
      ensureInteger(this._autoEncounterSession);

      const sessionID = this._game.uniqueID + '-' + this._autoEncounterSession;
      const actionType = this._encounterMode === EncounterMode.AutoAttack ? 'Attack' : 'Flee';

      runtime.actionLog.performAsync(() => {
        if (sessionID === this._game.uniqueID + '-' + this._autoEncounterSession) {
          pLog.log(53);
          this.performAction(actionType);
        }
      }, 1500);
    }
  } // END OF performAction

  _endAutoEncounters() {
    this._autoEncounterSession++;
    this._encounterMode = EncounterMode.Manual;
    this.listener.buttonsChanged();
  }

  _presentAlertController(alertController: AlertViewController) {
    this._endAutoEncounters();
    alertController.presentView();
  }

  _scoopWithCompletion(completion: () => void) {
    let canScoop = this._game.commander.ship.freeCargoBays() > 0;
    canScoop =
      canScoop &&
      (this._game.difficulty < Difficulty.Normal ||
        runtime.gameRand.randomIntBelow(this._game.difficulty) === 1);

    if (canScoop) {
      let itemType = runtime.gameRand.randomIntBelow(TRADE_ITEM_COUNT);
      if (itemType >= TradeItemType.Firearms) {
        itemType = runtime.gameRand.randomIntBelow(TRADE_ITEM_COUNT);
      }

      const alertString = `A canister from the destroyed ship, labelled ${tradeItemForType(itemType).name}, drifts within range of your scoops.`;

      const aC = new AlertViewController(alertString);

      aC.addAction('Pick it up!', AlertActionType.Default, () => {
        this._game.commander.ship.boughtQuantity(1, itemType, 0);
        completion();
      });

      aC.addAction('Let it go', AlertActionType.Cancel, () => {
        completion();
      });

      this._presentAlertController(aC);

      return;
    }

    completion();
  }

  _processArrest() {
    let fine =
      (1 +
        Math.floor(
          (this._game.commander.netWorth() *
            // A good record counts as zero, which leaves the smallest fine.
            Math.max(0, Math.min(80, -this._game.commander.policeRecordScore))) /
            100 /
            500
        )) *
      500;
    ensureInteger(fine);

    if (this._game.wildStatus === WildQuestStatus.OnBoard) {
      fine = Math.floor(fine * 1.05);
    }

    const imprisonment = Math.max(30, -this._game.commander.policeRecordScore);
    ensureInteger(imprisonment);

    let alertString = `You are arrested and taken to the space station where you are brought before a court of law.\nYou are sentenced to ${imprisonment} days in prison and a fine of $${fine}.`;

    const numNarcotics = this._game.commander.ship.tradeItemQuantityForType(
      TradeItemType.Narcotics
    );
    const numFirearms = this._game.commander.ship.tradeItemQuantityForType(TradeItemType.Firearms);
    if (numFirearms > 0 || numNarcotics > 0) {
      alertString += '\nThe police impounded all of the illegal goods you had on board.';
      this._game.commander.ship.soldQuantity(numNarcotics, TradeItemType.Narcotics);
      this._game.commander.ship.soldQuantity(numFirearms, TradeItemType.Firearms);
    }

    if (this._game.commander.hasInsurance) {
      alertString +=
        "\nSince you can't pay your insurance while you're in prison, your insurance contract has been voided.";
      this._game.commander.hasInsurance = false;
      this._game.commander.noClaim = 0;
    }

    if (this._game.commander.ship.crewCount() > 0) {
      if (this._game.commander.ship.crew.filter(x => !x.forQuest).length > 0) {
        alertString += '\nYour hired mercenaries have left.';
        pLog.log(141);
      }
      this._game.commander.ship.removeAllCrewMembers();
    }

    if (this._game.japoriQuestStatus === JaporiQuestStatus.HasMedicine) {
      alertString +=
        '\nThe Space Corps removed the antidote for Japori from your ship and delivered it, fulfilling your assignment.';
      this._game.japoriQuestStatus = JaporiQuestStatus.Closed;
      this._game.commander.ship.soldQuantity(10, FAKE_QUEST_CARGO);
    }

    if (
      this._game.reactorStatus > ReactorQuestStatus.Open &&
      this._game.reactorStatus < ReactorQuestStatus.ClosedTooLate
    ) {
      alertString +=
        "\nThe police confiscated the Ion Reactor as evidence of your dealings with unsavory characters. The bad news is that you've lost the Ion Reactor. The good news is that you no longer have to worry about managing its depleting fuel store.";
      this._game.reactorStatus = ReactorQuestStatus.ClosedTooLate;
      this._game.commander.ship.soldQuantity(
        REACTOR_BAY_COUNT + REACTOR_MAX_FUEL,
        FAKE_QUEST_CARGO_REACTOR
      );
      pLog.log(164);
    }

    if (this._game.jarekStatus === JarekQuestStatus.OnBoard) {
      alertString += '\nThe Space Corps decides to give Ambassador Jarek a lift home to Devidia.';
      this._game.jarekStatus = JarekQuestStatus.Closed;
      pLog.log(140);
    }

    if (this._game.wildStatus === WildQuestStatus.OnBoard) {
      alertString += '\nJonathan Wild is arrested and taken away to stand trial.';
      this._game.wildStatus = WildQuestStatus.Closed;
      this._game.addBreakingNewsItem('Notorious Criminal Jonathan Wild Arrested!');
      pLog.log(127);
    }

    this._game.handleArrival();
    this._game.timePassed(imprisonment);

    let credits = this._game.commander.credits;
    if (credits >= fine) {
      credits = credits - fine;
    } else {
      pLog.log(42);
      credits += this._game.commander.cargoAndShipValuationForInsurance(true);
      credits = Math.max(credits - fine, 0);

      alertString +=
        '\nTo pay your fine, your ship had to be sold at auction. The police have given you a second-hand Flea so you can continue your travels.';

      const ship = Ship.createFromPreviousShip(ShipModelType.Flea, this._game.commander.ship);
      this._game.commander.ship = ship;
    }

    this._game.commander.policeRecordScore = PoliceRecordScore.Dubious;

    let debt = this._game.commander.debt;
    if (debt > 0) {
      if (credits >= debt) {
        credits -= debt;
        debt = 0;
      } else {
        debt -= credits;
        credits = 0;
      }
    }

    this._game.commander.credits = credits;
    this._game.commander.debt = debt;

    for (let i = 0; i < imprisonment; i++) {
      this._game.commander.payInterest();
    }

    const aC = new AlertViewController(alertString);

    aC.addAction('Dismiss', AlertActionType.Default, () => {
      this.listener.arrested();
    });

    this._presentAlertController(aC);
  }

  // #pragma mark - PlunderViewControllerDelegate

  plunderViewControllerDidFinishPlundering(controller: Plunder) {
    ensureBool(controller.plundered);

    if (controller.plundered) {
      this.listener.plundered(controller.plundered);
    }

    this.listener.continues(false);
  }
}
