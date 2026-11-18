import { countOf } from './texts.ts';
import type { ValueOf } from './texts.ts';
import { Commander } from './Commander.ts';
import { CrewMember } from './CrewMember.ts';
import { politicsForType, PoliticsType } from './Politics.ts';
import { MAX_TRIBBLES, Ship, shipModelForType, ShipModelType } from './Ship.ts';
import { SolarSystem } from './SolarSystem.ts';
import {
  REACTOR_BAY_COUNT,
  REACTOR_MAX_FUEL,
  Difficulty,
  DragonflyQuestStatus,
  ExperimentQuestStatus,
  InvasionQuestStatus,
  JaporiQuestStatus,
  JarekQuestStatus,
  MonsterQuestStatus,
  ReactorQuestStatus,
  ScarabQuestStatus,
  SpecialEvent,
  WildQuestStatus,
} from './SolarSystem.types.ts';
import {
  FABRIC_RIP_PROBABILITY_INITIAL,
  randomOccurrenceEventTypes,
} from './SpecialEventSpecifier.ts';
import { TechLevel, FAKE_QUEST_CARGO_REACTOR } from './TradeItem.types.ts';
import {
  ensureArrayOrNull,
  ensureBool,
  ensureInteger,
  ensureObjectOrNull,
  ensureType,
} from './ensure.ts';
import { GameRand } from './GameRand.ts';
import { pLog } from './probes.ts';
import { runtime } from './runtime.ts';

export const GALAXY_WIDTH = 150;
export const GALAXY_HEIGHT = 110;

export const STARTING_CREDITS = 1000;

export const GameEndStatus = {
  None: 0,
  Retired: 1,
  Killed: 2,
  Moon: 3,
} as const;
export type GameEndStatus = (typeof GameEndStatus)[keyof typeof GameEndStatus];
// How a game that is over ended.
export type GameEndedStatus = Exclude<GameEndStatus, typeof GameEndStatus.None>;

export const RareEvent = {
  MarieCeleste: 0,
  CaptainAhab: 1,
  CaptainConrad: 2,
  CaptainHuie: 3,
  BottleOld: 4,
  BottleGood: 5,
} as const;
export type RareEvent = ValueOf<typeof RareEvent>;
export const RARE_EVENT_COUNT = countOf(RareEvent);

export const MIN_DISTANCE = 6;

export const DIAGONAL_SIZE = Math.sqrt(GALAXY_WIDTH * GALAXY_WIDTH + GALAXY_HEIGHT * GALAXY_HEIGHT);
export const CLOSE_DISTANCE = Math.max(MIN_DISTANCE, 0.07 * DIAGONAL_SIZE);

export const WORMHOLE_COUNT = 6;

export const MERCENARY_COUNT = CrewMember.mercenaryNames().length;

import { SAVE_VERSION } from './savedGame.ts';
import type { GameState } from './savedGame.ts';
export type { GameState };

const SPECIAL_SQR_DISTANCE = 70 * 70;

// The nearest system without a special event that is at least SPECIAL_SQR_DISTANCE away; of
// several equally near, the first in `candidates`.
function nearestFreeSystem(
  origin: SolarSystem,
  candidates: SolarSystem[]
): SolarSystem | undefined {
  return candidates
    .filter(other => other.specialEvent === SpecialEvent.None)
    .map(other => ({ other, distance: origin.squaredDistanceTo(other) }))
    .filter(({ distance }) => distance >= SPECIAL_SQR_DISTANCE)
    .sort((a, b) => a.distance - b.distance)[0]?.other;
}

export class Game {
  // `new Game()` with no commander returns an empty shell that fromSerializedState() fills in.
  // `_remainingRareEvents` is typed as always set, but is unset until the game is set up.
  declare _onSave: ((game: Game) => void) | null;
  declare _onChange: (() => void) | null;
  declare _uniqueID: string;
  declare _endStatus: number;
  declare _trackedSystem: SolarSystem | null;
  declare _breakingNews: string[] | null;
  declare canSuperWarp: boolean;
  declare autoNews: boolean;
  declare autoRepairs: boolean;
  declare autoFuel: boolean;
  declare remindLoans: boolean;
  declare tribbleMessage: boolean;
  declare alreadyPaidForNewspaper: boolean;
  declare alwaysIgnorePirates: boolean;
  declare alwaysIgnorePolice: boolean;
  declare alwaysIgnoreTraders: boolean;
  declare alwaysIgnoreTradeInOrbit: boolean;
  declare monsterStatus: number;
  declare dragonflyStatus: number;
  declare scarabStatus: number;
  declare japoriQuestStatus: number;
  declare jarekStatus: number;
  declare invasionStatus: number;
  declare experimentStatus: number;
  declare fabricRipProbability: number;
  declare wildStatus: number;
  declare reactorStatus: number;
  declare commander: Commander;
  declare difficulty: number;
  declare _monsterHull: number;
  declare _remainingRareEvents: number[];
  declare solarSystems: SolarSystem[];
  declare _warpSystem: SolarSystem | null;
  declare _lastSave?: Date; // unset until the first serializedState()
  // Set by the cheats panel, read by the old screens.
  declare forceRareEvent?: boolean;
  declare showSpecialSystems?: boolean;

