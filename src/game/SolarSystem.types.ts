import { named, countOf } from './texts.ts';
import type { ValueOf } from './texts.ts';
import { Utils } from './Utilities.ts';

// Constants
export const MOON_PRICE = 500000;

export const SQR = (x: number) => x * x;

// Enumerations
export const Difficulty = {
  Beginner: 0,
  Easy: 1,
  Normal: 2,
  Hard: 3,
  Absurd: 4,
} as const;
export type Difficulty = ValueOf<typeof Difficulty>;
export const DIFFICULTY_COUNT = countOf(Difficulty);

export const ADJUST_SKILL_FOR_DIFFICULTY = (skill: number, difficulty: number) => {
  Utils.ensureInteger(skill);
  Utils.ensureInteger(difficulty);
  if (difficulty <= Difficulty.Easy) {
    return skill + 1;
  } else if (difficulty == Difficulty.Absurd) {
    return Math.max(2, skill) - 1;
  } else {
    return skill;
  }
};

export const SKILL_BONUS = 3;
export const CLOAK_BONUS = 2;

export const difficultyName = named<Difficulty>(
  {
    [Difficulty.Beginner]: 'Beginner',
    [Difficulty.Easy]: 'Easy',
    [Difficulty.Normal]: 'Normal',
    [Difficulty.Hard]: 'Hard',
    [Difficulty.Absurd]: 'Absurd',
  },
  'Unknown'
);

export const SystemSize = {
  Tiny: 0,
  Small: 1,
  Medium: 2,
  Large: 3,
  Huge: 4,
} as const;
export type SystemSize = ValueOf<typeof SystemSize>;
export const SYSTEM_SIZE_COUNT = countOf(SystemSize);

export const systemSizeName = named<SystemSize>(
  {
    [SystemSize.Tiny]: 'Tiny',
    [SystemSize.Small]: 'Small',
    [SystemSize.Medium]: 'Medium-sized',
    [SystemSize.Large]: 'Large',
    [SystemSize.Huge]: 'Huge',
  },
  'Unknown'
);

// Quest Status Enumerations
export const JaporiQuestStatus = {
  Open: 0,
  HasMedicine: 1,
  Closed: 2,
} as const;
export type JaporiQuestStatus = (typeof JaporiQuestStatus)[keyof typeof JaporiQuestStatus];

export const ScarabQuestStatus = {
  Open: 0,
  ScarabExists: 1,
  ScarabDestroyed: 2,
  Closed: 3,
} as const;
export type ScarabQuestStatus = (typeof ScarabQuestStatus)[keyof typeof ScarabQuestStatus];

export const MonsterQuestStatus = {
  Open: 0,
  MonsterExists: 1,
  ClosedMonsterDestroyed: 2,
} as const;
export type MonsterQuestStatus = (typeof MonsterQuestStatus)[keyof typeof MonsterQuestStatus];

export const DragonflyQuestStatus = {
  Open: 0,
  GoToBaratas: 1,
  GoToMelina: 2,
  GoToRegulas: 3,
  GoToZalkon: 4,
  ClosedDragonflyDestroyed: 5,
} as const;
export type DragonflyQuestStatus = (typeof DragonflyQuestStatus)[keyof typeof DragonflyQuestStatus];

export const InvasionQuestStatus = {
  Open: 0,
  DaysUntilInvasion: {
    _7: 1,
    _6: 2,
    _5: 3,
    _4: 4,
    _3: 5,
    _2: 6,
    _1: 7,
  },
  ClosedTooLate: 8,
  ClosedSaved: 9,
  ClosedRewardClaimed: 10,
} as const;
export type InvasionQuestStatus = number;

export const ExperimentQuestStatus = {
  Open: 0,
  DaysRemaining: {
    _10: 1,
    _9: 2,
    _8: 3,
    _7: 4,
    _6: 5,
    _5: 6,
    _4: 7,
    _3: 8,
    _2: 9,
    _1: 10,
  },
  ClosedTooLate: 11,
  ClosedSaved: 12,
} as const;
export type ExperimentQuestStatus = number;

export const REACTOR_BAY_COUNT = 5;
export const REACTOR_MAX_FUEL = 10;

export const ReactorQuestStatus = {
  Open: 0,
  DaysRemaining: {
    _20: 1,
    _1: 20,
  },
  ClosedTooLate: 21,
  ClosedSaved: 22,
} as const;
export type ReactorQuestStatus = number;

export const JarekQuestStatus = {
  Open: 0,
  OnBoard: 1,
  Closed: 2,
} as const;
export type JarekQuestStatus = (typeof JarekQuestStatus)[keyof typeof JarekQuestStatus];

export const WildQuestStatus = {
  Open: 0,
  OnBoard: 1,
  Closed: 2,
} as const;
export type WildQuestStatus = (typeof WildQuestStatus)[keyof typeof WildQuestStatus];

export const SpecialEvent = {
  None: -1,
  // Fixed locations
  DragonflyDestroyed: 0,
  FlyBaratas: 1,
  FlyMelina: 2,
  FlyRegulas: 3,
  MonsterKilled: 4,
  MedicineDelivery: 5,
  MoonBought: 6,
  ScarabDestroyed: 7,
  ReactorDelivered: 8,
  JarekGetsOut: 9,
  GemulonRescued: 10,
  ExperimentStopped: 11,
  ExperimentNotStopped: 12,
  WildGetsOut: 13,
  // Random locations
  MoonForSale: 14,
  SkillIncrease: 15,
  Tribble: 16,
  EraseRecord: 17,
  BuyTribble: 18,
  SpaceMonster: 19,
  Dragonfly: 20,
  CargoForSale: 21,
  InstallLightningShield: 22,
  JaporiDisease: 23,
  LotteryWinner: 24,
  ArtifactDelivered: 25,
  AlienArtifact: 26,
  AmbassadorJarek: 27,
  AlienInvasion: 28,
  GemulonInvaded: 29,
  GetFuelCompactor: 30,
  Experiment: 31,
  TransportWild: 32,
  GetReactor: 33,
  GetSpecialLaser: 34,
  Scarab: 35,
  GetHullUpgraded: 36,
} as const;
export type SpecialEvent = ValueOf<typeof SpecialEvent>;
