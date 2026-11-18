import { AlertActionType, AlertViewController } from '../alerts.ts';
import { Encounter } from '../encounter/Encounter.ts';
import { EncounterType } from '../encounter/types.ts';
import type { ActionName, EncounterListener } from '../encounter/types.ts';
import { GameEndStatus } from '../Game.ts';
import { Opponent, OpponentType } from '../Opponent.ts';
import { MAX_TRIBBLES } from '../Ship.ts';
import { ReactorQuestStatus } from '../SolarSystem.types.ts';
import { TradeItemType } from '../TradeItem.types.ts';
import { Store } from '../Store.ts';
import type { SolarSystem } from '../SolarSystem.ts';
import type { Game, GameEndedStatus } from '../Game.ts';
import { ensureInteger } from '../ensure.ts';
import { pLog } from '../probes.ts';
import { runtime } from '../runtime.ts';
import { pirateMeeting } from './pirates.ts';
import { podEscape } from './podEscape.ts';
import { policeMeeting } from './police.ts';
import { rareEventMeeting } from './rareEvents.ts';
import { dragonflyMeeting, monsterMeeting, scarabMeeting } from './specialShips.ts';
import { traderMeeting } from './traders.ts';
import { whoIsMet } from './whoIsMet.ts';

// How a trip ended: the commander arrived, or the game is over.
export type TravelResult = 'arrived' | GameEndedStatus;

// One trip between two systems: what is met on the way, the fights, and the arrival.
// The travel screen watches this and draws what it finds.
export class Travel extends Store implements EncounterListener {
  declare _game: Game;
  declare _origin: SolarSystem;
  declare _destination: SolarSystem;
  declare _destWasVisited: boolean;
  declare _startClicksRemaining: number;
  declare _startedEncounters: boolean;
  declare _needPostMarieCustomsPolice: boolean;
  declare _encounterController: Encounter | null;
  declare _done: (result: TravelResult) => void;
  // How far along the trip is, from 0 to 1.
  progress = 0;
  private onProgress: ((progress: number) => void) | null = null;

  constructor(
    game: Game,
    origin: SolarSystem,
    destination: SolarSystem,
    wasVisited: boolean,
    done: (result: TravelResult) => void
  ) {
    super();
    this._game = game;
    this._origin = origin;
    this._destination = destination;
    this._destWasVisited = wasVisited;
    this._startClicksRemaining = this._game.commander.travelClicksRemaining;
    this._startedEncounters = false;
    this._needPostMarieCustomsPolice = false;
    this._encounterController = null;
    this._done = done;
  }

  get game() {
    return this._game;
  }
  get origin() {
    return this._origin;
  }
  get destination() {
    return this._destination;
  }
  get wasVisited() {
    return this._destWasVisited;
  }
  get encounter() {
    return this._encounterController;
  }

  // Lets the screen hear about each move as it happens. Returns a function that stops it.
  watchProgress(listener: (progress: number) => void): () => void {
    this.onProgress = listener;
    return () => {
      if (this.onProgress === listener) this.onProgress = null;
    };
  }

  // Begins the trip. Safe to call again; it only starts once.
  start() {
    if (!this._startedEncounters) {
      this._startedEncounters = true;
      this._processEncounters();
    }
  }

  // The player picked one of the encounter's buttons.
  perform(action: ActionName) {
    this._encounterController!.performAction(action);
  }

