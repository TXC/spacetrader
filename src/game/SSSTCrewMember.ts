import { MAUtils } from './Utilities.ts'
import { runtime } from './runtime.ts'

export type SSSTCrewMemberState = ReturnType<SSSTCrewMember['serializedState']>

export class SSSTCrewMember {
    static declare _sNames: string[] | undefined
    declare name: string | null
    declare engineer: number
    declare pilot: number
    declare fighter: number
    declare trader: number
    declare _forQuest: boolean
    declare carriesMaxTraderBoost: boolean
    declare freeMercenaryCost: boolean

    static mercenaryNames() {
        if (!this._sNames) {
            this._sNames = [
                "Alyssa",
                "Armatur",
                "Bentos",
                "C2U2",
                "Chi'Ti",
                "Crystal",
                "Dane",
                "Deirdre",
                "Doc",
                "Draco",
                "Iranda",
                "Jeremiah",
                "Jujubal",
                "Krydon",
                "Luis",
                "Mercedez",
                "Milete",
                "Muri-L",
                "Mystyc",
                "Nandi",
                "Orestes",
                "Pancho",
                "PS37",
                "Quarck",
                "Sosumi",
                "Uma",
                "Wesley",
                "Wonton",
                "Xiaoying",
                "Yorvick"
            ];
        }
        return this._sNames;
    }

    constructor(name: string | null, engineer: number = 0, pilot: number = 0, fighter: number = 0, trader: number = 0) {
        MAUtils.ensureType(name, "string")
        this.name = name || null;

        MAUtils.ensureArrayOrNull([engineer, pilot, fighter, trader], "number")

        this.engineer = engineer;
        this.pilot = pilot;
        this.fighter = fighter;
        this.trader = trader;
        this._forQuest = false;
        this.carriesMaxTraderBoost = false;
        this.freeMercenaryCost = false;
    }

    updateWithSerializedState(serializedState: SSSTCrewMemberState) {
        this.name = serializedState.name || null;
        this.engineer = serializedState.engineer;
        this.pilot = serializedState.pilot;
        this.fighter = serializedState.fighter;
        this.trader = serializedState.trader;

        this._forQuest = serializedState.forQuest || false;
        this.carriesMaxTraderBoost = serializedState.carriesMaxTraderBoost || false;
        this.freeMercenaryCost = serializedState.freeMercenaryCost || false;
    }

    static fromSerializedState(serializedState: SSSTCrewMemberState) {
        const crewMember = new SSSTCrewMember(serializedState.name);
        crewMember.updateWithSerializedState(serializedState);
        return crewMember;
    }

    randomizeAttributes() {
        const randomSkill = () => runtime.gameRand.randomIntBelow(5) + runtime.gameRand.randomIntBelow(6) + 1;
        this.pilot = randomSkill();
        this.fighter = randomSkill();
        this.trader = randomSkill();
        this.engineer = randomSkill();
    }

    get forQuest() {
        return this._forQuest;
    }

    set forQuest(f: boolean) {
      if (MAUtils.ensureBool(f)) {
        this._forQuest = f;
      }
    }

    hirePrice() {
        return this.freeMercenaryCost ? 0 : ((this.pilot + this.fighter + this.trader + this.engineer) * 3);
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

    serializedState() {
        MAUtils.ensureType(this.name, "string")
        MAUtils.ensureInteger(this.pilot)
        MAUtils.ensureInteger(this.fighter)
        MAUtils.ensureInteger(this.trader)
        MAUtils.ensureInteger(this.engineer)
        MAUtils.ensureBool(this._forQuest)
        MAUtils.ensureBool(this.carriesMaxTraderBoost)
        MAUtils.ensureBool(this.freeMercenaryCost)
        return {
            name: this.name,
            pilot: this.pilot,
            fighter: this.fighter,
            trader: this.trader,
            engineer: this.engineer,
            forQuest: this._forQuest,
            carriesMaxTraderBoost: this.carriesMaxTraderBoost,
            freeMercenaryCost: this.freeMercenaryCost
        };
    }
}
