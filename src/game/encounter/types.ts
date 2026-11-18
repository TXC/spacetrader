// The kinds of encounter, the tests on them, and what an encounter tells its owner.
export const EncounterType = {
  None: 0,

  PoliceInspection: 1,
  PoliceIgnore: 2,
  PoliceAttack: 3,
  PoliceFlee: 4,

  PoliceStart: 1,
  PoliceEnd: 4,

  PirateIgnore: 5,
  PirateAttack: 6,
  PirateFlee: 7,
  PirateSurrender: 8,

  PirateStart: 5,
  PirateEnd: 8,

  TraderIgnore: 9,
  TraderAttack: 10,
  TraderFlee: 11,
  TraderSurrender: 12,
  TraderSell: 13,
  TraderBuy: 14,
  TraderNoTrade: 15,

  TraderStart: 9,
  TraderEnd: 15,

  FamousCaptainAhabEncounter: 16,
  FamousCaptainAhabAttack: 17,
  FamousCaptainConradEncounter: 18,
  FamousCaptainConradAttack: 19,
  FamousCaptainHuieEncounter: 20,
  FamousCaptainHuieAttack: 21,

  FamousCaptainStart: 16,
  FamousCaptainEnd: 21,

  MarieCelesteEncounter: 22,
  PostMarieCelestePoliceEncounter: 23,

  BottleGood: 24,
  BottleOld: 25,

  ScarabIgnore: 26,
  ScarabAttack: 27,

  ScarabStart: 26,
  ScarabEnd: 27,

  MonsterIgnore: 28,
  MonsterAttack: 29,

  MonsterStart: 28,
  MonsterEnd: 29,

  DragonflyIgnore: 30,
  DragonflyAttack: 31,

  DragonflyStart: 30,
  DragonflyEnd: 31,
} as const;
export type EncounterType = number;

// The kinds of opponent that own a range of encounter types.
type EncounterFamily = {
  [K in keyof typeof EncounterType]: K extends `${infer Family}Start` ? Family : never;
}[keyof typeof EncounterType];

// Array.includes would refuse a plain number once the lists hold exact values.
export const isOneOf = (value: number, ...options: number[]) => options.includes(value);

export const isEncounterWith = (type: number, family: EncounterFamily) =>
  type >= EncounterType[`${family}Start`] && type <= EncounterType[`${family}End`];

// Update these with the other attack/ignore/flee types when they're added:
export const isFleeEncounter = (type: number) =>
  isOneOf(type, EncounterType.PoliceFlee, EncounterType.PirateFlee, EncounterType.TraderFlee);

export const isAttackEncounter = (type: number) =>
  isOneOf(
    type,
    EncounterType.PoliceAttack,
    EncounterType.PirateAttack,
    EncounterType.TraderAttack,
    EncounterType.FamousCaptainAhabAttack,
    EncounterType.FamousCaptainConradAttack,
    EncounterType.FamousCaptainHuieAttack,
    EncounterType.ScarabAttack,
    EncounterType.MonsterAttack,
    EncounterType.DragonflyAttack
  );

export const isIgnoreEncounter = (type: number) =>
  isOneOf(
    type,
    EncounterType.PoliceIgnore,
    EncounterType.PirateIgnore,
    EncounterType.TraderIgnore,
    EncounterType.ScarabIgnore,
    EncounterType.MonsterIgnore,
    EncounterType.DragonflyIgnore
  );

export const isSurrenderEncounter = (type: number) =>
  isOneOf(type, EncounterType.PirateSurrender, EncounterType.TraderSurrender);

export const famousCaptainAttackType = (type: number) =>
  isAttackEncounter(type) ? type : type + 1;

export const EncounterMode = {
  Manual: 0,
  AutoAttack: 1,
  AutoFlee: 2,
} as const;
export type EncounterMode = number;

export const isAutoMode = (encounterMode: number) =>
  isOneOf(encounterMode, EncounterMode.AutoAttack, EncounterMode.AutoFlee);

// What the owner of an encounter, the trip, is told about it.
export type EncounterListener = {
  continues(fightGoesOn: boolean): void;
  plundered(anythingTaken: boolean): void;
  hullChanged(): void;
  buttonsChanged(): void;
  arrested(): void;
  destroyed(): void;
};