  _processEncounters() {
    const eventLoopInitialClicks = this._game.commander.travelClicksRemaining;
    let currentClicks = eventLoopInitialClicks;

    currentClicks = Math.max(currentClicks - 1, 0);
    if (currentClicks <= 0) {
      this._game.commander.travelClicksRemaining = currentClicks;
      this._setProgress(1 - (currentClicks * 1.0) / this._startClicksRemaining);
    }

    while (currentClicks > 0) {
      let encounterType: EncounterType;

      this._game.commander.travelClicksRemaining = currentClicks;
      this._setProgress(1 - (currentClicks * 1.0) / this._startClicksRemaining);

      // Automatic repairs based on engineering skill
      const engineerSkill = this._game.commander.ship.crewEngineerSkillIncludingCommander(
        this._game.commander
      );
      let repairAmount = runtime.gameRand.randomIntBelow(engineerSkill / 2);

      repairAmount = this._game.commander.ship.repairHullByAmount(repairAmount);
      this._game.commander.ship.rechargeShieldPowerByAmount(2 * repairAmount); // Shields are easier to recharge

      const opponentType = whoIsMet(this, currentClicks);

      let opponent: Opponent | null;

      if (opponentType === OpponentType.Police) {
        ({ encounterType, opponent } = policeMeeting(this, opponentType, currentClicks));
      } else if (opponentType === OpponentType.Pirate || opponentType === OpponentType.Mantis) {
        ({ encounterType, opponent } = pirateMeeting(this._game, opponentType));
      } else if (opponentType === OpponentType.Trader) {
        ({ encounterType, opponent } = traderMeeting(this._game, opponentType));
      } else if (opponentType === OpponentType.Scarab) {
        ({ encounterType, opponent } = scarabMeeting(this._game, opponentType));
      } else if (opponentType === OpponentType.Dragonfly) {
        ({ encounterType, opponent } = dragonflyMeeting(this._game, opponentType));
      } else if (opponentType === OpponentType.Monster) {
        ({ encounterType, opponent } = monsterMeeting(this._game, opponentType));
      } else {
        ({ encounterType, opponent } = rareEventMeeting(this._game));
      }

      if (encounterType !== EncounterType.None && opponent) {
        const encounterController = new Encounter(encounterType, this._game, opponent, this);
        this.setEncounterController(encounterController);
        return;
      }

      currentClicks--;
    }

    this._game.handleArrival();

    this._setProgress(1);
    this.setEncounterController(null);

    const alertStrings = [];

    alertStrings.push(
      eventLoopInitialClicks >= this._startClicksRemaining
        ? 'After an uneventful trip, you arrive at your destination.'
        : 'You arrive at your destination.'
    );

    if (this._game.commander.debt >= 75000) {
      alertStrings.push(
        'Your debt is getting too large. Reduce it quickly or your ship will be put on a chain!'
      );
    } else if (
      this._game.commander.debt > 0 &&
      this._game.remindLoans &&
      this._game.commander.days % 5 === 0
    ) {
      alertStrings.push(`You have a debt of $${this._game.commander.debt}.`);
    }

    switch (this._game.reactorStatus) {
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
        this._game.reactorStatus = ReactorQuestStatus.ClosedTooLate;

        const alerts = [];

        alerts.push(
          'Just as you approach the docking bay, the reactor explodes into a huge radioactive fireball!'
        );
        if (!this._game.commander.hasEscapePod) {
          alerts.push('You are destroyed along with your ship as a result of the explosion.');
        }

        this._promptForStrings(alerts, () => {
          if (this._game.commander.hasEscapePod) {
            podEscape(this);
            pLog.log(155);
          } else {
            this._done(GameEndStatus.Killed);
            pLog.log(156);
          }
        });

        return;
      }
    }

    let foodOnBoard = false;
    let currentTribbles = this._game.commander.ship.tribbles;
    ensureInteger(currentTribbles);

