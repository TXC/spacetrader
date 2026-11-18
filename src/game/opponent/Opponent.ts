import { countOf } from '../texts.ts';
import type { ValueOf } from '../texts.ts';
import { CrewMember } from '../CrewMember.ts';
import { Ship } from '../Ship.ts';
import { ensureInteger, ensureType } from '../ensure.ts';
import type { Game } from '../Game.ts';
import { buildOpponent } from './build.ts';

export const OpponentType = {
  Police: 0,
  Trader: 1,
  Pirate: 2,
  FamousCaptain: 3,
  Scarab: 4,
  Dragonfly: 5,
  Monster: 6,
  MarieCeleste: 7,
  Bottle: 8,
  Mantis: 9,
} as const;
export type OpponentType = ValueOf<typeof OpponentType>;
export const OPPONENT_TYPE_COUNT = countOf(OpponentType);

export class Opponent extends CrewMember {
  declare type: OpponentType;
  declare ship: Ship;

  constructor(
    type: OpponentType,
    engineer: number,
    pilot: number,
    fighter: number,
    trader: number,
    ship: Ship
  ) {
    super(CrewMember.newFields('opponent', engineer, pilot, fighter, trader));
    ensureInteger(type);
    this.type = type;
    ensureType(ship, 'object');
    this.ship = ship;
  }

  // Not called `create`: a subclass's static methods must accept what its base class's
  // accept, and CrewMember.create takes a name.
  static captain(
    type: OpponentType,
    engineer: number,
    pilot: number,
    fighter: number,
    trader: number,
    ship: Ship
  ): Opponent {
    return new Opponent(type, engineer, pilot, fighter, trader, ship);
  }

  static generateOpponentWithType(type: number, game: Game) {
    // shortcut: the trip's dice still give a plain number; drop the cast once they give an OpponentType.
    return buildOpponent(type as OpponentType, game);
  }
}
