import { AccessoryType } from './Accessory.ts';
import { AlertActionType, AlertViewController } from './alerts.ts';
import {
  KILL_PIRATE_SCORE,
  KILL_POLICE_SCORE,
  KILL_TRADER_SCORE,
  PoliceRecordScore,
  ReputationScore,
} from './Commander.ts';
import { Plunder } from './Plunder.ts';
import { Ship, ShipModelType } from './Ship.ts';
import {
  REACTOR_BAY_COUNT,
  REACTOR_MAX_FUEL,
  Difficulty,
  DragonflyQuestStatus,
  JaporiQuestStatus,
  JarekQuestStatus,
  MonsterQuestStatus,
  ReactorQuestStatus,
  ScarabQuestStatus,
  WildQuestStatus,
} from './SolarSystem.types.ts';
import { tradeItemForType } from './TradeItem.ts';
import {
  TradeItemType,
  FAKE_QUEST_CARGO,
  FAKE_QUEST_CARGO_REACTOR,
  TRADE_ITEM_COUNT,
} from './TradeItem.types.ts';
import { ensureBool, ensureInteger, ensureNumber, ensureType } from './ensure.ts';
import { pLog } from './probes.ts';
import type { Game } from './Game.ts';
import type { Commander } from './Commander.ts';
import type { Opponent } from './Opponent.ts';
import { runtime } from './runtime.ts';
import { attack, autoAttack } from './encounter/actions/attack.ts';
import { autoFlee, flee } from './encounter/actions/flee.ts';
import { ignore } from './encounter/actions/ignore.ts';
import { trade } from './encounter/actions/trade.ts';
import { surrender } from './encounter/actions/surrender.ts';
import { bribe } from './encounter/actions/bribe.ts';
import { submit } from './encounter/actions/submit.ts';
import { plunder } from './encounter/actions/plunder.ts';
import { meet } from './encounter/actions/meet.ts';
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
  isSurrenderEncounter,
} from './encounter/types.ts';
import type { EncounterListener } from './encounter/types.ts';

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

  encounterButtons() {
    const buttons = [];

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

  static _pruneActionsFor(toPrune: string | null, buttons: string[]) {
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

  static _addAutoFor(label: string, buttons: string[]) {
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

  performAction(action: string) {
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

    if (action === 'Auto-Attack') {
      if (!autoAttack(this)) return;
    } else if (action === 'Auto-Flee') {
      if (!autoFlee(this)) return;
    } else if (action === 'Attack') {
      if (!attack(this)) return;
    } else if (action === 'Flee') {
      if (!flee(this)) return;
    } else if (action === 'Ignore') {
      if (!ignore(this)) return;
    } else if (action === 'Trade') {
      if (!trade(this)) return;
    } else if (action === 'Surrender' || action === 'Yield') {
      if (!surrender(this)) return;
    } else if (action === 'Bribe') {
      if (!bribe(this)) return;
    } else if (action === 'Submit') {
      if (!submit(this)) return;
    } else if (action === 'Plunder' || action === 'Board') {
      if (!plunder(this)) return;
    } else if (action === 'Meet') {
      if (!meet(this)) return;
    } else if (action === 'Drink') {
      let alertString: string;
      let consumedString = null;
      let drinkAction = null;

      if (this._type === EncounterType.BottleGood) {
        alertString =
          'This concoction has been extremely hard to find since the elusive Captain Marmoset left on a mission to the heart of a comet. In the old days, this stuff went for thousands of credits a bottle since people reported significant gains in their abilities after quaffing a bottle. Would you like to drink it?';
        consumedString =
          "Mmmmm. Captain Marmoset's Amazing Skill Tonic not only fills you with energy, but tastes like a fine single-malt. You feel a slight tingling in your fingertips.";
        drinkAction = () => {
          pLog.log(105);
          this._game.commander.increaseSkillRandomly();
          if (this._game.difficulty < Difficulty.Hard) {
            this._game.commander.increaseSkillRandomly();
          }
        };
      } else {
        alertString =
          'This concoction has been extremely hard to find since the elusive Captain Marmoset left on a mission to the heart of a comet. The "best used by" date stamped on the bottle has become illegible. The tonic might still be good. Then again, it\'s not clear what happens when the Tonic breaks down...';
        consumedString =
          "While you don't know what it was supposed to taste like, you get the feeling that this dose of tonic was a bit off. This bottle tasted very strange, like slightly salty red wine. You feel a bit dizzy and your teeth itch for a while.";
        drinkAction = () => {
          pLog.log(106);
          this._game.commander.increaseSkillRandomly();
          this._game.commander.decreaseSkillRandomly();
          if (this._game.difficulty >= Difficulty.Hard) {
            this._game.commander.increaseSkillRandomly();
            this._game.commander.decreaseSkillRandomly();
            this._game.commander.decreaseSkillRandomly();
          }
        };
      }

      const aC = new AlertViewController(alertString);

      aC.addAction('Yes, drink it', AlertActionType.Default, () => {
        pLog.log(108);
        drinkAction();

        const aC2 = new AlertViewController(consumedString);

        aC2.addAction('Dismiss', AlertActionType.Default, () => {
          this.listener.continues(false);
        });

        this._presentAlertController(aC2);
      });

      aC.addAction("I'll pass", AlertActionType.Cancel, () => {
        pLog.log(107);
        this.listener.continues(false);
      });

      this._presentAlertController(aC);
    } else if (action === 'Interrupt') {
      pLog.log(52);
      this._endAutoEncounters();
      this.listener.continues(true);
    }

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

  _executeAction(commanderFlees: boolean, completionBlock: (fightContinues: boolean) => void) {
    ensureBool(commanderFlees);

    const opponentHull = this._opponent.ship.hull;
    ensureInteger(opponentHull);
    const commanderHull = this._game.commander.ship.hull;
    ensureInteger(commanderHull);
    let commanderGotHit = false;

    if (
      isAttackEncounter(this._type) ||
      this._type === EncounterType.PostMarieCelestePoliceEncounter
    ) {
      commanderGotHit = this._executeAttackWithAttacker(
        this._opponent,
        this._game.commander,
        commanderFlees
      );
    }

    let opponentGotHit = false;

    if (!commanderFlees) {
      opponentGotHit = this._executeAttackWithAttacker(
        this._game.commander,
        this._opponent,
        isFleeEncounter(this._type)
      );
    }

    if (this._game.commander.ship.hull <= 0 && this._opponent.ship.hull <= 0) {
      if (this._game.commander.hasEscapePod) {
        this._performPodEscape();
        return;
      } else {
        const alertString = 'You and your opponent have managed to destroy each other.';
        const aC = new AlertViewController(alertString);

        aC.addAction('Dismiss', AlertActionType.Default, () => {
          this.listener.destroyed();
        });

        this._presentAlertController(aC);

        return;
      }
    } else if (this._opponent.ship.hull <= 0) {
      let getBounty = false;
      let alertString = 'You have destroyed your opponent.';
      if (
        isEncounterWith(this._type, 'Pirate') &&
        this._opponent.ship.type !== ShipModelType.Mantis &&
        this._game.commander.policeRecordScore >= PoliceRecordScore.Dubious
      ) {
        pLog.log(54);
        getBounty = true;
        alertString = `You earned a bounty of $${this._opponent.ship.bountyForEnemyShipWithOpponent(this._opponent)}.`;
      }

      let attemptScoop = false;

      if (isEncounterWith(this._type, 'Police')) {
        this._game.commander.policeKills++;
        this._game.commander.policeRecordScore += KILL_POLICE_SCORE;
      } else if (isEncounterWith(this._type, 'Pirate')) {
        if (this._opponent.ship.type !== ShipModelType.Mantis) {
          if (getBounty) {
            const bounty = this._opponent.ship.bountyForEnemyShipWithOpponent(this._opponent);
            this._game.commander.credits += bounty;
          }
          this._game.commander.policeRecordScore += KILL_PIRATE_SCORE;

          attemptScoop = true;
        }
        this._game.commander.pirateKills++;
      } else if (isEncounterWith(this._type, 'Trader')) {
        this._game.commander.traderKills++;
        this._game.commander.policeRecordScore += KILL_TRADER_SCORE;

        attemptScoop = true;
      } else if (isEncounterWith(this._type, 'FamousCaptain')) {
        this._game.commander.reputationScore = Math.max(
          this._game.commander.reputationScore + 100,
          ReputationScore.Dangerous
        );
        this._game.replaceNewsContainingString(
          captainFor(this._type).name,
          captainFor(this._type).destroyNews
        );
      } else if (isEncounterWith(this._type, 'Scarab')) {
        this._game.commander.pirateKills++;
        this._game.commander.policeRecordScore += KILL_PIRATE_SCORE;

        this._game.scarabStatus = ScarabQuestStatus.ScarabDestroyed;
        pLog.log(166);
      } else if (isEncounterWith(this._type, 'Monster')) {
        this._game.commander.pirateKills++;
        this._game.commander.policeRecordScore += KILL_PIRATE_SCORE;

        this._game.monsterStatus = MonsterQuestStatus.ClosedMonsterDestroyed;
      } else if (isEncounterWith(this._type, 'Dragonfly')) {
        this._game.commander.pirateKills++;
        this._game.commander.policeRecordScore += KILL_PIRATE_SCORE;

        this._game.dragonflyStatus = DragonflyQuestStatus.ClosedDragonflyDestroyed;
      }

      this._game.commander.reputationScore += 1 + Math.floor(this._opponent.ship.type / 2);

      const aC = new AlertViewController(alertString);

      aC.addAction('Dismiss', AlertActionType.Default, () => {
        if (attemptScoop) {
          this._scoopWithCompletion(() => {
            completionBlock(false);
          });
        } else {
          completionBlock(false);
        }
      });

      this._presentAlertController(aC);
      return;
    } else if (this._game.commander.ship.hull <= 0) {
      this.listener.hullChanged();

      if (this._game.commander.hasEscapePod) {
        this._performPodEscape();
        return;
      } else {
        const alertString = 'Your ship has been destroyed by your opponent.';
        const aC = new AlertViewController(alertString);

        aC.addAction('Dismiss', AlertActionType.Default, () => {
          pLog.log(65);
          this.listener.destroyed();
        });

        this._presentAlertController(aC);
        return;
      }
    }

    if (commanderFlees) {
      let escapeString = null;
      if (this._game.difficulty === Difficulty.Beginner) {
        escapeString = "You've managed to escape your opponent.";
      } else if (
        2 *
          (runtime.gameRand.randomIntBelow(7) +
            Math.floor(
              this._game.commander.ship.crewPilotSkillIncludingCommander(this._game.commander) / 3
            )) >=
        runtime.gameRand.randomIntBelow(
          this._opponent.ship.crewPilotSkillIncludingCommander(this._opponent) *
            (2 + this._game.difficulty)
        )
      ) {
        escapeString = "You've managed to escape your opponent.";
        if (commanderGotHit) {
          escapeString = 'You got hit but still managed to escape.';
        }
      }

      if (escapeString) {
        if (isEncounterWith(this._type, 'Monster')) {
          this._game.monsterHull = this._opponent.ship.hull;
          ensureInteger(this._game.monsterHull);
          pLog.log(143);
        }

        const aC = new AlertViewController(escapeString);

        aC.addAction('Dismiss', AlertActionType.Default, () => {
          completionBlock(false);
        });

        this._presentAlertController(aC);

        return;
      }
    } else if (isSurrenderEncounter(this._type) || isFleeEncounter(this._type)) {
      if (
        4 *
          runtime.gameRand.randomIntBelow(
            this._game.commander.ship.crewPilotSkillIncludingCommander(this._game.commander)
          ) <=
        2 *
          runtime.gameRand.randomIntBelow(
            7 + Math.floor(this._opponent.ship.crewPilotSkillIncludingCommander(this._opponent) / 3)
          )
      ) {
        const alertString = 'Your opponent has managed to escape.';

        const aC = new AlertViewController(alertString);

        aC.addAction('Dismiss', AlertActionType.Default, () => {
          completionBlock(false);
        });

        this._presentAlertController(aC);

        return;
      }
    }

    const prevType = this._type;

    if (this._opponent.ship.hull < opponentHull) {
      if (isEncounterWith(this._type, 'Police')) {
        if (this._opponent.ship.hull < opponentHull / 2) {
          if (this._game.commander.ship.hull < commanderHull / 2) {
            this._type =
              runtime.gameRand.randomIntBelow(10) > 5 ? EncounterType.PoliceFlee : this._type;
          } else {
            this._type = EncounterType.PoliceFlee;
          }
        }
      } else if (isEncounterWith(this._type, 'Pirate')) {
        if (this._opponent.ship.hull < (2 * opponentHull) / 3) {
          if (this._game.commander.ship.hull < (2 * commanderHull) / 3) {
            this._type =
              runtime.gameRand.randomIntBelow(10) > 3 ? EncounterType.PirateFlee : this._type;
          } else {
            this._type =
              runtime.gameRand.randomIntBelow(10) > 8 &&
              this._opponent.ship.type <= ShipModelType.Best
                ? EncounterType.PirateSurrender
                : EncounterType.PirateFlee;
          }
        }
      } else if (isEncounterWith(this._type, 'Trader')) {
        if (this._opponent.ship.hull < (2 * opponentHull) / 3) {
          this._type =
            runtime.gameRand.randomIntBelow(10) > 3
              ? EncounterType.TraderSurrender
              : EncounterType.TraderFlee;
        } else if (this._opponent.ship.hull < (9 * opponentHull) / 10) {
          if (this._game.commander.ship.hull < (2 * commanderHull) / 3) {
            // If you get damaged a lot, the trader keeps attacking
            this._type =
              runtime.gameRand.randomIntBelow(10) > 7 ? EncounterType.TraderFlee : this._type;
          } else if (this._game.commander.ship.hull < (9 * commanderHull) / 10) {
            this._type =
              runtime.gameRand.randomIntBelow(10) > 3 ? EncounterType.TraderFlee : this._type;
          } else {
            this._type = EncounterType.TraderFlee;
          }
        }
      } else if (this._type === EncounterType.PostMarieCelestePoliceEncounter) {
        this._type = EncounterType.PoliceAttack;
      }
    }

    ensureInteger(this._type);

    if (prevType !== this._type) {
      if (!isFleeEncounter(this._type) && this._encounterMode === EncounterMode.AutoAttack) {
        this._encounterMode = EncounterMode.Manual;
      } else if (this._encounterMode === EncounterMode.AutoFlee) {
        this._encounterMode = EncounterMode.Manual;
      }
    }

    this._encounterActionUpdate = '';

    let shipString = null;

    if (isEncounterWith(prevType, 'Police')) {
      shipString = 'police ship';
    } else if (isEncounterWith(prevType, 'Pirate')) {
      shipString = this._opponent.ship.type === ShipModelType.Mantis ? 'alien ship' : 'pirate ship';
    } else if (isEncounterWith(prevType, 'Trader')) {
      shipString = 'trader ship';
    } else if (isEncounterWith(prevType, 'FamousCaptain')) {
      shipString = 'captain';
    } else if (isEncounterWith(prevType, 'Scarab')) {
      shipString = 'Scarab';
    } else if (isEncounterWith(prevType, 'Monster')) {
      shipString = 'monster';
    } else if (isEncounterWith(prevType, 'Dragonfly')) {
      shipString = 'Dragonfly';
    }

    let delimit = '';
    if (commanderGotHit) {
      this._encounterActionUpdate += `The ${shipString} hits you.`;
      delimit = '\n';
    }

    if (!isFleeEncounter(prevType) && !commanderGotHit) {
      this._encounterActionUpdate += `${delimit}The ${shipString} missed you.`;
      delimit = '\n';
    }

    if (opponentGotHit) {
      this._encounterActionUpdate += `${delimit}You hit the ${shipString}.`;
      delimit = '\n';
    }

    if (!commanderFlees && !opponentGotHit) {
      const hasWeapons = this._game.commander.ship.weapons.length > 0;
      if (hasWeapons) {
        this._encounterActionUpdate += `${delimit}You missed the ${shipString}.`;
      } else {
        this._encounterActionUpdate += `${delimit}You have no weapons!`;
      }
      delimit = '\n';
    }

    if (isFleeEncounter(prevType)) {
      this._encounterActionUpdate += `${delimit}The ${shipString} didn't get away.`;
      delimit = '\n';
    }

    if (commanderFlees) {
      this._encounterActionUpdate += `${delimit}The ${shipString} is still following you.`;
    }

    completionBlock(true);
  }

  _performPodEscape() {
    this.listener.destroyed();
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

  _executeAttackWithAttacker(
    attacker: Commander | Opponent,
    defender: Commander | Opponent,
    defenderIsFleeing: boolean
  ) {
    ensureType(attacker, 'object');
    ensureType(defender, 'object');
    ensureBool(defenderIsFleeing);

    const commanderUnderAttack = defender === this._game.commander;

    if (
      this._game.difficulty === Difficulty.Beginner &&
      commanderUnderAttack &&
      defenderIsFleeing
    ) {
      return false; // Escape unharmed
    }

    const attackDiceRoll = runtime.gameRand.randomIntBelow(
      attacker.ship.crewFighterSkillIncludingCommander(attacker) + defender.ship.model.size
    );
    ensureInteger(attackDiceRoll);

    const dodgeDiceRoll =
      (defenderIsFleeing ? 2 : 1) *
      runtime.gameRand.randomIntBelow(
        5 + Math.floor(defender.ship.crewPilotSkillIncludingCommander(defender) / 2)
      );
    ensureInteger(dodgeDiceRoll);

    if (attackDiceRoll < dodgeDiceRoll) {
      return false; // Defender dodged
    }

    // Ensure we truncate to integer wherever this factor is used
    const ATTACK_SCALE =
      (100 + 2 * attacker.ship.crewEngineerSkillIncludingCommander(attacker)) / 100;
    ensureNumber(ATTACK_SCALE);

    let damage: number;
    if (attacker.ship.weapons.length <= 0) {
      damage = 0;
    } else if (defender.ship.type === ShipModelType.Scarab) {
      const pulsePower = attacker.ship.weaponPowerBetweenMinMaxInclusive(
        AccessoryType.WeaponPulseLaser,
        AccessoryType.WeaponPulseLaser
      );
      ensureInteger(pulsePower);

      const morganPower = attacker.ship.weaponPowerBetweenMinMaxInclusive(
        AccessoryType.WeaponMorgansLaser,
        AccessoryType.WeaponMorgansLaser
      );
      ensureInteger(morganPower);

      if (pulsePower + morganPower <= 0) {
        damage = 0;
        pLog.log(167);
      } else {
        damage = runtime.gameRand.randomIntBelow((pulsePower + morganPower) * ATTACK_SCALE);
        pLog.log(168);
      }
    } else {
      const weaponPower = attacker.ship.weaponPowerBetweenMinMaxInclusive(
        AccessoryType.WeaponFirst,
        AccessoryType.WeaponLast
      );
      ensureInteger(weaponPower);

      damage = runtime.gameRand.randomIntBelow(weaponPower * ATTACK_SCALE);
    }

    ensureInteger(damage);
    if (damage <= 0) {
      return false;
    }

    // Reactor weakens our hull and shields
    if (
      commanderUnderAttack &&
      this._game.reactorStatus > ReactorQuestStatus.Open &&
      this._game.reactorStatus < ReactorQuestStatus.ClosedTooLate
    ) {
      damage *= Math.floor(
        1 + (this._game.difficulty + 1) * (this._game.difficulty < Difficulty.Normal ? 0.25 : 0.33)
      );
    }

    ensureInteger(damage);
    damage = defender.ship.damageShieldsByAmount(damage);
    ensureInteger(damage);

    if (damage > 0) {
      damage -= runtime.gameRand.randomIntBelow(
        defender.ship.crewEngineerSkillIncludingCommander(defender)
      );
      damage = Math.max(1, damage);

      // Our ship will survive at least 2 shots on Normal, 3 on Easy, 4 on Beginner, etc. Opponents survive at least 2.
      const scaleFactor = commanderUnderAttack
        ? Math.max(1, Difficulty.Absurd - this._game.difficulty)
        : 2;
      ensureInteger(scaleFactor);

      damage = Math.min(damage, Math.floor(defender.ship.maximumHullStrength() / scaleFactor));

      ensureInteger(damage);

      defender.ship.damageHullByAmount(damage);
    }

    return true;
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
