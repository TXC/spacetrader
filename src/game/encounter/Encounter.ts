import { AlertActionType, AlertViewController } from '../alerts.ts';
import { Plunder } from '../Plunder.ts';
import { ReactorQuestStatus, WildQuestStatus } from '../SolarSystem.types.ts';
import { ensureBool, ensureInteger, ensureType } from '../ensure.ts';
import { pLog } from '../probes.ts';
import type { Game } from '../Game.ts';
import type { Opponent } from '../Opponent.ts';
import { runtime } from '../runtime.ts';
import { ACTIONS } from './actions/index.ts';
import { encounterButtons } from './buttons.ts';
import { encounterText } from './text.ts';
import { EncounterMode, EncounterType, isAutoMode } from './types.ts';
import type { ActionName, EncounterListener } from './types.ts';

export class Encounter {
  declare _type: EncounterType;
  declare _game: Game;
  declare _opponent: Opponent;
  declare _encounterActionUpdate: string | null;
  declare _actionTaken: boolean;
  declare _encounterMode: number;
  declare _autoEncounterSession: number;
  declare listener: EncounterListener;

  constructor(type: EncounterType, game: Game, opponent: Opponent, listener: EncounterListener) {
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

  encounterText(): string {
    return encounterText(this);
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
    this._endAutoModeUnlessContinuedBy(action);

    if (!ACTIONS[action](this)) return;

    this._repeatAutoAction();
  }

  // An automatic mode ends before another action is performed and the owner is told.
  _endAutoModeUnlessContinuedBy(action: ActionName) {
    if (this._encounterMode === EncounterMode.AutoAttack && !action.endsWith('Attack')) {
      pLog.log(48);
      this._endAutoEncounters();
    } else if (this._encounterMode === EncounterMode.AutoFlee && !action.endsWith('Flee')) {
      pLog.log(49);
      this._endAutoEncounters();
    }
  }

  // In an automatic mode the same action is performed again after a moment, unless the
  // mode has ended by then.
  _repeatAutoAction() {
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
  }

  _endAutoEncounters() {
    this._autoEncounterSession++;
    this._encounterMode = EncounterMode.Manual;
    this.listener.buttonsChanged();
  }

  _presentAlertController(alertController: AlertViewController) {
    this._endAutoEncounters();
    alertController.presentView();
  }

  // The plunder screen was closed.

  plunderViewControllerDidFinishPlundering(controller: Plunder) {
    ensureBool(controller.plundered);

    if (controller.plundered) {
      this.listener.plundered(controller.plundered);
    }

    this.listener.continues(false);
  }
}