  constructor(difficulty?: number, commander?: Commander) {
    this._onSave = null;
    this._onChange = null;

    if (commander) {
      this._uniqueID = this._generateUniqueID();
      this._endStatus = GameEndStatus.None;

      this._trackedSystem = null;
      this._breakingNews = null;

      this.canSuperWarp = false;
      this.autoNews = false;
      this.autoRepairs = false;
      this.autoFuel = false;
      this.remindLoans = false;
      this.tribbleMessage = false;
      this.alreadyPaidForNewspaper = false;
      this.alwaysIgnorePirates = false;
      this.alwaysIgnorePolice = false;
      this.alwaysIgnoreTraders = false;
      this.alwaysIgnoreTradeInOrbit = false;

      this.monsterStatus = 0;
      this.dragonflyStatus = 0;
      this.scarabStatus = 0;
      this.japoriQuestStatus = 0;
      this.jarekStatus = 0;
      this.invasionStatus = 0;
      this.experimentStatus = 0;
      this.fabricRipProbability = 0;
      this.wildStatus = 0;
      this.reactorStatus = 0;

      ensureType(commander, 'object');
      this.commander = commander;

      ensureInteger(difficulty);
      this.difficulty = difficulty!;

      this._populateSolarSystems();
      this._setupEventsAndMercenaries();
      this._setupCommander();
      this._setupInitialGameState();
    }
  }

  static fromSerializedState(serializedState: GameState) {
    const instance = new Game();

    instance.monsterStatus = serializedState.monsterStatus;
    instance.dragonflyStatus = serializedState.dragonflyStatus;
    instance.scarabStatus = serializedState.scarabStatus;
    instance.japoriQuestStatus = serializedState.japoriQuestStatus;
    instance.jarekStatus = serializedState.jarekStatus;
    instance.invasionStatus = serializedState.invasionStatus;
    instance.experimentStatus = serializedState.experimentStatus;
    instance.fabricRipProbability = serializedState.fabricRipProbability;
    instance.wildStatus = serializedState.wildStatus;
    instance.reactorStatus = serializedState.reactorStatus;
    instance.difficulty = serializedState.difficulty;
    instance._endStatus = serializedState.endStatus;

    instance._monsterHull = serializedState.monsterHull;

    instance.remindLoans = serializedState.remindLoans;
    instance.tribbleMessage = serializedState.tribbleMessage;
    instance.alreadyPaidForNewspaper = serializedState.alreadyPaidForNewspaper;
    instance.alwaysIgnorePirates = serializedState.alwaysIgnorePirates;
    instance.alwaysIgnorePolice = serializedState.alwaysIgnorePolice;
    instance.alwaysIgnoreTraders = serializedState.alwaysIgnoreTraders;
    instance.alwaysIgnoreTradeInOrbit = serializedState.alwaysIgnoreTradeInOrbit;
    instance.autoFuel = serializedState.autoFuel;
    instance.autoRepairs = serializedState.autoRepairs;
    instance.autoNews = serializedState.autoNews;
    instance.canSuperWarp = serializedState.canSuperWarp;

    if (serializedState.breakingNews) {
      pLog.log(71);
      instance._breakingNews = [...serializedState.breakingNews];
      ensureArrayOrNull(instance._breakingNews, 'string');
    } else {
      pLog.log(72);
      instance._breakingNews = null;
    }

    instance._remainingRareEvents = [...serializedState.remainingRareEvents];
    ensureArrayOrNull(instance._remainingRareEvents, 'number');

    instance.solarSystems = serializedState.solarSystems.map(ss => SolarSystem.load(ss));

    instance.solarSystems.forEach((solarSystem, idx) => {
      solarSystem.updateWormholeForSerializedState(
        serializedState.solarSystems[idx],
        instance.solarSystems
      );
    });

    instance._warpSystem = instance._findSolarSystem(serializedState.warpSystemName);
    instance._trackedSystem = instance._findSolarSystem(serializedState.trackedSystemName);

    instance.commander = Commander.fromSerializedState(
      serializedState.commander,
      instance.solarSystems
    );

    instance._lastSave = new Date(serializedState.lastSave);

    instance._uniqueID = serializedState.uniqueID || instance._generateUniqueID();

    return instance;
  }