    const previousTribbles = currentTribbles;
    const reactorStatus =
      this._game.reactorStatus > ReactorQuestStatus.Open &&
      this._game.reactorStatus < ReactorQuestStatus.ClosedTooLate;

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
      this._game.commander.ship.tradeItemQuantityForType(TradeItemType.Narcotics) > 0
    ) {
      currentTribbles = 1 + runtime.gameRand.randomIntBelow(3);
      const amountNarcotics = this._game.commander.ship.tradeItemQuantityForType(
        TradeItemType.Narcotics
      );
      const consumedNarcotics = Math.min(1 + runtime.gameRand.randomIntBelow(3), amountNarcotics);
      this._game.commander.ship.soldQuantity(consumedNarcotics, TradeItemType.Narcotics);
      this._game.commander.ship.boughtQuantity(consumedNarcotics, TradeItemType.Furs, 0);
      alertStrings.push(
        'You find that, instead of narcotics, some of your cargo bays contain only dead tribbles!'
      );
      pLog.log(158);
    } else if (
      currentTribbles > 0 &&
      this._game.commander.ship.tradeItemQuantityForType(TradeItemType.Food) > 0
    ) {
      const amountFood = this._game.commander.ship.tradeItemQuantityForType(TradeItemType.Food);
      currentTribbles += 100 + runtime.gameRand.randomIntBelow(amountFood * 100);
      const foodConsumed = runtime.gameRand.randomIntBelow(amountFood);
      this._game.commander.ship.soldQuantity(foodConsumed, TradeItemType.Food);
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
    this._game.commander.ship.tribbles = currentTribbles;

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

    this._game.tribbleMessage = false;

    const engineerSkill = this._game.commander.ship.crewEngineerSkillIncludingCommander(
      this._game.commander
    );
    const repairAmount = runtime.gameRand.randomIntBelow(engineerSkill);
    this._game.commander.ship.repairHullByAmount(repairAmount);

    let failString = '';
    if (this._game.autoFuel) {
      pLog.log(37);
      this._game.commander.attemptPurchaseOfFuel(this._game.commander.ship.fuelTankCapacity());
      if (this._game.commander.ship.fuelTankCapacity() !== this._game.commander.ship.fuel) {
        failString += 'full tanks';
      }
    }

    if (this._game.autoRepairs) {
      pLog.log(38);
      this._game.commander.attemptPurchaseOfRepairs(
        this._game.commander.ship.maximumHullStrength()
      );
      if (this._game.commander.ship.maximumHullStrength() !== this._game.commander.ship.hull) {
        failString += `${failString.length > 0 ? ' or ' : ''}full hull repairs`;
      }
    }

    this._promptForStrings(alertStrings, () => {
      this._done('arrived');

      if (failString.length > 0) {
        const aC = new AlertViewController(`You don't have enough money to buy ${failString}.`);

        aC.addAction('Darn', AlertActionType.Default, null);

        aC.presentView();
      }
    });
  }

  _promptForStrings(alertStrings: string[], completion: () => void) {
    const firstString = alertStrings.length > 0 ? alertStrings[0] : null;

    if (firstString) {
      alertStrings.shift(); // Removes the first element from the array

      const aC = new AlertViewController(firstString);
      aC.addAction('Dismiss', AlertActionType.Default, () => {
        this._promptForStrings(alertStrings, completion);
      });

      aC.presentView();
    } else {
      completion(); // Call the completion handler when the array is empty
    }
  }

  setEncounterController(eC: Encounter | null) {
    if (eC !== this._encounterController) {
      if (this._encounterController) {
        this._encounterController.invalidate();
      }

      this._encounterController = eC;
    }

    this.changed();
  }

  _setProgress(progress: number) {
    this.progress = progress;
    this.onProgress?.(progress);
  }

  // What the encounter tells the trip.

  plundered(anythingTaken: boolean) {
    const type = this._encounterController?.type;
    if (type === EncounterType.MarieCelesteEncounter && anythingTaken) {
      this._needPostMarieCustomsPolice = true;
    }
  }

  continues(fightGoesOn: boolean) {
    if (fightGoesOn) {
      this.changed();
    } else {
      this.setEncounterController(null);
      this._processEncounters();
    }
  }

  hullChanged() {
    this.changed();
  }

  buttonsChanged() {
    this.changed();
  }

  arrested() {
    this.setEncounterController(null);
    this._done('arrived');
  }

  destroyed() {
    this.setEncounterController(null);

    if (this._game.commander.hasEscapePod) {
      pLog.log(29);
      // The pod lands at the destination, which the trip has not reached yet.
      this._game.handleArrival();
      podEscape(this);
    } else {
      pLog.log(30);
      this._done(GameEndStatus.Killed);
    }
  }
}

// What a click of the trip brings: the opponent and how the encounter with it starts.
// No encounter starts when the type is None or there is no opponent.
export type Meeting = { encounterType: EncounterType; opponent: Opponent | null };
