import { countOf } from './texts.ts';
import type { ValueOf } from './texts.ts';
import { Commander } from './Commander.ts';
import type { Recruit } from './Commander.ts';
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

// Everything a game is made of.
type GameFields = {
  uniqueID: string;
  difficulty: number;
  endStatus: number;
  trackedSystem: SolarSystem | null;
  breakingNews: string[] | null;
  canSuperWarp: boolean;
  autoNews: boolean;
  autoRepairs: boolean;
  autoFuel: boolean;
  remindLoans: boolean;
  tribbleMessage: boolean;
  alreadyPaidForNewspaper: boolean;
  alwaysIgnorePirates: boolean;
  alwaysIgnorePolice: boolean;
  alwaysIgnoreTraders: boolean;
  alwaysIgnoreTradeInOrbit: boolean;
  monsterStatus: number;
  dragonflyStatus: number;
  scarabStatus: number;
  japoriQuestStatus: number;
  jarekStatus: number;
  invasionStatus: number;
  experimentStatus: number;
  fabricRipProbability: number;
  wildStatus: number;
  reactorStatus: number;
  commander: Commander;
  monsterHull: number;
  remainingRareEvents: number[];
  solarSystems: SolarSystem[];
  warpSystem: SolarSystem | null;
};

// How every new game starts, apart from what is chosen or drawn.
const NEW_GAME = {
  endStatus: GameEndStatus.None,
  trackedSystem: null,
  breakingNews: null,
  canSuperWarp: false,
  autoNews: false,
  autoRepairs: false,
  autoFuel: false,
  remindLoans: true,
  tribbleMessage: false,
  alreadyPaidForNewspaper: false,
  alwaysIgnorePirates: false,
  alwaysIgnorePolice: false,
  alwaysIgnoreTraders: false,
  alwaysIgnoreTradeInOrbit: false,
  monsterStatus: 0,
  dragonflyStatus: 0,
  scarabStatus: 0,
  japoriQuestStatus: 0,
  jarekStatus: 0,
  invasionStatus: 0,
  experimentStatus: 0,
  fabricRipProbability: 0,
  wildStatus: 0,
  reactorStatus: 0,
} as const;