  get trackedSystem() {
    return this._trackedSystem;
  }

  set trackedSystem(s) {
    if (ensureObjectOrNull(s)) {
      this._trackedSystem = s;
    }
  }

  get endStatus() {
    return this._endStatus;
  }

  set endStatus(st) {
    if (ensureInteger(st)) {
      this._endStatus = st;
    }
  }

  get uniqueID() {
    return this._uniqueID;
  }

  _generateUniqueID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  serializedState() {
    // Filled in field by field below.
    const state = {} as GameState;

    ensureInteger(this.monsterStatus);
    state.monsterStatus = this.monsterStatus;

    ensureInteger(this.dragonflyStatus);
    state.dragonflyStatus = this.dragonflyStatus;

    ensureInteger(this.scarabStatus);
    state.scarabStatus = this.scarabStatus;

    ensureInteger(this.japoriQuestStatus);
    state.japoriQuestStatus = this.japoriQuestStatus;

    ensureInteger(this.jarekStatus);
    state.jarekStatus = this.jarekStatus;

    ensureInteger(this.invasionStatus);
    state.invasionStatus = this.invasionStatus;

    ensureInteger(this.experimentStatus);
    state.experimentStatus = this.experimentStatus;

    ensureInteger(this.fabricRipProbability);
    state.fabricRipProbability = this.fabricRipProbability;

    ensureInteger(this.wildStatus);
    state.wildStatus = this.wildStatus;

    ensureInteger(this.reactorStatus);
    state.reactorStatus = this.reactorStatus;

    ensureInteger(this.difficulty);
    state.difficulty = this.difficulty;

    ensureInteger(this._endStatus);
    state.endStatus = this._endStatus;

    ensureInteger(this._monsterHull);
    state.monsterHull = this._monsterHull;

    state.score = this.score();
    ensureInteger(state.score);

    ensureBool(this.remindLoans);
    state.remindLoans = this.remindLoans;

    ensureBool(this.tribbleMessage);
    state.tribbleMessage = this.tribbleMessage;

    ensureBool(this.alreadyPaidForNewspaper);
    state.alreadyPaidForNewspaper = this.alreadyPaidForNewspaper;

    ensureBool(this.alwaysIgnorePirates);
    state.alwaysIgnorePirates = this.alwaysIgnorePirates;

    ensureBool(this.alwaysIgnorePolice);
    state.alwaysIgnorePolice = this.alwaysIgnorePolice;

    ensureBool(this.alwaysIgnoreTraders);
    state.alwaysIgnoreTraders = this.alwaysIgnoreTraders;

    ensureBool(this.alwaysIgnoreTradeInOrbit);
    state.alwaysIgnoreTradeInOrbit = this.alwaysIgnoreTradeInOrbit;

    ensureBool(this.autoFuel);
    state.autoFuel = this.autoFuel;

    ensureBool(this.autoRepairs);
    state.autoRepairs = this.autoRepairs;

    ensureBool(this.autoNews);
    state.autoNews = this.autoNews;

    ensureBool(this.canSuperWarp);
    state.canSuperWarp = this.canSuperWarp;

    ensureArrayOrNull(this._breakingNews, 'string');
    if (this._breakingNews) {
      state.breakingNews = [...this._breakingNews];
      pLog.log(73);
    }

    state.commander = this.commander.toState();

    ensureObjectOrNull(this._warpSystem);
    if (this._warpSystem) {
      ensureType(this._warpSystem.name, 'string');
      state.warpSystemName = this._warpSystem.name;
    }

    ensureObjectOrNull(this._trackedSystem);
    if (this._trackedSystem) {
      ensureType(this._trackedSystem.name, 'string');
      state.trackedSystemName = this._trackedSystem.name;
      pLog.log(74);
    }

    ensureType(this._uniqueID, 'string');
    state.uniqueID = this._uniqueID;

    ensureArrayOrNull(this._remainingRareEvents, 'number');
    if (this._remainingRareEvents) {
      state.remainingRareEvents = [...this._remainingRareEvents];
      pLog.log(75);
    }

    ensureArrayOrNull(this.solarSystems, 'object');
    state.solarSystems = this.solarSystems.map(solarSystem => solarSystem.toState());

    this._lastSave = new Date();
    state.lastSave = this._lastSave;
    state.version = SAVE_VERSION;

    return state;
  }

  setOnSave(onSave: ((game: Game) => void) | null) {
    this._onSave = onSave;
  }

  save() {
    if (this._onSave) {
      this._onSave(this);
    }
  }

  setOnChange(onChange: (() => void) | null) {
    this._onChange = onChange;
  }

  // A rule calls this after changing the game, so whoever shows the game can draw it again.
  changed() {
    this._onChange?.();
  }

