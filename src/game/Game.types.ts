// How a game ends, and its rare events: the lists the game and the saved-game check share.
import { countOf } from './texts.ts';
import type { ValueOf } from './texts.ts';

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