function generateUniqueID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class Game {
  private _onSave: ((game: Game) => void) | null = null;
  private _onChange: (() => void) | null = null;
  readonly uniqueID: string;
  endStatus: number;
  trackedSystem: SolarSystem | null;
  private _breakingNews: string[] | null;
  canSuperWarp: boolean;
  autoNews: boolean;
  autoRepairs: boolean;
  autoFuel: boolean;
  remindLoans: boolean;
  tribbleMessage: boolean;
  alreadyPaidForNewspaper: boolean;
  alwaysIgnorePirates: boolean;
  alwaysIgnorePolice: boolean;
  alwaysIgnoreTraders: boolean;
  alwaysIgnoreTradeInOrbit: boolean;
  monsterStatus: number;
  dragonflyStatus: number;
  scarabStatus: number;
  japoriQuestStatus: number;
  jarekStatus: number;
  invasionStatus: number;
  experimentStatus: number;
  fabricRipProbability: number;
  wildStatus: number;
  reactorStatus: number;
  readonly commander: Commander;
  difficulty: number;
  monsterHull: number;
  remainingRareEvents: number[];
  readonly solarSystems: SolarSystem[];
  // Where the game started. A saved game keeps it, though no rule reads it.
  private readonly _warpSystem: SolarSystem | null;
  // Set by the cheats panel, read by the old screens.
  forceRareEvent = false;
  showSpecialSystems = false;

  private constructor(fields: GameFields) {
    this.uniqueID = fields.uniqueID;
    this.difficulty = fields.difficulty;
    this.endStatus = fields.endStatus;
    this.trackedSystem = fields.trackedSystem;
    this._breakingNews = fields.breakingNews;
    this.canSuperWarp = fields.canSuperWarp;
    this.autoNews = fields.autoNews;
    this.autoRepairs = fields.autoRepairs;
    this.autoFuel = fields.autoFuel;
    this.remindLoans = fields.remindLoans;
    this.tribbleMessage = fields.tribbleMessage;
    this.alreadyPaidForNewspaper = fields.alreadyPaidForNewspaper;
    this.alwaysIgnorePirates = fields.alwaysIgnorePirates;
    this.alwaysIgnorePolice = fields.alwaysIgnorePolice;
    this.alwaysIgnoreTraders = fields.alwaysIgnoreTraders;
    this.alwaysIgnoreTradeInOrbit = fields.alwaysIgnoreTradeInOrbit;
    this.monsterStatus = fields.monsterStatus;
    this.dragonflyStatus = fields.dragonflyStatus;
    this.scarabStatus = fields.scarabStatus;
    this.japoriQuestStatus = fields.japoriQuestStatus;
    this.jarekStatus = fields.jarekStatus;
    this.invasionStatus = fields.invasionStatus;
    this.experimentStatus = fields.experimentStatus;
    this.fabricRipProbability = fields.fabricRipProbability;
    this.wildStatus = fields.wildStatus;
    this.reactorStatus = fields.reactorStatus;
    this.commander = fields.commander;
    this.monsterHull = fields.monsterHull;
    this.remainingRareEvents = fields.remainingRareEvents;
    this.solarSystems = fields.solarSystems;
    this._warpSystem = fields.warpSystem;
  }

  // A new game: the galaxy, its special events and mercenaries, and the commander, drawn at
  // random in that order.
  static create(difficulty: number, recruit: Recruit): Game {
    const uniqueID = generateUniqueID();
    const solarSystems = Game._populateSolarSystems(difficulty);
    Game._setupEventsAndMercenaries(solarSystems);
    const commander = Game._setupCommander(recruit, difficulty, solarSystems);
    const remainingRareEvents = [
      ...Array.from({ length: RARE_EVENT_COUNT }, (_, rareEvent) => rareEvent),
      // Some extra skill enhancements
      ...[RareEvent.BottleGood, RareEvent.BottleGood, RareEvent.BottleOld, RareEvent.BottleOld],
    ];
    const warpSystem = commander.currentSystem;
    const monsterHull = shipModelForType(ShipModelType.SpaceMonster).hullStrength;
    if (difficulty < Difficulty.Normal) {
      if (commander.currentSystem.specialEvent === SpecialEvent.None) {
        pLog.log(109);
        commander.currentSystem.specialEvent = SpecialEvent.LotteryWinner;
      }
    }
    return new Game({
      ...NEW_GAME,
      uniqueID,
      difficulty,
      commander,
      solarSystems,
      remainingRareEvents,
      warpSystem,
      monsterHull,
    });
  }

  // A game from a saved game, as parseSavedGame checked it, with its wormholes linked.
  static load(state: GameState): Game {
    const breakingNews = Game.savedNews(state.breakingNews);
    const solarSystems = state.solarSystems.map(ss => SolarSystem.load(ss));
    solarSystems.forEach((solarSystem, idx) => {
      const wormholeName = state.solarSystems[idx].wormholeName;
      solarSystem.wormhole = SolarSystem.solarSystemForName(wormholeName, solarSystems);
    });
    const find = (name?: string) => SolarSystem.solarSystemForName(name, solarSystems);
    return new Game({
      ...Game.savedValues(state),
      breakingNews,
      remainingRareEvents: [...state.remainingRareEvents],
      solarSystems,
      warpSystem: find(state.warpSystemName),
      trackedSystem: find(state.trackedSystemName),
      commander: Commander.restore(state.commander, solarSystems, state.difficulty),
      uniqueID: state.uniqueID || generateUniqueID(),
    });
  }

  private static savedNews(breakingNews: string[] | undefined): string[] | null {
    if (breakingNews) {
      pLog.log(71);
      return [...breakingNews];
    }
    pLog.log(72);
    return null;
  }

  // The values a saved game keeps as they are.
  private static savedValues(state: GameState) {
    return {
      monsterStatus: state.monsterStatus,
      dragonflyStatus: state.dragonflyStatus,
      scarabStatus: state.scarabStatus,
      japoriQuestStatus: state.japoriQuestStatus,
      jarekStatus: state.jarekStatus,
      invasionStatus: state.invasionStatus,
      experimentStatus: state.experimentStatus,
      fabricRipProbability: state.fabricRipProbability,
      wildStatus: state.wildStatus,
      reactorStatus: state.reactorStatus,
      difficulty: state.difficulty,
      endStatus: state.endStatus,
      monsterHull: state.monsterHull,
      remindLoans: state.remindLoans,
      tribbleMessage: state.tribbleMessage,
      alreadyPaidForNewspaper: state.alreadyPaidForNewspaper,
      alwaysIgnorePirates: state.alwaysIgnorePirates,
      alwaysIgnorePolice: state.alwaysIgnorePolice,
      alwaysIgnoreTraders: state.alwaysIgnoreTraders,
      alwaysIgnoreTradeInOrbit: state.alwaysIgnoreTradeInOrbit,
      autoFuel: state.autoFuel,
      autoRepairs: state.autoRepairs,
      autoNews: state.autoNews,
      canSuperWarp: state.canSuperWarp,
    };
  }

  toState() {
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

    ensureInteger(this.endStatus);
    state.endStatus = this.endStatus;

    ensureInteger(this.monsterHull);
    state.monsterHull = this.monsterHull;

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

    ensureObjectOrNull(this.trackedSystem);
    if (this.trackedSystem) {
      ensureType(this.trackedSystem.name, 'string');
      state.trackedSystemName = this.trackedSystem.name;
      pLog.log(74);
    }

    ensureType(this.uniqueID, 'string');
    state.uniqueID = this.uniqueID;

    ensureArrayOrNull(this.remainingRareEvents, 'number');
    if (this.remainingRareEvents) {
      state.remainingRareEvents = [...this.remainingRareEvents];
      pLog.log(75);
    }

    ensureArrayOrNull(this.solarSystems, 'object');
    state.solarSystems = this.solarSystems.map(solarSystem => solarSystem.toState());

    state.lastSave = new Date();
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

    if (this.endStatus === GameEndStatus.Killed) {
      score = (this.difficulty + 1) * ((adjustedWorth * 90) / 50000);
    } else if (this.endStatus === GameEndStatus.Retired) {
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

  private static _populateSolarSystems(difficulty: number): SolarSystem[] {
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
      const solarSystem = SolarSystem.create(solarSystemNames[randomNameIndex], x, y, difficulty);
      solarSystemNames.splice(randomNameIndex, 1);

      solarSystems.push(solarSystem);

      i++;
    }

    // Wormholes go in a loop
    const wormholeSystems = solarSystems.slice(0, WORMHOLE_COUNT);
    const randomWormholeSystems = [];
    while (wormholeSystems.length > 0) {
      const randomIndex = runtime.gameRand.randomIntBelow(wormholeSystems.length);
      randomWormholeSystems.push(wormholeSystems[randomIndex]);
      wormholeSystems.splice(randomIndex, 1);
    }

    for (let i = 0; i < WORMHOLE_COUNT - 1; ++i) {
      randomWormholeSystems[i].wormhole = randomWormholeSystems[i + 1];
    }
    randomWormholeSystems[WORMHOLE_COUNT - 1].wormhole = randomWormholeSystems[0];
    return solarSystems;
  }

  private static _setupEventsAndMercenaries(solarSystems: SolarSystem[]) {
    // Setup special events and any hard-coded mercenaries
    const find = (name: string) => SolarSystem.solarSystemForName(name, solarSystems);

    const eventsToPlace = randomOccurrenceEventTypes();

    const kravat = find('Kravat')!;
    kravat.specialEvent = SpecialEvent.WildGetsOut;

    find('Acamar')!.specialEvent = SpecialEvent.MonsterKilled;
    find('Baratas')!.specialEvent = SpecialEvent.FlyBaratas;
    find('Melina')!.specialEvent = SpecialEvent.FlyMelina;
    find('Regulas')!.specialEvent = SpecialEvent.FlyRegulas;
    find('Zalkon')!.specialEvent = SpecialEvent.DragonflyDestroyed;
    find('Japori')!.specialEvent = SpecialEvent.MedicineDelivery;
    find('Utopia')!.specialEvent = SpecialEvent.MoonBought;
    find('Devidia')!.specialEvent = SpecialEvent.JarekGetsOut;

    const gemulon = find('Gemulon')!;
    gemulon.specialEvent = SpecialEvent.GemulonRescued;
    // Perform search in reverse to prefer systems without wormholes
    const solarSystemsReversed = solarSystems.slice().reverse();
    nearestFreeSystem(gemulon, solarSystemsReversed)!.specialEvent = SpecialEvent.AlienInvasion;

    const daled = find('Daled')!;
    daled.specialEvent = SpecialEvent.ExperimentStopped;
    nearestFreeSystem(daled, solarSystemsReversed)!.specialEvent = SpecialEvent.Experiment;

    const nix = find('Nix')!;
    nix.specialEvent = SpecialEvent.ReactorDelivered;
    nearestFreeSystem(nix, solarSystemsReversed)!.specialEvent = SpecialEvent.GetReactor;

    const wormholeSystemsSpecial = solarSystems.slice(0, WORMHOLE_COUNT);
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
      Game._placeMercenary(solarSystems, names[i], runtime.gameRand);
    }

    // The last one draws from a generator of his own, seeded by where the systems lie, so
    // that every other number of a recorded game stays where it was.
    const seed = solarSystems.reduce((sum, system) => sum + system.x + system.y, 0);
    Game._placeMercenary(solarSystems, names[MERCENARY_COUNT - 1], new GameRand(seed));
  }

  private static _placeMercenary(solarSystems: SolarSystem[], name: string, rand: GameRand) {
    let mercenarySystem = null;
    while (!mercenarySystem) {
      mercenarySystem = solarSystems[rand.randomIntBelow(solarSystems.length)];
      if (mercenarySystem.mercenary) mercenarySystem = null;
    }

    const mercenary = CrewMember.create(name);
    mercenary.randomizeAttributes(rand);
    mercenarySystem.mercenary = mercenary;
  }

  private static _setupCommander(
    recruit: Recruit,
    difficulty: number,
    solarSystems: SolarSystem[]
  ): Commander {
    const commander = Commander.enlist(recruit, {
      difficulty,
      credits: STARTING_CREDITS,
      ship: Ship.create(ShipModelType.Gnat),
      system: solarSystems[solarSystems.length - 1],
    });

    let squaredFuel = commander.ship.fuel;
    squaredFuel *= squaredFuel;

    const inRangeOf = (system: SolarSystem) =>
      solarSystems.filter(other => system.squaredDistanceTo(other) <= squaredFuel);
    const startSystem = solarSystems.findLast(
      system =>
        system.specialEvent === SpecialEvent.None &&
        system.techLevel >= TechLevel.Agricultural &&
        system.techLevel < TechLevel.PostIndustrial &&
        inRangeOf(system).length >= 3
    );
    if (startSystem) {
      commander.currentSystem.visited = false;
      commander.moveTo(startSystem);
    }
    return commander;
  }

  _findSolarSystem(name: string | undefined) {
    return SolarSystem.solarSystemForName(name, this.solarSystems);
  }

  solarSystemsWithinRange() {
    const current = this.commander.currentSystem;
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

  removeRemainingRareEvent(rareEvent: number) {
    ensureInteger(rareEvent);

    const index = this.remainingRareEvents.indexOf(rareEvent);
    if (index !== -1) {
      this.remainingRareEvents.splice(index, 1);
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

    this.commander.timePassed(days, this.difficulty);

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
        gemulon.updateInventories(this.difficulty);
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

  healMonster() {
    this.monsterHull = Math.min(
      shipModelForType(ShipModelType.SpaceMonster).hullStrength,
      Math.floor((this.monsterHull * 105) / 100)
    );
    ensureInteger(this.monsterHull);
    pLog.log(142);
  }

  shuffleStatus() {
    this.solarSystems.forEach(solarSystem => solarSystem.randomizeStatus());
  }

  updateInventories() {
    this.solarSystems.forEach(solarSystem => solarSystem.updateInventories(this.difficulty));
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