  score() {
    let score: number;
    const worth = this.commander.netWorth();
    const MILLION = 1000000;
    const adjustedWorth = worth < MILLION ? worth : Math.floor(MILLION + (worth - MILLION) / 10);

    if (this._endStatus === GameEndStatus.Killed) {
      score = (this.difficulty + 1) * ((adjustedWorth * 90) / 50000);
    } else if (this._endStatus === GameEndStatus.Retired) {
      score = (this.difficulty + 1) * ((adjustedWorth * 95) / 50000);
    } else {
      const dayFactor = Math.max(0, (this.difficulty + 1) * 100 - this.commander.days);
      score = (this.difficulty + 1) * ((adjustedWorth + dayFactor * 1000) / 500);
    }

    score = Math.floor(score);
    ensureInteger(score);

    return score;
  }

  scorePercentageString() {
    const score = this.score();
    const wholeNumber = Math.floor(score / 50);
    const decimal = Math.floor((score % 50) / 5);
    return `${wholeNumber}.${decimal}%`;
  }

  _populateSolarSystems() {
    if (this.solarSystems) return;

    const solarSystemCount = SolarSystem.solarSystemNames().length;
    const solarSystems = [];
    const solarSystemNames = [...SolarSystem.solarSystemNames()];

    let i = 0;
    while (i < solarSystemCount) {
      let x: number;
      let y: number;
      const hasWormhole = i < WORMHOLE_COUNT;

      if (hasWormhole) {
        // Distribute the wormholes evenly across the board, not too close to the edge

        x =
          Math.floor(CLOSE_DISTANCE / 2) -
          runtime.gameRand.randomIntBelow(CLOSE_DISTANCE) +
          Math.floor(
            (GALAXY_WIDTH * (1 + 2 * (i % Math.floor(WORMHOLE_COUNT / 2)))) / WORMHOLE_COUNT
          );
        y =
          Math.floor(CLOSE_DISTANCE / 2) -
          runtime.gameRand.randomIntBelow(CLOSE_DISTANCE) +
          Math.floor((GALAXY_HEIGHT * (i < Math.floor(WORMHOLE_COUNT / 2) ? 1 : 3)) / 4);
      } else {
        x = 1 + runtime.gameRand.randomIntBelow(GALAXY_WIDTH - 2);
        y = 1 + runtime.gameRand.randomIntBelow(GALAXY_HEIGHT - 2);
      }

      let closeFound = hasWormhole; // systems with wormholes are close to each other
      let tooClose = false;

      // We are trying to fill in systems around existing clusters with wormholes
      if (i >= WORMHOLE_COUNT) {
        for (let j = 0; j < i; ++j) {
          // Enforce minimum distance between two systems
          const squaredDistanceToSystemJ = solarSystems[j].squaredDistanceToXY(x, y);
          if (squaredDistanceToSystemJ <= (MIN_DISTANCE + 1) ** 2) {
            tooClose = true;
            break;
          }

          if (squaredDistanceToSystemJ < CLOSE_DISTANCE ** 2) {
            closeFound = true;
          }
        }
      }

      // We're either too close or not close enough, recalculate coordinates for this system.
      if (tooClose || !closeFound) continue;

      const randomNameIndex = runtime.gameRand.randomIntBelow(solarSystemNames.length);
      const solarSystem = SolarSystem.create(
        solarSystemNames[randomNameIndex],
        x,
        y,
        this.difficulty
      );
      solarSystemNames.splice(randomNameIndex, 1);

      solarSystems.push(solarSystem);

      i++;
    }

    this.solarSystems = solarSystems;

    // Wormholes go in a loop
    const wormholeSystems = solarSystems.slice(0, WORMHOLE_COUNT);
    const randomWormholeSystems = [];
    while (wormholeSystems.length > 0) {
      const randomIndex = runtime.gameRand.randomIntBelow(wormholeSystems.length);
      randomWormholeSystems.push(wormholeSystems[randomIndex]);
      wormholeSystems.splice(randomIndex, 1);
    }

    for (let i = 0; i < WORMHOLE_COUNT - 1; ++i) {
      randomWormholeSystems[i].setWormhole(randomWormholeSystems[i + 1]);
    }
    randomWormholeSystems[WORMHOLE_COUNT - 1].setWormhole(randomWormholeSystems[0]);
  }

