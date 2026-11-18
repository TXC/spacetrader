import { ensureArrayOrNull, ensureBool, ensureInteger, ensureType } from './ensure.ts';
import { runtime } from './runtime.ts';

import type { CrewMemberState } from './savedGame.ts';
export type { CrewMemberState };

export class CrewMember {
  declare static _sNames: string[] | undefined;
  declare name: string | null;
  declare engineer: number;
  declare pilot: number;
  declare fighter: number;
  declare trader: number;
  declare _forQuest: boolean;
  declare carriesMaxTraderBoost: boolean;
  declare freeMercenaryCost: boolean;

  static mercenaryNames() {
    if (!this._sNames) {
      this._sNames = [
        'Alyssa',
        'Armatur',
        'Bentos',
        'C2U2',
        "Chi'Ti",
        'Crystal',
        'Dane',
        'Deirdre',
        'Doc',
        'Draco',
        'Iranda',
        'Jeremiah',
        'Jujubal',
        'Krydon',
        'Luis',
        'Mercedez',
        'Milete',
        'Muri-L',
        'Mystyc',
        'Nandi',
        'Orestes',
        'Pancho',
        'PS37',
        'Quarck',
        'Sosumi',
        'Uma',
        'Wesley',
        'Wonton',
        'Xiaoying',
        'Yorvick',
      ];
    }
    return this._sNames;
  }

  constructor(
    name: string | null,
    engineer: number = 0,
    pilot: number = 0,
    fighter: number = 0,
    trader: number = 0
  ) {
    ensureType(name, 'string');
    this.name = name || null;

    ensureArrayOrNull([engineer, pilot, fighter, trader], 'number');

    this.engineer = engineer;
    this.pilot = pilot;
    this.fighter = fighter;
    this.trader = trader;
    this._forQuest = false;
    this.carriesMaxTraderBoost = false;
    this.freeMercenaryCost = false;
  }

  updateWithSerializedState(serializedState: CrewMemberState) {
    this.name = serializedState.name || null;
    this.engineer = serializedState.engineer;
    this.pilot = serializedState.pilot;
    this.fighter = serializedState.fighter;
    this.trader = serializedState.trader;

    this._forQuest = serializedState.forQuest;
    this.carriesMaxTraderBoost = serializedState.carriesMaxTraderBoost;
    this.freeMercenaryCost = serializedState.freeMercenaryCost;
  }

  // A new crew member, with no quest and no bonuses.
  static create(name: string, engineer = 0, pilot = 0, fighter = 0, trader = 0): CrewMember {
    return new CrewMember(name, engineer, pilot, fighter, trader);
  }

  // A crew member from a saved game, as parseSavedGame checked it.
  static load(state: CrewMemberState): CrewMember {
    return CrewMember.fromSerializedState(state);
  }

  static fromSerializedState(serializedState: CrewMemberState) {
    const crewMember = new CrewMember(serializedState.name);
    crewMember.updateWithSerializedState(serializedState);
    return crewMember;
  }

  randomizeAttributes(rand = runtime.gameRand) {
    const randomSkill = () => rand.randomIntBelow(5) + rand.randomIntBelow(6) + 1;
    this.pilot = randomSkill();
    this.fighter = randomSkill();
    this.trader = randomSkill();
    this.engineer = randomSkill();
  }

  get forQuest() {
    return this._forQuest;
  }

  set forQuest(f: boolean) {
    if (ensureBool(f)) {
      this._forQuest = f;
    }
  }

  hirePrice() {
    return this.freeMercenaryCost
      ? 0
      : (this.pilot + this.fighter + this.trader + this.engineer) * 3;
  }

  // To prevent ties, sort alphabetically as well (notice the inequalities that use ">=").

  pilotSkillIndex() {
    let index = 0;
    if (this.pilot > this.fighter) index++;
    if (this.pilot >= this.trader) index++;
    if (this.pilot > this.engineer) index++;
    return index;
  }

  fighterSkillIndex() {
    let index = 0;
    if (this.fighter >= this.pilot) index++;
    if (this.fighter >= this.trader) index++;
    if (this.fighter > this.engineer) index++;
    return index;
  }

  engineerSkillIndex() {
    let index = 0;
    if (this.engineer >= this.pilot) index++;
    if (this.engineer >= this.trader) index++;
    if (this.engineer >= this.fighter) index++;
    return index;
  }

  traderSkillIndex() {
    let index = 0;
    if (this.trader > this.pilot) index++;
    if (this.trader > this.engineer) index++;
    if (this.trader > this.fighter) index++;
    return index;
  }

  toState(): CrewMemberState {
    ensureType(this.name, 'string');
    ensureInteger(this.pilot);
    ensureInteger(this.fighter);
    ensureInteger(this.trader);
    ensureInteger(this.engineer);
    ensureBool(this._forQuest);
    ensureBool(this.carriesMaxTraderBoost);
    ensureBool(this.freeMercenaryCost);
    return {
      name: this.name ?? '',
      pilot: this.pilot,
      fighter: this.fighter,
      trader: this.trader,
      engineer: this.engineer,
      forQuest: this._forQuest,
      carriesMaxTraderBoost: this.carriesMaxTraderBoost,
      freeMercenaryCost: this.freeMercenaryCost,
    };
  }
}
