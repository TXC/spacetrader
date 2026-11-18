import { AlertActionType, AlertViewController } from '../alerts.ts';
import { Encounter } from '../encounter/Encounter.ts';
import { EncounterType } from '../encounter/types.ts';
import type { ActionName, EncounterListener } from '../encounter/types.ts';
import { GameEndStatus } from '../Game.ts';
import { Opponent, OpponentType } from '../opponent/Opponent.ts';
import { Store } from '../Store.ts';
import type { SolarSystem } from '../SolarSystem.ts';
import type { Game, GameEndedStatus } from '../Game.ts';
import { pLog } from '../probes.ts';
import { runtime } from '../runtime.ts';
import { arrive } from './arrival.ts';
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
  declare _encounter: Encounter | null;
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
    this._encounter = null;
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
    return this._encounter;
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
    this._encounter!.performAction(action);
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
      this._game.commander.travelClicksRemaining = currentClicks;
      this._setProgress(1 - (currentClicks * 1.0) / this._startClicksRemaining);

      repairOnTheWay(this._game);

      const opponentType = whoIsMet(this, currentClicks);
      const { encounterType, opponent } = meeting(this, opponentType, currentClicks);

      if (encounterType !== EncounterType.None && opponent) {
        const encounter = new Encounter(encounterType, this._game, opponent, this);
        this.setEncounter(encounter);
        return;
      }

      currentClicks--;
    }

    arrive(this, eventLoopInitialClicks);
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

  setEncounter(encounter: Encounter | null) {
    if (encounter !== this._encounter) {
      if (this._encounter) {
        this._encounter.invalidate();
      }

      this._encounter = encounter;
    }

    this.changed();
  }

  _setProgress(progress: number) {
    this.progress = progress;
    this.onProgress?.(progress);
  }

  // What the encounter tells the trip.

  plundered(anythingTaken: boolean) {
    const type = this._encounter?.type;
    if (type === EncounterType.MarieCelesteEncounter && anythingTaken) {
      this._needPostMarieCustomsPolice = true;
    }
  }

  continues(fightGoesOn: boolean) {
    if (fightGoesOn) {
      this.changed();
    } else {
      this.setEncounter(null);
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
    this.setEncounter(null);
    this._done('arrived');
  }

  destroyed() {
    this.setEncounter(null);

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

function repairOnTheWay(game: Game): void {
  // Automatic repairs based on engineering skill
  const engineerSkill = game.commander.ship.crewEngineerSkillIncludingCommander(game.commander);
  // Not rounded on purpose: a roll up to half the skill is the original's roll up to the
  // skill, halved.
  let repairAmount = runtime.gameRand.randomIntBelow(engineerSkill / 2);

  repairAmount = game.commander.ship.repairHullByAmount(repairAmount);
  game.commander.ship.rechargeShieldPowerByAmount(2 * repairAmount); // Shields are easier to recharge
}

// Asks the kind of opponent that was picked how it behaves.
function meeting(travel: Travel, opponentType: number, currentClicks: number): Meeting {
  if (opponentType === OpponentType.Police) {
    return policeMeeting(travel, opponentType, currentClicks);
  } else if (opponentType === OpponentType.Pirate || opponentType === OpponentType.Mantis) {
    return pirateMeeting(travel._game, opponentType);
  } else if (opponentType === OpponentType.Trader) {
    return traderMeeting(travel._game, opponentType);
  } else if (opponentType === OpponentType.Scarab) {
    return scarabMeeting(travel._game, opponentType);
  } else if (opponentType === OpponentType.Dragonfly) {
    return dragonflyMeeting(travel._game, opponentType);
  } else if (opponentType === OpponentType.Monster) {
    return monsterMeeting(travel._game, opponentType);
  } else {
    return rareEventMeeting(travel._game);
  }
}