  _setupEventsAndMercenaries() {
    // Setup special events and any hard-coded mercenaries

    const eventsToPlace = randomOccurrenceEventTypes();

    const kravat = this._findSolarSystem('Kravat')!;
    kravat.specialEvent = SpecialEvent.WildGetsOut;

    this._findSolarSystem('Acamar')!.specialEvent = SpecialEvent.MonsterKilled;
    this._findSolarSystem('Baratas')!.specialEvent = SpecialEvent.FlyBaratas;
    this._findSolarSystem('Melina')!.specialEvent = SpecialEvent.FlyMelina;
    this._findSolarSystem('Regulas')!.specialEvent = SpecialEvent.FlyRegulas;
    this._findSolarSystem('Zalkon')!.specialEvent = SpecialEvent.DragonflyDestroyed;
    this._findSolarSystem('Japori')!.specialEvent = SpecialEvent.MedicineDelivery;
    this._findSolarSystem('Utopia')!.specialEvent = SpecialEvent.MoonBought;
    this._findSolarSystem('Devidia')!.specialEvent = SpecialEvent.JarekGetsOut;

    const gemulon = this._findSolarSystem('Gemulon')!;
    gemulon.specialEvent = SpecialEvent.GemulonRescued;
    // Perform search in reverse to prefer systems without wormholes
    const solarSystemsReversed = this.solarSystems.slice().reverse();
    nearestFreeSystem(gemulon, solarSystemsReversed)!.specialEvent = SpecialEvent.AlienInvasion;

    const daled = this._findSolarSystem('Daled')!;
    daled.specialEvent = SpecialEvent.ExperimentStopped;
    nearestFreeSystem(daled, solarSystemsReversed)!.specialEvent = SpecialEvent.Experiment;

    const nix = this._findSolarSystem('Nix')!;
    nix.specialEvent = SpecialEvent.ReactorDelivered;
    nearestFreeSystem(nix, solarSystemsReversed)!.specialEvent = SpecialEvent.GetReactor;

    const wormholeSystemsSpecial = this.solarSystems.slice(0, WORMHOLE_COUNT);
    while (wormholeSystemsSpecial.length > 0) {
      const randomIndex = runtime.gameRand.randomIntBelow(wormholeSystemsSpecial.length);
      if (wormholeSystemsSpecial[randomIndex].specialEvent === SpecialEvent.None) {
        wormholeSystemsSpecial[randomIndex].specialEvent = SpecialEvent.ScarabDestroyed;
        eventsToPlace.push(SpecialEvent.Scarab);
        break;
      }
      wormholeSystemsSpecial.splice(randomIndex, 1);
    }

    const highTech = solarSystemsReversed.find(
      system => system.specialEvent === SpecialEvent.None && system.techLevel >= TechLevel.HighTech
    );
    if (highTech) {
      highTech.specialEvent = SpecialEvent.ArtifactDelivered;
      eventsToPlace.push(SpecialEvent.AlienArtifact);
    }

    for (const eventSystem of solarSystemsReversed) {
      if (eventsToPlace.length === 0) {
        break;
      }

      if (eventSystem.specialEvent === SpecialEvent.None) {
        eventSystem.specialEvent = eventsToPlace[0];
        eventsToPlace.shift();
      }
    }

    // Create and place randomized mercenaries
    const names = CrewMember.mercenaryNames();
    for (let i = 0; i < MERCENARY_COUNT - 1; ++i) {
      this._placeMercenary(names[i], runtime.gameRand);
    }

    // The last one draws from a generator of his own, seeded by where the systems lie, so
    // that every other number of a recorded game stays where it was.
    const seed = this.solarSystems.reduce((sum, system) => sum + system.x + system.y, 0);
    this._placeMercenary(names[MERCENARY_COUNT - 1], new GameRand(seed));
  }

  _placeMercenary(name: string, rand: GameRand) {
    let mercenarySystem = null;
    while (!mercenarySystem) {
      mercenarySystem = this.solarSystems[rand.randomIntBelow(this.solarSystems.length)];
      if (mercenarySystem.mercenary) mercenarySystem = null;
    }

    const mercenary = CrewMember.create(name);
    mercenary.randomizeAttributes(rand);
    mercenarySystem.setMercenary(mercenary);
  }

  _setupCommander() {
    this.commander.credits = STARTING_CREDITS;

    const ship = new Ship(ShipModelType.Gnat, this.difficulty);
    this.commander.ship = ship;

    this.commander.setCurrentSystem(this.solarSystems[this.solarSystems.length - 1]);

    let squaredFuel = this.commander.ship.fuel;
    squaredFuel *= squaredFuel;

    const inRangeOf = (system: SolarSystem) =>
      this.solarSystems.filter(other => system.squaredDistanceTo(other) <= squaredFuel);
    const startSystem = this.solarSystems.findLast(
      system =>
        system.specialEvent === SpecialEvent.None &&
        system.techLevel >= TechLevel.Agricultural &&
        system.techLevel < TechLevel.PostIndustrial &&
        inRangeOf(system).length >= 3
    );
    if (startSystem) {
      this.commander.getCurrentSystem().visited = false;
      this.commander.setCurrentSystem(startSystem);
    }
  }

