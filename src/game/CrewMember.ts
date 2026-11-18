import { ensureBool, ensureInteger, ensureType } from './ensure.ts';
import { runtime } from './runtime.ts';

import type { CrewMemberState } from './savedGame.ts';
export type { CrewMemberState };

// Everything a crew member is made of.
export type CrewMemberFields = {
  name: string | null;
  engineer: number;
  pilot: number;
  fighter: number;
  trader: number;
  forQuest: boolean;
  carriesMaxTraderBoost: boolean;
  freeMercenaryCost: boolean;
};

export class CrewMember {
  private static _sNames: string[] | undefined;
  name: string | null;
  engineer: number;
  pilot: number;
  fighter: number;
  trader: number;
  forQuest: boolean;
  carriesMaxTraderBoost: boolean;
  freeMercenaryCost: boolean;

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

  protected constructor(fields: CrewMemberFields) {
    this.name = fields.name;
    this.engineer = fields.engineer;
    this.pilot = fields.pilot;
    this.fighter = fields.fighter;
    this.trader = fields.trader;
    this.forQuest = fields.forQuest;
    this.carriesMaxTraderBoost = fields.carriesMaxTraderBoost;
    this.freeMercenaryCost = fields.freeMercenaryCost;
  }

  // A new crew member's fields: the given skills, no quest and no bonuses.
  protected static newFields(
    name: string,
    engineer: number,
    pilot: number,
    fighter: number,
    trader: number
  ): CrewMemberFields {
    return {
      name: name || null,
      engineer,
      pilot,
      fighter,
      trader,
      forQuest: false,
      carriesMaxTraderBoost: false,
      freeMercenaryCost: false,
    };
  }

  // `this` is typed so that Commander.create and Opponent.create, which would make a plain
  // crew member, do not compile: their private constructors make them a different kind.
  static create(
    this: typeof CrewMember,
    name: string,
    engineer = 0,
    pilot = 0,
    fighter = 0,
    trader = 0
  ): CrewMember {
    return new CrewMember(CrewMember.newFields(name, engineer, pilot, fighter, trader));
  }

  // A crew member from a saved game, as parseSavedGame checked it.
  static load(this: typeof CrewMember, state: CrewMemberState): CrewMember {
    return new CrewMember({
      name: state.name || null,
      engineer: state.engineer,
      pilot: state.pilot,
      fighter: state.fighter,
      trader: state.trader,
      forQuest: state.forQuest,
      carriesMaxTraderBoost: state.carriesMaxTraderBoost,
      freeMercenaryCost: state.freeMercenaryCost,
    });
  }

  randomizeAttributes(rand = runtime.gameRand) {
    const randomSkill = () => rand.randomIntBelow(5) + rand.randomIntBelow(6) + 1;
    this.pilot = randomSkill();
    this.fighter = randomSkill();
    this.trader = randomSkill();
    this.engineer = randomSkill();
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
    ensureBool(this.forQuest);
    ensureBool(this.carriesMaxTraderBoost);
    ensureBool(this.freeMercenaryCost);
    return {
      name: this.name ?? '',
      pilot: this.pilot,
      fighter: this.fighter,
      trader: this.trader,
      engineer: this.engineer,
      forQuest: this.forQuest,
      carriesMaxTraderBoost: this.carriesMaxTraderBoost,
      freeMercenaryCost: this.freeMercenaryCost,
    };
  }
}
