import { AlertActionType, AlertViewController } from './alerts.ts';
import { PoliceRecordScore } from './Commander.ts';
import { Plunder } from './Plunder.ts';
import { ShipModelType } from './Ship.ts';
import { ReactorQuestStatus, WildQuestStatus } from './SolarSystem.types.ts';
import { ensureBool, ensureInteger, ensureType } from './ensure.ts';
import { pLog } from './probes.ts';
import type { Game } from './Game.ts';
import type { Opponent } from './Opponent.ts';
import { runtime } from './runtime.ts';
import { ACTIONS } from './encounter/actions/index.ts';
import { encounterButtons } from './encounter/buttons.ts';
import { captainFor } from './encounter/captains.ts';
import {
  EncounterMode,
  EncounterType,
  isAttackEncounter,
  isAutoMode,
  isEncounterWith,
  isFleeEncounter,
  isIgnoreEncounter,
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
    return encounterButtons(this);
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

  // #pragma mark - PlunderViewControllerDelegate

  plunderViewControllerDidFinishPlundering(controller: Plunder) {
    ensureBool(controller.plundered);

    if (controller.plundered) {
      this.listener.plundered(controller.plundered);
    }

    this.listener.continues(false);
  }
}