  _setupInitialGameState() {
    for (let i = 0; i < RARE_EVENT_COUNT; ++i) {
      this.addRemainingRareEvents([i]);
    }
    this.addRemainingRareEvents([
      RareEvent.BottleGood,
      RareEvent.BottleGood,
      RareEvent.BottleOld,
      RareEvent.BottleOld,
    ]); // Some extra skill enhancements

    this._warpSystem = this.commander.getCurrentSystem();
    this.remindLoans = true;
    this._monsterHull = shipModelForType(ShipModelType.SpaceMonster).hullStrength;

    if (this.difficulty < Difficulty.Normal) {
      if (this.commander.getCurrentSystem().specialEvent === SpecialEvent.None) {
        pLog.log(109);
        this.commander.getCurrentSystem().specialEvent = SpecialEvent.LotteryWinner;
      }
    }
  }

  _findSolarSystem(name: string | undefined) {
    return SolarSystem.solarSystemForName(name, this.solarSystems);
  }

  solarSystemsWithinRange() {
    const current = this.commander.getCurrentSystem();
    const squaredFuel = this.commander.ship.fuel ** 2;
    const result = this.solarSystems.filter(
      system => system !== current && current.squaredDistanceTo(system) <= squaredFuel
    );
    if (current.wormhole) {
      result.unshift(current.wormhole);
    }

    ensureArrayOrNull(result, 'object');

    return result;
  }

  systemClosestToXY(x: number, y: number) {
    let minDistance = Infinity;
    let closest = null;

    for (let i = 0; i < this.solarSystems.length; i++) {
      const nearbySystem = this.solarSystems[i];
      const distance = nearbySystem.squaredDistanceToXY(x, y);
      if (distance < minDistance) {
        closest = nearbySystem;
        minDistance = distance;
      }
    }
    return closest;
  }

  getBreakingNews() {
    return this._breakingNews;
  }

  get breakingNews() {
    return this._breakingNews;
  }

  addBreakingNewsItem(item: string) {
    if (!ensureType(item, 'string')) {
      return;
    }

    if (!this._breakingNews) {
      this._breakingNews = [];
    }
    this._breakingNews.push(item);
  }

  replaceNewsContainingString(needle: string, item: string) {
    if (!ensureType(needle, 'string')) {
      return;
    }
    if (!ensureType(item, 'string')) {
      return;
    }

    const index = this._breakingNews!.findIndex(existingItem => existingItem.includes(needle));
    if (index !== -1) {
      this._breakingNews!.splice(index, 1);
    }
    this.addBreakingNewsItem(item);
  }

  clearBreakingNews() {
    this._breakingNews = null;
  }

  get remainingRareEvents() {
    return this._remainingRareEvents;
  }

  addRemainingRareEvents(rareEvents: number[]) {
    if (!ensureArrayOrNull(rareEvents, 'number')) {
      return;
    }

    if (!this._remainingRareEvents) {
      this._remainingRareEvents = [];
    }
    this._remainingRareEvents.push(...rareEvents);
  }

  removeRemainingRareEvent(rareEvent: number) {
    ensureInteger(rareEvent);

    const index = this._remainingRareEvents.indexOf(rareEvent);
    if (index !== -1) {
      this._remainingRareEvents.splice(index, 1);
    }
  }

  handleArrival() {
    this.commander.travelClicksRemaining = 0;
    this.updateInventories();
    this.shuffleStatus();
    this.alreadyPaidForNewspaper = false;
  }

  timePassed(days: number) {
    ensureInteger(days);

    this.commander.timePassed(days);

    if (
      this.invasionStatus >= InvasionQuestStatus.DaysUntilInvasion._7 &&
      this.invasionStatus <= InvasionQuestStatus.DaysUntilInvasion._1
    ) {
      this.invasionStatus = Math.min(InvasionQuestStatus.ClosedTooLate, this.invasionStatus + days);
      if (this.invasionStatus === InvasionQuestStatus.ClosedTooLate) {
        const gemulon = this._findSolarSystem('Gemulon')!;
        gemulon.specialEvent = SpecialEvent.GemulonInvaded;
        gemulon.techLevel = TechLevel.PreAgricultural;
        gemulon.politics = politicsForType(PoliticsType.Anarchy);
        gemulon.updateInventories();
        pLog.log(134);
      }
    }

    if (
      this.reactorStatus > ReactorQuestStatus.Open &&
      this.reactorStatus < ReactorQuestStatus.ClosedTooLate
    ) {
      this.reactorStatus = Math.min(ReactorQuestStatus.DaysRemaining._1, this.reactorStatus + days);

      const currentQuantity =
        this.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR);
      const desiredQuantity =
        REACTOR_BAY_COUNT + REACTOR_MAX_FUEL - Math.floor((this.reactorStatus - 1) / 2);
      if (desiredQuantity < currentQuantity) {
        this.commander.ship.soldQuantity(
          currentQuantity - desiredQuantity,
          FAKE_QUEST_CARGO_REACTOR
        );
      }
    }

    if (
      this.experimentStatus >= ExperimentQuestStatus.DaysRemaining._10 &&
      this.experimentStatus <= ExperimentQuestStatus.DaysRemaining._1
    ) {
      this.experimentStatus = Math.min(
        ExperimentQuestStatus.ClosedTooLate,
        this.experimentStatus + days
      );
      if (this.experimentStatus === ExperimentQuestStatus.ClosedTooLate) {
        this.fabricRipProbability = FABRIC_RIP_PROBABILITY_INITIAL;

        const daled = this._findSolarSystem('Daled')!;
        daled.specialEvent = SpecialEvent.ExperimentNotStopped;
        this.addBreakingNewsItem('Travelers Report Timespace Damage, Warp Problems!');
        pLog.log(145);
      }
    } else if (
      this.experimentStatus === ExperimentQuestStatus.ClosedTooLate &&
      this.fabricRipProbability > 0
    ) {
      this.fabricRipProbability -= Math.min(this.fabricRipProbability, days);
      ensureInteger(this.fabricRipProbability);
      pLog.log(146);
    }
  }

  get monsterHull() {
    return this._monsterHull;
  }

  set monsterHull(m) {
    if (ensureInteger(m)) {
      this._monsterHull = m;
    }
  }

  healMonster() {
    this._monsterHull = Math.min(
      shipModelForType(ShipModelType.SpaceMonster).hullStrength,
      Math.floor((this._monsterHull * 105) / 100)
    );
    ensureInteger(this._monsterHull);
    pLog.log(142);
  }

  shuffleStatus() {
    this.solarSystems.forEach(solarSystem => solarSystem.randomizeStatus());
  }

  updateInventories() {
    this.solarSystems.forEach(solarSystem => solarSystem.updateInventories());
  }

  specialCargoDescription() {
    let cargoList = '';
    let comma = '';

    const numTribbles = this.commander.ship.tribbles;
    if (numTribbles > 0) {
      cargoList += comma;
      if (numTribbles >= MAX_TRIBBLES) {
        cargoList += 'An infestation of tribbles.';
      } else {
        cargoList += `${numTribbles} cute, furry tribble${numTribbles === 1 ? '' : 's'}.`;
      }
      comma = '\n';
    }

    if (this.japoriQuestStatus === JaporiQuestStatus.HasMedicine) {
      cargoList += comma;
      cargoList += '10 bays of antidote.';
      comma = '\n';
    }

    if (this.commander.artifactOnBoard) {
      cargoList += comma;
      cargoList += 'An alien artifact.';
      comma = '\n';
    }

    if (
      this.reactorStatus > ReactorQuestStatus.Open &&
      this.reactorStatus < ReactorQuestStatus.ClosedTooLate
    ) {
      cargoList += comma;
      const numFuelBays = Math.max(
        0,
        this.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR) - REACTOR_BAY_COUNT
      );
      cargoList += `An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up ${numFuelBays} bay${numFuelBays === 1 ? '' : 's'}.`;
      comma = '\n';
    }

    if (this.commander.carriesMaxTraderBoost) {
      cargoList += `${comma}A haggling computer.`;
      comma = '\n';
    }

    if (this.canSuperWarp) {
      cargoList += `${comma}A Portable Singularity.`;
    }

    if (cargoList.length === 0) {
      cargoList = 'No special items.';
    }

    return cargoList;
  }

  questListDescription() {
    let questList = '';
    let comma = '';
    const numTribbles = this.commander.ship.tribbles;

    if (numTribbles > 0) {
      pLog.log(76);
      questList += `${comma}Get rid of those pesky tribbles.`;
      comma = '\n';
    }

    if (this.commander.artifactOnBoard) {
      pLog.log(77);
      questList += `${comma}Deliver the alien artifact to Professor Berger at some hi-tech system.`;
      comma = '\n';
    }

    if (
      SolarSystem.solarSystemForName('Nix', this.solarSystems)!.specialEvent ===
      SpecialEvent.GetSpecialLaser
    ) {
      pLog.log(78);
      questList += `${comma}Get your special laser at Nix.`;
      comma = '\n';
    }

    if (this.scarabStatus === ScarabQuestStatus.ScarabDestroyed) {
      const hullSystems = this.solarSystems.filter(
        x => x.specialEvent === SpecialEvent.GetHullUpgraded
      );
      const hullSystem = hullSystems.length > 0 ? hullSystems[0] : null;
      questList += `${comma}Get your hull upgraded at ${hullSystem ? hullSystem.name : ''}.`;
      comma = '\n';
      pLog.log(170);
    }

    if (this.japoriQuestStatus === JaporiQuestStatus.HasMedicine) {
      pLog.log(79);
      questList += `${comma}Deliver antidote to Japori.`;
      comma = '\n';
    }

    if (this.scarabStatus === ScarabQuestStatus.ScarabExists) {
      pLog.log(80);
      questList += `${comma}Find and destroy the Scarab (which is hiding near a wormhole).`;
      comma = '\n';
    }

    if (this.monsterStatus === MonsterQuestStatus.MonsterExists) {
      pLog.log(81);
      questList += `${comma}Kill the space monster at Acamar.`;
      comma = '\n';
    }

    const dragonflyStatus = this.dragonflyStatus;
    if (
      dragonflyStatus > DragonflyQuestStatus.Open &&
      dragonflyStatus !== DragonflyQuestStatus.ClosedDragonflyDestroyed
    ) {
      const nextSystem =
        dragonflyStatus === DragonflyQuestStatus.GoToBaratas
          ? 'Baratas'
          : dragonflyStatus === DragonflyQuestStatus.GoToMelina
            ? 'Melina'
            : dragonflyStatus === DragonflyQuestStatus.GoToRegulas
              ? 'Regulas'
              : 'Zalkon';
      pLog.log(82);
      questList += `${comma}Follow the Dragonfly to ${nextSystem}.`;
      comma = '\n';
    } else if (
      SolarSystem.solarSystemForName('Zalkon', this.solarSystems)!.specialEvent ===
      SpecialEvent.InstallLightningShield
    ) {
      pLog.log(83);
      questList += `${comma}Get your Lightning shield at Zalkon.`;
      comma = '\n';
    }

    if (
      this.invasionStatus >= InvasionQuestStatus.DaysUntilInvasion._7 &&
      this.invasionStatus <= InvasionQuestStatus.DaysUntilInvasion._1
    ) {
      const whenString =
        this.invasionStatus === InvasionQuestStatus.DaysUntilInvasion._2
          ? 'by end of tomorrow'
          : this.invasionStatus === InvasionQuestStatus.DaysUntilInvasion._1
            ? 'today'
            : `within ${InvasionQuestStatus.ClosedTooLate - this.invasionStatus} days`;
      pLog.log(84);
      questList += `${comma}Inform Gemulon about alien invasion ${whenString}.`;
      comma = '\n';
    } else if (this.invasionStatus === InvasionQuestStatus.ClosedSaved) {
      pLog.log(85);
      questList += `${comma}Get your fuel compactor at Gemulon.`;
      comma = '\n';
    }

    if (
      this.experimentStatus >= ExperimentQuestStatus.DaysRemaining._10 &&
      this.experimentStatus <= ExperimentQuestStatus.DaysRemaining._1
    ) {
      pLog.log(86);
      const whenString =
        this.experimentStatus === ExperimentQuestStatus.DaysRemaining._2
          ? 'by end of tomorrow'
          : this.experimentStatus === ExperimentQuestStatus.DaysRemaining._1
            ? 'today'
            : `within ${ExperimentQuestStatus.ClosedTooLate - this.experimentStatus} days`;
      questList += `${comma}Stop Dr. Fehler's experiment at Daled ${whenString}.`;
      comma = '\n';
    }

    if (
      this.reactorStatus > ReactorQuestStatus.Open &&
      this.reactorStatus < ReactorQuestStatus.ClosedTooLate
    ) {
      questList += `${comma}Deliver the unstable reactor to Nix `;
      if (this.reactorStatus <= ReactorQuestStatus.DaysRemaining._20) {
        pLog.log(87);
        questList += 'for Henry Morgan.';
      } else {
        pLog.log(88);
        questList += 'before it consumes all of its fuel.';
      }
      comma = '\n';
    }

    if (this.jarekStatus === JarekQuestStatus.OnBoard) {
      pLog.log(89);
      questList += `${comma}Bring Ambassador Jarek to Devidia.`;
      comma = '\n';
    }

    if (this.wildStatus === WildQuestStatus.OnBoard) {
      pLog.log(90);
      questList += `${comma}Smuggle Jonathan Wild to Kravat.`;
      comma = '\n';
    }

    if (this.commander.boughtMoon) {
      pLog.log(91);
      questList += `${comma}Claim your moon in Utopia.`;
    }

    if (questList.length === 0) {
      pLog.log(92);
      questList = 'No open quests.';
    }

    return questList;
  }
}
